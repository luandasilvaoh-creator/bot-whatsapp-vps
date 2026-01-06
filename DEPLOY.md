# 🚀 GUIA DE DEPLOY - BOT WHATSAPP MULTSOLUTIONS

## 📋 Pré-requisitos

### VPS Recomendada
- **CPU**: 2 vCPUs (mínimo)
- **RAM**: 4 GB (mínimo) | 8 GB (recomendado)
- **Disco**: 20 GB SSD
- **OS**: Ubuntu 20.04+ ou Debian 11+
- **Rede**: IP fixo + Domínio (opcional)

### Provedores Recomendados
- DigitalOcean (Droplet $12/mês)
- Vultr (Cloud Compute $12/mês)
- Hetzner (CX21 €5/mês)
- Contabo (VPS S €5/mês)
- AWS Lightsail ($10/mês)

---

## 🎯 OPÇÃO 1: Auto-Instalador (Recomendado)

### 1. Preparar VPS

```bash
# Conectar via SSH
ssh root@SEU_IP

# Atualizar sistema
apt update && apt upgrade -y

# Criar usuário (opcional mas recomendado)
adduser botadmin
usermod -aG sudo botadmin
su - botadmin
```

### 2. Baixar e Executar Instalador

```bash
# Baixar instalador
wget https://raw.githubusercontent.com/SEU_REPO/main/install.sh

# Dar permissão de execução
chmod +x install.sh

# Executar como root
sudo ./install.sh
```

O instalador vai:
- ✅ Instalar Node.js 20
- ✅ Configurar PM2
- ✅ Configurar Nginx
- ✅ Configurar Firewall (UFW)
- ✅ Configurar Fail2Ban
- ✅ Criar estrutura de diretórios
- ✅ Configurar backup automático

### 3. Transferir Código Fonte

**Do seu computador local:**

```bash
# Enviar código fonte
rsync -avz --progress ./src/ usuario@SEU_IP:~/bot-whatsapp/src/

# Enviar arquivos extras
scp simular.png usuario@SEU_IP:~/bot-whatsapp/
scp qrcode-smart.html usuario@SEU_IP:~/bot-whatsapp/
```

### 4. Configurar .env

```bash
# Na VPS
cd ~/bot-whatsapp
nano .env
```

Adicionar:
```env
PORT=8001
NODE_ENV=production
N8N_WEBHOOK_URL=https://n8nwebhook.multsolutions.com.br/webhook/bot-atendimento
ATENDENTE_NUMBER=558584460424
SESSION_SECRET=sua-chave-secreta-aqui-123456
```

### 5. Compilar e Iniciar

```bash
cd ~/bot-whatsapp

# Compilar TypeScript
npm run build

# Iniciar bot com PM2
./manage.sh start

# Verificar logs
./manage.sh logs

# Ver status
./manage.sh status
```

### 6. Acessar Dashboard

```
http://SEU_IP:8001
ou
http://seu-dominio.com.br
```

---

## 🐋 OPÇÃO 2: Deploy com Docker

### 1. Instalar Docker na VPS

```bash
# Script oficial Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo apt install docker-compose -y

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Preparar Arquivos

```bash
# Criar diretório do projeto
mkdir -p ~/bot-whatsapp
cd ~/bot-whatsapp

# Transferir arquivos (do seu PC local)
scp -r ./* usuario@SEU_IP:~/bot-whatsapp/
```

### 3. Criar Estrutura Nginx

```bash
mkdir -p nginx/conf.d nginx/ssl nginx/logs

# Mover configuração
mv nginx-bot.conf nginx/conf.d/default.conf
```

### 4. Configurar .env

```bash
nano .env
```

Conteúdo:
```env
N8N_WEBHOOK_URL=https://n8nwebhook.multsolutions.com.br/webhook/bot-atendimento
ATENDENTE_NUMBER=558584460424
```

### 5. Build e Executar

```bash
# Build da imagem
docker-compose build

# Subir containers
docker-compose up -d

# Ver logs
docker-compose logs -f bot-whatsapp

# Ver status
docker-compose ps
```

### 6. Comandos Úteis Docker

```bash
# Parar containers
docker-compose down

# Reiniciar
docker-compose restart

# Ver logs específicos
docker-compose logs -f bot-whatsapp
docker-compose logs -f nginx

# Atualizar (rebuild)
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Limpar cache
docker system prune -a
```

---

## 🔐 Configurar HTTPS (SSL/TLS)

### Com Certbot (Let's Encrypt) - GRÁTIS

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado
sudo certbot --nginx -d seu-dominio.com.br

# Renovação automática (já configurado)
sudo certbot renew --dry-run
```

### Configuração Manual

1. Obter certificado de uma CA
2. Salvar em `/etc/nginx/ssl/`
3. Descomentar bloco HTTPS no nginx
4. Reiniciar nginx

---

## 📊 Monitoramento

### PM2 Monitor

```bash
# Dashboard interativo
./manage.sh monit

# Ver métricas
pm2 describe bot-whatsapp

# Logs em tempo real
pm2 logs bot-whatsapp --lines 100
```

### Docker Stats

```bash
# CPU/RAM em tempo real
docker stats

# Logs
docker-compose logs -f --tail=100 bot-whatsapp
```

### Nginx Logs

```bash
# Access logs
tail -f /var/log/nginx/bot-access.log

# Error logs
tail -f /var/log/nginx/bot-error.log
```

---

## 🔧 Manutenção

### Backup Manual

```bash
cd ~/bot-whatsapp
./backup.sh
```

### Atualizar Código

```bash
# Método 1: Git
cd ~/bot-whatsapp
git pull
npm install
npm run build
./manage.sh restart

# Método 2: rsync (do seu PC)
rsync -avz --delete ./src/ usuario@SEU_IP:~/bot-whatsapp/src/
ssh usuario@SEU_IP "cd ~/bot-whatsapp && npm run build && ./manage.sh restart"
```

### Limpar Logs Antigos

```bash
# Limpar logs PM2
pm2 flush

# Limpar logs do bot
rm -f ~/bot-whatsapp/logs/*.log

# Limpar logs Nginx
sudo truncate -s 0 /var/log/nginx/*.log
```

---

## 🛡️ Segurança

### Firewall

```bash
# Ver regras
sudo ufw status

# Bloquear IP específico
sudo ufw deny from IP_MALICIOSO

# Permitir apenas IPs específicos no SSH
sudo ufw delete allow 22
sudo ufw allow from SEU_IP to any port 22
```

### Fail2Ban

```bash
# Ver status
sudo fail2ban-client status

# Ver banimentos
sudo fail2ban-client status sshd

# Desbanir IP
sudo fail2ban-client set sshd unbanip IP_AQUI
```

### Atualizar Dependências

```bash
cd ~/bot-whatsapp

# Verificar vulnerabilidades
npm audit

# Corrigir vulnerabilidades
npm audit fix

# Atualizar dependências
npm update
```

---

## 📈 Escalabilidade

### Aumentar Recursos

```bash
# Aumentar limite de memória PM2
pm2 delete bot-whatsapp
pm2 start ecosystem.config.js --max-memory-restart 2G

# Ver uso de recursos
pm2 monit
```

### Load Balancer (Múltiplas Instâncias)

```bash
# Editar ecosystem.config.js
# Alterar: instances: 2 (ou 4)

pm2 reload ecosystem.config.js
```

### Redis para Sessões (Avançado)

```bash
# Instalar Redis
sudo apt install redis-server -y

# No código, usar redis-session-store
npm install redis connect-redis express-session
```

---

## 🆘 Troubleshooting

### Bot não inicia

```bash
# Ver logs completos
./manage.sh logs

# Verificar porta
sudo lsof -i :8001

# Matar processo se necessário
sudo kill -9 $(lsof -t -i:8001)
```

### QR Code não aparece

```bash
# Limpar auth antiga
rm -rf ~/bot-whatsapp/auth/*

# Reiniciar
./manage.sh restart
```

### Erro de memória

```bash
# Ver uso de RAM
free -h

# Aumentar swap (se necessário)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Nginx erro 502

```bash
# Verificar se bot está rodando
curl http://localhost:8001/api/status

# Testar config nginx
sudo nginx -t

# Reiniciar nginx
sudo systemctl restart nginx
```

---

## 📞 Suporte

- **Documentação**: https://multsolutions.com.br/docs
- **GitHub**: https://github.com/multsolutions
- **WhatsApp**: +55 21 96722-9853
- **Email**: contato@multsolutions.com.br

---

## 📝 Checklist Final

- [ ] VPS configurada e acessível via SSH
- [ ] Domínio apontando para IP (opcional)
- [ ] Instalador executado com sucesso
- [ ] Código fonte transferido
- [ ] .env configurado
- [ ] Bot compilado (npm run build)
- [ ] Bot iniciado (./manage.sh start)
- [ ] Dashboard acessível via browser
- [ ] QR Code escaneado no WhatsApp
- [ ] Teste de mensagem funcionando
- [ ] HTTPS configurado (se usar domínio)
- [ ] Firewall ativo
- [ ] Backup automático configurado
- [ ] Monitoramento ativo (PM2/Docker)

---

**🎉 Deploy concluído! Seu bot está no ar!**
