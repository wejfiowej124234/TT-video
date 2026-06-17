#!/usr/bin/env node
/** Launcher — SSOT logic in assert-onboarding-hub-phase.ts (meIdentitiesCoreCardModel). */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const frontend = path.join(root, "frontend");
const tsScript = path.join(__dirname, "assert-onboarding-hub-phase.ts");

const result = spawnSync("npx", ["tsx", tsScript, ...process.argv.slice(2)], {
  cwd: frontend,
  stdio: "inherit",
  shell: true,
});

process.exit(result.status ?? 1);
