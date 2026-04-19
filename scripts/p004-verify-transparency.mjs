#!/usr/bin/env node
/**
 * P-004：外部可复现透明指纹（与 `frontend/lib/trust/stableStringify.ts` + `transparencyFingerprint.ts` 对齐）
 *
 * 用法：
 *   node scripts/p004-verify-transparency.mjs <snapshot.json>
 *   node scripts/p004-verify-transparency.mjs --from-api <baseUrl>
 *
 * 输出含 `codec`、`fingerprint`（64 位 hex），可与浏览器 /trust 或就地验证展示对照。
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const CODEC_ID = "traveltrust_transparency_fingerprint.v1:stable_json_keysort_utf8_sha256";

function stableStringify(value) {
  if (value === null) return "null";
  const t = typeof value;
  if (t === "string") return JSON.stringify(value);
  if (t === "number" || t === "boolean") return JSON.stringify(value);
  if (t === "bigint") return JSON.stringify(value.toString());
  if (t === "undefined") return "null";
  if (Array.isArray(value)) {
    return `[${value.map((x) => stableStringify(x)).join(",")}]`;
  }
  if (t === "object") {
    const o = value;
    const keys = Object.keys(o).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(o[k])}`).join(",")}}`;
  }
  return JSON.stringify(String(value));
}

function sha256HexUtf8(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

function pickChainSlice(chain) {
  if (!chain || typeof chain !== "object" || Array.isArray(chain)) return null;
  const out = {};
  if (typeof chain.chain_id === "number" || typeof chain.chain_id === "string") {
    out.chain_id = chain.chain_id;
  }
  if (chain.contracts != null && typeof chain.contracts === "object") {
    out.contracts_config_present = true;
  }
  return Object.keys(out).length ? out : null;
}

function pickMetaTransparencySlice(meta) {
  const slice = {};
  if (typeof meta.api_version === "string") slice.api_version = meta.api_version;
  if (typeof meta.service === "string") slice.service = meta.service;
  if (meta.build != null && typeof meta.build === "object" && !Array.isArray(meta.build)) {
    slice.build = meta.build;
  }
  const ch = pickChainSlice(meta.chain);
  if (ch) slice.chain = ch;
  const indexer = meta.indexer;
  if (indexer && typeof indexer === "object" && !Array.isArray(indexer)) {
    const mem = indexer.memory;
    if (mem && typeof mem === "object" && !Array.isArray(mem)) {
      const prefix = mem.last_block_hash_prefix;
      if (typeof prefix === "string" && prefix.trim()) {
        slice.indexer_last_block_hash_prefix = prefix.trim();
      }
    }
  }
  const gov = meta.governance;
  if (gov && typeof gov === "object" && !Array.isArray(gov)) {
    slice.governance_meta_keys = Object.keys(gov).slice(0, 32);
  }
  return slice;
}

function parseMetaBuildRoot(root) {
  const sha = root.git_sha;
  if (typeof sha !== "string" || !sha.trim()) return null;
  const dep = root.deployed_at;
  let deployed_at = null;
  if (typeof dep === "string" && dep.trim()) deployed_at = dep.trim();
  else if (dep !== null && dep !== undefined) return null;
  return { git_sha: sha.trim(), deployed_at };
}

function summarizeProtocolRef(body) {
  return {
    status: typeof body.status === "string" ? body.status : undefined,
    doc_version: typeof body.doc_version === "string" ? body.doc_version : undefined,
    doc_ref: typeof body.doc_ref === "string" ? body.doc_ref : undefined,
  };
}

function assertOkJson(res, label) {
  if (!res.ok) {
    throw new Error(`${label}_http_${res.status}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("json")) {
    throw new Error(`${label}_not_json`);
  }
  return res.json();
}

async function fetchBundleFromApi(baseUrlRaw) {
  const u = new URL(baseUrlRaw.endsWith("/") ? baseUrlRaw.slice(0, -1) : baseUrlRaw);
  const rid = `p004-${Date.now()}`;
  const headers = { "x-request-id": rid, Accept: "application/json" };

  const [buildRes, metaRes, prefRes] = await Promise.all([
    fetch(new URL("/meta/build", u), { headers }),
    fetch(new URL("/meta", u), { headers }),
    fetch(new URL("/api/v1/governance/protocol-reference", u), { headers }),
  ]);

  const buildJson = await assertOkJson(buildRes, "meta_build");
  const metaJson = await assertOkJson(metaRes, "meta");
  const prefJson = await assertOkJson(prefRes, "protocol_reference");

  const build = parseMetaBuildRoot(buildJson);
  if (!build) throw new Error("meta_build_invalid");

  const bundle = {
    schema: "traveltrust_transparency_bundle.v1",
    fetched_at: new Date().toISOString(),
    build,
    meta_slice: pickMetaTransparencySlice(metaJson),
    protocol_reference_summary: summarizeProtocolRef(prefJson),
  };
  return bundle;
}

function fingerprintFromBundleObject(bundle) {
  const s = stableStringify(bundle);
  return { fingerprint: sha256HexUtf8(s), canonical: s };
}

function printReport(bundle, { source }) {
  const { fingerprint, canonical } = fingerprintFromBundleObject(bundle);
  const lines = [
    `codec: ${CODEC_ID}`,
    `schema: ${bundle.schema}`,
    `source: ${source}`,
    `fingerprint: ${fingerprint}`,
    `---`,
    `canonical_length_utf8: ${Buffer.byteLength(canonical, "utf8")}`,
  ];
  console.log(lines.join("\n"));
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
    console.log(`TravelTrust P-004 external transparency verification

${CODEC_ID}

Read a downloaded snapshot JSON (same as browser "download audit JSON") or fetch live API.

  node scripts/p004-verify-transparency.mjs <path/to/snapshot.json>
  node scripts/p004-verify-transparency.mjs --from-api http://127.0.0.1:8080

Fingerprint = SHA-256 hex of UTF-8 stableStringify(bundle); key-sorted JSON object encoding (see frontend/lib/trust/stableStringify.ts).
`);
    process.exit(argv.length === 0 ? 1 : 0);
  }

  if (argv[0] === "--from-api") {
    const base = argv[1];
    if (!base) {
      console.error("missing base URL after --from-api");
      process.exit(1);
    }
    const bundle = await fetchBundleFromApi(base);
    printReport(bundle, { source: `api:${base}` });
    return;
  }

  const filePath = path.resolve(argv[0]);
  const raw = fs.readFileSync(filePath, "utf8");
  const bundle = JSON.parse(raw);
  if (bundle?.schema !== "traveltrust_transparency_bundle.v1") {
    console.error("snapshot schema must be traveltrust_transparency_bundle.v1");
    process.exit(1);
  }
  printReport(bundle, { source: `file:${filePath}` });
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
