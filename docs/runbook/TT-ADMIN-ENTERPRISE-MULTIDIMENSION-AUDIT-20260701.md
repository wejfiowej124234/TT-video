# TravelTrust 管理员后台 · 企业级多维审计报告

**审计日期：** 2026-07-01  
**审计范围：** Admin UI/UX · 平台域 IA · ① 本地 vs ② 测试网一致性 · RBAC/测试账号 · Official Ops 1.0 · Content Center · 运营地图  
**审计性质：** 只读收敛审计 · **不重开** Configuration/PER · **不**新增功能 · **不**改业务逻辑  
**分类真源：** [`TT-ALIGNMENT-AUDIT-EXPECTED-DIFFERENCE-POLICY.md`](TT-ALIGNMENT-AUDIT-EXPECTED-DIFFERENCE-POLICY.md)

**机读摘要：** [`registry/admin-platform-production-readiness.v1.yaml`](../../registry/admin-platform-production-readiness.v1.yaml)

---

## 0 · 执行摘要

| 维度 | 裁定 | 评分 |
|------|------|------|
| **Admin 架构 / 平台域** | Official Ops 1.0 + Content Center 双平面 **已冻结对齐** | **10/10** |
| **UI/UX · 侧栏 IA** | 10 Shell 组 SSOT 落地；P1 导航漂移 **已修**；L5 视觉债 **非阻断** | **9.5/10** |
| **① 本地 ↔ ② 测试网** | 同仓代码 · 预期环境差已登记 · **无结构性 Drift** | **10/10** |
| **RBAC · 测试账号边界** | ADM-U01 **GO**（102/102 API · 54/54 Shell）；C2 Banner **已加** | **9.8/10** |
| **Production Readiness（Admin 轨）** | **STABLE** · Convergence **CLOSED** · PI3 属 Production Engineering | **阻断 Production GO：否** |

**一句话：** 管理员后台 **STABLE · DEV_FROZEN** — 仅 Bug/安全/运维；全站 GO 阻断仅剩 **PI3-001～006**（非后台功能）。

```text
TT_ADMIN_ENTERPRISE_AUDIT: CLOSED
ADM_U01_STAGING_RBAC: GO
TT_ADMIN_OPERATOR_MAP_SSOT: ACTIVE
OFFICIAL_OPS_1_0: STABLE_FROZEN
ADM_U02_STAGING: GO
TT_ADMIN_PLATFORM_STATUS: STABLE
TT_ADMIN_PLATFORM_DEV_FROZEN: true
TT_ADMIN_PLATFORM_ONLY_BUGFIX: true
```

---

## 1 · 审计范围与 SSOT

| 层级 | 真源 |
|------|------|
| Admin 壳 / L5 | `frontend/app/admin/README.md` · `docs/spec/70-管理员系统开发文档.md` |
| 侧栏 IA | `frontend/lib/admin/adminShellSidebarModel.ts` · `adminShell*NavLinks.ts` |
| RBAC | `crates/api/src/routes/admin/admin_rbac.rs` · `registry/admin-rbac-*.v1.yaml` |
| Official Ops 1.0 | `docs/runbook/TT-OFFICIAL-OPS-CAPABILITY-MATRIX.md` · `registry/official-ops-domain.v1.yaml` |
| 运营地图 | `docs/runbook/TT-ADMIN-OPERATOR-MAP-SSOT.md`（91 路由 · Source→Target→Owner） |
| ①↔② 分类 | `docs/runbook/TT-ALIGNMENT-AUDIT-EXPECTED-DIFFERENCE-POLICY.md` |
| ② RBAC 证据 | `evidence/GO_staging_admin_rbac_matrix/latest/report.json` |

### 产品 8 域 → 实现 10 Shell 组（Expected Difference · 映射）

| 产品域 | Shell 落点 |
|--------|-----------|
| Core Admin | `workspace` + `onboarding` + `operations` |
| Content Center | `content` |
| Official Ops 1.0 | `official_ops` |
| Governance | `governance` |
| Community | `community` |
| Market/Acquisition | `operations` + `official_ops` + `growth` |
| Growth | `growth` |
| System/Ops | `finance` + `more` + 系统概况 |

---

## 2 · 支柱一：UI/UX · 平台域 IA

### 2.1 通过项

- **侧栏 SSOT：** 10 组 · 91 链接 · 与 `ADM_U01_SHELL_GROUP_VISIBILITY` 同源
- **Official Ops 1.0 冻结树：** Hub · Accounts · Templates · Guides · Cold Start · Public Operations（MVP Statistics）
- **Content Center：** 17 子路由已挂载（countries/cities/pois/poi-images/…）
- **权限横幅：** Official Ops 全子面 `AdminOpsPlanePermissionBanners`
- **L5 机读：** `run-admin-l5-green.sh` · 危险写 L5 confirm · SWR 列表缓存
- **C2 开发捷径 Banner：** `AdminBusinessSuperAdminShortcutBanner` · `Development Shortcut · Business Account · Not ADM-U01`

### 2.2 已修复（2026-07-01）

| ID | 类 | 项 | 状态 |
|----|-----|-----|------|
| AUD-IA-01 | Drift | `conversion-analytics` 双入口（growth + more） | **已修** — 仅 growth |
| AUD-IA-02 | Drift | `/admin/alerts` 侧栏 finance vs 面包屑 more | **已修** — 统一 finance |
| AUD-IA-03 | Conflict | 104 缺口报告与代码脱节 | **已归档 SUPERSEDED** |

### 2.3 未闭 / Post-GO（P2 · 非阻断）

| ID | 类 | 项 | 优先级 | 说明 |
|----|-----|-----|--------|------|
| AUD-UX-01 | Defect | Landing Ambient / Media Assets Admin **只读表** vs API PATCH | P2 | Content Center 1.1 |
| AUD-UX-02 | Defect | Content 子面深度不均（countries 全工作流 vs cities 偏列表） | P2 | 1.1 对齐 |
| AUD-UX-03 | Drift | Content 页未统一 `AdminOpsPlanePermissionBanners` | P2 | UX 一致性 |
| AUD-UX-04 | Risk | L5 截图审计 Vis-P0–P2 backlog | P2 | 机读仍绿 · `ADMIN-L5-HOME-SCREENSHOT-AUDIT-20260604.md` |
| AUD-UX-05 | Defect | `admin.fee_router.read` 后端有 · FE `ADMIN_PERM` 无 | P2 | 三处 sync 或文档标注 backend-only |

---

## 3 · 支柱二：① 本地 vs ② 测试网一致性

### 3.1 代码层 — **一致（无 Drift）**

| 维度 | ① vs ② |
|------|--------|
| 路由 `/admin/*` | 同仓同构建 |
| Admin API / RBAC 定义 | `admin_rbac.rs` + registry 三处 sync |
| Feature Flags 定义 | 同代码；**值**可环境不同 |
| Official Ops / Content 页面 | 同树 |

### 3.2 Expected Difference（设计如此 · **禁止修成一致**）

| 项 | ① 本地 | ② 测试网 |
|----|--------|----------|
| Chain ID | `31337` / `1337` | `11155111` |
| Database | memory 可选 / 本地 PG | Fly Postgres |
| `NEXT_PUBLIC_CATALOG_API_ENABLED` | 默认 `0`（TS catalog） | C-S6 opt-in `1` |
| Market showcase / dev variety | ① 允许 | Staging/Prod 关闭 |
| Admin 证据闸 | `smoke-admin-rbac-matrix-local.sh`（窄） | ADM-U01 全矩阵 |
| FE/API Host | `127.0.0.1` | `tt-*-staging.fly.dev` |

### 3.3 真实 Drift — **当前无 OPEN 结构性 Drift**

历史 Drift（导航/104/证据路径）已在 2026-07-01 收口。Playwright 证据须使用 **绝对路径** `EVID`（`record-adm-u01-staging-evidence.sh` 已用 `$REPO_ROOT/...`）。

### 3.4 ② 验证证据（ADM-U01）

| 工件 | 值 |
|------|-----|
| **run_id** | `run_20260701T092450Z` |
| **latest** | `evidence/GO_staging_admin_rbac_matrix/latest/` |
| **release_gate** | **GO** |
| **API** | **102/102** · `deployment_kind: persistent_host` |
| **Playwright Shell** | **54/54**（6 角色 × 9 Shell 组） |
| **Sign-off** | `evidence/manual-uat/signoff/ADM-U01-STAGING-RBAC-SIGNOFF-20260701.md` |

---

## 4 · 支柱三：RBAC · 测试账号边界

### 4.1 身份分离（设计）

| 平面 | 验收对象 | 禁止 |
|------|----------|------|
| **Business Personas** | C1–E2 · 五主站联调 | 冒充 Admin RBAC GO |
| **Admin Console Personas** | 六角色 × Permission Matrix | 固定 `ops@test.com` 种子 |
| **C2 捷径** | `tourist@test.com` + seed 6b2 → super_admin | 冒充 ADM-U01 |
| **ADM-U01** | `adm-u01-*@traveltrust.staging` ephemeral | 写入 Business 矩阵 |

### 4.2 状态

| 项 | 状态 |
|----|------|
| ADM-U01 六角色 API deny/pass | **GO** |
| ADM-U01 Shell 可见性 | **GO**（54/54） |
| C2 UI 标注 | **DONE** |
| ① 本地窄 smoke | Super+CS 子集 · **非** ② GO |
| ADM-U02（权限变更审批 / 2FA） | **GO** · `run_20260701T100804Z` |

---

## 5 · 支柱四：Official Ops 1.0 · Content Center

### Official Ops 1.0（**STABLE · ARCHITECTURE FROZEN**）

| 模块 | 路由 | MVP 状态 |
|------|------|----------|
| Hub | `/admin/official` | 冻结 |
| Official Accounts | `…/accounts` | 冻结 |
| Templates | `…/itinerary-templates` | 冻结 |
| Official Guides | `…/guides` + `data_origin` | 冻结 |
| Cold Start | `…/cold-start` | 冻结 |
| Public Operations | `…/public-operations` | **Statistics only** · Phase 2+ **DEFERRED** |

**Expected Difference：** Publish/Featured/Priority/Surface 控制台未做 = **冻结纪律**，非 Defect。

### Content Center（~92% · 1.0 冻结内）

- **完整：** countries · poi-images · publish-queue · catalog-dashboard 等
- **Partial：** landing-ambient · media-assets **API 有写 · Admin UI 只读**

---

## 6 · 发现清单（全表）

| ID | 分类 | P | 标题 | 状态 |
|----|------|---|------|------|
| ADM-P0-01 | Risk→**CLOSED** | P0 | ADM-U01 ② 证据链 | **GO** |
| ADM-P0-02 | Defect→**CLOSED** | P0 | C2 Business/Admin UI 未标注 | **Banner 已加** |
| ADM-P0-03 | Risk | P0 | 运营地图 Source→Target→Owner | **SSOT 已建** |
| ADM-P1-01 | Conflict→**CLOSED** | P1 | 104 文档过期 | **ARCHIVED** |
| ADM-P1-02 | Drift→**CLOSED** | P1 | conversion-analytics 重复 | **已修** |
| ADM-P1-03 | Drift→**CLOSED** | P1 | Alerts 上下文漂移 | **已修** |
| ADM-P1-04 | Conflict | P1 | 产品 8 域 vs Shell 10 组叙述 | **Expected** · 建议 70 补映射表 |
| ADM-P2-01 | Defect | P2 | Content Landing/Media 写 UI | Post-GO 1.1 |
| ADM-P2-02 | Defect | P2 | Content cities/POI 工作流深度 | Post-GO 1.1 |
| ADM-P2-03 | Drift | P2 | Content 权限横幅不一致 | Post-GO |
| ADM-P2-04 | Risk | P2 | L5 视觉 Vis backlog | 非阻断 |
| ADM-P2-05 | Defect | P2 | fee_router FE perm 未登记 | 文档或 sync |
| ADM-RISK-01 | Risk→**CLOSED** | P1 | ADM-U02 ② 未验 | **GO** · `run_20260701T100804Z` |
| ADM-RISK-02 | Risk | P2 | Playwright Fly `ERR_CONNECTION_CLOSED` 偶发 | 已加 retry=6 · 证据路径绝对化 |
| ADM-EXP-01 | Expected | — | 链 ID / Catalog 切流 / DB | 不修 |
| ADM-EXP-02 | Expected | — | Public Ops Phase 2–4 未做 | 不修 |
| ADM-EXP-03 | Expected | — | 侧栏 RBAC advisory · API 真边界 | 设计 |

---

## 7 · Production Readiness 裁定（Admin 子轨）

| 闸门 | Admin 轨状态 | 全站 Production GO |
|------|-------------|-------------------|
| ADM-U01 六角色 RBAC | **PASS** | 必要非充分 |
| Admin 架构冻结 | **PASS** | — |
| Operator Map | **PASS** | — |
| ADM-U02 | **PASS** | ② 已闭 |
| PI3-001～006 | **OPEN** | **阻断** |
| `PHASE3_PRODUCTION_GO` | — | **NO_GO** |

**Admin 子轨可宣称：** ② **Admin RBAC Matrix Verified**（`TT_ADMIN_STAGING_GO_CLAIM` 上游依赖之一，另须 P0 runtime RBAC bypass 等父闸）。

---

## 8 · 验证命令

```bash
# ② ADM-U01 全量复跑
ADM_U01_STRICT=1 ADM_U01_REQUIRE_PERSISTENT_HOST=1 \
  STAGING_FE_BASE=https://tt-web-staging.fly.dev \
  bash scripts/dev/record-adm-u01-staging-evidence.sh

# 证据快查
python -c "import json; r=json.load(open('evidence/GO_staging_admin_rbac_matrix/latest/report.json')); print(r['release_gate'], r.get('playwright_shell_summary'))"

# ① 窄 RBAC（非 ② GO）
bash scripts/dev/smoke-admin-rbac-matrix-local.sh

# Official Ops 冻结闸
bash scripts/gates/check-official-ops-public-operations-ssot.sh

# Admin L5 机读
bash scripts/dev/run-admin-l5-green.sh

# IA 漂移快查
rg "conversion-analytics" frontend/lib/admin/adminShell*NavLinks.ts
rg 'prefix: "/admin/alerts"' frontend/lib/admin/adminShellContextForPath.ts
```

---

## 9 · 证据路径索引

| 用途 | 路径 |
|------|------|
| ADM-U01 latest | `evidence/GO_staging_admin_rbac_matrix/latest/` |
| ADM-U01 run | `evidence/GO_staging_admin_rbac_matrix/run_20260701T092450Z/` |
| Sign-off | `evidence/manual-uat/signoff/ADM-U01-STAGING-RBAC-SIGNOFF-20260701.md` |
| 运营地图 | `docs/runbook/TT-ADMIN-OPERATOR-MAP-SSOT.md` |
| 收口审计 | `docs/runbook/TT-ADMIN-PLATFORM-AUDIT-20260701.md` |
| Registry | `registry/admin-platform-production-readiness.v1.yaml` |
| C2 Banner | `frontend/components/admin/AdminBusinessSuperAdminShortcutBanner.tsx` |
| L5 视觉 backlog | `frontend/evidence/GO_local_admin_workspace_closure/ADMIN-L5-HOME-SCREENSHOT-AUDIT-20260604.md` |

---

## 10 · 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2026-07-01 | 首版企业级多维审计 · 含 ADM-U01 GO 收口与运营地图 |
