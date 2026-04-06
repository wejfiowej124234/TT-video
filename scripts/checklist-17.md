# 17 条验收清单（01 §10 审计验收表）

实现/发版前逐条勾选：每条须有单测、E2E 或 runbook 可产出对应 Evidence artifact。详见 [01-总库总览 §10 审计验收表](../docs/spec/01-总库总览.md)。

| # | Invariant / Rule | Evidence artifact | □ 已覆盖 |
|---|------------------|-------------------|----------|
| 1 | 价值守恒：终态 payout+refund+slash+platformFee(+arbitrationFee)==grossAmount | invariant_test_results.json；contract_bytecode_sha256 | ✓ 合约 Escrow.sol executeResolution 内 guideAmount+travelerRefund+platformFee==totalAmount 断言；Escrow.t.sol test_CreateDepositRelease/test_Refund；release/refund 余额断言 |
| 2 | Paid 仅来自 deposit() | 链上事件日志；e2e_payment_via_deposit.png | ✓ P5/P6：链上 Deposited 事件；p5_anvil_full_cycle；索引 project_chain_event；前端仅经 deposit()（useEscrowActions） |
| 3 | topUp/重复 Paid 规则、DB 合并规则写死 | 当前无 topUp（合约无）；DB 合并见 project_chain_event；定稿时写死 paid_merge_rule 即闭合 | ✓ 落点已就绪 |
| 4 | orderId↔escrow 一对一 | reconciliation_order_escrow.csv | ✓ P5/P6：索引器 EscrowCreated→order.escrow_address；chain_off::reconcile_order_chain_vs_db；见 27-P6 |
| 5 | participants 不可变、无零地址 | 合约 EscrowParams 固定 traveler/guide/arbitrator；Deploy.s.sol；**产出**：定稿时从合约/部署产出 deployment_params 或运行 `cd contracts && slither . --json slither-report.json`，附入 evidence/GO_YYYYMMDD/ 或 08-3 | ✓ 落点已就绪 |
| 6 | Paid 事件可重建结算 | event_schema_assertion.json；rebuild_from_events_test.log | ✓ P5/P6：indexer 事件表 + project_chain_event_onto_order；重放见 Runbook §11、--indexer-replay-finality-change；indexer-tick 可重建 orders |
| 7 | PartiallyRefunded/Slashed 合法组合集 | resolution_amount_rules.json；执行器单测 | ✓ 合约 executeResolution 守恒断言（guideAmount+travelerRefund+platformFee==totalAmount）；执行器 process-resolution-outbox、resolutionId 幂等；01 §7 |
| 8 | token 异常后承诺（黑名单/冻结） | runbook_token_frozen.md；allowed_tokens_hash | ✓ Runbook §1 ⑤ token 冻结/黑名单（触发阈值+自动/人工动作+证据）；08-3 tokenAllowlist；01 §9 |
| 9 | Dispute 与自动放款互斥 | DisputeOpened 事件；config 校验 disputeDeadline≥autoCompleteAt | ✓ P2/P3：core can_dispute；chain_off dispute_deadline≥auto_complete；config from_env |
| 10 | executeResolution 绑定实例+守恒 | resolution_approval_*.json；合约测试 | ✓ 合约 executeResolution(orderId, …) 绑定 escrow 实例；outbox process_one 消费 resolutionId+orderId；合约守恒见 #7 |
| 11 | 裁决签名含 RBAC 快照、双人审批 | dispute_resolve_impl 存 arbitrator_id；定稿时 Runbook §7 或审计表写死双人审批即闭合 | ✓ 落点已就绪 |
| 12 | DB 状态仅链事件驱动 | correction_log；reconciliation_report_*.json | ✓ P5/P6：project_chain_event_onto_order；chain_off reconcile；无前端写 Paid；见 27-P6 |
| 13 | reorg 撤销与投影回退 | reorg_handling_test.log；checkpoint | ✓ P5/P6：indexer last_block_hash + reorg_detected；checkpoint 持久化；chain 单测；见 27-P6 |
| 14 | 幂等键覆盖四类来源（API/队列/执行器/连点） | API 日志 idempotency_key；executed[resolutionId] | ✓ P2/P4：API Idempotency-Key 中间件覆盖全部路由、去重与结果复用；队列/执行器/连点 P5+ |
| 15 | 对账三段式触发条件 | chain_off::reconcile_order_chain_vs_db；定稿时写死 01 三段式触发与次数上限 Runbook/04 即闭合 | ✓ 落点已就绪 |
| 16 | 状态机与副作用联动 | state_machine_side_effects.json；通知/档期审计日志 | ✓ P2/P4：crates/core escrow.rs 单测（迁移+can_dispute+can_review）；chain_off 状态迁移与 01 一致 |
| 17 | finalityN 与配置单一来源 | config.toml+env hash；replay_after_finality_change.log | ✓ env FINALITY_N；main.rs load_or_init_indexer_state、apply_finality_change_replay_plan、STRICT_INDEXER_REPLAY 启动门禁；Runbook §11；indexer_state.json last_seen_finality_n |

**用法**：实现时每行「□ 已覆盖」打勾并填写 artifact 路径或编号；发版前 17 行均须已勾选。

**发版前定稿**：#3、#5、#11、#15 为「✓ 落点已就绪」；写死或产出 artifact 即闭合，执行表如下：

| 条 | 定稿时动作 | 落点/产出 |
|----|------------|-----------|
| **#3** | 写死 DB 合并规则一句话 | 04 §四 或 data/README：写「paid 仅来自 deposit，无 topUp；合并逻辑见 project_chain_event」 |
| **#5** | 产出部署参数或 Slither 报告 | 项目根 `./scripts/export_deployment_params.sh` 或 **`.\scripts\export_deployment_params.ps1`**；和/或 `cd contracts && slither . --json slither-report.json`；产出附入 evidence/GO_YYYYMMDD/ 或 08-3；**运维顺序** **[Runbook §12.8](../ops/RUNBOOK.md)** |
| **#11** | 写死双人审批 | Runbook §7 或 08-4：写「裁决须 A+B 双人审批；签字含 arbiterRoleSnapshotHash」 |
| **#15** | 写死对账三段式触发与上限 | 01 §9 或 Runbook §1/04：写「对账三段式：自动/半自动/人工；触发条件与次数上限见 chain_off::reconcile」 |

**写死已补全落点**：#3 → [data/README.md](../data/README.md)「DB 合并规则」+ 04 §四；#11 → [ops/RUNBOOK.md](../ops/RUNBOOK.md) §7 写死规则（arbiterRoleSnapshotHash、A+B 双人审批）；#15 → [01-总库总览](../docs/spec/01-总库总览.md) §9 对账段 + Runbook §4。定稿时确认上述位置未改即可闭合。

详见 [27-P0至P47-多维度深度检查报告 §六](../docs/spec/27-P0至P47-多维度深度检查报告.md#六未完成部分按类型分类发版前逐项核对)、[27-P14 可选：P4 与 17 条](../docs/spec/27-P14-实现记录.md#可选p4-企业级待办与-17-条-35-1115-定稿时闭合)。

---

### P5 相关条（E1，随 P5 实现勾选）

| 17 条 # | P5 对应 artifact / 落点 |
|---------|-------------------------|
| 1 | 合约单测 `forge test`（Escrow.t.sol 守恒）；invariant_test_results 可取自 test 输出 |
| 2 | 链上 Deposited 事件；e2e 为 createEscrow→deposit→release（p5_anvil_full_cycle / p5_e2e） |
| 4 | orderId↔escrow：索引器 EscrowCreated 写 order.escrow_address；对账 reconcile_order_chain_vs_db |
| 6 | 事件可重建：indexer events + project_chain_event_onto_order；rebuild 可跑 indexer-tick 后查 orders |
| 7 | executeResolution 守恒：合约测试 + 执行器 submit_execute_resolution；resolution_amount_rules 见 01 §7 |
| 10 | executeResolution 绑定实例：合约 + chain/outbox process_one；resolution_approval 为 outbox 条目 |
| 12 | DB 仅链事件驱动：project_chain_event_onto_order；reconciliation 见 chain_off::reconcile_order_chain_vs_db |
| 13 | reorg：indexer last_block_hash + reorg_detected；checkpoint 持久化 |

勾选后在同一行「□ 已覆盖」打勾并填上表 artifact。

### P6 相关条（随 P6 门禁勾选）

| 17 条 # | P6 对应 artifact / 落点 |
|---------|-------------------------|
| 2 | 链上 Deposited 事件；p5_anvil_full_cycle；索引 project_chain_event_onto_order；前端 dapp/useEscrowActions 仅调 deposit() |
| 4 | 索引器 EscrowCreated 写 order.escrow_address；chain_off::reconcile_order_chain_vs_db；14 §2.1 内部 API |
| 12 | project_chain_event_onto_order；reconcile_order_chain_vs_db；无前端直接写 Paid |
| 13 | indexer last_block_hash、reorg_detected；checkpoint 持久化；crates/api chain/chain_off 单测 |
