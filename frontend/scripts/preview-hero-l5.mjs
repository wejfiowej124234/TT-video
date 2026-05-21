/**
 * Hero L5 目视走查（①）— 打开 /traveltrust 并打印检查清单
 *
 *   node ./scripts/preview-hero-l5.mjs
 *   node ./scripts/preview-hero-l5.mjs --wait-ready   # 轮询直至 200
 *   node ./scripts/preview-hero-l5.mjs --no-open
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const host = (process.env.TRAVELTRUST_DEV_HOSTNAME || "127.0.0.1").trim();
const port = (process.env.TRAVELTRUST_FRONTEND_PORT || process.env.FRONTEND_PORT || "3012").trim();
const base = `http://${host}:${port}`;
const traveltrustUrl = `${base}/traveltrust`;
const hashStart = `${traveltrustUrl}#start?region=cn&step=plan`;

const argv = new Set(process.argv.slice(2));
const waitReady = argv.has("--wait-ready");
const noOpen = argv.has("--no-open");

async function waitForReady(maxMs = 300_000) {
  const t0 = Date.now();
  while (Date.now() - t0 < maxMs) {
    try {
      const r = await fetch(traveltrustUrl, {
        headers: { Accept: "text/html", "User-Agent": "traveltrust-preview-hero-l5" },
        redirect: "follow",
      });
      if (r.status === 200) return true;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return false;
}

function openBrowser(url) {
  if (process.platform === "win32") {
    spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" }).unref();
    return;
  }
  if (process.platform === "darwin") {
    spawn("open", [url], { detached: true, stdio: "ignore" }).unref();
    return;
  }
  spawn("xdg-open", [url], { detached: true, stdio: "ignore" }).unref();
}

async function warmTraveltrust() {
  const warm = path.join(root, "scripts", "warm-dev-routes.mjs");
  const { spawnSync } = await import("node:child_process");
  spawnSync(process.execPath, [warm, base], { cwd: root, stdio: "inherit" });
}

console.log("\n[traveltrust] Hero L5 preview (① local visual)\n");
console.log(`  Primary:  ${traveltrustUrl}`);
console.log(`  #start:   ${hashStart}`);
console.log(`  Evidence: frontend/evidence/GO_local_hero_globe_a_closure/`);
console.log(`  P3 plan:  frontend/evidence/GO_local_hero_globe_a_closure/P3-PLAN.md\n`);
console.log("  Hard refresh: Ctrl+Shift+R (do not mix localhost vs 127.0.0.1)\n");
console.log("  Visual L5 checklist:");
console.log("    - Full globe + arcs + pins visible (no sky-wash / video bar on globe)");
console.log("    - Right copy card readable over globe");
console.log("    - Roster / CTA hover highlights region");
console.log("    - Optional: #start / #roles scroll for P2-B/C narrative\n");

if (waitReady) {
  process.stdout.write("[traveltrust] waiting for dev server… ");
  const ok = await waitForReady();
  console.log(ok ? "ready" : "timeout");
  if (!ok) process.exit(1);
}

try {
  const r = await fetch(traveltrustUrl, { headers: { Accept: "text/html" }, redirect: "follow" });
  if (r.status !== 200) {
    console.warn(`[traveltrust] GET /traveltrust → ${r.status} (dev may still be compiling; use --wait-ready)\n`);
  } else {
    console.log(`[traveltrust] GET /traveltrust → 200\n`);
    await warmTraveltrust();
  }
} catch (e) {
  console.warn(`[traveltrust] server not reachable: ${e instanceof Error ? e.message : e}\n`);
  console.warn("  Start: cd frontend && npm run dev:hero\n");
  process.exit(1);
}

if (!noOpen) openBrowser(traveltrustUrl);
