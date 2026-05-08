module.exports = {
  apps: [
    {
      name: 'fikir-admin-dashboard',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/fikir-admin-dashboard',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '600M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
}
