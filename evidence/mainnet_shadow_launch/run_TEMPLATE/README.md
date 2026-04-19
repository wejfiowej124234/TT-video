# Mainnet Shadow Launch · 单次演练证据包（模板）

**复制本目录为** **`../run_<UTC>/`**（**`<UTC>`** **建议** **`YYYYMMDDTHHmmssZ`**），**将** **TEMPLATE** **替换** **为** **真实** **演练** **结果**。

## 本包须含（缺一则 §0 **SL** NO-GO）

| 文件 | 说明 |
|------|------|
| **`README.md`**（本文件占位） | **首段** **须** **写明** **`deployment_chain_id: 1`**、**`network: Ethereum Mainnet`**、**影子资金声明**（无真实用户扣款或经批准的风控阀）、**`TRAVELTRUST_GIT_SHA`** **或** **发布** **指针** |
| **`shadow_go_no_go.json`** | **`shadow_launch_verdict":"GO"`** **方** **可** **作为** **正式** **主网** **发布** **最终** **Go** **输入** |
| **`indexer_tick.json`** | **`POST /api/v1/internal/indexer-tick`** **响应** **落盘** |
| **`indexer_replay.json`** | **`POST /api/v1/internal/indexer-replay`** **响应** **落盘** |
| **`reconcile.json`** | **`POST /api/v1/internal/indexer-reconcile`** **响应** **落盘** |
| **`overview.json`** | **`GET /api/v1/admin/observability/overview`** **响应** **落盘** |
| **`trigger_matrix_drill.md`** | **[TT-MAINNET §4.2](../../docs/runbook/TT-MAINNET-LAUNCH-PRECHECK-AFTER-B435-001.md#42-p0trigger-matrix必须写进-runbook-级执行系统)** **矩阵** **至少** **一条** **演练** **（** **判据** **→** **动作** **→** **exit** **码** **/** **值班** **确认** **）** |

**可选**：`tx_hashes.json`、`deploy_shadow_notes.md`（**环境** **/** **Base URL**）。

### SL GO 升级与主网小额灰度（**固定顺序**）

**在影子环境** **须** **按下序** **完成** **后**，**方可** **将** **`shadow_go_no_go.json`** **从** **`NO_GO`** **升为** **`GO`** **，** **再** **进入** **主网** **小额** **真实** **资金** **灰度**：

1. **落盘四 JSON**：`indexer_tick.json` → `indexer_replay.json` → `reconcile.json` → `overview.json`（**均为** **影子** **栈** **真实** **API** **响应** **原文** **或** **经** **批准的** **脱敏** **副本**）。
2. **Trigger Matrix 实演**：**编辑** **`trigger_matrix_drill.md`**，**至少** **覆盖** **§4.2** **矩阵** **一条** **（** **A/B/C** **）** **判据** **→** **动作** **→** **exit** **码** **/** **值班** **确认**。
3. **升级裁决**：**在** **上两步** **已** **填实** **且** **人工** **确认** **无** **未决** **异常** **后**，**将** **`shadow_go_no_go.json`** **`shadow_launch_verdict`** **改为** **`"GO"`**，**并** **填写** **`completed_at_utc`**、**`operator`**、**`git_sha`**（**与** **发布** **一致**），**证据包** **`git add`/`commit`** **归档**。
4. **主网小额真实资金灰度**（**全量** **cutover** **前** **最终** **验证**）：**锁定** **发布** **窗口** **→** **收敛** **+** **书面** **放行** **→** **全量** **cutover** **→** **cutover** **后** **持续** **监控** **`reconcile`** **/** **`overview`** **至** **稳定** **收敛** **并** **正式** **关闭** **发布** **窗口** **→** **稳态** **后** **按** **`go-live-checklist.md`** **§10** **持续** **告警** **值守** **与** **长期** **观测** **→** **确认** **长期** **稳定** **后** **`Full GO`** **（** **归档** **+** **版本** **标记** **）** **→** **冻结** **`Full GO`** **基线** **（** **tag** **+** **证据** **）** **；** **所有** **主网** **发布** **须** **基于** **新** **`run_<UTC>/`** **完整** **重跑** **G0～G6+SL** **并** **全** **GO** **，** **否则** **一律** **禁止** **进入** **生产** **。** **上线** **前** **、** **切换** **中** **与** **关窗** **前** **严禁** **任何** **形式** **资金** **敞口** **扩大** **（** **[TT-MAINNET §7](../../docs/runbook/TT-MAINNET-LAUNCH-PRECHECK-AFTER-B435-001.md#主网小额真实资金灰度sl-go-之后的执行阶段)** **）**。

**索引**：[../README.md](../README.md) · **条款**：[TT-MAINNET §7](../../docs/runbook/TT-MAINNET-LAUNCH-PRECHECK-AFTER-B435-001.md#7-ci-机读门禁g0g6) **（** **Mainnet Shadow Launch** **）**
