# TT-B315 · 53 订单终端态 vs Escrow SSOT 对照审计

**卡号**：`TT-B315-53-ORDER-TERMINAL-VS-ESCROW-SSOT-001` · **母表** `B-315`  
**日期**：2026-04-15  
**范围**：仅文档/台账/索引（docs-only）；不改 `crates/**`、不改 API/合约实现。

## 本轮仅读文件清单（<=8）

1. `docs/任务母表.md`
2. `docs/AI任务卡索引.from-stash.md`
3. `docs/AI任务卡索引.md`
4. `docs/spec/53-阶段开发技术文档.md`
5. `docs/spec/04-后端与API.md`
6. `docs/spec/14-合约-API-ABI-前后端对齐.md`

## 审计结论

- `53`、`04`、`14` 在“订单主状态”和“Escrow 资金终态”边界上总体同轨。
- 争议后资金终态（`Refunded/PartiallyRefunded/Slashed/Completed`）在三份文档中语义一致，未发现 Happy Path 实现改造需求。
- `POST /api/v1/orders/:id/confirm-completion` 已在 `04` 明确为链下进度确认，非单笔放款动作。
- 本卡按“先审计后登记”执行，执行结果为 docs-only 封口。

## 登记

- Runbook：`docs/runbook/TT-B315-53-order-terminal-vs-escrow-ssot-audit.md`
- 母表：`B-315` 更新为已做（docs-only 审计封口）
- 索引：`TT-B315-53-ORDER-TERMINAL-VS-ESCROW-SSOT-001` 更新为已封口并挂接本 runbook
