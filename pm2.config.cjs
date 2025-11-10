module.exports = {
  apps: [
    {
      app: "tind_tracking_api",
      name: 'tind_tracking_api',
      script: 'src/index.ts',
      interpreter: '/root/.bun/bin/bun',
      interpreter_args: 'run',
      instances: 1,
      exec_mode: 'fork',
      env_production: {
        NODE_ENV: 'production',
        PORT: 9200,
      },
      error_file: 'pm2-error.log',
      out_file: 'pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      min_uptime: '10s',
      max_restarts: 10,
    },
  ],
};