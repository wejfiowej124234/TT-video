use serde::Deserialize;

#[derive(Debug, Deserialize, Default)]
pub struct IndexerReconcileBody {
    #[serde(default)]
    pub chain_id: Option<u64>,
    /// 为 true 时追加写入 **`reconciliation_reports`**（`report_type`=`orders_projection_vs_orders`）
    #[serde(default)]
    pub persist: bool,
    /// 1～10：对已填 escrow 的订单抽样 **`chain::get_escrow_status`**（须 **RPC + ESCROW_FACTORY_ADDRESS**）；未设或 0 表示不拉链上读数
    #[serde(default)]
    pub rpc_escrow_samples: Option<u8>,
    /// **`true`** 时在对账 **`200`** 成功后执行 **`db::backfill_orders_chain_id_from_projection`**（仅 **`orders.chain_id IS NULL`**；**110 §3.1.4**）
    #[serde(default)]
    pub backfill_orders_chain_id: bool,
    /// **`true`** 时在对账 **`200`** 成功后附加 **`orders_chain_id_backfill_dry_run`**（**只读**；**B-102** / **TT-122**；锚 **`B102-ORDERS-CHAIN-ID-BACKFILL-DRY-RUN`**）
    #[serde(default)]
    pub orders_chain_id_backfill_dry_run: bool,
    /// **`true`** 时在对账 **`200`** 成功后附加 **`orders_chain_scope_rollback_dry_run`**（**`db::orders_chain_scope_rollback_dry_run`**；只读计数，锚 **`110-ORDERS-CHAIN-SCOPE-DRY-RUN`**；**110 §3.1.4** 向 **Target** 前置）
    #[serde(default)]
    pub orders_chain_scope_rollback_dry_run: bool,
    /// **`true`** 且 **ENV `TRAVELTRUST_ALLOW_ORDERS_CHAIN_SCOPE_ROLLBACK=1`**、**`orders_chain_scope_rollback_confirm`** 与 **`db::orders_chain_scope_rollback_expected_confirm(chain_id)`** 一致时，在对账 **`200`** 成功后执行 **`db::orders_chain_scope_rollback_execute`**（**`110-ORDERS-CHAIN-SCOPE-EXECUTE`**；**仅**删 **`orders.chain_id`** 匹配行；**110 §3.1.4** **Partial**）
    #[serde(default)]
    pub orders_chain_scope_rollback_execute: bool,
    /// 须精确等于 **`CONFIRM_DELETE_ORDERS_CHAIN_<chain_id>`**（**`chain_id`** 为本次 reconcile 解析值，含 body 覆盖）
    #[serde(default)]
    pub orders_chain_scope_rollback_confirm: Option<String>,
    /// **`true`** 时在对账 **`200`** 成功后附加 **`event_log_chain_scope_rollback_dry_run`**（**`db::event_log_chain_scope_rollback_dry_run`**；**110 §3.1.4** **Partial**）
    #[serde(default)]
    pub event_log_chain_scope_rollback_dry_run: bool,
    /// **`true`** 且 **ENV `TRAVELTRUST_ALLOW_EVENT_LOG_CHAIN_SCOPE_ROLLBACK=1`**、**`event_log_chain_scope_rollback_confirm`** = **`CONFIRM_DELETE_EVENT_LOG_CHAIN_<chain_id>`** 时执行 **`db::event_log_chain_scope_rollback_execute`**（锚 **`110-EVENT-LOG-CHAIN-SCOPE-EXECUTE`**；**不**重置进程内 indexer 内存 checkpoint）
    #[serde(default)]
    pub event_log_chain_scope_rollback_execute: bool,
    #[serde(default)]
    pub event_log_chain_scope_rollback_confirm: Option<String>,
    /// **`true`** 时在对账 **`200`** 成功后附加 **`correction_executor_chain_scope_rollback_dry_run`**（**`db::correction_executor_chain_scope_rollback_dry_run`**；**110 §3.1.4** **Partial**）
    #[serde(default)]
    pub correction_executor_chain_scope_rollback_dry_run: bool,
    /// **`true`** 且 **ENV `TRAVELTRUST_ALLOW_CORRECTION_EXECUTOR_CHAIN_SCOPE_ROLLBACK=1`**、**`correction_executor_chain_scope_rollback_confirm`** = **`CONFIRM_DELETE_CORRECTION_EXECUTOR_CHAIN_<chain_id>`** 时执行 **`db::correction_executor_chain_scope_rollback_execute`**（锚 **`110-CORRECTION-EXECUTOR-CHAIN-SCOPE-EXECUTE`**）
    #[serde(default)]
    pub correction_executor_chain_scope_rollback_execute: bool,
    #[serde(default)]
    pub correction_executor_chain_scope_rollback_confirm: Option<String>,
    /// **`true`** 且 **ENV `TRAVELTRUST_ALLOW_INDEXER_MEMORY_SYNC_FROM_DB=1`** 时，在对账 **`200`** 成功后按 **`checkpoints_sharded`**（**`INDEXER_CHECKPOINT_CONSUMER_ID`**）对齐进程内 **`IndexerState`** 并落盘 **`.runtime`**（锚 **`110-INDEXER-MEMORY-SYNC-FROM-DB`**；无 DB 行时等价归零内存缓存事件）
    #[serde(default)]
    pub sync_indexer_memory_from_db_checkpoint: bool,
    /// **`true`** 时在 **`200`** 响应与 **`persist`** 之 **`summary`** 附加 **`chain_observation`**（单次 **`eth_blockNumber`** + **`finality_n_used`** + **`indexer_finalized_upper_bound`**；锚 **`110-RECONCILE-CHAIN-TIP`**；RPC 失败时 **`ok:false`**+**`error`**，**不**影响对账 **`200`**）
    #[serde(default)]
    pub include_chain_tip: bool,
    /// **`true`** 时附加 **`multi_table_chain_observability`**（**B-171** / **TT-B171**；**B-176** 后续在同一壳内增列；**不**参与 compound gate）
    #[serde(default)]
    pub include_multi_table_chain_observability: bool,
    /// **`true`** 时附加 **`reorg_sentinel_observability`**（**B-169** / **TT-B169**；内存 tail + 可选 RPC **同高 hash** 对读；**不**参与 compound gate）
    #[serde(default)]
    pub include_reorg_sentinel_observability: bool,
    /// **`true`** 时附加 **`indexer_finality_triple_observability`**（**B-170** / **TT-B170**；**tip / finalized 上界 / last_indexed**；**不**参与 compound gate；与 **`include_chain_tip`** 之 **`chain_observation`** 分立）
    #[serde(default)]
    pub include_indexer_finality_triple_observability: bool,
    /// **`true`** 时附加 **`indexer_tick_fail_skip_bucket_observability`**（**B-174** / **TT-B174**；最近一次成功 **`indexer_tick`** 分桶；**不**参与 compound gate）
    #[serde(default)]
    pub include_indexer_tick_fail_skip_bucket_observability: bool,
    /// **`true`** 时附加 **`governor_proposal_tail_drift_observability`**（**B-172** / **TT-B172**；**`proposalCount()`** vs 投影尾部；**不**参与 compound gate）
    #[serde(default)]
    pub include_governor_proposal_tail_drift_observability: bool,
    /// **`true`** 时附加 **`governor_proposal_state_chain_vs_projection_observability`**（**B-149** / **TT-B149**；**`state(uint256)`** vs **`governance_proposals_projection.chain_state`**；**不**参与 compound gate；**非** **B-172**）
    #[serde(default)]
    pub include_governor_proposal_state_chain_vs_projection_observability: bool,
    /// **`true`** 时附加 **`timelock_delay_meta_mirror_observability`**（**B-173** / **TT-B173**；**`delay()`** 与 **`GET /meta` `timelock_delay_observability`** 同源壳镜像；**不**参与 compound gate；**不**替代 **SEQ6** **`timelock_delay_ssot_ops_check`**）
    #[serde(default)]
    pub include_timelock_delay_meta_mirror_observability: bool,
    /// **`true`** 时附加 **`governance_pool_meta_chain_alignment_observability`**（**B-177** / **TT-B177**；**`ApiMetaState.chain_config`** 与 **`pool_chain_alignment_hint`** 只读对读；**不**参与 compound gate；**不**改 **`GET /meta`** 形状）
    #[serde(default)]
    pub include_governance_pool_meta_chain_alignment_observability: bool,
    /// **`true`** 时在 **`200`** 与 **`persist` `summary`** 附加 **`event_log_escrow_coverage`**（**`110-EVENT-LOG-ESCROW-COVERAGE`**；**DB 已索引** **`event_log`** Escrow 类行、**`EscrowCreated`** 去重地址、**`orders_projection`** 行与去重 **`escrow_address`**；**不**等同全链扫 **Target**）
    #[serde(default)]
    pub include_event_log_escrow_coverage: bool,
    /// **1～20**：**`fee_router_routed_events`** 降序抽样，**`eth_getTransactionReceipt`** 与 DB 投影逐字段比对 **`PlatformFeeRouted`**（**B-081**）；**`0`** 或未设表示不执行
    #[serde(default)]
    pub verify_fee_router_events_rpc: Option<u8>,
    /// **1～20**：**`region_vault_forwarded_events`** 降序抽样，receipt 解码 **`RegionVaultForwarded`** 与 DB 一致；**单交易块**时校验 **`to`** 的 **ERC20** 余额 **块末−块前** = **`amount`**（**B-082**）；**`0`** 或未设表示不执行
    #[serde(default)]
    pub verify_region_vault_events_rpc: Option<u8>,
}

