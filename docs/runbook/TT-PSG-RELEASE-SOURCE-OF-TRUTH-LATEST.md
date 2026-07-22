# TT · PSG · Release Source of Truth（LATEST）

> **ARCHIVED_OR_SUPERSEDED under FINAL RELEASE（status lines below updated）** · Active = Candidate v2 @ `97289a71` · pin `PSG-REL-20260720-WEB3-CAND-V2` · FG-15-B **ELAPSED** · not a parallel release mainline.  
> Living pin table = tip `97289a71` · cert suite **FORBIDDEN** until [TT-FINAL-RELEASE-BASELINE-LATEST](./TT-FINAL-RELEASE-BASELINE-LATEST.md) `freeze_status=FROZEN`.

**阶段：** 全仓 Release 治理活层 · **≠** 变更 PSG Archive · **≠** ③ Production GO  
**Machine：** `TT_PSG_RELEASE_SSOT: ENFORCED` · `TT_PSG_VERSION_GATE: ENFORCED`  
**Registry：** [`registry/psg-release-source-of-truth.v1.yaml`](../../registry/psg-release-source-of-truth.v1.yaml)  
**当前版本钉：** [`registry/psg-release-version-LATEST.yaml`](../../registry/psg-release-version-LATEST.yaml)  
**Web3 mainline：** [`registry/web3-mainline.v1.yaml`](../../registry/web3-mainline.v1.yaml) · [Candidate v2](./TT-WEB3-CANDIDATE-V2-LATEST.md) · [Baseline Migration v2](./TT-WEB3-BASELINE-MIGRATION-V2-ALIGNMENT-LATEST.md)  
**Change Records：** [`registry/psg-change-records/`](../../registry/psg-change-records/)  
**Gate：** `python scripts/dev/run-psg-version-gate.py` · `bash scripts/gates/check-web3-mainline-candidate-v2-gate.sh`

---

## 0 · 写死：PSG = 唯一 Release Source of Truth · Web3 = Candidate v2

**当前唯一 Active Web3 / PSG pin：** `PSG-REL-20260720-WEB3-CAND-V2` · Candidate v2 @ `97289a71` · FG-15-B **ELAPSED**  
**FG-15-A：** `PSG-REL-20260719-FG15-09c72b93` · SHA `09c72b93` = **ARCHIVED_HISTORICAL** · **NOT FOR PROMOTION** · immutable evidence only。

满窗后（FG-15-B **ELAPSED**）：**禁止** Hard Gate 翻转 · **禁止** PSG Recalculate / L5 Cert 直至 FINAL RELEASE `freeze_status=FROZEN` · **禁止**用 FG-15-A 做新测试/验证/Promotion。

任何 **后续** 代码 · 合约 · API · CMS · 数据 · 基础设施变更，必须：

```text
① PCR Change Record
        ↓
② 同步 PSG Registry · Runbook · AGENTS/Cockpit · Evidence Index
        ↓
③ mint **新** PSG Release Version（旧版进 superseded[] / archived_historical · 禁止覆盖冻结钉）
        ↓
④ PSG Version Gate PASS + Web3 mainline Candidate gate PASS
        ↓
⑤ 才允许改代码与 Deploy
```

**禁止：** 绕过 PSG 直接部署；覆盖旧版本 / 旧证据 / 旧包；用 FG-15-A / Hardened / V1 Factory 冒充当前 Web3 SSOT。

**本地 ∥ 测试网必须同一 Active PSG Release Version（Candidate v2）。** 不一致 → **BLOCK**。

---

## 1 · 当前 Active Version（Candidate v2 · FG-15-B ELAPSED）

| 字段 | 值 |
|------|-----|
| `psg_release_version` | `PSG-REL-20260720-WEB3-CAND-V2` |
| `deploy_baseline` | `v311_fund_safety_candidate_v2` |
| `fg15_track` | FG-15-B · **ELAPSED** |
| `git_sha` | `97289a7185610ef0ad8822f0af04bfa533e42986`（Candidate tip · FINAL RELEASE pending freeze） |
| `freeze` | `CANDIDATE_CODE_FROZEN_PENDING_FINAL_RELEASE_FREEZE` |
| Release Identity | tip `97289a71` · Identity 改动须 PCR / 新 Version（非窗内 RUNNING） |
| PCR Promotion | **FORBIDDEN** until FINAL RELEASE `freeze_status=FROZEN` + cert path |
| mint 新 Version | **FORBIDDEN** until FINAL RELEASE freeze path allows |
| Evidence | FG-15-B observation **ELAPSED**（禁覆盖；禁写 FG-15-A 根） |
| 永久同版 | Local · Staging · Artifact · Runtime · Data · Evidence |

**当前只做：** FINAL RELEASE 八轴同钉 · 清旧 ACTIVE · **不**边修边认证。  
**禁止：** Hard Gate flip · PSG Completion Recalculate · real ETH Wave · cite `09c72b93` / tip `652bbab5` as ACTIVE。
  
**窗内不做：** PCR Promotion · 新 Release Version · Staging/Prod 补丁部署（直至 FINAL RELEASE freeze 路径）。  

**满窗后严格路径：**

```text
FINAL RELEASE freeze_status=FROZEN → Cert suite → PCR → PSG Registry/文档同步 → New Release Version → Version Gate → Deploy
```

（旧钉进 `superseded[]`；六轴永久同版前进，禁止分叉。）

---

## 2 · PSG Version Gate（七轴 + 双端一致）

| # | 轴 | 失败 |
|---|-----|------|
| 1 | Git SHA | 与 Active Version 不一致 |
| 2 | Artifact SHA | 旧包 / 未声明冲突 |
| 3 | Runtime Image | 旧镜像 / Staging 漂 |
| 4 | Contract Bytecode pin | 非 ACTIVE `v311_fund_safety_candidate_v2` |
| 5 | Database Baseline | 展示面/SSOT 漂 |
| 6 | CMS Baseline | Catalog bake / 10×4 漂 |
| 7 | Evidence | 缺失或旧证据冒充 |

另：**Local HEAD ↔ Staging 声明 SHA** 必须同属 Active Version。

```bash
# 部署前（已挂：identity → psg-version → freshness）
python scripts/dev/run-psg-version-gate.py --mode pre-deploy --env local
python scripts/dev/run-psg-version-gate.py --mode pre-deploy --env staging
python scripts/dev/run-psg-version-gate.py --mode check --env both   # 本地+测试网一致性
```

Owner 覆盖（罕见）：`TRAVELTRUST_PSG_VERSION_OVERRIDE=1`

---

## 3 · Change Record 最小字段

见 [`_TEMPLATE.yaml`](../../registry/psg-change-records/_TEMPLATE.yaml)。登记入 [`INDEX.yaml`](../../registry/psg-change-records/INDEX.yaml)。

首条：**PCR-001**（SSOT/Gate）· **PCR-002**（冻结钉锁）· **PCR-003**（**仅登记不晋升** · Evidence Append Only · 等 FG15 完成后再走 Release 流程）。

---

## 4 · 与双轨 / FG-15-B

| 轨 | 关系 |
|----|------|
| Track A Candidate / FG-15-B | Active Version = `PSG-REL-20260720-WEB3-CAND-V2` · append-only maintain |
| Track A′ FG-15-A Archive | `09c72b93` · **NOT FOR PROMOTION** · immutable |
| Track B Patch Ledger | PCR 可 `BLOCKED_FG15` · **不得**未 Promotion 就部署 |
| Identity / Freshness | Version Gate **之前/并行**硬闸；旧 FG-15-A 引用仍 BLOCK |

诚实边界：Version Gate PASS ≠ Production GO ≠ Archive 可变 · ≠ Hard Gate PASS。
