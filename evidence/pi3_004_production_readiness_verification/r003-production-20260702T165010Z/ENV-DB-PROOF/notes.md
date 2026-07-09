## R-003 · 铁律① DB 持久化佐证（须人工补全）

本目录机读片段见 `phase0_notes.autofill.json`。**首轮 staging 合格交付**要求：至少一条写路径在 **PostgreSQL** 上可二次验证（`sessions` / `orders` / `order_messages` / `users` 等与响应对齐）。

**执行人请追加**（脱敏）：

- 使用的查询或审计路径；
- 与 `phase2/b_domain_chain.redacted.json` 中 `order_id`（若存在）对齐的结论。

- **api_base（本脚本）**：`https://tt-api-prod.fly.dev`
