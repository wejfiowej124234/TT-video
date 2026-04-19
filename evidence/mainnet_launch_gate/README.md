# Mainnet launch gate · 证据与脚本（TT-MAINNET §0）

| 路径 | 说明 |
|------|------|
| [`scripts/gates/check-mainnet-launch-precheck-gate.sh`](../../scripts/gates/check-mainnet-launch-precheck-gate.sh) | **G0～G6 + SL**：**`${MAINNET_EVIDENCE_RUN_DIR}/shadow_go_no_go.json`** **`shadow_launch_verdict=="GO"`**；**`MAINNET_LAUNCH_PRECHECK=1`** **且** **`CHAIN_ID=1`** 时强制执行 |
| `G6_no_rollback_ack.template.md` | G6 模板；**复制为** `G6_no_rollback_ack.md` **并填写签收**（**勿** **直接** **指向** **template** **过闸**） |
| `G2_smoke.example.json` | G2 字段示例；**真实** **`MAINNET_G2_EVIDENCE_JSON`** **须** **含** **`"g2_gate":"GO"`** **与** **运维** **时间戳** |
| **[`mainnet_shadow_launch/`](../mainnet_shadow_launch/README.md)** | **§0 SL**：**影子** **全链路** **`run_<UTC>/`** **+** **`shadow_go_no_go.json`** **→** **正式** **主网** **最终** **Go/No-Go** |

**合并阻断**：[`broadcast-batch-blockers.yml`](../../.github/workflows/broadcast-batch-blockers.yml) **`TT-MAINNET G0–G6+SL (CHAIN_ID=1)`**：**无** **`MAINNET_CHAIN_RPC_URL`** **→** **job** **fail**（**P0** **禁止假绿**）；**已配** **`MAINNET_*`** **→** **`CHAIN_ID=1`** **全量**。**必过** **checks** **与** **变量** **`MAINNET_GATE_ALLOW_ABSENT_RPC`** **见** **[TT-MAINNET §7](../../docs/runbook/TT-MAINNET-LAUNCH-PRECHECK-AFTER-B435-001.md#7-ci-机读门禁g0g6)**。**冻结** **`Full GO`** **后** **：** **新** **`run_<UTC>/` + G0～G6 + SL** **全** **GO** **须** **接入** **CI** **与** **部署** **流水线** **，** **未** **满足** **一律** **自动** **阻断** **发布** **（** **§7** **「** **迭代期** **」** **）** **。**

**辅助**：[`mainnet-launch-precheck-gate.yml`](../../.github/workflows/mainnet-launch-precheck-gate.yml)（**push** **仅** **语法**；**`workflow_dispatch`** **可** **手动全量**）。
