// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'BACKEND-LIGA',
    script: 'npm',
    args: 'start',
    interpreter: 'none',
    cwd: '/home/backend_liga_natacion/BACKEND_HIKVISION',
    autorestart: true,
    restart_delay: 5000,
    max_restarts: 10,
    min_uptime: 5000,
    env: {
      NODE_ENV: 'development',
      DB_RETRIES: 5,
      DB_RETRY_DELAY: 5000
    },
    error_file: '/home/backend_liga_natacion/logs/error.log',
    out_file: '/home/backend_liga_natacion/logs/output.log',
    log_date_format: 'YYYY-MM-DD HH:mm Z'
  }]
};