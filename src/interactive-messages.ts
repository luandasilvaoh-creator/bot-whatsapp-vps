// /**
//  * ╔═══════════════════════════════════════════════════════════════╗
//  * ║         MENSAGENS INTERATIVAS - MULTSOLUTIONS BOT             ║
//  * ║     Carousel, Listas e Botões para WhatsApp Business          ║
//  * ║                    VERSÃO CORRIGIDA v2.0                      ║
//  * ╚═══════════════════════════════════════════════════════════════╝
//  */

// import type { WASocket, proto } from 'whaileys';
// import axios from 'axios';
// import * as fs from 'fs';
// import * as path from 'path';

// /**
//  * Interface para os botões do carousel
//  */
// export interface CarouselButton {
//   displayText: string;
//   urlButton?: { url: string };
//   quickReplyButton?: { id: string };
//   callButton?: { phoneNumber: string };
//   copyCodeButton?: { copyCode: string };
// }

// /**
//  * Interface para os cards do carousel
//  */
// export interface CarouselCard {
//   header?: {
//     title: string;
//     subtitle?: string;
//     imageUrl?: string;
//     videoUrl?: string;
//     imageMessage?: any;
//     videoMessage?: any;
//   };
//   body: string;
//   footer?: string;
//   buttons: CarouselButton[];
// }

// /**
//  * Prepara imagem local para uso no carousel
//  * Envia para si mesmo para obter a estrutura da mensagem
//  */
// export async function prepareLocalImage(sock: WASocket, filename: string) {
//   try {
//     const imagePath = path.join(process.cwd(), filename);
    
//     if (!fs.existsSync(imagePath)) {
//       console.error(`[PrepareImage] ❌ Imagem não encontrada: ${imagePath}`);
//       return null;
//     }

//     const imageBuffer = fs.readFileSync(imagePath);
    
//     // Envia para si mesmo para obter a estrutura da mensagem
//     const msg = await sock.sendMessage(sock.user!.id, {
//       image: imageBuffer,
//     });
    
//     console.log('[PrepareImage] ✅ Imagem preparada com sucesso');
//     return msg?.message?.imageMessage || null;
//   } catch (error) {
//     console.error('[PrepareImage] ❌ Erro ao preparar imagem:', error);
//     return null;
//   }
// }

// /**
//  * Prepara vídeo local para uso no carousel
//  */
// export async function prepareLocalVideo(sock: WASocket, filename: string) {
//   try {
//     const videoPath = path.join(process.cwd(), filename);
    
//     if (!fs.existsSync(videoPath)) {
//       console.error(`[PrepareVideo] ❌ Vídeo não encontrado: ${videoPath}`);
//       return null;
//     }

//     const videoBuffer = fs.readFileSync(videoPath);
    
//     const msg = await sock.sendMessage(sock.user!.id, {
//       video: videoBuffer,
//     });
    
//     console.log('[PrepareVideo] ✅ Vídeo preparado com sucesso');
//     return msg?.message?.videoMessage || null;
//   } catch (error) {
//     console.error('[PrepareVideo] ❌ Erro ao preparar vídeo:', error);
//     return null;
//   }
// }

// /**
//  * Baixa e prepara mídia externa (URL) para o carousel
//  */
// async function prepareExternalMedia(
//   sock: WASocket,
//   type: 'image' | 'video',
//   url: string
// ): Promise<any | null> {
//   try {
//     console.log(`[ExternalMedia] 📥 Baixando ${type}: ${url}`);

//     const response = await axios.get(url, { 
//       responseType: 'arraybuffer',
//       timeout: 10000 
//     });
    
//     const buffer = Buffer.from(response.data);

//     if (type === 'image') {
//       const msg = await sock.sendMessage(sock.user!.id, {
//         image: buffer,
//       });
//       return msg?.message?.imageMessage || null;
//     } else {
//       const msg = await sock.sendMessage(sock.user!.id, {
//         video: buffer,
//       });
//       return msg?.message?.videoMessage || null;
//     }
//   } catch (error) {
//     console.error(`[ExternalMedia] ❌ Erro ao preparar ${type}:`, error);
//     return null;
//   }
// }

// /**
//  * Gera mensagem de carousel no formato correto do WhatsApp
//  */
// export function generateCarouselMessage(config: { cards: CarouselCard[] }) {
//   const cards = config.cards.map((card) => {
//     const buttons: any[] = [];

//     // Processa cada tipo de botão
//     card.buttons.forEach((btn) => {
//       if (btn.urlButton) {
//         buttons.push({
//           name: 'cta_url',
//           buttonParamsJson: JSON.stringify({
//             display_text: btn.displayText,
//             url: btn.urlButton.url,
//             merchant_url: btn.urlButton.url,
//           }),
//         });
//       } else if (btn.quickReplyButton) {
//         buttons.push({
//           name: 'quick_reply',
//           buttonParamsJson: JSON.stringify({
//             display_text: btn.displayText,
//             id: btn.quickReplyButton.id,
//           }),
//         });
//       } else if (btn.callButton) {
//         buttons.push({
//           name: 'cta_call',
//           buttonParamsJson: JSON.stringify({
//             display_text: btn.displayText,
//             phone_number: btn.callButton.phoneNumber,
//           }),
//         });
//       } else if (btn.copyCodeButton) {
//         buttons.push({
//           name: 'cta_copy',
//           buttonParamsJson: JSON.stringify({
//             display_text: btn.displayText,
//             copy_code: btn.copyCodeButton.copyCode,
//           }),
//         });
//       }
//     });

//     // Monta o card completo
//     return {
//       header: card.header
//         ? {
//             title: card.header.title,
//             subtitle: card.header.subtitle || '',
//             hasMediaAttachment: !!(card.header.imageMessage || card.header.videoMessage),
//             ...(card.header.imageMessage && {
//               imageMessage: card.header.imageMessage,
//             }),
//             ...(card.header.videoMessage && {
//               videoMessage: card.header.videoMessage,
//             }),
//           }
//         : undefined,
//       body: { text: card.body },
//       footer: card.footer ? { text: card.footer } : undefined,
//       nativeFlowMessage: {
//         buttons,
//       },
//     };
//   });

//   return {
//     header: { title: '', hasMediaAttachment: false },
//     body: { text: '' },
//     footer: { text: '' },
//     carouselMessage: { cards },
//   };
// }

// /**
//  * Envia mensagem de carousel
//  * Suporta imagens/vídeos locais e externos
//  */
// export async function sendCarousel(
//   sock: WASocket,
//   remoteJid: string,
//   cards: CarouselCard[]
// ) {
//   console.log(`[Carousel] 📤 Preparando envio de ${cards.length} cards para ${remoteJid}...`);
  
//   try {
//     // Upload de mídias dos cards (se houver)
//     for (const card of cards) {
//       // Processa imagem externa
//       if (card.header?.imageUrl && !card.header.imageMessage) {
//         console.log(`[Carousel] 🖼️ Preparando imagem externa: ${card.header.title}`);
//         const imageMsg = await prepareExternalMedia(sock, 'image', card.header.imageUrl);
//         if (imageMsg) {
//           card.header.imageMessage = imageMsg;
//         }
//       }

//       // Processa vídeo externo
//       if (card.header?.videoUrl && !card.header.videoMessage) {
//         console.log(`[Carousel] 🎥 Preparando vídeo externo: ${card.header.title}`);
//         const videoMsg = await prepareExternalMedia(sock, 'video', card.header.videoUrl);
//         if (videoMsg) {
//           card.header.videoMessage = videoMsg;
//         }
//       }
//     }

//     const carouselContent = generateCarouselMessage({ cards });
    
//     console.log('[Carousel] 📨 Enviando carousel...');

//     await sock.relayMessage(
//       remoteJid,
//       {
//         interactiveMessage: carouselContent,
//       },
//       {}
//     );
    
//     console.log('[Carousel] ✅ Carousel enviado com sucesso!');
//   } catch (error) {
//     console.error('[Carousel] ❌ Erro ao enviar carousel:', error);
//     throw error;
//   }
// }

// /**
//  * Envia carousel SEM imagens (mais rápido e confiável)
//  * Use esta versão quando tiver problemas com upload de imagens
//  */
// export async function sendCarouselSimple(
//   sock: WASocket,
//   remoteJid: string,
//   cards: Array<{
//     title: string;
//     subtitle?: string;
//     body: string;
//     footer?: string;
//     buttons: CarouselButton[];
//   }>
// ) {
//   console.log(`[CarouselSimple] 📤 Enviando ${cards.length} cards simples...`);
  
//   try {
//     const carouselCards: CarouselCard[] = cards.map(card => ({
//       header: {
//         title: card.title,
//         subtitle: card.subtitle,
//       },
//       body: card.body,
//       footer: card.footer,
//       buttons: card.buttons,
//     }));

//     const carouselContent = generateCarouselMessage({ cards: carouselCards });
    
//     await sock.relayMessage(
//       remoteJid,
//       {
//         interactiveMessage: carouselContent,
//       },
//       {}
//     );
    
//     console.log('[CarouselSimple] ✅ Enviado com sucesso!');
//   } catch (error) {
//     console.error('[CarouselSimple] ❌ Erro ao enviar:', error);
//     throw error;
//   }
// }

// /**
//  * Envia lista interativa (alternativa ao carousel para iPhone)
//  * Mais compatível com iOS
//  */
// export async function sendInteractiveList(
//   sock: WASocket,
//   remoteJid: string,
//   config: {
//     title: string;
//     body: string;
//     buttonText: string;
//     sections: Array<{
//       title: string;
//       rows: Array<{
//         title: string;
//         rowId: string;
//         description?: string;
//       }>;
//     }>;
//   }
// ) {
//   console.log(`[InteractiveList] 📋 Enviando lista para ${remoteJid}...`);
  
//   try {
//     await sock.sendMessage(remoteJid, {
//       text: config.body,
//       title: config.title,
//       buttonText: config.buttonText,
//       sections: config.sections,
//     } as any);
    
//     console.log('[InteractiveList] ✅ Lista enviada com sucesso!');
//   } catch (error) {
//     console.error('[InteractiveList] ❌ Erro ao enviar lista:', error);
//     throw error;
//   }
// }

// /**
//  * Envia botões simples (compatível com todos os dispositivos)
//  */
// export async function sendSimpleButtons(
//   sock: WASocket,
//   remoteJid: string,
//   config: {
//     text: string;
//     footer?: string;
//     buttons: Array<{
//       buttonId: string;
//       buttonText: string;
//     }>;
//   }
// ) {
//   console.log(`[SimpleButtons] 🔘 Enviando ${config.buttons.length} botões para ${remoteJid}...`);
  
//   try {
//     const formattedButtons = config.buttons.map(btn => ({
//       buttonId: btn.buttonId,
//       buttonText: { displayText: btn.buttonText },
//       type: 1
//     }));

//     await sock.sendMessage(remoteJid, {
//       text: config.text,
//       footer: config.footer || '',
//       buttons: formattedButtons,
//       headerType: 1,
//     } as any);
    
//     console.log('[SimpleButtons] ✅ Botões enviados com sucesso!');
//   } catch (error) {
//     console.error('[SimpleButtons] ❌ Erro ao enviar botões:', error);
//     throw error;
//   }
// }

/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║      CAROUSEL ADAPTATIVO - SUPORTE COMPLETO PARA IPHONE       ║
 * ║           Detecta dispositivo e envia formato correto         ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

import type { WASocket, proto } from 'whaileys';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

export interface CarouselButton {
  displayText: string;
  urlButton?: { url: string };
  quickReplyButton?: { id: string };
  callButton?: { phoneNumber: string };
  copyCodeButton?: { copyCode: string };
}

export interface CarouselCard {
  header?: {
    title: string;
    subtitle?: string;
    imageUrl?: string;
    videoUrl?: string;
    imageMessage?: any;
    videoMessage?: any;
  };
  body: string;
  footer?: string;
  buttons: CarouselButton[];
}

type DeviceType = "IPHONE" | "ANDROID" | "WEB";

/**
 * 🔥 FUNÇÃO PRINCIPAL - ENVIA CAROUSEL ADAPTATIVO
 * Detecta o dispositivo e escolhe o melhor formato
 */
export async function sendAdaptiveCarousel(
  sock: WASocket,
  remoteJid: string,
  cards: CarouselCard[],
  deviceType: DeviceType
) {
  console.log(`[AdaptiveCarousel] 📱 Dispositivo: ${deviceType} | Cards: ${cards.length}`);
  
  try {
    if (deviceType === "IPHONE") {
      // 🍎 iPhone: Envia lista interativa (mais compatível)
      await sendCarouselAsListForIPhone(sock, remoteJid, cards);
    } else {
      // 🤖 Android/Web: Envia carousel nativo
      await sendNativeCarousel(sock, remoteJid, cards);
    }
    
    console.log(`[AdaptiveCarousel] ✅ Enviado com sucesso para ${deviceType}`);
  } catch (error) {
    console.error('[AdaptiveCarousel] ❌ Erro:', error);
    // Fallback: envia mensagens simples
    await sendCarouselAsFallback(sock, remoteJid, cards);
  }
}

/**
 * 🍎 VERSÃO PARA IPHONE - Lista Interativa
 * iPhones têm melhor compatibilidade com listas do que com carousels
 */
async function sendCarouselAsListForIPhone(
  sock: WASocket,
  remoteJid: string,
  cards: CarouselCard[]
) {
  console.log('[iPhone] 📋 Enviando como lista interativa...');
  
  // Mensagem introdutória com a primeira imagem (se houver)
  if (cards[0]?.header?.imageMessage || cards[0]?.header?.imageUrl) {
    try {
      let imageBuffer: Buffer;
      
      if (cards[0].header!.imageMessage) {
        // Usa imagem já preparada
        const imagePath = path.join(process.cwd(), 'simular.png');
        imageBuffer = fs.readFileSync(imagePath);
      } else if (cards[0].header!.imageUrl) {
        // Baixa imagem externa
        const response = await axios.get(cards[0].header!.imageUrl, { 
          responseType: 'arraybuffer',
          timeout: 10000 
        });
        imageBuffer = Buffer.from(response.data);
      }
      
      await sock.sendMessage(remoteJid, {
        image: imageBuffer!,
        caption: '✨ *Principais benefícios da MultSolutions*\n\nVeja os recursos disponíveis:'
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      console.error('[iPhone] ⚠️ Erro ao enviar imagem:', err);
    }
  }
  
  // Monta seções da lista a partir dos cards
  const sections = cards.map((card, index) => ({
    title: card.header?.title || `Recurso ${index + 1}`,
    rows: [
      {
        title: card.header?.title || `Opção ${index + 1}`,
        rowId: `RECURSO_${index}`,
        description: card.body.substring(0, 72) // Limite do WhatsApp
      },
      // Adiciona botões como linhas
      ...card.buttons.map(btn => ({
        title: btn.displayText,
        rowId: btn.quickReplyButton?.id || btn.urlButton?.url || `BTN_${index}`,
        description: btn.urlButton ? '🔗 Link externo' : '⚡ Ação rápida'
      }))
    ]
  }));
  
  // Envia lista interativa
  await sock.sendMessage(remoteJid, {
    text: '👇 Escolha um recurso para saber mais:',
    title: 'Recursos MultSolutions',
    buttonText: 'Ver Opções',
    sections,
    footer: 'MultSolutions • Assistente Inteligente'
  } as any);
  
  console.log('[iPhone] ✅ Lista enviada com sucesso');
}

/**
 * 🤖 VERSÃO NATIVA - Carousel para Android/Web
 */
async function sendNativeCarousel(
  sock: WASocket,
  remoteJid: string,
  cards: CarouselCard[]
) {
  console.log('[NativeCarousel] 🎨 Enviando carousel nativo...');
  
  // Upload de mídias
  for (const card of cards) {
    if (card.header?.imageUrl && !card.header.imageMessage) {
      console.log(`[NativeCarousel] 🖼️ Preparando imagem: ${card.header.title}`);
      const imageMsg = await prepareExternalMedia(sock, 'image', card.header.imageUrl);
      if (imageMsg) {
        card.header.imageMessage = imageMsg;
      }
    }
  }
  
  const carouselContent = generateCarouselMessage({ cards });
  
  await sock.relayMessage(
    remoteJid,
    {
      interactiveMessage: carouselContent,
    },
    {}
  );
  
  console.log('[NativeCarousel] ✅ Carousel enviado');
}

/**
 * 🆘 FALLBACK - Envia cards como mensagens separadas
 * Usado quando tudo mais falha
 */
async function sendCarouselAsFallback(
  sock: WASocket,
  remoteJid: string,
  cards: CarouselCard[]
) {
  console.log('[Fallback] 📨 Enviando cards como mensagens separadas...');
  
  for (const [index, card] of cards.entries()) {
    let message = `*${card.header?.title || `Recurso ${index + 1}`}*\n\n`;
    message += card.body;
    
    // Adiciona botões como texto
    if (card.buttons.length > 0) {
      message += '\n\n📌 *Ações disponíveis:*\n';
      card.buttons.forEach(btn => {
        if (btn.urlButton) {
          message += `🔗 ${btn.displayText}: ${btn.urlButton.url}\n`;
        } else if (btn.callButton) {
          message += `📞 ${btn.displayText}: ${btn.callButton.phoneNumber}\n`;
        } else if (btn.copyCodeButton) {
          message += `📋 ${btn.displayText}: \`${btn.copyCodeButton.copyCode}\`\n`;
        }
      });
    }
    
    await sock.sendMessage(remoteJid, { text: message });
    await new Promise(resolve => setTimeout(resolve, 800));
  }
  
  // Menu de navegação
  await sock.sendMessage(remoteJid, {
    text: 'Quer saber mais sobre algum recurso específico?',
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
  
  console.log('[Fallback] ✅ Mensagens enviadas');
}

/**
 * Prepara imagem local
 */
export async function prepareLocalImage(sock: WASocket, filename: string) {
  try {
    const imagePath = path.join(process.cwd(), filename);
    
    if (!fs.existsSync(imagePath)) {
      console.error(`[PrepareImage] ❌ Imagem não encontrada: ${imagePath}`);
      return null;
    }

    const imageBuffer = fs.readFileSync(imagePath);
    
    const msg = await sock.sendMessage(sock.user!.id, {
      image: imageBuffer,
    });
    
    console.log('[PrepareImage] ✅ Imagem preparada');
    return msg?.message?.imageMessage || null;
  } catch (error) {
    console.error('[PrepareImage] ❌ Erro:', error);
    return null;
  }
}

/**
 * Prepara mídia externa
 */
async function prepareExternalMedia(
  sock: WASocket,
  type: 'image' | 'video',
  url: string
): Promise<any | null> {
  try {
    console.log(`[ExternalMedia] 📥 Baixando ${type}: ${url}`);

    const response = await axios.get(url, { 
      responseType: 'arraybuffer',
      timeout: 10000 
    });
    
    const buffer = Buffer.from(response.data);

    if (type === 'image') {
      const msg = await sock.sendMessage(sock.user!.id, {
        image: buffer,
      });
      return msg?.message?.imageMessage || null;
    } else {
      const msg = await sock.sendMessage(sock.user!.id, {
        video: buffer,
      });
      return msg?.message?.videoMessage || null;
    }
  } catch (error) {
    console.error(`[ExternalMedia] ❌ Erro:`, error);
    return null;
  }
}

/**
 * Gera mensagem de carousel (formato nativo)
 */
function generateCarouselMessage(config: { cards: CarouselCard[] }) {
  const cards = config.cards.map((card) => {
    const buttons: any[] = [];

    card.buttons.forEach((btn) => {
      if (btn.urlButton) {
        buttons.push({
          name: 'cta_url',
          buttonParamsJson: JSON.stringify({
            display_text: btn.displayText,
            url: btn.urlButton.url,
            merchant_url: btn.urlButton.url,
          }),
        });
      } else if (btn.quickReplyButton) {
        buttons.push({
          name: 'quick_reply',
          buttonParamsJson: JSON.stringify({
            display_text: btn.displayText,
            id: btn.quickReplyButton.id,
          }),
        });
      } else if (btn.callButton) {
        buttons.push({
          name: 'cta_call',
          buttonParamsJson: JSON.stringify({
            display_text: btn.displayText,
            phone_number: btn.callButton.phoneNumber,
          }),
        });
      } else if (btn.copyCodeButton) {
        buttons.push({
          name: 'cta_copy',
          buttonParamsJson: JSON.stringify({
            display_text: btn.displayText,
            copy_code: btn.copyCodeButton.copyCode,
          }),
        });
      }
    });

    return {
      header: card.header
        ? {
            title: card.header.title,
            subtitle: card.header.subtitle || '',
            hasMediaAttachment: !!(card.header.imageMessage || card.header.videoMessage),
            ...(card.header.imageMessage && {
              imageMessage: card.header.imageMessage,
            }),
            ...(card.header.videoMessage && {
              videoMessage: card.header.videoMessage,
            }),
          }
        : undefined,
      body: { text: card.body },
      footer: card.footer ? { text: card.footer } : undefined,
      nativeFlowMessage: {
        buttons,
      },
    };
  });

  return {
    header: { title: '', hasMediaAttachment: false },
    body: { text: '' },
    footer: { text: '' },
    carouselMessage: { cards },
  };
}

/**
 * 🔄 COMPATIBILIDADE: Mantém função original para não quebrar código existente
 */
export async function sendCarousel(
  sock: WASocket,
  remoteJid: string,
  cards: CarouselCard[]
) {
  // Tenta enviar carousel nativo (assume Android/Web)
  return sendNativeCarousel(sock, remoteJid, cards);
}