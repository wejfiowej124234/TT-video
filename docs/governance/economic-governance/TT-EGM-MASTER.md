# TT · PSG-EGM · Economic Governance Model Certification（MASTER）

**Package:** `PSG-EGM`  
**Type:** **Cross-Cutting Certification Package**  
**Adjudication:** **CLOSED AS FRAMEWORK DESIGN** · **WAIT FOR EVIDENCE PHASE**  
**Evidence:** `NOT_STARTED`  
**Decision:** **FINAL** · 2026-07-20（边界再确认同日）  
**Machine:** [`registry/economic-governance/egm-baseline.yaml`](../../../registry/economic-governance/egm-baseline.yaml)

---

## 定位（写死）

| 是 | 不是 |
|----|------|
| 经济治理一致性 / 全球席位框架 / 可持续性 **认证包** | PSG Gate |
| Completion Matrix **横切输入** | `PSG_COMPLETE` 新条件 |
| 融资 / 治理 / Owner 决策证据 | Production Release Blocker |
| | Hard Gate / Mainnet Wave 输入 |

```text
PSG_COMPLETE = L1 ∧ L2 ∧ L3 ∧ L4 ∧ L5   ← 不变

Cross-Cutting: CORE · EGM · LEGAL · OWNER
```

**一句话职责：** 证明 TravelTrust 经济治理规则在 Constitution、Registry、协议文档、投资材料之间保持一致，并具备全球扩展能力（国家 = Case，不是独立模型）。

---

## L5 FG-Web3 ↔ PSG-EGM 边界（再确认 · 写死）

### L5 FG-Web3 负责

- 链上资金路径
- Treasury 合约
- Governance Contract
- Timelock
- Money Path
- FG-15-B Evidence

### PSG-EGM 负责

- 经济规则是否一致
- 全球区域席位框架
- 收益分配政策文档一致性
- 市场假设证据
- 区域席位估值案例
- 长期经济可持续性分析
- Case 管理规则

| | L5 FG-Web3 | EGM |
|--|------------|-----|
| 验什么 | 链上 / 运行时执行 | 规则完整、统一、可审计 |
| 45/55 | 是否按规则执行 | 规则是否写入并 ALIGNED |
| Seat | 链上权益行为 | Global Framework + Valuation Cases |

---

## Case 管理规则（唯一扩展方式）

```text
Global Framework
        ↓
Regional Seat Instance
        ↓
Country Case Evidence
```

| 国家 | 路径 | 禁止 |
|------|------|------|
| 中国 | `EGM-05 → Case-CN-001` China Regional Seat | China Economic Model v1 |
| 日本 | `EGM-05 → Case-JP-001` | Japan Economic Model v1 |
| 泰国 | `EGM-05 → Case-TH-001` | Thailand Economic Model v1 |

**禁止**按国新建平行经济真源。所有席位估值只追加 EGM-05 Case。

---

## 子项（冻结）

| ID | 名称 | 输出 / 注意 |
|----|------|-------------|
| **EGM-00** | Economic SSOT Integrity | `ALIGNED` / `DRIFT` |
| **EGM-01** | Token Governance Alignment | 只验 · **不改** Tokenomics |
| **EGM-02** | Regional Seat Framework | Global → Seat → Country Instance → Local |
| **EGM-03** | Revenue Distribution Policy | 验规则 · 链上属 L5 |
| **EGM-04** | Market & Growth Evidence | Investor/Governance · **非** Production GO 条件 |
| **EGM-05** | Regional Seat Valuation | Cases only · 非「XX 经济模型」 |
| **EGM-06** | Sustainability Model | Treasury 健康 · 激励 · 不依赖币价上涨 · 收益闭环 |

---

## 当前阶段执行原则

```yaml
window:
  ECONOMIC_MODEL_FREEZE: ACTIVE
  FG-15-B: STANDBY
  Hard_Gate: REFUSED
  Recalculate: WAIT

psg_egm:
  adjudication: CLOSED_AS_FRAMEWORK_DESIGN
  next: WAIT_FOR_EVIDENCE_PHASE
  evidence: NOT_STARTED
  economic_changes: FORBIDDEN
  hard_gate_impact: NONE
  production_go_impact: NONE
```

**只保持：** Framework · Registry · Evidence Structure · Cockpit Visibility  

**不进入：** Economic Parameter Optimization · ROI Finalization · Seat Price Negotiation · Investor Return Promise · Token Allocation Change  

### 下一阶段原则（Owner · 写死 · 2026-07-20）

```text
不要继续优化经济数字
        ↓
补真实运行数据 · 市场数据 · 链上执行证据
        ↓
EGM：设计完成 → 认证完成
```

| 阶段 | EGM 状态 | 做什么 | 禁止 |
|------|----------|--------|------|
| **现在** | **设计完成**（Framework CLOSED） | 冻结数字 · 等 Release 主线证据 | 改 45/55 · 改 Access Fee · 改 Token 分配 · 调参「优化」 |
| **下一阶段** | Evidence → **认证完成** | 真实运行数据 · 市场数据 · 链上执行证据（EGM-00～06） | 用文档改写冒充认证完成 |

**认证完成 ≠** 再改一版经济模型。  
**认证完成 =** 在 **不变数字** 的前提下，用运行 / 市场 / 链上证据证明规则可审计、可扩展、可持续。

并行主线仍优先：FG-15-B → L5 Final → Recalculate → Formal Baseline；EGM Evidence 入口三条件满足后再采证。

**Owner 北极星：** [TT-OWNER-NORTH-STAR-CANDIDATE-V2-V311-LATEST](../../runbook/TT-OWNER-NORTH-STAR-CANDIDATE-V2-V311-LATEST.md) — 唯一冻结基线 = Candidate v2 + V3.1.1 · 证据提分 · 设计完成 → 认证完成 + Production GO（另闸）。

---

## 融资准备阶段（未来 · 正确顺序）

```text
Economic Freeze 解除
        ↓
EGM Evidence Collection
        ↓
Market Model Validation
        ↓
Regional Seat Valuation Cases
        ↓
Investor Economic Appendix
        ↓
Regional Seat Offering Package
```

**当前禁止**跳到融资准备任一步（FREEZE / STANDBY 未解除）。

---

## Evidence Phase 入口条件（写死 · 三条件 AND）

**进入 PSG-EGM Evidence Phase 前，须同时满足：**

```text
FG-15-B Final Evidence
        +
L5 Final Evidence
        +
Economic Freeze Window Closed
        ↓
PSG-EGM Evidence Phase
```

| # | 前置 | 当前 |
|---|------|------|
| 1 | FG-15-B Final Evidence | ⏳ FG-15-B **RUNNING** · append-only |
| 2 | L5 Final Evidence | ⏳ **WAIT** Timelock ETA / Settlement finalize |
| 3 | Economic Freeze Window Closed | ⏳ `ECONOMIC_MODEL_FREEZE` **ACTIVE** |

**未满足前三项前：** Evidence 保持 `NOT_STARTED` · **禁止**启动 EGM-00～06 证据采集。

### Evidence 阶段内顺序（满足入口后）

```text
EGM-00  Economic SSOT Integrity
  ↓
EGM-01  Token Governance Alignment
  ↓
EGM-02  Regional Seat Framework
  ↓
EGM-03  Revenue Distribution Policy
  ↓
EGM-04  Market & Growth Evidence
  ↓
EGM-05  Regional Seat Valuation Cases
  ↓
EGM-06  Sustainability Model
```

Case 扩展规则 **不变** — 唯一路径：

```text
Global Economic Governance Framework
        ↓
Regional Seat Instance
        ↓
Country Case Evidence
```

| EGM-05 | 允许 | 禁止 |
|--------|------|------|
| 中国 | `Case-CN-001` | CN Economic Model |
| 日本 | `Case-JP-001` | JP Economic Model |
| 泰国 | `Case-TH-001` | TH Economic Model |

---

## 最终状态（当前 · 写死）

```text
PSG-EGM
========

Framework:      CLOSED
Evidence:       NOT_STARTED
Certification:  WAITING
Blocking:       NONE
```

| 项 | 值 | 含义 |
|----|-----|------|
| Framework | **CLOSED** | 框架设计已收口 · 仅维护 Registry / 结构 / Cockpit |
| Evidence | **NOT_STARTED** | 入口三条件未齐 · 不采集 |
| Certification | **WAITING** | 等 Evidence Phase · **非** Release Blocker |
| Blocking | **NONE** | **不阻塞** FG-15-B / L5 / Recalculate / Formal Baseline |

---

## Release 主线 vs PSG-EGM（不干扰 · 写死）

**当前优先推进（Release 收口）：**

```text
FG-15-B
  ↓
L5 Final Evidence
  ↓
PSG Recalculate
  ↓
Formal Release Baseline
```

**PSG-EGM：** 保持冻结框架 · **NON-BLOCKING** · **不插入** 上述 Release 梯子 · **不触发** Hard Gate / Recalculate / Production GO。

Evidence Phase 入口 **晚于** L5 Final Evidence 与 Economic Freeze Window 关闭 — 与 Release 主线 **串行但独立**。

---

## 路径

| 类 | 路径 |
|----|------|
| Docs | [本目录](./) |
| Registry | [`registry/economic-governance/`](../../../registry/economic-governance/) |
| Evidence | [`evidence/PSG-EGM/`](../../../evidence/PSG-EGM/) |
| Cockpit | [TT-MODULE-RELEASE-COCKPIT-LATEST](../../runbook/TT-MODULE-RELEASE-COCKPIT-LATEST.md) |

---

## Cockpit 固定行

```text
PSG-EGM · Economic Governance Model Certification
Purpose: Validate economic governance consistency, regional seat framework,
         revenue allocation policy, and sustainability evidence.
Status: CLOSED_AS_FRAMEWORK_DESIGN · WAIT_FOR_EVIDENCE_PHASE
Impact: NON-BLOCKING
Constraint: Does not modify Economic Freeze, Hard Gate, Candidate v2,
            or Production GO criteria.
```
