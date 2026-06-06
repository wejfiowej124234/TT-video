#!/usr/bin/env node
/**
 * ① /traveltrust Lighthouse 证据摘录（TT-PH1-184 · 不冒充 ②③）
 * 前置：Next :3012 已起。用法：node scripts/record-traveltrust-lighthouse-evidence.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "..", "evidence", "GO_local_traveltrust_ph1", "lighthouse");
const url = process.env.TRAVELTRUST_LH_URL?.trim() || "http://127.0.0.1:3012/traveltrust";
const stamp = new Date().toISOString().slice(0, 10);

mkdirSync(outDir, { recursive: true });

const jsonPath = join(outDir, `lighthouse-traveltrust-${stamp}.json`);
const args = [
  url,
  "--only-categories=performance,accessibility",
  `--output=json`,
  `--output-path=${jsonPath}`,
  '--chrome-flags="--headless --no-sandbox --disable-gpu"',
];

const run = spawnSync("npx", ["--yes", "lighthouse", ...args], {
  cwd: root,
  shell: true,
  encoding: "utf8",
});

if (run.status !== 0) {
  console.error(run.stderr || run.stdout);
  process.exit(run.status ?? 1);
}

let summary = { url, stamp, performance: null, accessibility: null, lcp: null };
try {
  const report = JSON.parse(readFileSync(jsonPath, "utf8"));
  summary = {
    url,
    stamp,
    performance: report.categories?.performance?.score ?? null,
    accessibility: report.categories?.accessibility?.score ?? null,
    lcp: report.audits?.["largest-contentful-paint"]?.displayValue ?? null,
  };
} catch {
  /* keep minimal summary */
}

const readme = `# /traveltrust v6 Lighthouse（① 本地）

- URL: ${url}
- Date: ${stamp}
- Performance score: ${summary.performance}
- Accessibility score: ${summary.accessibility}
- LCP: ${summary.lcp}

> 仅作 ① 本地性能旁证；不替代 staging 全矩阵或 ②③ 验收。
`;

writeFileSync(join(outDir, "README.md"), readme, "utf8");
writeFileSync(join(outDir, `summary-${stamp}.json`), JSON.stringify(summary, null, 2), "utf8");
console.log(`TT-PH1-184: wrote ${jsonPath}`);
console.log(JSON.stringify(summary, null, 2));
