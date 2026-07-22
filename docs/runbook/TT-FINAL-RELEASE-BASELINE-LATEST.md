# TT · FINAL RELEASE BASELINE（唯一体系 · 已冻结）

**Machine key:** `TT_FINAL_RELEASE_BASELINE`  
**Status:** `BASELINE_FROZEN` · **Freeze:** `FROZEN` · **Cert:** `ARMED_NOT_EXECUTED`（本会话**未**执行）  
**Registry:** [`registry/final-release-baseline.v1.yaml`](../../registry/final-release-baseline.v1.yaml)  
**系统总架构：** [`TT-FINAL-RELEASE-SYSTEM-ARCHITECTURE-LATEST`](./TT-FINAL-RELEASE-SYSTEM-ARCHITECTURE-LATEST.md)  
**工程绑定：** [`TT-ENGINEERING-SSOT-ANCHOR-LATEST`](./TT-ENGINEERING-SSOT-ANCHOR-LATEST.md)  
**污染清理：** [`TT-PSG-POLLUTION-CLEANUP-LATEST`](./TT-PSG-POLLUTION-CLEANUP-LATEST.md)  
**Gate:** `bash scripts/gates/check-final-release-baseline-freeze-gate.sh --require-frozen`  
**PCR：** `PCR-20260722-POLLUTION-CLEANUP-FREEZE`

**唯一体系：** Candidate v2 + V3.1.1 Final + PSG-EGM Final  
**Pin / Tip：** `PSG-REL-20260720-WEB3-CAND-V2` @ `97289a718561…`

---

## 0 · 冻结后仍禁止自动开跑（写死）

```text
FROZEN ≠ 已认证。本会话不启动：
  × PSG Recalculate
  × Feature Inventory READY 翻转
  × Reality Closure PASS 宣称
  × 正式 PSG Delta Recertify
  × Staging-grade GO / Hard Gate / Production GO
须 Owner 显式下令后才开一枪认证套件。
```

---

## 1 · 唯一体系（三基线 + PSG 全表面）

| 层 | ACTIVE 唯一 |
|----|-------------|
| **Web3 Runtime** | **Candidate v2** · `PSG-REL-20260720-WEB3-CAND-V2` · `v311_fund_safety_candidate_v2` · FG-15-B ELAPSED |
| **Web3 文档/宪章** | **V3.1.1 Final** · `TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL.md` |
| **经济治理** | **PSG-EGM Final** · `CLOSED_AS_FRAMEWORK_DESIGN` |
| **代码 Release tip** | `97289a718561…` (`97289a7185610ef0ad8822f0af04bfa533e42986`) |

### PSG 唯一体系包含

`code` · `contracts` · `api` · `cms` · `data` · `infrastructure` · `registry` · `runbook` · `evidence` · `release_identity` · Version Gate 七轴

### 八轴同钉目标

```text
Git SHA = Web Image = API Image = Runtime /meta
= Release Identity = Registry ACTIVE = PSG Pin = Evidence
```

### 禁止当 ACTIVE

| 类 | 例 |
|----|-----|
| 旧 Candidate / FG-15-A | `09c72b93` · clean baseline |
| Staging Align 临时 Pin | `PSG-REL-20260722-STAGING-ALIGN-W0` |
| FG15 临时维护 | PARALLEL / SIX / Standby RUNNING / `run-fg15-*` |
| Draft / Legacy 宪章 | V3 · V3.1 Final（SUPERSEDED） |
| Reality W0–W7 当发版主线 | 不插入本 Baseline |

---

## 2 · 当前对齐态（诚实）

| 轴 | 现状 |
|----|------|
| Local tip | `97289a718561` |
| Registry ACTIVE pin | `PSG-REL-20260720-WEB3-CAND-V2` @ `97289a718561` |
| Release Identity | `PSG-REL-20260720-WEB3-CAND-V2` @ `97289a718561` |
| Web Image SHA | `97289a718561` |
| Web Pin | **STALE** `STAGING-ALIGN-W0` |
| API | **BLOCKED** — `migration 20260708120000 was previously applied but has been modified` |
| Worktree | **DIRTY** → 冻结前须 clean 或 baseline commit |

**Alignment:** `BLOCKED` · **Freeze:** `NOT_FROZEN`

---

## 3 · 清理（Archive / Superseded / Deprecated · 不删）

- FG15 PARALLEL / SIX / ANOMALY / STANDBY → 已降级横幅
- V3.1 Final → SUPERSEDED → V3.1.1
- `run-fg15-*` → DEPRECATED
- `STAGING-ALIGN-W0` → superseded[]

---

## 4 · 冻结 Exit Criteria

1. 八轴同钉 PASS（API healthy @ tip · Web pin = Candidate v2）
2. 唯一三基线无 ACTIVE 分叉
3. 旧引用已 Archive/Superseded/Deprecated
4. Worktree clean 或 baseline commit
5. Gate `--require-frozen` PASS

冻结后：不再改 Pin / 核心宪章 / EGM 数字 / Registry ACTIVE；新问题进 Track B Patch。

---

## 5 · 冻结后一次性认证

```text
PSG Recalculate → Feature Inventory → Reality Closure
→ PSG Delta Recertify → Readiness → Staging-grade GO 判定
```

**≠** Production GO · **≠** Hard Gate · **≠** Mainnet Wave

---

## 下一步（冻结后）

**2026-07-22：** 污染清理已应用 · `freeze_status=FROZEN` · `cert_suite=ARMED_NOT_EXECUTED`。  
**本会话未启动** Delta / Inventory / Reality / GO。

Owner 显式下令后：Project A → PSG Recalculate/Inventory/Delta → Reality Closure → Staging-grade 判定。

**诚实边界：** FROZEN ≠ 已认证 ≠ Staging-grade GO ≠ Production GO。
