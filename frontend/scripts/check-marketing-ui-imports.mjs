#!/usr/bin/env node
/** Fail if TT_MARKETING_* is used but not imported from @/lib/marketingUi */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = join(import.meta.dirname, "..");
const tokenRe = /TT_MARKETING_[A-Z0-9_]+/g;
const importRe = /import\s*\{([^}]+)\}\s*from\s*["']@\/lib\/marketingUi["']/s;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name === "archive") continue;
    const abs = join(dir, name);
    const st = statSync(abs);
    if (st.isDirectory()) walk(abs, out);
    else if (/\.(ts|tsx)$/.test(name) && !name.endsWith(".test.ts")) out.push(abs);
  }
  return out;
}

const violations = [];
for (const abs of walk(root)) {
  const rel = relative(root, abs).replace(/\\/g, "/");
  const text = readFileSync(abs, "utf8");
  const used = [...new Set(text.match(tokenRe) ?? [])];
  if (!used.length) continue;
  const imp = text.match(importRe);
  const imported = new Set(
    imp ? [...imp[1].match(tokenRe) ?? []] : [],
  );
  const missing = used.filter((t) => !imported.has(t));
  if (missing.length) violations.push({ rel, missing });
}

if (violations.length) {
  console.error("marketingUi import gaps:");
  for (const { rel, missing } of violations) {
    console.error(`  ${rel}: ${missing.join(", ")}`);
  }
  process.exit(1);
}
console.log("marketingUi imports OK");
