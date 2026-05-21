/**
 * Hero 走查专用 dev：Webpack（Windows 默认）+ E2E 探针桥 + 固定 127.0.0.1:3012
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const runDev = path.join(root, "scripts", "run-dev.mjs");

const env = {
  ...process.env,
  TRAVELTRUST_DEV_HOSTNAME: "127.0.0.1",
  FRONTEND_PORT: "3012",
  TRAVELTRUST_FRONTEND_PORT: "3012",
  NEXT_PUBLIC_TRAVELTRUST_E2E_PROBE: "1",
};

console.warn(
  "[traveltrust] dev:hero → http://127.0.0.1:3012/traveltrust (E2E_PROBE=1; after ready: npm run preview:hero-l5:url)\n",
);

const child = spawn(process.execPath, [runDev], { cwd: root, stdio: "inherit", env });
child.on("exit", (code) => process.exit(code ?? 1));
