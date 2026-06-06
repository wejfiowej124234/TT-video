/**
 * Regenerate 96-16 matrix JSON (same as matrix:96-16:all) and fail if committed
 * evidence JSON would change — catches drift between Next app routes, matrix rules, and repo.
 *
 * Run from frontend/: npm run check:96-16-matrices
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.join(__dirname, "..");
const evDir = path.join(frontendRoot, "evidence");

const FILES = [
  "GO_96_16_d5_d6_d7_coverage_matrix_v1.json",
  "GO_96_16_d1_d12_coverage_matrix_v1.json",
  "GO_96_16_evidence_aggregation_d1_d12.json",
];

const before = new Map();
for (const f of FILES) {
  const p = path.join(evDir, f);
  before.set(f, fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null);
}

execSync("node ./scripts/build-d5d6d7-coverage-matrix.mjs", { cwd: frontendRoot, stdio: "inherit" });
execSync("node ./scripts/build-d1-d12-coverage-matrix.mjs", { cwd: frontendRoot, stdio: "inherit" });

let drift = false;
for (const f of FILES) {
  const p = path.join(evDir, f);
  if (!fs.existsSync(p)) {
    console.error(`check-96-16-matrices: missing output ${f}`);
    drift = true;
    continue;
  }
  const after = fs.readFileSync(p, "utf8");
  const prev = before.get(f);
  if (prev !== after) {
    console.error(`check-96-16-matrices: drift in evidence/${f} — run npm run matrix:96-16:all and commit, or fix routes/rules.`);
    drift = true;
  }
}

if (drift) process.exit(1);
console.log("check-96-16-matrices: OK (committed matrix JSON matches regenerate)");
