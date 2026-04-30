/**
 * Playwright webServer 专用：与 `run-dev.mjs` 同形启动 Next dev，但将 stdout/stderr 记入环形缓冲，
 * **子进程退出时打印最后 100 行**，便于定位 3012 崩溃（OOM / 未捕获异常 / 编译失败）。
 *
 * 触发：`PLAYWRIGHT_E2E_STABILITY=1` 时 `playwright.config.ts` 用本脚本替代 `npm run dev`。
 */
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");

const MAX_LINES = 100;
/** @type {string[]} */
const ring = [];

function pushText(chunk) {
  const s = chunk.toString("utf8");
  for (const line of s.split(/\r?\n/)) {
    if (line.length === 0) continue;
    ring.push(line);
    while (ring.length > MAX_LINES) ring.shift();
  }
}

function runNodeScript(rel) {
  const script = path.join(root, rel);
  const r = spawnSync(process.execPath, [script], { cwd: root, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const isWin = process.platform === "win32";
const forceTurbo = process.env.TRAVELTRUST_DEV_TURBO === "1";
const devPort = (process.env.TRAVELTRUST_FRONTEND_PORT || process.env.FRONTEND_PORT || "3012").trim();

const nodeOpts = (process.env.NODE_OPTIONS || "").trim();
if (!nodeOpts.includes("max-old-space-size")) {
  process.env.NODE_OPTIONS = `${nodeOpts} --max-old-space-size=6144`.trim();
}

/** @type {string[]} */
let nextArgs;
if (isWin && !forceTurbo) {
  console.warn(
    "[traveltrust] run-dev-webserver-logged: Webpack dev on Windows (see run-dev.mjs).",
  );
  runNodeScript("scripts/ensure-dev-next.mjs");
  nextArgs = ["dev", "-p", devPort];
} else {
  runNodeScript("scripts/ensure-turbo-dev.mjs");
  nextArgs = ["dev", "--turbopack", "-p", devPort];
}

process.on("uncaughtException", (err) => {
  console.error("[run-dev-webserver-logged] uncaughtException:", err);
  console.error("\n=== Last captured Next lines ===\n");
  console.error(ring.join("\n"));
  process.exit(1);
});

const child = spawn(process.execPath, [nextBin, ...nextArgs], {
  cwd: root,
  env: process.env,
  stdio: ["inherit", "pipe", "pipe"],
});

child.stdout.on("data", (buf) => {
  process.stdout.write(buf);
  pushText(buf);
});
child.stderr.on("data", (buf) => {
  process.stderr.write(buf);
  pushText(buf);
});

child.on("exit", (code, signal) => {
  const c = code ?? 1;
  console.error(
    `\n=== Next dev exited code=${c} signal=${signal ?? ""} — last ${ring.length} line(s) ===\n`,
  );
  console.error(ring.join("\n"));
  process.exit(c);
});

function forward(sig) {
  try {
    child.kill(sig);
  } catch {
    /* ignore */
  }
}
process.on("SIGTERM", () => forward("SIGTERM"));
process.on("SIGINT", () => forward("SIGINT"));
