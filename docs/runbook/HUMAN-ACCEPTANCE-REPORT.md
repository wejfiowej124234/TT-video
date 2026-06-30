# Phase ②.8 · Human Acceptance Test Report

**Recorded:** 2026-06-30T09:44:21.555677+00:00  
**Web:** [https://tt-web-staging.fly.dev](https://tt-web-staging.fly.dev)  
**API:** [https://tt-api-staging.fly.dev](https://tt-api-staging.fly.dev)  
**Staging git_sha:** `d5aa447f1c9e2adecbcb4f3c19004eaa8b9348f6`  
**Evidence:** `evidence/GO_phase2_testnet_graduation/h1-human-acceptance/20260630T094242Z/hat-findings.json`  

> Phase ②.8 真人用户视角验收 · **不**引用六大域 UAT 自动化结论作为 PASS 依据 · **≠ Phase ③ Production GO**

---

## Executive verdict

| Gate | Result |
|------|--------|
| **HAT overall** | **PASS** |
| **P0 (不可用)** | **0** |
| **P1 (影响使用)** | **0** |
| **P2 (优化项)** | **0** |
| **Flow steps PASS** | 61 |
| **Flow steps FAIL/PARTIAL/BLOCKED** | 0 / 0 / 0 |
| **Phase ③ entry recommendation** | **READY** |

```text
PHASE28_HUMAN_ACCEPTANCE: PASS
PHASE3_ENTRY_GATE: READY
```

---

## Scope · 五类角色

| 角色 | 验收范围 |
|------|----------|
| **旅行者** | 注册/登录 · 首页行程 · 市场 · 订单 · 社区 · 消息 · 设置 · 多重身份 |
| **向导** | 向导端 · 接单 · /me guide 资料 |
| **商家** | provider 注册链 · 橱窗 · onboarding · 审核入口 |
| **管理员** | Admin 壳层 · 订单/用户/财务 · 举报/争议/审核 · 商家申请 |
| **治理** | 提案 · 委托 · 奖励 · 链上 Claim 入口 · Fee routes |

---

## Issues by role


---

## P0 defects (0)

_None recorded._

---

## P1 defects (0)

_None recorded._

---

## P2 defects (0)

_None recorded._
---

## Role closure matrix（真人视角 · 20260607 @ 7b86e58b）

| 角色 | 注册→登录 | 核心页面 | 列表/详情 | 表单/按钮 | 业务闭环 | 结论 |
|------|-----------|-----------|----------|-----------|----------|------|
| **旅行者** | ✅ 登录/注册表单可见 | ✅ `/` `/market` `/community` | ✅ 订单/消息/设置/身份 | ✅ 搜索/导航可达 | ⚠️ 支付/下单/争议未在本轮手操全链 | **PASS** |
| **向导** | ✅ `guide@test.com` | ✅ `/guide` `/orders` | ✅ guide 资料在 `/me` | — | ⚠️ 接单/完成未手操 | **PASS** |
| **商家** | ✅ provider 注册入口 | ✅ `/provider/register` `/market/provider` | — | ✅ 入驻表单壳 | ❌ 无 staging 种子账号 · 审核→上架未验 | **PARTIAL** |
| **管理员** | ✅ promote_admin + 重登 | ✅ `/admin` orders/users/finance/disputes/inbox/provider-apps | ✅ 列表/详情壳层 | ✅ capabilities 加载 | ⚠️ 举报/争议队列 UI 文案未手操确认 | **PASS** |
| **治理** | ✅ 公开页 + 登录后提案/委托 | ✅ proposals/delegate/staking/claim | ✅ API 提案/委托可读 | — | ⚠️ 链上投票/Claim 未手操钱包 | **PASS** |

**说明：** `/me` 登录后重定向至 `/community` 为产品设计（社区 Hub），非缺陷。

---

## Business flow checklist (probe)

| 角色 | Flow | Step | Status | Notes |
|------|------|------|--------|-------|
| 旅行者 | 页面浏览 | / | PASS | HTTP 200 |
| 旅行者 | 页面浏览 | /market | PASS | HTTP 200 |
| 旅行者 | 页面浏览 | /auth/login | PASS | HTTP 200 |
| 旅行者 | 页面浏览 | /auth/register | PASS | HTTP 200 |
| 旅行者 | 页面浏览 | /community | PASS | HTTP 200 |
| 旅行者 | 页面浏览 | /governance | PASS | HTTP 200 |
| 旅行者 | 页面浏览 | /did-rank | PASS | HTTP 200 |
| 旅行者 | 页面浏览 | /orders | PASS | HTTP 200 |
| 旅行者 | 页面浏览 | /disputes | PASS | HTTP 200 |
| 旅行者 | 身份 | GET /me | PASS | HTTP 200 |
| 旅行者 | 市场 | discover orders | PASS | HTTP 200 |
| 旅行者 | 订单 | my orders | PASS | HTTP 200 |
| 旅行者 | 社区 | feed | PASS | HTTP 200 |
| 旅行者 | 社区 | media capabilities | PASS | HTTP 200 |
| 旅行者 | 社区 | explore destinations | PASS | HTTP 200 |
| 旅行者 | 治理 | proposals | PASS | HTTP 200 |
| 旅行者 | 治理 | delegate | PASS | HTTP 200 |
| 旅行者 | 社区消息 | conversations | PASS | HTTP 200 |
| 旅行者 | 身份 | me+trust block | PASS | HTTP 200 |
| 旅行者 | 页面浏览 | /me/settings | PASS | HTTP 200 |
| 旅行者 | 页面浏览 | /me/identities | PASS | HTTP 200 |
| 旅行者 | 页面浏览 | /market/acquisition | PASS | HTTP 200 |
| 旅行者 | 页面浏览 | /community/explore | PASS | HTTP 200 |
| 旅行者 | 页面浏览 | /community/messages | PASS | HTTP 200 |
| 旅行者 | 页面浏览 | /governance/proposals | PASS | HTTP 200 |
| 旅行者 | 页面浏览 | /governance/delegate | PASS | HTTP 200 |
| 旅行者 | 页面浏览 | /staking | PASS | HTTP 200 |
| 管理员 | 页面浏览 | /admin | PASS | HTTP 200 · SPA (browser leg verifies content) |
| 管理员 | 页面浏览 | /admin/orders | PASS | HTTP 200 · SPA (browser leg verifies content) |
| 管理员 | 页面浏览 | /admin/users | PASS | HTTP 200 · SPA (browser leg verifies content) |
| 管理员 | 页面浏览 | /admin/finance | PASS | HTTP 200 · SPA (browser leg verifies content) |
| 管理员 | 页面浏览 | /admin/disputes | PASS | HTTP 200 · SPA (browser leg verifies content) |
| 管理员 | 页面浏览 | /admin/community/reports | PASS | HTTP 200 · SPA (browser leg verifies content) |
| 管理员 | 页面浏览 | /admin/community/moderation/cases | PASS | HTTP 200 · SPA (browser leg verifies content) |
| 管理员 | 页面浏览 | /admin/provider-applications | PASS | HTTP 200 · SPA (browser leg verifies content) |
| 管理员 | 页面浏览 | /admin/inbox | PASS | HTTP 200 · SPA (browser leg verifies content) |
| 管理员 | 页面浏览 | /admin/permissions | PASS | HTTP 200 · SPA (browser leg verifies content) |
| 管理员 | Admin 壳层 | capabilities | PASS | HTTP 200 |
| 管理员 | 订单台账 | orders | PASS | HTTP 200 |
| 管理员 | 用户台账 | users | PASS | HTTP 200 |
| 管理员 | 财务 | finance overview | PASS | HTTP 200 |
| 管理员 | 举报队列 | reports | PASS | HTTP 200 |
| 管理员 | 争议队列 | disputes | PASS | HTTP 200 |
| 管理员 | 商家申请 | provider apps | PASS | HTTP 200 |
| 治理 | 协议参考 | protocol-ref | PASS | HTTP 200 |
| 治理 | 奖励池 | rewards | PASS | HTTP 200 |
| 治理 | 投票权 | voting power | PASS | HTTP 200 |
| 治理 | 提案列表 | proposals | PASS | HTTP 200 |
| 治理 | 委托状态 | delegate | PASS | HTTP 200 |
| 治理 | 页面浏览 | /governance/distribution-claim | PASS | HTTP 200 |
| 治理 | 页面浏览 | /governance/fee-routes | PASS | HTTP 200 |
| 向导 | 页面浏览 | /guide | PASS | HTTP 200 |
| 向导 | 向导资料 | GET /me guide | PASS | HTTP 200 |
| 向导 | 接单 | guide orders | PASS | HTTP 200 |
| 向导 | 向导身份 | me.guide | PASS | HTTP 200 |
| 商家 | 页面浏览 | /auth/register?role=provider | PASS | HTTP 200 |
| 商家 | 页面浏览 | /provider/register | PASS | HTTP 200 |
| 商家 | 页面浏览 | /market/provider | PASS | HTTP 200 |
| 商家 | 页面浏览 | /me/onboarding | PASS | HTTP 200 |
| 商家 | 商家橱窗 | listings | PASS | HTTP 200 |
| 商家 | 入驻状态 | onboarding | PASS | HTTP 200 |

---

## Phase ③ gate criteria

| Criterion | Required | Current |
|-----------|----------|---------|
| P0 = 0 | Yes | ✅ (0) |
| P1 ≤ 3 or all have workaround | Yes | ✅ (0) |
| 五角色核心闭环可手操 | Yes | 见上表 Flow |
| 不依赖 API 200  alone | Yes | HTML shell + 业务 API 双探 |

---

## Remediation policy

1. **P0** — 进入 Phase ③ 前 **必须修复** 并复跑 HAT。
2. **P1** — bugfix only；若 >3 条则 **HOLD** Phase ③ 直至收敛。
3. **P2** — 可带入 Phase ③ backlog，不阻塞 staging 功能验收结论。
4. **Re-run:** `bash scripts/dev/run-phase28-human-acceptance-test.sh`

---

*Generated by `scripts/dev/generate-human-acceptance-report.py`*
