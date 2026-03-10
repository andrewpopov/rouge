const { spawn } = require("child_process");
const path = require("path");

const configPath = path.resolve(__dirname, "../../cloudflared-config.prod.yml");

console.log(`Starting Cloudflare tunnel with config: ${configPath}`);

const tunnel = spawn("cloudflared", ["tunnel", "--config", configPath, "run"], {
  stdio: "inherit",
});

tunnel.on("error", (err) => {
  console.error("Failed to start tunnel:", err.message);
  process.exit(1);
});

tunnel.on("exit", (code) => {
  console.log(`Tunnel exited with code ${code}`);
  process.exit(code || 0);
});
