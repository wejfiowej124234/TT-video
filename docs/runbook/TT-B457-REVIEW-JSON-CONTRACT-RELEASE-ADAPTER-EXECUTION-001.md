# TT-B457-REVIEW-JSON-CONTRACT-RELEASE-ADAPTER-EXECUTION-001 · **B-456** **release controller** **真实执行器适配层** **与** **回执证据**

**母表**：[B-457](../任务母表.md)

**前置**：**[TT-B456](./TT-B456-REVIEW-JSON-CONTRACT-RELEASE-CONTROLLER-001.md)**（**B-456**）**`GITHUB_OUTPUT`** **`should_*`** **；** **`config/b457_review_json_contract_release_adapters.json`** **。**

**本卡** **将** **占位** **PROMOTE** **/** **FREEZE** **/** **ROLLBACK** **升级为** **可** **配置** **的** **三类** **适配器** **（** **Feature** **Flag** **/** **部署** **dispatch** **/** **ChatOps** **Slack** **incoming** **）** **与** **统一** **回执** **`execution_receipt.json`** **（** **可** **审计** **）** **。**

---

## §1 · 验收（封口条件）

```bash
python scripts/gates/check-b457-review-json-contract-release-adapter-gate.py
bash scripts/run-check-04-routes.sh
```

```bash
python scripts/ops/release-adapter-layer-b457-review-json-contract.py \
  --verdict GREEN \
  --evidence-dir evidence/b457_release_controller_executions/local_smoke
```

---

## §2 · 环境变量（真值只放在 CI/密钥管理；仓库内仅登记名）

| 变量 | 用途 |
|------|------|
| **`TRAVELTRUST_ADMIN_API_BASE_URL`** | **Feature** **Flag** **（** **`admin_http_json`** **）** **根** **URL** |
| **`TRAVELTRUST_ADMIN_API_BEARER`** | **可选** **：** **Admin** **API** **Bearer** |
| **`TRAVELTRUST_DEPLOY_DISPATCH_URL`** | **部署** **平台** **Webhook** **（** **`dispatch_webhook`** **）** |
| **`TRAVELTRUST_DEPLOY_DISPATCH_HEADERS_JSON`** | **可选** **：** **额外** **HTTP** **头** **JSON** |
| **`TRAVELTRUST_CHATOPS_SLACK_WEBHOOK_URL`** | **Slack** **incoming** **（** **ChatOps** **通知** **）** |

---

## §3 · ChatOps 回滚指令

- **RED** **路径** **下** **`chatops_notify_rollback`** **模板** **默认** **含** **「执行** **Runbook** **§3」** **提示** **；** **运维** **在** **频道** **内** **按** **本** **节** **完成** **人工** **确认** **后** **再** **触发** **真实** **回滚** **流水线** **（** **与** **`--execute`** **双** **因子** **）** **。**
- **建议** **：** **RED** **先** **仅** **发** **ChatOps** **+** **冻结** **Flag** **；** **生产** **回滚** **须** **双人** **复核** **。**

---

## §4 · 非目标

- **不** **在** **公有** **仓** **存放** **Webhook** **URL** **/** **Token** **。**
- **不** **修改** **B-455** **阈值** **语义** **或** **B-456** **裁决** **逻辑** **（** **本** **卡** **仅** **适配** **与** **回执** **）** **。**

---

**文档版本**：1.0 · 2026-04-17
