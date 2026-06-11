# Phase ② · Staging UAT · Production Readiness Matrix

**Target:** [https://tt-web-staging.fly.dev](https://tt-web-staging.fly.dev)  
**API:** [https://tt-api-staging.fly.dev](https://tt-api-staging.fly.dev)  
**Recorded:** 2026-06-07T14:46:55.233Z  
**UAT artifact:** `D:/TravelTrust-V1.1/evidence/staging-uat-six-domains/20260607T144259Z/uat-findings.json`  

> 本矩阵仅登记 **Staging UAT 真实浏览器缺陷**；Remediation 只允许 **bugfix**（含 staging 部署/Env/CORS/构建），**禁止新增产品需求**。 **≠ Production GO** · **≠ Phase ③ 公网 GO**。

---

## 1 · Executive verdict

| Gate | Verdict |
|------|---------|
| **Staging browsable** | **YES** |
| **Staging UAT (六大域)** | **PASS** (25 PASS / 0 WARN / 0 FAIL) |
| **P0 cluster (CORS/meta/fetch)** | **CLEAR** |
| **Production GO** | **NO-GO** |
| **Phase ③ Public GO** | **NO-GO** |

### Auth posture（P1 收口）

| Item | Value |
|------|-------|
| **UAT account** | `tourist@test.com` |
| **UAT user_id** | `2760d445-cbf4-47d0-9461-fcba3db0516f` |
| **Auth-gated routes** | Bearer via `seed-test-accounts` + `promote_admin_email` + `ensureCommunityBrowserSessionAccepted` |
| **Public routes** | Unauthenticated；401/403 **不计 P0** |
| **Note** | Auth-gated routes probed with Bearer (tourist + promote_admin); public routes unauthenticated; 401/403 on public = P1 not P0 |

---

## 2 · Six-domain readiness

| ID | 域 | Scope | Staging UAT | Evidence |
|----|-----|-------|-------------|----------|
| D1 | 首页 | Marketing / Home / Trust hub | PASS | Staging UAT browser |
| D2 | 身份 | Auth / me / identities | PASS | Staging UAT browser |
| D3 | 市场 | Market / acquisition / guides | PASS | Staging UAT browser |
| D4 | 社区 | Community feed / explore / messages | PASS | Staging UAT browser |
| D5 | 治理 | Governance / staking / Sepolia | PASS | Staging UAT browser |
| D6 | 管理员 | Admin workspace / ops | PASS | Staging UAT browser |
| DX | 跨域 | CORS / meta / env alignment | PASS | Staging UAT browser |

---

## 3 · Defect register（bugfix only）

| ID | 域 | Route | Prio | Sev | Observation | Fix class | Status |
|----|-----|-------|------|-----|-------------|-----------|--------|
| — | — | — | — | 无 FAIL/WARN 级缺陷记录 | — | — |

---

## 4 · Production readiness checklist（③ 闸 · 未满足项）

| # | Item | Staging | Production requirement | Status |
|---|------|---------|------------------------|--------|
| P1 | Public HTTPS frontend | ✅ tt-web-staging | Dedicated prod domain + CDN | OPEN |
| P2 | CORS / API alignment | UAT DX row | Locked prod origins | PASS |
| P3 | Sepolia chain_id=11155111 | UAT meta probe | Same on prod chain policy | PASS |
| P4 | Stripe test vs live isolation | API secrets | **sk_live forbidden** on staging | PREP |
| P5 | Production CDN / HLS (G7) | staging MP4 only | CDN + HLS GO | **PREP_PASS** |
| P6 | Build quality (TS/ESLint in CI) | standalone build skips lint/tsc | Full green `npm run build` + lint | **OPEN** |
| P7 | Zero error-boundary on core routes | UAT §3 | All six domains PASS | **PASS** |
| P8 | Admin auth (real RBAC) | Bearer + promote_admin (②) | SSO/RBAC + audit | OPEN |

---

## 5 · Remediation policy

1. **Allowed:** bugfix, env/CORS/staging deploy, missing import/typo, API 5xx when contract wrong.  
2. **Forbidden:** new features, UI structure changes (五主路由 freeze), scope creep.  
3. **P0 vs P1:** 未登录 401 / shell 不匹配 **≠ P0**；public 路由 Failed to fetch / CORS / 5xx = **P0**；Bearer 路由同类问题先记 **P1** 待 bugfix。  
4. **Re-run:** `bash scripts/dev/run-staging-uat-six-domains.sh`

---

## 6 · Route-level findings (raw)

```json
[
  {
    "domain": "首页",
    "route": "/",
    "status": "PASS",
    "auth_mode": "public",
    "notes": [
      "shell reachable"
    ]
  },
  {
    "domain": "首页",
    "route": "/traveltrust",
    "status": "PASS",
    "auth_mode": "public",
    "notes": [
      "shell reachable"
    ]
  },
  {
    "domain": "首页",
    "route": "/trust",
    "status": "PASS",
    "auth_mode": "public",
    "notes": [
      "shell reachable"
    ]
  },
  {
    "domain": "首页",
    "route": "/did-rank",
    "status": "PASS",
    "auth_mode": "public",
    "notes": [
      "shell reachable"
    ]
  },
  {
    "domain": "身份",
    "route": "/auth/login",
    "status": "PASS",
    "auth_mode": "public",
    "notes": [
      "shell reachable"
    ]
  },
  {
    "domain": "身份",
    "route": "/auth/register",
    "status": "PASS",
    "auth_mode": "public",
    "notes": [
      "shell reachable"
    ]
  },
  {
    "domain": "身份",
    "route": "/me",
    "status": "PASS",
    "auth_mode": "bearer_tourist",
    "notes": [
      "shell reachable"
    ]
  },
  {
    "domain": "身份",
    "route": "/me/settings",
    "status": "PASS",
    "auth_mode": "bearer_tourist",
    "notes": [
      "shell reachable"
    ]
  },
  {
    "domain": "身份",
    "route": "/me/identities",
    "status": "PASS",
    "auth_mode": "bearer_tourist",
    "notes": [
      "shell reachable"
    ]
  },
  {
    "domain": "市场",
    "route": "/market",
    "status": "PASS",
    "auth_mode": "public",
    "notes": [
      "shell reachable"
    ]
  },
  {
    "domain": "市场",
    "route": "/market/acquisition",
    "status": "PASS",
    "auth_mode": "public",
    "notes": [
      "shell reachable"
    ]
  },
  {
    "domain": "社区",
    "route": "/community",
    "status": "PASS",
    "auth_mode": "public",
    "notes": [
      "shell reachable"
    ]
  },
  {
    "domain": "社区",
    "route": "/community/explore",
    "status": "PASS",
    "auth_mode": "public",
    "notes": [
      "api auth-only (401/403 ignored for public probe): 401 /api/v1/community/me/following"
    ]
  },
  {
    "domain": "社区",
    "route": "/community/messages",
    "status": "PASS",
    "auth_mode": "bearer_tourist",
    "notes": [
      "shell reachable"
    ]
  },
  {
    "domain": "社区",
    "route": "/community/me/posts",
    "status": "PASS",
    "auth_mode": "bearer_tourist",
    "notes": [
      "shell reachable"
    ]
  },
  {
    "domain": "治理",
    "route": "/governance",
    "status": "PASS",
    "auth_mode": "public",
    "notes": [
      "api auth-only (401/403 ignored for public probe): 401 /api/v1/governance/pool"
    ]
  },
  {
    "domain": "治理",
    "route": "/governance/proposals",
    "status": "PASS",
    "auth_mode": "bearer_tourist",
    "notes": [
      "shell reachable"
    ]
  },
  {
    "domain": "治理",
    "route": "/governance/delegate",
    "status": "PASS",
    "auth_mode": "bearer_tourist",
    "notes": [
      "shell reachable"
    ]
  },
  {
    "domain": "治理",
    "route": "/staking",
    "status": "PASS",
    "auth_mode": "bearer_tourist",
    "notes": [
      "shell reachable"
    ]
  },
  {
    "domain": "管理员",
    "route": "/admin",
    "status": "PASS",
    "auth_mode": "bearer_admin",
    "notes": [
      "shell reachable"
    ]
  },
  {
    "domain": "管理员",
    "route": "/admin/orders",
    "status": "PASS",
    "auth_mode": "bearer_admin",
    "notes": [
      "shell reachable"
    ]
  },
  {
    "domain": "管理员",
    "route": "/admin/users",
    "status": "PASS",
    "auth_mode": "bearer_admin",
    "notes": [
      "shell reachable"
    ]
  },
  {
    "domain": "管理员",
    "route": "/admin/finance",
    "status": "PASS",
    "auth_mode": "bearer_admin",
    "notes": [
      "shell reachable"
    ]
  },
  {
    "domain": "跨域",
    "route": "GET /meta (same-origin via Next)",
    "status": "PASS",
    "auth_mode": "public",
    "notes": [
      "chain_id=11155111"
    ]
  },
  {
    "domain": "跨域",
    "route": "OPTIONS /api/v1/governance/proposals (CORS)",
    "status": "PASS",
    "auth_mode": "public",
    "notes": [
      "preflight ok"
    ]
  }
]
```
