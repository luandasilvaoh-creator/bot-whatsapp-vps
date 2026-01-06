#!/bin/bash

# ============================================
# 📊 MONITOR - BOT WHATSAPP
# Monitoramento contínuo do bot
# ============================================

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

PORT=8001
API_URL="http://localhost:$PORT/api/status"

clear

echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════╗
║   📊 MONITOR - BOT WHATSAPP              ║
║   Monitoramento em Tempo Real            ║
╚═══════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Função para verificar se o bot está online
check_bot_status() {
    if curl -s --max-time 5 $API_URL > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Função para obter métricas
get_metrics() {
    curl -s $API_URL 2>/dev/null || echo "{}"
}

# Função para obter stats
get_stats() {
    curl -s "http://localhost:$PORT/api/stats" 2>/dev/null || echo "{}"
}

# Função para formatar uptime
format_uptime() {
    local seconds=$1
    local days=$((seconds / 86400))
    local hours=$(((seconds % 86400) / 3600))
    local minutes=$(((seconds % 3600) / 60))
    
    if [ $days -gt 0 ]; then
        echo "${days}d ${hours}h ${minutes}m"
    elif [ $hours -gt 0 ]; then
        echo "${hours}h ${minutes}m"
    else
        echo "${minutes}m"
    fi
}

# Loop de monitoramento
while true; do
    clear
    
    echo -e "${BLUE}╔═══════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║   📊 MONITOR - BOT WHATSAPP              ║${NC}"
    echo -e "${BLUE}║   $(date '+%d/%m/%Y %H:%M:%S')                   ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════╝${NC}"
    echo ""
    
    # Status do Bot
    echo -e "${CYAN}🤖 STATUS DO BOT:${NC}"
    if check_bot_status; then
        echo -e "   ${GREEN}● ONLINE${NC}"
        
        metrics=$(get_metrics)
        status=$(echo $metrics | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        
        echo -e "   Status: ${GREEN}$status${NC}"
    else
        echo -e "   ${RED}● OFFLINE${NC}"
        echo -e "   ${YELLOW}⚠️ Bot não está respondendo${NC}"
    fi
    
    echo ""
    
    # PM2 Status
    echo -e "${CYAN}⚙️ PM2 STATUS:${NC}"
    pm2 jlist 2>/dev/null | grep -q "bot-whatsapp" && {
        pm2_status=$(pm2 jlist | jq -r '.[] | select(.name=="bot-whatsapp") | .pm2_env.status')
        pm2_memory=$(pm2 jlist | jq -r '.[] | select(.name=="bot-whatsapp") | .monit.memory' | numfmt --to=iec-i --suffix=B)
        pm2_cpu=$(pm2 jlist | jq -r '.[] | select(.name=="bot-whatsapp") | .monit.cpu')
        pm2_restarts=$(pm2 jlist | jq -r '.[] | select(.name=="bot-whatsapp") | .pm2_env.restart_time')
        pm2_uptime=$(pm2 jlist | jq -r '.[] | select(.name=="bot-whatsapp") | .pm2_env.pm_uptime')
        
        now=$(date +%s)
        uptime_seconds=$(( (now - pm2_uptime/1000) ))
        uptime_formatted=$(format_uptime $uptime_seconds)
        
        if [ "$pm2_status" = "online" ]; then
            echo -e "   Status: ${GREEN}$pm2_status${NC}"
        else
            echo -e "   Status: ${RED}$pm2_status${NC}"
        fi
        
        echo -e "   Memória: ${YELLOW}$pm2_memory${NC}"
        echo -e "   CPU: ${YELLOW}$pm2_cpu%${NC}"
        echo -e "   Uptime: ${CYAN}$uptime_formatted${NC}"
        echo -e "   Restarts: ${YELLOW}$pm2_restarts${NC}"
    } || {
        echo -e "   ${RED}PM2 não encontrado ou bot não está rodando${NC}"
    }
    
    echo ""
    
    # Estatísticas
    echo -e "${CYAN}📈 ESTATÍSTICAS:${NC}"
    stats=$(get_stats)
    
    if [ ! -z "$stats" ] && [ "$stats" != "{}" ]; then
        total_leads=$(echo $stats | grep -o '"totalLeads":[0-9]*' | cut -d':' -f2)
        total_interactions=$(echo $stats | grep -o '"totalInteractions":[0-9]*' | cut -d':' -f2)
        
        echo -e "   Total de Leads: ${GREEN}${total_leads:-0}${NC}"
        echo -e "   Total de Interações: ${GREEN}${total_interactions:-0}${NC}"
    else
        echo -e "   ${YELLOW}Estatísticas não disponíveis${NC}"
    fi
    
    echo ""
    
    # Sistema
    echo -e "${CYAN}💻 SISTEMA:${NC}"
    
    # CPU
    cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    echo -e "   CPU Total: ${YELLOW}${cpu_usage}%${NC}"
    
    # Memória
    mem_total=$(free -h | awk '/^Mem:/ {print $2}')
    mem_used=$(free -h | awk '/^Mem:/ {print $3}')
    mem_percent=$(free | awk '/^Mem:/ {printf "%.1f", $3/$2 * 100}')
    echo -e "   RAM: ${YELLOW}${mem_used}/${mem_total}${NC} (${mem_percent}%)"
    
    # Disco
    disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    disk_used=$(df -h / | awk 'NR==2 {print $3}')
    disk_total=$(df -h / | awk 'NR==2 {print $2}')
    echo -e "   Disco: ${YELLOW}${disk_used}/${disk_total}${NC} (${disk_usage}%)"
    
    echo ""
    
    # Últimos logs (últimas 5 linhas)
    echo -e "${CYAN}📋 ÚLTIMOS LOGS:${NC}"
    if [ -f "./logs/pm2-out.log" ]; then
        tail -n 5 ./logs/pm2-out.log | while read line; do
            echo -e "   ${line:0:80}"
        done
    else
        echo -e "   ${YELLOW}Nenhum log disponível${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}╚═══════════════════════════════════════════╝${NC}"
    echo -e "${CYAN}Atualizando em 5 segundos... (Ctrl+C para sair)${NC}"
    
    sleep 5
done
