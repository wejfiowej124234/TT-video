// 96-16: 119 routes × D1–D12 total coverage matrix (JSON).
// - Route N_A + COVERED_RULES: scripts/matrix-96-16-shared.mjs (same as build-d5d6d7-coverage-matrix.mjs).
// - Aggregates existing GO_96_16*.json in frontend/evidence for machine index.
// - D5/D6 follow route-classify; D7 requires per-route Lighthouse or marks NEEDS_FIX (93 / 96-13) except /(home) when snippet exists.
// - D4: global D4 batch evidence (error.tsx / motion-safe) applies to all non-N_A routes.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildRouteIndex, classifyRoute, COVERED_RULES, FRONTEND_ROOT } from "./matrix-96-16-shared.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = FRONTEND_ROOT;
const evDir = path.join(frontendRoot, "evidence");

const DEFAULT_CI = ["npm run lint", "npm run test:i18n:ci", "npm run build"];
const DIM_KEYS = ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9", "D10", "D11", "D12"];

/** @type {string[]} D4 global scan artifacts (all non-N_A routes) */
const GLOBAL_D4_FILES = [
  "GO_96_16_d4_138_motion_touch_batch.json",
  "GO_96_16_d4_admin_auth_batch.json",
  "GO_96_16_d4_segment_gap_close.json",
];

/**
 * Per-evidence file → dimensions that batch is treated as substantiating (multi-dim audit, not re-parsing body text).
 * d5_d6_d7_*.json entries intentionally include D1–D3, D5–D6, D8–D9, D12 where applicable; D7 is overridden in code.
 */
const EVIDENCE_TO_DIMS = {
  "GO_96_16_d5_d6_d7_landing_batch.json": ["D1", "D2", "D3", "D5", "D6", "D8", "D9", "D11", "D12"],
  "GO_96_16_d5_d6_d7_reports_orders_admin_deep.json": ["D1", "D2", "D3", "D5", "D6", "D8", "D9", "D10", "D11", "D12"],
  "GO_96_16_d5_d6_d7_admin_community_observability_config_guides_staking_traveltrust.json": [
    "D1", "D2", "D3", "D5", "D6", "D8", "D9", "D10", "D11", "D12",
  ],
  "GO_96_16_d5_d6_d7_admin_finance_disputes_orders_governance_market.json": [
    "D1", "D2", "D3", "D5", "D6", "D8", "D9", "D10", "D11", "D12",
  ],
  "GO_96_16_d5_d6_d7_admin_orders_escrow_pay_batch5.json": ["D1", "D2", "D3", "D5", "D6", "D8", "D9", "D10", "D11", "D12"],
  "GO_96_16_d5_d6_d7_admin_subroutes_d5d6d7.json": ["D1", "D2", "D3", "D5", "D6", "D8", "D9", "D10", "D11", "D12"],
  "GO_96_16_d5_d6_d7_routes_batch.json": ["D1", "D2", "D3", "D5", "D6", "D8", "D9", "D10", "D11", "D12"],
  "GO_96_16_d5_d6_d7_routes_followup2.json": ["D1", "D2", "D3", "D5", "D6", "D8", "D9", "D10", "D11", "D12"],
  "GO_96_16_d5_d6_d7_routes_followup3.json": ["D1", "D2", "D3", "D5", "D6", "D8", "D9", "D10", "D11", "D12"],
  "GO_96_16_d5_d6_d7_community_traveltrust_governance_batch4.json": ["D1", "D2", "D3", "D5", "D6", "D8", "D9", "D10", "D11", "D12"],
  "GO_96_16_d5_d6_d7_me_community_itinerary_discover_traveltrust.json": ["D1", "D2", "D3", "D5", "D6", "D8", "D9", "D10", "D11", "D12"],
  "GO_96_16_d5_d6_d7_auth_me_guides_staking_legal_batch.json": ["D1", "D2", "D3", "D5", "D6", "D8", "D9", "D10", "D11", "D12"],
  "GO_96_16_d5_d6_d7_governance_subroutes_d5d6d7.json": ["D1", "D2", "D3", "D5", "D6", "D8", "D9", "D10", "D11", "D12"],
  "GO_96_16_d5_d6_d7_uncovered_routes_sweep.json": ["D1", "D2", "D3", "D5", "D6", "D8", "D9", "D10", "D11", "D12"],
};

for (const f of new Set(COVERED_RULES.map((r) => r.evidence))) {
  if (EVIDENCE_TO_DIMS[f] === undefined) {
    throw new Error(
      `[build-d1-d12] EVIDENCE_TO_DIMS missing "${f}" (used in matrix-96-16-shared.mjs COVERED_RULES).`,
    );
  }
}

/** @returns {boolean} */
function isWalletRelevantRoute(route) {
  const r = route === "/(home)" ? "/" : route;
  const p = r.startsWith("/") ? r : `/${r}`;
  if (p === "/did-rank") return true;
  if (p.startsWith("/governance") || p.startsWith("/market") || p.startsWith("/orders") || p.startsWith("/escrow") || p.startsWith("/pay")) return true;
  if (p.startsWith("/staking") || p.startsWith("/me") || p.startsWith("/disputes") || p.startsWith("/escrow")) return true;
  if (p.startsWith("/admin")) return true;
  if (p.startsWith("/itinerary")) return true;
  if (p.startsWith("/community")) return true;
  if (p.startsWith("/traveltrust")) return true;
  if (p.startsWith("/discover") || p.startsWith("/guide")) return true;
  return false;
}

function unionDimsForFiles(files) {
  const s = new Set();
  for (const f of files) {
    for (const d of EVIDENCE_TO_DIMS[f] || []) s.add(d);
  }
  return s;
}

function filesSupportingDim(files, dim) {
  return files.filter((f) => (EVIDENCE_TO_DIMS[f] || []).includes(dim));
}

function globalD4Present() {
  return GLOBAL_D4_FILES.filter((b) => fs.existsSync(path.join(evDir, b)));
}

/**
 * @param {string} route
 * @param {{ status: string, evidence_files: string[] }} c
 * @param {{ homeLighthouse: boolean, globalD4: string[] }} ctx
 */
function buildDims(route, c, ctx) {
  if (c.status === "N_A") {
    const o = {};
    for (const d of DIM_KEYS) o[d] = { status: "N_A", evidence_files: [] };
    return o;
  }
  const files = c.evidence_files;
  const u = unionDimsForFiles(files);
  const o = {};
  const hasD4Global = ctx.globalD4.length > 0;
  for (const d of DIM_KEYS) {
    if (d === "D4") {
      o.D4 = hasD4Global
        ? { status: "COVERED", evidence_files: ctx.globalD4, trace: "global_d4_batch_scan" }
        : { status: "NEEDS_FIX", evidence_files: [], trace: "missing global D4 batch JSON" };
      continue;
    }
    if (d === "D5" || d === "D6") {
      if (c.status === "COVERED") o[d] = { status: "COVERED", evidence_files: [...files] };
      else o[d] = { status: "NEEDS_FIX", evidence_files: [] };
      continue;
    }
    if (d === "D7") {
      if (route === "/(home)" && ctx.homeLighthouse) {
        o.D7 = {
          status: "COVERED",
          evidence_files: ["GO_96_16_13_local_hal_run.json", "lighthouse-root-3012.metrics-snippet.json"],
          trace: "only / (user); snippet not full 119-route Lighthouse",
        };
      } else {
        o.D7 = { status: "NEEDS_FIX", evidence_files: [], trace: "93; 96-13.7; no per-route Lighthouse" };
      }
      continue;
    }
    if (d === "D10") {
      if (!isWalletRelevantRoute(route)) {
        o.D10 = { status: "N_A", evidence_files: [] };
        continue;
      }
      if (c.status === "NEEDS_FIX" || !u.has("D10")) {
        o.D10 = { status: "NEEDS_FIX", evidence_files: [] };
      } else {
        o.D10 = { status: "COVERED", evidence_files: filesSupportingDim(files, "D10") };
      }
      continue;
    }
    if (c.status === "COVERED" && u.has(d)) {
      o[d] = { status: "COVERED", evidence_files: filesSupportingDim(files, d) };
    } else {
      o[d] = { status: "NEEDS_FIX", evidence_files: [] };
    }
  }
  return o;
}

function aggregateGo9616Evidence() {
  const names = fs
    .readdirSync(evDir)
    .filter(
      (n) =>
        n.startsWith("GO_96_16") &&
        n.endsWith(".json") &&
        n !== "GO_96_16_d1_d12_coverage_matrix_v1.json" &&
        !n.startsWith("GO_96_16_evidence_aggregation"),
    );
  const out = { files: [], playwright_e2e: { status: "NOT_RUN", trace: "93" }, lighthouse_per_route: { status: "NOT_RUN", trace: "96-13" } };
  for (const n of names.sort()) {
    const full = path.join(evDir, n);
    let raw;
    try {
      raw = JSON.parse(fs.readFileSync(full, "utf8"));
    } catch {
      out.files.push({ basename: n, read_error: true });
      continue;
    }
    const rec = { basename: n, batch: raw.batch || null, docs_spec_touched: raw.docs_spec_touched ?? null };
    if (Array.isArray(raw.fail_or_accepted_risk)) {
      rec.fail_or_accepted_risk = raw.fail_or_accepted_risk.map((x) => ({ id: x.id, status: x.status, trace: x.trace, detail: x.detail?.slice ? x.detail.slice(0, 200) : x.detail }));
    }
    if (raw.e2e_playwright_chromium) {
      out.playwright_e2e = { status: String(raw.e2e_playwright_chromium.status), trace: "93" };
    }
    if (raw.playwright_screenshot) rec.playwright_screenshot = raw.playwright_screenshot;
    if (raw.commands?.lighthouse) rec.lighthouse_cmd = "present in GO_96_16_13_local_hal_run";
    if (n === "GO_96_16_smoke_ui_release.json" && Array.isArray(raw.fail_or_accepted_risk)) {
      const lh = raw.fail_or_accepted_risk.find((x) => x.id === "lighthouse_in_smoke");
      if (lh) {
        out.lighthouse_per_route = { status: "NOT_RUN", trace: "96-13; 93; smoke:ui-release does not run Lighthouse per 119 routes" };
      }
    }
    if (n === "GO_96_16_d5_d6_d7_coverage_matrix_v1.json" && raw.playwright_e2e) {
      out.playwright_e2e = raw.playwright_e2e;
    }
    out.files.push(rec);
  }
  if (fs.existsSync(path.join(evDir, "lighthouse-root-3012.metrics-snippet.json"))) {
    out.lighthouse_root_snippet = { path: "frontend/evidence/lighthouse-root-3012.metrics-snippet.json", url_sample: "http://127.0.0.1:3012/ only" };
  }
  return out;
}

const { routes, byRoute } = buildRouteIndex(frontendRoot);

const globalD4 = globalD4Present();
const homeLighthouse = fs.existsSync(path.join(evDir, "lighthouse-root-3012.metrics-snippet.json")) && fs.existsSync(path.join(evDir, "GO_96_16_13_local_hal_run.json"));

const evidenceAgg = aggregateGo9616Evidence();
fs.writeFileSync(path.join(evDir, "GO_96_16_evidence_aggregation_d1_d12.json"), JSON.stringify(evidenceAgg, null, 2));

const countDims = () => {
  const z = Object.fromEntries(DIM_KEYS.map((d) => [d, { COVERED: 0, N_A: 0, NEEDS_FIX: 0 }]));
  return z;
};

const dimCounts = countDims();
const routeClassify = [];

const rows = routes.map((route) => {
  const c = classifyRoute(route);
  const file = byRoute.get(route) ?? "";
  const dims = buildDims(route, c, { homeLighthouse, globalD4 });
  for (const d of DIM_KEYS) {
    const st = dims[d].status;
    dimCounts[d][st] += 1;
  }
  routeClassify.push({ route, route_class: c.status });
  const risks = [
    "96 未完成：本矩阵为机读汇总，不宣布 GO 全站完成。",
    "E2E 93：chromium/全栈 未在矩阵内重跑，见 evidence 聚合。",
    "D7：除 /(home) 根与 snippet 外，无逐页 Lighthouse（NEEDS_FIX）。",
  ];
  if (c.status === "NEEDS_FIX")
    risks.push("路由未命中 D5–D7 基线规则：须补 rules 于 scripts/matrix-96-16-shared.mjs 或补证据。");
  return {
    file: `frontend/${file}`,
    route,
    route_class_d5d6d7: c.status,
    evidence_files_d5d6d7: c.evidence_files,
    test_commands: DEFAULT_CI,
    dimensions: dims,
    remaining_risks: risks,
  };
});

const out = {
  kind: "GO_96_16_d1_d12_coverage_matrix",
  version: 3,
  generated_by: "scripts/build-d1-d12-coverage-matrix.mjs",
  route_rules: "scripts/matrix-96-16-shared.mjs",
  baseline: "96-16: 119 routes = app/**/page.tsx (same as build-d5d6d7-coverage-matrix.mjs / GO_96_16_d5_d6_d7_coverage_matrix_v1.json)",
  methodology:
    "D5/D6 + route 命中规则与 d5d6d7 矩阵同构（NA_EXACT + COVERED_RULES 见 matrix-96-16-shared.mjs）。D4：GLOBAL_D4_FILES 在 evidence 内存在则全部非 N_A 路由记 COVERED。D1–D3/D8/D9/D10/D11/D12：由命中 evidence 的 EVIDENCE_TO_DIMS 并集；未列维度或路由未覆盖 → NEEDS_FIX。D11：与各路族 d5_d6_d7 批次同 scope（可观测/排障面随页走查，非独立 x-request-id 单测）。D7：有 lighthouse-root-3012.metrics-snippet 且 13 报告存在时仅 /(home) 记 COVERED，余路由 NEEDS_FIX（93/性能）。D10：无链/无钱包界面之路由 N_A。不扩展 D5–D7 新批次，不重读 evidence 正文做缺口推断。v2：补全 D11 映射。v3：路由规则单源 shared 模块。",
  claim_96_complete: false,
  playwright_e2e: evidenceAgg.playwright_e2e || { status: "NOT_RUN", trace: "93" },
  lighthouse: {
    per_route: { status: "NOT_RUN", note: "119 routes without per-route Lighthouse; D7 mostly NEEDS_FIX" },
    root_snippet: homeLighthouse ? "frontend/evidence/lighthouse-root-3012.metrics-snippet.json" : null,
  },
  total_routes: rows.length,
  dim_counts: dimCounts,
  route_class_d5d6d7_counts: routeClassify.reduce(
    (acc, x) => {
      acc[x.route_class] = (acc[x.route_class] || 0) + 1;
      return acc;
    },
    {},
  ),
  evidence_aggregation: "frontend/evidence/GO_96_16_evidence_aggregation_d1_d12.json",
  rows,
};

fs.writeFileSync(path.join(evDir, "GO_96_16_d1_d12_coverage_matrix_v1.json"), JSON.stringify(out, null, 2));

console.log(
  `Wrote GO_96_16_d1_d12_coverage_matrix_v1.json + GO_96_16_evidence_aggregation_d1_d12.json. Routes=${rows.length} D7 NEEDS_FIX≈${
    dimCounts.D7?.NEEDS_FIX
  } homeLighthouse=${homeLighthouse}`,
);
