#!/usr/bin/env node
/**
 * Next 15：`useSearchParams` 须在 React Suspense 边界内，否则生产 `next start` 预渲染可报 `DYNAMIC_SERVER_USAGE`。
 *
 * 1) `frontend/app`：任意 `.ts`/`.tsx` 若实际调用 `useSearchParams(` 且从 `next/navigation` 导入，
 *    同文件须出现子串 `Suspense`（JSX、或 `MarketRouteSuspense` 等）。
 * 2) `frontend/components`：同上；仅由父级路由包 Suspense 的模块列于
 *    `scripts/search-params-suspense-components-allowlist.json`（路径相对 frontend 根，POSIX `/`）。
 *    每次运行会校验 allowlist：须以 `components/` 开头、无 `..`、路径存在、仍含 hook、且同文件仍无 Suspense（否则须从列表移除）。
 * 3) `frontend/lib`、`frontend/hooks`、`frontend/dapp/hooks`（若存在）：与 app 同规则，**无 allowlist**（此处不应依赖父级 Suspense）。
 *
 * 由 `npm run check:search-params-suspense`、`npm run build` / `build:clean` 前置调用。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, "..");
const appDir = path.join(frontendRoot, "app");
const componentsDir = path.join(frontendRoot, "components");
const allowlistPath = path.join(__dirname, "search-params-suspense-components-allowlist.json");

/** @param {string} basename @param {"app"|"components"|"strict"} kind */
function skipSourceFile(basename, kind) {
  if (!basename.endsWith(".ts") && !basename.endsWith(".tsx")) return true;
  if (basename.endsWith(".d.ts")) return true;
  if (basename.includes(".test.")) return true;
  if (kind === "app") {
    if (basename === "sitemap.ts" || basename === "robots.ts") return true;
    if (basename === "route.ts" || basename === "middleware.ts") return true;
  }
  return false;
}

/** @param {string} dir @param {"app"|"components"|"strict"} kind @returns {string[]} */
function walkSources(dir, kind) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walkSources(p, kind));
    else if (ent.isFile() && !skipSourceFile(ent.name, kind)) out.push(p);
  }
  return out;
}

function relPosix(file) {
  return path.relative(frontendRoot, file).split(path.sep).join("/");
}

/** @returns {string[]} */
function loadComponentAllowlistArray() {
  const raw = fs.readFileSync(allowlistPath, "utf8");
  const j = JSON.parse(raw);
  if (!j || !Array.isArray(j.components)) {
    throw new Error(`${allowlistPath}: expected { "components": string[] }`);
  }
  return j.components.map((s) => String(s).replace(/\\/g, "/"));
}

const navImport = /from\s+["']next\/navigation["']/;
const useSearchParamsCall = /\buseSearchParams\s*\(/;

/** @param {string[]} list @returns {string[]} */
function validateAllowlist(list) {
  const errors = [];
  const seen = new Set();
  for (const rel of list) {
    if (seen.has(rel)) errors.push(`allowlist 重复项：${rel}`);
    seen.add(rel);
    if (rel.includes("..")) {
      errors.push(`allowlist 路径非法（含 ..）：${rel}`);
      continue;
    }
    if (!rel.startsWith("components/")) {
      errors.push(`allowlist 路径须以 components/ 开头：${rel}`);
      continue;
    }
    const abs = path.join(frontendRoot, ...rel.split("/"));
    if (!fs.existsSync(abs)) {
      errors.push(`allowlist 路径不存在：${rel}`);
      continue;
    }
    if (!fs.statSync(abs).isFile()) {
      errors.push(`allowlist 不是文件：${rel}`);
      continue;
    }
    const src = fs.readFileSync(abs, "utf8");
    if (!useSearchParamsCall.test(src) || !navImport.test(src)) {
      errors.push(`allowlist 已过期（不再 useSearchParams + next/navigation）：${rel}`);
    } else if (src.includes("Suspense")) {
      errors.push(`allowlist 冗余（同文件已有 Suspense，请从 allowlist 移除）：${rel}`);
    }
  }
  return errors;
}

const appViolations = [];
for (const file of walkSources(appDir, "app")) {
  const src = fs.readFileSync(file, "utf8");
  if (!useSearchParamsCall.test(src)) continue;
  if (!navImport.test(src)) continue;
  if (!src.includes("Suspense")) appViolations.push(relPosix(file));
}

const allowlistList = loadComponentAllowlistArray();
const allowlistErrors = validateAllowlist(allowlistList);
const componentAllowlist = new Set(allowlistList);
const componentViolations = [];
for (const file of walkSources(componentsDir, "components")) {
  const src = fs.readFileSync(file, "utf8");
  if (!useSearchParamsCall.test(src)) continue;
  if (!navImport.test(src)) continue;
  if (src.includes("Suspense")) continue;
  const rel = relPosix(file);
  if (componentAllowlist.has(rel)) continue;
  componentViolations.push(rel);
}

/** lib / hooks：与 app 同规则，禁止仅依赖外部 Suspense */
const libHooksViolations = [];
const libHooksRoots = [
  ["lib", path.join(frontendRoot, "lib")],
  ["hooks", path.join(frontendRoot, "hooks")],
  ["dapp/hooks", path.join(frontendRoot, "dapp", "hooks")],
];
for (const [, dir] of libHooksRoots) {
  if (!fs.existsSync(dir)) continue;
  for (const file of walkSources(dir, "strict")) {
    const src = fs.readFileSync(file, "utf8");
    if (!useSearchParamsCall.test(src)) continue;
    if (!navImport.test(src)) continue;
    if (!src.includes("Suspense")) libHooksViolations.push(relPosix(file));
  }
}

const label = "[check-use-search-params-suspense]";

if (appViolations.length || componentViolations.length || allowlistErrors.length || libHooksViolations.length) {
  if (appViolations.length) {
    console.error(`${label} app：以下文件调用了 useSearchParams，但同文件未出现 "Suspense"：`);
    for (const v of appViolations) console.error(`  - ${v}`);
  }
  if (componentViolations.length) {
    console.error(
      `${label} components：以下文件调用了 useSearchParams 且同文件无 "Suspense"；请在父级包 Suspense 并加入 allowlist，或在本文件内包 Suspense：`
    );
    for (const v of componentViolations) console.error(`  - ${v}`);
  }
  if (allowlistErrors.length) {
    console.error(`${label} components allowlist（search-params-suspense-components-allowlist.json）：`);
    for (const e of allowlistErrors) console.error(`  - ${e}`);
  }
  if (libHooksViolations.length) {
    console.error(
      `${label} lib/hooks：以下文件调用了 useSearchParams 但同文件无 "Suspense"（lib 与 hooks 不允许仅用 allowlist 豁免；请移入组件或在本文件包 Suspense）：`
    );
    for (const v of libHooksViolations) console.error(`  - ${v}`);
  }
  process.exit(1);
}

console.log(`${label} ok (app + components + lib/hooks)`);
