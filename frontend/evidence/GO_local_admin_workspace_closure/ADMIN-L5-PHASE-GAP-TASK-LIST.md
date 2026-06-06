# Admin 工作台 · 阶段缺口任务清单（①②③ + 收口）

**阶段口径：** **① 本地** → **② 测试网/持久 Staging** → **③ 公网/生产**

**关联 SSOT：** [`ADMIN-L5-AUDIT-TASKS.md`](ADMIN-L5-AUDIT-TASKS.md) · [`ADMIN-L5-FULL-AUDIT-BACKLOG.md`](ADMIN-L5-FULL-AUDIT-BACKLOG.md) · [`frontend/app/admin/README.md`](../../app/admin/README.md)

**机读验收（①）：** `bash scripts/dev/run-admin-l5-green.sh` 或 `node scripts/dev/run-admin-l5-green.mjs`

**最后更新：** 2026-06-05（ADM-P0-01～P1-10 清零 · TT-ADMIN-PHASE1-FULL-CLOSURE · Spec 70 §3.0.2 对拍）

---

## 总表

| 项 | 结论 |
|----|------|
| **① 有没有收口** | **是** — **P0=0 · P1=0** · L5 绿集 · M-01～M-03 · [`TT-ADMIN-PHASE1-FULL-CLOSURE.md`](TT-ADMIN-PHASE1-FULL-CLOSURE.md) |
| **② 有没有收口** | **否 · Not Started** — 须 G-1/G-2 + `record-phase2-admin-adm-u01-then-u02.sh` |
| **③ 有没有收口** | **否** — 生产 2FA / 真 PSP / 主网审计单独闸 |

---

## ① 本地 · 任务（代码 + 机读）

| ID | 清单项 | 状态 | 验收 |
|----|--------|------|------|
| **P1-ADM-CONF-01** | Admin L5 Confirm 基础设施 + 17 处危险写 | ✅ 完成 | `adminL5ConfirmL5.contract.test.ts` |
| **P1-ADM-CONF-02** | 权限中心 TOTP enroll / clear session + 2FA 策略 PATCH | ✅ 完成（2026-06-05） | 同上 + `AdminPermissionsTotpPanel` |
| **P1-ADM-SWR-01** | 入驻队列 SWR：`provider-applications` · `steward-applications` | ✅ 完成（2026-06-05） | `adminNavPerfL5` **41** list scopes |
| **P1-ADM-AUD-01** | 关键写路由 `write_admin_audit_log_best_effort` 机读闸（8 文件） | ✅ 完成 | `adminAuditLogWriteL5.contract.test.ts` |
| **P1-ADM-CACHE-01** | 收购 suspend → `user-detail` 缓存失效 | ✅ 完成 | Card + Modal |
| **P1-ADM-CACHE-02** | 权益 revoke → `onboarding-entitlement-detail` 缓存失效 | ✅ 完成（2026-06-05） | hook |
| **P1-ADM-SWR-02** | 41+2 列表 + 11 详情 SWR | ✅ 完成 | `adminNavPerfL5` |
| **P1-ADM-SOV-01** | 系统概况 memory/pg 标签诚实 | ✅ 完成（2026-06-05） | [`ADMIN-L5-HOME-SYSTEM-OVERVIEW-CODE-SSOT.md`](ADMIN-L5-HOME-SYSTEM-OVERVIEW-CODE-SSOT.md) |
| **P1-ADM-SOV-02** | 趋势图 HTML 合法 + 字号 `text-small` | ✅ 完成 | 同上 |
| **P1-ADM-SOV-03** | 控制台角色标题/求和 + 链 ID 人话化 | ✅ 完成 | 同上 |
| **P1-ADM-SOV-04** | 聚焦待办：折叠 + 隐藏趋势 + 去重 78 强调 | ✅ 完成 | 同上 |
| **P1-ADM-SOV-05** | 概况 90s 会话缓存 + auth 失效 | ✅ 完成 | 同上 |
| **M-03** | **手跑** Admin 页面包面烟测 | ✅ 完成（2026-06-05） | `bash scripts/dev/smoke-admin-pages-local.sh` exit 0 |
| **M-01** | **手跑** RBAC 矩阵烟测 | ✅ 完成（2026-06-05） | `bash scripts/dev/smoke-admin-rbac-matrix-local.sh` exit 0 |
| **M-02** | **手跑** ADM-U02 本地烟测 | ✅ 完成（2026-06-05） | `bash scripts/dev/smoke-admin-adm-u02-local.sh` · `TT_ADM_U02_LOCAL: PASS` |
| **P1-ADM-AUD-02** | 审计合约扩至入驻审核 PATCH（provider/steward） | ✅ 完成（2026-06-05） | `adminAuditLogWriteL5` · 10 文件 |
| **ADM-P0-01～P1-10** | 企业审计 P0/P1 清零（安全/RBAC/Cache/Auth/i18n/a11y/Audit） | ✅ 完成（2026-06-05） | [`TT-ADMIN-PHASE1-FULL-CLOSURE.md`](TT-ADMIN-PHASE1-FULL-CLOSURE.md) · `adminPhase1FullClosureL5` |
| **P1-ADM-CONF-03** | Publish 模态 + L5 Confirm 合并为单步（UX） | ❌ 未完成 · **① 可选** | 产品决策 |

**① 收口结论：** 企业审计 **P0=0 · P1=0** · 八项运营清单 + L5 绿集 + M-01～M-03 smoke（2026-06-05）。**Phase ② 入口：** G-1/G-2 清零后见 [`TT-ADMIN-PHASE1-FULL-CLOSURE.md`](TT-ADMIN-PHASE1-FULL-CLOSURE.md) §②。

---

## ② 测试网 / 持久 Staging · 任务

| ID | 清单项 | 状态 | 入口 / 验收 |
|----|--------|------|-------------|
| **ADM-UX-IA-06** | 六角色 Console 视角（非仅 env override） | ❌ | 顶栏快切 ① 已预备；② 须持久 DB + Staging |
| **ADM-UX-ONB-04** | 准入费 / Stripe **真** webhook 状态回显 | ❌ | ① `stripe_echo` 占位；② Stripe test mode |
| **ADM-UX-RBAC-05** | Staging 六角色 Shell **Playwright** 矩阵 | ❌ | `record-phase2-admin-adm-u01-then-u02.sh` |
| **ADM-UX-FIN-02** | 财务七件套 **页内深度**（非枢纽链接） | ❌ | spec 70 / finance partial 工作台 |
| **ADM-UX-CI-02** | `record-phase2-admin-adm-u01-then-u02` 持久证据 | ❌ | 末行 `TT_PHASE2_ADMIN_STAGING: PASS` |
| **ADM-U01** | staging 六角色 RBAC + Shell PW + `release_gate=GO` | ❌ | `ADM_U01_REQUIRE_PERSISTENT_HOST=1` |
| **ADM-U02** | Staging 2FA/TOTP + 审批链 + 审计 | ❌ | Step 2 of U01→U02 编排 |
| **P2-ADM-SMOKE-01** | 持久 ② 编排 + merge + validate | ❌ | `validate-phase2-admin-staging-closure.sh` |
| **G-1 / G-2** | Phase ② 开工总闸 | ❌ | [`PHASE2-START-CHECKLIST.md`](../../../docs/runbook/PHASE2-START-CHECKLIST.md) |

**② 禁止：** 用 ① 绿集 / tunnel 预演 / 本地 override 冒充 **② GO**。

---

## ③ 公网 / 生产 · 任务

| ID | 清单项 | 状态 | 入口 / 验收 |
|----|--------|------|-------------|
| **ADM-UX-RBAC-06** | 生产 **2FA 强制** + 无 `ROLE_DIRECT` | ❌ | `AdminPermissionsProductionSafetyPanel` + go-live |
| **ADM-G01–G13** | 财务七件套 / DSAR 全流程 / 导出签名（spec 70/500） | ❌ | spec + `check-admin-production-go-prep.sh` |
| **P3-ADM-GO-01** | Production GO + 真 PSP / 主网审计 | ❌ | [`go-live-checklist.md`](../../../docs/go-live-checklist.md) |
| **P1-ADM-AUD-03** | 审计 **持久化 SLA**（非 best_effort） | ❌ | ③ 合规 / DB 留存证明 |

---

## 其它收口需要（Admin 域外或横切 · ① 证据）

| ID | 项 | 阶段 | 说明 |
|----|-----|------|------|
| **X-01** | Phase ① 全站 G-0 留痕 | ① | `bash scripts/dev/record-go-local-phase1-acceptance-log.sh` → `TT_GO_LOCAL_PHASE1: OK` |
| **X-02** | Admin + Web3 四页联合绿集 | ① | `bash scripts/dev/run-admin-web3-l5-green.sh` |
| **X-03** | 企业站点 10 矩阵（可选广覆盖） | ① | `record-enterprise-site-10-acceptance-log.sh` + `P3_CHAIN_OFF=1` |
| **X-04** | API 本地 capabilities 探针 | ① 运维 | `bash scripts/dev/check-admin-capabilities-route.sh` → 401 |
| **X-05** | 产品动线：商家/主理人 **页内处置**（非仅链用户详情） | ② / 产品 | 若要做 inline approve → 审批流 + UI 单独立项 |
| **X-06** | 订单/争议 Admin **写处置** | ② / ③ | 当前只读查阅；链上/业务流在 escrow/链域 |
| **X-07** | `adminPhase1BacklogClosureL5` 六行 ❌ 保持 | — | 仅 **②/③** 六项，勿在 ① 误标完成 |
| **X-08** | Phase ② 仓库态 | — | [`PHASE2-REPOSITORY-STATUS.md`](../../../docs/runbook/PHASE2-REPOSITORY-STATUS.md) G-1/G-2 |

---

## 一句话结论

**① Admin 工作台代码与 L5 机读已收口**；**M-01～M-03 手跑 smoke 已 exit 0**（2026-06-05）。**②③ 共 10+ 项** 已录入上表，**不得跳阶**。全站 **Production GO** 另见根 README / TT-9618 / go-live。
