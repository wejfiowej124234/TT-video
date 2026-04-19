# TT-B435 · Sepolia 全栈资金测试网 · 封口证据包

**UTC 目录**：`run_20260417T003342Z`  
**母表**：`B-435`  
**Runbook**：[docs/runbook/TT-B435-FULLSTACK-FUND-TESTNET-RELEASE-CHAIN-001.md](../../../docs/runbook/TT-B435-FULLSTACK-FUND-TESTNET-RELEASE-CHAIN-001.md)

## 本包内容（最小对拍集）

| 文件 | 说明 |
|------|------|
| `tx_hashes.json` | 链上可验哈希：`deploy_*` 与真实扣款 `first_payment`（Sepolia Explorer 根见内 `explorer_base`） |
| `indexer_tick.json` | `POST /api/v1/internal/indexer-tick` 响应落盘 |
| `reconcile.json` | `POST /api/v1/internal/indexer-reconcile`（`persist:true`）响应落盘 |
| `overview.json` | `GET /api/v1/admin/observability/overview` 响应落盘（admin Bearer；本环境可用 testnet mint） |

**脚本**：仓库根 `bash scripts/ops/b435-evidence-internal-curls.example.sh`（`B435_AUTO_ADMIN_BEARER_MINT=1` 时需运行中 API 开启 `TRAVELTRUST_TESTNET_ADMIN_BEARER_MINT=1`）。

**台账**：母表 **B-435** 状态列引用本目录（见 `docs/任务母表.md`）。
