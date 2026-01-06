#!/bin/bash

# ============================================
# 🐙 SETUP GITHUB - BOT WHATSAPP
# Prepara o repositório para push
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════╗
║   🐙 SETUP GITHUB                        ║
║   Preparando repositório...              ║
╚═══════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Verificar se está em um repositório Git
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Erro: Não é um repositório Git${NC}"
    echo "Execute: git init"
    exit 1
fi

echo -e "${GREEN}[1/8]${NC} Limpando arquivos sensíveis do Git..."

# Remover arquivos sensíveis do índice (mas manter localmente)
git rm --cached -r auth/ 2>/dev/null || true
git rm --cached -r src/leads/*.json 2>/dev/null || true
git rm --cached -r src/chat-history/*.json 2>/dev/null || true
git rm --cached .env 2>/dev/null || true
git rm --cached -r logs/*.log 2>/dev/null || true
git rm --cached -r node_modules/ 2>/dev/null || true
git rm --cached -r dist/ 2>/dev/null || true

echo -e "${GREEN}[2/8]${NC} Criando estrutura de pastas..."

# Criar pastas necessárias
mkdir -p src/leads
mkdir -p src/chat-history
mkdir -p auth
mkdir -p logs
mkdir -p nginx/conf.d
mkdir -p nginx/ssl
mkdir -p nginx/logs

echo -e "${GREEN}[3/8]${NC} Adicionando .gitkeep para manter pastas vazias..."

# Criar .gitkeep
touch src/leads/.gitkeep
touch src/chat-history/.gitkeep
touch auth/.gitkeep
touch logs/.gitkeep
touch nginx/conf.d/.gitkeep
touch nginx/ssl/.gitkeep
touch nginx/logs/.gitkeep

echo -e "${GREEN}[4/8]${NC} Verificando .gitignore..."

if [ ! -f ".gitignore" ]; then
    echo -e "${YELLOW}⚠️ .gitignore não encontrado. Criando...${NC}"
    
    cat > .gitignore << 'GITIGNORE'
# Dados sensíveis
.env
.env.*
auth/
src/leads/*.json
src/chat-history/*.json
backups/
*.tar.gz
*.zip

# Node.js
node_modules/
npm-debug.log*
yarn-error.log*

# TypeScript
dist/
build/
*.tsbuildinfo

# Logs
logs/
*.log
.pm2/

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# SSL
nginx/ssl/*.key
nginx/ssl/*.pem
nginx/ssl/*.crt

# Manter estrutura
!src/leads/.gitkeep
!src/chat-history/.gitkeep
!auth/.gitkeep
!logs/.gitkeep
GITIGNORE

    git add .gitignore
fi

echo -e "${GREEN}[5/8]${NC} Verificando .env.example..."

if [ ! -f ".env.example" ]; then
    echo -e "${YELLOW}⚠️ .env.example não encontrado. Criando template...${NC}"
    
    cat > .env.example << 'ENVEXAMPLE'
# Porta do servidor
PORT=8001

# Ambiente
NODE_ENV=production

# Webhook N8N (opcional)
N8N_WEBHOOK_URL=https://n8nwebhook.multsolutions.com.br/webhook/bot-atendimento

# Número do atendente
ATENDENTE_NUMBER=558584460424

# Chave secreta
SESSION_SECRET=change-this-secret-key
ENVEXAMPLE

    git add .env.example
fi

echo -e "${GREEN}[6/8]${NC} Adicionando arquivos .gitkeep..."

git add */.gitkeep 2>/dev/null || true
git add src/*/.gitkeep 2>/dev/null || true
git add nginx/*/.gitkeep 2>/dev/null || true

echo -e "${GREEN}[7/8]${NC} Verificando arquivos sensíveis..."

# Procurar por possíveis dados sensíveis
echo ""
echo -e "${YELLOW}🔍 Verificando dados sensíveis no código...${NC}"

SENSITIVE_FOUND=0

# Procurar por padrões suspeitos
if grep -r "password\s*=\s*[\"'].*[\"']" src/ 2>/dev/null | grep -v "example" | grep -v "placeholder"; then
    echo -e "${RED}⚠️ ATENÇÃO: Possível senha encontrada no código!${NC}"
    SENSITIVE_FOUND=1
fi

if grep -r "token\s*=\s*[\"'].*[\"']" src/ 2>/dev/null | grep -v "example" | grep -v "placeholder"; then
    echo -e "${RED}⚠️ ATENÇÃO: Possível token encontrado no código!${NC}"
    SENSITIVE_FOUND=1
fi

if grep -r "secret\s*=\s*[\"'].*[\"']" src/ 2>/dev/null | grep -v "example" | grep -v "placeholder" | grep -v "SESSION_SECRET"; then
    echo -e "${RED}⚠️ ATENÇÃO: Possível secret encontrado no código!${NC}"
    SENSITIVE_FOUND=1
fi

if [ $SENSITIVE_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ Nenhum dado sensível encontrado no código${NC}"
fi

echo ""
echo -e "${GREEN}[8/8]${NC} Criando commit de limpeza..."

# Status do Git
echo ""
echo -e "${BLUE}📊 Status do repositório:${NC}"
git status --short

echo ""
read -p "Deseja criar um commit com essas mudanças? (s/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Ss]$ ]]; then
    git add .gitignore .env.example */.gitkeep src/*/.gitkeep nginx/*/.gitkeep 2>/dev/null || true
    git commit -m "🧹 Limpa arquivos sensíveis e organiza estrutura

- Remove dados sensíveis (auth, leads, .env)
- Adiciona .gitignore correto
- Mantém estrutura de pastas com .gitkeep
- Adiciona .env.example como template"

    echo ""
    echo -e "${GREEN}✅ Commit criado com sucesso!${NC}"
else
    echo -e "${YELLOW}⚠️ Commit cancelado${NC}"
fi

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ✅ REPOSITÓRIO PREPARADO!              ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════╝${NC}"

echo ""
echo -e "${YELLOW}📋 PRÓXIMOS PASSOS:${NC}"
echo ""
echo "1. Revise as mudanças:"
echo -e "   ${GREEN}git status${NC}"
echo ""
echo "2. Adicione o remote (se ainda não tiver):"
echo -e "   ${GREEN}git remote add origin https://github.com/luandasilvaoh-creator/bot-whatsapp-botton.git${NC}"
echo ""
echo "3. Faça push para o GitHub:"
echo -e "   ${GREEN}git push -u origin main${NC}"
echo ""
echo "4. Configure GitHub Actions (opcional):"
echo -e "   ${GREEN}cp .github/workflows/deploy.yml.example .github/workflows/deploy.yml${NC}"
echo ""

echo -e "${GREEN}🎉 Repositório está seguro e pronto para o GitHub!${NC}"
