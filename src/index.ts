import * as dotenv from 'dotenv';
import { 
  sendCarousel, 
  sendAdaptiveCarousel,  // ⬅️ NOVA FUNÇÃO
  type CarouselCard, 
  prepareLocalImage 
} from './interactive-messages';
//import { sendCarousel, type CarouselCard, prepareLocalImage } from './interactive-messages';
dotenv.config();

import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  proto,
} from 'whaileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import QRCode from 'qrcode';
import express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import axios from "axios";

// 🔥 IMPORTA SISTEMA DE HISTÓRICO
import {
  logUserMessage,
  logBotMessage,
  getAllHistories,
  loadChatHistory,
  getConversationStats,
  searchInHistory,
  exportHistoryToMarkdown,
  formatHistoryForAI,
} from './chat-history';

const authDir = path.join(__dirname, '../auth');
if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

let sock: WASocket | null = null;

let qrCodeData: string | null = null;
let connectionStatus: string = 'Aguardando conexão...';
let botStartTime: number = Date.now();
const app = express();
const PORT = 8001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* -------------------------
   SERVIDOR HTTP
------------------------- */

app.get('/', (req, res) => {
  const htmlPath = path.join(__dirname, '../qrcode-smart.html');
  
  if (fs.existsSync(htmlPath)) {
    res.sendFile(htmlPath);
  } else {
    res.status(404).send('Arquivo dashboard.html não encontrado');
  }
});

app.get('/api/status', (req, res) => {
  res.json({
    qrCode: qrCodeData,
    status: connectionStatus,
    startTime: botStartTime,
    timestamp: new Date().toISOString()
  });
});

/* -------------------------
   APIS LEADS
------------------------- */

app.get('/api/leads', (req, res) => {
  try {
    const leadsDir = path.join(process.cwd(), 'src', 'leads');
    
    if (!fs.existsSync(leadsDir)) {
      return res.json([]);
    }

    const files = fs.readdirSync(leadsDir).filter(f => f.endsWith('.json'));
    const leads = files.map(file => {
      const filePath = path.join(leadsDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      return data;
    });

    leads.sort((a, b) => {
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
    });

    res.json(leads);
  } catch (error) {
    console.error('Erro ao buscar leads:', error);
    res.status(500).json({ error: 'Erro ao buscar leads' });
  }
});

app.get('/api/leads/:number', (req, res) => {
  try {
    const { number } = req.params;
    const filePath = path.join(process.cwd(), 'src', 'leads', `${number}.json`);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar lead:', error);
    res.status(500).json({ error: 'Erro ao buscar lead' });
  }
});

app.post('/api/send-message', async (req, res) => {
  try {
    const { number, message } = req.body;

    if (!sock) {
      return res.status(503).json({ error: 'Bot não conectado' });
    }

    const remoteJid = `${number}@s.whatsapp.net`;
    await sock.sendMessage(remoteJid, { text: message });

    logInfo(`📤 Mensagem enviada via dashboard para ${number}`);
    res.json({ success: true, message: 'Mensagem enviada' });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

app.get('/api/stats', (req, res) => {
  try {
    const leadsDir = path.join(process.cwd(), 'src', 'leads');
    
    if (!fs.existsSync(leadsDir)) {
      return res.json({
        totalLeads: 0,
        totalInteractions: 0,
        devicesDistribution: {},
        topActions: {},
        uptime: Date.now() - botStartTime
      });
    }

    const files = fs.readdirSync(leadsDir).filter(f => f.endsWith('.json'));
    let totalInteractions = 0;
    const devices: any = {};
    const actions: any = {};

    files.forEach(file => {
      const filePath = path.join(leadsDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      
      totalInteractions += data.interactionCount || 0;
      
      const device = data.deviceType || 'UNKNOWN';
      devices[device] = (devices[device] || 0) + 1;
      
      if (data.lastOption) {
        actions[data.lastOption] = (actions[data.lastOption] || 0) + 1;
      }
    });

    res.json({
      totalLeads: files.length,
      totalInteractions,
      devicesDistribution: devices,
      topActions: actions,
      uptime: Date.now() - botStartTime
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

/* -------------------------
   🔥 APIS HISTÓRICO
------------------------- */

app.get('/api/chat-history', (req, res) => {
  try {
    const histories = getAllHistories();
    
    const summary = histories.map(h => ({
      number: h.leadNumber,
      name: h.leadName,
      totalMessages: h.totalMessages,
      lastMessage: h.lastMessageTime,
      lastMessageFormatted: new Date(h.lastMessageTime).toLocaleString('pt-BR'),
      conversationStarted: h.conversationStarted,
    }));

    res.json(summary);
  } catch (error) {
    console.error('❌ Erro ao buscar históricos:', error);
    res.status(500).json({ error: 'Erro ao buscar históricos' });
  }
});

app.get('/api/chat-history/:number', (req, res) => {
  try {
    const { number } = req.params;
    const history = loadChatHistory(number);

    if (!history) {
      return res.status(404).json({ error: 'Histórico não encontrado' });
    }

    res.json(history);
  } catch (error) {
    console.error('❌ Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

app.get('/api/chat-history/:number/stats', (req, res) => {
  try {
    const { number } = req.params;
    const stats = getConversationStats(number);

    res.json(stats);
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

app.get('/api/chat-history/:number/search', (req, res) => {
  try {
    const { number } = req.params;
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Parâmetro "q" é obrigatório' });
    }

    const results = searchInHistory(number, q);

    res.json({
      searchTerm: q,
      totalResults: results.length,
      messages: results,
    });
  } catch (error) {
    console.error('❌ Erro ao buscar mensagens:', error);
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
});

app.get('/api/chat-history/:number/export', (req, res) => {
  try {
    const { number } = req.params;
    const markdown = exportHistoryToMarkdown(number);

    if (!markdown) {
      return res.status(404).json({ error: 'Histórico não encontrado' });
    }

    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="conversa_${number}.md"`);
    res.send(markdown);
  } catch (error) {
    console.error('❌ Erro ao exportar histórico:', error);
    res.status(500).json({ error: 'Erro ao exportar histórico' });
  }
});

app.get('/api/chat-history/:number/ai-format', (req, res) => {
  try {
    const { number } = req.params;
    const formatted = formatHistoryForAI(number);

    res.json({
      number,
      formatted,
      usage: 'Use este texto como contexto para APIs de IA (GPT-4, Claude, etc)',
    });
  } catch (error) {
    console.error('❌ Erro ao formatar para IA:', error);
    res.status(500).json({ error: 'Erro ao formatar para IA' });
  }
});

app.listen(PORT, () => {
  console.log(`\n🌐 ======================================`);
  console.log(`🌐 Servidor HTTP rodando em:`);
  console.log(`🌐 http://localhost:${PORT}`);
  console.log(`🌐 ======================================\n`);
});

/* -------------------------
   FUNÇÕES AUXILIARES
------------------------- */

function nowBR() {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
  );
}

function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.toLowerCase());
}

function getNextBusinessDays(qtd = 5) {
  const days: { title: string; rowId: string }[] = [];
  let date = new Date();

  while (days.length < qtd) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day === 0 || day === 6) continue;

    const iso = date.toISOString().split('T')[0];
    const label = date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
    });

    days.push({
      title: label,
      rowId: `DATA_${iso}`,
    });
  }
  return days;
}

function getAvailableHours() {
  const hours: { title: string; rowId: string }[] = [];
  for (let h = 9; h <= 17; h++) {
    hours.push({
      title: `${h}:00`,
      rowId: `HORA_${h}:00`,
    });
  }
  return hours;
}

function formatDateHuman(dateISO: string, hour: string) {
  const date = new Date(`${dateISO}T${hour}:00`);
  return (
    date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    }) + ` às ${hour}`
  );
}

const leadStates: {
  [key: string]: {
    greeted: boolean;
    inMenu: boolean;
    lastActivity: number;
    lastInactivityNotice?: number | null;
    inactivityLocked?: boolean;
    deviceType?: string;
    step?: string;
    tempData?: Record<string, any>;
  };
} = {};

const INACTIVITY_TIMEOUT = 5 * 60 * 1000;

function logInfo(message: string) {
  console.log(`🪶 [INFO] ${new Date().toLocaleTimeString('pt-BR')} → ${message}`);
}
function logWarn(message: string) {
  console.warn(`⚠️ [WARN] ${new Date().toLocaleTimeString('pt-BR')} → ${message}`);
}
function logError(message: string, err?: any) {
  console.error(`❌ [ERROR] ${new Date().toLocaleTimeString('pt-BR')} → ${message}`);
  if (err) console.error(err);
}

function logChoice(number: string, option: string) {
  try {
    const logsDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

    const logPath = path.join(logsDir, 'choices.log');
    const timestamp = new Date().toLocaleString('pt-BR');
    const line = `[${timestamp}] ${number} escolheu: ${option}\n`;
    fs.appendFileSync(logPath, line);
    console.log(`📝 [CHOICE] ${line.trim()}`);
  } catch (err) {
    logError('Falha ao gravar logChoice', err);
  }
}

function textoBoasVindas(): string {
  return (
    '👋 Olá! Eu sou o *assistente automático da MultSolutions*.\n\n' +
    'Transformamos seu *WhatsApp em uma máquina de vendas 24h* com atendimento organizado, rápido e inteligente.\n\n' +
    'Escolha uma opção abaixo para continuar:'
  );
}

function textoRecursosResumo(): string {
  return (
    '✨ *Principais benefícios da MultSolutions*\n\n' +
    '• Atenda *rápido* e não perca mais vendas por demora nas respostas.\n' +
    '• Centralize *WhatsApp, Instagram, Facebook, site e e-mail* em um só lugar.\n' +
    '• Use *chatbots e automações* para responder 24h por dia.\n' +
    '• Tenha *controle da equipe*, etiquetas, notas internas e relatórios.\n\n' +
    'Veja os detalhes nos cards abaixo 👇'
  );
}

function saveLead(
  remoteJid: string,
  name?: string,
  lastOption?: string,
  deviceType?: string
) {
  try {
    const number = remoteJid.replace(/@s\.whatsapp\.net$/, '');

    const leadsDir = path.resolve(__dirname, '../src/leads');

    if (!fs.existsSync(leadsDir)) {
      fs.mkdirSync(leadsDir, { recursive: true });
    }

    const filePath = path.join(leadsDir, `${number}.json`);

    let lead: any = {};

    if (fs.existsSync(filePath)) {
      lead = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }

    const now = new Date();

    lead.number = lead.number || number;
    lead.name = name || lead.name || 'Não informado';
    lead.source = lead.source || 'WhatsApp';
    lead.deviceType = deviceType || lead.deviceType || 'UNKNOWN';

    lead.joinedAt = lead.joinedAt || now.toISOString();
    lead.lastMessageTime = now.toISOString();
    
    lead.lastMessageFormatted = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    lead.lastOption = lastOption || lead.lastOption || null;
    lead.interactionCount = (lead.interactionCount || 0) + 1;

    fs.writeFileSync(filePath, JSON.stringify(lead, null, 2));

    logInfo(
      `Lead atualizado: ${number} (${lead.name}) • 📱 Device: ${lead.deviceType}`
    );
  } catch (err) {
    logError('Erro ao salvar lead', err);
  }
}

async function sendMenuButtons(remoteJid: string, pushName: string = 'Usuário') {
  if (!sock) throw new Error('Socket não iniciado');
  try {
    const sections = [
      {
        title: 'Principais ações',
        rows: [
          { title: '⚙️ Ver Recursos', rowId: 'VER_RECURSOS', description: 'Conheça os recursos da plataforma' },
          { title: '📊 Simular Plano', rowId: 'SIMULAR_PLANO', description: 'Monte o plano ideal' },
          { title: '🎁 Teste Grátis 30 dias', rowId: 'TESTE_GRATIS', description: 'Comece hoje sem cartão' },
          { title: '👨‍💼 Falar com Atendente', rowId: 'FALAR_ATENDENTE', description: 'Solicitar atendimento humano' },
          { title: '📅 Agendar Demonstração', rowId: 'AGENDAR_DEMO', description: 'Marque uma demonstração personalizada' },
        ],
      },
    ];

    await sock.sendMessage(remoteJid, {
      text: textoBoasVindas(),
      title: 'Suporte MultSolutions',
      footer: 'Escolha abaixo a opção que deseja 👇',
      buttonText: 'Abrir Menu',
      sections,
    } as any);

    // 🔥 REGISTRA NO HISTÓRICO
    logBotMessage(remoteJid, pushName, textoBoasVindas());

    logInfo(`✅ Menu enviado para ${remoteJid}`);
  } catch (err) {
    logError(`Falha ao enviar menu para ${remoteJid}`, err);
  }
}

async function sendAvailableDates(remoteJid: string) {
  await sock!.sendMessage(remoteJid, {
    text: '📅 Escolha uma data disponível:',
    buttonText: 'Selecionar data',
    sections: [
      {
        title: 'Datas (Segunda a Sexta)',
        rows: getNextBusinessDays(5),
      },
    ],
  } as any);
}

async function sendAvailableHours(remoteJid: string) {
  await sock!.sendMessage(remoteJid, {
    text: '⏰ Escolha um horário disponível:',
    buttonText: 'Selecionar horário',
    sections: [
      {
        title: 'Horários (09h às 17h)',
        rows: getAvailableHours(),
      },
    ],
  } as any);
}

async function sendInactivityNotice(remoteJid: string) {
  if (!sock) throw new Error('Socket não iniciado');
  try {
    await sock.sendMessage(remoteJid, {
      text:
        '⏳ Notei que não tivemos nenhuma interação nos últimos minutos.\n\n' +
        'Fico por aqui aguardando 😊\nQuando quiser, é só escolher uma das opções abaixo para continuar 👇',
    });

    const sections = [
      {
        title: 'Volte quando quiser',
        rows: [
          { title: '⚙️ Ver Recursos', rowId: 'VER_RECURSOS', description: 'Conheça os recursos da plataforma' },
          { title: '📊 Simular Plano', rowId: 'SIMULAR_PLANO', description: 'Monte o plano ideal' },
          { title: '🎁 Teste Grátis 30 dias', rowId: 'TESTE_GRATIS', description: 'Comece hoje sem cartão' },
          { title: '👨‍💼 Falar com Atendente', rowId: 'FALAR_ATENDENTE', description: 'Solicitar atendimento humano' },
          { title: '📅 Agendar Demonstração', rowId: 'AGENDAR_DEMO', description: 'Marque uma demonstração personalizada' },
        ],
      },
    ];

    await sock.sendMessage(remoteJid, {
      text: '👇 Aqui está o menu para você continuar quando quiser:',
      title: 'Volte quando quiser 😊',
      footer: 'MultSolutions • Assistente Inteligente',
      buttonText: 'Abrir Menu',
      sections,
    } as any);
  } catch (err) {
    logError(`Erro ao enviar aviso de inatividade para ${remoteJid}`, err);
  }
}

async function sendToN8N(data: any) {
  try {
    const response = await axios.post(
      "https://n8nwebhook.multsolutions.com.br/webhook/bot-atendimento",
      data,
      {
        headers: { "Content-Type": "application/json" },
        timeout: 5000
      }
    );
    
    logInfo(`✅ N8N: ${data.event} enviado com sucesso`);
    return response.data;
  } catch (err: any) {
    logWarn(`⚠️ N8N indisponível (${err.message}) — fluxo continua`);
    return null;
  }
}

async function sendUniversalResourcesCarousel(remoteJid: string, pushName: string = 'Usuário') {
  logInfo(`🎨 Enviando carousel universal para ${remoteJid}`);
  
  // 🔍 Detecta o tipo de dispositivo do lead
  const deviceType = leadStates[remoteJid]?.deviceType || 'ANDROID';
  logInfo(`📱 Dispositivo detectado para envio: ${deviceType}`);
  
  try {
    // Mensagem introdutória
    await sock!.sendMessage(remoteJid, {
      text: textoRecursosResumo()
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    // Prepara imagem (só para Android/Web, iPhone não precisa)
    let imageMessage = null;
    if (deviceType !== 'IPHONE') {
      logInfo(`📸 Preparando imagem para ${deviceType}...`);
      imageMessage = await prepareLocalImage(sock!, 'simular.png');
    }

    // Monta os cards do carousel
    const carouselCards: CarouselCard[] = [
      {
        header: {
          title: '📨 Multicanal Unificado',
          imageMessage: deviceType !== 'IPHONE' ? imageMessage : undefined,
        },
        body:
          'Centralize *WhatsApp, Instagram, Facebook e Site*.\n\n' +
          'Tudo em um único painel. Nunca mais perca uma mensagem!',
        footer: 'MultSolutions',
        buttons: [
          {
            displayText: '🌐 Ver no site',
            urlButton: { url: 'https://multsolutions.com.br/recursos' }
          },
        ],
      },
      {
        header: {
          title: '🤖 Automações & Chatbots',
          imageMessage: deviceType !== 'IPHONE' ? imageMessage : undefined,
        },
        body:
          'Atendimento *24h* com chatbots inteligentes.\n' +
          'Qualificação automática de leads.\n\n' +
          '🎁 *Cupom exclusivo: MULT10*',
        footer: 'MultSolutions',
        buttons: [
          {
            displayText: '📋 Copiar Cupom',
            copyCodeButton: { copyCode: 'MULT10' }
          },
        ],
      },
      {
        header: {
          title: '📊 Relatórios & Controle',
          imageMessage: deviceType !== 'IPHONE' ? imageMessage : undefined,
        },
        body:
          'Métricas completas de atendimento.\n' +
          'Performance da equipe e histórico de conversas.\n\n' +
          'Tome decisões baseadas em dados!',
        footer: 'MultSolutions',
        buttons: [
          {
            displayText: '📞 Ligar Agora',
            callButton: { phoneNumber: '+5521967229853' }
          },
        ],
      },
    ];

    // 🔥 ENVIA CAROUSEL ADAPTATIVO (iPhone = lista, Android/Web = carousel)
    await sendAdaptiveCarousel(
      sock!, 
      remoteJid, 
      carouselCards,
      deviceType as "IPHONE" | "ANDROID" | "WEB"
    );
    
    // 🔥 REGISTRA NO HISTÓRICO
    const historyMessage = deviceType === 'IPHONE' 
      ? '✨ Enviou recursos como lista interativa (iPhone) [3 itens]'
      : '✨ Enviou carousel com recursos da plataforma [3 cards]';
    
    logBotMessage(remoteJid, pushName, historyMessage);
    
    logInfo(`✅ Recursos enviados com sucesso para ${remoteJid} (${deviceType})`);
    
  } catch (error) {
    logError('❌ Erro ao enviar recursos, usando fallback', error);
    
    // 🆘 Fallback: Menu simples de botões (funciona em todos dispositivos)
    await sock!.sendMessage(remoteJid, {
      text: textoRecursosResumo(),
      buttonText: 'Ver Recursos',
      sections: [
        {
          title: 'Recursos Disponíveis',
          rows: [
            { title: '📨 Multicanal', rowId: 'RECURSO_MULTICANAL', description: 'WhatsApp, Instagram, Facebook' },
            { title: '🤖 Automações', rowId: 'RECURSO_AUTOMACAO', description: 'Chatbots 24h' },
            { title: '📊 Relatórios', rowId: 'RECURSO_RELATORIOS', description: 'Métricas e controle' },
            { title: '🔙 Menu', rowId: 'MENU', description: 'Voltar ao menu' }
          ]
        }
      ]
    } as any);
    
    logBotMessage(remoteJid, pushName, 'Enviou menu de recursos (fallback)');
  }
}

function extractCommand(msg: proto.IWebMessageInfo): string | null {
  if (msg.message?.conversation) {
    return msg.message.conversation.trim();
  }

  if (msg.message?.extendedTextMessage?.text) {
    return msg.message.extendedTextMessage.text.trim();
  }

  if ((msg.message as any)?.listResponseMessage?.singleSelectReply?.selectedRowId) {
    return (msg.message as any).listResponseMessage.singleSelectReply.selectedRowId;
  }

  if ((msg.message as any)?.buttonsResponseMessage?.selectedButtonId) {
    return (msg.message as any).buttonsResponseMessage.selectedButtonId;
  }

  const templateButton = (msg.message as any)?.templateButtonReplyMessage;
  if (templateButton?.selectedId) {
    return templateButton.selectedId;
  }

  if ((msg.message as any)?.interactiveResponseMessage) {
    const nativeFlow = (msg.message as any).interactiveResponseMessage.nativeFlowResponseMessage;
    if (nativeFlow?.paramsJson) {
      try {
        const parsed = JSON.parse(nativeFlow.paramsJson);
        if (parsed?.id) {
          return parsed.id;
        }
      } catch (err) {
        logError('Erro ao parsear JSON do interactiveResponse', err);
      }
    }
  }

  const nativeFlowDirect = (msg.message as any)?.nativeFlowResponseMessage;
  if (nativeFlowDirect?.paramsJson) {
    try {
      const parsed = JSON.parse(nativeFlowDirect.paramsJson);
      if (parsed?.id) {
        return parsed.id;
      }
    } catch (err) {
      logError('Erro ao parsear nativeFlowResponseMessage', err);
    }
  }

  const listMessage = (msg.message as any)?.listMessage;
  if (listMessage?.selectedRowId) {
    return listMessage.selectedRowId;
  }

  return null;
}

function detectDeviceType(
  msg: proto.IWebMessageInfo
): "IPHONE" | "ANDROID" | "WEB" {
  const m: any = msg.message;

  if (
    m?.interactiveResponseMessage ||
    m?.nativeFlowResponseMessage
  ) {
    return "IPHONE";
  }

  if (
    m?.buttonsResponseMessage ||
    m?.listResponseMessage
  ) {
    return "ANDROID";
  }

  const msgId = msg.key?.id || "";
  if (
    msgId.startsWith("3EB") ||
    msgId.startsWith("BAE") ||
    msgId.length > 25
  ) {
    return "WEB";
  }

  return "ANDROID";
}

async function handleMessage(msg: proto.IWebMessageInfo) {
  try {
    if (!msg.message || !msg.key?.remoteJid) return;

    const remoteJid = msg.key.remoteJid;
    const pushName = msg.pushName || 'Usuário';
    
    // 🔥 REGISTRA MENSAGEM DO USUÁRIO NO HISTÓRICO
    const userMessage = msg.message?.conversation || 
                       msg.message?.extendedTextMessage?.text || 
                       '[Mídia ou botão]';
    
    logUserMessage(remoteJid, pushName, userMessage, {
      deviceType: leadStates[remoteJid]?.deviceType,
    });
    
    sendToN8N({
      event: "MENSAGEM_RECEBIDA",
      numero: remoteJid.replace(/@s\.whatsapp\.net$/, ""),
      nome: pushName,
      mensagem: userMessage,
      horario: new Date().toISOString()
    });

    if (remoteJid.includes('@g.us')) {
      logInfo(`📵 Mensagem ignorada de grupo: ${pushName}`);
      return;
    }
    
    if (msg.key.fromMe) return;

    const deviceType = detectDeviceType(msg);
    leadStates[remoteJid] = leadStates[remoteJid] || {};
    leadStates[remoteJid].deviceType = deviceType;

    logInfo(`📱 Dispositivo detectado: ${deviceType} para ${remoteJid}`);

    saveLead(remoteJid, pushName, undefined, deviceType);

    if (!leadStates[remoteJid]) {
      leadStates[remoteJid] = {
        greeted: false,
        inMenu: false,
        lastActivity: Date.now(),
        lastInactivityNotice: null,
        deviceType,
      };
    } else {
      leadStates[remoteJid].lastActivity = Date.now();
    }

    const rawCommand = extractCommand(msg);
    
    if (!rawCommand) {
      const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
      if (text) {
        logInfo(`💬 Texto livre recebido: ${text}`);
      }
      return;
    }

    const resolvedCommand = rawCommand.trim();
    logInfo(`🆕 Comando recebido de ${pushName}: ${resolvedCommand}`);

    // MENU GLOBAL
    if (
      resolvedCommand.toUpperCase() === 'MENU' ||
      resolvedCommand.toLowerCase() === 'menu' ||
      resolvedCommand.toLowerCase() === '!menu' ||
      resolvedCommand.toLowerCase() === 'voltar'
    ) {
      logChoice(remoteJid.replace(/@s\.whatsapp\.net$/, ''), 'MENU');
      await sendMenuButtons(remoteJid, pushName);
      saveLead(remoteJid, pushName, 'MENU', leadStates[remoteJid].deviceType);
      return;
    }

    leadStates[remoteJid].lastActivity = Date.now();

    if (leadStates[remoteJid].lastInactivityNotice) {
      delete leadStates[remoteJid].lastInactivityNotice;

      const welcomeBack = '👋 Que bom ter você de volta!\n\nContinuo aqui para te ajudar com o que precisar 😉';
      await sock!.sendMessage(remoteJid, { text: welcomeBack });
      logBotMessage(remoteJid, pushName, welcomeBack);

      await sock!.sendMessage(remoteJid, {
        text: '👇 Aqui está seu menu de retorno:',
        title: 'Voltou! 😊',
        footer: 'MultSolutions • Assistente Inteligente',
        buttonText: 'Abrir Menu',
        sections: [
          {
            title: 'Continue sua navegação',
            rows: [
              { title: '⚙️ Ver Recursos', rowId: 'VER_RECURSOS' },
              { title: '📊 Simular Plano', rowId: 'SIMULAR_PLANO' },
              { title: '🎁 Teste Grátis', rowId: 'TESTE_GRATIS' },
              { title: '👨‍💼 Falar com Atendente', rowId: 'FALAR_ATENDENTE' },
            ],
          },
        ],
      } as any);

      return;
    }

    sendToN8N({
      event: "MENSAGEM_RECEBIDA",
      numero: remoteJid.replace(/@s\.whatsapp\.net$/, ""),
      nome: pushName,
      acao: resolvedCommand,
      tipo:
        (msg.message as any).listResponseMessage ? "LISTA" :
        (msg.message as any).buttonsResponseMessage ? "BOTAO" :
        "TEXTO",
      horario: new Date().toISOString()
    });

    if (!leadStates[remoteJid].greeted) {
      await sendMenuButtons(remoteJid, pushName);
      leadStates[remoteJid].greeted = true;
      leadStates[remoteJid].inMenu = true;
      saveLead(remoteJid, pushName, 'MENU_OPEN', leadStates[remoteJid].deviceType);
      return;
    }

    // RESPOSTAS DOS RECURSOS
    if (resolvedCommand.startsWith('RECURSO_')) {
      logChoice(remoteJid.replace(/@s\.whatsapp\.net$/, ''), resolvedCommand);
      
      let mensagem = '';
      
      if (resolvedCommand === 'RECURSO_MULTICANAL') {
        mensagem = '📨 *Multicanal Unificado*\n\n' +
                   'Centralize *WhatsApp, Instagram, Facebook e Site* em um único painel.\n\n' +
                   '🔗 Saiba mais: https://multsolutions.com.br/recursos';
      } else if (resolvedCommand === 'RECURSO_AUTOMACAO') {
        mensagem = '🤖 *Automações & Chatbots*\n\n' +
                   'Atendimento 24h com chatbots inteligentes e qualificação automática de leads.\n\n' +
                   '🎁 *Use o cupom MULT10 para desconto!*';
      } else if (resolvedCommand === 'RECURSO_RELATORIOS') {
        mensagem = '📊 *Relatórios & Controle*\n\n' +
                   'Métricas de atendimento, performance da equipe e histórico completo.\n\n' +
                   '📞 Quer saber mais? Ligue: +55 21 96722-9853';
      }
      
      if (mensagem) {
        await sock!.sendMessage(remoteJid, { text: mensagem });
        logBotMessage(remoteJid, pushName, mensagem);
        
        setTimeout(async () => {
          await sock!.sendMessage(remoteJid, {
            text: 'Quer conhecer mais algum recurso ou voltar ao menu?',
            buttonText: 'Escolher',
            sections: [
              {
                title: 'Próximos passos',
                rows: [
                  { title: '🔙 Voltar ao Menu', rowId: 'MENU' },
                  { title: '📊 Simular Plano', rowId: 'SIMULAR_PLANO' },
                  { title: '🎁 Teste Grátis', rowId: 'TESTE_GRATIS' },
                  { title: '👨‍💼 Falar com Atendente', rowId: 'FALAR_ATENDENTE' }
                ]
              }
            ]
          } as any);
        }, 1500);
      }
      
      saveLead(remoteJid, pushName, resolvedCommand, leadStates[remoteJid].deviceType);
      return;
    }

    if (leadStates[remoteJid]?.step?.startsWith('AGENDAR_')) {
      const step = leadStates[remoteJid].step;
      const temp = leadStates[remoteJid].tempData || {};

      if (step === 'AGENDAR_NOME') {
        temp.nome = resolvedCommand;
        leadStates[remoteJid].step = 'AGENDAR_EMAIL';

        const askEmail = '📧 Qual é o seu e-mail?';
        await sock!.sendMessage(remoteJid, { text: askEmail });
        logBotMessage(remoteJid, pushName, askEmail);

        leadStates[remoteJid].tempData = temp;
        return;
      }

      if (step === 'AGENDAR_EMAIL') {
        if (!isValidEmail(resolvedCommand)) {
          const invalidEmail = '❌ E-mail inválido.\n\nExemplo válido:\nnome@gmail.com';
          await sock!.sendMessage(remoteJid, { text: invalidEmail });
          logBotMessage(remoteJid, pushName, invalidEmail);
          return;
        }

        temp.email = resolvedCommand;
        leadStates[remoteJid].step = 'AGENDAR_DATA';

        await sendAvailableDates(remoteJid);
        logBotMessage(remoteJid, pushName, '📅 Enviou lista de datas disponíveis');

        leadStates[remoteJid].tempData = temp;
        return;
      }

      if (resolvedCommand.startsWith('DATA_')) {
        temp.data = resolvedCommand.replace('DATA_', '');
        leadStates[remoteJid].step = 'AGENDAR_HORA';

        await sendAvailableHours(remoteJid);
        logBotMessage(remoteJid, pushName, '⏰ Enviou lista de horários disponíveis');

        leadStates[remoteJid].tempData = temp;
        return;
      }

      if (resolvedCommand.startsWith('HORA_')) {
        temp.hora = resolvedCommand.replace('HORA_', '');

        const dataHuman = formatDateHuman(temp.data, temp.hora);

        const confirmMsg = 
          `✅ *Agendamento confirmado!*\n\n` +
          `👤 Nome: ${temp.nome}\n` +
          `📧 E-mail: ${temp.email}\n` +
          `📅 Quando: ${dataHuman}\n\n` +
          `Um atendente entrará em contato para confirmar.`;
        
        await sock!.sendMessage(remoteJid, { text: confirmMsg });
        logBotMessage(remoteJid, pushName, confirmMsg);

        sendToN8N({
          event: 'AGENDAMENTO_REALIZADO',
          numero: remoteJid.replace(/@s\.whatsapp\.net$/, ''),
          nome: temp.nome,
          email: temp.email,
          data: temp.data,
          hora: temp.hora,
          data_formatada: dataHuman,
          criado_em: new Date().toISOString(),
        });

        const numeroAtendente = '558584460424@s.whatsapp.net';
        const msgAtendente =
          `📅 *Novo agendamento recebido!*\n\n` +
          `👤 Nome: ${temp.nome}\n` +
          `📧 E-mail: ${temp.email}\n` +
          `📅 Data: ${temp.data}\n` +
          `⏰ Hora: ${temp.hora}\n\n` +
          `📱 Cliente: ${remoteJid.replace(/@s\.whatsapp\.net$/, '')}`;

        await sock!.sendMessage(numeroAtendente, { text: msgAtendente });

        leadStates[remoteJid].step = '';
        leadStates[remoteJid].tempData = {};
        return;
      }

      return;
    }

    switch (resolvedCommand.toUpperCase()) {
      case 'AGENDAR_DEMO':
      case 'LINK_RECURSOS':
        logChoice(remoteJid.replace(/@s\.whatsapp\.net$/, ''), resolvedCommand);
        leadStates[remoteJid].step = 'AGENDAR_NOME';
        leadStates[remoteJid].tempData = {};
        
        const askName = '📅 Vamos agendar sua demonstração!\n\nPor favor, me informe seu *nome completo*:';
        await sock!.sendMessage(remoteJid, { text: askName });
        logBotMessage(remoteJid, pushName, askName);
        break;

      case 'VER_RECURSOS':
        logChoice(remoteJid.replace(/@s\.whatsapp\.net$/, ''), 'VER_RECURSOS');
        await sendUniversalResourcesCarousel(remoteJid, pushName);
        saveLead(remoteJid, pushName, 'VER_RECURSOS', leadStates[remoteJid].deviceType);
        break;

      case 'SIMULAR_PLANO': {
        logChoice(remoteJid.replace(/@s\.whatsapp\.net$/, ''), 'SIMULAR_PLANO');

        await sock!.sendMessage(remoteJid, {
          image: { url: path.join(__dirname, '../simular.png') },
          caption: '🧮 Monte o *plano ideal* para sua empresa!',
        });

        await sock!.relayMessage(
          remoteJid,
          {
            interactiveMessage: {
              body: { text: '👇 Escolha uma opção:' },
              footer: { text: 'MultSolutions Automação' },
              nativeFlowMessage: {
                buttons: [
                  {
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                      display_text: '🧮 Acessar Simulador',
                      url: 'https://multsolutions.com.br/planos',
                      merchant_url: 'https://multsolutions.com.br/planos',
                    }),
                  },
                  {
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({
                      display_text: '🔙 Voltar ao Menu',
                      id: 'MENU',
                    }),
                  },
                ],
              },
            },
          },
          {}
        );

        logBotMessage(remoteJid, pushName, '🧮 Enviou simulador de planos com botões interativos');
        saveLead(remoteJid, pushName, 'SIMULAR_PLANO', leadStates[remoteJid].deviceType);
        break;
      }

      case 'TESTE_GRATIS': {
        logChoice(remoteJid.replace(/@s\.whatsapp\.net$/, ''), 'TESTE_GRATIS');
        
        const testeMsg = '🎁 Ative seu *teste grátis de 30 dias* agora!\n👉 https://multsolutions.com.br/teste-gratis';
        await sock!.sendMessage(remoteJid, {
          text: testeMsg,
          footer: 'MultSolutions Automação',
          buttons: [{ buttonId: 'MENU', buttonText: { displayText: '🔙 Menu' }, type: 1 }],
          headerType: 1,
        } as any);
        
        logBotMessage(remoteJid, pushName, testeMsg);
        saveLead(remoteJid, pushName, 'TESTE_GRATIS', leadStates[remoteJid].deviceType);
        break;
      }

      case 'FALAR_ATENDENTE': {
        const number = remoteJid.replace(/@s\.whatsapp\.net$/, '');

        logChoice(number, 'FALAR_ATENDENTE');

        saveLead(
          remoteJid,
          pushName,
          'FALAR_ATENDENTE',
          leadStates[remoteJid]?.deviceType || 'UNKNOWN'
        );

        const leadsDir = path.resolve(__dirname, '../src/leads');
        const filePath = path.join(leadsDir, `${number}.json`);

        let leadInfo: any = {};
        if (fs.existsSync(filePath)) {
          leadInfo = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        }

        const atendenteMsg = '👨‍💼 Um atendente entrará em contato em instantes. Aguarde um momento.';
        await sock!.sendMessage(remoteJid, {
          text: atendenteMsg,
          footer: 'MultSolutions Automação',
          buttons: [
            { buttonId: 'MENU', buttonText: { displayText: '🔙 Voltar ao menu' }, type: 1 },
          ],
          headerType: 1,
        } as any);
        
        logBotMessage(remoteJid, pushName, atendenteMsg);

        const mensagemAtendente =
          `📞 *Novo Lead Solicitando Atendimento:*\n\n` +
          `👤 Nome: ${leadInfo.name || pushName}\n` +
          `📱 Número: ${leadInfo.number || number}\n` +
          `📱 Dispositivo: ${leadInfo.deviceType || 'UNKNOWN'}\n` +
          `🕒 Última interação: ${leadInfo.lastMessageFormatted || 'N/A'}\n` +
          `💬 Última opção: ${leadInfo.lastOption || 'N/A'}\n` +
          `🔁 Interações: ${leadInfo.interactionCount || 0}\n\n` +
          `🧭 Origem: ${leadInfo.source || 'WhatsApp'}\n` +
          `📅 Entrou em: ${
            leadInfo.joinedAt
              ? new Date(leadInfo.joinedAt).toLocaleString('pt-BR')
              : 'N/A'
          }`;

        await sock!.sendMessage('558584460424@s.whatsapp.net', {
          text: mensagemAtendente,
        });

        break;
      }

      default:
        logWarn(`Mensagem desconhecida de ${pushName}: ${resolvedCommand}`);
        break;
    }

  } catch (error) {
    logError('Erro ao manipular mensagem', error);
  }
}

setInterval(async () => {
  const now = Date.now();

  for (const [jid, state] of Object.entries(leadStates)) {
    if (!state.greeted || jid.includes('@g.us')) continue;

    const inativo = now - state.lastActivity > INACTIVITY_TIMEOUT;

    if (state.inactivityLocked) continue;

    if (inativo) {
      logInfo(`⏳ Lead ${jid} inativo → enviando aviso único`);

      await sendInactivityNotice(jid);

      state.lastInactivityNotice = now;
      state.inactivityLocked = true;
    }
  }
}, 60000);

async function startSocket() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    sock = makeWASocket({
      auth: state,
      logger: pino({ level: 'silent' }) as any,
      printQRInTerminal: false,
      browser: ['MultSolutions Bot', 'Chrome', '1.0.0'],
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update: any) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        try {
          qrCodeData = await QRCode.toDataURL(qr);
          connectionStatus = '📱 Escaneie o QR Code com seu WhatsApp';
          logInfo('✅ QR Code gerado! Acesse http://localhost:8001');
        } catch (err) {
          logError('Erro ao gerar QR Code', err);
        }
      }
      
      if (connection === 'open') {
        qrCodeData = null;
        connectionStatus = '✅ Bot conectado com sucesso!';
        logInfo('✅ Bot conectado ao WhatsApp!');
      }
      
      if (connection === 'close') {
        const shouldReconnect =
          (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        
        if (shouldReconnect) {
          qrCodeData = null;
          connectionStatus = '🔄 Reconectando...';
          logInfo('🔄 Tentando reconectar...');
          setTimeout(() => startSocket(), 3000);
        } else {
          connectionStatus = '❌ Bot desconectado (logout)';
          logInfo('❌ Bot deslogado. Reinicie para gerar novo QR Code.');
        }
      }
    });

    sock.ev.on('messages.upsert', async ({ messages }: { messages: proto.IWebMessageInfo[] }) => {
      for (const msg of messages) if (msg.message) await handleMessage(msg);
    });

    logInfo('🚀 Bot MultSolutions iniciado!');
    logInfo('🌐 Acesse http://localhost:8000 para ver o Dashboard');
    logInfo('💬 Sistema de histórico de conversas ATIVO');
  } catch (error) {
    logError('Erro ao iniciar o bot', error);
    connectionStatus = '❌ Erro ao iniciar bot';
    setTimeout(() => startSocket(), 5000);
  }
}

startSocket();