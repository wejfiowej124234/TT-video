#!/usr/bin/env node
/**
 * 36 可选：34 §5.3 禁止类名扫描（34/28 单源）
 * 扫描 frontend 下 app、components（排除 community、did-rank）的 tsx/ts 文件。
 * 用法：node scripts/check-forbidden-classes.mjs
 */
import { readFileSync, readdirSync } from "fs";
import { join, relative } from "path";

const ROOT = process.cwd().endsWith("frontend") ? process.cwd() : join(process.cwd(), "frontend");
const FORBIDDEN = [
  { pattern: /\btext-gray-\d/g, name: "text-gray-*" },
  { pattern: /\btext-blue-\d/g, name: "text-blue-*" },
  { pattern: /\btext-red-\d/g, name: "text-red-*" },
  { pattern: /\btext-green-\d/g, name: "text-green-*" },
  { pattern: /\bbg-gray-\d/g, name: "bg-gray-*" },
  { pattern: /\bbg-slate-\d/g, name: "bg-slate-*" },
  { pattern: /\bbg-amber-\d/g, name: "bg-amber-*" },
  { pattern: /\bbg-emerald-\d/g, name: "bg-emerald-*" },
  { pattern: /["'`]\s*bg-white\s*["'`]/g, name: "裸 bg-white (无/xx)" },
  { pattern: /\brounded-md\b/g, name: "rounded-md (未走变量)" },
];
const SKIP_DIRS = ["community", "did-rank", "node_modules", ".next"];
const EXT = [".tsx", ".ts"];

function walk(dir, base = ROOT) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const out = [];
  for (const e of entries) {
    const full = join(dir, e.name);
    const rel = relative(base, full);
    if (e.isDirectory()) {
      if (SKIP_DIRS.some((d) => rel.includes(d))) continue;
      out.push(...walk(full, base));
    } else if (EXT.some((x) => e.name.endsWith(x))) {
      out.push(full);
    }
  }
  return out;
}

const dirs = ["app", "components"].map((d) => join(ROOT, d));
const files = dirs.flatMap((d) => walk(d));
let hasViolation = false;
const report = [];

for (const file of files) {
  const rel = relative(ROOT, file);
  const content = readFileSync(file, "utf8");
  for (const { pattern, name } of FORBIDDEN) {
    const matches = content.match(pattern);
    if (matches) {
      hasViolation = true;
      report.push({ file: rel, rule: name, count: matches.length });
    }
  }
}

if (report.length) {
  console.error("34 §5.3 禁止类名扫描发现违规：\n");
  report.forEach(({ file, rule, count }) => console.error(`  ${file}  ${rule} (${count})`));
  process.exit(1);
}
console.log("34 §5.3 禁止类名扫描通过（app/components 排除 community、did-rank）");
