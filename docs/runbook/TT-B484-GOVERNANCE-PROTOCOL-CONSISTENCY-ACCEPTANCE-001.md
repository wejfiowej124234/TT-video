# TT-B484-GOVERNANCE-PROTOCOL-CONSISTENCY-ACCEPTANCE-001 · **B-484** **协议** **与** **治理** **一致性**

**母表**：[B-484](../任务母表.md)  
**前置**：[B-483](../任务母表.md)（[`TT-B483`](TT-B483-AUDITABILITY-FORENSICS-ACCEPTANCE-001.md)）、[B-482](../任务母表.md)  
**代码锚点**：[crates/api/src/db/governance_proposals_projection.rs](../../crates/api/src/db/governance_proposals_projection.rs)、**`GET /meta.governance`** **（** **808** **机读** **键** **）**

---

## §1 · 目标

**链上** **治理** **结果** **（** **投票** **、** **参数** **变更** **、** **分配** **/** **路由** **规则** **）** **与** **链下** **执行** **（** **API** **、** **DB** **投影** **、** **分配** **流水线** **）** **在** **任意** **核对** **时刻** **严格** **一致** **（** **no** **drift** **）** **：**

- **治理** **决议** **可** **验证** **（** **证明** **包** **/** **链上** **可** **复核** **）** **；**
- **参数** **版本** **可** **追溯** **（** **链上** **配置** **标识** **与** **DB** **/** **配置** **仓库** **同源** **）** **；**
- **执行** **结果** **与** **治理** **输入** **一致** **（** **FeeRouter** **BPS** **、** **金库** **/** **池** **路由** **等** **）** **。**

**形成** **「** **技术** **系统** **+** **治理** **系统** **」** **双** **一致** **生产** **放行** **，** **与** **B-481～B-483** **并列** **。**

---

## §2 · 机读真源

| 资产 | 说明 |
|------|------|
| **[`config/b484_governance_protocol_consistency_gate.v1.json`](../../config/b484_governance_protocol_consistency_gate.v1.json)** | **`hard_requirements`** **+** **`limits`** **；** **改** **后** **`python3 scripts/gates/refresh-b484-gate-config-hash.py`** |
| **`scripts/gates/check-b484-gate-config.py`** | **CI** **/** **合入** |
| **`scripts/gates/check-b484-report-gate.py`** | **发布** **门禁** |
| **`evidence/b484_governance_protocol_consistency/`** | **证据** **目录** |

---

## §3 · `report.v1.json` 的 `checks` 块

| 键 | 含义 |
|----|------|
| **`on_chain_vs_off_chain`** | **漂移** **计数** **、** **治理** **输入** **哈希** **是否** **与** **链下** **一致** |
| **`governance_verifiability`** | **未** **验证** **提案** **数** **、** **决议** **证明** **bundle** **是否** **有效** |
| **`parameter_version_traceability`** | **链上** **/** **DB** **活动** **配置** **版本** **、** **路由** **规则集** ** ID** |
| **`execution_consistency`** | **分配** **流水线** **违规** **、** **API↔DB** **治理** **投影** **是否** **匹配** |

---

## §4 · 证据流水线（建议）

1. **拉取** **Governor** **/** **Timelock** **/** **FeeRouter** **等** **链上** **只读** **视图** **。**
2. **读取** **`governance_proposals_projection`** **及** **相关** **DB** **表** **。**
3. **比对** **路由** **/** **BPS** **/** **池** **地址** **与** **治理** **执行** **交易** **。**
4. **汇总** **`report.v1.json`** **，`verdict=PASS`** **后** **跑** **门禁** **。**

---

## §5 · 发布 Gate

```bash
python3 scripts/gates/check-b484-report-gate.py evidence/b484_governance_protocol_consistency/run_<UTC>/report.v1.json
```

---

**文档版本**：1.0 · 2026-04-18
