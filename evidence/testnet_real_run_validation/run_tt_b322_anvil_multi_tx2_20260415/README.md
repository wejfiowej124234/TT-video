# TT-B322 · Anvil 实跑归档 · `broadcast_request_stub_anvil_multi_tx_2.json`

- **任务锚**：`TT-B322-TESTNET-MULTI-TX-NONCE-SEQUENCE-REAL-RUN-001`
- **编排**：`scripts/ops/run_testnet_b262_b266_real.sh`（B-275）
- **环境**：干净 Anvil，`CHAIN_RPC_URL=http://127.0.0.1:18545`，`chainId` 31337。跑 stub **前**对默认账户 `0xf39F…` 执行 **两笔** `cast send`（0→1→2），使下一笔 **nonce=2**，与 stub 内 **nonce 2、3** 对齐。
- **`TRAVELTRUST_TESTNET_RUN_TT_ID`**：`TT-B322-TESTNET-MULTI-TX-NONCE-SEQUENCE-REAL-RUN-001`

## 机读验收（本目录 JSON）

| 项 | 结果 |
|----|------|
| `execution_steps` | **2** 行，`global_index` **0,1** |
| `receipt_archive.archive_rows` | **2** 行，与步骤同序 |
| `onchain_reconcile.reconcile_rows` | **2** 行 |
| `execution_verdict` / `reconcile_verdict` / `production_verdict` | 均为 **GO** |
| 链上 nonce（`cast tx <hash>`） | **2 → 3**（与 `run_tt_b322_anvil_multi_tx3_20260415` 前两笔 **tx 相同** 时哈希一致） |

**Tx（按 `global_index`）**：见 `execution_report.json` · `operator_run_evidence.json`。
