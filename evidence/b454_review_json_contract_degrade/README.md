# B-454 · `review_json_contract_degrade` 证据包目录

用于存放自 **埋点 / 日志管线** 导出的 **`review_json_contract_degrade`** 事件样本及 **`replay-b454-review-json-contract-degrade-evidence.py`** 生成的 **`replay_summary.json`**，作为灰度放量与回滚决策的**可审计依据**。

## 布局（建议）

| 路径 | 说明 |
|------|------|
| `fixtures/sample_events.ndjson` | 仓库内**样例**（与 **`frontend/lib/analytics.ts`** payload 字段一致） |
| `run_<UTC>/events.ndjson` | 某次发布后从观测系统导出的原始 NDJSON（**不落密钥**；仅业务允许字段） |
| `run_<UTC>/replay_summary.json` | 同目录下执行回放脚本生成的汇总 |

## 回放

```bash
python scripts/gates/replay-b454-review-json-contract-degrade-evidence.py \
  evidence/b454_review_json_contract_degrade/fixtures/sample_events.ndjson
```

人读 Runbook：**[TT-B454](../../docs/runbook/TT-B454-REVIEW-JSON-CONTRACT-DEGRADE-EVIDENCE-REPLAY-001.md)**。
