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
    await req('POST', '/auth/seed-test-accounts', { promote_admin_email: email });
    const r = await req('POST', '/auth/login', { email, password });
    if (!r.json.token) throw new Error(`admin login failed: ${email} HTTP ${r.status}`);
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
