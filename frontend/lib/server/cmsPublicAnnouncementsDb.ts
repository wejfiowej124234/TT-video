import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Pool } from "pg";

export type CmsPublicAnnouncementRow = {
  id: string;
  slug: string;
  lane: string;
  kind: string;
  content_tier: string;
  publish_status: string;
  pinned: boolean;
  sort_order: number;
  title_zh: string;
  title_en: string;
  summary_zh: string;
  summary_en: string;
  body_zh: string | null;
  body_en: string | null;
  effective_at: string | null;
  release_at: string | null;
  target_at: string | null;
  cta_kind: string | null;
  cta_href: string | null;
  network_scope: string;
  message_key: string | null;
  version: number;
  published_at: string | null;
  updated_at: string;
};

let pool: Pool | null = null;
let migrated = false;

function loadRootEnvIfNeeded(): void {
  if (process.env.DATABASE_URL?.trim()) return;
  try {
    const envPath = join(process.cwd(), "..", ".env");
    const raw = readFileSync(envPath, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const key = trimmed.slice(0, trimmed.indexOf("=")).trim();
      if (process.env[key]) continue;
      let val = trimmed.slice(trimmed.indexOf("=") + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  } catch {
    /* optional root .env */
  }
}

function repoRoot(): string {
  return join(process.cwd(), "..");
}

function migrationSql(): string {
  return readFileSync(
    join(repoRoot(), "crates/api/migrations/20260709140000_cms_public_announcements.sql"),
    "utf8",
  );
}

async function getPool(): Promise<Pool | null> {
  loadRootEnvIfNeeded();
  const dsn = process.env.DATABASE_URL?.trim();
  if (!dsn) return null;
  if (!pool) {
    const { Pool: PgPool } = await import("pg");
    pool = new PgPool({ connectionString: dsn, connectionTimeoutMillis: 8000 });
  }
  if (!migrated) {
    await pool.query(migrationSql());
    migrated = true;
  }
  return pool;
}

function formatPgDate(v: unknown): string | null {
  if (v == null) return null;
  if (v instanceof Date) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    const d = String(v.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return null;
}

function mapRow(r: Record<string, unknown>): CmsPublicAnnouncementRow {
  return {
    id: String(r.id),
    slug: String(r.slug),
    lane: String(r.lane),
    kind: String(r.kind),
    content_tier: String(r.content_tier),
    publish_status: String(r.publish_status),
    pinned: Boolean(r.pinned),
    sort_order: Number(r.sort_order ?? 0),
    title_zh: String(r.title_zh),
    title_en: String(r.title_en),
    summary_zh: String(r.summary_zh ?? ""),
    summary_en: String(r.summary_en ?? ""),
    body_zh: r.body_zh == null ? null : String(r.body_zh),
    body_en: r.body_en == null ? null : String(r.body_en),
    effective_at: formatPgDate(r.effective_at),
    release_at: formatPgDate(r.release_at),
    target_at: formatPgDate(r.target_at),
    cta_kind: r.cta_kind == null ? null : String(r.cta_kind),
    cta_href: r.cta_href == null ? null : String(r.cta_href),
    network_scope: String(r.network_scope ?? "none"),
    message_key: r.message_key == null ? null : String(r.message_key),
    version: Number(r.version ?? 1),
    published_at: r.published_at == null ? null : String(r.published_at),
    updated_at: String(r.updated_at),
  };
}

const SELECT_COLS = `
  id, slug, lane, kind, content_tier, publish_status, pinned, sort_order,
  title_zh, title_en, summary_zh, summary_en, body_zh, body_en,
  effective_at, release_at, target_at, cta_kind, cta_href, network_scope,
  message_key, version, published_at, updated_at
`;

export async function listAdminCmsAnnouncements(filters?: {
  publish_status?: string;
  lane?: string;
}): Promise<CmsPublicAnnouncementRow[]> {
  const p = await getPool();
  if (!p) return [];
  const clauses: string[] = [];
  const vals: unknown[] = [];
  if (filters?.publish_status) {
    vals.push(filters.publish_status);
    clauses.push(`publish_status = $${vals.length}`);
  }
  if (filters?.lane) {
    vals.push(filters.lane);
    clauses.push(`lane = $${vals.length}`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const res = await p.query(
    `SELECT ${SELECT_COLS} FROM cms_public_announcements ${where}
     ORDER BY sort_order DESC, updated_at DESC`,
    vals,
  );
  return res.rows.map((r) => mapRow(r));
}

export async function listPublishedCmsAnnouncements(opts?: {
  lane?: string;
  pulseOnly?: boolean;
  limit?: number;
}): Promise<CmsPublicAnnouncementRow[]> {
  const p = await getPool();
  if (!p) return [];
  const vals: unknown[] = [];
  const clauses: string[] = [];
  if (opts?.pulseOnly) {
    clauses.push(`lane = 'product'`);
  } else if (opts?.lane && opts.lane !== "all") {
    vals.push(opts.lane);
    clauses.push(`lane = $${vals.length}`);
  }
  const where = clauses.length ? `AND ${clauses.join(" AND ")}` : "";
  const limit = Math.min(Math.max(opts?.limit ?? 50, 1), 100);
  vals.push(limit);
  const res = await p.query(
    `SELECT ${SELECT_COLS} FROM cms_public_announcements
     WHERE publish_status = 'published' ${where}
     ORDER BY pinned DESC, sort_order DESC, published_at DESC NULLS LAST
     LIMIT $${vals.length}`,
    vals,
  );
  return res.rows.map((r) => mapRow(r));
}

export type CmsAnnouncementCreateBody = {
  slug: string;
  lane: string;
  kind: string;
  content_tier: string;
  pinned?: boolean;
  sort_order?: number;
  title_zh: string;
  title_en: string;
  summary_zh?: string;
  summary_en?: string;
  body_zh?: string;
  body_en?: string;
  release_at?: string;
  effective_at?: string;
  cta_href?: string;
  cta_kind?: string;
};

export async function createCmsAnnouncement(
  body: CmsAnnouncementCreateBody,
): Promise<CmsPublicAnnouncementRow | null> {
  const p = await getPool();
  if (!p) return null;
  const res = await p.query(
    `INSERT INTO cms_public_announcements
      (slug, lane, kind, content_tier, pinned, sort_order, title_zh, title_en,
       summary_zh, summary_en, body_zh, body_en, release_at, effective_at, cta_href, cta_kind)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     RETURNING ${SELECT_COLS}`,
    [
      body.slug.trim(),
      body.lane,
      body.kind,
      body.content_tier,
      body.pinned ?? false,
      body.sort_order ?? 0,
      body.title_zh,
      body.title_en,
      body.summary_zh ?? "",
      body.summary_en ?? "",
      body.body_zh ?? null,
      body.body_en ?? null,
      body.release_at ?? null,
      body.effective_at ?? null,
      body.cta_href ?? null,
      body.cta_kind ?? null,
    ],
  );
  return res.rows[0] ? mapRow(res.rows[0]) : null;
}

export async function publishCmsAnnouncement(
  id: string,
  version: number,
  publish: boolean,
): Promise<CmsPublicAnnouncementRow | null> {
  const p = await getPool();
  if (!p) return null;
  const status = publish ? "published" : "draft";
  const publishedClause = publish ? ", published_at = COALESCE(published_at, now())" : "";
  const res = await p.query(
    `UPDATE cms_public_announcements SET
       publish_status = $2, version = version + 1, updated_at = now()${publishedClause}
     WHERE id = $1::uuid AND version = $3
     RETURNING ${SELECT_COLS}`,
    [id, status, version],
  );
  return res.rows[0] ? mapRow(res.rows[0]) : null;
}
