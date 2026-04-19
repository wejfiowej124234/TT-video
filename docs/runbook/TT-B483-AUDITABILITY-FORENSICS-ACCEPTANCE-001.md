# TT-B483-AUDITABILITY-FORENSICS-ACCEPTANCE-001 · **B-483** **可** **审计** **与** **可追溯** **（** **Auditability** **&** **Forensics** **）**

**母表**：[B-483](../任务母表.md)  
**前置**：[B-482](../任务母表.md)（[`TT-B482`](TT-B482-FINANCIAL-CORRECTNESS-ACCEPTANCE-001.md)）、[B-481](../任务母表.md)  
**代码锚点**：[crates/api/src/db/event_log.rs](../../crates/api/src/db/event_log.rs)（**`event_log`** **表** **与** **快照** **键** **）、** **索引器** **审计** **日志** **`INDEXER_AUDIT_LOG_PATH`** **默认** **`data/indexer_audit.jsonl`** **（** **见** **`startup`** **）**

---

## §1 · 目标

对 **所有** **资金** **相关** **操作** **建立** **不可** **篡改** **的** **事件** **链** **叙事** **与** **机读** **验收** **：**

- **append-only** **`event_log`** **（** **及** **链** **上** **事件** **投影** **约束** **）** **；**
- **哈希** **链** **/** **批次** **根** **（** **Merkle** **等** **）** **与** **快照** **签名** **（** **如** **Ed25519** **/** **运维** **HSM** **策略** **）** **；**
- **replay** **：** **自** **任意** **一致** **起点** **重放** **投影** **，** **得到** **与** **线** **上** **一致** **的** **账本** **视图** **（** **`reproducible_ledger_state`** **）** **；**
- **audit** **proof** **：** **可** **验证** ** bundle** **（** **证明** **包** **）** **零** **失败** **校验** **。**

**门禁** **硬** **要求** **（** **[`config/b483_auditability_forensics_gate.v1.json`](../../config/b483_auditability_forensics_gate.v1.json)** **）** **：** **哈希** **链** **有效** **、** **追加** **语义** **落实** **、** **账本** **状态** **可** **复现** **、** **链头** **与** **tip** **一致** **、** **事件** **链** **完整** **；** **与** **B-481** **（** **韧性** **）** **、** **B-482** **（** **正确性** **）** **并列** **构成** **三维** **生产** **放行** **。**

---

## §2 · 机读真源

| 资产 | 说明 |
|------|------|
| **[`config/b483_auditability_forensics_gate.v1.json`](../../config/b483_auditability_forensics_gate.v1.json)** | **`hard_requirements`** **+** **`limits`** **；** **改** **后** **`python3 scripts/gates/refresh-b483-gate-config-hash.py`** |
| **`scripts/gates/check-b483-gate-config.py`** | **CI** **/** **合入** |
| **`scripts/gates/check-b483-report-gate.py`** | **发布** **门禁** |
| **`evidence/b483_auditability_forensics/`** | **演练** **输出** **目录** |

---

## §3 · `report.v1.json` 的 `checks` 块（与门禁对齐）

| 键 | 含义 |
|----|------|
| **`append_only_event_log`** | **`append_only_enforced`** **、** **`hash_chain_valid`** **、** **`tamper_detected_count`** |
| **`snapshot_signatures`** | **`signature_verification_failures`** **等** |
| **`replay_verification`** | **`reproducible_ledger_state`** **、** **`state_divergence_count`** |
| **`audit_proof`** | **`proof_verification_failures`** |
| **`chain_integrity`** | **`event_chain_complete`** **、** **`head_hash_matches_tip`** **、** **`hash_chain_coverage_ratio`** |

---

## §4 · 证据流水线（建议）

1. **从** **`event_log`** **/** **indexer** **导出** **有序** **事件** **与** **检查点** **。**
2. **计算** **/** **校验** **哈希** **链** **与** **（** **可选** **）** **Merkle** **批次** **根** **。**
3. **对** **快照** **文件** **或** **批次** **清单** **做** **签名** **验证** **。**
4. **运行** **replay** **作业** **，** **比对** **投影** **状态** **与** **线** **上** **只读** **探针** **。**
5. **生成** **audit** **proof** **bundle** **并** **做** **离线** **校验** **。**
6. **汇总** **为** **`report.v1.json`** **，** **`verdict=PASS`** **后** **跑** **门禁** **。**

---

## §5 · 三维放行组合

| 维度 | 母表 / Runbook |
|------|----------------|
| **可靠性** **/** **韧性** | **B-477～B-481** |
| **正确性** | **B-482** |
| **可** **审计** **性** | **B-483** **（** **本** **Runbook** **）** |

```bash
python3 scripts/gates/check-b483-report-gate.py evidence/b483_auditability_forensics/run_<UTC>/report.v1.json
```

---

**文档版本**：1.0 · 2026-04-18
