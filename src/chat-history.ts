// ============================================
// 📝 SISTEMA DE HISTÓRICO DE CONVERSAS
// Arquivo: src/chat-history.ts
// ============================================

import * as fs from 'fs';
import * as path from 'path';

interface ChatMessage {
  id: string;
  timestamp: string;
  timestampFormatted: string;
  from: 'bot' | 'user';
  message: string;
  messageType: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact';
  metadata?: {
    buttonId?: string;
    listId?: string;
    deviceType?: string;
    mediaUrl?: string;
  };
}

interface ChatHistory {
  leadNumber: string;
  leadName: string;
  conversationStarted: string;
  lastMessageTime: string;
  totalMessages: number;
  messages: ChatMessage[];
  aiContext?: {
    summary?: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
    tags?: string[];
    nextSuggestedAction?: string;
  };
}

export function getHistoryDir(): string {
  const dir = path.join(process.cwd(), 'src', 'chat-history');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function getHistoryFilePath(number: string): string {
  return path.join(getHistoryDir(), `${number}.json`);
}

export function loadChatHistory(number: string): ChatHistory | null {
  try {
    const filePath = getHistoryFilePath(number);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`❌ Erro ao carregar histórico de ${number}:`, error);
    return null;
  }
}

export function saveChatHistory(history: ChatHistory): boolean {
  try {
    const filePath = getHistoryFilePath(history.leadNumber);
    fs.writeFileSync(filePath, JSON.stringify(history, null, 2));
    return true;
  } catch (error) {
    console.error(`❌ Erro ao salvar histórico de ${history.leadNumber}:`, error);
    return false;
  }
}

export function addMessageToHistory(
  number: string,
  name: string,
  from: 'bot' | 'user',
  message: string,
  messageType: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact' = 'text',
  metadata?: ChatMessage['metadata']
): ChatHistory {
  let history = loadChatHistory(number);
  
  if (!history) {
    history = {
      leadNumber: number,
      leadName: name,
      conversationStarted: new Date().toISOString(),
      lastMessageTime: new Date().toISOString(),
      totalMessages: 0,
      messages: [],
    };
  }

  const now = new Date();
  const newMessage: ChatMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: now.toISOString(),
    timestampFormatted: now.toLocaleString('pt-BR'),
    from,
    message,
    messageType,
    metadata,
  };

  history.messages.push(newMessage);
  history.totalMessages = history.messages.length;
  history.lastMessageTime = now.toISOString();
  history.leadName = name;

  saveChatHistory(history);

  console.log(`💬 [HISTORY] ${from === 'user' ? '👤' : '🤖'} ${name}: ${message.substring(0, 50)}...`);

  return history;
}

export function formatHistoryForAI(number: string): string {
  const history = loadChatHistory(number);
  
  if (!history || history.messages.length === 0) {
    return 'Nenhum histórico de conversa disponível.';
  }

  let formatted = `=== HISTÓRICO DE CONVERSA ===\n`;
  formatted += `Lead: ${history.leadName} (${history.leadNumber})\n`;
  formatted += `Iniciado em: ${new Date(history.conversationStarted).toLocaleString('pt-BR')}\n`;
  formatted += `Total de mensagens: ${history.totalMessages}\n\n`;
  formatted += `=== MENSAGENS ===\n\n`;

  history.messages.forEach((msg, index) => {
    const speaker = msg.from === 'user' ? 'CLIENTE' : 'BOT';
    formatted += `[${index + 1}] ${speaker} (${msg.timestampFormatted}):\n`;
    formatted += `${msg.message}\n\n`;
  });

  return formatted;
}

export function getConversationContext(number: string, lastN: number = 10): ChatMessage[] {
  const history = loadChatHistory(number);
  
  if (!history || history.messages.length === 0) {
    return [];
  }

  return history.messages.slice(-lastN);
}

export function searchInHistory(number: string, searchTerm: string): ChatMessage[] {
  const history = loadChatHistory(number);
  
  if (!history) return [];

  return history.messages.filter(msg => 
    msg.message.toLowerCase().includes(searchTerm.toLowerCase())
  );
}

export function getAllHistories(): ChatHistory[] {
  try {
    const dir = getHistoryDir();
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
    
    return files.map(file => {
      const filePath = path.join(dir, file);
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }).sort((a, b) => {
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
    });
  } catch (error) {
    console.error('❌ Erro ao buscar todos os históricos:', error);
    return [];
  }
}

export function getConversationStats(number: string) {
  const history = loadChatHistory(number);
  
  if (!history) {
    return {
      totalMessages: 0,
      userMessages: 0,
      botMessages: 0,
      averageResponseTime: 0,
      conversationDuration: 0,
      lastInteraction: null,
    };
  }

  const userMessages = history.messages.filter(m => m.from === 'user').length;
  const botMessages = history.messages.filter(m => m.from === 'bot').length;

  const start = new Date(history.conversationStarted);
  const end = new Date(history.lastMessageTime);
  const duration = end.getTime() - start.getTime();

  return {
    totalMessages: history.totalMessages,
    userMessages,
    botMessages,
    averageResponseTime: 0,
    conversationDuration: Math.floor(duration / 1000),
    lastInteraction: history.lastMessageTime,
  };
}

export function logUserMessage(
  remoteJid: string,
  name: string,
  message: string,
  metadata?: ChatMessage['metadata']
) {
  const number = remoteJid.replace(/@s\.whatsapp\.net$/, '');
  return addMessageToHistory(number, name, 'user', message, 'text', metadata);
}

export function logBotMessage(
  remoteJid: string,
  name: string,
  message: string,
  metadata?: ChatMessage['metadata']
) {
  const number = remoteJid.replace(/@s\.whatsapp\.net$/, '');
  return addMessageToHistory(number, name, 'bot', message, 'text', metadata);
}

export function exportHistoryToMarkdown(number: string): string {
  const history = loadChatHistory(number);
  
  if (!history) return '';

  let md = `# Conversa com ${history.leadName}\n\n`;
  md += `**Número:** ${history.leadNumber}\n`;
  md += `**Início:** ${new Date(history.conversationStarted).toLocaleString('pt-BR')}\n`;
  md += `**Última mensagem:** ${new Date(history.lastMessageTime).toLocaleString('pt-BR')}\n`;
  md += `**Total de mensagens:** ${history.totalMessages}\n\n`;
  md += `---\n\n`;

  history.messages.forEach(msg => {
    const emoji = msg.from === 'user' ? '👤' : '🤖';
    md += `### ${emoji} ${msg.from === 'user' ? 'Cliente' : 'Bot'}\n`;
    md += `**Horário:** ${msg.timestampFormatted}\n\n`;
    md += `${msg.message}\n\n`;
    md += `---\n\n`;
  });

  return md;
}

export default {
  addMessageToHistory,
  loadChatHistory,
  saveChatHistory,
  formatHistoryForAI,
  getConversationContext,
  searchInHistory,
  getAllHistories,
  getConversationStats,
  logUserMessage,
  logBotMessage,
  exportHistoryToMarkdown,
};