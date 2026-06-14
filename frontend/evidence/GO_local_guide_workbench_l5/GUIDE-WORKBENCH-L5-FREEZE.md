# Guide Workbench L5 · ① 本地全页冻结（2026-06-12）

**阶段：① 本地** — `/guide` 向导工作台全页（收件箱 · 市场曝光 · 档期摘要 · 经营统计；**准入 SSOT** 在 `/me/settings/trust`）+ 双角色浏览器证据；**不**表示 ② 测试网 / ③ 生产 GO。

**代码真源：** `frontend/app/guide/page.tsx` · `frontend/components/guide/GuideWorkbench*.tsx` · `frontend/lib/guide/guideWorkbenchL5ClosureSprintModel.ts`

**收件箱子域：** [GUIDE-WORKBENCH-INBOX-L5-FREEZE.md](./GUIDE-WORKBENCH-INBOX-L5-FREEZE.md)（2026-06-09 · 仍为 ACTIVE 子集）

---

## 冻结结论（ACTIVE）

| 项 | 状态 |
|----|------|
| **全页 UI** | `data-tt-guide-workspace-page="1"` · `data-tt-ui-frozen=guide-workbench-l5-20260612` |
| **收件箱** | 首屏 · 待接单 / 今日待处理 / 进入订单（已冻结子域） |
| **挂牌摘要** | GuideCard `previewOnly` · public_title 轻提示 · 链 settings / `/guides/{id}` |
| **信任/KYC SSOT** | `/me/settings/trust`（工作台不含完整门闸卡） |
| **身份质押门闸** | 顶区单卡 `GuideWorkbenchStakingGateCard`（未质押 / 不足 MIN / 已满足薄条；阻塞时市场曝光整段隐藏、占位仅门闸卡底 · [GUIDE-ONBOARDING-STAKING-FLOW](../../lib/guide/GUIDE-ONBOARDING-STAKING-FLOW.md)） |
| **退出申请** | `GuideWorkbenchExitRequestCard` 默认收起 · 置于统计区之后 / 底栏之前 |
| **底栏交叉链** | `GuideWorkbenchL5CrossNav`（质押门闸时隐藏准入链；与 `/provider` 对称） |
| **收件箱空态** | 虚线框短文案；质押/准入 CTA 仅在顶部门闸卡 |
| **链上质押摘要** | 已连钱包 · 合入 `GuideWorkbenchStakingGateCard` below_min 态（`stakeOf` / `MIN_STAKE` · ① 非 ② 强一致） |
| **订单走廊** | `GET /orders?hat=guide` 服务端 `guide_id` 过滤 + 收件箱同源 |
| **档期摘要** | `GET …/guides/:id/availability` 只读 · 链公开市场 `#guide-availability` |
| **经营统计** | U4 新向导折叠 · `StatsTeaser` 首单后展开锚点 |
| **联调链** | **B** `tourist@test.com` + `guide@test.com` |
| **冻结日** | **2026-06-12** |

**维护期纪律：** 仅允许 bugfix · 数据链/i18n/a11y · 门闸；**禁止**五主路由式外的 **页面结构 / layout token** 回流（本页非五主，但同等 L5 冻结纪律）。

**诚实边界：** ② 真环境接单 SLA · ③ 生产级报表 **未**纳入本冻结。

---

## 机读验收

```bash
bash scripts/dev/record-guide-workbench-l5-evidence.sh
```

末行：`TT_GUIDE_WORKBENCH_L5_EVIDENCE: OK`

---

## 互指

| 读者 | 文档 |
|------|------|
| 收件箱子域 | [GUIDE-WORKBENCH-INBOX-L5-FREEZE.md](./GUIDE-WORKBENCH-INBOX-L5-FREEZE.md) |
| 向导资料 settings | `frontend/app/me/identities/guide/settings/README.md` |
| 向导详情档期 | `frontend/app/guides/[id]/README.md` |
| Agent | `AGENTS.md` |
