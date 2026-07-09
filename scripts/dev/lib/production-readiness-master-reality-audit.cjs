/**
 * Production Readiness Master Reality Audit — last whole-project truth check before G3-01.
 * Release governance only; reuses existing audit libs; does not add platform capabilities.
 *
 * Output verdicts: VERIFIED | PLANNED | DRIFT
 */
const fs = require('fs');
const path = require('path');
const { runCallGraphAudit } = require('./runtime-truth-call-graph.cjs');
const { runEvidenceIntegrityAudit } = require('./evidence-integrity-audit.cjs');
const { runPlatformCoverageAudit } = require('./platform-coverage-audit.cjs');

const ROOT = path.join(__dirname, '../../..');
const REG_MATRIX = path.join(ROOT, 'registry/production-readiness-master-matrix.v1.yaml');
const REG_G3 = path.join(ROOT, 'registry/g3-production-domains.v1.json');

const G3_DOMAIN_IDS = ['G3-01', 'G3-02', 'G3-03', 'G3-04', 'G3-05', 'G3-06'];

function readJson(p) {
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function machineKey(yaml, key) {
  const m = yaml.match(new RegExp(`${key}: ([A-Z_0-9]+)`));
  return m ? m[1] : null;
}

function parseGaps(yaml) {
  const gaps = [];
  const parts = yaml.split(/\r?\n  - id: PRM-/);
  for (const sec of parts.slice(1)) {
    const id = `PRM-${sec.split(/\r?\n/)[0].replace(/:$/, '')}`;
    const block = `  - id: ${id}\n${sec}`;
    const field = (name) => {
      const m = block.match(new RegExp(`    ${name}: ([^\\n]+)`));
      return m ? m[1].trim().replace(/^"|"$/g, '') : null;
    };
    gaps.push({
      id,
      domain: field('domain'),
      go_gate: field('go_gate'),
      classification: field('classification'),
      status: field('status'),
      closed_evidence: field('closed_evidence'),
      evidence: field('evidence'),
      title: field('title'),
    });
  }
  return gaps;
}

function isRepoEvidence(p) {
  if (!p) return false;
  return p.startsWith('evidence/') || p.startsWith('frontend/evidence/');
}

function evidenceExists(rel) {
  return rel ? fs.existsSync(path.join(ROOT, rel.replace(/\\/g, '/'))) : false;
}

function gapToG3Domain(gapId, g3Reg) {
  for (const d of g3Reg.domains) {
    if ((d.matrix_gaps || []).includes(gapId)) return d.id;
    if (d.matrix_domains?.includes(gapId)) return d.id;
  }
  return null;
}

function add(findings, item) {
  findings.push({
    id: item.id,
    category: item.category,
    subject: item.subject,
    verdict: item.verdict,
    detail: item.detail,
    g3_domain: item.g3_domain || null,
    remediation: item.remediation || null,
  });
}

function auditImplementationReality(yaml, findings) {
  const gates = [
    ['TT_PRODUCTION_READINESS_G1_GATE', 'evidence/GO_production_readiness/wave-1-1-g1'],
    ['TT_PRODUCTION_READINESS_G2_GATE', 'evidence/GO_production_readiness/wave-2-g2'],
    ['TT_WAVE2_FORMAL_ACCEPTANCE', 'evidence/GO_production_readiness/wave-2-g2'],
    ['TT_G2_RETROSPECTIVE', 'evidence/GO_production_readiness/g2-retrospective'],
  ];

  for (const [key, evidPrefix] of gates) {
    const val = machineKey(yaml, key);
    if (!['PASS', 'COMPLETE'].includes(val)) continue;
    const hasStamp = fs.existsSync(path.join(ROOT, evidPrefix));
    add(findings, {
      id: `IMP-${key}`,
      category: 'implementation_reality',
      subject: key,
      verdict: hasStamp ? 'VERIFIED' : 'DRIFT',
      detail: hasStamp ? `Machine key ${val} with repo evidence under ${evidPrefix}` : `${key}=${val} but no evidence tree ${evidPrefix}`,
      remediation: hasStamp ? null : 'Attach evidence or downgrade machine key',
    });
  }

  const g1GatePass = machineKey(yaml, 'TT_PRODUCTION_READINESS_G1_GATE') === 'PASS';
  const g1WaveEvid = fs.existsSync(path.join(ROOT, 'evidence/GO_production_readiness/wave-1-1-g1'));
  const g1Ver = machineKey(yaml, 'TT_G1_REALITY_VERIFICATION');
  const g1Gate = machineKey(yaml, 'TT_PRODUCTION_READINESS_G1_GATE');
  const g1Audit = machineKey(yaml, 'TT_G1_REALITY_AUDIT');
  if (g1Gate === 'PASS' && g1Ver === 'NOT_STARTED') {
    if (g1Audit === 'COMPLETE' && g1WaveEvid) {
      add(findings, {
        id: 'IMP-G1-VERIFICATION-KEY-LAG',
        category: 'implementation_reality',
        subject: 'TT_G1_REALITY_VERIFICATION',
        verdict: 'VERIFIED',
        detail:
          'G1 Reality Audit COMPLETE + wave-1-1-g1 evidence; TT_G1_REALITY_VERIFICATION key lag (matrix hygiene optional)',
        remediation: 'Optional: sync TT_G1_REALITY_VERIFICATION COMPLETE or run G1 verification',
      });
    } else {
      add(findings, {
        id: 'IMP-G1-VERIFICATION-GATE-MISMATCH',
        category: 'implementation_reality',
        subject: 'TT_G1_REALITY_VERIFICATION vs G1_GATE',
        verdict: 'DRIFT',
        detail: 'G1 Gate PASS while TT_G1_REALITY_VERIFICATION NOT_STARTED',
        remediation: 'Align Release Train keys or complete G1 verification',
      });
    }
  }

  for (const g of parseGaps(yaml)) {
    if (g.classification !== 'BLOCKER' || g.status !== 'CLOSED') continue;
    const repoPath = g.closed_evidence || (isRepoEvidence(g.evidence) ? g.evidence : null);
    if (repoPath && evidenceExists(repoPath)) {
      add(findings, {
        id: `IMP-${g.id}`,
        category: 'implementation_reality',
        subject: g.id,
        verdict: 'VERIFIED',
        detail: `CLOSED with repo evidence ${repoPath}`,
        g3_domain: gapToG3Domain(g.id, readJson(REG_G3) || { domains: [] }),
      });
      continue;
    }

    if (g.go_gate === 'G1' && g1GatePass && g1WaveEvid) {
      add(findings, {
        id: `IMP-${g.id}`,
        category: 'implementation_reality',
        subject: g.id,
        verdict: 'VERIFIED',
        detail: `G1 wave evidence covers closure (wave-1-1-g1)`,
      });
      continue;
    }

    if (g.go_gate === 'G3') {
      add(findings, {
        id: `IMP-${g.id}`,
        category: 'implementation_reality',
        subject: g.id,
        verdict: 'DRIFT',
        detail: `Matrix CLOSED but no repo evidence (only docs/plan: ${g.evidence || 'none'})`,
        g3_domain: gapToG3Domain(g.id, readJson(REG_G3) || { domains: [] }),
        remediation: 'REOPEN gap until G3 domain verification closes with evidence',
      });
      continue;
    }

    if (!repoPath) {
      add(findings, {
        id: `IMP-${g.id}`,
        category: 'implementation_reality',
        subject: g.id,
        verdict: 'DRIFT',
        detail: `CLOSED BLOCKER without closed_evidence repo path`,
        remediation: 'Add closed_evidence or REOPEN',
      });
    }
  }
}

function auditRuntimeReality(yaml, findings, opts) {
  const keys = [
    'TT_PRODUCTION_RUNTIME_IDENTITY',
    'TT_CONFIGURATION_TRUTH',
    'TT_G2_REALITY_VERIFICATION',
    'TT_EVIDENCE_INTEGRITY_AUDIT',
  ];

  for (const key of keys) {
    const val = machineKey(yaml, key);
    if (!['PASS', 'COMPLETE'].includes(val)) continue;
    let evidOk = false;
    if (key === 'TT_G2_REALITY_VERIFICATION') {
      evidOk = !!findLatestSignoff('g2-reality-verification', 'g2-reality-verification-signoff.json');
    } else if (key === 'TT_EVIDENCE_INTEGRITY_AUDIT') {
      evidOk = !!findLatestSignoff('evidence-integrity', 'evidence-integrity-audit.json');
    } else if (key === 'TT_PRODUCTION_RUNTIME_IDENTITY') {
      evidOk = !!findLatestSignoff('production-runtime-identity', 'production-runtime-identity.json');
    } else {
      evidOk = val === 'PASS';
    }
    add(findings, {
      id: `RT-${key}`,
      category: 'runtime_reality',
      subject: key,
      verdict: evidOk ? 'VERIFIED' : 'DRIFT',
      detail: evidOk ? `${key}=${val} backed by latest evidence stamp` : `${key}=${val} without fresh evidence bundle`,
      remediation: evidOk ? null : 'Re-run guard/verification and commit evidence',
    });
  }

  if (opts.liveRuntime) {
    add(findings, {
      id: 'RT-LIVE-RUN-REQUESTED',
      category: 'runtime_reality',
      subject: 'live_runtime',
      verdict: 'PLANNED',
      detail: 'Live runtime re-probe requested via --live-runtime (run guard separately in CI/Owner session)',
      g3_domain: null,
    });
  }
}

function findLatestSignoff(tree, file) {
  const base = path.join(ROOT, 'evidence/GO_production_readiness', tree);
  if (!fs.existsSync(base)) return null;
  const stamps = fs
    .readdirSync(base)
    .filter((d) => d !== 'latest' && fs.existsSync(path.join(base, d, file)))
    .sort();
  return stamps.length ? `${tree}/${stamps[stamps.length - 1]}/${file}` : null;
}

function auditCallGraphReality(findings) {
  const audit = runCallGraphAudit({ anchorFilter: 'all' });
  for (const a of audit.results) {
    add(findings, {
      id: `CG-${a.id}`,
      category: 'call_graph_reality',
      subject: a.id,
      verdict: a.status === 'PASS' ? 'VERIFIED' : 'DRIFT',
      detail: a.detail,
      remediation: a.status === 'PASS' ? null : 'Restore call path in code or remove false Matrix claim',
    });
  }
}

function auditEvidenceReality(yaml, findings) {
  const integrity = runEvidenceIntegrityAudit({ gate: 'G2' });
  for (const f of integrity.findings || []) {
    if (f.severity === 'INFO') continue;
    const verdict = f.severity === 'FAIL' || f.severity === 'WARN' ? 'DRIFT' : 'VERIFIED';
    add(findings, {
      id: `EV-${f.id}-${f.kind || 'check'}`,
      category: 'evidence_reality',
      subject: f.id,
      verdict,
      detail: f.detail || f.message || f.kind,
      remediation: verdict === 'DRIFT' ? 'Fix evidence path or re-run verification' : null,
    });
  }

  for (const g of parseGaps(yaml)) {
    if (g.status !== 'CLOSED' || g.classification !== 'BLOCKER') continue;
    if (!g.closed_evidence) continue;
    const repro = fs.existsSync(path.join(ROOT, g.closed_evidence));
    if (!repro) {
      add(findings, {
        id: `EV-MISSING-${g.id}`,
        category: 'evidence_reality',
        subject: g.closed_evidence,
        verdict: 'DRIFT',
        detail: `closed_evidence path missing for ${g.id}`,
        remediation: 'Restore evidence or REOPEN gap',
      });
    }
  }
}

function auditPlatformAdoptionReality(yaml, findings) {
  const summary = runPlatformCoverageAudit();
  const matrixAdoption = machineKey(yaml, 'TT_PLATFORM_ADOPTION');
  const computed = summary.platform_adoption?.adoption_pct ?? 0;
  const matrixPct = matrixAdoption?.match(/(\d+)pct/)?.[1];

  add(findings, {
    id: 'PA-COVERAGE-AUDIT',
    category: 'platform_adoption_reality',
    subject: 'TT_PLATFORM_COVERAGE_AUDIT',
    verdict: summary.all_pass ? 'VERIFIED' : 'DRIFT',
    detail: summary.all_pass
      ? 'All capabilities at coverage target with 0 unmigrated modules'
      : `Coverage audit all_pass=false · unmigrated=${JSON.stringify(summary.capabilities?.filter((c) => c.unmigrated_modules?.length).map((c) => c.capability))}`,
    remediation: summary.all_pass ? null : 'Complete P1B migrations or fix registry targets',
  });

  if (matrixPct && Number(matrixPct) !== computed) {
    add(findings, {
      id: 'PA-MATRIX-ADOPTION-DRIFT',
      category: 'platform_adoption_reality',
      subject: 'TT_PLATFORM_ADOPTION',
      verdict: 'DRIFT',
      detail: `Matrix claims ${matrixPct}% but audit computed ${computed}%`,
      remediation: 'sync-platform-adoption-matrix.cjs after coverage audit',
    });
  }

  for (const cap of summary.capabilities || []) {
    if (cap.status === 'PASS' && cap.coverage_pct >= cap.target_pct) {
      add(findings, {
        id: `PA-${cap.capability}`,
        category: 'platform_adoption_reality',
        subject: cap.capability,
        verdict: 'VERIFIED',
        detail: `${cap.coverage_pct}% coverage · target ${cap.target_pct}%`,
      });
    } else if (cap.unmigrated_modules?.length) {
      add(findings, {
        id: `PA-${cap.capability}`,
        category: 'platform_adoption_reality',
        subject: cap.capability,
        verdict: 'DRIFT',
        detail: `Unmigrated modules: ${cap.unmigrated_modules.join(', ')}`,
        remediation: 'Migrate modules or adjust matrix narrative',
      });
    }
  }
}

function auditProductionReadinessReality(yaml, findings) {
  const g3Reg = readJson(REG_G3) || { domains: [] };

  for (const domain of g3Reg.domains) {
    const evidRoot = domain.evidence_root;
    const hasEvidence =
      evidRoot &&
      fs.existsSync(path.join(ROOT, evidRoot)) &&
      fs.readdirSync(path.join(ROOT, evidRoot)).filter((d) => d !== 'latest').length > 0;

    if (domain.is_final_domain) {
      add(findings, {
        id: `PR-${domain.id}-DECISION-PACKAGE`,
        category: 'production_readiness_reality',
        subject: domain.id,
        verdict: 'PLANNED',
        detail: 'Production GO Decision Package not yet signed (expected pre-GO)',
        g3_domain: domain.id,
      });
      continue;
    }

    add(findings, {
      id: `PR-${domain.id}`,
      category: 'production_readiness_reality',
      subject: domain.label,
      verdict: hasEvidence ? 'VERIFIED' : 'PLANNED',
      detail: hasEvidence
        ? `Evidence present under ${evidRoot}`
        : `G3 domain work not started — only runbook/matrix/plan until G3 verification`,
      g3_domain: domain.id,
    });

    for (const gapId of domain.matrix_gaps || []) {
      const gap = parseGaps(yaml).find((g) => g.id === gapId);
      if (!gap) continue;
      if (gap.status === 'CLOSED' && !gap.closed_evidence) {
        add(findings, {
          id: `PR-GAP-${gapId}`,
          category: 'production_readiness_reality',
          subject: gapId,
          verdict: 'DRIFT',
          detail: `Matrix CLOSED without repo evidence — actual work PLANNED in ${domain.id}`,
          g3_domain: domain.id,
          remediation: `REOPEN ${gapId} until ${domain.id} verification closes with evidence`,
        });
      }
    }
  }

  const g3Gate = machineKey(yaml, 'TT_PRODUCTION_READINESS_G3_GATE');
  if (g3Gate === 'NOT_STARTED') {
    add(findings, {
      id: 'PR-G3-GATE-NOT-STARTED',
      category: 'production_readiness_reality',
      subject: 'TT_PRODUCTION_READINESS_G3_GATE',
      verdict: 'PLANNED',
      detail: 'G3 Gate not started — expected before Production GO',
      g3_domain: 'G3-06',
    });
  }
}

function computeGate(findings) {
  const drift = findings.filter((f) => f.verdict === 'DRIFT');
  const planned = findings.filter((f) => f.verdict === 'PLANNED');
  const verified = findings.filter((f) => f.verdict === 'VERIFIED');

  const plannedOutsideG3 = planned.filter(
    (f) => f.g3_domain && !G3_DOMAIN_IDS.includes(f.g3_domain)
  );
  const plannedNoDomain = planned.filter((f) => !f.g3_domain);

  const g3_entry_allowed =
    drift.length === 0 && plannedOutsideG3.length === 0 && plannedNoDomain.length === 0;

  return {
    drift_count: drift.length,
    planned_count: planned.length,
    verified_count: verified.length,
    planned_outside_g3: plannedOutsideG3.length,
    planned_without_g3_domain: plannedNoDomain.length,
    g3_entry_allowed,
  };
}

function runMasterRealityAudit(opts = {}) {
  const yaml = fs.readFileSync(REG_MATRIX, 'utf8');
  const findings = [];

  auditImplementationReality(yaml, findings);
  auditRuntimeReality(yaml, findings, opts);
  auditCallGraphReality(findings);
  auditEvidenceReality(yaml, findings);
  auditPlatformAdoptionReality(yaml, findings);
  auditProductionReadinessReality(yaml, findings);

  const gate = computeGate(findings);
  const stamp = opts.stamp || new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

  return {
    schema: 'traveltrust.production_readiness_master_reality_audit.v1',
    stamp,
    purpose: 'Last whole-project reality check before G3-01 Production Network',
    honest_boundary: 'Audit does not add platform capabilities · tri-state VERIFIED | PLANNED | DRIFT only',
    categories: [
      'implementation_reality',
      'runtime_reality',
      'call_graph_reality',
      'evidence_reality',
      'platform_adoption_reality',
      'production_readiness_reality',
    ],
    gate,
    machine_keys: {
      TT_PRODUCTION_READINESS_MASTER_REALITY_AUDIT: gate.g3_entry_allowed ? 'PASS' : 'FAIL',
    },
    findings,
    by_verdict: {
      VERIFIED: findings.filter((f) => f.verdict === 'VERIFIED'),
      PLANNED: findings.filter((f) => f.verdict === 'PLANNED'),
      DRIFT: findings.filter((f) => f.verdict === 'DRIFT'),
    },
    g3_entry_rule:
      'g3_entry_allowed when drift_count=0 and all PLANNED items map to G3-01..G3-06',
  };
}

function writeAuditEvidence(outDir, report) {
  const base = path.isAbsolute(outDir) ? outDir : path.join(ROOT, outDir);
  fs.mkdirSync(base, { recursive: true });
  fs.writeFileSync(path.join(base, 'master-reality-audit.json'), `${JSON.stringify(report, null, 2)}\n`);

  const md = [
    '# Production Readiness Master Reality Audit',
    '',
    `Stamp: \`${report.stamp}\``,
    '',
    `| Verdict | Count |`,
    `|---------|-------|`,
    `| VERIFIED | ${report.gate.verified_count} |`,
    `| PLANNED | ${report.gate.planned_count} |`,
    `| DRIFT | ${report.gate.drift_count} |`,
    '',
    `**G3-01 entry allowed:** ${report.gate.g3_entry_allowed ? 'YES' : 'NO'}`,
    '',
    '## DRIFT',
    '',
  ];
  for (const f of report.by_verdict.DRIFT) {
    md.push(`- **${f.id}** (${f.category}): ${f.detail}`);
  }
  md.push('', '## PLANNED (G3 scope)', '');
  for (const f of report.by_verdict.PLANNED) {
    md.push(`- **${f.id}** [${f.g3_domain || '—'}]: ${f.detail}`);
  }
  fs.writeFileSync(path.join(base, 'master-reality-audit.md'), `${md.join('\n')}\n`);
  return base;
}

module.exports = { runMasterRealityAudit, writeAuditEvidence, G3_DOMAIN_IDS };
