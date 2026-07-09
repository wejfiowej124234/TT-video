# 181 · Complexity Audit · Final Candidate Before Soak

**Version:** 1.0.0 · **最后更新：** 2026-06-24  
**受众**：工程 · Owner · ② staging 收敛执行  
**状态**：**ACTIVE · STRAT-F 执行轨**  
**阶段**：**① 本地 + ② 测试网**（**≠ ③ Production GO**）

> **SSOT（必读）**：本文为 **复杂度收敛唯一真源**。**机读台账**：[`registry/complexity-convergence-fix-ledger.v1.yaml`](../../../registry/complexity-convergence-fix-ledger.v1.yaml) · **Gap 对拍**：[`evidence/P2FC_SOAK_72H_STAGING/final-candidate-pre-soak/gap-inventory.latest.json`](../../../evidence/P2FC_SOAK_72H_STAGING/final-candidate-pre-soak/gap-inventory.latest.json) · **编排**：[`scripts/ops/p2fc-pivot-final-candidate-pre-soak.sh`](../../../scripts/ops/p2fc-pivot-final-candidate-pre-soak.sh)

**业务真源（写死）**：旅行预约双边市场 — **旅行者 → 向导 → 订单 → Escrow 托管 → 完成 / 争议**。

**执行原则（写死）**：

1. **业务闭环优先** — Booking Core P0 全绿前，不启动扩展面写路径或新域门禁  
2. **复杂度收敛优先** — 多身份 / Admin 全栈 / 治理经济 / Growth·CMS 默认 **后置或只读**  
3. **双阶段持续对齐** — 每项关闭须 **① gate exit 0 + ② 探针/证据**；禁止「本地已修、staging 未同步」  
4. **Soak 门禁** — 全部 **P0+P1 closed** + `TT_P2FC_FINAL_CANDIDATE_PHASE_STAGING_LIVE: PASS` → **Freeze Candidate @ HEAD** → **全新 72h Soak**

---

## 1. 复杂度审计摘要（归档）

| 维度 | 审计前 | 收敛目标（Soak 前） |
|------|--------|---------------------|
| 前端路由 | ~194 | ~45–55 活跃（核心 + 最小 Admin） |
| Admin API 模块 | ~68 | ~15 P0 写 + 其余只读/不部署 staging |
| 供给轨 | 4 轨并行 | **① 仅 guide+traveler 活跃** |
| Gate 脚本 | 183+ (`scripts/gates/`) | 日常 **ci-local-minimum** + STRAT-F 串行链 |
| 工程/业务比 | ~8–12× | ~2–3×（含 ② 必要壳） |

**三类分类**：🟢 业务必需 · 🟡 未来扩展 · 🔴 当前过度设计（**降级不删码**）

---

## 2. 修复台账 · 执行状态

**刷新命令**：

```bash
python scripts/dev/gen-complexity-convergence-ledger-status.py
bash scripts/dev/validate-complexity-convergence-ledger-sync.sh --strict
```

**关闭单项**：

```bash
bash scripts/dev/close-complexity-convergence-item.sh --id BOOK-P0-01
# ② 未就绪时仅关 ①：
bash scripts/dev/close-complexity-convergence-item.sh --id BOOK-P0-01 --skip-phase2
```

### 2.1 P0 · Booking Core（必须先绿）

| ID | 项 | 状态 | ① Gate | ② Gate |
|----|-----|------|--------|--------|
| **BOOK-P0-01** | OED 走廊烟测 | **phase1_closed（①✓ · ② pending）** | `RESTART_API=0 smoke-order-escrow-dispute-p0-local.sh` | `phase2-full-coverage-validation.sh --slice oed` |
| **BOOK-P0-02** | Web3 行程全链 | **phase1_closed（①✓ · ② pending）** | `smoke-web3-itinerary-full-chain-local.sh` | `tt-9627-testnet-segment12-smoke-pack.sh` |
| **BOOK-P0-03** | 向导详情→预约 | **phase1_closed（①✓ · ② pending）** | `RESTART_API=0 SKIP_PLAYWRIGHT=1 smoke-guide-detail-booking-local.sh` | `smoke-guide-detail-booking-p2-local.sh` |
| **BOOK-P0-04** | 双边确认 API 矩阵 | **phase1_closed（①✓ · ② pending）** | `cargo test -p traveltrust-api -- matrix_93` | `smoke-api-public-routes.sh` @ staging |
| **BOOK-P0-05** | Escrow 草稿绿集 | **phase1_closed（①✓ · ② pending）** | `run-web3-itinerary-l5-green.sh` | `smoke-staging-web.sh` |

### 2.2 P0 · STRAT-F fix_before_soak（依赖 Booking Core）

| ID | Gap ref | 项 | 状态 | 依赖 |
|----|---------|-----|------|------|
| **STRAT-S1** | S1_MR12 | staging deploy wave1/2 | **phase1_closed（①✓ · ② pending）** | BOOK-P0-01..04 |
| **STRAT-S2** | S2_ADM_U01 | ADM-U01 六角色证据 | **phase1_closed（①✓ · ② pending）** | S1 |
| **STRAT-S3** | S3_P0_RUNTIME | P0 RBAC runtime | **phase1_closed（①✓ · ② pending）** | S1 |
| **STRAT-S4** | S4_BLOCKERS | B1–B4 + TN-P1-010 | **phase1_closed（①✓ · ② pending）** | S1, BOOK-P0-04 |
| **STRAT-S5** | S5_ADM_U02 | ADM-U02 审批链 | **phase1_closed（①✓ · ② pending）** | S2, S3 |
| **STRAT-S6** | S6_D3 | D3 安全合并 | **phase1_closed（①✓ · ② pending）** | S2, S3 |
| **STRAT-S7** | S7_D124 | D1/D2/D4 收敛 | **phase1_closed（①✓ · ② pending）** | S6 |

### 2.3 P1 · 复杂度收敛（Booking 绿后 · Soak 前）

| ID | 项 | 状态 |
|----|-----|------|
| **EXP-P1-01** | 多身份 Hub 仅 guide+traveler 活跃 | **phase1_closed（①✓ · ② pending）** |
| **EXP-P1-02** | 收购/B轨 staging 写面关闭 | **phase1_closed（①✓ · ② pending）** |
| **EXP-P1-03** | Admin 侧栏 ~20 项 | **phase1_closed（①✓ · ② pending）** |
| **EXP-P1-04** | Growth Admin staging 不部署 | **phase1_closed（①✓ · ② pending）** |
| **EXP-P1-05** | 治理 UI 只读窄化 | **phase1_closed（①✓ · ② pending）** |
| **GATE-P1-01** | Site-10 合并为 p1-slices-recheck | **phase1_closed（①✓ · ② pending）** |

### 2.4 P2 · 显式 deferred（Soak 后）

| ID | 项 |
|----|-----|
| DEF-P2-01 | Catalog Admin CRUD（破 120 后） |
| DEF-P2-02 | CountryPool / TTG PrimaryMarket |
| DEF-P2-03 | ROV-T6/T7 |

---

## 3. 双阶段同步纪律（防漂移）

每项 **close** 必须产出：

| 层 | 路径 / 动作 |
|----|-------------|
| **① 证据** | `evidence/COMPLEXITY_CONVERGENCE/<ID>/phase1.closed.json` |
| **② 证据** | `evidence/P2FC_SOAK_72H_STAGING/final-candidate-pre-soak/items/<ID>/phase2.closed.json` |
| **矩阵** | 触及时更新 **93 脚注** / `registry/*-audit-probes.v1.yaml` |
| **契约** | `cargo test` / vitest contract 同批绿 |
| **RBAC** | `registry/admin-rbac-*.v1.yaml` + staging 探针 |
| **Gap** | `gen-p2fc-final-candidate-gap-inventory.py` 刷新 |
| **台账** | `complexity-convergence-fix-ledger.v1.yaml` status → closed |

**漂移审计**（合并前 / 关项后）：

```bash
bash scripts/dev/validate-complexity-convergence-ledger-sync.sh --strict
```

---

## 4. 退出链 · Freeze Candidate → 72h Soak

```text
BOOK-P0-* 全 closed
    → STRAT-S1..S7 全 closed
    → EXP-P1-* + GATE-P1-* 全 closed
    → bash scripts/ops/p2fc-pivot-final-candidate-pre-soak.sh --phase-staging-live
    → TT_P2FC_FINAL_CANDIDATE_PHASE_STAGING_LIVE: PASS
    → bash scripts/ops/p2fc-pivot-final-candidate-pre-soak.sh --engage-freeze
    → P2FC_SOAK_SUPERSEDE=1 bash scripts/ops/p2fc-pivot-final-candidate-pre-soak.sh --launch-soak
    → evidence/P2FC_SOAK_72H_STAGING/COMPLETED.json
```

**诚实边界**：`PHASE2_GO_READY` · `ROV_01_IN_PROGRESS` · ISS-007 `PARTIAL_GO` **≠** 本程序 Soak GO **≠** ③ Production GO。

---

## 5. 日常门禁（收敛后）

| 频率 | 命令 |
|------|------|
| 每次 push | `bash scripts/gates/ci-local-delivery-minimum.sh` |
| 动 escrow/landing/market | `bash scripts/dev/run-web3-itinerary-l5-green.sh` |
| 动 orders/disputes | `bash scripts/dev/smoke-order-escrow-dispute-p0-local.sh` |
| 关台账项 | `close-complexity-convergence-item.sh` |
| Soak 前一次 | STRAT-F 全链（§4） |
| GATE-P1-01 基线后 · 不重复 gate | `bash scripts/ops/p2fc-build-freeze-candidate-from-p1-baseline.sh` |

---

## 6. 相关 SSOT

| 文档 | 关系 |
|------|------|
| [178-P2FC Blueprint](./178-Phase2-Full-Coverage-Validation-Blueprint.md) | 33 项 strict GO 母程序 |
| [179-P2FC Report](./179-Phase2-Full-Coverage-Validation-Report.md) | 进度报告 |
| [PHASE2-OPEN-ITEMS-BURN-DOWN](../../runbook/PHASE2-OPEN-ITEMS-BURN-DOWN.md) | ② 剩余 TIME/SOAK/WALLET |
| [125-Production-Feature-Gap-Matrix](./125-Production-Feature-Gap-Matrix.md) | Growth/CMS B 层 HOLD |
| [20-B-订单机制](./20-B-订单机制.md) | Booking 域导读 |

---

## 变更记录

| 日期 | 变更 |
|------|------|
| 2026-06-24 | v1.0.0 初版：审计归档 + P0/P1/P2 台账 + 双阶段同步纪律 + STRAT-F 退出链 |
| 2026-06-25 | GATE-P1-01 25/25 基线成立 · `p2fc-build-freeze-candidate-from-p1-baseline.sh` 入口 |
