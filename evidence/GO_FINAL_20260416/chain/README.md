# B-431 · Chain reads ↔ payload（Production 支柱 · Foundry SSOT）

**母表**：**B-431** · **TT**：`TT-B431-GOV-EXECUTE-CHAIN-READ-PAYLOAD-ALIGN-001`

## 真源证据根

- **`evidence/b431_gov_execute_chain_read/`** — 含 **`run_<UTC>/b431-closeout-record.json`**、**`forge_b431.log`**

## Runbook 与一键

- [docs/runbook/TT-B431-GOV-EXECUTE-CHAIN-READ-PAYLOAD-ALIGN-001.md](../../../docs/runbook/TT-B431-GOV-EXECUTE-CHAIN-READ-PAYLOAD-ALIGN-001.md)  
- [docs/verification-evidence/B-431-gov-execute-chain-read-payload-align-ENTRY.md](../../../docs/verification-evidence/B-431-gov-execute-chain-read-payload-align-ENTRY.md)  
- **`bash scripts/ops/b431-gov-execute-foundry-closeout.sh`**

## GO 条件（本支柱）

- **`forge test --match-test test_B431_governor_execute_chain_reads_match_payload_and_timelock_operation`** **exit 0** **；** **落盘时** **`chain_read_payload_align_verdict`** **==** **`GO`**

**边界**：**不** **替代** **B-417** **测试网** **L3** **真** **`execute`** **封口** **；** **与** **B-414** **/** **B-430** **并列为** **Production** **三支柱** **。**
