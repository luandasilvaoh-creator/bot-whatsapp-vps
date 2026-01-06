# 🤖 Bot WhatsApp MultSolutions

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-success.svg)]()

Bot WhatsApp profissional com sistema de atendimento automatizado, gestão de leads, histórico de conversas e dashboard de monitoramento.

## ✨ Recursos

### 🎯 Principais Funcionalidades
- ✅ **Atendimento Automático 24/7** - Menu interativo com botões
- ✅ **Multi-dispositivo** - Detecta iPhone, Android e Web automaticamente
- ✅ **Gestão de Leads** - Captura e armazena informações de contatos
- ✅ **Histórico de Conversas** - Registro completo de todas interações
- ✅ **Dashboard Web** - Interface de monitoramento em tempo real
- ✅ **Carousels Adaptativos** - Cards interativos com imagens
- ✅ **Agendamento** - Sistema de marcação de demonstrações
- ✅ **Webhooks N8N** - Integração com automações externas
- ✅ **Inatividade Inteligente** - Detecção e reengajamento automático
- ✅ **Backup Automático** - Proteção de dados diária

### 📊 Dashboard
- Status de conexão em tempo real
- QR Code para pareamento
- Estatísticas de atendimento
- Lista de leads com filtros
- Histórico completo de conversas
- Exportação em Markdown
- Busca em conversas
- APIs RESTful

### 🛡️ Segurança
- Firewall UFW configurado
- Fail2Ban contra ataques
- Nginx como proxy reverso
- HTTPS/SSL (Let's Encrypt)
- Limitação de requisições
- Validação de entrada

## 🚀 Deploy Rápido

### Opção 1: Auto-Instalador (Recomendado)

```bash
# 1. Conectar na VPS
ssh root@SEU_IP

# 2. Baixar e executar instalador
wget https://raw.githubusercontent.com/SEU_REPO/main/install.sh
chmod +x install.sh
sudo ./install.sh

# 3. Transferir código fonte (do seu PC)
rsync -avz ./src/ usuario@SEU_IP:~/bot-whatsapp/src/

# 4. Configurar .env
nano ~/bot-whatsapp/.env

# 5. Deploy
cd ~/bot-whatsapp
./deploy.sh
```

### Opção 2: Docker

```bash
# 1. Clonar repositório
git clone https://github.com/SEU_REPO/bot-whatsapp.git
cd bot-whatsapp

# 2. Configurar .env
cp .env.example .env
nano .env

# 3. Build e iniciar
docker-compose up -d

# 4. Ver logs
docker-compose logs -f
```

### Opção 3: Makefile

```bash
# Instalar dependências
make install

# Build
make build

# Iniciar
make start

# Ver logs
make logs

# Ver todos comandos
make help
```

## 📋 Requisitos

### Sistema
- **OS**: Ubuntu 20.04+ / Debian 11+
- **CPU**: 2 vCPUs (mínimo)
- **RAM**: 4 GB (mínimo) | 8 GB (recomendado)
- **Disco**: 20 GB SSD
- **Node.js**: 20.x LTS

### Dependências
- Node.js 20+
- npm ou yarn
- PM2 (para produção)
- Nginx (opcional, recomendado)
- Docker (opcional)

## 🔧 Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Compilar TypeScript
npm run build

# Iniciar compilado
npm start
```

## 📁 Estrutura do Projeto

```
bot-whatsapp/
├── src/
│   ├── index.ts                 # Arquivo principal
│   ├── interactive-messages.ts  # Sistema de carousels
│   ├── chat-history.ts          # Histórico de conversas
│   ├── leads/                   # Dados de leads (JSON)
│   └── chat-history/            # Histórico de conversas (JSON)
├── auth/                        # Autenticação WhatsApp
├── logs/                        # Logs da aplicação
├── dist/                        # Build TypeScript
├── nginx/                       # Configurações Nginx
│   ├── conf.d/
│   └── ssl/
├── Dockerfile                   # Container Docker
├── docker-compose.yml          # Orquestração
├── ecosystem.config.js         # Config PM2
├── install.sh                  # Auto-instalador
├── deploy.sh                   # Script de deploy
├── manage.sh                   # Gerenciamento
├── monitor.sh                  # Monitoramento
├── backup.sh                   # Backup automático
├── Makefile                    # Comandos simplificados
└── DEPLOY.md                   # Guia completo
```

## 📊 APIs Disponíveis

### Status e Monitoramento
```http
GET /api/status              # Status do bot
GET /api/stats               # Estatísticas gerais
```

### Leads
```http
GET /api/leads               # Listar todos leads
GET /api/leads/:number       # Detalhes de um lead
POST /api/send-message       # Enviar mensagem
```

### Histórico de Conversas
```http
GET /api/chat-history                    # Listar históricos
GET /api/chat-history/:number            # Histórico completo
GET /api/chat-history/:number/stats      # Estatísticas
GET /api/chat-history/:number/search?q=  # Buscar mensagens
GET /api/chat-history/:number/export     # Exportar Markdown
GET /api/chat-history/:number/ai-format  # Formato para IA
```

## 🔧 Comandos de Gerenciamento

### PM2 (Produção)
```bash
./manage.sh start     # Iniciar bot
./manage.sh stop      # Parar bot
./manage.sh restart   # Reiniciar bot
./manage.sh logs      # Ver logs
./manage.sh status    # Ver status
./manage.sh monit     # Monitoramento interativo
./manage.sh update    # Atualizar e reiniciar
```

### Docker
```bash
docker-compose up -d              # Iniciar
docker-compose down               # Parar
docker-compose logs -f            # Logs
docker-compose restart            # Reiniciar
docker-compose ps                 # Status
```

### Makefile
```bash
make help          # Ajuda
make install       # Instalar deps
make dev           # Modo dev
make build         # Compilar
make start         # Iniciar
make stop          # Parar
make restart       # Reiniciar
make logs          # Ver logs
make docker-up     # Docker up
make deploy-vps    # Deploy VPS
```

## 🌐 Acesso

Após o deploy, acesse:

- **Dashboard**: `http://SEU_IP:8001` ou `http://seu-dominio.com.br`
- **API Status**: `http://SEU_IP:8001/api/status`
- **Leads**: `http://SEU_IP:8001/api/leads`

## 🔐 Configuração .env

```env
# Porta do servidor
PORT=8001

# Ambiente
NODE_ENV=production

# Webhook N8N (opcional)
N8N_WEBHOOK_URL=https://n8nwebhook.multsolutions.com.br/webhook/bot-atendimento

# Número do atendente (formato internacional)
ATENDENTE_NUMBER=558584460424

# Chave secreta
SESSION_SECRET=sua-chave-secreta-aqui
```

## 📸 Screenshots

### Dashboard
![Dashboard](https://via.placeholder.com/800x400?text=Dashboard+Screenshot)

### Conversas
![Conversas](https://via.placeholder.com/800x400?text=Conversas+Screenshot)

### Carousel Interativo
![Carousel](https://via.placeholder.com/800x400?text=Carousel+Screenshot)

## 🧪 Testes

```bash
# Executar testes
npm test

# Coverage
npm run test:coverage

# Lint
npm run lint
```

## 📦 Build

```bash
# Build TypeScript
npm run build

# Build Docker
docker build -t bot-whatsapp .

# Build com compose
docker-compose build
```

## 🔄 Atualização

### Método 1: Git
```bash
cd ~/bot-whatsapp
git pull
npm install
npm run build
./manage.sh restart
```

### Método 2: Manual
```bash
# Do seu PC local
rsync -avz --delete ./src/ usuario@SEU_IP:~/bot-whatsapp/src/

# Na VPS
cd ~/bot-whatsapp
npm run build
./manage.sh restart
```

### Método 3: Docker
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 💾 Backup

### Automático
- Backup diário às 3h da manhã (via cron)
- Últimos 7 backups mantidos
- Arquivos: leads, histórico, auth, .env

### Manual
```bash
./backup.sh
```

### Restaurar
```bash
# Extrair backup
tar -xzf ~/bot-backups/backup_YYYYMMDD_HHMMSS.tar.gz

# Copiar para diretório do bot
cp -r src/leads ~/bot-whatsapp/src/
cp -r src/chat-history ~/bot-whatsapp/src/
cp -r auth ~/bot-whatsapp/
```

## 🆘 Troubleshooting

### Bot não inicia
```bash
# Ver logs completos
./manage.sh logs

# Verificar porta
sudo lsof -i :8001

# Limpar auth e reiniciar
rm -rf auth/*
./manage.sh restart
```

### QR Code não aparece
```bash
# Limpar sessão antiga
rm -rf auth/*

# Reiniciar
./manage.sh restart

# Acessar dashboard
http://SEU_IP:8001
```

### Erro de memória
```bash
# Ver uso de RAM
free -h

# Aumentar limite PM2
pm2 delete bot-whatsapp
pm2 start ecosystem.config.js --max-memory-restart 2G
```

### Nginx 502
```bash
# Verificar se bot está rodando
curl http://localhost:8001/api/status

# Testar config nginx
sudo nginx -t

# Reiniciar nginx
sudo systemctl restart nginx
```

## 📚 Documentação

- [DEPLOY.md](DEPLOY.md) - Guia completo de deploy
- [API.md](API.md) - Documentação das APIs
- [CONTRIBUTING.md](CONTRIBUTING.md) - Como contribuir

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Autores

- **Luan Silva** - *Desenvolvimento inicial* - [luandasilvaoh@gmail.com](mailto:luandasilvaoh@gmail.com)
- **MultSolutions** - *Organização* - [multsolutions.com.br](https://multsolutions.com.br)

## 🌟 Agradecimentos

- [Baileys](https://github.com/WhiskeySockets/Baileys) - Biblioteca WhatsApp
- [Whaileys](https://github.com/canove/whaileys) - Fork otimizado
- Comunidade Node.js
- Contribuidores do projeto

## 📞 Suporte

- **WhatsApp**: +55 21 96722-9853
- **Email**: contato@multsolutions.com.br
- **Site**: https://multsolutions.com.br
- **GitHub Issues**: [Reportar problema](https://github.com/SEU_REPO/issues)

## 🔗 Links Úteis

- [Documentação Baileys](https://github.com/WhiskeySockets/Baileys)
- [Node.js Docs](https://nodejs.org/docs)
- [PM2 Docs](https://pm2.keymetrics.io/docs)
- [Docker Docs](https://docs.docker.com)
- [Nginx Docs](https://nginx.org/en/docs)

---

**Desenvolvido com ❤️ pela [MultSolutions](https://multsolutions.com.br)**
