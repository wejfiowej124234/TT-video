/**
 * Platform Coverage Audit — scan repo modules per Platform Capability Registry.
 */
const fs = require('fs');
const path = require('path');
const { loadRegistry, expandModulePaths, ROOT } = require('./platform-capability-registry.cjs');

const REG_MATRIX = path.join(ROOT, 'registry/production-readiness-master-matrix.v1.yaml');

function readSafe(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) return { exists: false, text: '' };
  return { exists: true, text: fs.readFileSync(p, 'utf8') };
}

function matchesAny(text, patterns) {
  if (!patterns || patterns.length === 0) return false;
  return patterns.some((p) => text.includes(p));
}

function isExcluded(rel, text, excludePatterns) {
  if (excludePatterns?.includes(rel.replace(/\\/g, '/'))) return true;
  return (excludePatterns || []).some((p) => text.includes(p) || rel.includes(p));
}

function auditModuleFiles(files, rules, relPrefix = '') {
  let migrated = 0;
  let legacy = 0;
  let missing = 0;
  const unmigrated = [];

  for (const rel of files) {
    const { exists, text } = readSafe(rel);
    if (!exists) {
      missing += 1;
      unmigrated.push({ path: rel, reason: 'missing' });
      continue;
    }

    const allowLegacy =
      rules.allow_legacy_producers &&
      rules.allow_legacy_producers.some((p) => rel.replace(/\\/g, '/').includes(p.replace(/\\/g, '/')));

    if (allowLegacy) {
      migrated += 1;
      continue;
    }

    if (isExcluded(rel, text, rules.exclude_in_file)) {
      migrated += 1;
      continue;
    }

    const hasMigrated = matchesAny(text, rules.migrated);
    const hasLegacy = !allowLegacy && matchesAny(text, rules.legacy);

    if (hasMigrated && !hasLegacy) {
      migrated += 1;
    } else if (hasLegacy && !hasMigrated) {
      legacy += 1;
      unmigrated.push({ path: rel, reason: 'legacy_pattern' });
    } else if (hasMigrated && hasLegacy) {
      legacy += 1;
      unmigrated.push({ path: rel, reason: 'mixed_migrated_and_legacy' });
    } else if (rules.legacy?.length === 0) {
      migrated += 1;
    } else {
      legacy += 1;
      unmigrated.push({ path: rel, reason: 'no_migrated_marker' });
    }
  }

  const total = files.length;
  const coverage_pct = total === 0 ? 100 : Math.round((migrated / total) * 100);
  return { total, migrated, legacy, missing, coverage_pct, unmigrated_files: unmigrated };
}

function auditCapability(cap, registry) {
  const rules = registry.audit_rules?.[cap.id] || { migrated: [], legacy: [] };
  const moduleResults = [];

  for (const mod of cap.modules || []) {
    const files = expandModulePaths(mod.paths || []);
    const result = auditModuleFiles(files, rules);
    moduleResults.push({
      id: mod.id,
      label: mod.label || mod.id,
      coverage_pct: result.coverage_pct,
      files_total: result.total,
      files_migrated: result.migrated,
      files_legacy: result.legacy,
      files_missing: result.missing,
      unmigrated: result.unmigrated_files,
      status: result.coverage_pct === 100 ? 'MIGRATED' : 'PARTIAL',
    });
  }

  const totals = moduleResults.reduce(
    (a, m) => {
      a.files_total += m.files_total;
      a.files_migrated += m.files_migrated;
      a.unmigrated_modules.push(...(m.coverage_pct < 100 ? [m.label] : []));
      return a;
    },
    { files_total: 0, files_migrated: 0, unmigrated_modules: [] }
  );

  const coverage_pct =
    moduleResults.length === 0
      ? 100
      : Math.round(
          moduleResults.reduce((s, m) => s + m.coverage_pct, 0) / moduleResults.length
        );

  const target = cap.coverage_target_pct ?? 100;
  const pass = coverage_pct >= target;

  return {
    id: cap.id,
    label: cap.label,
    owner: cap.owner || registry.owner_default,
    status: cap.status,
    runtime_used: cap.runtime_used,
    verification_used: cap.verification_used,
    ssot: cap.ssot || null,
    coverage_pct,
    coverage_target_pct: target,
    pass,
    modules: moduleResults,
    unmigrated_modules: [...new Set(totals.unmigrated_modules)],
    runtime_marker: cap.runtime_used ? (pass ? '✅' : '⚠️') : '—',
    verification_marker: cap.verification_used ? (pass ? '✅' : '⚠️') : '—',
  };
}

function runPlatformCoverageAudit(opts = {}) {
  const registry = loadRegistry();
  const capabilities = (registry.capabilities || []).map((cap) => auditCapability(cap, registry));
  const capById = Object.fromEntries(capabilities.map((c) => [c.id, c]));
  const platformAdoption = computePlatformAdoption(registry, capById);

  const summary = {
    review_id: 'PLATFORM-COVERAGE-AUDIT',
    stamp: opts.stamp || new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, 'Z'),
    registry: 'registry/platform-capability-registry.v1.json',
    priority_ladder: 'registry/production-readiness-priority-ladder.v1.json',
    machine_key: 'TT_PLATFORM_COVERAGE_AUDIT',
    capabilities: capabilities.map((c) => ({
      capability: c.label,
      id: c.id,
      coverage_pct: c.coverage_pct,
      target_pct: c.coverage_target_pct,
      pass: c.pass,
      status: c.status,
      runtime: c.runtime_marker,
      verification: c.verification_marker,
      unmigrated_modules: c.unmigrated_modules,
    })),
    platform_adoption: platformAdoption,
    all_pass: capabilities.every((c) => c.pass),
    details: capabilities,
  };

  return summary;
}

function matrixVerificationScore() {
  if (!fs.existsSync(REG_MATRIX)) return 0;
  const yaml = fs.readFileSync(REG_MATRIX, 'utf8');
  const keys = ['TT_G1_REALITY_VERIFICATION', 'TT_G2_REALITY_VERIFICATION', 'TT_G3_REALITY_VERIFICATION'];
  let score = 0;
  for (const k of keys) {
    const m = yaml.match(new RegExp(`${k}: ([A-Z_]+)`));
    const v = m ? m[1] : 'NOT_STARTED';
    if (v === 'COMPLETE') score += 100 / keys.length;
    else if (v === 'IN_PROGRESS') score += 50 / keys.length;
  }
  return Math.round(score);
}

function resolveAdoptionDimension(dim, capById) {
  const src = dim.source || {};
  if (src.type === 'capability') {
    return capById[src.id]?.coverage_pct ?? 0;
  }
  if (src.type === 'capability_avg') {
    const ids = src.ids || [];
    if (!ids.length) return 0;
    const sum = ids.reduce((s, id) => s + (capById[id]?.coverage_pct ?? 0), 0);
    return Math.round(sum / ids.length);
  }
  if (src.type === 'matrix_verification') {
    return matrixVerificationScore();
  }
  if (src.type === 'file_present') {
    return fs.existsSync(path.join(ROOT, src.path)) ? 100 : 0;
  }
  return 0;
}

function computePlatformAdoption(registry, capById) {
  const spec = registry.platform_adoption || { dimensions: [] };
  const dimensions = [];
  let weighted = 0;
  let weightTotal = 0;

  for (const dim of spec.dimensions || []) {
    const pct = resolveAdoptionDimension(dim, capById);
    const w = dim.weight || 0;
    weighted += pct * w;
    weightTotal += w;
    dimensions.push({
      id: dim.id,
      label: dim.label,
      coverage_pct: pct,
      weight: w,
    });
  }

  const adoption_pct = weightTotal ? Math.round(weighted / weightTotal) : 0;
  return {
    machine_key: spec.machine_key || 'TT_PLATFORM_ADOPTION',
    label: spec.human_label || 'Platform Adoption',
    priority_tier: spec.priority_tier || 'P2',
    adoption_pct,
    dimensions,
    summary_line: `Platform Adoption ${adoption_pct}%`,
  };
}

function writeCoverageEvidence(outDir, summary) {
  const base = path.isAbsolute(outDir) ? outDir : path.join(ROOT, outDir);
  fs.mkdirSync(base, { recursive: true });
  fs.writeFileSync(path.join(base, 'platform-coverage-audit.json'), `${JSON.stringify(summary, null, 2)}\n`);

  const md = formatMarkdownTable(summary);
  fs.writeFileSync(path.join(base, 'platform-coverage-audit.md'), md);
  return base;
}

function formatMarkdownTable(summary) {
  const lines = [
    '# Platform Coverage Audit',
    '',
    `Stamp: \`${summary.stamp}\``,
    '',
    '| Platform Capability | Coverage | Target | Runtime | Verification | Status | Unmigrated Modules |',
    '|-------------------|----------|--------|---------|--------------|--------|-------------------|',
  ];

  for (const c of summary.capabilities) {
    const unm = c.unmigrated_modules?.length ? c.unmigrated_modules.join(', ') : '—';
    lines.push(
      `| ${c.capability} | ${c.coverage_pct}% | ${c.target_pct}% | ${c.runtime} | ${c.verification} | ${c.status} | ${unm} |`
    );
  }

  lines.push('', `All pass: **${summary.all_pass}**`, '');
  if (summary.platform_adoption) {
    lines.push(`**${summary.platform_adoption.machine_key}:** ${summary.platform_adoption.adoption_pct}%`, '');
    lines.push('| Adoption Dimension | Coverage | Weight |', '|------------------|----------|--------|');
    for (const d of summary.platform_adoption.dimensions || []) {
      lines.push(`| ${d.label} | ${d.coverage_pct}% | ${d.weight}% |`);
    }
    lines.push('');
  }
  return `${lines.join('\n')}\n`;
}

function printConsoleTable(summary) {
  console.log('Platform Coverage Audit');
  console.log('═'.repeat(88));
  console.log(
    `${'Capability'.padEnd(22)} ${'Coverage'.padStart(8)} ${'Runtime'.padStart(8)} ${'Verify'.padStart(8)} ${'Status'.padStart(10)} Unmigrated`
  );
  console.log('─'.repeat(88));
  for (const c of summary.capabilities) {
    const unm = c.unmigrated_modules?.length ? c.unmigrated_modules.join(', ') : '—';
    console.log(
      `${c.capability.padEnd(22)} ${String(c.coverage_pct + '%').padStart(8)} ${c.runtime.padStart(8)} ${c.verification.padStart(8)} ${c.status.padStart(10)} ${unm}`
    );
  }
  console.log('─'.repeat(88));
  console.log(`TT_PLATFORM_COVERAGE_AUDIT: ${summary.all_pass ? 'PASS' : 'ATTENTION'}`);
  if (summary.platform_adoption) {
    console.log(
      `${summary.platform_adoption.machine_key}: ${summary.platform_adoption.adoption_pct}% (${summary.platform_adoption.summary_line})`
    );
  }
}

module.exports = {
  runPlatformCoverageAudit,
  writeCoverageEvidence,
  formatMarkdownTable,
  printConsoleTable,
  auditCapability,
  computePlatformAdoption,
  matrixVerificationScore,
};
