# TT · Web3 Candidate v2 · FG-15-B Standby（Timelock → L5 Final → Recalculate → Formal Baseline）

> **ARCHIVED_OR_SUPERSEDED under FINAL RELEASE** · Active = Candidate v2 @ `97289a71` · pin `PSG-REL-20260720-WEB3-CAND-V2` · FG-15-B **ELAPSED** · not release mainline.  
> Standby / RUNNING 叙述过期 · **禁止**当 living ACTIVE。  
> FG-15-B：**ELAPSED**（非 RUNNING）· **现行 SSOT：** [TT-WEB3-CANDIDATE-V2-LATEST](./TT-WEB3-CANDIDATE-V2-LATEST.md) · [TT-FINAL-RELEASE-BASELINE-LATEST](./TT-FINAL-RELEASE-BASELINE-LATEST.md)  
> Pin：**FROZEN** `PSG-REL-20260720-WEB3-CAND-V2` · FINAL RELEASE pending freeze · cert suite **FORBIDDEN** until `freeze_status=FROZEN`

**STATUS:** **ARCHIVED_HISTORICAL** · FG-15-B **ELAPSED** · **MODE:** historical standby snapshot  
**Recorded:** 2026-07-20 · maintain sample `20260720T024526Z` · mode PCR-033 · ticks PCR-034/035  
**ACTIVE SSOT (living):** `PSG-REL-20260720-WEB3-CAND-V2` @ `97289a71` · `v311_fund_safety_candidate_v2` · FG-15-B **ELAPSED**  
**Constitution:** V3.1.1 **ECONOMIC_MODEL_FREEZE** · **Appendix F** Candidate Financial-Grade Binding **HELD**  
**Owner North Star:** [TT-OWNER-NORTH-STAR-CANDIDATE-V2-V311-LATEST](./TT-OWNER-NORTH-STAR-CANDIDATE-V2-V311-LATEST.md)  
**PCR:** [`PCR-20260720-033`](../../registry/psg-change-records/PCR-20260720-033.yaml) · [`PCR-20260720-035`](../../registry/psg-change-records/PCR-20260720-035.yaml)


---

## 冻结纪律（写死 · 全过程）

| 项 | 状态 |
|----|------|
| ECONOMIC_MODEL_FREEZE | **HELD** · 第一～十一章不改 |
| Appendix F Candidate binding | **HELD** |
| Candidate v2 baseline pin | **FROZEN** |
| Hard Gate | **CUTOVER_REFUSED** · **禁止修改 / 翻闸** |
| Mainnet Wave | **FORBIDDEN** · **禁止触发** |
| FG-15-A / `09c72b93` | Historical Archive only |
| PSG Recalculate | **FORBIDDEN until FG15_B_ELAPSED** |
| Formal Release Baseline mint | **FORBIDDEN until ELAPSED + L5 Final + Recalculate** |

---

## 时间窗

| 事件 | UTC | 状态（本轮） |
|------|-----|-------------|
| FG-15-B started | `2026-07-19T18:06:48Z` | ✅ |
| **earliest FG15_B_ELAPSED** | `2026-07-21T18:06:48Z` | ✅ **ELAPSED**（snapshot） |
| **Settlement Timelock ETA** | `2026-07-21T18:10:48Z` | ✅ ETA passed（snapshot） |
| L5 Final Money Path Evidence | finalize 成功后 | ⏳ blocked on ETA |
| PSG Completion Recalculate | ELAPSED 后 | ⏳ blocked |
| Formal Web3 Release Baseline | Recalculate 后 | ⏳ blocked |

---

## NOW · 允许做

```bash
bash scripts/dev/run-web3-candidate-v2-fg15b-maintain.sh
bash scripts/gates/check-web3-mainline-candidate-v2-gate.sh
bash scripts/gates/check-mainnet-cutover-hard-gate.sh   # 须仍 CUTOVER_REFUSED
```

本轮 maintain → `FG15B-SAMPLE-20260720T024526Z.json` · **APPEND_ONLY_MAINTAIN** · Settlement remaining ≈ **141922 s**（至 `2026-07-21T18:10:48Z`）。

**Maintain 模式允许：** FG-15-B append-only sample · Evidence 完整性核对 · Drift Register 维护  
**Maintain 模式禁止：** 新增测试范围 · 改规则/数字 · finalize · Recalculate · Formal Baseline · Hard Gate · Wave · GO · 宣称 L5 PASS · **任何提前 Release 闸门**

**完整性快照：** Drift `ACTIVE_ENRICHED` (11) · last_maintain 已刷新 · FG index `STRUCTURE_INDEXED_COLLECTING_WAIT` · `equals_l5_pass=false`

---

## NEXT · 满窗顺序（Owner · 写死 · 严格串行）

**触发条件（AND）：** `FG15_B_ELAPSED`（≥ `2026-07-21T18:06:48Z`）**+** Settlement Timelock ETA（≥ `2026-07-21T18:10:48Z`）

```text
1) Settlement finalize
   export TRAVELTRUST_WEB3_CANDIDATE_V2_SEPOLIA_DEPLOY_OK=1
   bash scripts/dev/run-web3-candidate-v2-settlement-finalize.sh
   → L5 Final Money Path Evidence
     (CANDIDATE-V2-LIVE-MONEY-PATH-L5-RUNTIME-FINAL-LATEST.json)

2) PSG Completion Recalculate（须 elapsed_pass）
   python scripts/dev/run-psg-completion-matrix-recalculate.py
   → 门闸 refuse_unless_fg15_b_elapsed_or_historical
   → Evidence 修 Drift · 提分（Product/Data/Security/Operations/Web3/EGM）
   → 仍禁止 Hard Gate / Wave / Production GO

3) Formal Candidate v2 Release Baseline
   bash scripts/dev/run-web3-candidate-v2-formal-release-baseline.sh
   → evidence/GO_web3_candidate_v2/WEB3-CANDIDATE-V2-FORMAL-RELEASE-BASELINE-LATEST.json
   → docs/runbook/TT-WEB3-CANDIDATE-V2-FORMAL-RELEASE-BASELINE-LATEST.md
   → 满窗前本脚本 exit 3 WAIT

全过程：ECONOMIC_MODEL_FREEZE · Appendix F · Hard Gate REFUSED · Wave FORBIDDEN · Production GO 未触碰
```

**禁止跳步：** 不得在 finalize 前 Recalculate；不得在 Recalculate 前 Formal Baseline；不得用文档改写冒充 Certification Complete。

---

## L5 Money Path Evidence（诚实态）

| 切片 | 状态 |
|------|------|
| Happy | **PASS** |
| Dispute | **PASS** |
| Settlement schedule | **SCHEDULED_PENDING_EXECUTE** |
| Settlement execute + L5 Final | **WAIT Timelock ETA** |

---

## 预置脚本（满窗前必拒）

| 脚本 | 未满窗 |
|------|--------|
| `run-web3-candidate-v2-settlement-finalize.sh` | WAIT / REFUSE |
| `run-psg-completion-matrix-recalculate.py` | REFUSE（tt-fg15b） |
| `run-web3-candidate-v2-formal-release-baseline.sh` | **exit 3 WAIT** |
