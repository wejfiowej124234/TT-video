# Seed/Main-Chain Clarity · ① 本地冻结（2026-06-09）

**阶段：① 本地** — 测试账号文档拆分「公众 catalog 主链 / tourist+guide 种子联调链」+ Escrow 403 / 错账号可解释提示；**不**表示 ② 测试网 / ③ 生产 GO。

**代码真源：** `docs/测试账号与本地联调.md` §二 · `crates/api/src/chain_off/order_participant_hints.rs` · `frontend/lib/orderParticipantHint.ts`

---

## 冻结结论（ACTIVE）

| 项 | 状态 |
|----|------|
| **文档双链 SSOT** | A：`tg_guide_main@trustgate-e2e.local` · B：`guide@test.com` |
| **403 提示字段** | `assigned_guide_email` · `tourist_email` · `debug_chain` |
| **接单错账号** | `not_assigned_guide` + 同上提示 |
| **冻结日** | **2026-06-09** |

**维护期纪律：** 仅允许 bugfix · i18n/a11y · 数据链字段对齐；**禁止**删除双链文档或弱化 Escrow 混链提示。

---

## 机读验收

```bash
npx vitest run lib/l5/seedMainChainClarity.contract.test.ts
```

末行须全绿；冻结后 `SEED_MAIN_CHAIN_CLARITY_FROZEN` 为 `true`。
