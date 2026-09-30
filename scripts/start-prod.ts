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

const backendProcess = spawn("bun", ["run", "backend/dist/server.js"], {
  stdio: "inherit",
  env: { ...process.env },
});

const frontendProcess = spawn("bun", ["run", "frontend/.output/server/index.mjs"], {
  stdio: "inherit",
  env: { ...process.env, PORT: process.env.PORT || "3000" },
});

function cleanup() {
  console.log("\n🛑 Stopping servers...");
  backendProcess.kill("SIGTERM");
  frontendProcess.kill("SIGTERM");
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
