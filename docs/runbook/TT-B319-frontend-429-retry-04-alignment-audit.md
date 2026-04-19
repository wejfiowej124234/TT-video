# TT-B319 · frontend 429 重试与 04 对齐审计

**卡号**：`TT-B319-FRONTEND-429-RETRY-04-ALIGNMENT-001`  
**母表**：`B-319`  
**日期**：2026-04-15  
**范围**：仅文档/台账/索引（docs-only）；不改实现。

## 本轮仅读文件（<=8）

1. `docs/任务母表.md`
2. `docs/AI任务卡索引.from-stash.md`
3. `docs/AI任务卡索引.md`
4. `docs/spec/04-后端与API.md`
5. `docs/spec/53-阶段开发技术文档.md`
6. `docs/spec/13-1-UI产品级SSOT与页面规范.md`

## 审计目标

- 对齐前端 429/限流错误处理叙事与 `04` 错误契约；
- 对齐 `53` 的“失败可恢复 + 退避/重试”UX 约束；
- 对齐 `13-1` 的异常态与错误文案映射纪律。

## 审计结论

- `04` 已明确 429 机器键与错误信封语义：`rate_limit_exceeded` / `critical_write_rate_limit_exceeded`，并要求前端错误区可恢复。
- `53` 已明确失败后要有错误区与重试动作，且推荐“请求过频请稍后重试”的统一文案。
- `13-1` 已明确异常态必须覆盖，社区写操作（含 HTTP 429）需机器键映射到 i18n 文案，禁止裸显后端键名。
- 结论：B-319 采用 docs-only 封口，补“退避/错误包说明”登记即可，不需改实现。

## 最小对齐说明（登记项）

- **契约层（04）**：以 `error/message/detail` 机器键语义为准，429 不自造第二套错误码。
- **交互层（53）**：失败态必须可恢复（重试/返回），不得静默失败。
- **页面层（13-1）**：异常态组件统一 i18n 映射；429 文案和交互在路由间保持一致口径。

## 封口登记

- Runbook：`docs/runbook/TT-B319-frontend-429-retry-04-alignment-audit.md`
- 母表：`B-319` 标记 docs-only 已做
- from-stash：`TT-B319-FRONTEND-429-RETRY-04-ALIGNMENT-001` 标记已封口并挂接本 runbook
