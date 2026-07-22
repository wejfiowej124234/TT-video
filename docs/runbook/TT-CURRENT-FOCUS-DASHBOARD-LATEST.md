# TODAY · Current Focus（执行态 · FROZEN）

> **ARCHIVED_OR_SUPERSEDED under FINAL RELEASE** · Active = Candidate v2 @ `97289a71` · pin `PSG-REL-20260720-WEB3-CAND-V2` · FG-15-B **ELAPSED** · not release mainline.  
> tip `652bbab5` / RUNNING / wait-window wording below = **SUPERSEDED_SNAPSHOT** · cert **FORBIDDEN** until FINAL RELEASE `freeze_status=FROZEN`.


> **Dashboard SCHEMA FROZEN** — [Readiness 六块](./TT-PSG-RELEASE-READINESS-DASHBOARD-LATEST.md)

---

## 双轨纪律（禁止混算）

| 轨 | 问什么 | 约完成度 | 不等于 |
|----|--------|----------|--------|
| **A · PSG Complete** | Release 闭环（现主线 = Candidate v2 / FG-15-B） | **重算前待定** | ≠ Mainnet Cutover Ready · ≠ 真 ETH GO |
| **B · Mainnet Cutover Ready** | 真 ETH 资金安全准入（Hard Gate 轴） | **≈80～85% · PAUSED** | ≠ PSG Complete · ≠ Wave |

```text
PSG Complete ≠ Mainnet Cutover Ready ≠ Hard Gate PASS ≠ Wave
≠ Staging-grade GO ≠ ③ Public/Mainnet Production GO
FG-15-A = ARCHIVED · FG-15-B / Candidate v2 = ACTIVE Web3 mainline
本周期 Scope A · OA-01 WC = Accepted Gap · 非主链焦点
```

---

## NOW · 轨 A · Web3 / PSG（Candidate v2 主线）

```text
【Owner 北极星 · LOCKED】
唯一冻结基线 = Candidate v2 + Constitution V3.1.1 Final
禁止再改规则 / 经济数字
优先: FG-15-B → L5 Final → PSG Recalculate
提分: 真实证据 → Product / Data / Security / Operations / Web3 / EGM
终点路径: 设计完成 → 认证完成 + Production GO（另闸 · ≠ 今日 GO）

ACTIVE Web3 Candidate = PSG-REL-20260720-WEB3-CAND-V2
FG-15-A (09c72b93) = ARCHIVED_HISTORICAL · NOT FOR PROMOTION · 证据不删
禁止假 Complete / 假 GO / 引用旧 pin 做 Promotion
```

| 层 | 状态 |
|----|------|
| 北极星 / 冻结基线 | ✅ [North Star](./TT-OWNER-NORTH-STAR-CANDIDATE-V2-V311-LATEST.md) |
| Candidate v2 code + digest | ✅ ACTIVE baseline |
| Constitution V3.1.1 | ✅ ECONOMIC_MODEL_FREEZE |
| Sepolia / Money Path | ✅ Live Happy+Dispute · ⏳ Settlement finalize after ETA `2026-07-21T18:10:48Z` |
| FG-15-B 观察 | ✅ **ELAPSED** · sample historical `20260720T021720Z` · Active tip `97289a71` · cert **FORBIDDEN** until FINAL RELEASE freeze |
| L5 Final / Recalculate | ⏳ 满窗后 · **禁止提前** |
| EGM | 设计完成 · Evidence NOT_STARTED · Skeleton EMPTY · NON-BLOCKING |
| **Hard Gate / Wave / Production GO** | **CUTOVER_REFUSED**（本轮复验 · 8 open axes）/ FORBIDDEN / **未触碰** |

### 等待窗 Evidence Prep（ACTIVE · 不改规则）

**MODE:** `APPEND_ONLY_MAINTAIN` · [PCR-033](../../registry/psg-change-records/PCR-20260720-033.yaml) · 至 ETA `2026-07-21T18:10:48Z`  
**SSOT：** [TT-PSG-WAIT-WINDOW-EVIDENCE-PREP-LATEST](./TT-PSG-WAIT-WINDOW-EVIDENCE-PREP-LATEST.md)  
**最新 sample：** `FG15B-SAMPLE-20260720T024526Z` · remaining ≈ **141922 s** · [PCR-035](../../registry/psg-change-records/PCR-20260720-035.yaml)

| 序 | 包 | 路径 | 状态 |
|----|-----|------|------|
| 1 | L3 Security | `evidence/PSG-L3-security/` | **READY_FOR_RECALCULATE**（≠ L3 PASS）· PCR-028 |
| 2 | L1 Product | `evidence/PSG-L1-product/` | **POINTERS_RECORDED**（≠ L1 PASS）· PCR-029 |
| 3 | L2 Data | `evidence/PSG-L2-data/` | **READY_FOR_RECALCULATE**（≠ L2 PASS）· PCR-030 |
| 4 | L4 Operations | `evidence/PSG-L4-operations/` | **READY_FOR_RECALCULATE**（≠ L4 PASS）· PCR-031 |
| 5 | FG-15 cases | `…/fg-cases/` | **STRUCTURE_INDEXED** · ≠ L5 PASS · PCR-032 |
| 6 | Drift Register | `evidence/PSG-DRIFT-REGISTER/` | **ACTIVE_ENRICHED** · PCR-032 |

**现在只做：** `bash scripts/dev/run-web3-candidate-v2-fg15b-maintain.sh`（+ Evidence 完整性 / Drift 维护）  
**满窗后（未到点禁止）：** Settlement finalize → L5 Final → PSG Recalculate → Formal Baseline · Hard Gate/Wave/GO 仍不触碰

```bash
source scripts/dev/lib/web3-candidate-v2-mainline.sh
bash scripts/dev/run-web3-candidate-v2-money-path-entry.sh
bash scripts/gates/check-web3-mainline-candidate-v2-gate.sh
```

SSOT：[TT-WEB3-CANDIDATE-V2-LATEST](./TT-WEB3-CANDIDATE-V2-LATEST.md) · [FG-15-A Archive](./TT-FG15-A-HISTORICAL-ARCHIVE-LATEST.md)

---

## NOW · 轨 B · Mainnet Cutover Ready（**PAUSED**）

> Hard Gate **fail-closed**。须 Candidate Sepolia + Money Path + FG-15-B 后再恢复 8 轴。  
> **禁止真实 ETH Wave。**

| 轴 / 项 | 状态 |
|---------|------|
| Web3 Candidate v2 | ✅ **ACTIVE mainline**（代码/digest） |
| Sepolia / Money Path / FG-15-B | ⏳ |
| Mainnet 8 轴 | **⏸ PAUSED** |
| **Hard Gate** | **REFUSED** |

SSOT：[TT-MAINNET-CUTOVER-HARD-GATE-LATEST](./TT-MAINNET-CUTOVER-HARD-GATE-LATEST.md)

---

## ARCHIVE · FG-15-A（只读）

| 项 | 状态 |
|----|------|
| Pin | `PSG-REL-20260719-FG15-09c72b93` |
| Mode | **ARCHIVED_HISTORICAL** · IMMUTABLE |
| 禁止 | 新测试/Promotion/Package 引用为 SSOT · 写入旧证据根 |

SSOT：[TT-FG15-A-HISTORICAL-ARCHIVE-LATEST](./TT-FG15-A-HISTORICAL-ARCHIVE-LATEST.md)
