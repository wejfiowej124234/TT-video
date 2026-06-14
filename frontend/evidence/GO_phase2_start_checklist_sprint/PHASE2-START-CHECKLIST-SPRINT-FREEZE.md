# PHASE2-START-CHECKLIST-SPRINT · ② 准入清点（2026-06-10 · ACTIVE）

**阶段口径：** ① 本地 → **② 测试网** → ③ 公网/生产（**禁止跳阶**）

**① 冻结 SSOT：** [PHASE1-ALL-EVIDENCE-STATE-MACHINE-FREEZE.md](./PHASE1-ALL-EVIDENCE-STATE-MACHINE-FREEZE.md)

**G 闸 SSOT：** [PHASE2-START-CHECKLIST.md](../../../docs/runbook/PHASE2-START-CHECKLIST.md)

---

## 冻结结论（ACTIVE · G-0～G-4 CLEAR）

| 项 | 状态 |
|----|------|
| **① 证据/状态机** | **已冻结** · 见 PHASE1-ALL-EVIDENCE 文档 |
| **G-0～G-4** | **全部 PASS** · `TT_PHASE2_G0_G4_ADMISSION: CLEAR` |
| **冻结日** | **2026-06-10** |
| **权威证据** | [`PHASE2-START-CHECKLIST-SPRINT-20260610T000230Z.log`](./PHASE2-START-CHECKLIST-SPRINT-20260610T000230Z.log) |
| **清点表** | [`G0-G4-INVENTORY-20260610T000230Z.md`](./G0-G4-INVENTORY-20260610T000230Z.md) |
| **机读 OK** | `TT_PHASE2_START_CHECKLIST_SPRINT_EVIDENCE: OK 20260610T000230Z` |

**② 测试网：** G-0～G-4 已清闸 — **允许** 按书面 scope 实施 ②（**仍 ≠** ③ Production GO）。

---

## 纪律（写死）

| 规则 | 说明 |
|------|------|
| **未完成 G-0～G-4** | **禁止** 启动 ② 测试网实施（Stripe 出网 · staging 真收单 · 合约 broadcast · 链上 stake 新开工） |
| **G-0～G-4 CLEAR** | **允许** ② 测试网按书面 scope 实施 · **仍 ≠** ③ Production GO |
| **清点维度** | 环境 · 数据 · 部署 · 监控 · 支付 · 链路 · 回滚 |

---

## G-0～G-4 映射（清点表）

| Gate | 维度覆盖 | 机读入口 |
|------|----------|----------|
| **G-0** | ① 总验收 · 数据（acceptance logs · Real User 锚） | `acceptance.latest.log` · `record-go-local-phase1-acceptance-log.sh` |
| **G-1** | 环境 · 数据（PG/Stripe 隔离） | [PHASE2-G1-ENV-ISOLATION-DECISION.md](../../../docs/runbook/PHASE2-G1-ENV-ISOLATION-DECISION.md) · `.env.staging-*` |
| **G-2** | 部署 · 监控 · 链路 · 回滚 | `check-phase2-onboarding-staging-ready.sh` · [COMMUNITY-STAGING-OPS-RUNBOOK.md](../../../docs/runbook/COMMUNITY-STAGING-OPS-RUNBOOK.md) |
| **G-3** | 环境（书面 scope ② ≠ ③） | 本文 + START-CHECKLIST |
| **G-4** | 支付（非零 amount · 无 local-dev） | staging env + `closing-gap/G4-stripe-g4/` |

---

## 机读验收

```bash
bash scripts/dev/record-phase2-start-checklist-sprint-evidence.sh
```

**Step A：** `npx vitest run lib/phase2/phase2StartChecklistSprint.contract.test.ts`  
**Step B～E：** ① 锚点 · G-1 文件 · `check-phase2-onboarding-staging-ready.sh` · 扩展维度 inventory

**成功末行：**

- `TT_PHASE2_G0_G4_ADMISSION: CLEAR`
- `TT_PHASE2_START_CHECKLIST_SPRINT_EVIDENCE: OK`

**失败：** `TT_PHASE2_G0_G4_ADMISSION: BLOCKED` — **禁止** 启动 ② 测试网

---

## 互指

| 读者 | 文档 |
|------|------|
| 目录 | [README.md](./README.md) |
| 仓库总态 | [PHASE2-REPOSITORY-STATUS.md](../../../docs/runbook/PHASE2-REPOSITORY-STATUS.md) |
| 宽 ② Closing Gap | [PHASE2-CLOSING-GAP.md](../../../docs/runbook/PHASE2-CLOSING-GAP.md) |
| 机读模型 | `frontend/lib/phase2/phase2StartChecklistSprintModel.ts` |
