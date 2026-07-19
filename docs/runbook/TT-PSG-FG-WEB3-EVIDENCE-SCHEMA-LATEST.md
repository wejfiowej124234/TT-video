# TT · PSG FG-Web3 Evidence Schema

**Machine:** `TT_PSG_FG_WEB3_EVIDENCE_SCHEMA`  
**Version:** 1.0.0 · `2026-07-19T09:33:40Z`  
**机读：** [`registry/psg-fg-web3-evidence-schema.v1.yaml`](../../registry/psg-fg-web3-evidence-schema.v1.yaml)

## Roots

| 阶段 | 路径 |
|------|------|
| WAIT_WINDOW pending | `evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/` |
| Post G-RC live | `evidence/GO_phase2_fcg_full_capability_v2_sepolia/fg-web3/` |

## 必填（G-RC CLOSED 后）

- `CLEAN-DEPLOY-BROADCAST-LATEST.json`
- `ADDRESS-MATRIX-V2-LATEST.json`
- `ACTIVE-CUTOVER-STAMP-LATEST.json`
- `FG-WEB3-CASE-RESULTS-LATEST.json`
- `CHAIN-INDEXER-API-DB-UI-CONSISTENCY-LATEST.json`
- `OBSERVATION-48H-START-LATEST.json`

## FG-13 Consistency 等式

`address_matrix_eq_meta` · `event_count_chain_eq_indexer` · `amount_chain_eq_db_eq_api_eq_ui`

本窗仅允许 **PREP_ONLY** 产物（见 pending consistency JSON）。
