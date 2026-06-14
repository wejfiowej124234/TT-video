# Escrow 双边确认体验 L5 · ① 本地冻结（2026-06-09）

**阶段：① 本地** — 游客与向导各自进入同一 Escrow，**UI** 点击「确认行程与金额」，页面清晰展示「等待对方确认 / 双方已确认」，并打开「确认最终行程」门闸；**不**表示 ② 测试网 / ③ 生产 GO。

**代码真源：** `frontend/lib/escrow/bilateralExperienceL5Model.ts` · `frontend/components/escrow/EscrowDetail/BilateralConfirmBlock.tsx` · `frontend/e2e/escrow-bilateral-experience-l5.spec.ts`

---

## 冻结结论（ACTIVE）

| 项 | 状态 |
|----|------|
| **聚合状态条** | `data-tt-bilateral-status` · `waiting_other` / `both_confirmed` |
| **双边区探针** | `data-tt-bilateral-experience-l5="1"` |
| **联调链** | **B** `tourist@test.com` + `guide@test.com`（与 [测试账号文档](../../../docs/测试账号与本地联调.md) §二 同源） |
| **双角色走廊** | 绑单 → 向导接单 → 游客 UI 确认 → 等待对方 → 向导 UI 确认 → 双方已确认 → 确认最终行程门闸 |
| **冻结日** | **2026-06-09** |

**维护期纪律：** 仅允许 bugfix · 数据链/i18n/a11y · 门闸；**禁止**削弱「等待对方 / 双方已确认」文案与 Playwright 双角色 UI 断言。

---

## 机读验收

```bash
bash scripts/dev/record-escrow-bilateral-experience-l5-evidence.sh
```

末行：`TT_ESCROW_BILATERAL_EXPERIENCE_L5_EVIDENCE: OK`

---

## 互指

| 读者 | 文档 |
|------|------|
| Guide Workbench Inbox L5 | [GUIDE-WORKBENCH-INBOX-L5-FREEZE](../GO_local_guide_workbench_l5/GUIDE-WORKBENCH-INBOX-L5-FREEZE.md) |
| 种子双链 | [SEED-MAIN-CHAIN-CLARITY-FREEZE](./SEED-MAIN-CHAIN-CLARITY-FREEZE.md) |
| Escrow 草稿体验 | [ESCROW-DRAFT-EXPERIENCE-FREEZE](./ESCROW-DRAFT-EXPERIENCE-FREEZE.md) |
| Agent | `AGENTS.md` |
