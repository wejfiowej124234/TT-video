# ① 本地 · 链路验证期编排闸（2026-05-25）

**阶段：① 本地** — **不改五主路由页面**；编排 **全量质量门**、**UI 防回归**、**治理矩阵**、**`/me` page contract** 机读入口。  
**互指：** [FIVE-MAIN-ROUTES-PHASE1-FREEZE.md](./FIVE-MAIN-ROUTES-PHASE1-FREEZE.md)（后续变更边界）· [ENTERPRISE-AUDIT-20260526.md](./ENTERPRISE-AUDIT-20260526.md) §17

### ① local-1 状态（2026-05-26）

| 项 | 状态 |
|----|------|
| 五主路由 UI | **frozen**（12-file 绿集 · 含 `/` 行程数据链契约） |
| Web3 行程 L5 | [`GO_local_web3_itinerary_l5`](../GO_local_web3_itinerary_l5/README.md) · `run-web3-itinerary-l5-green.sh` |
| 96-16 matrix | **126/126** · **NEEDS_FIX=0**（AD-06 已闭） |
| `/me` 双页 contract | **已补** · 编入 **`gate:me-routes`** |
| **②③** | **未闭**（staging 全矩阵 · MANUAL-P1 · Production GO） |

**①.5 入口（当前主轨）：** [PHASE1_5-DATA-LINK-MODEL-GATE.md](../../../docs/runbook/PHASE1_5-DATA-LINK-MODEL-GATE.md) · [`identity-unified-model.v1.md`](../../../docs/spec/artifacts/identity-unified-model.v1.md) **PD-001～008 LOCKED**  
**② 入口（暂缓）：** [PHASE2-TESTNET-ACCEPTANCE.md](../../../docs/runbook/PHASE2-TESTNET-ACCEPTANCE.md) · 证据 [`evidence/GO_phase2_testnet_20260526/README.md`](../../../evidence/GO_phase2_testnet_20260526/README.md)

---

## 一键编排（推荐）

```bash
# 仓库根
bash scripts/gates/local-phase1-linkage-quality-gates.sh
```

成功末行须 grep 到：`TT_PHASE1_LINKAGE_QUALITY_GATES_SUMMARY: OK phase=local-1`

**04 §3.4 路由表（2026-05-28 已补）：** `STRICT_WARNINGS=1 python scripts/gates/check-04-routes-vs-code.py` **exit 0**（含治理 state-machines、入驻草稿、钱包验证、收购 bond、steward/redemption、本地 mark-paid 等）。

| 环境变量 | 作用 |
|----------|------|
| `CI_LOCAL_SKIP_AI_TASK_CARD_INDEX=1` | 跳过 `check-ai-task-card-index-overview`（索引表历史 lint 未清时仍可跑后端三连） |
| `CI_LOCAL_SKIP_PHASE1_BACKEND_TRIPLE=1` | 跳过 `ci-local-delivery-minimum`（仅前端四段 + 治理文档联动） |
| `CI_LOCAL_PHASE1_FRONTEND_LINT_TSC=1` | 追加 `npm run lint` + `npx tsc --noEmit` |

---

## 1. 全量质量门（后端三连 + 治理文档联动）

| 闸 | 脚本 |
|----|------|
| 后端最小三连 | `scripts/gates/ci-local-delivery-minimum.sh` |
| 治理文档 84/08-4/82-83 联动 | `scripts/gates/check-governance-doc-linkage.sh` |

---

## 2. 五主路由 UI 防回归闸

```bash
bash scripts/gates/five-main-routes-ui-antiregression-gate.sh
```

**7 files · 127 tests**（与 FIVE-MAIN 文首绿集同源）。  
末行：`TT_FIVE_MAIN_ROUTES_UI_GATE_SUMMARY: OK`

---

## 3. 治理矩阵本地闸（93 · C-GOV）

```bash
bash scripts/gates/governance-matrix-local-gate.sh
```

**行→测试映射：** [governance-matrix-local-gate.v1.json](./governance-matrix-local-gate.v1.json)  
末行：`TT_GOVERNANCE_MATRIX_LOCAL_GATE_SUMMARY: OK`

**②③ 未闭：** C-GOV-004/005/010 等 MANUAL-P1、链上再读、钱包写合约 — 本闸仅覆盖 **① 契约/只读 UX** 切片。

**96-16 全站矩阵（AD-06，非本编排内）：** `cd frontend && npm run matrix:96-16:all` · `npm run check:96-16-matrices` — **`total_routes` 126** 与 `page.tsx` 对齐（**2026-05-26 已闭**）。

---

## 4. `/me` 子路由 page contract 闸

```bash
bash scripts/gates/me-routes-local-gate.sh
```

**映射：** [me-routes-local-gate.v1.json](./me-routes-local-gate.v1.json)  
**2 files · 6 tests**（`/me/identities` · `/me/security`）  
末行：`TT_ME_ROUTES_LOCAL_GATE_SUMMARY: OK`

---

## frontend npm 快捷命令

```bash
cd frontend
npm run gate:five-main-routes-ui
npm run gate:governance-matrix
npm run gate:me-routes
npm run gate:phase1-linkage
```

---

## 禁止假完成

本编排闸 **≠** ② 测试网 staging 全矩阵 **≠** ③ Production GO。
