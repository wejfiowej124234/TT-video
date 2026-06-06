/**
 * **元数据与健康**（**`GET /api/v1/meta`**、**`GET …/meta/build`** 等；**`crates/api/src/routes/health_meta`**；**04** §7.10 等）。
 *
 * **只读**、一般**无需登录**；**不**走 **`chain_off_unavailable`** 式业务门禁（与 **`/orders` 写路径**不同）。响应形状与机读键序见同目录 **`topKeys*.ts`** / **`chainRuleClauses.ts`** 及后端 **`handlers.rs`**。
 */

import { META_DEV_FALLBACK } from "@/lib/metaDevFallback";
import { apiUrl, routes } from "../../api";
import { requestId, parseResponse, logApiJsonStatusNotOk, throwUnlessApiOk } from "../core";
import type { MetaBuildInfo, ProductRolesMeta, AuthRegistrationMeta } from "./types";


function parseProductRolesFields(o: Record<string, unknown>): ProductRolesMeta | null {
  const stored = o.users_role_stored;
  if (!Array.isArray(stored) || !stored.every((x) => typeof x === "string")) return null;
  const mapRaw = o.me_public_role_mapping;
  if (mapRaw == null || typeof mapRaw !== "object" || Array.isArray(mapRaw)) return null;
  const me_public_role_mapping: Record<string, string> = {};
  for (const [k, v] of Object.entries(mapRaw as Record<string, unknown>)) {
    if (typeof v !== "string") return null;
    me_public_role_mapping[k] = v;
  }
  const target = o.protocol_roles_target_87;
  if (!Array.isArray(target) || !target.every((x) => typeof x === "string")) return null;
  if (typeof o.provider_in_users_role !== "boolean") return null;
  if (typeof o.region_steward_in_users_role !== "boolean") return null;
  const rule = o.rule;
  if (typeof rule !== "string" || !rule.trim()) return null;
  return {
    users_role_stored: stored as string[],
    me_public_role_mapping,
    protocol_roles_target_87: target as string[],
    provider_in_users_role: o.provider_in_users_role,
    region_steward_in_users_role: o.region_steward_in_users_role,
    rule: rule.trim(),
  };
}

/**
 * 从 **GET /meta** 根对象解析 **`product_roles`**；形状与后端 **`product_roles_meta_obs_json`** 对齐（690 / 692）。
 * 缺域或类型不符时返回 **null**（fail-closed）。
 */
export function readProductRolesFromMeta(meta: Record<string, unknown>): ProductRolesMeta | null {
  const raw = meta.product_roles;
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return null;
  return parseProductRolesFields(raw as Record<string, unknown>);
}

function parseAuthRegistrationFields(o: Record<string, unknown>): AuthRegistrationMeta | null {
  const allowed = o.self_serve_roles_allowed;
  if (!Array.isArray(allowed) || !allowed.every((x) => typeof x === "string")) return null;
  const aliasesRaw = o.request_role_aliases;
  if (aliasesRaw == null || typeof aliasesRaw !== "object" || Array.isArray(aliasesRaw)) return null;
  const request_role_aliases: Record<string, string> = {};
  for (const [k, v] of Object.entries(aliasesRaw as Record<string, unknown>)) {
    if (typeof v !== "string") return null;
    request_role_aliases[k] = v;
  }
  if (typeof o.default_role !== "string" || !o.default_role.trim()) return null;
  if (typeof o.invalid_role_error_key !== "string" || !o.invalid_role_error_key.trim()) return null;
  if (typeof o.arbitrator_seed_env !== "string" || !o.arbitrator_seed_env.trim()) return null;
  if (typeof o.guide_via_separate_flow_only !== "boolean") return null;
  const rule = o.rule;
  if (typeof rule !== "string" || !rule.trim()) return null;
  return {
    self_serve_roles_allowed: allowed as string[],
    request_role_aliases,
    default_role: o.default_role.trim(),
    invalid_role_error_key: o.invalid_role_error_key.trim(),
    arbitrator_seed_env: o.arbitrator_seed_env.trim(),
    guide_via_separate_flow_only: o.guide_via_separate_flow_only,
    rule: rule.trim(),
  };
}

/**
 * 从 **GET /meta** 解析 **`auth.registration`**；与后端 **`auth_registration_meta_obs_json`** 对齐（694～697；**749** 机读键 `auth_registration_top_keys` / `contract_749` 为观测字段，本解析器不返回）。
 */
export function readAuthRegistrationFromMeta(meta: Record<string, unknown>): AuthRegistrationMeta | null {
  const auth = meta.auth;
  if (auth == null || typeof auth !== "object" || Array.isArray(auth)) return null;
  const reg = (auth as Record<string, unknown>).registration;
  if (reg == null || typeof reg !== "object" || Array.isArray(reg)) return null;
  return parseAuthRegistrationFields(reg as Record<string, unknown>);
}

function parseMetaBuildFields(b: Record<string, unknown>): MetaBuildInfo | null {
  const sha = b.git_sha;
  if (typeof sha !== "string" || !sha.trim()) return null;
  const dep = b.deployed_at;
  let deployed_at: string | null = null;
  if (typeof dep === "string" && dep.trim()) deployed_at = dep.trim();
  else if (dep !== null && dep !== undefined) return null;
  return { git_sha: sha.trim(), deployed_at };
}

/**
 * 从 GET /meta 根对象解析 `build`；与后端 `meta_build_snapshot` 形状对齐。
 * 无 `build` 或非对象时返回 null（旧 API 兼容）；`git_sha` 须为非空字符串。
 */
export function readMetaBuild(meta: Record<string, unknown>): MetaBuildInfo | null {
  const raw = meta.build;
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return null;
  return parseMetaBuildFields(raw as Record<string, unknown>);
}

/**
 * 解析 **GET /meta/build** 根对象（与 **`readMetaBuild` 作用于 `.build`** 等价，689）。
 */
export function readMetaBuildRoot(root: Record<string, unknown>): MetaBuildInfo | null {
  return parseMetaBuildFields(root);
}

function getMetaDevFallback(reason: string): Record<string, unknown> {
  if (typeof console !== "undefined" && process.env.NODE_ENV === "development") {
    console.warn(`[getMeta] dev fallback (${reason}). Start API: scripts\\start-api-with-seed.bat`);
  }
  return { ...META_DEV_FALLBACK };
}

export async function getMeta(): Promise<Record<string, unknown>> {
  const url = apiUrl(routes.meta);
  try {
    const res = await fetch(url, {
      headers: { "x-request-id": requestId() },
    });
    if (!res.ok) {
      if (process.env.NODE_ENV === "development") {
        return getMetaDevFallback(`HTTP ${res.status}`);
      }
      const parsed = await parseResponse(res);
      logApiJsonStatusNotOk("getMeta", parsed);
      throwUnlessApiOk(parsed);
    }
    const parsed = await parseResponse(res);
    logApiJsonStatusNotOk("getMeta", parsed);
    throwUnlessApiOk(parsed);
    return parsed as Record<string, unknown>;
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      return getMetaDevFallback(err instanceof Error ? err.message : String(err));
    }
    throw err;
  }
}

/** **GET /meta/build**：仅取 **`git_sha`** / **`deployed_at`**（与 **`getMeta`+`readMetaBuild`** 同源，688/689）。 */
export async function getMetaBuild(): Promise<MetaBuildInfo> {
  const res = await fetch(apiUrl(routes.metaBuild), {
    headers: { "x-request-id": requestId() },
  });
  const parsed = await parseResponse(res);
  logApiJsonStatusNotOk("getMetaBuild", parsed);
  throwUnlessApiOk(parsed);
  const info = readMetaBuildRoot(parsed as Record<string, unknown>);
  if (!info) throw new Error("meta_build_invalid");
  return info;
}
