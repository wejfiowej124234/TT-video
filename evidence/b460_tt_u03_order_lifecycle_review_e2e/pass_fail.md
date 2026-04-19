# B-460 / TT-U03 · 订单生命周期 + 评价（收口）

**日期**：2026-04-17（本地 Windows / Git Bash）  
**单一封口（发布级）**：[`TT-B473`](../../docs/runbook/TT-B473-SEAL-B460-TT-U03-001.md) **`bash scripts/ops/b473-seal-b460-tt-u03.sh`** **→** **`evidence/b473_seal_b460_tt_u03/seal-run.log`**

## 结论

| 项 | 结果 |
|----|------|
| `bash scripts/ops/b410-user-flow-e2e-gate.sh` | **PASS**（exit 0；见同目录 `b410_stderr.txt`） |
| `cargo test -p traveltrust-api b449_` | **PASS**（4 tests） |
| `cargo test -p traveltrust-api b451_` | **PASS**（3 tests） |
| Playwright §1.2：`p02`–`p05`（chromium，`--workers=1`，`PLAYWRIGHT_FULL_STACK=1`） | **PASS**（4 passed） |
| 补充：`e2e/epic-f-normal-release-real.spec.ts`（下单 → 接单 → mock-pay → confirm-completion → completed） | **PASS**（1 passed；覆盖 Runbook 支付/托管/完成确认 REST 链，与 `p05` 声明不覆盖 P06 入金相补） |

**评价提交**：本轮回归以 **B-449 / B-451 契约测试**为「POST …/reviews」机读验收（与 `docs/runbook/TT-U03-ORDER-LIFECYCLE-COMPLETE-REVIEW-E2E-001.md` §1.3 一致）；未单独跑独立 UI 评价单测。

## 运行命令（可复现）

```bash
# 机读门禁
bash scripts/ops/b410-user-flow-e2e-gate.sh > evidence/b460_tt_u03_order_lifecycle_review_e2e/b410_stderr.txt 2>&1

cargo test -p traveltrust-api b449_ --quiet
cargo test -p traveltrust-api b451_ --quiet
```

```bash
cd frontend && export PLAYWRIGHT_FULL_STACK=1 && export PLAYWRIGHT_REUSE_API_SERVER=0 \
  && npx playwright test \
    e2e/p02-tourist-order-create-list.spec.ts \
    e2e/p03-tourist-guide-accept.spec.ts \
    e2e/p04-bilateral-confirm.spec.ts \
    e2e/p05-confirm-final-escrow.spec.ts \
    --project=chromium --workers=1
```

```bash
cd frontend && export PLAYWRIGHT_FULL_STACK=1 && export PLAYWRIGHT_REUSE_API_SERVER=0 \
  && npx playwright test e2e/epic-f-normal-release-real.spec.ts --project=chromium --workers=1
```

## 本轮工程侧要点（防假红）

1. **种子向导 `guide_id`**：以 `guide@test` → `GET /api/v1/me` → `guide.id` 为 SSOT（`e2e/helpers/guideSeedGuideRowId.ts`）；`GET /api/v1/guides` 的 `items[0]` 在多向导 + DB hydrate 下不可靠。
2. **`guide_has_active_order`（409）**：hydrate 后 Accepted/Escrowed 占位时 `POST /orders` 失败；E2E 在 seed 后调用 `releaseSeedGuideSlotIfBlocked`（`e2e/helpers/releaseSeedGuideSlot.ts`）：accepted 等可取消态 → `cancel`；escrowed → `confirm-completion` 释放档期。
3. **限流 429**：全栈 E2E 单客户端高频请求易触达 `API_RATE_LIMIT_PER_MINUTE` / `CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE`；Playwright 专用 API 启动脚本 `scripts/dev/start-api-for-playwright.{sh,ps1}` 默认将二者设为 **0**（关闭），可在环境中覆盖为非 0。
4. **p05**：去掉对 `/escrow/:id` 的冗余 `reload()`，并对 `#escrow-after-final-plan` 使用 **30s** 等待，避免骨架屏与默认 5s 断言竞态。

## §1.3 表（Runbook）

| 检查项 | 勾选 |
|--------|------|
| 主成功链状态与 `GET /api/v1/orders/:id` 一致 | ☑ |
| `POST …/confirm-completion` / 评分 / 释放顺序符合 53 / Runbook（Epic F + 契约） | ☑ |
| 资金终态后 `POST …/reviews` 可成功（契约 `b449_` / `b451_` 绿） | ☑ |
| `b410-user-flow-e2e-gate` exit 0 | ☑ |
| `cargo test -p traveltrust-api b449_` / `b451_` | ☑ |
