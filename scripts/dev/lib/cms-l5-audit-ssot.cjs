/**
 * CMS L5 Audit SSOT · unified Runtime/Live criteria across Visual / Content / Runtime audits.
 *
 * Destination Ambient Runtime/Live 唯一真源：
 *   evidence/GO_cms_operation/CMS-AMBIENT-RUNTIME-WIRING-LATEST.json
 *   (produced by run-cms-ambient-runtime-wiring-audit.cjs · 10/10 PASS)
 */
const fs = require('fs');
const path = require('path');

const COUNTRY_ZH_TO_ISO = {
  中国: 'CN',
  日本: 'JP',
  韩国: 'KR',
  新加坡: 'SG',
  泰国: 'TH',
  阿联酋: 'AE',
  美国: 'US',
  澳大利亚: 'AU',
  法国: 'FR',
  西班牙: 'ES',
};

const ROOT = path.join(__dirname, '../../..');
const AMBIENT_WIRING_EVIDENCE_REL = 'evidence/GO_cms_operation/CMS-AMBIENT-RUNTIME-WIRING-LATEST.json';
const AMBIENT_RUNTIME_PASS_COUNT = 10;

const UNIFIED_LIVE_CRITERIA = {
  destination_ambient: {
    ssot: AMBIENT_WIRING_EVIDENCE_REL,
    producer: 'scripts/dev/run-cms-ambient-runtime-wiring-audit.cjs',
    live_when:
      'catalog_published && runtime_reads_cms_catalog && !still_unsplash && l5_compliant (per-country row in ambient wiring evidence)',
    family_board_closed_when: 'TT_CMS_AMBIENT_RUNTIME_WIRING === PASS && pass_count >= 10',
  },
  other_families: {
    note: 'POI · Hotel · Transport · Listing — per-asset CMS Publish + Runtime catalog consumption (pending Wave 1 closure)',
  },
};

function normAuditUrl(u) {
  if (!u || typeof u !== 'string') return '';
  return u.split('?')[0].replace(/\/$/, '').trim();
}

function urlsMatchAudit(a, b) {
  const na = normAuditUrl(a);
  const nb = normAuditUrl(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const ta = na.split('/').pop();
  const tb = nb.split('/').pop();
  return Boolean(ta && tb && ta === tb);
}

function familyProgressBar(pct) {
  const filled = Math.round(pct / 10);
  return `${'█'.repeat(filled)}${'□'.repeat(10 - filled)}`;
}

function loadAmbientRuntimeWiringSsot(root = ROOT) {
  const evidencePath = path.join(root, AMBIENT_WIRING_EVIDENCE_REL);
  if (!fs.existsSync(evidencePath)) {
    return {
      loaded: false,
      evidence_path: AMBIENT_WIRING_EVIDENCE_REL,
      verdict: null,
      pass_count: 0,
      total: AMBIENT_RUNTIME_PASS_COUNT,
      rows: [],
      by_iso: {},
      is_closed: false,
    };
  }
  try {
    const doc = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
    const rows = doc.rows || [];
    const by_iso = Object.fromEntries(rows.map((r) => [r.country_iso, r]));
    const pass_count = rows.filter(
      (r) => r.runtime_reads_cms_catalog && r.l5_compliant && r.cms_ownership_ok !== false,
    ).length;
    const verdict = doc.TT_CMS_AMBIENT_RUNTIME_WIRING || null;
    return {
      loaded: true,
      evidence_path: AMBIENT_WIRING_EVIDENCE_REL,
      stamp_utc: doc.stamp_utc,
      verdict,
      pass_count,
      total: rows.length || AMBIENT_RUNTIME_PASS_COUNT,
      unsplash_count: doc.unsplash_count ?? 0,
      rows,
      by_iso,
      is_closed: verdict === 'PASS' && pass_count >= AMBIENT_RUNTIME_PASS_COUNT,
    };
  } catch (e) {
    return {
      loaded: false,
      evidence_path: AMBIENT_WIRING_EVIDENCE_REL,
      error: String(e.message || e),
      by_iso: {},
      is_closed: false,
    };
  }
}

function buildAuditSsotBlock(ambientSsot) {
  return {
    unified_live_criteria: UNIFIED_LIVE_CRITERIA,
    destination_ambient_runtime: {
      ssot: AMBIENT_WIRING_EVIDENCE_REL,
      loaded: ambientSsot.loaded,
      verdict: ambientSsot.verdict,
      pass_count: ambientSsot.pass_count,
      total: ambientSsot.total,
      is_closed: ambientSsot.is_closed,
      stamp_utc: ambientSsot.stamp_utc || null,
    },
  };
}

function applyAmbientSsotToVisualFindings(findings, ambientSsot) {
  if (!ambientSsot?.is_closed) return findings;
  return findings.map((f) => {
    if (f.cms_queue !== 'destination_ambient' || !f.country_iso) return f;
    const row = ambientSsot.by_iso[f.country_iso];
    if (!row?.runtime_reads_cms_catalog || !row?.l5_compliant) return f;
    return {
      ...f,
      url: row.runtime_url || row.catalog_url || f.url,
      current_source: 'catalog',
      asset_lifecycle: 'live',
      l5_compliant: true,
      needs_cms_l5_workflow: false,
      workflow: [],
      l5_status: 'LIVE',
      operational_action: 'Live · monitor only · ambient runtime SSOT',
      l5_automated: {
        gate: 'PASS_PARTIAL',
        note: 'ambient runtime wiring SSOT · manual L5 checklist still required',
      },
      flags: {
        ...(f.flags || {}),
        is_unsplash: false,
        is_pexels: false,
        is_placeholder: false,
        is_old_external: false,
        region_review_required: false,
      },
      ssot_ambient_wiring: true,
    };
  });
}

function overlayAmbientContentEval(row, ambientSsot) {
  if (!ambientSsot?.is_closed || row.asset_family !== 'destination_ambient') return row;
  const ssotRow = ambientSsot.by_iso[row.country_iso];
  if (!ssotRow) return row;
  const wiringOk = Boolean(ssotRow.runtime_reads_cms_catalog);
  const l5Ok = Boolean(ssotRow.l5_compliant);
  return {
    ...row,
    catalog_url: ssotRow.catalog_url || row.catalog_url,
    catalog_published: Boolean(ssotRow.catalog_published ?? row.catalog_published),
    runtime_url: ssotRow.runtime_url || row.runtime_url,
    runtime_reads_cms_catalog: wiringOk,
    runtime_cms_mismatch: Boolean(ssotRow.runtime_cms_mismatch),
    still_unsplash: Boolean(ssotRow.still_unsplash),
    still_ts_fallback: Boolean(ssotRow.still_ts_fallback),
    still_ocs: wiringOk ? false : row.still_ocs,
    legacy_unmigrated: wiringOk ? false : row.legacy_unmigrated,
    l5_compliant: wiringOk && l5Ok,
    l5_issues: wiringOk && l5Ok ? [] : row.l5_issues,
    suggest_replace: !(wiringOk && l5Ok),
    ssot_ambient_wiring: true,
  };
}

function overlayAmbientFamilyBoard(familyBoard, ambientSsot) {
  if (!ambientSsot?.is_closed || !familyBoard?.destination_ambient) return familyBoard;
  const pct = Math.round((ambientSsot.pass_count / ambientSsot.total) * 100);
  return {
    ...familyBoard,
    destination_ambient: {
      ...familyBoard.destination_ambient,
      runtime_seen: true,
      l5: 'CLOSED',
      cms_ownership: 'CLOSED',
      catalog_wiring_gap: false,
      progress_pct: pct,
      progress_bar: familyProgressBar(pct),
      blocker: '—',
      ssot_ambient_wiring: AMBIENT_WIRING_EVIDENCE_REL,
      ssot_verdict: ambientSsot.verdict,
    },
  };
}

function isoFromAmbientPagePath(pagePath) {
  if (!pagePath) return null;
  if (pagePath === '/') return 'CN';
  for (const [zh, iso] of Object.entries(COUNTRY_ZH_TO_ISO)) {
    if (pagePath.includes(zh)) return iso;
  }
  return null;
}

function applyAmbientSsotToRuntimeAssetRows(rows, ambientSsot) {
  if (!ambientSsot?.is_closed) return rows;
  return rows.map((r) => {
    if (r.asset_family !== 'destination_ambient') return r;
    const isoFromPath = isoFromAmbientPagePath(r.page_path);
    const ssotRow = isoFromPath ? ambientSsot.by_iso[isoFromPath] : null;
    if (!ssotRow?.runtime_reads_cms_catalog) return r;
    return {
      ...r,
      runtime_image_url: ssotRow.runtime_url || r.runtime_image_url,
      current_source: 'catalog',
      catalog_wiring_gap: false,
      catalog_published_url: ssotRow.catalog_url || r.catalog_published_url,
      l5_compliant: Boolean(ssotRow.l5_compliant),
      cms_ownership_ok: Boolean(ssotRow.cms_ownership_ok ?? ssotRow.runtime_reads_cms_catalog),
      l5_issues: ssotRow.l5_compliant ? [] : r.l5_issues,
      cms_ownership_issues: ssotRow.runtime_reads_cms_catalog ? [] : r.cms_ownership_issues,
      issues: ssotRow.l5_compliant && ssotRow.runtime_reads_cms_catalog ? [] : r.issues,
      ssot_ambient_wiring: true,
    };
  });
}

function reconcileGapSummary(summary, allRows, ambientSsot) {
  const auditSsot = buildAuditSsotBlock(ambientSsot);
  if (!allRows.length) {
    return {
      ...summary,
      audit_incomplete: true,
      l5_gaps_open: true,
      cms_ownership_gaps_open: true,
      catalog_wiring_gaps_open: true,
      p0_blocker: summary.p0_blocker || 'Runtime audit 未采集到 DOM 资产（连接/Playwright 失败）',
      audit_ssot: auditSsot,
    };
  }
  if (!ambientSsot?.is_closed) {
    return {
      ...summary,
      audit_ssot: auditSsot,
    };
  }
  const family_board = overlayAmbientFamilyBoard(summary.family_board, ambientSsot);
  const opsRows = allRows.filter((r) =>
    ['destination_ambient', 'poi', 'hotel', 'transport', 'provider_listing', 'acquisition_listing', 'banner', 'video_poster'].includes(
      r.asset_family,
    ),
  );
  const l5Gaps = opsRows.filter((r) => !r.l5_compliant && r.asset_family !== 'destination_ambient');
  const cmsGaps = opsRows.filter((r) => !r.cms_ownership_ok && r.asset_family !== 'destination_ambient');
  const wiringGaps = opsRows.filter((r) => r.catalog_wiring_gap && r.asset_family !== 'destination_ambient');

  const p0FromOthers = [...l5Gaps, ...cmsGaps, ...wiringGaps].find((r) => r.priority === 'P0' || r.asset_family === 'poi');

  return {
    ...summary,
    family_board,
    l5_gaps_open: l5Gaps.length > 0,
    cms_ownership_gaps_open: cmsGaps.length > 0,
    catalog_wiring_gaps_open: wiringGaps.length > 0,
    p0_blocker: p0FromOthers
      ? `${p0FromOthers.asset_family}：Runtime/L5 或 CMS Ownership 未闭环`
      : null,
    destination_ambient_ssot_closed: true,
    audit_ssot: buildAuditSsotBlock(ambientSsot),
  };
}

module.exports = {
  ROOT,
  AMBIENT_WIRING_EVIDENCE_REL,
  AMBIENT_RUNTIME_PASS_COUNT,
  UNIFIED_LIVE_CRITERIA,
  COUNTRY_ZH_TO_ISO,
  normAuditUrl,
  urlsMatchAudit,
  familyProgressBar,
  loadAmbientRuntimeWiringSsot,
  buildAuditSsotBlock,
  applyAmbientSsotToVisualFindings,
  overlayAmbientContentEval,
  overlayAmbientFamilyBoard,
  applyAmbientSsotToRuntimeAssetRows,
  reconcileGapSummary,
};
