# LOCAL_PREPROD_RETURN_FLOW

本文件定义「本地启动 + 准生产级回流」最小闭环，覆盖 P0/P1/P2。

## 1) 前置准备

- 复制 `.env.preprod.local.example` 到项目根 `.env`，并替换真实值。
- 确认 Docker Desktop 运行正常。
- 确认你本机可访问 `CHAIN_RPC_URL`；邮件侧 **`traveltrust-api` 仅 `resend`/`log`/`off`**（见根 `.env.example`），准生产回流脚本要求 **`TRAVELTRUST_EMAIL_TRANSPORT=resend`** 且 **`TRAVELTRUST_RESEND_*`** 已填（非 SMTP）。
- 若要跑 P2 实操，确保 `.env` 里 `PRIVATE_KEY` 已配置且测试网地址有 gas。

## 2) 必填配置清单

- **P0（强制）**
  - `TRAVELTRUST_DEPLOYMENT_PROFILE=production`
  - `TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS=1`
  - `STRICT_SESSION_GATE=1`
  - `INTERNAL_API_SECRET` 非空
  - `CORS_ORIGINS` 非空且受限
  - `DATABASE_URL` 可连通
- **P1（强烈建议）**
  - `TRAVELTRUST_EMAIL_TRANSPORT=resend`（非 `log` / `off`）；**`TRAVELTRUST_RESEND_API_KEY`**、**`TRAVELTRUST_RESEND_FROM`** 非占位（**`from` 不读 `TRAVELTRUST_EMAIL_FROM`**）
  - `TRAVELTRUST_AUTH_TOKEN_PEPPER` 有效
  - `CHAIN_RPC_URL` / `CHAIN_ID` / 合约地址齐全
- **P2（链上执行）**
  - `PRIVATE_KEY`（仅本地测试用）

## 3) 一键验收脚本（推荐）

项目根执行：

```bash
bash scripts/ops/run-local-preprod-return-flow.sh
```

该脚本会按顺序执行：门禁、启动、报告校验、96 编排、状态机、indexer/gov/fee-router 关键 gate、B435 预检。

## 4) 手动命令序列（等价）

```bash
# 1. 基础门禁（全链本地 CI）
bash scripts/ci/run_local_ci.sh

# 2. SQLx / migration 前缀检查
bash scripts/check-sqlx-migration-prefixes.sh

# 3. API / ABI 对齐
bash scripts/check-55-s13.sh

# 4. 路由契约
bash scripts/run-check-04-routes.sh

# 5. 启动本地 API + seed（Windows）
cmd.exe //c scripts\\start-api-with-seed.bat

# 6. 发布回归报告校验
python scripts/validate-regression-report.py evidence/GO_20260425/report.json --require-go

# 7. 96-15 编排（需显式 out-dir）
python scripts/release/run_96_15_orchestration.py \
  --out-dir evidence/GO_20260425/local_preprod_96_15 \
  --executor local-preprod \
  --tier-a1-readme evidence/GO_20260425/RELEASE_SUMMARY_GO_20260425.md \
  --tier-a2-markdown evidence/GO_20260425/RELEASE_SUMMARY_GO_20260425.md \
  --require-tier-a-semiauto

# 8. GO 状态机（建议 tri_state_v2）
python scripts/release/go_state_machine.py \
  --orchestration evidence/GO_20260425/local_preprod_96_15/release_orchestration.json \
  --regression evidence/GO_20260425/report.json \
  --policy tri_state_v2

# 9. indexer lag 门禁
bash scripts/check-indexer-lag-locate-gate.sh

# 10. data reconcile / projection / governance gate
bash scripts/check-data-reconcile-projection-gov-gate.sh

# 11. fee-router smoke（B383）
bash scripts/ops/b383-fee-router-platform-fee-routed-log-count-reconcile-admin-overview-smoke.sh

# 12. B435 preflight
bash scripts/ops/b435-preflight-check.sh
```

## 5) 判定标准

- **P0 全通过**
  - 生产配置三件套生效
  - API 安全约束生效（`INTERNAL_API_SECRET` + `STRICT_SESSION_GATE` + 受限 CORS）
  - DB 迁移成功、`--require-go` 通过
- **P1 全通过**
  - Resend（或等效真实出站）可投递，forgot/reset 链路成功
  - 链上读路径无持续 408
  - reconcile / governance / fee-router gate 通过
- **P2 全通过**
  - 私钥与测试网 gas 就绪
  - stake/payment 实操闭环通过
  - 对应 evidence 与 ops-check 回填完成
