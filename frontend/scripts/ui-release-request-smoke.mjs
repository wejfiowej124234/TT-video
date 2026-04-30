/**
 * UI 发布前 **request 级**烟测（无 Playwright、无 API）：`next start` 后对关键 HTML 路由做 GET。
 *
 * 用法（在 `frontend/`）：
 *   node ./scripts/ui-release-request-smoke.mjs                    # 假定 3012 已有 Next
 *   node ./scripts/ui-release-request-smoke.mjs --with-start      # 本进程内先起 `next start` 再探测，结束时会杀子进程
 *
 * 环境：`SMOKE_PORT`（默认 3012）、`SMOKE_BASE`（覆盖完整 origin，如 http://127.0.0.1:3012）
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const port = (process.env.SMOKE_PORT ?? "3012").trim();
const base = (process.env.SMOKE_BASE ?? `http://127.0.0.1:${port}`).replace(/\/$/, "");
const withStart = process.argv.includes("--with-start");

/** @type {import('node:child_process').ChildProcess | null} */
let nextChild = null;

const PATHS = [
  { path: "/", ok: [200] },
  { path: "/governance", ok: [200] },
  { path: "/governance/fee-routes", ok: [200] },
  { path: "/auth/login", ok: [200] },
  { path: "/community", ok: [200] },
  { path: "/did-rank", ok: [200] },
  { path: "/terms/community-guidelines", ok: [200] },
  { path: "/guide/register", ok: [200] },
  { path: "/admin", ok: [200, 301, 302, 303, 307, 308] },
];

async function probe(p) {
  const url = `${base}${p.startsWith("/") ? p : `/${p}`}`;
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 20_000);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: ac.signal,
      headers: { Accept: "text/html,*/*;q=0.8" },
    });
    return { path: p, status: res.status };
  } finally {
    clearTimeout(t);
  }
}

async function waitForRoot() {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    try {
      const { status } = await probe("/");
      if (status === 200 || status === 304) return;
    } catch {
      /* retry */
    }
    await delay(500);
  }
  throw new Error(`[ui-release-request-smoke] timeout waiting for GET / → 200 at ${base}`);
}

function startNextProduction() {
  const ensure = path.join(root, "scripts", "ensure-next-start.mjs");
  if (!fs.existsSync(ensure)) {
    throw new Error(`missing ${ensure}`);
  }
  const r = spawnSync(process.execPath, [ensure], { cwd: root, stdio: "inherit" });
  if (r.status !== 0) {
    throw new Error(`ensure-next-start exited ${r.status ?? r.signal}`);
  }
  const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
  if (!fs.existsSync(nextBin)) {
    throw new Error(`missing ${nextBin} — run npm install in frontend/`);
  }
  nextChild = spawn(process.execPath, [nextBin, "start", "-p", port], {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  nextChild.stdout?.on("data", (d) => {
    const s = String(d);
    if (s.includes("Error") || s.includes("ECONNREFUSED")) process.stderr.write(s);
  });
  nextChild.stderr?.on("data", (d) => process.stderr.write(String(d)));
  nextChild.on("error", (e) => {
    console.error("[ui-release-request-smoke] next child error:", e);
  });
}

function stopNext() {
  if (!nextChild?.pid) return;
  try {
    if (process.platform === "win32") {
      spawnSync("taskkill", ["/PID", String(nextChild.pid), "/T", "/F"], { stdio: "ignore" });
    } else {
      nextChild.kill("SIGTERM");
    }
  } catch (e) {
    console.warn("[ui-release-request-smoke] stop next:", e?.message ?? e);
  }
  nextChild = null;
}

async function main() {
  if (withStart) {
    console.log(`[ui-release-request-smoke] starting next start -p ${port} …`);
    startNextProduction();
    await waitForRoot();
    console.log(`[ui-release-request-smoke] ${base}/ ready`);
  }

  const rows = [];
  let failed = false;
  for (const { path: p, ok: allowed } of PATHS) {
    let status;
    try {
      ({ status } = await probe(p));
    } catch (e) {
      console.error(`[FAIL] ${p}: ${e?.message ?? e}`);
      failed = true;
      rows.push({ path: p, status: null, error: String(e?.message ?? e) });
      continue;
    }
    const pass = allowed.includes(status);
    if (!pass) {
      console.error(`[FAIL] ${p} → HTTP ${status} (allowed ${allowed.join(",")})`);
      failed = true;
    } else {
      console.log(`[ok] ${p} → ${status}`);
    }
    rows.push({ path: p, status, allowed });
  }

  const out = {
    base,
    withStart,
    at: new Date().toISOString(),
    rows,
  };
  const outPath = path.join(root, "evidence", "http-smoke-ui-release-last.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`, "utf8");
  console.log(`[ui-release-request-smoke] wrote ${path.relative(root, outPath)}`);

  if (failed) process.exit(1);
}

try {
  await main();
} finally {
  if (withStart) stopNext();
}
