/**
 * Configuration Truth — sixth Release Train truth source.
 * Compares Registry · Fly Secrets · Fly Config · .env.production · GitHub Actions · Runtime /meta.
 */
const fs = require('fs');
const path = require('path');
const { loadSsot, normalizeProfile } = require('./runtime-identity.cjs');

const ROOT = path.join(__dirname, '../../..');
const CFG_SSOT = path.join(ROOT, 'registry/configuration-truth-ssot.v1.json');

function loadConfigSsot() {
  return JSON.parse(fs.readFileSync(CFG_SSOT, 'utf8'));
}

function readText(p) {
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

function readJson(p) {
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function parseEnvFile(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    if (!t.includes('=')) continue;
    const k = t.slice(0, t.indexOf('=')).trim();
    let v = t.slice(t.indexOf('=') + 1).trim();
    v = v.replace(/^["']|["']$/g, '');
    if (v && !v.includes('...')) out[k] = v;
  }
  return out;
}

function flyVal(text, key) {
  const m = text.match(new RegExp(`^${key}=(.*)$`, 'm'));
  if (m) return m[1].trim();
  if (new RegExp(`fly_secret_present_${key}=yes`).test(text)) return '<secret_present>';
  return null;
}

function parseFlyTomlEnv(text) {
  const out = {};
  const envBlock = text.match(/\[env\][\s\S]*?(?=\n\[|$)/);
  if (!envBlock) return out;
  for (const line of envBlock[0].split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*['"]?([^'"]+)['"]?\s*$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

function scanGithubActions(keys) {
  const dir = path.join(ROOT, '.github/workflows');
  const hits = {};
  if (!fs.existsSync(dir)) return hits;
  for (const name of fs.readdirSync(dir).filter((n) => n.endsWith('.yml') || n.endsWith('.yaml'))) {
    const text = fs.readFileSync(path.join(dir, name), 'utf8');
    for (const key of keys) {
      if (text.includes(key)) {
        hits[key] = hits[key] || [];
        hits[key].push(`.github/workflows/${name}`);
      }
    }
  }
  return hits;
}

function registryExpected(profileName) {
  const idSsot = loadSsot();
  const p = idSsot.profiles[profileName];
  if (!p) return {};
  return {
    deployment_profile: p.deployment_profile,
    seed: p.seed ?? null,
    community_showcase: p.community_showcase ?? null,
    market_showcase: p.market_showcase ?? null,
    demo: p.demo ?? null,
    public_content_profile: p.public_content_profile ?? null,
  };
}

/**
 * Collect six configuration layers from probe evidence + repo SSOT.
 * @param {string} evidenceDir
 * @param {{ targetProfile?: string, flyTomlPath?: string }} [opts]
 */
function collectConfigurationLayers(evidenceDir, opts = {}) {
  const target = opts.targetProfile || 'production';
  const base = path.isAbsolute(evidenceDir) ? evidenceDir : path.join(ROOT, evidenceDir);
  const flyInv = readText(path.join(base, 'fly-secrets-inventory.txt'));
  const flyEnv = readText(path.join(base, 'fly-env-redacted.txt'));
  const metaBuild =
    readJson(path.join(base, 'prod/meta-build.json')) ||
    readJson(path.join(base, 'meta-build.json')) ||
    {};
  const metaSummary = readText(path.join(base, 'meta-summary.txt'));
  const prodProf =
    (metaSummary.match(/prod_deployment_profile=([^\n]+)/) || [])[1] ||
    metaBuild.deployment_profile ||
    null;

  const cfgSsot = loadConfigSsot();
  const flyTomlRel =
    opts.flyTomlPath ||
    (target === 'production'
      ? cfgSsot.configuration_layers.find((l) => l.id === 'fly_config')?.paths?.production
      : cfgSsot.configuration_layers.find((l) => l.id === 'fly_config')?.paths?.staging);
  const flyToml = flyTomlRel ? readText(path.join(ROOT, flyTomlRel)) : '';

  const envExample = parseEnvFile(
    readText(path.join(ROOT, 'scripts/dev/.env.production.example'))
  );
  const envLocalPath = path.join(ROOT, 'scripts/dev/.env.production.local');
  const envLocal = fs.existsSync(envLocalPath) ? parseEnvFile(readText(envLocalPath)) : {};

  const ghKeys = ['TRAVELTRUST_DEPLOYMENT_PROFILE', 'SEED_TEST_ACCOUNTS'];
  const ghScan = scanGithubActions(ghKeys);

  return {
    target_profile: target,
    layers: {
      registry: registryExpected(target),
      fly_secrets: {
        TRAVELTRUST_DEPLOYMENT_PROFILE: flyVal(flyEnv, 'TRAVELTRUST_DEPLOYMENT_PROFILE') || flyVal(flyInv, 'TRAVELTRUST_DEPLOYMENT_PROFILE'),
        SEED_TEST_ACCOUNTS: flyVal(flyEnv, 'SEED_TEST_ACCOUNTS') || flyVal(flyInv, 'SEED_TEST_ACCOUNTS'),
        TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE: flyVal(flyEnv, 'TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE'),
        TRAVELTRUST_MARKET_PUBLIC_SHOWCASE: flyVal(flyEnv, 'TRAVELTRUST_MARKET_PUBLIC_SHOWCASE'),
        DID_RANK_SEED_MARKET_DEMO: flyVal(flyEnv, 'DID_RANK_SEED_MARKET_DEMO'),
      },
      fly_config: parseFlyTomlEnv(flyToml),
      env_production: {
        example: {
          TRAVELTRUST_DEPLOYMENT_PROFILE: envExample.TRAVELTRUST_DEPLOYMENT_PROFILE ?? null,
          SEED_TEST_ACCOUNTS: envExample.SEED_TEST_ACCOUNTS ?? null,
          TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE: envExample.TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE ?? null,
          TRAVELTRUST_MARKET_PUBLIC_SHOWCASE: envExample.TRAVELTRUST_MARKET_PUBLIC_SHOWCASE ?? null,
          DID_RANK_SEED_MARKET_DEMO: envExample.DID_RANK_SEED_MARKET_DEMO ?? null,
        },
        local_declared: Object.keys(envLocal).filter((k) =>
          [
            'TRAVELTRUST_DEPLOYMENT_PROFILE',
            'SEED_TEST_ACCOUNTS',
            'TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE',
            'TRAVELTRUST_MARKET_PUBLIC_SHOWCASE',
            'DID_RANK_SEED_MARKET_DEMO',
          ].includes(k)
        ),
      },
      github_actions: ghScan,
      runtime_meta: {
        deployment_profile: normalizeProfile(prodProf),
      },
    },
  };
}

function evaluateConfigurationTruth(evidenceDir, opts = {}) {
  const collected = collectConfigurationLayers(evidenceDir, opts);
  const { layers, target_profile: target } = collected;
  const expected = layers.registry;
  const drifts = [];

  const compare = (layerId, key, actual, expectedVal) => {
    if (expectedVal === null || expectedVal === undefined) return;
    const a = normalizeProfile(actual);
    const e = normalizeProfile(expectedVal);
    if (actual === '<secret_present>' && e) return;
    if (a !== e && actual !== null && actual !== undefined && actual !== '') {
      drifts.push({
        kind: 'configuration_drift',
        layer: layerId,
        key,
        expected: expectedVal,
        actual,
      });
    }
  };

  compare('fly_secrets', 'deployment_profile', layers.fly_secrets.TRAVELTRUST_DEPLOYMENT_PROFILE, expected.deployment_profile);
  compare('env_production.example', 'deployment_profile', layers.env_production.example.TRAVELTRUST_DEPLOYMENT_PROFILE, expected.deployment_profile);
  compare('runtime_meta', 'deployment_profile', layers.runtime_meta.deployment_profile, expected.deployment_profile);

  if (
    normalizeProfile(layers.registry.deployment_profile) &&
    normalizeProfile(layers.fly_secrets.TRAVELTRUST_DEPLOYMENT_PROFILE) &&
    layers.fly_secrets.TRAVELTRUST_DEPLOYMENT_PROFILE !== '<secret_present>' &&
    normalizeProfile(layers.registry.deployment_profile) !==
      normalizeProfile(layers.fly_secrets.TRAVELTRUST_DEPLOYMENT_PROFILE)
  ) {
    drifts.push({
      kind: 'registry_fly_mismatch',
      layer: 'fly_secrets',
      key: 'TRAVELTRUST_DEPLOYMENT_PROFILE',
      expected: layers.registry.deployment_profile,
      actual: layers.fly_secrets.TRAVELTRUST_DEPLOYMENT_PROFILE,
    });
  }

  if (
    normalizeProfile(layers.fly_secrets.TRAVELTRUST_DEPLOYMENT_PROFILE) === expected.deployment_profile &&
    (layers.fly_secrets.TRAVELTRUST_DEPLOYMENT_PROFILE === '<secret_present>' ||
      normalizeProfile(layers.fly_secrets.TRAVELTRUST_DEPLOYMENT_PROFILE) === expected.deployment_profile) &&
    !layers.runtime_meta.deployment_profile
  ) {
    drifts.push({
      kind: 'secret_without_runtime',
      layer: 'runtime_meta',
      key: 'deployment_profile',
      expected: expected.deployment_profile,
      actual: null,
      detail:
        'Fly secret declares production but GET /meta/build deployment_profile is null — Configuration Drift',
    });
  }

  if (
    target === 'production' &&
    layers.runtime_meta.deployment_profile !== expected.deployment_profile &&
    !drifts.some((d) => d.kind === 'secret_without_runtime')
  ) {
    drifts.push({
      kind: 'configuration_drift',
      layer: 'runtime_meta',
      key: 'deployment_profile',
      expected: expected.deployment_profile,
      actual: layers.runtime_meta.deployment_profile,
    });
  }

  const finalPass = drifts.length === 0;

  return {
    pass: finalPass,
    target_profile: target,
    machine_key: 'TT_CONFIGURATION_TRUTH',
    layers: collected.layers,
    drifts,
    verdict: finalPass ? 'PASS' : 'FAIL',
    reason: finalPass
      ? 'Configuration layers aligned with Registry and Runtime /meta'
      : `Configuration Drift detected (${drifts.length} item(s)) — see drifts[]`,
  };
}

function writeConfigurationTruthEvidence(outDir, evaluation, meta = {}) {
  const base = path.isAbsolute(outDir) ? outDir : path.join(ROOT, outDir);
  fs.mkdirSync(base, { recursive: true });
  const payload = {
    review_id: 'CONFIGURATION-TRUTH',
    ssot: 'registry/configuration-truth-ssot.v1.json',
    ...meta,
    ...evaluation,
  };
  fs.writeFileSync(path.join(base, 'configuration-truth.json'), `${JSON.stringify(payload, null, 2)}\n`);
  return payload;
}

module.exports = {
  ROOT,
  CFG_SSOT,
  collectConfigurationLayers,
  evaluateConfigurationTruth,
  writeConfigurationTruthEvidence,
};
