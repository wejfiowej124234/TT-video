# TT-B427 · B-427 — GO 闭环：订单业务 E2E（01 / 03 / 53）

**母表**：[B-427](../任务母表.md)  
**卡号**：`TT-B427-GO-BIZ-ORDER-E2E-01353-001`  
**状态**：已封口（2026-04-16）

---

## 1. 验收封口

**机读单一入口**：`bash scripts/check-order-e2e-01353-gate.sh`（可 `--json`，schema **`traveltrust.order_e2e_01353_gate.v1`**；可选 **`B427_SKIP_CARGO=1`** 离线条文）。

**内含 / 一致叙事**：`scripts/ops/b409-order-state-primary-acceptance.sh` + `scripts/ops/b409-order-state-exception-acceptance.sh`（与 **[TT-B409](./TT-B409-ORDER-STATE-MACHINE-CHAIN-OFF-53-001.md)** / **[TT-B410](./TT-B410-USER-FLOW-E2E-ORDER-STATE-UNIFIED-001.md)** 对齐）。

---

## 2. 互证

- **[spec/01](../spec/01-总库总览.md)** · **[spec/53](../spec/53-阶段开发技术文档.md)** · **[ops/RUNBOOK.md](../../ops/RUNBOOK.md)**  
- **GO 总册**：[TT-GO-CLOSELOOP-10-B418-B427-001.md](./TT-GO-CLOSELOOP-10-B418-B427-001.md#b-427--tt-b427-go-biz-order-e2e-01353-001)
