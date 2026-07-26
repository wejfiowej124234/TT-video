#!/usr/bin/env node
/**
 * Batch-13 FP-E · Staging Reality probe (②)
 * - Bake freshness vs tip cite ea71c577 (immobile — do NOT retag)
 * - Chunk markers for FP-A～D code landings
 * - HTTP reachability for leaf routes + capability queues
 * ≠ Production GO · Hard Gate LOCKED · Cutover LOCKED · FINANCE_WRITE FORBIDDEN
 */
"use strict";

const fs = require("fs");
const path = require("path");

const WEB = process.env.STAGING_WEB_BASE || "https://tt-web-staging.fly.dev";
const API = process.env.STAGING_API_BASE || "https://tt-api-staging.fly.dev";
const TIP_CITE = "ea71c577";
const outDir = path.join(
  "evidence",
  "manual-uat",
  "sessions",
  "20260726T081800Z-batch13-fp-e",
);
fs.mkdirSync(outDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");

async function fetchText(url) {
  try {
    const res = await fetch(url, { redirect: "manual" });
    return { http: res.status, text: await res.text(), location: res.headers.get("location") };
  } catch (e) {
    return { http: 0, text: String(e.message || e), location: null };
  }
}

const LEAF_PATHS = [
  "/admin",
  "/admin/users",
  "/admin/orders",
  "/admin/disputes",
  "/admin/onboarding",
  "/admin/content",
  "/admin/official",
  "/admin/growth",
  "/admin/finance",
  "/admin/config",
  "/admin/guide-applications",
  "/admin/provider-applications",
  "/admin/steward-applications",
];

const FP_MARKERS = [
  { wave: "FP-D", id: "FD10-finance-fold", marker: "tt-admin-disputes-finance-obs-fold" },
  { wave: "FP-D", id: "OH7-review-strip", marker: "tt-admin-onboarding-review-strip" },
  { wave: "FP-D", id: "CC4-visual-strip", marker: "tt-admin-content-hub-visual" },
  { wave: "FP-D", id: "OO10-quick-create", marker: "tt-admin-official-hub-quick-create" },
  { wave: "FP-D", id: "GH9-quick-referral", marker: "tt-admin-growth-hub-quick-create" },
  { wave: "FP-D", id: "FD6-disputes-q", marker: "tt-admin-disputes-q" },
  { wave: "FP-C", id: "orders-search", marker: "tt-admin-orders-q" },
  { wave: "FP-B", id: "guide-passport-hash", marker: "passport_hash_present" },
];

(async () => {
  const bake = await fetchText(`${WEB}/tt-release-identity.bake.json`);
  let bakeJson = null;
  try {
    bakeJson = JSON.parse(bake.text);
  } catch {
    /* ignore */
  }
  const stagingSha = String(bakeJson?.git_sha || bakeJson?.artifact_sha || "");
  const tipImmobile = true;
  const tipMatchesStaging = stagingSha.startsWith(TIP_CITE);
  // tip is cite-only; staging may diverge — record, do not move tip
  const bakeFreshness = tipMatchesStaging
    ? "TIP_EQUALS_STAGING_SHA"
    : "STAGING_SHA_DIVERGES_FROM_TIP_CITE_EXPECTED";

  const routes = [];
  for (const p of LEAF_PATHS) {
    const r = await fetchText(`${WEB}${p}`);
    routes.push({
      path: p,
      http: r.http,
      redirects_to_login: r.http === 307 || r.http === 302,
      location: r.location,
    });
  }

  const seedPages = ["/admin", "/auth/login", "/admin/disputes", "/admin/onboarding", "/admin/content"];
  const paths = new Set();
  for (const page of seedPages) {
    const html = await fetchText(`${WEB}${page}`);
    for (const p of html.text.match(/\/_next\/static\/chunks\/[^"'\\\s>]+\.js/g) || []) {
      paths.add(p);
    }
  }

  let blob = "";
  const fetched = [];
  for (const p of [...paths].slice(0, 80)) {
    const r = await fetchText(`${WEB}${p}`);
    if (r.http === 200 && r.text.length > 200) {
      blob += `\n/* ${p} */\n` + r.text;
      fetched.push({ path: p, len: r.text.length });
    }
  }

  const markerChecks = FP_MARKERS.map((m) => ({
    ...m,
    found_in_staging_chunks: blob.includes(m.marker),
  }));
  const markersFound = markerChecks.filter((m) => m.found_in_staging_chunks).length;
  const markersTotal = markerChecks.length;

  const meta = await fetchText(`${API}/meta`);
  let metaJson = null;
  try {
    metaJson = JSON.parse(meta.text);
  } catch {
    /* ignore */
  }
  const chainId = metaJson?.chain?.chain_id ?? null;

  // Capability matrix (unauth): expect 401/403 on admin APIs — proves surface exists
  const capApis = [
    "/api/v1/admin/guide-applications?limit=5",
    "/api/v1/admin/provider-applications?limit=5",
    "/api/v1/admin/steward-applications?limit=5",
    "/api/v1/admin/disputes?limit=5",
    "/api/v1/admin/orders?limit=5",
    "/api/v1/admin/home/metrics",
  ];
  const capabilityApi = [];
  for (const p of capApis) {
    const r = await fetchText(`${API}${p}`);
    capabilityApi.push({
      path: p,
      http: r.http,
      auth_gated: r.http === 401 || r.http === 403,
      reachable: r.http > 0 && r.http !== 404,
    });
  }

  const deployHasFpMarkers = markersFound >= 3;
  const verdict = !deployHasFpMarkers
    ? "FP_E_STAGING_DEPLOY_STALE_RESCREEN_BLOCKED"
    : tipMatchesStaging
      ? "FP_E_STAGING_PROBE_READY"
      : "FP_E_STAGING_PROBE_PARTIAL_SHA_DIVERGES";

  const report = {
    schema: "traveltrust.batch13_fp_e_staging_probe.v1",
    machine: "TT_ADMIN_BATCH13_FP_E_STAGING_PROBE",
    stamp,
    web: WEB,
    api: API,
    tip_cite: TIP_CITE,
    tip_immobile: tipImmobile,
    hard_gate: "LOCKED",
    cutover: "LOCKED",
    production_go: "NO_GO",
    finance_write: "FORBIDDEN",
    bake: {
      http: bake.http,
      git_sha: stagingSha,
      build_time: bakeJson?.build_time || null,
      psg_release_version: bakeJson?.psg_release_version || null,
      contract_profile: bakeJson?.contract_profile || null,
      freshness: bakeFreshness,
      tip_equals_staging: tipMatchesStaging,
    },
    meta: {
      http: meta.http,
      chain_id: chainId,
      sepolia_expected: chainId === "11155111" || chainId === 11155111,
    },
    routes,
    chunks_fetched: fetched.length,
    fp_markers: markerChecks,
    fp_markers_found: markersFound,
    fp_markers_total: markersTotal,
    capability_api_unauth: capabilityApi,
    capability_api_surfaces_reachable: capabilityApi.every((x) => x.reachable),
    deploy_has_fp_a_to_d_markers: deployHasFpMarkers,
    rescreen_status: deployHasFpMarkers ? "ALLOWED" : "BLOCKED_UNTIL_STAGING_DEPLOY_FP_CODE",
    gates: {
      HU_495: "OPEN",
      HU_487: "OPEN",
      HU_490: "OPEN_NEEDS_OWNER_SIGN_OFF_CMD",
    },
    verdict,
    next: deployHasFpMarkers
      ? "Proceed authenticated B13-06′～14′ rescreen + C-01～C-08"
      : "Deploy FP-A～D to Staging (PCR) then re-run probe + rescreen; tip stays ea71c577 cite-only",
  };

  const latest = path.join(outDir, "batch13-fp-e-staging-probe-LATEST.json");
  const stamped = path.join(outDir, `batch13-fp-e-staging-probe-${stamp}.json`);
  fs.writeFileSync(latest, JSON.stringify(report, null, 2));
  fs.writeFileSync(stamped, JSON.stringify(report, null, 2));
  fs.writeFileSync(
    path.join("docs", "runbook", "TT-BATCH13-FP-E-STAGING-PROBE-LATEST.json"),
    JSON.stringify(report, null, 2),
  );

  console.log(JSON.stringify({ verdict, markersFound, markersTotal, stagingSha: stagingSha.slice(0, 12), tipCite: TIP_CITE, rescreen: report.rescreen_status }, null, 2));
  console.log("wrote", latest);
  process.exit(deployHasFpMarkers ? 0 : 2);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
