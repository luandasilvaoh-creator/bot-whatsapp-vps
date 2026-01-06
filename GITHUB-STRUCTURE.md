# 📦 ESTRUTURA DO REPOSITÓRIO GITHUB

## ✅ O QUE DEVE ESTAR NO GITHUB

```
bot-whatsapp/
├── 📄 README.md                    ✅ SIM - Documentação principal
├── 📄 QUICKSTART.md                ✅ SIM - Guia rápido
├── 📄 DEPLOY.md                    ✅ SIM - Guia de deploy
├── 📄 LICENSE                      ✅ SIM - Licença do projeto
├── 📄 .gitignore                   ✅ SIM - Arquivos a ignorar
├── 📄 .env.example                 ✅ SIM - Template de variáveis
├── 📄 .dockerignore                ✅ SIM - Arquivos Docker
│
├── 📦 package.json                 ✅ SIM - Dependências
├── 📦 package-lock.json            ✅ SIM - Lock de dependências
├── 📦 tsconfig.json                ✅ SIM - Config TypeScript
├── 📦 ecosystem.config.js          ✅ SIM - Config PM2
│
├── 🐋 Dockerfile                   ✅ SIM - Container
├── 🐋 docker-compose.yml           ✅ SIM - Orquestração
│
├── 📜 install.sh                   ✅ SIM - Auto-instalador
├── 📜 deploy.sh                    ✅ SIM - Deploy rápido
├── 📜 manage.sh                    ✅ SIM - Gerenciamento
├── 📜 monitor.sh                   ✅ SIM - Monitoramento
├── 📜 backup.sh                    ✅ SIM - Backup
├── 📜 Makefile                     ✅ SIM - Comandos
│
├── 📁 src/                         ✅ SIM - Código fonte
│   ├── 📄 index.ts                 ✅ SIM - Arquivo principal
│   ├── 📄 interactive-messages.ts  ✅ SIM - Sistema de carousels
│   ├── 📄 chat-history.ts          ✅ SIM - Histórico
│   │
│   ├── 📁 leads/                   ✅ PASTA (vazia)
│   │   └── .gitkeep                ✅ SIM - Manter pasta
│   │
│   └── 📁 chat-history/            ✅ PASTA (vazia)
│       └── .gitkeep                ✅ SIM - Manter pasta
│
├── 📁 nginx/                       ✅ SIM - Config Nginx
│   ├── 📄 nginx-bot.conf           ✅ SIM - Configuração
│   ├── 📁 conf.d/                  ✅ PASTA (vazia)
│   │   └── .gitkeep                ✅ SIM
│   ├── 📁 ssl/                     ✅ PASTA (vazia)
│   │   └── .gitkeep                ✅ SIM
│   └── 📁 logs/                    ✅ PASTA (vazia)
│       └── .gitkeep                ✅ SIM
│
├── 📁 auth/                        ✅ PASTA (vazia)
│   └── .gitkeep                    ✅ SIM - Manter pasta
│
├── 📁 logs/                        ✅ PASTA (vazia)
│   └── .gitkeep                    ✅ SIM - Manter pasta
│
├── 🖼️ simular.png                  ✅ SIM - Imagem do bot
├── 🖼️ qrcode-smart.html            ✅ SIM - Dashboard
│
└── 📁 .github/                     ✅ SIM - GitHub configs
    ├── workflows/
    │   └── deploy.yml              ✅ SIM - CI/CD (opcional)
    ├── ISSUE_TEMPLATE/
    └── PULL_REQUEST_TEMPLATE.md
```

---

## ❌ O QUE **NUNCA** DEVE ESTAR NO GITHUB

### 🔒 **DADOS SENSÍVEIS** (Risco de Segurança!)

```
❌ .env                           # Variáveis com senhas/tokens
❌ auth/*                         # Sessão do WhatsApp
❌ src/leads/*.json               # Dados pessoais dos clientes
❌ src/chat-history/*.json        # Conversas (LGPD)
❌ backups/*.tar.gz               # Backups com dados
❌ nginx/ssl/*.key                # Chaves SSL privadas
❌ *.pem, *.crt, *.p12           # Certificados
```

### 📦 **ARQUIVOS GERADOS** (Desnecessários)

```
❌ node_modules/                  # Dependências (npm install)
❌ dist/                          # Build TypeScript
❌ logs/*.log                     # Logs da aplicação
❌ .pm2/                          # Config PM2 local
❌ *.tmp, tmp/                    # Temporários
❌ coverage/                      # Coverage de testes
```

### 💻 **ARQUIVOS DO SISTEMA/IDE**

```
❌ .DS_Store                      # MacOS
❌ Thumbs.db                      # Windows
❌ .vscode/ (com configs locais)  # VSCode
❌ .idea/                         # JetBrains
```

---

## 🛠️ COMANDOS PARA LIMPAR REPOSITÓRIO

### Se você já commitou arquivos sensíveis:

```bash
# ⚠️ ATENÇÃO: Isso reescreve o histórico do Git!

# 1. Remover .env do histórico
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# 2. Remover pasta auth/
git filter-branch --force --index-filter \
  "git rm -rf --cached --ignore-unmatch auth" \
  --prune-empty --tag-name-filter cat -- --all

# 3. Remover leads/
git filter-branch --force --index-filter \
  "git rm -rf --cached --ignore-unmatch src/leads/*.json" \
  --prune-empty --tag-name-filter cat -- --all

# 4. Force push (⚠️ cuidado!)
git push origin --force --all
git push origin --force --tags

# 5. Limpar localmente
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### Alternativa mais segura (Git BFG):

```bash
# Instalar BFG
brew install bfg  # Mac
sudo apt install bfg  # Linux

# Remover arquivos grandes/sensíveis
bfg --delete-files .env
bfg --delete-files '*.json' --no-blob-protection
bfg --delete-folders auth

# Limpar
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

---

## 📋 PASSO A PASSO PARA ORGANIZAR

### 1️⃣ Limpar repositório atual

```bash
cd ~/bot-whatsapp

# Remover do índice (mas manter local)
git rm --cached -r auth/
git rm --cached -r src/leads/*.json
git rm --cached -r src/chat-history/*.json
git rm --cached .env
git rm --cached -r logs/*.log
git rm --cached -r node_modules/

# Commit
git commit -m "🧹 Remove arquivos sensíveis e gerados"
```

### 2️⃣ Adicionar .gitignore correto

```bash
# Copiar o .gitignore que criei
cp .gitignore ~/bot-whatsapp/

# Adicionar ao Git
git add .gitignore
git commit -m "➕ Adiciona .gitignore correto"
```

### 3️⃣ Criar arquivos .gitkeep para pastas vazias

```bash
cd ~/bot-whatsapp

# Criar .gitkeep nas pastas que devem existir mas vazias
touch src/leads/.gitkeep
touch src/chat-history/.gitkeep
touch auth/.gitkeep
touch logs/.gitkeep
touch nginx/ssl/.gitkeep
touch nginx/logs/.gitkeep

# Adicionar
git add */.gitkeep
git commit -m "📁 Adiciona estrutura de pastas com .gitkeep"
```

### 4️⃣ Adicionar arquivos de deploy

```bash
# Copiar os arquivos que criei
cp install.sh deploy.sh monitor.sh backup.sh ~/bot-whatsapp/
cp Dockerfile docker-compose.yml nginx-bot.conf ~/bot-whatsapp/
cp Makefile ecosystem.config.js ~/bot-whatsapp/
cp README.md DEPLOY.md QUICKSTART.md ~/bot-whatsapp/
cp .env.example ~/bot-whatsapp/

# Dar permissão
chmod +x ~/bot-whatsapp/*.sh

# Adicionar
cd ~/bot-whatsapp
git add *.sh *.md Dockerfile docker-compose.yml nginx-bot.conf Makefile ecosystem.config.js .env.example
git commit -m "🚀 Adiciona sistema completo de deploy"
```

### 5️⃣ Push para GitHub

```bash
git push origin main
```

---

## 🎯 ESTRUTURA FINAL NO GITHUB

Seu repositório deve ficar assim:

```
https://github.com/luandasilvaoh-creator/bot-whatsapp-botton/

📦 bot-whatsapp-botton
├── 📄 README.md (12 KB)
├── 📄 DEPLOY.md (8 KB)
├── 📄 QUICKSTART.md (4 KB)
├── 📄 LICENSE
├── 📄 .gitignore
├── 📄 .env.example
├── 📦 package.json
├── 📦 tsconfig.json
├── 📦 ecosystem.config.js
├── 🐋 Dockerfile
├── 🐋 docker-compose.yml
├── 📜 install.sh ⭐
├── 📜 deploy.sh
├── 📜 manage.sh
├── 📜 monitor.sh
├── 📜 backup.sh
├── 📜 Makefile
├── 📁 src/
│   ├── index.ts
│   ├── interactive-messages.ts
│   ├── chat-history.ts
│   ├── leads/.gitkeep
│   └── chat-history/.gitkeep
├── 📁 nginx/
│   ├── nginx-bot.conf
│   ├── conf.d/.gitkeep
│   ├── ssl/.gitkeep
│   └── logs/.gitkeep
├── auth/.gitkeep
├── logs/.gitkeep
├── simular.png
└── qrcode-smart.html
```

**Total: ~25 arquivos | ~50 KB (sem node_modules)**

---

## 🔒 SEGURANÇA - CHECKLIST

Antes de fazer push, verifique:

- [ ] Não há arquivo `.env` no repositório
- [ ] Pasta `auth/` está vazia (só .gitkeep)
- [ ] Pasta `src/leads/` está vazia
- [ ] Pasta `src/chat-history/` está vazia
- [ ] Não há `node_modules/` no repositório
- [ ] Não há arquivos `*.log` commitados
- [ ] `.gitignore` está presente e correto
- [ ] `.env.example` não contém dados reais
- [ ] Certificados SSL não estão no repositório

### Comando para verificar:

```bash
# Ver o que será enviado
git status

# Ver tamanho do repositório
du -sh .git

# Procurar por dados sensíveis
grep -r "password\|token\|secret\|key" . --exclude-dir={.git,node_modules}
```

---

## 📌 COMANDOS ÚTEIS

```bash
# Ver status
git status

# Ver o que está sendo ignorado
git status --ignored

# Ver todos arquivos tracked
git ls-files

# Remover um arquivo do histórico
git filter-branch --tree-filter 'rm -f path/to/file' HEAD

# Ver tamanho dos arquivos no repo
git rev-list --objects --all | \
  git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | \
  awk '/^blob/ {print substr($0,6)}' | \
  sort --numeric-sort --key=2 | \
  tail -20
```

---

## 🆘 SE VOCÊ JÁ COMMITOU DADOS SENSÍVEIS

1. **Trocar todas senhas/tokens imediatamente**
2. **Revogar chaves de API**
3. **Limpar histórico do Git (comandos acima)**
4. **Force push (com cuidado)**
5. **Adicionar .gitignore correto**
6. **Nunca mais commitar .env!**

---

## ✅ PRONTO!

Agora seu repositório está:
- 🔒 **Seguro** - Sem dados sensíveis
- 🚀 **Completo** - Todos arquivos de deploy
- 📦 **Limpo** - Sem arquivos desnecessários
- 📚 **Documentado** - READMEs completos

**Clone e deploy:**
```bash
git clone https://github.com/luandasilvaoh-creator/bot-whatsapp-botton.git
cd bot-whatsapp-botton
./install.sh
```
