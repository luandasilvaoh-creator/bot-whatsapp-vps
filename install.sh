#!/bin/bash

# ============================================
# 🚀 AUTO-INSTALADOR BOT WHATSAPP MULT SOLUTIONS
# Para Ubuntu 20.04+ / Debian 11+
# ============================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════╗
║   🤖 BOT WHATSAPP MULT SOLUTIONS         ║
║   Auto-Instalador para VPS               ║
╚═══════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Função de log
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se é root
if [[ $EUID -ne 0 ]]; then
   log_error "Este script precisa ser executado como root (use sudo)"
   exit 1
fi

# Detectar usuário não-root para instalação
REAL_USER=${SUDO_USER:-$USER}
REAL_HOME=$(eval echo ~$REAL_USER)

log_info "Instalando para usuário: $REAL_USER"
log_info "Diretório home: $REAL_HOME"

# ============================================
# 1. ATUALIZAR SISTEMA
# ============================================
log_info "Atualizando sistema..."
apt-get update -y
apt-get upgrade -y

# ============================================
# 2. INSTALAR DEPENDÊNCIAS
# ============================================
log_info "Instalando dependências essenciais..."
apt-get install -y \
    curl \
    git \
    build-essential \
    libwebp-dev \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    nginx \
    ufw \
    fail2ban

# ============================================
# 3. INSTALAR NODE.JS (v20 LTS)
# ============================================
log_info "Instalando Node.js v20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

NODE_VERSION=$(node -v)
log_info "Node.js instalado: $NODE_VERSION"

# ============================================
# 4. INSTALAR PM2 GLOBALMENTE
# ============================================
log_info "Instalando PM2..."
npm install -g pm2

# ============================================
# 5. CRIAR ESTRUTURA DE DIRETÓRIOS
# ============================================
APP_DIR="$REAL_HOME/bot-whatsapp"
log_info "Criando estrutura em: $APP_DIR"

mkdir -p $APP_DIR
cd $APP_DIR

# ============================================
# 6. CLONAR/COPIAR PROJETO
# ============================================
log_info "Inicializando projeto..."

# Criar package.json
cat > package.json << 'EOL'
{
  "name": "bot-whatsapp-mult",
  "version": "1.0.0",
  "description": "Bot WhatsApp MultSolutions - VPS Edition",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts",
    "pm2:start": "pm2 start ecosystem.config.js",
    "pm2:stop": "pm2 stop bot-whatsapp",
    "pm2:restart": "pm2 restart bot-whatsapp",
    "pm2:logs": "pm2 logs bot-whatsapp",
    "pm2:monit": "pm2 monit"
  },
  "author": "MultSolutions",
  "license": "MIT",
  "dependencies": {
    "@google/generative-ai": "^0.21.0",
    "@hapi/boom": "^10.0.1",
    "@whiskeysockets/baileys": "^7.0.0-rc.9",
    "axios": "^1.13.2",
    "dotenv": "^16.4.5",
    "express": "^4.22.1",
    "pino": "^7.7.0",
    "qrcode": "^1.5.4",
    "qrcode-terminal": "^0.12.0",
    "whaileys": "github:canove/whaileys"
  },
  "devDependencies": {
    "@types/express": "^4.17.25",
    "@types/node": "^20.19.25",
    "@types/qrcode": "^1.5.6",
    "@types/qrcode-terminal": "^0.12.2",
    "ts-node": "^10.9.2",
    "typescript": "^5.3.3"
  }
}
EOL

# Criar tsconfig.json
cat > tsconfig.json << 'EOL'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOL

# Criar .env
cat > .env << 'EOL'
# Configurações do Bot
PORT=8001
NODE_ENV=production

# Webhook N8N (opcional)
N8N_WEBHOOK_URL=https://n8nwebhook.multsolutions.com.br/webhook/bot-atendimento

# Número do atendente (formato: 5521967229853)
ATENDENTE_NUMBER=558584460424

# Configurações de segurança
SESSION_SECRET=your-secret-key-here
EOL

# Criar ecosystem.config.js para PM2
cat > ecosystem.config.js << 'EOL'
module.exports = {
  apps: [{
    name: 'bot-whatsapp',
    script: './dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 8001
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    min_uptime: '10s',
    max_restarts: 10
  }]
}
EOL

# ============================================
# 7. CRIAR ESTRUTURA DE PASTAS
# ============================================
mkdir -p src/leads
mkdir -p src/chat-history
mkdir -p auth
mkdir -p logs

# ============================================
# 8. INSTALAR DEPENDÊNCIAS
# ============================================
log_info "Instalando dependências do projeto..."
chown -R $REAL_USER:$REAL_USER $APP_DIR
sudo -u $REAL_USER npm install

# ============================================
# 9. CONFIGURAR NGINX
# ============================================
log_info "Configurando Nginx..."

DOMAIN="seu-dominio.com.br"
read -p "Digite seu domínio (ex: bot.multsolutions.com.br) ou pressione ENTER para usar IP: " USER_DOMAIN

if [ ! -z "$USER_DOMAIN" ]; then
    DOMAIN=$USER_DOMAIN
fi

cat > /etc/nginx/sites-available/bot-whatsapp << EOL
server {
    listen 80;
    server_name $DOMAIN;

    # Limite de tamanho de upload
    client_max_body_size 50M;

    # Logs
    access_log /var/log/nginx/bot-whatsapp-access.log;
    error_log /var/log/nginx/bot-whatsapp-error.log;

    # Proxy para o bot
    location / {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeouts para long polling
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOL

ln -sf /etc/nginx/sites-available/bot-whatsapp /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Testar configuração do Nginx
nginx -t

if [ $? -eq 0 ]; then
    systemctl restart nginx
    log_info "Nginx configurado com sucesso!"
else
    log_error "Erro na configuração do Nginx"
    exit 1
fi

# ============================================
# 10. CONFIGURAR FIREWALL
# ============================================
log_info "Configurando firewall (UFW)..."
ufw --force enable
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw status

# ============================================
# 11. CONFIGURAR FAIL2BAN
# ============================================
log_info "Configurando Fail2Ban..."
systemctl enable fail2ban
systemctl start fail2ban

# ============================================
# 12. CRIAR SCRIPT DE GERENCIAMENTO
# ============================================
cat > $APP_DIR/manage.sh << 'EOL'
#!/bin/bash

case "$1" in
    start)
        echo "🚀 Iniciando bot..."
        npm run build && npm run pm2:start
        ;;
    stop)
        echo "🛑 Parando bot..."
        npm run pm2:stop
        ;;
    restart)
        echo "🔄 Reiniciando bot..."
        npm run build && npm run pm2:restart
        ;;
    logs)
        echo "📋 Logs do bot..."
        npm run pm2:logs
        ;;
    status)
        echo "📊 Status do bot..."
        pm2 status
        ;;
    monit)
        echo "📈 Monitorando bot..."
        npm run pm2:monit
        ;;
    update)
        echo "⬆️ Atualizando bot..."
        git pull
        npm install
        npm run build
        npm run pm2:restart
        ;;
    *)
        echo "Uso: ./manage.sh {start|stop|restart|logs|status|monit|update}"
        exit 1
        ;;
esac
EOL

chmod +x $APP_DIR/manage.sh

# ============================================
# 13. CRIAR SYSTEMD SERVICE (ALTERNATIVA AO PM2)
# ============================================
cat > /etc/systemd/system/bot-whatsapp.service << EOL
[Unit]
Description=Bot WhatsApp MultSolutions
After=network.target

[Service]
Type=simple
User=$REAL_USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node $APP_DIR/dist/index.js
Restart=always
RestartSec=10
StandardOutput=append:$APP_DIR/logs/systemd-out.log
StandardError=append:$APP_DIR/logs/systemd-error.log
Environment=NODE_ENV=production
Environment=PORT=8001

[Install]
WantedBy=multi-user.target
EOL

systemctl daemon-reload

# ============================================
# 14. CRIAR SCRIPT DE BACKUP
# ============================================
cat > $APP_DIR/backup.sh << 'EOL'
#!/bin/bash

BACKUP_DIR="$HOME/bot-backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_$DATE.tar.gz"

mkdir -p $BACKUP_DIR

echo "📦 Criando backup..."
tar -czf $BACKUP_DIR/$BACKUP_FILE \
    src/leads \
    src/chat-history \
    auth \
    .env

echo "✅ Backup criado: $BACKUP_DIR/$BACKUP_FILE"

# Manter apenas últimos 7 backups
ls -t $BACKUP_DIR/backup_*.tar.gz | tail -n +8 | xargs rm -f 2>/dev/null

echo "🧹 Backups antigos removidos"
EOL

chmod +x $APP_DIR/backup.sh

# Adicionar ao crontab (backup diário às 3h)
(crontab -l 2>/dev/null; echo "0 3 * * * $APP_DIR/backup.sh") | crontab -

# ============================================
# 15. AJUSTAR PERMISSÕES
# ============================================
chown -R $REAL_USER:$REAL_USER $APP_DIR

# ============================================
# 16. EXIBIR RESUMO
# ============================================
clear
echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════╗
║   ✅ INSTALAÇÃO CONCLUÍDA COM SUCESSO!   ║
╚═══════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo ""
log_info "📁 Diretório do projeto: $APP_DIR"
log_info "🌐 URL de acesso: http://$DOMAIN (ou http://SEU_IP:8001)"
echo ""
log_info "📋 PRÓXIMOS PASSOS:"
echo ""
echo "1. Copie seus arquivos src/ para: $APP_DIR/src/"
echo "   rsync -avz ./src/ usuario@seu-ip:$APP_DIR/src/"
echo ""
echo "2. Configure o .env em: $APP_DIR/.env"
echo ""
echo "3. Compile o projeto:"
echo "   cd $APP_DIR && npm run build"
echo ""
echo "4. Inicie o bot:"
echo "   cd $APP_DIR && ./manage.sh start"
echo ""
echo "5. Verifique os logs:"
echo "   cd $APP_DIR && ./manage.sh logs"
echo ""
log_info "🔧 COMANDOS ÚTEIS:"
echo ""
echo "  ./manage.sh start    - Iniciar bot"
echo "  ./manage.sh stop     - Parar bot"
echo "  ./manage.sh restart  - Reiniciar bot"
echo "  ./manage.sh logs     - Ver logs"
echo "  ./manage.sh status   - Ver status"
echo "  ./manage.sh monit    - Monitorar em tempo real"
echo ""
log_info "🔐 SEGURANÇA:"
echo "  - Firewall UFW ativado (portas 22, 80, 443)"
echo "  - Fail2Ban configurado"
echo "  - Nginx como proxy reverso"
echo ""
log_info "💾 BACKUP:"
echo "  - Backup automático diário às 3h"
echo "  - Executar manualmente: ./backup.sh"
echo ""
log_info "🆘 SUPORTE:"
echo "  - GitHub: https://github.com/multsolutions"
echo "  - Docs: https://multsolutions.com.br/docs"
echo ""
