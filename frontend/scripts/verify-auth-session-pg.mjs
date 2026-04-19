#!/usr/bin/env node
/**
 * 用 psql 核对 PostgreSQL `users` / `sessions` 与登录链返回的 token、user_id 是否一致。
 *
 * 用法（仓库根目录，已配置 DATABASE_URL）：
 *   node frontend/scripts/verify-auth-session-pg.mjs <email>
 *
 * 依赖：本机 PATH 中有 `psql`；`DATABASE_URL` 来自环境变量或根目录 `.env` 首行匹配。
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL?.trim()) return process.env.DATABASE_URL.trim();
  const p = resolve(process.cwd(), ".env");
  try {
    const s = readFileSync(p, "utf8");
    for (const line of s.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const m = t.match(/^DATABASE_URL=(.+)$/);
      if (m) return m[1].trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    // ignore
  }
  return null;
}

function main() {
  const email = process.argv[2]?.trim();
  if (!email) {
    console.error("Usage: node frontend/scripts/verify-auth-session-pg.mjs <email>");
    process.exit(2);
  }
  const db = loadDatabaseUrl();
  if (!db) {
    console.error("DATABASE_URL unset and not found in .env");
    process.exit(1);
  }
  const safe = email.replace(/'/g, "''");
  const sql = `
SELECT u.id::text AS user_id, u.email, u.role,
       s.token, s.created_at
FROM users u
LEFT JOIN sessions s ON s.user_id = u.id
WHERE lower(u.email) = lower('${safe}')
ORDER BY s.created_at DESC NULLS LAST;
`.trim();

  const r = spawnSync("psql", [db, "-c", sql], { encoding: "utf8" });
  if (r.error) {
    console.error(r.error.message);
    process.exit(1);
  }
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout);
    process.exit(r.status ?? 1);
  }
  console.log(r.stdout);
}

main();
