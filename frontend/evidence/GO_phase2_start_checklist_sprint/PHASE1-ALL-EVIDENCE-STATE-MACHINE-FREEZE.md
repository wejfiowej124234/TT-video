# Phase ① · 全部证据与状态机冻结（2026-06-09）

**阶段：① 本地** — 本文件为 **PHASE2-START-CHECKLIST-SPRINT** 的 ① 冻结 SSOT；**禁止**在未解冻前回流主链/Hub/onboarding 产品结构。

**② 准入：** G-0～G-4 清点见 [PHASE2-START-CHECKLIST-SPRINT-FREEZE.md](./PHASE2-START-CHECKLIST-SPRINT-FREEZE.md)

---

## 状态机（写死 · ACTIVE）

| 域 | 状态 | SSOT |
|----|------|------|
| onboarding / Hub / `fee_schedule_v1` | **Freeze** | [PHASE1-FREEZE-ONBOARDING-HUB.md](../GO_local_phase1/PHASE1-FREEZE-ONBOARDING-HUB.md) |
| 五主路由 UI | **Freeze** | [FIVE-MAIN-ROUTES-PHASE1-FREEZE.md](../GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md) |
| `/` + `/market` 数据链 | **ACTIVE SSOT** | [LANDING-MARKET-PAGES-CODE-SSOT.md](../GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md) |
| Escrow 预链上草稿 | **UI Freeze** | [ESCROW-DRAFT-EXPERIENCE-FREEZE.md](../GO_local_web3_itinerary_l5/ESCROW-DRAFT-EXPERIENCE-FREEZE.md) |
| Real User 主链 | **Freeze** | [REAL-USER-ACCEPTANCE-SPRINT-FREEZE.md](../GO_local_real_user_acceptance/REAL-USER-ACCEPTANCE-SPRINT-FREEZE.md) |
| Real User 异常矩阵 | **Freeze** | [REAL-USER-EXCEPTION-MATRIX-FREEZE.md](../GO_local_real_user_acceptance/REAL-USER-EXCEPTION-MATRIX-FREEZE.md) |

**维护期仅允许：** bugfix · 数据链路 · i18n/a11y · 门闸字段对齐 · 证据复跑。

---

## 权威 ① 机读证据（清点锚）

| # | 证据 | 末行标记 |
|---|------|----------|
| 1 | [`acceptance.latest.log`](../GO_local_phase1/acceptance.latest.log) | `TT_GO_LOCAL_PHASE1: OK` |
| 2 | [`site10.acceptance.latest.log`](../GO_local_phase1/site10.acceptance.latest.log) | `TT_ENTERPRISE_SITE_10_LOCAL: OK` |
| 3 | [REAL-USER-ACCEPTANCE-SPRINT-20260609T161419Z.log](../GO_local_real_user_acceptance/REAL-USER-ACCEPTANCE-SPRINT-20260609T161419Z.log) | `TT_REAL_USER_ACCEPTANCE_SPRINT_EVIDENCE: OK` |
| 4 | [REAL-USER-EXCEPTION-MATRIX-SPRINT-20260609T235032Z.log](../GO_local_real_user_acceptance/REAL-USER-EXCEPTION-MATRIX-SPRINT-20260609T235032Z.log) | `TT_REAL_USER_EXCEPTION_MATRIX_SPRINT_EVIDENCE: OK` |

**Web3 走廊（seed 账号 · 非 Real User）：** [ESCROW-P03-P06-EXCEPTION-FLOWS](../GO_local_web3_itinerary_l5/) · [ESCROW-P05-P06-MAIN-CHAIN](../GO_local_web3_itinerary_l5/) 等 — 见 [`GO_local_web3_itinerary_l5/README.md`](../GO_local_web3_itinerary_l5/README.md)。

---

## 诚实边界

- ① 本冻结 **≠** ② staging 全矩阵 GO **≠** ③ Production GO
- Real User sprint **≠** seed/trust-gate 主链 SSOT
- Closing Gap `PHASE2_GO_READY` 为 **宽 ②** 口径，仍 **≠** ③

---

## 互指

| 读者 | 文档 |
|------|------|
| ① 总包 | [GO_local_phase1/README.md](../GO_local_phase1/README.md) |
| ② 准入 sprint | [README.md](./README.md) |
| G 闸 SSOT | [PHASE2-START-CHECKLIST.md](../../../docs/runbook/PHASE2-START-CHECKLIST.md) |
