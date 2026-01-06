# ============================================
# 🐋 DOCKERFILE - BOT WHATSAPP MULT SOLUTIONS
# Multi-stage build para otimização
# ============================================

# Estágio 1: Build
FROM node:20-alpine AS builder

LABEL maintainer="MultSolutions <contato@multsolutions.com.br>"
LABEL description="Bot WhatsApp com Baileys/Whaileys"

# Instalar dependências de build
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    librsvg-dev

# Criar diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependências
RUN npm ci --only=production && \
    npm cache clean --force

# Copiar código fonte
COPY src ./src

# Compilar TypeScript
RUN npm install -g typescript && \
    npm run build

# ============================================
# Estágio 2: Produção
FROM node:20-alpine

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copiar dependências do builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Copiar arquivos adicionais necessários
COPY --chown=nodejs:nodejs qrcode-smart.html ./
COPY --chown=nodejs:nodejs simular.png ./

# Criar diretórios para dados persistentes
RUN mkdir -p /app/auth /app/src/leads /app/src/chat-history /app/logs && \
    chown -R nodejs:nodejs /app

# Mudar para usuário não-root
USER nodejs

# Expor porta
EXPOSE 8001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8001/api/status', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Variáveis de ambiente padrão
ENV NODE_ENV=production \
    PORT=8001

# Comando de inicialização
CMD ["node", "dist/index.js"]
