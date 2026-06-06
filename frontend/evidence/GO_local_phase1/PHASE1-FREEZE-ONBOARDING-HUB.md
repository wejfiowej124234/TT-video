# Phase ① Freeze · Onboarding / Hub / fee_schedule_v1（2026-05-28）

**状态：生效（ACTIVE）** — **Phase ① 已闭环**；本冻结 **叠加** 既有 UI 锁（Console L5 · Hub L5），进入 **链路维护期**。

**仓库总态：** **[Phase ① Freeze + Phase ② Prepared / Not Started](../../../docs/runbook/PHASE2-REPOSITORY-STATUS.md)** — **阶段治理稳定态**（非功能扩张）；**① 封版机读留痕已齐**（`acceptance.latest.log` + `site10.acceptance.latest.log`）；长期 **Freeze 维护** 直至 **G-1/G-2** 成熟。

**阶段：① 本地** — **不** 表示 ② 测试网 / ③ 生产 GO。

**互指：** [GO_local_phase1](./README.md) · [PHASE1-ENTERPRISE-CLOSURE-AUDIT](../../../docs/runbook/PHASE1-ENTERPRISE-CLOSURE-AUDIT.md) · [PHASE2-REPOSITORY-STATUS](../../../docs/runbook/PHASE2-REPOSITORY-STATUS.md) · [PHASE2-START-CHECKLIST](../../../docs/runbook/PHASE2-START-CHECKLIST.md) · [PHASE2-ENTERPRISE-GAP-AUDIT](../../../docs/runbook/PHASE2-ENTERPRISE-GAP-AUDIT.md) · [onboarding-fee-schedule.v1 §8.1](../../../docs/spec/artifacts/onboarding-fee-schedule.v1.md#81-第一阶段--①-本地--全链路2026-05-28) · [ME-ONBOARDING-CONSOLE-L5-FREEZE](../GO_local_auth_l5/ME-ONBOARDING-CONSOLE-L5-FREEZE.md) · [ME-IDENTITIES-UI-FREEZE](../GO_local_auth_l5/ME-IDENTITIES-UI-FREEZE.md)

---

## 冻结结论

自 **2026-05-28** 起，**onboarding（96-18 准入费）**、**`/me/identities` Hub 核心卡（商家/主理人 onboarding 轨）**、**B 轨 `fee_schedule_v1` 计价与对拍** 进入 **Phase ① Freeze**：

| 允许 | 禁止 |
|------|------|
| **Bugfix**（回归修复 · 须附 ① 绿集 / 烟测） | **新功能** · 新 API 字段 · 新 Hub 阶段 · 新价目 SKU/规则 |
| **证据补充**（`GO_local_*` · runbook · 互指 · exit 0 留痕） | **Stripe** · **测试网 PSP** · **公网 webhook 真收单** |
| **注释 / 文档清理**（非行为变更） | **测试网合约部署** · **链上 stake 实施** |
| **i18n 错字**（**同语义** · 不改产品决策） | **② 实施**：Stripe 出网 / staging 真收单 / 合约 broadcast（**G-1/G-2 未清**）；**不得** 将已建 smoke **跑绿** 冒充 ② GO |
| **① 数据链路 bugfix**（trust / entitlement 读写的正确性） | **UI 结构 / L5 layout 回流**（见 Console · Hub UI freeze） |

**收购 PD-009** 垂直线 **不在本文件 UI 范围**，仍按 **[ME-IDENTITIES-UI-FREEZE](../GO_local_auth_l5/ME-IDENTITIES-UI-FREEZE.md)** + **[acquisition-publish-trust-rules §8.1](../../../docs/spec/artifacts/acquisition-publish-trust-rules.v1.md#81-第一阶段--本地--closed2026-05-27)**；**本冻结** 禁止的是 **Hub/onboarding/fee_schedule 新功能**，**不** 自动禁止 acquisition **bugfix**。

---

## Phase ② · Prepared / Not Started

**② 准备资产已入库**（runbook · 证据目录 · `check-phase2-onboarding-staging-ready.sh` · `smoke-onboarding-testnet.sh` 等）— 见 **[PHASE2-REPOSITORY-STATUS](../../../docs/runbook/PHASE2-REPOSITORY-STATUS.md)**。**不等于** Phase ② **实施已启动**。

下列 **实施** **全部** 归属 **Phase ②**，**未** 满足 **[PHASE2-START-CHECKLIST · G-0～G-4](../../../docs/runbook/PHASE2-START-CHECKLIST.md#0--总入口闸phase-②-任何工作流开工前)**（尤其 **G-1/G-2**）前 **不得** 开工（含「先写一半」）：

| 域 | Backlog / Runbook |
|----|-------------------|
| Stripe PI / Checkout | ONB-P2-001～002 · [TT-9618 §3](../runbook/TT-9618-onboarding-local-testnet.md) |
| 公网 webhook · PSP 真收单 | ONB-P2-003～004 |
| ② 对拍 · staging smoke | ONB-P2-005～006 |
| 测试网合约 | [TT-9630](../runbook/TT-9630-protocol-convergence-testnet-pregate.md) |
| 链上 stake 对拍 | [TT-9629](../runbook/TT-9629-protocol-convergence-steward-stake-testnet.md) |

---

## 动代码时的 ① 绿集（bugfix 亦须）

| 路径域 | 最低绿集 |
|--------|----------|
| **`fee_schedule_v1` / onboarding API** | `cargo test -p traveltrust-api fee_schedule_v1` · 相关 `matrix_93_b_onb_*` |
| **`/me/onboarding`** | `meOnboardingUiFreeze` · `meOnboardingPage` · `meOnboardingViewModel` · `onboarding.http` |
| **`/me/identities` Hub 核心卡** | `meIdentitiesCoreCardModel` · `meIdentitiesUiFreeze` · `meIdentitiesPage` |
| **全链回归（推送前建议）** | `bash scripts/dev/run-go-local-phase1-acceptance.sh` |

---

## 机读锚点（可选 · PR 描述）

- 文案含 **`Phase ① Freeze`** 与 **`PHASE2-START-CHECKLIST G-0～G-4`**
- **非 bugfix** 的 onboarding/Hub/fee_schedule PR **应拒绝合并**

---

## 变更记录

| Date | Note |
|------|------|
| 2026-05-28 | 初版：Phase ① 闭环后进入 Freeze；② 统一延后 |
| 2026-05-28 | 互指 [PHASE2-ENTERPRISE-GAP-AUDIT](../../../docs/runbook/PHASE2-ENTERPRISE-GAP-AUDIT.md) |
| 2026-05-28 | 总态 [PHASE2-REPOSITORY-STATUS](../../../docs/runbook/PHASE2-REPOSITORY-STATUS.md) · ② Prepared/Not Started |
| 2026-05-28 | [PHASE1-ENTERPRISE-CLOSURE-AUDIT](../../../docs/runbook/PHASE1-ENTERPRISE-CLOSURE-AUDIT.md) |
| 2026-05-29 | **封版留痕完成：** `acceptance.latest.log`（`TT_GO_LOCAL_PHASE1: OK`）+ `site10.acceptance.latest.log`（`TT_ENTERPRISE_SITE_10_LOCAL: OK`）→ 进入长期 Freeze 维护期 |

---

**End of PHASE1-FREEZE-ONBOARDING-HUB**
