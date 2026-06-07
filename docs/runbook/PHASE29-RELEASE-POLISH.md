# Phase ②.9 · Release Polish（UI/UX 收口）

**生效：** 2026-06-07  
**前置：** Phase ②.8 HAT **PASS**（`7b86e58b` @ staging）· Deep release gate **GO**  
**状态：** **UI_FROZEN · W3_DONE · post-29 gate chain NO_GO**  
**Phase ③ 入口：** **⏸ HOLD** — R4–R7 未全绿（S5/G04 阻塞）

> **纪律：** 本轮 **仅** 低风险 **UI/UX polish**。**全量盘点 SSOT：** [PHASE29-RELEASE-POLISH-BACKLOG](./PHASE29-RELEASE-POLISH-BACKLOG.md) — **§6 实施前清单 + `PHASE29_DEV_GATE: OPEN` 后** 方可开发。

---

## 0 · 阶段跃迁（写死）

```text
Phase ②.8 HAT PASS ──► Phase ②.9 Release Polish（本轮）
                              │
                              ▼
         重跑 ① L0–L2 + S5/S6 + Deep Gate + HAT
                              │
                              ▼
              Owner 重新签核 ──► Phase ③ 入口（仍 ≠ Production GO）
```

| 闸 | 当前态 | 说明 |
|----|--------|------|
| **Phase ③ Production Preparation** | **⏸ HOLD** | HAT 曾报 `PHASE3_ENTRY_GATE: READY` — **自 2026-06-07 起作废**，须 **②.9 收口 + 全量复跑** 后 **重新签核** |
| **Phase ②.9 Release Polish** | **▶ ACTIVE** | 仅 in-scope polish（§3） |
| **Production GO（③ 公网）** | **未启动** | 与 Phase ③ 准备 **独立** |

**机读键（Owner 签核前不得宣称 READY）：**

```text
PHASE3_ENTRY_GATE: HOLD
PHASE3_ENTRY_REVIEW: NO_GO
PHASE29_RELEASE_POLISH: W3_DONE · UI_FROZEN
PHASE29_DEV_GATE: CLOSED
PHASE29_IN_SCOPE_UI: 8
PHASE29_IN_SCOPE_DONE: 8
```

---

## 1 · ②.9 完成后的强制复跑（不可跳过）

| 序 | 层 | 命令 / 入口 | 通过标准 |
|----|-----|-------------|----------|
| **R1** | **① L0** | `bash scripts/gates/ci-local-delivery-minimum.sh` | 末行 **`OK: ci-local-delivery-minimum`** · **0 FAIL** |
| **R2** | **① L1** | `node scripts/dev/run-admin-l5-green.mjs`（若动 admin） | exit 0 |
| **R3** | **① L2** | `bash scripts/dev/run-phase2-local-staging-parity-gate.sh --local-test` | **`TT_PHASE2_LOCAL_STAGING_PARITY: PASS`** |
| **R4** | **S5** | `phase2-staging-fly-deploy-and-sync.sh` + `deploy-tt-web-staging.sh` | alignment **FAIL=0** · SHA 对拍 |
| **R5** | **Deep gate** | `bash scripts/dev/run-phase2-deep-release-gate.sh` | **`TT_PHASE2_DEEP_RELEASE_GATE: PASS`** |
| **R6** | **S6** | `bash scripts/dev/run-phase2-local-staging-parity-gate.sh --staging-retest` | UAT **0 FAIL** · Closing Gap 仍 **PHASE2_GO_READY** |
| **R7** | **HAT** | `bash scripts/dev/run-phase28-human-acceptance-test.sh` | **`PHASE28_HUMAN_ACCEPTANCE: PASS`** |
| **R8** | **签核** | Owner 更新本文 §6 + `HUMAN-ACCEPTANCE-REPORT.md` | **`PHASE3_ENTRY_GATE: READY`** 重新生效 |

**证据根：** `evidence/GO_phase2_testnet_20260526/phase29-release-polish/<UTC-stamp>/`

**禁止：** ① 本地绿 **冒充** staging 绿；跳过 R5–R7 仍签 Phase ③。

---

## 2 · 全量盘点（Want-to-change 登记）

**详细分类 · 风险 · 回归范围 · 实施顺序：** 见 **[PHASE29-RELEASE-POLISH-BACKLOG](./PHASE29-RELEASE-POLISH-BACKLOG.md)**（SSOT · 36 项 · 机读 JSON）。

下列为 **摘要**；Scope 列决定能否进入 **②.9 本轮**。

**影响面图例：** `—` 无 · `UI` 纯前端 · `API` 后端契约 · `DB` 迁移/seed · `RBAC` 权限 · `ORD` 订单状态机 · `$$` 资金/Stripe/链上

### 2.1 · HAT / Deep Gate 直接来源

| ID | 来源 | 优先级 | 标题 | 影响面 | Scope |
|----|------|--------|------|--------|-------|
| **RP-001** | HAT-B-001 | P2 | `/market` 搜索框可见性（placeholder · aria · 对比度 · 图标） | UI | **②.9 ✅** |
| **RP-002** | HAT-P2-001 / B-002 | P2 | Staging 预置商家测试账号 | DB · API · seed | **Post-beta** |
| **RP-003** | Deep G03 | P1→P2 | `guide@test.com` `/me` 角色展示不明确 | UI · API? | **②.9 ⚠️** 仅 **UI 侧角色 badge/文案**；若需 API 改 `me` 投影 → Post-beta |
| **RP-004** | Deep G06 | P1 | `meta.seed_test_accounts.enabled` 未暴露 | API · meta | **Post-beta**（非 polish） |
| **RP-005** | HAT 矩阵 | P2 | 商家角色 closure **PARTIAL**（无种子 · 审核链未手操） | DB · RBAC · ORD | **Post-beta**（测试基建 + 流程，非 UI polish） |
| **RP-006** | HAT 矩阵 | P2 | Admin 举报/争议队列 **文案/空态** 手操未确认 | UI | **②.9 ✅**（仅 copy/empty-state/skeleton 文案） |
| **RP-007** | HAT 矩阵 | P2 | 旅行者支付/下单/争议 **全链手操** 未覆盖 | ORD · $$ · API | **Post-beta** |

### 2.2 · Admin / Auth / 社区（候选 polish）

| ID | 来源 | 优先级 | 标题 | 影响面 | Scope |
|----|------|--------|------|--------|-------|
| **RP-010** | Admin L5 审计 | P2 | Admin capabilities 加载 **慢路径** 骨架/超时提示文案 | UI | **②.9 ✅** |
| **RP-011** | Admin freeze | P2 | `git_sha: unknown` 诚实披露样式微调（`data-tt-admin-build-git-unknown`） | UI | **②.9 ✅** |
| **RP-012** | Auth freeze | P2 | 登录/注册 **错误态** i18n 一致性与 a11y（`aria-live`） | UI | **②.9 ✅** |
| **RP-013** | Community | P2 | Feed **空态/加载** 微文案（非结构） | UI | **②.9 ✅** |
| **RP-014** | Community | P1 | Feed **服务端搜索** `GET …/feed?q=` | API · DB | **Post-beta** |
| **RP-015** | `/me` Hub | P2 | `/me` → `/community` 重定向 **首次访问提示**（one-time tooltip） | UI | **②.9 ✅** |

### 2.3 · Market / Web3 / 五主路由（冻结边界内）

| ID | 来源 | 优先级 | 标题 | 影响面 | Scope |
|----|------|--------|------|--------|-------|
| **RP-020** | MKT-FILT-P2-* | P2 | `/market` 子站 staging 筛选全链验证 | API · ORD · DB | **Post-beta** |
| **RP-021** | MKT-FILT-P2-011 | P2 | nil-guide **一步抢单** | API · ORD · $$ | **Post-beta** |
| **RP-022** | MKT-FILT-P2-012 | P2 | discover/guides **服务端 facet 筛选** | API | **Post-beta** |
| **RP-023** | MKT-FILT-P2-009 | P2 | 收藏 **跨设备** 服务端同步 | API · DB | **Post-beta** |
| **RP-024** | WEB3 | P2 | `/market` 列表 **debounce/性能** staging 对拍 | API · UI | **Post-beta**（非纯 polish） |
| **RP-025** | FIVE-MAIN freeze | P2 | 五主路由 **layout/token/结构** 变更 | UI | **❌ 禁止**（冻结） |
| **RP-026** | Escrow freeze | P2 | Escrow 草稿页 **视觉/结构** 变更 | UI | **❌ 禁止**（Phase ① 冻结） |

### 2.4 · Onboarding / 商家 / 治理 / infra

| ID | 来源 | 优先级 | 标题 | 影响面 | Scope |
|----|------|--------|------|--------|-------|
| **RP-030** | ONB-P2-* | P1 | Staging **Stripe 真收单** 新场景 / webhook 扩展 | $$ · API | **Post-beta** |
| **RP-031** | Provider | P2 | 商家入驻 **新步骤/新字段** | API · DB · RBAC | **Post-beta** |
| **RP-032** | Governance | P2 | 链上 **投票/Claim 手操钱包** 流程优化 | $$ · 链 | **Post-beta** |
| **RP-033** | G7 | P2 | Production **CDN/HLS** 配置 | Infra | **Phase ③** |
| **RP-034** | Enterprise gap | P1 | 新 **RBAC 角色/路由** | RBAC · API | **Post-beta** |
| **RP-035** | Enterprise gap | P1 | **Mainnet / PSP live** 切换 | $$ · Infra | **Phase ③** |

---

## 3 · ②.9 本轮 In-Scope（仅低风险 UI/UX polish）

**准入条件（全部满足）：**

1. **仅** 触 `frontend/` 内 **文案 · CSS 类名微调 · a11y 属性 · loading/empty/error 态**  
2. **不** 改五主路由 **layout lock** / Escrow/Auth/Provider **UI 冻结结构**（见 FIVE-MAIN · AUTH-* · PROVIDER-* FREEZE）  
3. **不** 新增 API 路由 · **不** 改 DB · **不** 改 RBAC 矩阵 · **不** 碰订单/资金状态机  
4. 每项 PR **须** 链到本文 **RP-* ID**；合并前 **R1–R3** 绿

### 3.1 · 推荐本轮实施顺序

| 顺序 | ID | 交付物 | 风险 |
|------|-----|--------|------|
| 1 | **RP-001** | `/market` 搜索输入可见性 + `role=searchbox` / label | 低 |
| 2 | **RP-012** | Auth 错误态 a11y + i18n | 低 |
| 3 | **RP-010** | Admin capabilities 加载提示 | 低 |
| 4 | **RP-006** | Admin disputes/reports 空态文案 | 低 |
| 5 | **RP-013** | Community 空态/加载 copy | 低 |
| 6 | **RP-011** | Admin meta git_sha 披露样式 | 低 |
| 7 | **RP-015** | `/me` hub 重定向说明（可选 tooltip） | 低 |
| 8 | **RP-003** | Guide 角色 **仅 UI** badge（**禁止**改 API 若超出展示层） | 低–中 |

### 3.2 · ②.9 显式排除（即使 P2 也不进本轮）

- **RP-002 / RP-004 / RP-005** — seed / meta / 商家闭环  
- **RP-014 / RP-020～RP-024** — API/订单/市场功能  
- **RP-025 / RP-026** — 冻结 UI 结构  
- **RP-030～RP-035** — ③ / infra / 资金

---

## 4 · Post-Beta Backlog（功能新增 · 非 polish）

统一登记 **不得** 在 ②.9 实施 — **完整表见** [PHASE29-RELEASE-POLISH-BACKLOG §2](./PHASE29-RELEASE-POLISH-BACKLOG.md#2--post-beta-backlog功能--数据--权限--资金)。

---

## 5 · UI/UX Polish 边界（与冻结文档）

| 文档 | ②.9 允许 | 禁止 |
|------|----------|------|
| [FIVE-MAIN-ROUTES-PHASE1-FREEZE](../../frontend/evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md) | 数据链 bugfix · **非结构** a11y/copy | layout · token · 页面结构 |
| [AUTH-LOGIN-UI-FREEZE](../../frontend/evidence/GO_local_auth_l5/AUTH-LOGIN-UI-FREEZE.md) | i18n · a11y · 错误态 | L5 视觉 · 结构 |
| [PROVIDER-REGISTER-UI-FREEZE](../../frontend/evidence/GO_local_provider_register_closure/PROVIDER-REGISTER-UI-FREEZE.md) | 校验文案 · 错误态 | L5 壳 · 门态面板结构 |
| [HUMAN-ACCEPTANCE-REPORT](./HUMAN-ACCEPTANCE-REPORT.md) | ②.9 完成后 **复跑更新** | 不复跑即改 READY |

---

## 6 · Owner 签核 checklist（②.9 → Phase ③ 重新入口）

- [ ] §3 In-scope **全部** RP-* 已 **CLOSED** 或 **DEFER** 至 §4 并记录理由  
- [ ] **R1–R7** 证据已归档至 `evidence/.../phase29-release-polish/<stamp>/`  
- [ ] Staging SHA 对拍 · Deep gate · HAT **PASS** 报告日期 **≥** ②.9 最后一笔 merge  
- [ ] `PHASE3_ENTRY_GATE: HOLD` → **`READY`** 书面签核（本文件 + HAT 报告同步）  
- [ ] **仍 ≠ Production GO**

**签核块（复制粘贴）：**

```text
PHASE29_RELEASE_POLISH: COMPLETE
PHASE29_SIGNOFF_AT: <UTC>
PHASE29_SIGNOFF_BY: <Owner>
PHASE3_ENTRY_GATE: READY   # 重新生效 · 仍 ≠ Production GO
GIT_SHA: <staging /meta build.git_sha>
EVIDENCE: evidence/GO_phase2_testnet_20260526/phase29-release-polish/<stamp>/
```

---

## 7 · 相关文档

| 文档 | 关系 |
|------|------|
| [HUMAN-ACCEPTANCE-REPORT](./HUMAN-ACCEPTANCE-REPORT.md) | ②.8 基线 · Phase ③ 入口 **HOLD** |
| [TT-PHASE2-DEEP-RELEASE-GATE](./TT-PHASE2-DEEP-RELEASE-GATE.md) | R5 硬闸 |
| [PHASE2-LOCAL-STAGING-PARITY-LOOP](./PHASE2-LOCAL-STAGING-PARITY-LOOP.md) | R3/R4/R6 编排 |
| [TT-LOCAL-CI-DELIVERY-GATE-001](./TT-LOCAL-CI-DELIVERY-GATE-001.md) | R1 L0 |
| [PHASE29-RELEASE-POLISH-BACKLOG](./PHASE29-RELEASE-POLISH-BACKLOG.md) | **实施前盘点 SSOT** · 五维分类 · 风险 · 回归 |

---

*Phase ②.9 激活 · Phase ③ 入口暂停 · 2026-06-07*
