/**
 * 诊断 http://127.0.0.1:3012 上 UI 白屏、/_next/static 大量 404 的常见根因。
 *
 * 用法（在 frontend/ 或项目根）：
 *   node frontend/scripts/doctor-ui-3012.mjs
 *   node ./scripts/doctor-ui-3012.mjs
 *
 * 环境：BASE=http://127.0.0.1:3012 可改目标。
 */
import { setTimeout as delay } from "node:timers/promises";

const base = (process.env.BASE || "http://127.0.0.1:3012").replace(/\/$/, "");

async function get(path) {
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 8000);
  try {
    const res = await fetch(url, {
      redirect: "manual",
      signal: ac.signal,
      headers: { Accept: "text/html,application/json;q=0.9,*/*;q=0.8" },
    });
    const text = await res.text();
    return { url, status: res.status, ct: res.headers.get("content-type") || "", text };
  } finally {
    clearTimeout(t);
  }
}

function looksLikeAxumJsonNotFound(body, ct) {
  if (!ct.includes("json")) return false;
  const s = body.slice(0, 400).toLowerCase();
  return (
    s.includes("not found") ||
    s.includes("\"error\"") ||
    s.includes("missing") ||
    body.length < 2000
  );
}

function extractNextStaticUrl(html) {
  const m = html.match(/["'](\/_next\/static\/[^"'?\s]+)/);
  return m ? m[1] : null;
}

async function main() {
  console.log(`[doctor-ui-3012] Probing ${base} …\n`);

  let home;
  try {
    home = await get("/");
  } catch (e) {
    console.error(
      `[FAIL] 无法连接 ${base}（Next 未启动或端口错误）。\n` +
        `  处理：cd frontend && npm run dev，或确认 3012 未被其它程序占用。\n` +
        `  详情：${e.message || e}`
    );
    process.exit(2);
  }

  const { status, ct, text } = home;
  console.log(`GET / → ${status}  Content-Type: ${ct || "(none)"}`);

  if (status === 404 && looksLikeAxumJsonNotFound(text, ct)) {
    console.error(
      `\n[FAIL] 根路径像 **API（Axum）JSON 404**，不是 Next HTML。\n` +
        `  根因：3012 上很可能是 **traveltrust-api**（常见误配 PORT=3012），浏览器拉 /_next/* 必然 404。\n` +
        `  处理：API 用 PORT=8080；前端用 npm run dev（3012）。勿把前后端绑同一端口。\n`
    );
    process.exit(1);
  }

  if (!text.includes("_next") && !text.includes("DOCTYPE")) {
    console.warn(
      `\n[WARN] 响应不像典型 Next 首页（无 DOCTYPE / _next）。若你访问的是重定向或代理页，请直接测 127.0.0.1:3012。`
    );
  }

  const chunkPath = extractNextStaticUrl(text);
  if (!chunkPath) {
    console.warn(
      `\n[WARN] 首页 HTML 中未解析到 /_next/static/ 脚本路径（可能仍在编译或异常页）。\n` +
        `  处理：等终端出现 Ready 后再刷新；或 npm run clean && npm run dev。`
    );
    process.exit(0);
  }

  console.log(`  抽样资源: ${chunkPath}`);
  await delay(100);
  const asset = await get(chunkPath);
  console.log(`GET ${chunkPath} → ${asset.status}  Content-Type: ${asset.ct || "(none)"}`);

  if (asset.status === 404) {
    console.error(
      `\n[FAIL] 首页引用的 chunk 返回 **404**（HTML 与 .next 产物不一致）。\n` +
        `  根因：**损坏/混用的 .next**（dev 与 build 混用、双 dev 抢目录、Turbopack/Webpack 切换、编译中断）。\n` +
        `  最佳修复：\n` +
        `    1) 关掉所有占用 3012 的 node/next\n` +
        `    2) cd frontend && npm run clean && npm run dev\n` +
        `    3) 见 Ready 后硬刷新或无痕窗口\n` +
        `  Windows 一键脚本前可设 TRAVELTRUST_CLEAN_FRONTEND_NEXT=1；顽固 Turbopack 问题可试 npm run dev:webpack。`
    );
    process.exit(1);
  }

  if (asset.status >= 200 && asset.status < 300) {
    console.log(
      `\n[OK] Next 静态资源可访问。若浏览器仍 404，试 **硬刷新 / 清站点数据 / 禁用缓存**，并排除代理只转页面不转 /_next。`
    );
    process.exit(0);
  }

  console.warn(`\n[WARN] 抽样资源状态 ${asset.status}，请结合终端 Next 日志排查。`);
  process.exit(0);
}

main();
