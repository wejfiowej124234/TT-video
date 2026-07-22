# WAIT_ETA · Discovery Freeze（LATEST）

> **ARCHIVED_OR_SUPERSEDED under FINAL RELEASE** · Active = Candidate v2 @ `97289a71` · pin `PSG-REL-20260720-WEB3-CAND-V2` · FG-15-B **ELAPSED** · not release mainline.  
> tip `652bbab5` / RUNNING / wait-window wording below = **SUPERSEDED_SNAPSHOT** · cert **FORBIDDEN** until FINAL RELEASE `freeze_status=FROZEN`.


**Machine:** `TT_WAIT_ETA_DISCOVERY_FREEZE`  
**Status:** `SUPERSEDED_SNAPSHOT` · `DISCOVERY_FROZEN` · `2026-07-20`  
**Pin:** `PSG-REL-20260720-WEB3-CAND-V2` · `v311_fund_safety_candidate_v2`  
**ETA Gate:** `WAITING_WINDOW`（Maintain only）

```text
关键发现（已确认 · 不修复本窗）
  Candidate tip / Registry / Evidence Identity  = 652bbab5…（认证目标）
  Staging Runtime /meta git_sha               = f8181b63…（运行时）
  ⇒ 认证目标 ≠ 当前 Staging Runtime
  ⇒ PSG 认证体系未假 PASS（五层 equals_l*_pass=false · psg_complete=0%）
```

---

## 0 · 一句话

**不是 PSG 证错了，是 Staging 还没对齐 Candidate。**  
Discovery 已足够 → **冻结扫描** → 问题进 **Post-Baseline Independent Backlog** → 等窗只 Maintain + ETA Gate。

---

## 1 · 对 Project A 的影响

| 问 | 答 |
|----|-----|
| 是否阻塞 WAIT_ETA / Settlement→…→Formal Baseline？ | **否** |
| 是否冒充「错误版本已认证通过」？ | **否**（无 L PASS · Complete=0%） |
| 是否等于 Production GO 风险已关闭？ | **否** · GO 另闸 |

**Project A 继续：**

```text
WAIT_ETA → Settlement finalize → Bridge A → L5 Final → S7 → Formal Baseline
```

**不是：** Production GO · Staging redeploy · Auth/CMS 修码。

---

## 2 · Discovery 包（已完成 · 冻结）

| 审计 | 状态 | SSOT |
|------|------|------|
| Release Runtime Drift | ✅ FROZEN | [TT-RELEASE-RUNTIME-DRIFT-AUDIT-DRY-RUN-LATEST](./TT-RELEASE-RUNTIME-DRIFT-AUDIT-DRY-RUN-LATEST.md) |
| **Release Runtime Consistency** | ✅ FROZEN（清单 A–E · Gap Checklist） | [TT-RELEASE-RUNTIME-CONSISTENCY-AUDIT-DRY-RUN-LATEST](./TT-RELEASE-RUNTIME-CONSISTENCY-AUDIT-DRY-RUN-LATEST.md) |
| **Production Readiness Gap** | ✅ FROZEN（剩余 User/Sec/Admin/Ops/Data/Onb · PCR 队列） | [TT-WAIT-ETA-PRODUCTION-READINESS-GAP-AUDIT-DRY-RUN-LATEST](./TT-WAIT-ETA-PRODUCTION-READINESS-GAP-AUDIT-DRY-RUN-LATEST.md) |
| **PSG SSOT Consistency（总册）** | ✅ FROZEN · Master Gap Checklist | [TT-PSG-SSOT-CONSISTENCY-AUDIT-DRY-RUN-LATEST](./TT-PSG-SSOT-CONSISTENCY-AUDIT-DRY-RUN-LATEST.md) |
| **Production Reality Consistency（终卷）** | ✅ FROZEN · 六维+六面+Post-Baseline PCR | [TT-PSG-PRODUCTION-REALITY-CONSISTENCY-AUDIT-DRY-RUN-LATEST](./TT-PSG-PRODUCTION-REALITY-CONSISTENCY-AUDIT-DRY-RUN-LATEST.md) |
| **Implementation Reality Mapping** | ✅ FROZEN · 七态不透明矩阵 · Ops 抬升 | [TT-PRODUCTION-IMPLEMENTATION-REALITY-MAPPING-AUDIT-DRY-RUN-LATEST](./TT-PRODUCTION-IMPLEMENTATION-REALITY-MAPPING-AUDIT-DRY-RUN-LATEST.md) |
| Auth Delta Recertify | ✅ FROZEN | [TT-PSG-DELTA-RECERTIFY-AUTH-IDENTITY-DRY-RUN-LATEST](./TT-PSG-DELTA-RECERTIFY-AUTH-IDENTITY-DRY-RUN-LATEST.md) |
| Auth / Feature Readiness | ✅ FROZEN | [TT-WAIT-ETA-PRODUCTION-FEATURE-READINESS-AUDIT-LATEST](./TT-WAIT-ETA-PRODUCTION-FEATURE-READINESS-AUDIT-LATEST.md) |
| CMS Governance | ✅ FROZEN | [TT-WAIT-ETA-CMS-PRODUCTION-GOVERNANCE-AUDIT-LATEST](./TT-WAIT-ETA-CMS-PRODUCTION-GOVERNANCE-AUDIT-LATEST.md) |
| Release Hygiene | ✅ FROZEN | [TT-WAIT-ETA-RELEASE-HYGIENE-AUDIT-LATEST](./TT-WAIT-ETA-RELEASE-HYGIENE-AUDIT-LATEST.md) |

**继续广扫收益：低。** 默认 **不再**开新 Discovery 轨（除非 ETA 后出现 Blocking Defect）。  
**终卷结论：** Candidate Formal Baseline **之后** 仍须 Wave 0–7 独立 PCR，否则六维/十维等式无法收口。  
**Planning SSOT：** [TT-POST-PSG-REALITY-CLOSURE-PLANNING-LATEST](./TT-POST-PSG-REALITY-CLOSURE-PLANNING-LATEST.md)（目标：PASS 后不再认证 A / 运行 B）。  
**总闸：** [TT-REALITY-CLOSURE-GATE-LATEST](./TT-REALITY-CLOSURE-GATE-LATEST.md) · `check-reality-closure-gate.sh` → 现 **NOT_ARMED** → 未来 `REALITY_CLOSURE_PASS` 才进 Production Readiness Review。  
**等窗唯一建议：** Maintain + Integrity + Catalog + Freshness + ETA Gate · **禁止**修 Auth/CMS/DB/redeploy。

---

## 3 · 已归档分类（进 Post-Baseline Backlog）

### ① OLD_RUNTIME（P0 · Staging Alignment）

| Candidate | Staging |
|-----------|---------|
| `652bbab5…` | `f8181b63…`（差 4 commits · ancestor） |

后续必须：`PCR → Version Gate → Deploy Identity → Staging Alignment → Runtime Certification`  
**禁止**裸 `fly deploy`。

### ② Web3 Runtime Mismatch（P0 · 与 Alignment 同批或紧随）

- `escrow_factory_v2=null` · SettlementRouter 缺失 · FeeRouter 不一致 · Indexer checkpoint=0  
- 影响未来 Money Path / L5 FG-Web3 / Production Entry  
- **禁止**用旧 Evidence 证明新 Runtime  

### ③ Auth = Production Feature Hardening（非 Runtime Drift）

- 已排除「仅因 Staging 太旧」  
- OTP 存在 · 生产生命周期不完整（所有权证明 / Reset / Audit / 安全控制）  
- 轨名：`AUTH-PROD-HARDENING`

### ④ CMS Governance Drift（独立）

- ② 运营成熟 · Governance 未 Ready · 证据 LATEST 债  
- 轨名：`CMS-GOV-CLEANUP`

---

## 4 · 等窗禁止（写死）

| 禁止 | 原因 |
|------|------|
| ❌ redeploy Staging | 污染 Candidate 收口窗 |
| ❌ 改 Candidate pin | Freeze |
| ❌ 修 Auth / CMS / 业务码 | 须独立 PCR |
| ❌ 改 Registry（本 Discovery 结论） | 须 Baseline 后 PCR |
| ❌ 开 Project B | 仍 FROZEN |
| ❌ 重跑 L5 Final / S7 | FINAL RELEASE 未 freeze（FG-15-B 已 ELAPSED） |

**允许：** `run-web3-candidate-v2-fg15b-maintain.sh` · ETA Gate 只读 · 低残差 Maintain。

---

## 5 · Formal Baseline 后顺序（独立周期）

```text
AUTH-PROD-HARDENING
        ↓
CMS-GOV-CLEANUP
        ↓
STAGING-RUNTIME-ALIGNMENT   （含 Web3 Runtime Identity / Indexer）
        ↓
Delta Recertify（独立 · ≠ 本窗 Project B）
```

每步：**独立 PCR** · Local → Staging → Runtime Certification · **不**写入 `PSG-REL-20260720-WEB3-CAND-V2` 冻结证据根。

真源排队：[TT-POST-BASELINE-INDEPENDENT-BACKLOG-LATEST](./TT-POST-BASELINE-INDEPENDENT-BACKLOG-LATEST.md)

---

## 6 · 机读

[`TT-WAIT-ETA-DISCOVERY-FREEZE-LATEST.json`](./TT-WAIT-ETA-DISCOVERY-FREEZE-LATEST.json)
