# TT-B410 · B-410 — 用户主路径 E2E 与订单状态机统一闸

**母表**：[B-410](../任务母表.md)  
**卡号**：`TT-B410-USER-FLOW-E2E-ORDER-STATE-UNIFIED-001`  
**状态**：已封口（2026-04-16）

---

## 1. 目的（摘要）

把 **旅行者 / 向导** 视角 **订 → 接 → 托管 → 支付 → 终态** 与 **[B-409](./TT-B409-ORDER-STATE-MACHINE-CHAIN-OFF-53-001.md)** **状态机 SSOT** 对齐；**机读闸**串联 **`b409-*`** acceptance，可选 Playwright。

---

## 2. 一键机读

```bash
bash scripts/ops/b410-user-flow-e2e-gate.sh
# 可选：本机已起 API+前端且装好 frontend 依赖时
# B410_RUN_PLAYWRIGHT=1 bash scripts/ops/b410-user-flow-e2e-gate.sh
```

**内含**：`scripts/ops/b409-order-state-primary-acceptance.sh` + `scripts/ops/b409-order-state-exception-acceptance.sh`（与 **[ops/RUNBOOK.md](../../ops/RUNBOOK.md)**、**[scripts/README.md](../../scripts/README.md)** 一致）。

---

## 3. 互证

- **[B-409](./TT-B409-ORDER-STATE-MACHINE-CHAIN-OFF-53-001.md)**、**[spec/53](../spec/53-阶段开发技术文档.md)**、**[spec/13-1](../spec/13-1-UI产品级SSOT与页面规范.md)**  
- **[evidence/README.md](../../evidence/README.md#b410-user-flow-e2e-gate)**  
- **GO 十卡总册**（并行）：[TT-GO-CLOSELOOP-10-B418-B427-001.md](./TT-GO-CLOSELOOP-10-B418-B427-001.md)
