#!/bin/bash

# ============================================
# 🚀 DEPLOY ONE-CLICK - BOT WHATSAPP
# Execute este script após o install.sh
# ============================================

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════╗
║   🚀 DEPLOY ONE-CLICK                    ║
║   Bot WhatsApp MultSolutions             ║
╚═══════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erro: Execute este script no diretório do projeto${NC}"
    exit 1
fi

echo -e "${GREEN}[1/7]${NC} Verificando dependências..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não instalado. Execute install.sh primeiro.${NC}"
    exit 1
fi

if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}❌ PM2 não instalado. Execute install.sh primeiro.${NC}"
    exit 1
fi

echo -e "${GREEN}[2/7]${NC} Instalando dependências do projeto..."
npm install

echo -e "${GREEN}[3/7]${NC} Compilando TypeScript..."
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Erro na compilação. Verifique os erros acima.${NC}"
    exit 1
fi

echo -e "${GREEN}[4/7]${NC} Verificando arquivo .env..."
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️ Arquivo .env não encontrado. Criando template...${NC}"
    cat > .env << 'EOL'
PORT=8001
NODE_ENV=production
N8N_WEBHOOK_URL=https://n8nwebhook.multsolutions.com.br/webhook/bot-atendimento
ATENDENTE_NUMBER=558584460424
SESSION_SECRET=change-this-secret-key-123456
EOL
    echo -e "${YELLOW}⚠️ Configure o .env antes de iniciar!${NC}"
    echo -e "${YELLOW}   nano .env${NC}"
    read -p "Pressione ENTER após configurar o .env..." 
fi

echo -e "${GREEN}[5/7]${NC} Criando diretórios necessários..."
mkdir -p auth src/leads src/chat-history logs

echo -e "${GREEN}[6/7]${NC} Parando instância anterior (se existir)..."
pm2 delete bot-whatsapp 2>/dev/null || true

echo -e "${GREEN}[7/7]${NC} Iniciando bot com PM2..."
pm2 start ecosystem.config.js

echo -e "${GREEN}✅ Salvando configuração PM2...${NC}"
pm2 save

echo -e "${GREEN}✅ Configurando PM2 para iniciar no boot...${NC}"
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME

echo ""
echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════╗
║   ✅ DEPLOY CONCLUÍDO COM SUCESSO!       ║
╚═══════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo ""
echo -e "${BLUE}📊 Status do Bot:${NC}"
pm2 status

echo ""
echo -e "${BLUE}🌐 Acessos:${NC}"
echo -e "  • Dashboard: ${GREEN}http://$(hostname -I | awk '{print $1}'):8001${NC}"
echo -e "  • Logs: ${YELLOW}pm2 logs bot-whatsapp${NC}"
echo -e "  • Monitoramento: ${YELLOW}pm2 monit${NC}"

echo ""
echo -e "${BLUE}🔧 Comandos Úteis:${NC}"
echo -e "  ${GREEN}./manage.sh start${NC}    - Iniciar bot"
echo -e "  ${GREEN}./manage.sh stop${NC}     - Parar bot"
echo -e "  ${GREEN}./manage.sh restart${NC}  - Reiniciar bot"
echo -e "  ${GREEN}./manage.sh logs${NC}     - Ver logs"
echo -e "  ${GREEN}./manage.sh status${NC}   - Ver status"
echo -e "  ${GREEN}./manage.sh monit${NC}    - Monitorar"

echo ""
echo -e "${BLUE}📱 Próximos Passos:${NC}"
echo "1. Acesse o dashboard pelo navegador"
echo "2. Escaneie o QR Code com o WhatsApp"
echo "3. Envie uma mensagem de teste"
echo "4. Configure HTTPS se tiver domínio (certbot)"
echo ""

echo -e "${GREEN}🎉 Bot está no ar e funcionando!${NC}"
