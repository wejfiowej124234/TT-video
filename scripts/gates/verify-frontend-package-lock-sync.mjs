#!/usr/bin/env node
/**
 * B-158 / TT-B158：校验 `frontend/package-lock.json`（lockfile v2+ `packages`）覆盖
 * `frontend/package.json` 之 **直接** dependencies / devDependencies / optionalDependencies。
 * 不访问网络、不安装 node_modules。
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "../..");
const pkgPath = path.join(root, "frontend/package.json");
const lockPath = path.join(root, "frontend/package-lock.json");

function fail(msg) {
  console.error(`B-158 lock sync: ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(pkgPath)) fail(`missing ${path.relative(root, pkgPath)}`);
if (!fs.existsSync(lockPath)) fail(`missing ${path.relative(root, lockPath)}`);

const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));

if (typeof lock.lockfileVersion !== "number" || lock.lockfileVersion < 2) {
  fail(`expected lockfileVersion >= 2, got ${lock.lockfileVersion}`);
}
if (!lock.packages || typeof lock.packages !== "object") {
  fail("package-lock.json missing packages{} (npm v7+)");
}

/** @param {string} name npm package name e.g. `react` or `@scope/pkg` */
function lockPackagesKey(name) {
  return `node_modules/${name}`;
}

/** @param {Record<string, unknown>} pj */
function directDepNames(pj) {
  const out = new Set();
  for (const sec of ["dependencies", "devDependencies", "optionalDependencies"]) {
    if (!pj[sec] || typeof pj[sec] !== "object") continue;
    for (const name of Object.keys(pj[sec])) out.add(name);
  }
  return out;
}

for (const name of directDepNames(pkg)) {
  const key = lockPackagesKey(name);
  if (!Object.prototype.hasOwnProperty.call(lock.packages, key)) {
    fail(
      `package.json lists "${name}" but package-lock.json has no packages["${key}"] — run npm install in frontend/ and commit the lockfile`,
    );
  }
}

console.log("OK: frontend package-lock.json covers package.json direct deps (B-158)");
