/**
 * Status-only dashboard assessment — no misleading progress percentages.
 * Status enum: PASS | IN_PROGRESS | BLOCKED | NOT_STARTED
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const STATUS = { PASS: 'PASS', IN_PROGRESS: 'IN_PROGRESS', BLOCKED: 'BLOCKED', NOT_STARTED: 'NOT_STARTED' };

function createDashboardContext(rootDir) {
  const ROOT = rootDir;
  const REFRESH = process.argv.includes('--refresh');

  function readJson(rel) {
    try {
      return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
    } catch {
      return null;
    }
  }

  function exists(rel) {
    return fs.existsSync(path.join(ROOT, rel));
  }

  function runNode(scriptRel) {
    spawnSync(process.execPath, [path.join(ROOT, 'scripts/dev', scriptRel)], {
      cwd: ROOT,
      encoding: 'utf8',
    });
  }

  function readProtocolGrade() {
    return readJson('evidence/GO_production_readiness/web3-protocol-grade-audit/WEB3-PROTOCOL-GRADE-AUDIT-LATEST.json');
  }

  function readCert() {
    return readJson('evidence/GO_ttg_cert/CERT-EXECUTION-INDEX-LATEST.json');
  }

  function readLifecycle() {
    return readJson('evidence/GO_production_readiness/sepolia-full-web3-lifecycle/SEPOLIA-FULL-WEB3-LIFECYCLE-VALIDATION-LATEST.json');
  }

  function readExitReview() {
    return readJson('evidence/GO_production_readiness/phase2-exit-review/PHASE2-EXIT-REVIEW-LATEST.json');
  }

  function assessPhase1() {
    const layerA = readJson('evidence/GO_production_readiness/escrow-bilateral-layer-a/ESCROW-BILATERAL-LAYER-A-EVIDENCE-LATEST.json');
    const layerB = readJson('evidence/GO_production_readiness/escrow-bilateral-layer-b/ESCROW-BILATERAL-LAYER-B-EVIDENCE-LATEST.json');
    const phase12 = readJson('evidence/GO_production_readiness/web3-phase12-closure/WEB3-PHASE12-CLOSURE-LATEST.json');
    const ok =
      layerA?.verdict === 'LAYER_A_EVIDENCE_PASS'
      && layerB?.verdict === 'LAYER_B_EVIDENCE_PASS'
      && phase12?.checks?.find((c) => c.id === 'ESCROW-V2-FORGE')?.pass === true;
    return { id: 1, name: 'Development', status: ok ? STATUS.PASS : STATUS.IN_PROGRESS };
  }

  function assess2A() {
    const layerA = readJson('evidence/GO_production_readiness/escrow-bilateral-layer-a/ESCROW-BILATERAL-LAYER-A-EVIDENCE-LATEST.json');
    const uatSignoff = readJson('evidence/GO_production_readiness/phase2-production-validation/UAT-SIGNOFF-LATEST.json');
    if (uatSignoff?.verdict === 'PHASE2_WEBSITE_PRODUCT_UAT_PASS' && layerA?.verdict === 'LAYER_A_EVIDENCE_PASS') {
      return { id: '2A', short: 'Website & Product', name: 'Website & Product UAT', status: STATUS.PASS, pass: true };
    }
    if (exists('registry/phase2-testnet-surface-coverage-registry.v1.yaml') || uatSignoff) {
      return { id: '2A', short: 'Website & Product', name: 'Website & Product UAT', status: STATUS.IN_PROGRESS, pass: false };
    }
    return { id: '2A', short: 'Website & Product', name: 'Website & Product UAT', status: STATUS.NOT_STARTED, pass: false };
  }

  function assess2B() {
    const rbac = readJson('evidence/GO_production_readiness/web3-system-audit/RBAC-D3-CLOSURE-LATEST.json');
    const adminSignoff = readJson('evidence/GO_production_readiness/operations-dashboard/ADMIN-UAT-SIGNOFF-LATEST.json');
    const rbacPass =
      rbac?.verdict === 'RBAC_D3_CLOSURE_PASS' || rbac?.verdict === 'RBAC_D3_PRODUCTION_BOUNDARY_CLOSED';
    if (adminSignoff?.verdict === 'PHASE2_ADMIN_OPS_UAT_PASS' && rbacPass) {
      return { id: '2B', short: 'Admin', name: 'Admin / Operations UAT', status: STATUS.PASS, pass: true };
    }
    if (rbac || adminSignoff || exists('registry/phase2-testnet-surface-coverage-registry.v1.yaml')) {
      return { id: '2B', short: 'Admin', name: 'Admin / Operations UAT', status: STATUS.IN_PROGRESS, pass: false };
    }
    return { id: '2B', short: 'Admin', name: 'Admin / Operations UAT', status: STATUS.NOT_STARTED, pass: false };
  }

  function assess2C() {
    const cms = readJson('evidence/GO_production_readiness/operations-dashboard/CMS-COS-VALIDATION-LATEST.json');
    if (cms?.verdict === 'PHASE2_CMS_COS_VALIDATION_PASS') {
      return { id: '2C', short: 'CMS / COS / Data', name: 'Data Governance / CMS / COS', status: STATUS.PASS, pass: true };
    }
    if (cms || exists('registry/phase2-testnet-surface-coverage-registry.v1.yaml')) {
      return { id: '2C', short: 'CMS / COS / Data', name: 'Data Governance / CMS / COS', status: STATUS.IN_PROGRESS, pass: false };
    }
    return { id: '2C', short: 'CMS / COS / Data', name: 'Data Governance / CMS / COS', status: STATUS.NOT_STARTED, pass: false };
  }

  function assess2D() {
    const lifecycle = readLifecycle();
    const cert = readCert();
    const certSigned = cert?.signed_count ?? 0;
    if (lifecycle?.verdict === 'SEPOLIA_FULL_WEB3_LIFECYCLE_PASS') {
      return { id: '2D', short: 'Web3', name: 'Web3 Lifecycle Validation', status: STATUS.PASS, pass: true, cert_signed: certSigned, cert_total: 12 };
    }
    const waitingTimelock = certSigned < 8 && exists('evidence/GO_ttg_cert/cert-08-queued.json');
    return {
      id: '2D',
      short: 'Web3',
      name: 'Web3 Lifecycle Validation',
      status: waitingTimelock ? STATUS.BLOCKED : STATUS.IN_PROGRESS,
      pass: false,
      cert_signed: certSigned,
      cert_total: 12,
      note: waitingTimelock ? 'Timelock wait — not idle' : 'Active validation',
    };
  }

  function assess2E() {
    const phase2 = readJson('evidence/GO_production_readiness/phase2-production-validation/PHASE2-PRODUCTION-VALIDATION-LATEST.json');
    const sub = phase2?.sub_tracks?.find((t) => t.id === '2E');
    const pg = readProtocolGrade();
    const rbac = readJson('evidence/GO_production_readiness/web3-system-audit/RBAC-D3-CLOSURE-LATEST.json');
    const closure = readJson('evidence/GO_production_readiness/web3-system-audit/WEB3-SYSTEM-CLOSURE-LATEST.json');
    const rbacPass =
      rbac?.verdict === 'RBAC_D3_CLOSURE_PASS' || rbac?.verdict === 'RBAC_D3_PRODUCTION_BOUNDARY_CLOSED';
    const p0Clear = (pg?.summary?.blockers_p0 ?? 99) === 0;
    const corePass = p0Clear && rbacPass;

    if (sub?.pass === true || corePass) {
      const closureNote =
        closure?.verdict === 'WEB3_SYSTEM_CLOSURE_PASS'
          ? 'system closure PASS'
          : closure?.summary?.blockers_p1
            ? `system closure P1=${closure.summary.blockers_p1} (non-blocking pre-Cert)`
            : 'system closure pending';
      return {
        id: '2E',
        short: 'Security',
        name: 'Security / RBAC / Monitoring',
        status: STATUS.PASS,
        pass: true,
        detail: sub?.detail || `Protocol-Grade P0=0 · RBAC=${rbac?.verdict || 'closed'} · ${closureNote}`,
      };
    }
    if (pg || rbac) {
      return { id: '2E', short: 'Security', name: 'Security / RBAC / Monitoring', status: STATUS.IN_PROGRESS, pass: false };
    }
    return { id: '2E', short: 'Security', name: 'Security / RBAC / Monitoring', status: STATUS.NOT_STARTED, pass: false };
  }

  function assess2F() {
    const er = readExitReview();
    if (er?.verdict === 'PHASE2_EXIT_REVIEW_PASS') {
      return { id: '2F', short: 'Exit Review', name: 'Exit Review', status: STATUS.PASS, pass: true };
    }
    if (er?.verdict === 'PHASE2_EXIT_REVIEW_IN_PROGRESS') {
      return { id: '2F', short: 'Exit Review', name: 'Exit Review', status: STATUS.IN_PROGRESS, pass: false };
    }
    if (er?.verdict === 'PHASE2_EXIT_REVIEW_BLOCKED') {
      return { id: '2F', short: 'Exit Review', name: 'Exit Review', status: STATUS.BLOCKED, pass: false };
    }
    return { id: '2F', short: 'Exit Review', name: 'Exit Review', status: STATUS.NOT_STARTED, pass: false };
  }

  function pickDragTrack(subTracks) {
    const core = subTracks.filter((t) => t.id !== '2F');
    const c = core.find((t) => t.id === '2C');
    const d = core.find((t) => t.id === '2D');
    const e = core.find((t) => t.id === '2E');

    // Phase ② discipline: ②-C Data before ②-D Timelock work when ②-C open
    if (c && !c.pass && c.status !== STATUS.NOT_STARTED) return c;
    if (d && (d.status === STATUS.BLOCKED || (d.status === STATUS.IN_PROGRESS && !d.pass))) return d;
    if (e && !e.pass && e.status === STATUS.IN_PROGRESS) return e;

    const order = { BLOCKED: 0, IN_PROGRESS: 1, NOT_STARTED: 2, PASS: 3 };
    const priority = ['2C', '2D', '2E', '2A', '2B'];
    return [...core].sort((a, b) => {
      const os = order[a.status] - order[b.status];
      if (os !== 0) return os;
      return priority.indexOf(a.id) - priority.indexOf(b.id);
    })[0];
  }

  function readTimelockEta(config) {
    const hatBase = path.join(ROOT, 'evidence/GO_hat_r1_sepolia');
    let etaUnix = 0;
    try {
      if (fs.existsSync(hatBase)) {
        for (const ent of fs.readdirSync(hatBase, { withFileTypes: true })) {
          if (!ent.isDirectory()) continue;
          const etaFile = path.join(hatBase, ent.name, 'TREASURY_EXECUTE_EARLIEST_UNIX.txt');
          if (fs.existsSync(etaFile)) {
            etaUnix = Number(fs.readFileSync(etaFile, 'utf8').trim()) || 0;
          }
        }
      }
    } catch {
      etaUnix = 0;
    }
    if (etaUnix > 0) {
      const d = new Date(etaUnix * 1000);
      return d.toISOString().slice(0, 10);
    }
    return config.default_timelock_eta || null;
  }

  function buildWaitingReason(drag, config, certSigned) {
    if (drag.id === '2C') {
      const cms = readJson('evidence/GO_production_readiness/operations-dashboard/CMS-COS-VALIDATION-LATEST.json');
      if (cms?.verdict === 'PHASE2_CMS_COS_VALIDATION_PASS') return null;
      return 'Staging media/CDN — G6 provider/acquisition cover bindings';
    }
    if (drag.id === '2D') {
      if (certSigned < 8 && exists('evidence/GO_ttg_cert/cert-08-queued.json')) {
        const eta = readTimelockEta(config);
        return eta ? `Timelock (ETA ${eta})` : 'Timelock';
      }
      if (certSigned >= 8 && certSigned < 12) return 'Cert chain execution (#9–#12)';
      return 'Web3 lifecycle validation';
    }
    if (drag.id === '2E') {
      if (certSigned < 12) return `Cert #${Math.min(certSigned + 1, 12)}–#12 + System Closure rerun`;
      return 'System Closure + Protocol-Grade P1 burn-down';
    }
    if (drag.id === '2A' || drag.id === '2B') return 'UAT evidence refresh';
    return null;
  }

  function assessPhase2(blockers) {
    const subTracks = [assess2A(), assess2B(), assess2C(), assess2D(), assess2E(), assess2F()];
    const dragTrack = pickDragTrack(subTracks);
    let status = STATUS.IN_PROGRESS;
    if (subTracks.find((t) => t.id === '2F')?.status === STATUS.PASS) status = STATUS.PASS;
    else if ((blockers?.P0?.count ?? 0) > 0) status = STATUS.BLOCKED;
    else if (subTracks.every((t) => t.status === STATUS.NOT_STARTED)) status = STATUS.NOT_STARTED;
    return { id: 2, name: 'Production Validation', status, sub_tracks: subTracks, drag_track: dragTrack };
  }

  function assessPrerequisiteReview() {
    const exitReview = readExitReview();
    const pr = readJson('evidence/GO_production_readiness/phase3-deployment-prerequisite-review/PHASE3-DEPLOYMENT-PREREQUISITE-REVIEW-LATEST.json');
    const reviewScore = pr?.summary
      ? `${pr.summary.reviews_pass ?? pr.summary.pass ?? 0}/${pr.summary.reviews_total ?? pr.summary.total ?? 10}`
      : null;
    const subScore = pr?.summary?.sub_checks_total
      ? `${pr.summary.sub_checks_pass}/${pr.summary.sub_checks_total} sub-checks`
      : null;
    const r06 = (pr?.reviews || []).find((r) => r.id === 'REVIEW-06');
    const base = {
      id: '3PRE',
      name: 'Phase ③ Deployment Prerequisite Review',
      short: 'Prerequisite Review',
    };
    if (pr?.verdict === 'PHASE3_DEPLOYMENT_PREREQUISITE_REVIEW_PASS') {
      return {
        ...base,
        status: STATUS.PASS,
        pass: true,
        reviews: reviewScore || '10/10',
        sub_checks: subScore,
        r06: r06 ? `${r06.summary.pass}/${r06.summary.total}` : null,
      };
    }
    if (exitReview?.verdict !== 'PHASE2_EXIT_REVIEW_PASS') {
      if (pr && reviewScore) {
        return {
          ...base,
          status: STATUS.NOT_STARTED,
          pass: false,
          reviews: reviewScore,
          sub_checks: subScore,
          r06: r06 ? `${r06.summary.pass}/${r06.summary.total}` : null,
          note: 'Preview only — requires Phase ②-F Exit Review PASS to gate Web3 Freeze',
        };
      }
      return {
        ...base,
        status: STATUS.NOT_STARTED,
        pass: false,
        note: 'Requires Phase ②-F Exit Review PASS',
      };
    }
    return {
      ...base,
      status: STATUS.IN_PROGRESS,
      pass: false,
      reviews: reviewScore || '0/10',
      sub_checks: subScore,
      r06: r06 ? `${r06.summary.pass}/${r06.summary.total}` : null,
    };
  }

  function assessPhase3() {
    const pkg = readJson('evidence/GO_production_readiness/mainnet-deployment-package/MAINNET-DEPLOYMENT-PACKAGE-LATEST.json');
    if (pkg?.verdict === 'MAINNET_DEPLOYMENT_PACKAGE_GENERATED') {
      return { id: 3, name: 'Production Deployment', status: STATUS.IN_PROGRESS };
    }
    return { id: 3, name: 'Production Deployment', status: STATUS.NOT_STARTED };
  }

  function extractBlockers() {
    const pg = readProtocolGrade();
    const p0List = (pg?.blockers || []).filter((b) => b.priority === 'P0');
    const p1List = (pg?.blockers || []).filter((b) => b.priority === 'P1');
    const p2List = (pg?.blockers || []).filter((b) => b.priority === 'P2');
    const cert = readCert();
    const certSigned = cert?.signed_count ?? 0;
    if (certSigned < 12 && !p1List.some((b) => /cert/i.test(b.title || ''))) {
      p1List.push({ priority: 'P1', id: 'DASH-P1-CERT', title: 'TTG Cert #8–12', status: 'OPEN', synthetic: true });
    }
    return {
      P0: { count: p0List.length, items: p0List.map((b) => ({ id: b.id, title: b.title })) },
      P1: { count: p1List.length, items: p1List.map((b) => ({ id: b.id, title: b.title })) },
      P2: { count: p2List.length, items: p2List.map((b) => ({ id: b.id, title: b.title })) },
    };
  }

  function buildRealMetrics(blockers) {
    const lifecycle = readLifecycle();
    const exitReview = readExitReview();
    const cert = readCert();
    const openEvidence =
      (lifecycle?.summary?.domains_total ?? 10) - (lifecycle?.summary?.domains_sepolia_e2e_pass ?? 0)
      + Math.max(0, (exitReview?.summary?.total ?? 12) - (exitReview?.summary?.pass ?? 0));
    const openCert = Math.max(0, 12 - (cert?.signed_count ?? 0));
    return {
      open_p0: blockers.P0.count,
      open_p1: blockers.P1.count,
      open_p2: blockers.P2.count,
      open_cert: openCert,
      open_evidence: openEvidence,
    };
  }

  function buildTodayFocus(phase2, blockers, config = {}) {
    const owner = config.default_owner || 'Junxi';
    const cert = readCert();
    const certSigned = cert?.signed_count ?? 0;
    const nextCert = certSigned < 8 ? 8 : Math.min(certSigned + 1, 12);
    const certCfg = (config.cert_tasks || {})[String(nextCert)] || {};
    const drag = phase2.drag_track;
    const timelockEta = readTimelockEta(config);

    if (blockers.P0.count > 0) {
      return {
        today: new Date().toISOString().slice(0, 10),
        current_focus: 'P0 Blockers',
        mission: 'Unblock production',
        task: blockers.P0.items[0]?.title || 'Resolve P0',
        blocked_by: null,
        waiting_reason: 'P0 blocker — resolve before other tracks',
        eta: null,
        next: blockers.P0.items[1]?.title || 'Clear all P0',
        owner,
      };
    }

    let task = drag.id === '2D' ? (certCfg.label || `Cert #${nextCert}`) : `Complete ${drag.short} evidence`;
    let mission = drag.id === '2D' ? (certCfg.mission || 'Governance Lifecycle') : `${drag.short} validation`;
    let blockedBy = drag.id === '2D' ? (certCfg.blocked_by || null) : null;
    let eta = drag.id === '2D' && certCfg.blocked_by ? timelockEta : null;
    let next = drag.id === '2D' ? `Cert #${Math.min(nextCert + 1, 12)}` : 'Next sub-track item';

    if (drag.id === '2C') {
      task = 'G6 Cover/CDN — provider & acquisition OCS bindings';
      mission = 'Data Governance / CMS / COS';
      blockedBy = null;
      eta = null;
      next = drag.pass ? '②-D Cert #8 (after Timelock)' : 'Re-run G6 until PASS';
    }

    const waitingReason = buildWaitingReason(drag, config, certSigned);

    return {
      today: new Date().toISOString().slice(0, 10),
      current_focus: `②-${drag.id.slice(1)} ${drag.short}`,
      mission,
      task,
      blocked_by: blockedBy,
      waiting_reason: waitingReason,
      eta,
      next,
      owner,
    };
  }

  function writeArtifacts(evidenceRoot, stamp, json, md) {
    const runDir = path.join(evidenceRoot, `run-${stamp}`);
    fs.mkdirSync(runDir, { recursive: true });
    fs.mkdirSync(evidenceRoot, { recursive: true });
    fs.writeFileSync(path.join(runDir, json.name), JSON.stringify(json.data, null, 2));
    fs.writeFileSync(path.join(evidenceRoot, json.name), JSON.stringify(json.data, null, 2));
    fs.writeFileSync(path.join(runDir, md.name), md.content);
    fs.writeFileSync(path.join(evidenceRoot, md.name), md.content);
  }

  return {
    ROOT,
    REFRESH,
    STATUS,
    readJson,
    exists,
    runNode,
    assessPhase1,
    assessPhase2,
    assessPrerequisiteReview,
    assessPhase3,
    assess2A,
    assess2B,
    assess2C,
    assess2D,
    assess2E,
    assess2F,
    readProtocolGrade,
    readCert,
    readLifecycle,
    readExitReview,
    extractBlockers,
    buildRealMetrics,
    buildTodayFocus,
    writeArtifacts,
  };
}

module.exports = { createDashboardContext, STATUS };
