#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const sh = readFileSync(join(root, "scripts/dev/run-admin-l5-green.sh"), "utf8");
const files = sh
  .split("\n")
  .map((line) => line.trim().replace(/\\$/, ""))
  .filter((line) => /^(lib\/admin|app\/admin|components\/admin)/.test(line))
  .map((line) => line.replace(/^'|'$/g, ""));

const BATCH_SIZE = 35;
const frontendCwd = join(root, "frontend");

for (let i = 0; i < files.length; i += BATCH_SIZE) {
  const batch = files.slice(i, i + BATCH_SIZE);
  const r = spawnSync("npx", ["vitest", "run", ...batch, "--run"], {
    cwd: frontendCwd,
    stdio: "inherit",
    shell: true,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

console.log("admin-l5-green: exit 0");
