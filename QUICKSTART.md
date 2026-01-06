# ⚡ INÍCIO RÁPIDO - BOT WHATSAPP

## 🎯 3 Passos para Colocar no Ar

### 1️⃣ Na VPS

```bash
# Conectar via SSH
ssh root@SEU_IP

# Download e instalação automática
wget https://raw.githubusercontent.com/SEU_REPO/main/install.sh
chmod +x install.sh
sudo ./install.sh

# Aguarde 5-10 minutos
```

### 2️⃣ No Seu Computador

```bash
# Enviar código fonte
rsync -avz ./src/ usuario@SEU_IP:~/bot-whatsapp/src/
scp simular.png usuario@SEU_IP:~/bot-whatsapp/
scp qrcode-smart.html usuario@SEU_IP:~/bot-whatsapp/
```

### 3️⃣ De Volta na VPS

```bash
# Configurar .env
cd ~/bot-whatsapp
nano .env

# Edite:
# - ATENDENTE_NUMBER=5521967229853 (seu número)
# - SESSION_SECRET=uma-chave-aleatoria-123

# Deploy
./deploy.sh

# Pronto! Acesse:
# http://SEU_IP:8001
```

---

## 🚀 Alternativa: Docker (Ainda Mais Rápido)

```bash
# 1. Instalar Docker
curl -fsSL https://get.docker.com | sh

# 2. Baixar projeto
git clone https://github.com/SEU_REPO/bot-whatsapp.git
cd bot-whatsapp

# 3. Configurar
nano .env

# 4. Iniciar
docker-compose up -d

# 5. Ver logs
docker-compose logs -f
```

---

## 📱 Como Conectar o WhatsApp

1. Acesse `http://SEU_IP:8001` no navegador
2. Abra o WhatsApp no celular
3. Vá em **Configurações > Aparelhos Conectados > Conectar Aparelho**
4. Escaneie o QR Code que aparece na tela
5. ✅ **PRONTO!** Bot conectado!

---

## 🎮 Comandos Essenciais

```bash
# Ver status
./manage.sh status

# Ver logs em tempo real
./manage.sh logs

# Reiniciar bot
./manage.sh restart

# Monitoramento
./monitor.sh

# Backup manual
./backup.sh
```

---

## ❓ Problemas Comuns

### ❌ Bot não inicia

```bash
# Ver o que está errado
./manage.sh logs

# Limpar sessão antiga
rm -rf auth/*
./manage.sh restart
```

### ❌ QR Code não aparece

```bash
# Verificar se porta 8001 está aberta
sudo ufw allow 8001

# Reiniciar
./manage.sh restart
```

### ❌ "Cannot find module"

```bash
# Reinstalar dependências
cd ~/bot-whatsapp
npm install
npm run build
./manage.sh restart
```

---

## 🆘 Precisa de Ajuda?

- 📚 **Guia Completo**: Leia [DEPLOY.md](DEPLOY.md)
- 📞 **WhatsApp**: +55 21 96722-9853
- 📧 **Email**: contato@multsolutions.com.br
- 🐛 **Bug?**: Abra uma [Issue no GitHub](https://github.com/SEU_REPO/issues)

---

## ⚙️ Configurações Opcionais

### HTTPS (SSL)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado (GRÁTIS)
sudo certbot --nginx -d seu-dominio.com.br
```

### Domínio Personalizado

1. No painel do domínio, crie um registro A apontando para o IP da VPS
2. Aguarde propagação (5-60 minutos)
3. Configure HTTPS (acima)
4. Acesse: `https://bot.seu-dominio.com.br`

---

## 📊 Monitoramento

Acesse o dashboard:
- **Localhost**: `http://localhost:8001`
- **Remoto**: `http://SEU_IP:8001`
- **Domínio**: `https://bot.seu-dominio.com.br`

**APIs disponíveis:**
- `/api/status` - Status do bot
- `/api/stats` - Estatísticas
- `/api/leads` - Lista de leads
- `/api/chat-history` - Histórico de conversas

---

## 🎯 Checklist de Deploy

- [ ] VPS contratada e acessível via SSH
- [ ] Domínio configurado (opcional)
- [ ] `install.sh` executado com sucesso
- [ ] Código fonte transferido
- [ ] `.env` configurado
- [ ] `./deploy.sh` executado
- [ ] Dashboard acessível no navegador
- [ ] QR Code escaneado no WhatsApp
- [ ] Mensagem de teste enviada e recebida
- [ ] Firewall configurado (portas 22, 80, 443)
- [ ] HTTPS/SSL configurado (se usar domínio)
- [ ] Backup automático funcionando

---

**✅ Se todos os itens acima estão OK, seu bot está 100% operacional!**

---

## 🚀 Próximos Passos

1. **Personalize as mensagens** em `src/index.ts`
2. **Configure o webhook N8N** para integrações
3. **Adicione mais opções no menu** conforme sua necessidade
4. **Configure monitoramento** com PM2 Plus ou Grafana
5. **Escale horizontalmente** com múltiplas instâncias PM2
6. **Integre com CRM** usando as APIs disponíveis

---

**Documentação Completa**: [README.md](README.md) | [DEPLOY.md](DEPLOY.md)

**Desenvolvido por [MultSolutions](https://multsolutions.com.br)**
