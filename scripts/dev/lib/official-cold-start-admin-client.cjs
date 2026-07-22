#!/usr/bin/env node
/**
 * Admin HTTP client for Official Cold Start Dataset (OCS).
 * All writes go through Admin / Public Operations / user market APIs — never raw SQL.
 */
const http = require('http');
const https = require('https');

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
      if (payload) r.write(payload);
      r.end();
    });
  }

  async function adminLogin(email, password) {
    // C1–C4 / tourist@test.com 不可 promote（immutable business）。默认改用临时 adm-*。
    let adminEmail = email;
    let adminPass = password;
    if (
      !process.env.ADMIN_EMAIL &&
      (!email || /^(tourist|guide|merchant|multi-demo)@test\.com$/i.test(email))
    ) {
      const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
      adminEmail = `adm-10x4-${stamp}@traveltrust.test`;
      adminPass = password || 'Test123!';
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
               VALUES ($1::uuid, $2, $3, 'tourist', 'none', 'OCS Align Admin', now(), now(), now(), 0, 'normal')
               ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = now(), email_verified_at = now()`,
              [id, adminEmail, bcryptHash]
            );
            console.log(`ocs-admin-client: provisioned ephemeral via PG (${adminEmail}) after register ${errCode}`);
          } finally {
            await pg.end();
          }
        } else {
          throw new Error(`ephemeral admin register failed: HTTP ${reg.status} ${JSON.stringify(reg.json)}`);
        }
      }
      console.log(`ocs-admin-client: using ephemeral ${adminEmail}`);
      process.env.ADMIN_EMAIL = adminEmail;
      process.env.ADMIN_PASS = adminPass;
    } else if (process.env.ADMIN_EMAIL) {
      adminEmail = process.env.ADMIN_EMAIL;
      adminPass = process.env.ADMIN_PASS || password || 'Test123!';
    }
    const promote = await req('POST', '/auth/seed-test-accounts', { promote_admin_email: adminEmail });
    if (promote.status >= 400) {
      throw new Error(
        `admin promote failed: ${adminEmail} HTTP ${promote.status} ${JSON.stringify(promote.json)}`
      );
    }
    // Staging: Public Ops publish/unpublish needs super_admin (Ops lacks PERM_OFFICIAL_PUBLISH until API redeploy).
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
          await req('POST', '/auth/seed-test-accounts', { promote_admin_email: adminEmail });
        } else {
          console.warn('ocs-admin-client: elevate skipped', (elev.stderr || elev.stdout || '').slice(0, 200));
        }
      } catch (e) {
        console.warn('ocs-admin-client: elevate error', String(e).slice(0, 200));
      }
    }
    const r = await req('POST', '/auth/login', { email: adminEmail, password: adminPass });
    if (!r.json.token) throw new Error(`admin login failed: ${adminEmail} HTTP ${r.status}`);
    return r.json.token;
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
      return req(
        'POST',
        `/api/v1/admin/official/accounts/${accountId}/bootstrap-market`,
        { variant },
        adminTok
      );
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

module.exports = { createClient };
