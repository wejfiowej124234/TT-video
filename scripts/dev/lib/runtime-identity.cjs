/**
 * RuntimeIdentity — platform-wide single identity resolver (Node/scripts).
 *
 *   const { RuntimeIdentity } = require('./lib/runtime-identity.cjs');
 *   const id = RuntimeIdentity.current();
 *   if (id.isProduction()) { ... }
 *
 * SSOT: registry/runtime-identity-ssot.v1.json
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../../..');
const SSOT_PATH = path.join(ROOT, 'registry/runtime-identity-ssot.v1.json');

const PROFILES = {
  production: 'production',
  staging: 'staging',
  local: 'local',
  development: 'development',
  demo: 'demo',
  unknown: 'unknown',
};

function loadSsot() {
  return JSON.parse(fs.readFileSync(SSOT_PATH, 'utf8'));
}

function normalizeProfile(raw) {
  if (raw === null || raw === undefined || raw === '' || raw === 'None' || raw === 'null') {
    return null;
  }
  const s = String(raw).trim().toLowerCase();
  if (s === 'prod') return 'production';
  return s;
}

function envFlag(name, env) {
  const v = env[name];
  if (v === undefined || v === null) return null;
  const t = String(v).trim();
  if (t === '0' || t === 'false') return false;
  if (t === '1' || t === 'true') return true;
  return null;
}

function isOffish(v) {
  return v === null || v === undefined || v === '' || v === '0' || v === 'null' || v === 'False';
}

function derivePublicContentProfile(deploymentProfile, env) {
  const comm = env.TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE;
  const mkt = env.TRAVELTRUST_MARKET_PUBLIC_SHOWCASE;
  const demo = env.DID_RANK_SEED_MARKET_DEMO;
  if (deploymentProfile === 'production' && isOffish(comm) && isOffish(mkt) && isOffish(demo)) {
    return 'production';
  }
  if (deploymentProfile === 'staging') return 'staging';
  if (deploymentProfile === 'local') {
    if (envFlag('TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE', env) || envFlag('DID_RANK_SEED_MARKET_DEMO', env)) {
      return 'demo';
    }
    if (env.SEED_TEST_ACCOUNTS === '1') return 'development';
    return 'local';
  }
  if (deploymentProfile) return `${deploymentProfile}_mixed`;
  if (env.SEED_TEST_ACCOUNTS === '1') return 'development';
  return 'unknown';
}

/**
 * Resolve profile enum from environment map.
 * @param {Record<string, string|undefined>} env
 */
function resolveProfile(env) {
  const raw = normalizeProfile(env.TRAVELTRUST_DEPLOYMENT_PROFILE);
  const seedOn = env.SEED_TEST_ACCOUNTS === '1';
  const corsEmpty = !env.CORS_ORIGINS || String(env.CORS_ORIGINS).trim() === '';
  const showcaseOn =
    envFlag('TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE', env) === true ||
    envFlag('TRAVELTRUST_MARKET_PUBLIC_SHOWCASE', env) === true ||
    envFlag('DID_RANK_SEED_MARKET_DEMO', env) === true;

  if (raw === 'production') return PROFILES.production;
  if (raw === 'staging' || raw === 'staging_mirror') return PROFILES.staging;
  if (raw === 'local') {
    if (showcaseOn) return PROFILES.demo;
    if (seedOn) return PROFILES.development;
    return PROFILES.local;
  }
  if (!raw) {
    if (seedOn && corsEmpty) return showcaseOn ? PROFILES.demo : PROFILES.development;
    return PROFILES.unknown;
  }
  return PROFILES.unknown;
}

class RuntimeIdentity {
  /**
   * @param {Record<string, string|undefined>} env
   * @param {{ deployment_profile_meta?: string|null }} [meta]
   */
  constructor(env, meta = {}) {
    this.env = { ...env };
    this.deployment_profile_raw = normalizeProfile(env.TRAVELTRUST_DEPLOYMENT_PROFILE);
    this.deployment_profile_meta = normalizeProfile(meta.deployment_profile_meta);
    this.profile = resolveProfile(env);
    this.public_content_profile = derivePublicContentProfile(this.deployment_profile_raw, env);
  }

  /** @param {{ env?: Record<string,string>, meta?: object }} [opts] */
  static current(opts = {}) {
    const env = opts.env || process.env;
    return new RuntimeIdentity(env, opts.meta || {});
  }

  /** Build from probe evidence directory (Fly + meta). */
  static fromProbeEvidence(evidenceDir, opts = {}) {
    const base = path.isAbsolute(evidenceDir) ? evidenceDir : path.join(ROOT, evidenceDir);
    const flyEnvText = fs.existsSync(path.join(base, 'fly-env-redacted.txt'))
      ? fs.readFileSync(path.join(base, 'fly-env-redacted.txt'), 'utf8')
      : '';
    const env = { ...process.env };
    for (const line of flyEnvText.split(/\r?\n/)) {
      if (!line.includes('=')) continue;
      const i = line.indexOf('=');
      env[line.slice(0, i)] = line.slice(i + 1);
    }
    let metaProfile = null;
    const metaBuildPath = ['prod/meta-build.json', 'meta-build.json']
      .map((p) => path.join(base, p))
      .find((p) => fs.existsSync(p));
    if (metaBuildPath) {
      try {
        metaProfile = JSON.parse(fs.readFileSync(metaBuildPath, 'utf8')).deployment_profile;
      } catch {
        /* ignore */
      }
    }
    return new RuntimeIdentity(env, {
      deployment_profile_meta: metaProfile,
      ...opts.meta,
    });
  }

  isProduction() {
    return this.profile === PROFILES.production;
  }
  isStaging() {
    return this.profile === PROFILES.staging;
  }
  isLocal() {
    return this.profile === PROFILES.local;
  }
  isDevelopment() {
    return this.profile === PROFILES.development;
  }
  isDemo() {
    return this.profile === PROFILES.demo;
  }

  allowsCommunityShowcaseSeed() {
    if (this.isProduction() || this.isStaging()) return false;
    return envFlag('TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE', this.env) === true;
  }

  allowsSeedGuidePublicMarket() {
    if (envFlag('TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET', this.env) !== null) {
      return envFlag('TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET', this.env) === true;
    }
    if (envFlag('TRAVELTRUST_MANUAL_ACCEPTANCE', this.env) === true) return true;
    return (
      this.deployment_profile_raw === 'local' &&
      this.env.SEED_TEST_ACCOUNTS === '1' &&
      (envFlag('TRAVELTRUST_PUBLIC_CATALOG_SURFACE', this.env) === true ||
        envFlag('TRAVELTRUST_MARKET_PUBLIC_SURFACE', this.env) === true ||
        this.env.SEED_TEST_ACCOUNTS === '1')
    );
  }

  /** Production Runtime Identity guard (G2/G3). */
  evaluateProductionGuard() {
    const ssot = loadSsot().profiles.production;
    const checks = {
      deployment_profile_fly: this.deployment_profile_raw === ssot.deployment_profile,
      deployment_profile_meta: this.deployment_profile_meta === ssot.deployment_profile,
      profile_alias: this.deployment_profile_raw === ssot.deployment_profile,
      seed_off: isOffish(this.env.SEED_TEST_ACCOUNTS),
      community_showcase_off: isOffish(this.env.TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE),
      market_showcase_off: isOffish(this.env.TRAVELTRUST_MARKET_PUBLIC_SHOWCASE),
      demo_off: isOffish(this.env.DID_RANK_SEED_MARKET_DEMO),
      public_content_profile: this.public_content_profile === ssot.public_content_profile,
    };
    const pass = Object.values(checks).every(Boolean);
    return {
      pass,
      machine_key: 'TT_PRODUCTION_RUNTIME_IDENTITY',
      profile: this.profile,
      deployment_profile_raw: this.deployment_profile_raw,
      deployment_profile_meta: this.deployment_profile_meta,
      public_content_profile: this.public_content_profile,
      checks,
      verdict: pass ? 'PASS' : 'FAIL',
    };
  }

  toJSON() {
    return {
      profile: this.profile,
      deployment_profile_raw: this.deployment_profile_raw,
      deployment_profile_meta: this.deployment_profile_meta,
      public_content_profile: this.public_content_profile,
    };
  }
}

module.exports = {
  ROOT,
  SSOT_PATH,
  PROFILES,
  RuntimeIdentity,
  loadSsot,
  normalizeProfile,
  derivePublicContentProfile,
};
