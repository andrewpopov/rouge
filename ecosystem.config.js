module.exports = {
  apps: [
    {
      name: "rouge-app",
      script: "scripts/tools/start-static.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "256M",
      env: {
        NODE_ENV: "production",
        PORT: "4173",
      },
      error_file: "logs/error.log",
      out_file: "logs/out.log",
      merge_logs: true,
      time: true,
    },
    {
      name: "rouge-tunnel",
      script: "scripts/tools/start-tunnel.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "256M",
      error_file: "logs/tunnel-error.log",
      out_file: "logs/tunnel-out.log",
      merge_logs: true,
      time: true,
    },
  ],
};
