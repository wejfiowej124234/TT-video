#!/usr/bin/env node
/**
 * Windows / 无 psql CLI：经 frontend `pg` 执行 SQL（与 docker exec psql 子集兼容）。
 * 用法：node tt-psql-exec.mjs "$DATABASE_URL" -c "SELECT 1"
 *       node tt-psql-exec.mjs "$DATABASE_URL" -tAc "SELECT 1"
 */
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dir = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(__dir, "../../../frontend/package.json"));
const pg = require("pg");

const conn = process.argv[2];
const args = process.argv.slice(3);
if (!conn) {
  console.error("tt-psql-exec: missing DATABASE_URL");
  process.exit(2);
}

let sql = "";
let tuplesOnly = false;
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "-c" && args[i + 1]) {
    sql = args[++i];
  } else if (a === "-tAc" && args[i + 1]) {
    tuplesOnly = true;
    sql = args[++i];
  } else if (a === "-q") {
    /* psql quiet — no-op */
  }
}

if (!sql.trim()) {
  console.error("tt-psql-exec: no -c / -tAc SQL");
  process.exit(2);
}

const client = new pg.Client({ connectionString: conn });
try {
  await client.connect();
  const res = await client.query(sql);
  if (tuplesOnly) {
    for (const row of res.rows) {
      const v = Object.values(row)[0];
      process.stdout.write(String(v ?? ""));
    }
  }
  await client.end();
} catch (e) {
  console.error(String(e?.message ?? e));
  try {
    await client.end();
  } catch {
    /* ignore */
  }
  process.exit(1);
}
