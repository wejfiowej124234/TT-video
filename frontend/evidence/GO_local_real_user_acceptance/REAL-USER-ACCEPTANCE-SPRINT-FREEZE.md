# Real User Acceptance Sprint · ① 本地主链冻结（2026-06-09）

**阶段：① 本地** — 禁止 seed / fixture / trust-gate 账号；**全新注册**游客与向导跑通 **UI 全链**；**不**表示 ② 测试网 / ③ 生产 GO。

**代码真源：** `frontend/e2e/real-user-acceptance-sprint.spec.ts` · `frontend/e2e/helpers/realUserAcceptanceCorridor.ts`

---

## 冻结结论（ACTIVE · 已收口）

| 项 | 状态 |
|----|------|
| **账号** | `*@traveltrust.acceptance` 全新注册；**禁止** `tourist@test` / `guide@test` / `seed-test-accounts` / `trustGate` |
| **全链（10 步）** | 注册 → 入驻 → 质押 → Landing 行程 → 市场绑定向导 → 接单 → 双边 → 终版 snapshot → mock-pay → 向导确认完成 → 游客评价 |
| **冻结日** | **2026-06-09** |
| **权威证据** | [`REAL-USER-ACCEPTANCE-SPRINT-20260609T161419Z.log`](./REAL-USER-ACCEPTANCE-SPRINT-20260609T161419Z.log) |
| **机读 OK** | `TT_REAL_USER_ACCEPTANCE_SPRINT_EVIDENCE: OK 20260609T161419Z` · `TT_REAL_USER_ACCEPTANCE_SPRINT_SUMMARY: exit=0 phase=① fresh_accounts full_ui_chain` |

**维护期纪律（写死）：** 主链 spec / `realUserAcceptanceCorridor` **仅允许** bugfix · 数据链路 · i18n/a11y · 门闸字段对齐；**禁止** 改 10 步顺序、换 seed 账号、删步骤、或「重构主链走廊」。双边隔离调试见 [`real-user-bilateral-p0.spec.ts`](../../e2e/real-user-bilateral-p0.spec.ts)（**非**主链 SSOT；权威 OK 仍须全链 sprint 日志）。

---

## 主链步骤（与 Playwright 一致）

```text
1  tourist + guide register (UI)
2  guide onboarding /guide/register + stake (UI)
3  tourist landing itinerary + publish (UI)
4  market bind fresh guide (UI)
5  guide accept (UI)
6  bilateral both sides (UI · runBilateralUiBothSides)
7  confirm final plan + snapshot hash visible (UI)
8  mock-pay /pay returnUrl + pay CTA or API fallback (UI)
9  guide confirm completion (UI · API poll + reload)
10 tourist review + guide sees comment (UI)
```

API：`SEED_TEST_ACCOUNTS=0` · `P3_CHAIN_OFF=1` · `CORS_ORIGINS` 含 Next 端口（见 `record-real-user-acceptance-sprint-evidence.sh`）。

---

## 机读验收（主链 · 须 exit 0）

```bash
bash scripts/dev/record-real-user-acceptance-sprint-evidence.sh
```

末行须含：`TT_REAL_USER_ACCEPTANCE_SPRINT_EVIDENCE: OK`

**绿集（同批 Step A）：** `npx vitest run lib/escrow/realUserAcceptanceSprint.contract.test.ts`

---

## 下一步（仅此 · 禁止回流主链重构）

| 阶 | 工作 | SSOT |
|----|------|------|
| **① 异常流矩阵** | Real User 走廊 **异常/门闸** 用例矩阵（409/403/超时/幂等等）；**增** spec，**不得** 削弱或改写上述 10 步主链 | [`REAL-USER-EXCEPTION-MATRIX-FREEZE.md`](./REAL-USER-EXCEPTION-MATRIX-FREEZE.md) · `record-real-user-exception-matrix-sprint-evidence.sh` |
| **② 准入清单** | staging / Stripe / 测试网 / 链上 **G-0～G-4** 清闸后再开工 | [`PHASE2-START-CHECKLIST.md`](../../../docs/runbook/PHASE2-START-CHECKLIST.md) · [`PHASE2-REPOSITORY-STATUS.md`](../../../docs/runbook/PHASE2-REPOSITORY-STATUS.md) |

**诚实边界：** ① 本 sprint OK **≠** ② staging GO **≠** ③ Production GO；ISS-007 窄切片 GO **不得** 冒充全站矩阵 GO。

---

## 互指

| 读者 | 文档 |
|------|------|
| 目录索引 | [README.md](./README.md) |
| 双边 P0 隔离 | `REAL-USER-BILATERAL-P0-20260609T155334Z.log` · `record-real-user-bilateral-p0-evidence.sh` |
| 种子主链（非本 sprint 账号） | [ESCROW-P03-P06-GD-MAIN-CHAIN-FREEZE](../GO_local_web3_itinerary_l5/ESCROW-P03-P06-GD-MAIN-CHAIN-FREEZE.md) |
| 机读模型 | `frontend/lib/escrow/realUserAcceptanceSprintModel.ts` |
| Agent | `AGENTS.md` · `.cursor/rules/traveltrust-ai-collab.mdc` |
