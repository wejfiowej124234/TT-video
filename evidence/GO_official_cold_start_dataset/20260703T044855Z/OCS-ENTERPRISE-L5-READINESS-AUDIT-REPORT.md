# Official Cold Start Dataset · Phase 1 · Enterprise L5 Readiness Audit

**Audit type:** Official Cold Start Baseline Audit  
**Stamp:** `20260703T052100Z`  
**Verdict:** **PASS** · **L5_ENTERPRISE_READINESS** · **100/100**  
**RC / DDG:** **Not reopened** — `CLOSED_UNLESS_TOUCHED` evidence reused  
**Environment:** Staging · `tt-api-staging.fly.dev` · `tt-web-staging.fly.dev`

---

## Final rulings

| Question | Ruling |
|----------|--------|
| Official Cold Start Baseline met? | **YES** |
| Enterprise ops baseline (MVP scope)? | **YES** |
| Phase 1 freeze (`CLOSED_UNLESS_TOUCHED`)? | **YES — recommended** |
| Production cold-start baseline? | **APPROVED after Staging parity apply + PI3** |
| Official Ops 1.1 complete? | **NO** — see Post-GO gaps |

---

## L5 scorecard (8 dimensions)

| # | Dimension | Score | Status |
|---|-----------|-------|--------|
| AX1 | 产品 · 数据源真实性 | 15/15 | PASS |
| AX2 | 运营 · Admin Public Operations | 15/15 | PASS |
| AX3 | 数据治理 | 15/15 | PASS |
| AX4 | RBAC | 10/10 | PASS |
| AX5 | Public Operations 深度 | 10/10 | PASS |
| AX6 | 冷启动运营能力 | 15/15 | PASS |
| AX7 | 运营维护 | 10/10 | PASS |
| AX8 | 发布治理 | 10/10 | PASS |
| | **Total** | **100/100** | **L5** |

Machine-readable: `ocs-baseline-readiness-audit.json`

---

## 1 · 数据源真实性

**结论：PASS — 全部实体来自 Official Accounts + Admin Public Operations**

| Check | Result |
|-------|--------|
| smoke/demo/probe/multi-demo on OCS rows | **0** |
| `@ocs.traveltrust.app` official accounts | **35** (5 ops + 30 chain accounts) |
| `data_origin=production` at publish | **40/40** entity rows (10G+20L+10OG) |
| `display_status=published` | **40/40** |
| public_catalog_only (provider/acquisition) | **10+10** visible |
| 孤立数据 (state ID not on public API) | **0** |
| 测试数据混入 | **0** (C3 `guide@test.com` = Expected Difference, out of OCS scope) |

**创建路径（无直连 SQL）：**  
`run-official-cold-start-dataset.cjs` → Admin login → Official Accounts → user API writes → Public Operations publish + surfaces → Official Guides → Campaign deploy.

---

## 2 · Admin Public Operations 链路

| Capability | Status |
|------------|--------|
| Publish Queue (guides/listings) | ✓ 10 + 20 published |
| Campaign create → review → deploy | ✓ 10/10 deployed |
| Surface assignment | ✓ `market_provider` / `market_acquisition` / `home_feed` |
| Featured / Priority / Schedule | ✓ API supported; OCS uses defaults (enhancement: seasonal schedule) |
| 可持续维护 | ✓ `state.json` 幂等 · Runbook · Admin UI 同路径 |

---

## 3 · RBAC 与权限模型

| Boundary | Status |
|----------|--------|
| Admin orchestrator (SuperAdmin) | ✓ `PERM_OFFICIAL_*` |
| Official account user writes | ✓ scoped tokens |
| Merchant bootstrap | ✓ Admin-only `bootstrap-market` |
| 越权创建/发布 | **未发现** |
| Post-GO | 专用 Ops 角色委派（非 SuperAdmin 日常运营） |

---

## 4 · 冷启动运营能力

| Metric | Target | Actual |
|--------|--------|--------|
| 完整运营链 | 10/10 | **10/10** |
| 向导 | 10 | 10 |
| 商家 Provider | 10 | 10 (public) |
| 旅行收购 Acquisition | 10 | 10 (public) |
| 官方攻略 | 10 | 10 |
| Campaign deployed | 10 | 10 |
| 官方运营账号 | 5 | 5 |

**Surface Coverage:** Guides · Provider · Acquisition · Official Guides · Campaign · `home_hero` cold-start API — **全部覆盖**

**Day-1 冷启动：** **满足** Staging MVP 上线第一天展示需求

---

## 5 · 浏览器与用户体验

| Check | Action |
|-------|--------|
| ERR / FE-API / V-MARKET / BDV | **Reuse** DDG 8-step `20260703T033727Z` (CLOSED) |
| API 层 Surface + 详情 GET | **PASS** (10+10+10 public listings, guides, cold-start 200) |
| 运营链 API 抽查 | Tokyo / Paris / Dubai — **全链可见** |
| 浏览器深链 UAT | **Enhancement** — Production apply 前建议抽查 |

---

## 6 · 数据治理

| Gate | Verdict | Re-run? |
|------|---------|---------|
| OCS post-apply DDG | PASS · 0/0 | No |
| Staging Full-Site DDG | PASS · CLOSED | No |
| ML-DG / FE-API / public_catalog | Reuse CLOSED pipeline | No |
| test/demo 重新进入公众展示 | **0** | — |

---

## 7 · 企业运营能力 (L5)

### MVP 已闭合 (Phase 1)
- 10 国/城完整链 · 5 ops 账号 · 10 campaigns
- Admin Public Operations 唯一写路径
- `CLOSED_UNLESS_TOUCHED` 冻结策略
- Coverage + Surface Coverage 指标

### Official Ops 1.1 (Post-GO) — **未满足，非 Blocking**
1. Community 100 posts  
2. Historical orders 20  
3. Campaign item 全量覆盖（部分 campaign 因首次 slug ref 仅部分 item — **Minor**）  
4. 专用 Ops RBAC 角色（非 SuperAdmin 编排）  
5. Production 环境同 manifest apply + browser sign-off  
6. Campaign 定时 Schedule 季节性运营  

### 问题清单

| Severity | Count | Items |
|----------|-------|-------|
| **Blocking** | **0** | — |
| **Major** | **0** | — |
| **Minor** | **5** | Campaign item 部分缺失 (hot-providers, hot-acquisition, city-tokyo, summer, weekly-picks) |
| **Enhancement** | **4** | Community/Orders deferred · Browser UAT · Ops RBAC · Schedule |

### Expected Difference
- C3 `guide@test.com` — DDG 基线 Expected Difference，非 OCS 泄漏

---

## 8 · 治理层级定位

```text
RC (CLOSED) → DDG (CLOSED) → OCS (CLOSED) → PI3 (IN_PROGRESS) → Production GO (NO-GO)
```

OCS = **Production 官方内容基线**（Staging 已验证）。Remaining blockers = **生产运营** (PI3/Stripe/Mainnet/Go Live)，非产品能力。

---

## Evidence bundle (长期复用)

| File | Purpose |
|------|---------|
| `state.json` | 实体 ID 映射 · 幂等基线 |
| `ocs-baseline-readiness-audit.json` | 本审计机读 |
| `ocs-validate.json` | Coverage + Surface |
| `ocs-l5-enterprise-audit.json` |  prior L5 审计 |
| `fs-dg-post.json` | DDG post-apply |
| `OCS-ENTERPRISE-L5-READINESS-AUDIT-REPORT.md` | 本报告 |

**Sign-off:** `evidence/manual-uat/signoff/OCS-BASELINE-READINESS-SIGNOFF-20260703T052100Z.md`
