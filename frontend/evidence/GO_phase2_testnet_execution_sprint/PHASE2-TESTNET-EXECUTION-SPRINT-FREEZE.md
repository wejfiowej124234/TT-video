# Phase ② · Testnet Execution Sprint（2026-06-10 · ACTIVE）

**阶段：② 测试网 / staging** — **非** ③ Production GO

**前置：** [PHASE2-START-CHECKLIST-SPRINT](../GO_phase2_start_checklist_sprint/PHASE2-START-CHECKLIST-SPRINT-FREEZE.md) · `TT_PHASE2_G0_G4_ADMISSION: CLEAR`

**API：** `https://tt-api-staging.fly.dev`（Fly staging）

---

## 冻结结论（ACTIVE · 10 步全链 PASS）

| 项 | 状态 |
|----|------|
| **全链** | 注册 → 入驻 → 预约 → 接单 → 双边 → 终版 → mock-pay → Sepolia 就绪 → 完成 → 评价 |
| **冻结日** | **2026-06-10** |
| **权威证据** | [`PHASE2-TESTNET-EXECUTION-SPRINT-20260610T001415Z.log`](./PHASE2-TESTNET-EXECUTION-SPRINT-20260610T001415Z.log) |
| **分步证据** | [`steps-20260610T001415Z/`](./steps-20260610T001415Z/)（每步 `STATUS.txt` + `rollback.md`） |
| **机读 OK** | `TT_PHASE2_TESTNET_EXECUTION_SPRINT_EVIDENCE: OK 20260610T001415Z` |

---

## 全链 10 步（API · 每步证据包 + rollback.md）

| Step | 链路 | 证据子目录 |
|------|------|------------|
| S01 | 真实用户注册（验证码 dev code） | `S01-register/` |
| S02 | 向导入驻 + 质押 | `S02-guide-onboard/` |
| S03 | 行程创单 · 发布 · 绑定向导 · 档期 | `S03-book/` |
| S04 | 向导接单 | `S04-accept/` |
| S05 | 双边确认 | `S05-bilateral/` |
| S06 | 终版 snapshot | `S06-final-plan/` |
| S07 | **支付沙箱** · `mock-pay` → escrowed | `S07-payment-sandbox/` |
| S08 | **测试网** · Sepolia meta + `chain-sync-status` | `S08-chain-testnet/` |
| S09 | 向导确认完成 | `S09-complete/` |
| S10 | 游客评价 | `S10-review/` |

**诚实边界：**

- S07 = chain_off **mock-pay** on staging（**② 沙箱**）· **≠** Stripe live · **≠** WEB3-P2-003 真 USDC `/pay`
- S08 = 链就绪 + HTTP 对拍 · **全链上 createEscrow+deposit** 属 **B-407 / WEB3-P2-003** 另轨

---

## 机读验收

```bash
bash scripts/dev/record-phase2-testnet-execution-sprint-evidence.sh
```

末行：`TT_PHASE2_TESTNET_EXECUTION_SPRINT_EVIDENCE: OK`

---

## 回滚 SSOT

[COMMUNITY-STAGING-OPS-RUNBOOK §13](../../../docs/runbook/COMMUNITY-STAGING-OPS-RUNBOOK.md)

每步 `rollback.md` 含 **Probe**（本 sprint 机读验证）与 **Rollback**（运维 playbook 引用）。

---

## 互指

| 读者 | 文档 |
|------|------|
| ① Real User | [REAL-USER-ACCEPTANCE-SPRINT-FREEZE](../GO_local_real_user_acceptance/REAL-USER-ACCEPTANCE-SPRINT-FREEZE.md) |
| 准入 sprint | [PHASE2-START-CHECKLIST-SPRINT-FREEZE](../GO_phase2_start_checklist_sprint/PHASE2-START-CHECKLIST-SPRINT-FREEZE.md) |
| 机读模型 | `frontend/lib/phase2/phase2TestnetExecutionSprintModel.ts` |
