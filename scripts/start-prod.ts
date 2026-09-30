import { spawn } from "child_process";
import { existsSync } from "fs";
import { resolve } from "path";

const rootDir = resolve(".");
const backendDist = resolve(rootDir, "backend/dist/server.js");
const frontendDist = resolve(rootDir, "frontend/.output/server/index.mjs");

console.log("🔍 Checking production build artifacts...\n");

let missing = false;
if (!existsSync(backendDist)) {
  console.error("❌ Missing backend build: backend/dist/server.js");
  missing = true;
}
if (!existsSync(frontendDist)) {
  console.error("❌ Missing frontend build: frontend/.output/server/index.mjs");
  missing = true;
}

if (missing) {
  console.log("\n⚠️  Please run 'bun run build' first to build both projects!\n");
  process.exit(1);
}

console.log("🚀 Starting Production Servers concurrently...\n");

const bunBin = process.execPath;

const backendProcess = spawn(bunBin, ["run", "backend/dist/server.js"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, NODE_ENV: "production" },
});

const frontendProcess = spawn("node", [frontendDist], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, NODE_ENV: "production" },
});

function cleanup() {
  console.log("\n🛑 Stopping servers...");
  try { backendProcess.kill(); } catch {}
  try { frontendProcess.kill(); } catch {}
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
