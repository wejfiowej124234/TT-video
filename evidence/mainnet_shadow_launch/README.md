# Mainnet Shadow Launch · 证据根目录（TT-MAINNET §0 **SL** / §7 Shadow）

**用途**：**正式 Ethereum Mainnet 生产 cutover 前**，在**不动真实用户资金**的影子栈上完成 **deploy → indexer-tick → indexer-replay → reconcile → overview → Trigger Matrix 演练**，并产出**独立** **`run_<UTC>/`** 包；**[`shadow_go_no_go.json`](run_TEMPLATE/shadow_go_no_go.json)** **`shadow_launch_verdict":"GO"`** 为**最终 Go/No-Go 输入**（与 **[TT-MAINNET §0](../../docs/runbook/TT-MAINNET-LAUNCH-PRECHECK-AFTER-B435-001.md#0-门禁总表mainnet-deploy--cutover--全部为-go-才允许)** **SL** 列一致）。

| 路径 | 说明 |
|------|------|
| [`run_TEMPLATE/README.md`](run_TEMPLATE/README.md) | **最小文件集** **与** **命名** **约定**；**复制** **为** **`run_<UTC>/`** **后** **填实** |
| [`run_TEMPLATE/shadow_go_no_go.json`](run_TEMPLATE/shadow_go_no_go.json) | **裁决** **模板**；**真实** **演练** **须** **改为** **`"GO"`** **并** **带** **时间** **/** **操作人** |

**勿** **覆盖** **历史** **`run_*`**；**每次** **新** **演练** **新** **目录**。

**示例脚手架**（**非** **封口** **`GO`**）：[`run_20260417T005952Z/README.md`](run_20260417T005952Z/README.md)。**封口** **顺序**：见 **[`run_TEMPLATE/README.md`](run_TEMPLATE/README.md)** **第三节**（**`GO`** **证据** **提交** **后** **同一** **发布** **窗口** **内** **无缝** **灰度** **，** **不** **插入** **无关** **变更**）。

**Runbook**：[TT-MAINNET §7](../../docs/runbook/TT-MAINNET-LAUNCH-PRECHECK-AFTER-B435-001.md#7-ci-机读门禁g0g6) **（** **锁定** **窗口** **→** **放行** **→** **cutover** **→** **关窗** **→** **§10** **稳态** **观测** **→** **长期** **稳定** **后** **`Full GO`** **（** **归档** **+** **版本** **标记** **）** **→** **冻结** **`Full GO`** **→** **所有** **主网** **发布** **须** **新** **`run_<UTC>/`** **完整** **重跑** **G0～G6+SL** **全** **GO** **，** **否则** **一律** **禁止** **进入** **生产** **；** **上线** **/** **切换** **/** **关窗** **前** **严禁** **敞口** **扩大** **）**。
