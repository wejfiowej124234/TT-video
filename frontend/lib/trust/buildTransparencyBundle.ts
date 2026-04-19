/**
 * P-001：用户可感知透明 — 聚合公开机读端点，生成可下载审计快照（对齐 B-482～B-485 叙事）。
 */

import { apiUrl, routes } from "@/lib/api";
import { fetchJsonWithApiStatusLog, getMeta, getMetaBuild, type MetaBuildInfo } from "@/lib/apiClient";
import type { ProtocolRef84Mirror } from "@/lib/governanceParams84Readonly";

export type TransparencyBundleV1 = {
  schema: "traveltrust_transparency_bundle.v1";
  fetched_at: string;
  build: MetaBuildInfo;
  meta_slice: Record<string, unknown>;
  protocol_reference_summary: {
    status?: string;
    doc_version?: string;
    doc_ref?: string;
  };
};

function pickChainSlice(chain: unknown): Record<string, unknown> | null {
  if (!chain || typeof chain !== "object" || Array.isArray(chain)) return null;
  const c = chain as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  if (typeof c.chain_id === "number" || typeof c.chain_id === "string") {
    out.chain_id = c.chain_id;
  }
  if (c.contracts != null && typeof c.contracts === "object") {
    out.contracts_config_present = true;
  }
  return Object.keys(out).length ? out : null;
}

/** 从 `GET /meta` 提取可公开、体积可控的透明锚点（非全量 meta）。 */
export function pickMetaTransparencySlice(meta: Record<string, unknown>): Record<string, unknown> {
  const slice: Record<string, unknown> = {};
  if (typeof meta.api_version === "string") slice.api_version = meta.api_version;
  if (typeof meta.service === "string") slice.service = meta.service;
  if (meta.build != null && typeof meta.build === "object" && !Array.isArray(meta.build)) {
    slice.build = meta.build;
  }
  const ch = pickChainSlice(meta.chain);
  if (ch) slice.chain = ch;

  const indexer = meta.indexer;
  if (indexer && typeof indexer === "object" && !Array.isArray(indexer)) {
    const mem = (indexer as Record<string, unknown>).memory;
    if (mem && typeof mem === "object" && !Array.isArray(mem)) {
      const prefix = (mem as Record<string, unknown>).last_block_hash_prefix;
      if (typeof prefix === "string" && prefix.trim()) {
        slice.indexer_last_block_hash_prefix = prefix.trim();
      }
    }
  }

  const gov = meta.governance;
  if (gov && typeof gov === "object" && !Array.isArray(gov)) {
    slice.governance_meta_keys = Object.keys(gov as object).slice(0, 32);
  }

  return slice;
}

function summarizeProtocolRef(body: ProtocolRef84Mirror): TransparencyBundleV1["protocol_reference_summary"] {
  return {
    status: typeof body.status === "string" ? body.status : undefined,
    doc_version: typeof body.doc_version === "string" ? body.doc_version : undefined,
    doc_ref: typeof body.doc_ref === "string" ? body.doc_ref : undefined,
  };
}

export async function buildTransparencyBundle(): Promise<TransparencyBundleV1> {
  const rid = `trust-${Date.now()}`;
  const headers: Record<string, string> = { "x-request-id": rid };

  const [build, meta, pref] = await Promise.all([
    getMetaBuild(),
    getMeta(),
    fetchJsonWithApiStatusLog<ProtocolRef84Mirror>("trustProtocolReference", apiUrl(routes.governanceProtocolReference), {
      headers,
    }),
  ]);

  if (!pref.res.ok) {
    throw new Error(`protocol_reference_http_${pref.res.status}`);
  }

  return {
    schema: "traveltrust_transparency_bundle.v1",
    fetched_at: new Date().toISOString(),
    build,
    meta_slice: pickMetaTransparencySlice(meta),
    protocol_reference_summary: summarizeProtocolRef(pref.body),
  };
}
