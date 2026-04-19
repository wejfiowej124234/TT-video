/**
 * 在 `npm run dev` 已监听端口后，在**另一终端**执行本脚本，对常用路由发 GET，
 * 触发 Webpack 按需编译，避免第一次手动点顶栏时才等数秒。
 *
 *   node ./scripts/warm-dev-routes.mjs
 *   node ./scripts/warm-dev-routes.mjs http://127.0.0.1:3012
 */
const base = (process.argv[2] || "http://127.0.0.1:3012").replace(/\/$/, "");
const paths = [
  "/",
  "/traveltrust",
  "/trust",
  "/market",
  "/did-rank",
  "/community",
  "/community/explore",
  "/community/messages",
  "/community/activity",
  "/community/friends",
  "/community/me",
  "/guide",
  "/guide/register",
  "/auth/register",
];

async function one(pathname) {
  const url = `${base}${pathname}`;
  const t0 = Date.now();
  try {
    const r = await fetch(url, {
      headers: { Accept: "text/html", "User-Agent": "traveltrust-warm-dev-routes" },
      redirect: "follow",
    });
    const ms = Date.now() - t0;
    return { pathname, status: r.status, ms };
  } catch (e) {
    return { pathname, error: e instanceof Error ? e.message : String(e) };
  }
}

async function main() {
  console.warn(`[traveltrust] warming ${paths.length} routes against ${base} …`);
  for (const p of paths) {
    const row = await one(p);
    if ("error" in row) {
      console.warn(`  ${row.pathname}  FAIL  ${row.error}`);
    } else {
      console.warn(`  ${row.pathname}  ${row.status}  ${row.ms}ms`);
    }
  }
  console.warn("[traveltrust] warm done — 之后浏览器里同路由首次切换应更快（仍属 dev 行为）。");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
