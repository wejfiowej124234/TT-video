# TT · FG-15 并行上线准备（48H 窗口）

> **ARCHIVED_OR_SUPERSEDED under FINAL RELEASE** · Active = Candidate v2 @ `97289a71` · pin `PSG-REL-20260720-WEB3-CAND-V2` · FG-15-B **ELAPSED** · not release mainline.  
> FG-15-A 并行准备 · **NOT FOR PROMOTION** · **禁止**当 living ACTIVE。  
> **现行 SSOT：** [TT-WEB3-CANDIDATE-V2-LATEST](./TT-WEB3-CANDIDATE-V2-LATEST.md) · [TT-FINAL-RELEASE-BASELINE-LATEST](./TT-FINAL-RELEASE-BASELINE-LATEST.md)  
> 法医：`TRAVELTRUST_ALLOW_HISTORICAL_BASELINE=1`

**Machine:** `TT_FG15_PARALLEL_LAUNCH_PREP`  
**Status:** **ARCHIVED_HISTORICAL** · SUPERSEDED_SNAPSHOT · **禁止** PASS/GO/ACTIVE  
**Recorded:** `2026-07-19`  
**Runner:** `python scripts/dev/run-fg15-parallel-launch-prep.py`（historical only）

```text
FG-15 Observation Running
          |
          ├── Production Certification Package（DRAFT）
          ├── Owner Sign-off Package Draft
          ├── Operations SOP Finalize
          ├── CMS / Market Launch Preparation
          └── Final Risk Register

48H 后（另闸）:
FG-15 PASS → Owner Sign-off → PSG Recalculate
         → Production Certification → GO / NO-GO
```

> **阶段一句话：** 代码冻结，证据累积；所有上线准备向 FG-15 结束时收敛。

## 双轨纪律

| 轨 | 只做 | 禁止 |
|----|------|------|
| **FG-15** | 采样 · 监控 · 记 Evidence | 改 SHA/合约/配置 · 重部署 · ACTIVE · GO |
| **Parallel Prep** | 深化 Cert/Dossier/Risk/SOP/CMS 清单 | 伪 PASS · 最终签名 · 发布动作 |

---

## 0 · 硬禁（窗内）

| 禁止 | 原因 |
|------|------|
| ACTIVE 翻转 | Freeze 政策 |
| Production GO | 另闸 |
| 宣称 FG-15 ELAPSED PASS | 墙钟未到 |
| Owner 签最终 PASS | 须等 FG-15 |
| 改 Release_SHA / 合约地址 / 基线 | 观察冻结 |

---

## 1 · 六并行包（优先序 · 已落盘）

**SSOT 索引：** [TT-FG15-SIX-PARALLEL-PREP-LATEST](./TT-FG15-SIX-PARALLEL-PREP-LATEST.md) · `FG15-SIX-PARALLEL-PREP-INDEX-LATEST.json`

| # | 包 | 机读 | 人文 |
|---|-----|------|------|
| 1 | Production Certification Package | `PRODUCTION-CERTIFICATION-PACKAGE-DRAFT-LATEST.json` | [Cert Draft](./TT-PRODUCTION-CERTIFICATION-PACKAGE-DRAFT-LATEST.md) |
| 2 | Owner Sign-off Draft（未签） | `OWNER-SIGNOFF-PACKAGE-DRAFT-LATEST.json` | [Owner Draft](./TT-OWNER-SIGNOFF-PACKAGE-DRAFT-LATEST.md) |
| 3 | Launch Day Checklist | `LAUNCH-DAY-CHECKLIST-LATEST.json` | [Checklist](./TT-LAUNCH-DAY-CHECKLIST-LATEST.md) |
| 4 | Ops / Incident Case 1/2/3 | `OPS-INCIDENT-RUNBOOK-LAUNCH-LATEST.json` | [Incident](./TT-OPS-INCIDENT-RUNBOOK-LAUNCH-LATEST.md) |
| 5 | 主网环境预检（只读） | `MAINNET-ENV-PREFLIGHT-READONLY-LATEST.json` | [Env Preflight](./TT-MAINNET-ENV-PREFLIGHT-READONLY-LATEST.md) |
| 6 | 运营材料 + 人工验收计划 | `LAUNCH-OPS-MATERIALS-LATEST.json` · `MANUAL-UAT-EXECUTION-PLAN-LATEST.json` | [Ops Materials](./TT-LAUNCH-OPS-MATERIALS-LATEST.md) · [Manual UAT](./TT-MANUAL-UAT-EXECUTION-PLAN-LATEST.md) |

附属：Risk · Dossier · CMS · Launch Final Pack · Evidence Index（见驾驶舱 / Final Pack）

---

## 2 · Production Certification Package

已收录（DRAFT · 满窗后直接签，不重整理）：

- PSG Completion Matrix + Recalculate 指针  
- L1–L5 Evidence Index  
- 合约地址清单（Hardened · NOT_ACTIVE）  
- Release SHA=`09c72b93…` 证明  
- Bytecode Hash（Escrow / Factory / SR / FeeRouter）  
- Deployment Tx 列表  
- Security Audit Result（L3 Hardened）  
- Risk Register · Deferred Items · Rollback Plan 指针  

---

## 3 · 日常仍做

```bash
# 推荐一键：采样 + integrity + 六并行包 + Launch Pack（不 Sign-off / 不 GO）
bash scripts/dev/run-fg15-running-maintain.sh

# 仅刷新六并行包
python scripts/dev/run-fg15-six-parallel-prep-packs.py

# 观察心跳（含 elapsed-eval · 未满窗 REFUSED）
bash scripts/dev/run-fg15-observation-running.sh

# Dossier / Risk 深化（不改 SHA）
python scripts/dev/run-fg15-parallel-launch-prep.py
python scripts/dev/run-fg15-parallel-launch-prep-deepen.py
```

完整性机读：`FG15-RUNNING-INTEGRITY-CHECK-LATEST.json`（须 `integrity_ok=true` · Owner `signed=false` · equality quad PASS）。

---

## 4 · 满窗顺序（提醒）

1. `run-fg15-observation-elapsed-eval.py` → **FG-15 ELAPSED PASS**  
2. Owner Sign-off（人工）  
3. PSG Completion Recalculate  
4. Production Certification FINAL  
5. **GO / NO-GO 另闸**
