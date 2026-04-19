# Mainnet Shadow Launch · `run_20260417T005952Z`（脚手架 · 非封口）

**本目录** **由** **`run_TEMPLATE`** **复制** **生成**，**用于** **承接** **一次** **完整** **影子** **演练** **的** **落盘**。**当前** **状态**：**证据** **未齐** **`shadow_go_no_go.json`** **仍为** **`NO_GO`** — **不得** **作为** **§0 SL** **封口** **或** **主网** **真实** **资金** **灰度** **依据**。

**首段** **机读** **锚点**（**填实** **后** **保持**）：

- **deployment_chain_id**: **1**
- **network**: **Ethereum Mainnet**
- **影子资金声明**：**尚未** **完成** **全链路** **演练** **落盘**；**真实** **演练** **时** **须** **写明** **无** **真实** **用户** **扣款** **或** **经** **批准** **的** **风控** **阀**。
- **TRAVELTRUST_GIT_SHA**（**脚手架** **生成** **时** **工作区**）：`f267483c8db3aaefb500618168333d0daafbf05d`

## 须在影子栈填齐的文件（缺一则 SL NO-GO）

| 文件 | 状态 |
|------|------|
| `shadow_go_no_go.json` | **已占位** — **演练** **通过后** **改为** **`shadow_launch_verdict":"GO"`** **并** **补** **operator** **/** **completed_at_utc** |
| `indexer_tick.json` | **待** **`POST …/internal/indexer-tick`** **落盘** |
| `indexer_replay.json` | **待** **`POST …/internal/indexer-replay`** **落盘** |
| `reconcile.json` | **待** **`POST …/internal/indexer-reconcile`** **落盘** |
| `overview.json` | **待** **`GET …/admin/observability/overview`** **落盘** |
| `trigger_matrix_drill.md` | **待** **§4.2** **矩阵** **实演** **记录** |

**升级顺序**（**与** **[`run_TEMPLATE/README.md`](../run_TEMPLATE/README.md)** **一致**）：**锁定** **发布** **窗口** **→** **收敛** **+** **书面** **放行** **→** **全量** **cutover** **→** **cutover** **后** **监控** **`reconcile`** **/** **`overview`** **至** **稳定** **并** **正式** **关窗** **→** **稳态** **§10** **告警** **值守** **+** **长期** **观测** **→** **长期** **稳定** **`Full GO`** **→** **冻结** **`Full GO`** **→** **所有** **主网** **发布** **须** **新** **`run_<UTC>/`** **完整** **重跑** **G0～G6+SL** **全** **GO** **，** **否则** **一律** **禁止** **进入** **生产** **；** **上线** **前** **/** **切换** **中** **/** **关窗** **前** **严禁** **任何形式** **资金** **敞口** **扩大**（**TT-MAINNET** **§7**）。

**索引**：[../README.md](../README.md) · **条款**：[TT-MAINNET §7](../../../docs/runbook/TT-MAINNET-LAUNCH-PRECHECK-AFTER-B435-001.md#7-ci-机读门禁g0g6)
