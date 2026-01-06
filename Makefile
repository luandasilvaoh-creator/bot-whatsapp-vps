# ============================================
# MAKEFILE - BOT WHATSAPP MULTSOLUTIONS
# Comandos simplificados para desenvolvimento e deploy
# ============================================

.PHONY: help install dev build start stop restart logs status clean backup deploy docker-build docker-up docker-down docker-logs

# Variáveis
COMPOSE = docker-compose
NPM = npm
PM2 = pm2

# Cores
RED = \033[0;31m
GREEN = \033[0;32m
YELLOW = \033[1;33m
BLUE = \033[0;34m
NC = \033[0m # No Color

help: ## 📋 Exibe ajuda
	@echo "$(BLUE)╔═══════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║   🤖 BOT WHATSAPP MULT SOLUTIONS         ║$(NC)"
	@echo "$(BLUE)║   Comandos Disponíveis                   ║$(NC)"
	@echo "$(BLUE)╚═══════════════════════════════════════════╝$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""

install: ## 📦 Instalar dependências
	@echo "$(BLUE)📦 Instalando dependências...$(NC)"
	$(NPM) install

dev: ## 🛠️ Executar em modo desenvolvimento
	@echo "$(BLUE)🛠️ Iniciando modo desenvolvimento...$(NC)"
	$(NPM) run dev

build: ## 🔨 Compilar TypeScript
	@echo "$(BLUE)🔨 Compilando TypeScript...$(NC)"
	$(NPM) run build

start: build ## 🚀 Iniciar bot (PM2)
	@echo "$(GREEN)🚀 Iniciando bot...$(NC)"
	$(PM2) start ecosystem.config.js

stop: ## 🛑 Parar bot
	@echo "$(YELLOW)🛑 Parando bot...$(NC)"
	$(PM2) stop bot-whatsapp

restart: build ## 🔄 Reiniciar bot
	@echo "$(YELLOW)🔄 Reiniciando bot...$(NC)"
	$(PM2) restart bot-whatsapp

logs: ## 📋 Ver logs do bot
	@echo "$(BLUE)📋 Exibindo logs...$(NC)"
	$(PM2) logs bot-whatsapp

status: ## 📊 Ver status do bot
	@echo "$(BLUE)📊 Status do bot:$(NC)"
	$(PM2) status

clean: ## 🧹 Limpar arquivos temporários
	@echo "$(YELLOW)🧹 Limpando arquivos temporários...$(NC)"
	rm -rf dist/
	rm -rf node_modules/
	rm -rf logs/*.log
	@echo "$(GREEN)✅ Limpeza concluída$(NC)"

backup: ## 💾 Criar backup
	@echo "$(BLUE)💾 Criando backup...$(NC)"
	@./backup.sh || echo "$(RED)❌ Script backup.sh não encontrado$(NC)"

# ============================================
# COMANDOS DOCKER
# ============================================

docker-build: ## 🐋 Build da imagem Docker
	@echo "$(BLUE)🐋 Building Docker image...$(NC)"
	$(COMPOSE) build

docker-up: ## ▶️ Subir containers
	@echo "$(GREEN)▶️ Iniciando containers...$(NC)"
	$(COMPOSE) up -d
	@echo "$(GREEN)✅ Containers iniciados$(NC)"
	@$(COMPOSE) ps

docker-down: ## ⏹️ Parar containers
	@echo "$(YELLOW)⏹️ Parando containers...$(NC)"
	$(COMPOSE) down

docker-restart: docker-down docker-up ## 🔄 Reiniciar containers

docker-logs: ## 📋 Ver logs Docker
	@echo "$(BLUE)📋 Logs dos containers:$(NC)"
	$(COMPOSE) logs -f --tail=50

docker-status: ## 📊 Status dos containers
	@echo "$(BLUE)📊 Status:$(NC)"
	$(COMPOSE) ps

docker-shell: ## 🐚 Acessar shell do container
	@echo "$(BLUE)🐚 Acessando container...$(NC)"
	$(COMPOSE) exec bot-whatsapp sh

docker-clean: ## 🧹 Limpar Docker
	@echo "$(YELLOW)🧹 Limpando Docker...$(NC)"
	$(COMPOSE) down -v
	docker system prune -af
	@echo "$(GREEN)✅ Docker limpo$(NC)"

# ============================================
# DEPLOY
# ============================================

deploy-prepare: ## 🎯 Preparar para deploy
	@echo "$(BLUE)🎯 Preparando para deploy...$(NC)"
	@echo "$(YELLOW)Verificando dependências...$(NC)"
	@which node || (echo "$(RED)❌ Node.js não instalado$(NC)" && exit 1)
	@which npm || (echo "$(RED)❌ npm não instalado$(NC)" && exit 1)
	@echo "$(GREEN)✅ Dependências OK$(NC)"
	@echo "$(YELLOW)Instalando dependências...$(NC)"
	$(NPM) ci --only=production
	@echo "$(YELLOW)Compilando...$(NC)"
	$(NPM) run build
	@echo "$(GREEN)✅ Pronto para deploy!$(NC)"

deploy-vps: deploy-prepare ## 🚀 Deploy completo na VPS
	@echo "$(GREEN)🚀 Realizando deploy na VPS...$(NC)"
	$(PM2) delete bot-whatsapp || true
	$(PM2) start ecosystem.config.js
	$(PM2) save
	$(PM2) startup
	@echo "$(GREEN)✅ Deploy concluído!$(NC)"

deploy-docker: ## 🐋 Deploy com Docker
	@echo "$(GREEN)🐋 Deploy com Docker...$(NC)"
	$(COMPOSE) down
	$(COMPOSE) build --no-cache
	$(COMPOSE) up -d
	@echo "$(GREEN)✅ Deploy Docker concluído!$(NC)"

# ============================================
# TESTES
# ============================================

test: ## 🧪 Executar testes
	@echo "$(BLUE)🧪 Executando testes...$(NC)"
	$(NPM) test || echo "$(YELLOW)⚠️ Testes não configurados$(NC)"

lint: ## 🔍 Verificar código
	@echo "$(BLUE)🔍 Verificando código...$(NC)"
	$(NPM) run lint || echo "$(YELLOW)⚠️ Linter não configurado$(NC)"

# ============================================
# MANUTENÇÃO
# ============================================

update: ## ⬆️ Atualizar dependências
	@echo "$(BLUE)⬆️ Atualizando dependências...$(NC)"
	$(NPM) update
	@echo "$(GREEN)✅ Dependências atualizadas$(NC)"

audit: ## 🔐 Auditar segurança
	@echo "$(BLUE)🔐 Auditando dependências...$(NC)"
	$(NPM) audit

audit-fix: ## 🔧 Corrigir vulnerabilidades
	@echo "$(YELLOW)🔧 Corrigindo vulnerabilidades...$(NC)"
	$(NPM) audit fix

# ============================================
# INFORMAÇÕES
# ============================================

info: ## ℹ️ Informações do sistema
	@echo "$(BLUE)╔═══════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║   ℹ️  INFORMAÇÕES DO SISTEMA              ║$(NC)"
	@echo "$(BLUE)╚═══════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(GREEN)Node.js:$(NC)"
	@node -v || echo "$(RED)Não instalado$(NC)"
	@echo ""
	@echo "$(GREEN)npm:$(NC)"
	@npm -v || echo "$(RED)Não instalado$(NC)"
	@echo ""
	@echo "$(GREEN)PM2:$(NC)"
	@pm2 -v || echo "$(RED)Não instalado$(NC)"
	@echo ""
	@echo "$(GREEN)Docker:$(NC)"
	@docker -v || echo "$(RED)Não instalado$(NC)"
	@echo ""
	@echo "$(GREEN)Docker Compose:$(NC)"
	@docker-compose -v || echo "$(RED)Não instalado$(NC)"
	@echo ""

version: ## 📌 Ver versão do bot
	@echo "$(BLUE)📌 Versão do Bot:$(NC)"
	@cat package.json | grep version | head -1 | awk -F: '{ print $$2 }' | sed 's/[",]//g'

# ============================================
# DOCUMENTAÇÃO
# ============================================

docs: ## 📚 Abrir documentação
	@echo "$(BLUE)📚 Abrindo documentação...$(NC)"
	@xdg-open DEPLOY.md 2>/dev/null || open DEPLOY.md 2>/dev/null || echo "$(YELLOW)Abra manualmente: DEPLOY.md$(NC)"

# Default target
.DEFAULT_GOAL := help
