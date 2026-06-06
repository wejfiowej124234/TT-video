# Admin 工作台 L5 审计任务清单（①）

**阶段口径：** **① 本地** → **② 测试网** → **③ 公网/生产**

**代码 SSOT：** [`frontend/app/admin/README.md`](../../app/admin/README.md)

**阶段缺口总表（①②③ + 收口）：** [`ADMIN-L5-PHASE-GAP-TASK-LIST.md`](ADMIN-L5-PHASE-GAP-TASK-LIST.md)（2026-06-05）

## ① P1 续闭（2026-06-05 · 八项运营清单补遗）

| ID | 项 | 状态 |
|----|-----|------|
| **P1-ADM-CONF-01** | Admin L5 Confirm + 危险写 17 面 | **已闭** |
| **P1-ADM-CONF-02** | 权限 TOTP / 2FA 策略 L5 Confirm | **已闭** |
| **P1-ADM-SWR-01** | 商家/主理人入驻队列 SWR | **已闭** |
| **P1-ADM-AUD-01** | 审计写路由机读闸（抽样 8 文件） | **已闭** |
| **P1-ADM-CACHE-01/02** | 收购 suspend / 权益 revoke 详情缓存失效 | **已闭** |
| **P1-ADM-SOV-01～05** | 系统概况审计（标签诚实 · HTML · 角色/链 · 聚焦折叠 · 概况缓存） | **已闭**（2026-06-05） · [`ADMIN-L5-HOME-SYSTEM-OVERVIEW-CODE-SSOT.md`](../evidence/GO_local_admin_workspace_closure/ADMIN-L5-HOME-SYSTEM-OVERVIEW-CODE-SSOT.md) |

**① 手跑证据（非 vitest）：** M-01～M-03 **已跑 exit 0**（2026-06-05 · `TT_ADM_U02_LOCAL: PASS`）。

## ① P1 已闭（2026-06-03）

| ID | 项 | 状态 |
|----|-----|------|
| **P1-ADM-HOME-01** | `/admin` 入驻段 + 待办 Inbox + 业务文案 + dev API 折叠 | **已闭** |
| **P1-ADM-SHELL-01** | Shell ① 徽章 + 角色 chip + 入驻三链快捷导航 | **已闭** |
| **P1-ADM-NAV-01** | 顶栏用户菜单「管理后台」（admin/super_admin） | **已闭** |
| **P1-ADM-QUEUE-01** | 商家/主理人队列：`data-tt-admin-app-page` · URL `?status=` · `admin_required` 文案 | **已闭** |
| **P1-ADM-META-01** | `git_sha: unknown` → `data-tt-admin-build-git-unknown` 诚实披露 | **已闭** |
| **P1-ADM-HON-01** | `adminPhase1DataHonesty.contract.test.ts` + `run-admin-l5-green.sh` | **已闭** |
| **ADM-O01** | Inbox 重试 / 0 / 不可用态 + `{{count}}` 插值修复 | **已闭** |
| **ADM-O02** | 卡片 `data-tt-admin-card-tier` + 只读/高权限/占位徽章 | **已闭** |
| **ADM-O03** | Shell 分组导航（入驻/经营/资金/治理/更多） | **已闭** |
| **ADM-O04** | `superAdminOnly` 卡片对 `admin` 隐藏 | **已闭** |
| **ADM-O05** | `AdminHomeKpiStrip` 订单/争议轻量计数 | **已闭** |
| **ADM-O06** | `AdminLayoutSubpageNav` 全子树智能面包屑（缺则注入 · 不重复） | **已闭** |
| **ADM-L5-02** | 卡片 tier 与 API 写权限对拍（`write` / `super_write` / `adminHomeCardCapability`） | **已闭** |
| **ADM-L5-03** | Inbox 分通道 `errorKind` + `data-tt-admin-inbox-channel-error` | **已闭** |
| **ADM-L5-04** | `AdminActorCapabilityStrip` 二元 RBAC 诚实条 | **已闭** |
| **ADM-L5-05** | Shell 社区/资金扩展 + `/admin/onboarding` 枢纽 | **已闭** |
| **ADM-L5-06** | 收购门闸 + Onboarding 首页卡与 dev API 对照 | **已闭** |
| **ADM-R01** | `GET /api/v1/admin/capabilities` + `admin_rbac.rs` 权限包 | **已闭** |
| **ADM-R02** | `admin_onboarding::router()` 挂载（此前 API 未进 `admin::router`） | **已闭** |
| **ADM-R03** | `/admin/permissions` + `/admin/onboarding/*` 列表页 | **已闭** |
| **ADM-R04** | 写路由 `require_admin_permission`（审核/准入费 revoke） | **已闭** |
| **ADM-R05** | 扩展写权限：社区审核/收购 suspend/向导/信任增长/Flag 发布/准入费 PATCH | **已闭** |
| **ADM-R06** | `/admin/onboarding/entitlements/[id]` 详情 + revoke + metadata PATCH | **已闭** |
| **ADM-R07** | 订单/争议/Onboarding 列表读权限 · 社区评论/处罚写 · `mod.rs` super 与 RBAC 对齐 · Flags 发布 UI 门闸 | **已闭** |
| **ADM-R08** | **真路由** `mod.rs::router()` 内 handler 接 `require_admin_perm_uid`（此前子模块 RBAC 未挂载） | **已闭** |
| **ADM-P01** | 70 六角色能力包预备（`admin-rbac-v2-prep` · `console_role_70` · `role_matrix_preview`） | **已闭 · ① 预备** |
| **ADM-P02** | 权限中心：六角色预览 + ② 诚实横幅 + 能力条展示控制台角色 | **已闭 · ① 预备** |
| **ADM-P03** | DSAR 更新页 UI 门闸（`admin.approve` / super） | **已闭 · ① 预备** |
| **ADM-P04** | 本地 `TRAVELTRUST_ADMIN_CONSOLE_ROLE_OVERRIDE` 模拟六角色（非 ② GO） | **已闭 · ① 预备** |
| **ADM-P05** | `mod.rs` 真路由批量读权限 + 平台/社区/审批写权限（`patch-admin-mod-rbac-reads.py`） | **已闭 · ① 预备** |
| **ADM-P06** | 首页卡片按 capabilities 过滤（`adminHomeCardPermission`） | **已闭 · ① 预备** |
| **ADM-P07** | 写页 UI 门闸：策略发布 · 调度补跑 · 申诉/滥用策略/评论可见性 | **已闭 · ① 预备** |
| **ADM-P08** | 写页 UI 门闸扩展：Flags · 租户 scope · 信任增长 · 社区举报/处罚 · 审批横幅 · Onboarding 权益详情 | **已闭 · ① 预备** |

**① 验收：**

```bash
bash scripts/dev/run-admin-l5-green.sh
# 与 Web3 四页 ① 绿集一并：
bash scripts/dev/run-admin-web3-l5-green.sh
```

**① 已闭 — 勿再重复批量改代码**；剩余工作见下表 **②③**。

## ① 审计整改批次（2026-06-03 · capabilities / 全路由门闸）

| ID | 项 | 状态 |
|----|-----|------|
| **P0-ADM-CAP-01** | `GET /api/v1/admin/capabilities` Next Route Handler + dev 503 诊断（非假 404） | **已闭** |
| **P0-ADM-CAP-02** | `permissionsLoaded` / `capabilitiesUnavailable` — API 不可用时**不**误报「无 admin.approve」 | **已闭** |
| **P1-ADM-RBAC-01** | `AdminRoutePermissionBanner` + `adminRoutePermission.ts` 布局级门闸（~40 子页） | **已闭** |
| **P1-ADM-RBAC-02** | Shell 按 capabilities 隐藏无权限链（`AdminShellNavGroup`） | **已闭** |
| **P1-ADM-RBAC-03** | 首页/队列/经营/资金/合规等专页 `AdminPermissionDeniedBanner` + `useAdminCanWrite` | **已闭** |
| **P1-ADM-RBAC-04** | `adminMissingPages` + `adminRoutePermission*` contract · `run-admin-l5-green.sh` **17 files / 41 tests** | **已闭** |
| **P0-ADM-OPS-01** | 本地须重启 8080 API（`check-admin-capabilities-route.sh` → **401**） | **① 运维** · 非代码 |
| **P1-ADM-RBAC-05** | `/admin/disputes/:id` 门闸与 API 对齐（`admin.orders.read` · 非误用 `disputes.write`） | **已闭** |
| **P1-ADM-RBAC-06** | capabilities 503 诊断码不再 `console.error` 刷屏 | **已闭** |
| **P1-ADM-RBAC-07** | `adminAllRoutesPermission.contract` 全路由权限映射 · `smoke-admin-pages-local.sh` | **已闭** |

```bash
bash scripts/dev/check-admin-capabilities-route.sh   # 期望 HTTP 401
powershell -File scripts/dev/restart-api-local.ps1   # Windows 一键重启 API
```

## ① P2 预备已闭（2026-06-03 · 非 ②③ GO）

| ID | 项 | 状态 |
|----|-----|------|
| **ADM-U01-P** | `admin_console_roles` 落库 + `PUT …/console-role` + `GET …/rbac/route-matrix` + `smoke-admin-rbac-matrix-local.sh` | **已闭 · ① 预备** |
| **ADM-U02-P** | 权限中心指派 UI + `admin_2fa_policy` 存储（`enforced` 默认 false；TOTP 未接线） | **已闭 · ① 预备** |
| **ADM-U02-P2** | TOTP enroll/verify + 会话头 + `admin_2fa_required` 联闸（`TRAVELTRUST_ADMIN_2FA_SKIP`） | **已闭 · ① 预备** |
| **ADM-U02-P2-UI** | `/admin/permissions` TOTP 面板 + `admin2faSession` 写入 `writeRequestHeaders` | **已闭 · ① 预备** |
| **ADM-G-P** | `/admin/finance-suite` 七件套枢纽 + `/admin/compliance` DSAR 枢纽 | **已闭 · ① 预备** |
| **ADM-G-P2** | DSAR `export_signature` / `record_hash_fingerprint` 字段 + 更新表单 | **已闭 · ① 预备** |
| **P2-ADM-SMOKE-P** | `scripts/gates/smoke-admin-rbac-staging-matrix.sh` + `run-admin-rbac-staging-matrix.py` + `record-adm-u01-staging-evidence.sh` | **已闭 · ②  toolchain** |
| **P3-ADM-GO-P** | `scripts/gates/check-admin-production-go-prep.sh`（显式 NOT_MET） | **已闭 · ③ 预备** |

```bash
# ① RBAC 矩阵烟测（须 DATABASE_URL + migrate）
bash scripts/dev/smoke-admin-rbac-matrix-local.sh

# ① ADM-U02（须重启 traveltrust-api 后 phase2_prep 三键为 true）
bash scripts/dev/smoke-admin-adm-u02-local.sh
# Playwright: frontend/e2e/admin-adm-u02-permissions-local.spec.ts

# ② 持久 Fly Staging — 唯一合法顺序（见 PHASE2-ADMIN-STAGING runbook）
export STAGING_API_BASE=https://<fly-api>
export STAGING_FE_BASE=https://<fly-fe>
export STAGING_DATABASE_URL=postgresql://...
export ADM_U01_REQUIRE_PERSISTENT_HOST=1 ADM_U02_REQUIRE_PERSISTENT_HOST=1
bash scripts/dev/record-phase2-admin-adm-u01-then-u02.sh
# 须末行 TT_PHASE2_ADMIN_STAGING: PASS，然后：
bash scripts/gates/validate-phase2-admin-staging-closure.sh
# 仅 TT_PHASE2_ADMIN_STAGING_VALIDATE: PASS 后才可将下表 ADM-U01/U02 标为 ② 已绿
```

## Admin Phase ② 宣称闸

**允许标 ② 通过：** 仅当 `record-phase2-admin-adm-u01-then-u02.sh` 按 **U01 持久 RBAC → U02 Staging 2FA/审批 → merge** 全绿，且出现 **`TT_PHASE2_ADMIN_STAGING: PASS`**，且 `validate-phase2-admin-staging-closure.sh` → **`TT_PHASE2_ADMIN_STAGING_VALIDATE: PASS`**。

**禁止：** tunnel 预演、① 本地绿、单独 U01/U02 分项绿、无合并 `closure-report.json` GO。

## ②③ 正式验收（勿冒充 ① GO）

| ID | 项 | 阶段 |
|----|-----|------|
| **ADM-U01** | staging 六角色 RBAC + Shell PW + `release_gate=GO`；tunnel 预演见 `run_adm_u01_close_20260603`（**非** Fly ②） | **① 已绿** · **② 待** `ADM_U01_REQUIRE_PERSISTENT_HOST=1` + `record-phase2-admin-adm-u01-then-u02.sh` |
| **ADM-U02** | 2FA/TOTP + 审批链 + 审计；① `smoke-admin-adm-u02-local` + PW local | **✅ ① 已绿（2026-06-03）** · **② 待** 同 Staging 上 `record-adm-u02-staging-evidence.sh`（编排 Step 2） |
| **ADM-G01–G13** | 财务七件套 / DSAR 全流程字段与导出签名（spec 70/500） | **② / ③** |
| **P2-ADM-SMOKE-01** | 持久 ② 编排 + merge：`record-phase2-admin-adm-u01-then-u02.sh` → `TT_PHASE2_ADMIN_STAGING: PASS` → `validate-phase2-admin-staging-closure.sh` | **② · 未执行（Fly URL 未就绪）** |
| **P3-ADM-GO-01** | Production GO + 真 PSP / 主网审计 | **③** |
