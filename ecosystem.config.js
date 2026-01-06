// ============================================
// PM2 ECOSYSTEM CONFIG
// Configuração otimizada para produção
// ============================================

module.exports = {
  apps: [
    {
      // ============================================
      // BOT PRINCIPAL
      // ============================================
      name: 'bot-whatsapp',
      script: './dist/index.js',
      
      // ============================================
      // CLUSTER MODE (descomente para escalar)
      // ============================================
      instances: 1, // ou 'max' para usar todos CPUs
      exec_mode: 'fork', // ou 'cluster' para múltiplas instâncias
      
      // ============================================
      // RECURSOS
      // ============================================
      max_memory_restart: '1G', // Reinicia se passar de 1GB RAM
      min_uptime: '10s', // Tempo mínimo antes de considerar "online"
      max_restarts: 10, // Máximo de restarts em 1 minuto
      
      // ============================================
      // COMPORTAMENTO
      // ============================================
      autorestart: true, // Reiniciar automaticamente se cair
      watch: false, // Não reiniciar ao detectar mudanças em arquivos
      ignore_watch: [
        'node_modules',
        'logs',
        'auth',
        'src/leads',
        'src/chat-history',
      ],
      
      // ============================================
      // LOGS
      // ============================================
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true, // Combinar logs de todas instâncias
      log_type: 'json', // ou 'json' para logs estruturados
      
      // ============================================
      // VARIÁVEIS DE AMBIENTE
      // ============================================
      env: {
        NODE_ENV: 'development',
        PORT: 8001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 8001,
      },
      
      // ============================================
      // AVANÇADO
      // ============================================
      kill_timeout: 5000, // Tempo para matar processo
      listen_timeout: 10000, // Timeout para listen
      shutdown_with_message: true,
      
      // ============================================
      // RESTART STRATEGIES
      // ============================================
      exp_backoff_restart_delay: 100, // Delay exponencial entre restarts
      restart_delay: 4000, // Delay fixo entre restarts (4s)
      
      // ============================================
      // MONITORING (PM2 Plus - opcional)
      // ============================================
      // pmx: true,
      // instance_var: 'INSTANCE_ID',
      
      // ============================================
      // CRON (REINICIAR DIARIAMENTE - OPCIONAL)
      // ============================================
      // cron_restart: '0 3 * * *', // Reinicia todo dia às 3h
      
      // ============================================
      // NODE.JS OPTIONS
      // ============================================
      node_args: [
        '--max-old-space-size=2048', // Limita heap do Node.js a 2GB
        '--max-http-header-size=16384', // Headers maiores se necessário
      ],
      
      // ============================================
      // SOURCE MAP SUPPORT
      // ============================================
      source_map_support: true,
      
      // ============================================
      // TIME
      // ============================================
      time: true, // Adiciona timestamp nos logs
      
      // ============================================
      // INTERPRETER (Node.js path - opcional)
      // ============================================
      // interpreter: '/usr/bin/node',
      
      // ============================================
      // WAIT READY (se usar processos que demoram a iniciar)
      // ============================================
      wait_ready: false,
      // listen_timeout: 10000,
    },
    
    // ============================================
    // WORKER DE BACKUP (OPCIONAL)
    // ============================================
    // {
    //   name: 'backup-worker',
    //   script: './dist/workers/backup.js',
    //   instances: 1,
    //   exec_mode: 'fork',
    //   autorestart: false,
    //   cron_restart: '0 3 * * *', // Todo dia às 3h
    //   env: {
    //     NODE_ENV: 'production',
    //   },
    // },
    
    // ============================================
    // WORKER DE LIMPEZA DE LOGS (OPCIONAL)
    // ============================================
    // {
    //   name: 'cleanup-worker',
    //   script: './dist/workers/cleanup.js',
    //   instances: 1,
    //   exec_mode: 'fork',
    //   autorestart: false,
    //   cron_restart: '0 4 * * 0', // Todo domingo às 4h
    //   env: {
    //     NODE_ENV: 'production',
    //   },
    // },
  ],
  
  // ============================================
  // DEPLOY (PM2 DEPLOY - OPCIONAL)
  // ============================================
  deploy: {
    production: {
      user: 'ubuntu',
      host: ['seu-servidor.com.br'],
      ref: 'origin/main',
      repo: 'git@github.com:seu-usuario/bot-whatsapp.git',
      path: '/home/ubuntu/bot-whatsapp',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      env: {
        NODE_ENV: 'production',
      },
    },
  },
};
