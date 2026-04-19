# TT-B316 · 14 ABI forge 同步防 drift 审计与提示

**卡号**：`TT-B316-14-ABI-FORGE-SYNC-ANTI-DRIFT-HINT-001`  
**母表**：`B-316`  
**日期**：2026-04-15  
**范围**：仅文档/台账/索引（docs-only），不改实现。

## 本轮仅读文件（<=8）

1. `docs/任务母表.md`
2. `docs/AI任务卡索引.from-stash.md`
3. `docs/AI任务卡索引.md`
4. `docs/spec/14-合约-API-ABI-前后端对齐.md`
5. `docs/spec/04-后端与API.md`
6. `docs/07-开发流程与顺序.md`

## 审计结论

- `14` 已明确 ABI 放置与同步路径：`contracts/abi` 为单源，`frontend/dapp/abis` 同步并受检查约束。
- `14` 已明确运维/PR 有序清单入口：`ops/RUNBOOK.md` §12.4（`sync-abi-from-forge` -> `check-55-s13` -> Contract ABI Gate）。
- `04` 与 `14` 已建立互指关系，当前无新增 API/ABI 契约差分需要改代码。
- 结论：B-316 采用 docs-only 审计封口，落地“流程提示 + 可选 hook 文案建议”即可。

## 建议文案（不改脚本语义）

- **默认顺序**：先执行 `sync-abi-from-forge`，再执行 ABI 一致性检查，再执行路由/契约门禁。
- **可选本地 hook 提示**：在 pre-commit 或 pre-push 增加“若 `contracts/src/**` 变更则提示执行 ABI 同步与校验”的提示文案（仅提示，不阻塞）。
- **边界**：本卡不引入新 gate，不修改现有脚本判定，不改合约/API/前端实现。

## 封口登记

- Runbook：`docs/runbook/TT-B316-14-abi-forge-sync-anti-drift-hint.md`
- 母表：`B-316` 标记 docs-only 已做
- from-stash：`TT-B316-14-ABI-FORGE-SYNC-ANTI-DRIFT-HINT-001` 标记已封口并挂接本 runbook
