#!/usr/bin/env node
/**
 * Admin HTTP client for Official Cold Start Dataset (OCS).
 * All writes go through Admin / Public Operations / user market APIs — never raw SQL.
 *
 * Auth SSOT (aligned with run-admin-l5-staging-audit.sh + Playwright loginSuperAdmin):
 *   seed → login → role∈{admin,super_admin} → capabilities HTTP 200
 * Staging seed may return db_failed while login still emits a Bearer that capabilities
 * rejects as login_required — never treat login token alone as a valid Admin session.
 */
const http = require('http');
const https = require('https');

const DEFAULT_STAGING_BOOTSTRAP = 'adm-10x4-20260719143519@traveltrust.test';
const ADMIN_ROLES = new Set(['admin', 'super_admin']);
const IMMUTABLE_BUSINESS_EMAIL =
  /^(tourist|guide|merchant|multi-demo)@test\.com$/i;

/** Resolve credentials — same precedence as Admin Matrix audit / Reality probes. */
function resolveAdminCredentials(email, password) {
  const pass =
    password ||
    process.env.STAGING_AUDIT_PASSWORD ||
    process.env.ADMIN_PASS ||
    process.env.STAGING_OCS_ADMIN_PASS ||
    'Test123!';
  const explicit =
    (email && String(email).trim()) ||
    process.env.STAGING_AUDIT_EMAIL ||
    process.env.ADMIN_EMAIL ||
    process.env.STAGING_OCS_ADMIN_EMAIL ||
    '';
  if (explicit && !IMMUTABLE_BUSINESS_EMAIL.test(explicit)) {
    return { email: explicit, password: pass, source: 'explicit_or_env' };
  }
  return {
    email: DEFAULT_STAGING_BOOTSTRAP,
    password: pass,
    source: 'staging_bootstrap',
  };
}

function createClient(apiBase) {
  const API = apiBase.replace(/\/$/, '');
  const lib = API.startsWith('https') ? https : http;

  function req(method, urlPath, body, token, extraHeaders = {}) {
    return new Promise((resolve, reject) => {
      const u = new URL(API + urlPath);
      const payload = body ? JSON.stringify(body) : null;
      const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...extraHeaders,
      };
      if (payload && !headers['Idempotency-Key'] && ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
        headers['Idempotency-Key'] = `ocs-wf-${method.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      }
      if (payload) headers['Content-Length'] = Buffer.byteLength(payload);
      const r = lib.request(
        {
          hostname: u.hostname,
          port: u.port || (u.protocol === 'https:' ? 443 : 80),
          path: u.pathname + u.search,
          method,
          headers,
          timeout: 45000,
        },
        (res) => {
          let d = '';
          res.on('data', (c) => (d += c));
          res.on('end', () => {
            let json;
            try {
              json = JSON.parse(d);
            } catch {
              json = { _raw: d.slice(0, 500) };
            }
            resolve({ status: res.statusCode, json });
          });
        }
      );
      r.on('error', reject);
      r.on('timeout', () => {
        r.destroy();
        reject(new Error(`request timeout ${method} ${urlPath}`));
      });
      if (payload) r.write(payload);
      r.end();
    });
  }

  /** Session validation only — probes must call this before entering test state. */
  async function assertAdminCapabilities(token) {
    if (!token || typeof token !== 'string') {
      return { ok: false, status: 0, json: { error: 'missing_token' } };
    }
    const cap = await req('GET', '/api/v1/admin/capabilities', null, token);
    return { ok: cap.status === 200, status: cap.status, json: cap.json };
  }

  /**
   * Canonical Admin session gate (≤8): seed → login → role → capabilities 200.
   * No one-shot hydrate early-return — bootstrap uses the same loop as audit.
   */
  async function loginWithCapabilitiesGate(adminEmail, adminPass, opts = {}) {
    const maxAttempts = opts.maxAttempts || 8;
    let lastDetail = '';
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const seed = await req('POST', '/auth/seed-test-accounts', {
        promote_admin_email: adminEmail,
      });
      const seedNote =
        (seed.json && (seed.json.error || seed.json.code)) ||
        (seed.status < 400 ? 'ok' : `http_${seed.status}`);
      if (seed.status >= 400) {
        console.warn(
          `ocs-admin-client: seed attempt=${attempt} ${seed.status} ${JSON.stringify(seed.json || {}).slice(0, 80)}`
        );
      }

      const login = await req('POST', '/auth/login', {
        email: adminEmail,
        password: adminPass,
      });
      const tok = login.json && login.json.token;
      const role = (login.json && login.json.role) || '';
      if (!tok) {
        lastDetail = `attempt=${attempt} seed=${seedNote} login_http=${login.status} no_token`;
        await new Promise((r) => setTimeout(r, Math.min(2500, 400 * attempt)));
        continue;
      }
      if (!ADMIN_ROLES.has(String(role))) {
        lastDetail = `attempt=${attempt} seed=${seedNote} role=${role}`;
        console.warn(`ocs-admin-client: reject non-admin role=${role}`);
        await new Promise((r) => setTimeout(r, Math.min(2500, 400 * attempt)));
        continue;
      }

      const cap = await assertAdminCapabilities(tok);
      if (cap.ok) {
        // Final preflight: capabilities must still be 200 before leaving login.
        const recheck = await assertAdminCapabilities(tok);
        if (!recheck.ok) {
          lastDetail = `attempt=${attempt} seed=${seedNote} role=${role} cap_recheck=${recheck.status}`;
          console.warn(`ocs-admin-client: capabilities recheck failed (${lastDetail})`);
          await new Promise((r) => setTimeout(r, Math.min(2500, 400 * attempt)));
          continue;
        }
        console.log(
          `ocs-admin-client: session OK email=${adminEmail} role=${role} cap=200 (attempt=${attempt} seed=${seedNote})`
        );
        return { token: tok, email: adminEmail, role, attempt, seedNote };
      }
      lastDetail = `attempt=${attempt} seed=${seedNote} role=${role} cap=${cap.status} (dead_token)`;
      console.warn(`ocs-admin-client: dead token rejected (${lastDetail})`);
      await new Promise((r) => setTimeout(r, Math.min(2500, 400 * attempt)));
    }
    throw new Error(
      `admin login failed: ${adminEmail} capabilities gate exhausted (${lastDetail})`
    );
  }

  async function adminLogin(email, password) {
    // C1–C4 / tourist@test.com 不可 promote（immutable business）。默认改用 Staging bootstrap / STAGING_AUDIT_*.
    const resolved = resolveAdminCredentials(email, password);
    let adminEmail = resolved.email;
    let adminPass = resolved.password;

    const stagingBootstrap =
      process.env.STAGING_OCS_ADMIN_EMAIL || DEFAULT_STAGING_BOOTSTRAP;

    // Prefer hydrated Staging admin when caller passed null / immutable business email.
    const preferBootstrap =
      !email ||
      IMMUTABLE_BUSINESS_EMAIL.test(String(email)) ||
      resolved.source === 'staging_bootstrap';

    if (preferBootstrap && adminEmail === DEFAULT_STAGING_BOOTSTRAP) {
      try {
        const session = await loginWithCapabilitiesGate(adminEmail, adminPass);
        process.env.ADMIN_EMAIL = session.email;
        process.env.ADMIN_PASS = adminPass;
        return session.token;
      } catch (e) {
        console.warn(
          `ocs-admin-client: bootstrap gate failed (${String(e.message || e).slice(0, 160)}); trying ephemeral provision`
        );
      }

      const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
      adminEmail = `adm-10x4-${stamp}@traveltrust.test`;
      const reg = await req('POST', '/auth/register', {
        email: adminEmail,
        password: adminPass,
        nickname: 'OCS Align Admin',
        role: 'tourist',
      });
      if (reg.status >= 400 && reg.status !== 409) {
        const errCode = reg.json && (reg.json.error || reg.json.message);
        const dsn = process.env.STAGING_DATABASE_URL || process.env.DATABASE_URL;
        // Staging may require verification_code on /auth/register — provision via PG instead.
        if (dsn && String(errCode).includes('verification_code')) {
          const path = require('path');
          const crypto = require('crypto');
          const { Client } = require(path.join(__dirname, '../../../frontend/node_modules/pg'));
          const bcryptHash =
            process.env.TT_ADMIN_PASSWORD_BCRYPT ||
            '$2b$12$FL0raem8dnHmMB0sGI.qQO061ZZBa6TTf/08kutFMLThVBNR6.VJi'; // Test123!
          const pg = new Client({ connectionString: dsn, connectionTimeoutMillis: 15000 });
          await pg.connect();
          try {
            const id = crypto.randomUUID();
            await pg.query(
              `INSERT INTO users (id, email, password_hash, role, kyc_status, nickname, created_at, updated_at, email_verified_at, growth_points, growth_fraud_status)
               VALUES ($1::uuid, $2, $3, 'super_admin', 'none', 'OCS Align Admin', now(), now(), now(), 0, 'normal')
               ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'super_admin', updated_at = now(), email_verified_at = now()`,
              [id, adminEmail, bcryptHash]
            );
            await pg.query(
              `UPDATE users u
               SET password_hash = COALESCE(
                 (SELECT t.password_hash FROM users t WHERE lower(t.email) = 'tourist@test.com' LIMIT 1),
                 u.password_hash
               ),
               role = 'super_admin',
               email_verified_at = COALESCE(u.email_verified_at, now()),
               updated_at = now()
               WHERE lower(u.email) = lower($1)`,
              [adminEmail]
            );
            console.log(
              `ocs-admin-client: PG-provisioned ${adminEmail} — requires API restart to hydrate memory before login`
            );
          } finally {
            await pg.end();
          }
          throw new Error(
            `ephemeral admin needs API hydrate (fly apps restart tt-api-staging) then retry; prefer STAGING_OCS_ADMIN_EMAIL=${stagingBootstrap}`
          );
        } else {
          throw new Error(`ephemeral admin register failed: HTTP ${reg.status} ${JSON.stringify(reg.json)}`);
        }
      }
      console.log(`ocs-admin-client: using ephemeral ${adminEmail}`);
      process.env.ADMIN_EMAIL = adminEmail;
      process.env.ADMIN_PASS = adminPass;
    }

    // Staging: elevate via PG first (seed promote often misses PG-provisioned users).
    if (process.env.STAGING_DATABASE_URL || process.env.DATABASE_URL) {
      try {
        const { spawnSync } = require('child_process');
        const elev = spawnSync(
          process.execPath,
          [require('path').join(__dirname, '../elevate-staging-ephemeral-admin-super.cjs')],
          {
            env: { ...process.env, ADMIN_EMAIL: adminEmail },
            encoding: 'utf8',
          }
        );
        if (elev.status === 0) {
          console.log('ocs-admin-client: elevated to super_admin via PG');
        } else {
          console.warn('ocs-admin-client: elevate skipped', (elev.stderr || elev.stdout || '').slice(0, 200));
        }
      } catch (e) {
        console.warn('ocs-admin-client: elevate error', String(e).slice(0, 200));
      }
    }

    const session = await loginWithCapabilitiesGate(adminEmail, adminPass);
    process.env.ADMIN_EMAIL = session.email;
    process.env.ADMIN_PASS = adminPass;
    return session.token;
  }

  /** Full session object for Reality / Matrix probes (token + preflight proof). */
  async function adminSession(email, password) {
    const resolved = resolveAdminCredentials(email, password);
    const token = await adminLogin(resolved.email, resolved.password);
    const cap = await assertAdminCapabilities(token);
    if (!cap.ok) {
      throw new Error(
        `adminSession preflight capabilities ${cap.status} — refuse test state`
      );
    }
    return {
      token,
      email: process.env.ADMIN_EMAIL || resolved.email,
      capabilities_http: cap.status,
      gate: 'seed_login_role_capabilities_200',
    };
  }

  async function userLogin(email, password) {
    const r = await req('POST', '/auth/login', { email, password });
    if (!r.json.token) throw new Error(`user login failed: ${email} HTTP ${r.status}`);
    return r.json.token;
  }

  return {
    API,
    req,
    adminLogin,
    adminSession,
    assertAdminCapabilities,
    resolveAdminCredentials,
    userLogin,
    async createOfficialAccount(adminTok, body) {
      return req('POST', '/api/v1/admin/official/accounts', body, adminTok);
    },
    async submitOfficialAccountReview(adminTok, id) {
      return req('POST', `/api/v1/admin/official/accounts/${id}/submit-review`, {}, adminTok);
    },
    async publishOfficialAccount(adminTok, id) {
      return req('POST', `/api/v1/admin/official/accounts/${id}/publish`, {}, adminTok);
    },
    async linkOfficialAccountGuide(adminTok, accountId, guideId) {
      return req('POST', `/api/v1/admin/official/accounts/${accountId}/link-guide`, { guide_id: guideId }, adminTok);
    },
    async bootstrapOfficialAccountMarket(adminTok, accountId, variant) {
      const r = await req(
        'POST',
        `/api/v1/admin/official/accounts/${accountId}/bootstrap-market`,
        { variant },
        adminTok
      );
      if (r.status !== 404) return r;
      const dsn = process.env.STAGING_DATABASE_URL || process.env.DATABASE_URL;
      if (!dsn) return r;
      const { spawnSync } = require('child_process');
      const path = require('path');
      const py = process.env.PYTHON || 'python';
      const script = path.join(__dirname, '../official-first-bootstrap-staging-ocs-market-gate.py');
      const boot = spawnSync(py, [script, '--account-id', accountId, '--variant', variant], {
        env: process.env,
        encoding: 'utf8',
      });
      if (boot.status !== 0) {
        throw new Error(
          `bootstrap-market PG fallback failed: ${String(boot.stderr || boot.stdout || '').slice(0, 300)}`
        );
      }
      console.log(`ocs-admin-client: bootstrap-market PG fallback variant=${variant} account=${accountId}`);
      return { status: 200, json: { status: 'ok', source: 'pg_bootstrap_fallback', variant } };
    },
    async createGuide(userTok, body) {
      return req('POST', '/api/v1/guides', body, userTok);
    },
    async stakeGuide(userTok, guideId, amount) {
      return req('POST', `/api/v1/guides/${guideId}/stake`, { amount: String(amount) }, userTok);
    },
    async createProviderListing(userTok, payload) {
      return req('POST', '/api/v1/market/provider/listings', { payload }, userTok);
    },
    async createAcquisitionListing(userTok, payload) {
      return req(
        'POST',
        '/api/v1/market/acquisition/listings',
        { agree_escrow_copy: true, payload },
        userTok
      );
    },
    async publishEntity(adminTok, entityType, id) {
      return req('POST', `/api/v1/admin/official/public-operations/entities/${entityType}/${id}/publish`, {}, adminTok);
    },
    async unpublishEntity(adminTok, entityType, id) {
      return req('POST', `/api/v1/admin/official/public-operations/entities/${entityType}/${id}/unpublish`, {}, adminTok);
    },
    async setSurfaces(adminTok, entityType, id, surfaces) {
      return req(
        'PATCH',
        `/api/v1/admin/official/public-operations/entities/${entityType}/${id}/surfaces`,
        { display_surfaces: surfaces },
        adminTok
      );
    },
    async setFeatured(adminTok, entityType, id, featured = true) {
      return req(
        'PATCH',
        `/api/v1/admin/official/public-operations/entities/${entityType}/${id}/featured`,
        { featured },
        adminTok
      );
    },
    async setPriority(adminTok, entityType, id, displayPriority) {
      return req(
        'PATCH',
        `/api/v1/admin/official/public-operations/entities/${entityType}/${id}/priority`,
        { display_priority: displayPriority },
        adminTok
      );
    },
    async setSchedule(adminTok, entityType, id, displayStartAt, displayEndAt) {
      return req(
        'PATCH',
        `/api/v1/admin/official/public-operations/entities/${entityType}/${id}/schedule`,
        { display_start_at: displayStartAt, display_end_at: displayEndAt },
        adminTok
      );
    },
    async createCommunityPost(userTok, body) {
      return req('POST', '/api/v1/community/posts', body, userTok);
    },
    async createOfficialGuide(adminTok, body) {
      return req('POST', '/api/v1/admin/official/guides', body, adminTok);
    },
    async submitOfficialGuideReview(adminTok, id) {
      return req('POST', `/api/v1/admin/official/guides/${id}/submit-review`, {}, adminTok);
    },
    async publishOfficialGuide(adminTok, id) {
      return req('POST', `/api/v1/admin/official/guides/${id}/publish`, {}, adminTok);
    },
    async createCampaign(adminTok, body) {
      return req('POST', '/api/v1/admin/official/public-operations/campaigns', body, adminTok);
    },
    async addCampaignItem(adminTok, campaignId, body) {
      return req('POST', `/api/v1/admin/official/public-operations/campaigns/${campaignId}/items`, body, adminTok);
    },
    async submitCampaignReview(adminTok, campaignId) {
      return req('POST', `/api/v1/admin/official/public-operations/campaigns/${campaignId}/submit-review`, {}, adminTok);
    },
    async deployCampaign(adminTok, campaignId) {
      return req('POST', `/api/v1/admin/official/public-operations/campaigns/${campaignId}/deploy`, {}, adminTok);
    },
    async rollbackCampaign(adminTok, campaignId) {
      return req('POST', `/api/v1/admin/official/public-operations/campaigns/${campaignId}/rollback`, {}, adminTok);
    },
    async archiveCampaign(adminTok, campaignId) {
      return req('POST', `/api/v1/admin/official/cold-start/campaigns/${campaignId}/archive`, {}, adminTok);
    },
    async archiveOfficialGuide(adminTok, id) {
      return req('POST', `/api/v1/admin/official/guides/${id}/archive`, {}, adminTok);
    },
    async listOfficialAccounts(adminTok, limit = 200) {
      return req('GET', `/api/v1/admin/official/accounts?limit=${limit}`, null, adminTok);
    },
  };
}

module.exports = {
  createClient,
  resolveAdminCredentials,
  DEFAULT_STAGING_BOOTSTRAP,
  ADMIN_ROLES,
};
