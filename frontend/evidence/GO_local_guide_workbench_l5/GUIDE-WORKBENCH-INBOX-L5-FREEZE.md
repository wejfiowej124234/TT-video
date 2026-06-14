# Guide Workbench Inbox L5 · ① 本地冻结（2026-06-09）

**阶段：① 本地** — `/guide` 首屏「谁预约了我」收件箱（待接单 / 今日待处理 / 进入订单）+ 双角色浏览器证据；**不**表示 ② 测试网 / ③ 生产 GO。

**全页冻结（超集）：** [GUIDE-WORKBENCH-L5-FREEZE.md](./GUIDE-WORKBENCH-L5-FREEZE.md)（2026-06-12）

**代码真源：** `frontend/components/guide/GuideWorkbenchInboxCard.tsx` · `frontend/lib/guide/guideWorkbenchInboxModel.ts` · `frontend/e2e/guide-workbench-inbox-l5.spec.ts`

---

## 冻结结论（ACTIVE）

| 项 | 状态 |
|----|------|
| **首屏收件箱** | `data-tt-guide-workbench-inbox="1"` · 待接单 N · 今日待处理 · 进入订单 |
| **联调链** | **B** `tourist@test.com` + `guide@test.com`（与 [测试账号文档](../../../docs/测试账号与本地联调.md) §二 同源） |
| **双角色走廊** | 游客浏览器绑定向导 → 向导 `/guide` 待接单 1 → 接单 → 双边确认 |
| **冻结日** | **2026-06-09** |

**维护期纪律：** 仅允许 bugfix · 数据链/i18n/a11y · 门闸；**禁止**移除收件箱首屏位或削弱 Playwright 双角色断言。

---

## 机读验收

```bash
bash scripts/dev/record-guide-workbench-l5-evidence.sh
```

末行：`TT_GUIDE_WORKBENCH_L5_EVIDENCE: OK`（含收件箱双角色走廊）

---

## 互指

| 读者 | 文档 |
|------|------|
| 种子双链 | [SEED-MAIN-CHAIN-CLARITY-FREEZE](../GO_local_web3_itinerary_l5/SEED-MAIN-CHAIN-CLARITY-FREEZE.md) |
| P03/P04 绑单 | `escrow-p03-p04-itinerary-first.spec.ts` |
| Agent | `AGENTS.md` |
