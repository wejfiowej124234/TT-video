# Phase ② · Staging UI Real User Sprint（ACTIVE）

**阶段：② 测试网 / staging UI** — **非** ③ Production GO

**前置：**

- [PHASE2-START-CHECKLIST-SPRINT](../GO_phase2_start_checklist_sprint/PHASE2-START-CHECKLIST-SPRINT-FREEZE.md) · `TT_PHASE2_G0_G4_ADMISSION: CLEAR`
- [PHASE2-TESTNET-EXECUTION-SPRINT](../GO_phase2_testnet_execution_sprint/PHASE2-TESTNET-EXECUTION-SPRINT-FREEZE.md) · API 10 步走廊

**Web：** `https://tt-web-staging.fly.dev` · **API：** `https://tt-api-staging.fly.dev`

---

## 冻结结论（ACTIVE · 9 步浏览器全链）

| 项 | 状态 |
|----|------|
| **全链** | 注册 → 入驻+质押 → 预约绑定 → 接单 → 双边 → 终版 → mock-pay → 完成 → 评价 |
| **账号** | 全新 `@traveltrust.testnet` · **禁止** seed / `@test.com` |
| **权威证据** | 首跑后写入 `PHASE2-STAGING-UI-REAL-USER-SPRINT-{UTC}.log` |
| **分步证据** | `steps-{UTC}/`（每步 `STATUS.txt` + `rollback.md`） |
| **Closing Gap** | `CLOSING-GAP-CHECKLIST-{UTC}.md` |
| **机读 OK** | `TT_PHASE2_STAGING_UI_REAL_USER_SPRINT_EVIDENCE: OK {UTC}` |

---

## 全链 9 步（Playwright · 每步证据包 + rollback.md）

| Step | 链路 | 证据子目录 |
|------|------|------------|
| S01 | 真实用户 UI 注册（游客+向导） | `S01-register/` |
| S02 | 向导入驻 + 质押 | `S02-guide-onboard/` |
| S03 | 首页行程 · 发布 · 市场绑定 | `S03-book/` |
| S04 | 向导接单 | `S04-accept/` |
| S05 | 双边确认 | `S05-bilateral/` |
| S06 | 终版 snapshot | `S06-final-plan/` |
| S07 | **支付沙箱** · mock-pay UI | `S07-payment-sandbox/` |
| S08 | 向导确认完成 | `S08-complete/` |
| S09 | 游客评价 | `S09-review/` |

**诚实边界：**

- S07 = chain_off **mock-pay**（**② 沙箱**）· **≠** Stripe live · **≠** WEB3-P2-003 真 USDC `/pay`
- **无** 全链上 createEscrow+deposit（B-407 · API sprint S08 另轨）
- **② staging UI PASS ≠ ③ Production GO**

---

## 机读验收

```bash
bash scripts/dev/record-phase2-staging-ui-real-user-sprint-evidence.sh
```

末行：`TT_PHASE2_STAGING_UI_REAL_USER_SPRINT_EVIDENCE: OK`

---

## 回滚 SSOT

[COMMUNITY-STAGING-OPS-RUNBOOK §13](../../../docs/runbook/COMMUNITY-STAGING-OPS-RUNBOOK.md)

每步 `rollback.md` 含 **Probe** 与 **Rollback**（运维 playbook 引用）。

---

## 互指

| 读者 | 文档 |
|------|------|
| ① Real User UI | [REAL-USER-ACCEPTANCE-SPRINT-FREEZE](../GO_local_real_user_acceptance/REAL-USER-ACCEPTANCE-SPRINT-FREEZE.md) |
| ② API 全链 | [PHASE2-TESTNET-EXECUTION-SPRINT-FREEZE](../GO_phase2_testnet_execution_sprint/PHASE2-TESTNET-EXECUTION-SPRINT-FREEZE.md) |
| 宽轨 Closing Gap | [PHASE2-CLOSING-GAP.md](../../../docs/runbook/PHASE2-CLOSING-GAP.md) |
| 机读模型 | `frontend/lib/phase2/phase2StagingUiRealUserSprintModel.ts` |
