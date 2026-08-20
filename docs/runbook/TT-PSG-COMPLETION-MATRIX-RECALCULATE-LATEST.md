# TT · PSG Production Completion Matrix · Recalculate（S7）

> **ARCHIVED_OR_SUPERSEDED under FINAL RELEASE** · Active = Candidate v2 @ `97289a71` · pin `PSG-REL-20260720-WEB3-CAND-V2` · FG-15-B **ELAPSED** · not release mainline.  
> 文内 `09c72b93` / `v311_sepolia_clean_baseline` / Hardened = **immutable historical archive · NOT FOR PROMOTION**。  
> **现行 SSOT：** [TT-WEB3-CANDIDATE-V2-LATEST](./TT-WEB3-CANDIDATE-V2-LATEST.md) · [TT-FINAL-RELEASE-BASELINE-LATEST](./TT-FINAL-RELEASE-BASELINE-LATEST.md)。  
> **禁止** Hard Gate flip · 冒充本文件为现行 ACTIVE · cert suite **FORBIDDEN** until FINAL RELEASE `freeze_status=FROZEN`。

> **FG-15-A 快照结果（2026-07-19）· 非现行。**  
> **现行：** Candidate v2 `PSG-REL-20260720-WEB3-CAND-V2` @ `97289a71` · FG-15-B **ELAPSED**（非 RUNNING）。  
> Recalculate / L5 Cert **仍 FORBIDDEN** 直至 FINAL RELEASE freeze · **禁止**冒充 ACTIVE = clean baseline。

**Machine:** `TT_PSG_PRODUCTION_COMPLETION_MATRIX`  
**Step:** `S7_Recalculate`  
**Recorded:** `2026-07-19`（FG-15-A Final Closure 后重跑 · **HISTORICAL**）  
**Status:** **ARCHIVED_HISTORICAL** · SUPERSEDED_SNAPSHOT · `psg_complete=false` · `production_go=false` · `ACTIVE_FLIP=FORBIDDEN` · **RECALCULATE_FORBIDDEN_UNTIL_FINAL_RELEASE_FROZEN**  
**Runner:** `bash scripts/dev/run-psg-completion-matrix-recalculate.sh`（须 refuse / ALLOW_HISTORICAL only）  
**Evidence:** [`PSG-COMPLETION-MATRIX-RECALCULATE-LATEST.json`](../../evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/PSG-COMPLETION-MATRIX-RECALCULATE-LATEST.json) · [`PSG-COMPLETION-VERDICT-LATEST.json`](../../evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/PSG-COMPLETION-VERDICT-LATEST.json)  
**Closure track:** [TT-FINAL-COMPLETION-CLOSURE-LATEST](./TT-FINAL-COMPLETION-CLOSURE-LATEST.md) · [Candidate v2](./TT-WEB3-CANDIDATE-V2-LATEST.md)

```text
PSG Complete = L1 ∧ L2 ∧ L3 ∧ L4 ∧ L5(含 FG-15)
             ∧ Release Identity（当前工作区等价）
             ∧ Owner Sign-off

本轮 Recalculate：汇总证据 · 输出 Verdict
禁止：自动 ACTIVE 翻转 · 自动 Production GO
```

---

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 overlay ROLLED_BACK · **≠** Candidate v2 · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)
> **GO 资格（Cycle2 overlay · 不改 freeze 8）：** `READY_FOR_OWNER_PRODUCTION_GO_VERDICT` · freeze unique entry `STOP` `required_before_go=8` · `current_required_before_go=0` · 下一步 = Owner 书面 **GO** 或 **继续 NO_GO**（`NOT_THIS_TURN`）· `TT_PRODUCTION_GO=NO_GO` · **禁止自动签发** · **禁止 bake www**

## 0 · 最终 Verdict

| 项 | 值 |
|----|-----|
| **`psg_complete`** | **`false`** |
| **Verdict** | `PSG_COMPLETION_RECALC_NOT_COMPLETE_AWAIT_FG15_ELAPSED_AND_SIGNOFF` |
| **ACTIVE（快照历史）** | 当时仍 `v311_sepolia_clean_baseline` · **未翻** · **现行 = Candidate v2** |
| **Production GO** | **未执行** · `production_go=false` |
| **Release Identity（快照历史）** | ✅ Final Closure re-pin（HEAD=`09c72b93…`）· **NOT FOR PROMOTION** |
| **FG-15** | `STARTED_IN_PROGRESS` · ends `2026-07-21T12:35:23Z` · **≠ ELAPSED** |
| **Owner Sign-off** | Package staged · **unsigned** |

---

## 1 · 五柱 Evidence 汇总

| Layer | Empirical pass | 权威产物 | 备注 |
|-------|:--------------:|----------|------|
| **L1 Product** | ✅ | `L1-PRODUCT-VALIDATION-LATEST.json` | 业务闭环 + Dispute live |
| **L2 Data** | ✅ | `L2-DATA-VALIDATION-HARDENED-LATEST.json` | Anvil/Hardened 相等；Sepolia Timelock live **Deferred** |
| **L3 Security** | ✅ | `L3-SECURITY-VALIDATION-HARDENED-LATEST.json` | Hardened 再验 PASS |
| **L4 Operations** | ✅ | `L4-OPERATIONS-VALIDATION-LATEST.json` | 监控/运维/事故/RBAC + 48H **FRAME** |
| **L5 FG-Web3** | ❌ | empirical + L5B/L5C + FG-15 | 相等切片有闭合 · **FG-15 未过** · empirical 仍 PARTIAL |

**方程结果：** 四柱 PASS · **L5 未过** → **PSG Complete = 否**

---

## 2 · Release SHA / Artifact / Bytecode / Evidence

| 检查 | 结果 |
|------|------|
| CDR-19 `Release_SHA` 钉扎 | ✅ `493596ae…`（历史 pin） |
| Equivalence Binding 记录时 | ✅ `BINDING_COMPLETE` |
| 当前 `HEAD` == `Release_SHA` | ❌ 漂移（Hardened 修复后工作区前进） |
| Deploy_Artifact 成员 sha256 vs 当前文件 | ❌ 多文件漂移（含 SettlementRouter / ABI） |
| Contract_Bytecode / Evidence_Package 字段存在 | ✅（钉扎时刻） |
| **当前工作区等价链** | ❌ **OPEN** |

**诚实：** 历史 CDR-19 pin ≠ 当前工作区 Source=Artifact=Bytecode=Evidence 仍闭合。要宣称 Complete / GO，须 **再钉扎或显式等价对账**。

---

## 3 · Deferred（摘录）

| ID | 含义 | 阻 PSG Complete？ |
|----|------|:-----------------:|
| `FG-15-OBSERVATION-48H` | FRAME_READY · 窗未开/未满 | **是** |
| `L5-EMPIRICAL-PARTIAL` | empirical `l5_pass=false` | **是** |
| `RELEASE-SHA-HEAD-DRIFT` / Artifact hash drift | 钉扎后源码前进 | **是** |
| `L2-SEPOLIA-LIVE-LIFECYCLE` | Sepolia Timelock live money-path | 否（阻主网 GO） |
| `ACTIVE-FLIP-DEFERRED` | Hardened 非 ACTIVE | 否（阻 GO） |
| `OWNER_SIGNOFF_MISSING` | 无 Completion Sign-off 产物 | **是** |

---

## 4 · 48H Observation

| 态 | 本轮 |
|----|------|
| FRAME_READY | ✅ |
| START | ❌ |
| ELAPSED PASS（FG-15） | ❌ |

```text
FRAME_READY ≠ 48H Observation PASS
```

---

## 5 · Owner Sign-off 条件

| 条件 | 本轮 |
|------|:----:|
| 五层全 PASS | ❌（L5） |
| FG-15 已过 | ❌ |
| Release Identity 当前 OK | ❌ |
| Sign-off 产物存在 | ❌ |
| **可签 / 已签** | **否 / 否** |

> G-RC CLOSED Owner 声明已存在（另闸）· **≠** PSG Completion Sign-off。

---

## 6 · Blockers（机读）

1. `L5_FG_Web3_NOT_PASS_FG15_OR_EMPIRICAL`  
2. `RELEASE_IDENTITY_CURRENT_NOT_OK`  
3. `OBSERVATION_48H_NOT_ELAPSED`  
4. `OWNER_SIGNOFF_MISSING`

---

## 7 · 下一步（不自动执行）

1. Owner 开窗：`OBSERVATION-48H-START-LATEST.json` → 持续观察六面 → ELAPSED  
2. 关闭 / 对账 L5 empirical 剩余 gap（相对 L5B/L5C）  
3. Remediation 后 **再钉扎 Release_SHA** 或写等价对账包  
4. 条件满足后 **Owner Sign-off**（人工）  
5. 仅此后进入 Production Certification · **仍另闸** Production GO / ACTIVE 翻转  

---

## 8 · 命令

```bash
bash scripts/dev/run-psg-completion-matrix-recalculate.sh
```
