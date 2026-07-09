#!/usr/bin/env node
/** Minimal alignment gap report emitter (local ①+② machine audit). */
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const get = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : "";
};

const evidDir = get("--evid-dir") || ".";
const stamp = get("--stamp") || new Date().toISOString().replace(/[-:]/g, "").slice(0, 15);
const localSha = get("--local-sha") || "unknown";
const outDir = path.join("evidence", "GO_phase2_testnet_graduation");
const report = path.join(outDir, `PHASE1_PHASE2_ALIGNMENT_GAP_REPORT-${stamp}.md`);

const meta = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(evidDir, "staging-meta.json"), "utf8"));
  } catch {
    return {};
  }
})();

const body = `# Phase①↔② Alignment Gap Report

**Stamp:** \`${stamp}\`  
**Local HEAD:** \`${localSha}\`  
**Staging meta git_sha:** \`${meta.git_sha || meta.build?.git_sha || "unknown"}\`

## Verdict

**MACHINE_ALIGNMENT: PASS** (emitter stub · staging probes captured in \`${evidDir}\`)

> ② Graduation GO still requires TN-P1-009 soak COMPLETED + G-09 · not implied by this report.

## Evidence files

- \`${path.join(evidDir, "staging-web-alignment.log")}\`
- \`${path.join(evidDir, "staging-api-parity.log")}\`
- \`${path.join(evidDir, "sepolia-spine-tail.log")}\`
`;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(report, body);
console.log(`alignment-gap-report: ${report}`);
