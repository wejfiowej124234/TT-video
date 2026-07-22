# TT · PSG Runtime Attestation（Candidate v2 / FG-15-B · no Hard Gate flip）

> **ARCHIVED_OR_SUPERSEDED under FINAL RELEASE** · Active = Candidate v2 @ `97289a71` · pin `PSG-REL-20260720-WEB3-CAND-V2` · FG-15-B **ELAPSED** · not release mainline.  
> Cert suite **FORBIDDEN** until [TT-FINAL-RELEASE-BASELINE-LATEST](./TT-FINAL-RELEASE-BASELINE-LATEST.md) `freeze_status=FROZEN`。

**Status:** **SUPERSEDED_SNAPSHOT** · capability doc · **Web3 SSOT = Candidate v2 @ `97289a71`** · FG-15-A archived · FG-15-B **ELAPSED** · **NO Hard Gate flip / NO Recalculate** until FINAL RELEASE freeze  
**Active Version:** `PSG-REL-20260720-WEB3-CAND-V2` · tip `97289a7185610ef0ad8822f0af04bfa533e42986` · baseline `v311_fund_safety_candidate_v2`  
**Historical archive:** `PSG-REL-20260719-FG15-09c72b93` · SHA `09c72b93` = **NOT FOR PROMOTION**  
**Entry:** `bash scripts/dev/run-web3-candidate-v2-runtime-attestation-entry.sh`  
**PCR:** [PCR-20260720-009](../../registry/psg-change-records/PCR-20260720-009.yaml) · Baseline Migration v2

## 治理集合已封顶（禁止再扩规则）

已足够，**不要**再增加 Gate / Registry / 平行政策：

PSG Source of Truth · PCR · Version Gate · Identity Gate · Freshness Gate · Promotion Gate · Runtime Attestation · Drift Scanner · **Web3 mainline Candidate gate**

下一阶段只做：**FINAL RELEASE freeze** → 首次 L5 Cert + Recalculate（cert **FORBIDDEN** now）。

## FG-15-B 期间正确动作（历史窗 · 现已 ELAPSED）

| 可以（历史窗） | 禁止 |
|------|------|
| FG-15-B Evidence Append Only | 用 FG-15-A / `09c72b93` 做新测试 |
| Candidate Money Path / Attestation entry | Hard Gate flip · PSG Recalculate |
| Scanner · STRICT 自检 · Dry-run | 真实 ETH Wave · 覆盖历史证据 |
| Drift 作**观察证据**保留 | 因 Drift 做 Mainnet 部署 |

```text
FG-15-B ELAPSED (Candidate v2 @ 97289a71)
  → FINAL RELEASE freeze_status=FROZEN（pending）
  → Web3 L5 Certification + PSG Completion Recalculate（FORBIDDEN until freeze）
```

## 仅剩三个真实验证（FG-15-B 满窗后）

| # | 验证 | dry-run / 能力 | 真实验证 |
|---|------|----------------|----------|
| 1 | **第一次 Promotion 实战** | Dry-run = PASS ≠ 真晋升 | PCR → PSG New Version → Artifact → Image → Deploy → `/meta` → Scanner |
| 2 | **STRICT Gate 真部署表现** | Gate 已存在 | 旧 Image/SHA/Runtime → **拒绝**；八轴一致 → **允许** |
| 3 | **数据基线** | DB/CMS Baseline 已入 pin | **Code Version + Data Baseline** 同属 Release |

## 五硬闸

### 1. Runtime 真源绑定

- API: `GET /meta` `build.*` + `GET /meta/release-identity`
- Web: `GET /api/release-identity`
- 字段: `psg_release_version` · `git_sha` · `image_digest` · `build_time` · `contract_profile` · `attestation_status`
- `attestation_status=unknown` → **BLOCK**

注入（canonical deploy）:

```text
TRAVELTRUST_PSG_RELEASE_VERSION
TRAVELTRUST_GIT_SHA
TRAVELTRUST_IMAGE_DIGEST
TRAVELTRUST_BUILD_TIME
TRAVELTRUST_CONTRACT_PROFILE
(+ NEXT_PUBLIC_* mirrors on Web)
```

### 2. Version Gate STRICT

```bash
TT_CANONICAL_DEPLOY=1 python scripts/dev/run-psg-version-gate.py --mode pre-deploy --env both
```

任一轴不等 → **DEPLOY BLOCKED**  
Local SHA == Artifact == Image Digest == `/meta` == PSG Version（+ contract/DB/CMS pins）

### 3. 禁止裸部署

**唯一入口:** `scripts/deploy/*.sh`（设 `TT_CANONICAL_DEPLOY=1`）

```bash
python scripts/dev/run-psg-bare-deploy-ban.py
```

裸 `fly deploy` / `forge script --broadcast` = **INVALID RELEASE ACTION**

### 4. Active Runtime Drift Scanner

```bash
python scripts/dev/run-psg-runtime-drift-scanner.py
```

输出: `NO_DRIFT` | `DRIFT DETECTED`  
轴: PSG · Git · Fly Web · Fly API · Contract · DB baseline · CMS baseline · Evidence

FG-15 窗内 **预期** `DRIFT DETECTED`（Staging 尚未注入 attestation）→ **保留为观察证据，不执行修复部署**。

### 5. Promotion Dry-run（首次真闭环预演）

```bash
python scripts/dev/run-psg-promotion-dry-run.py
# 或
python scripts/dev/run-patch-promotion-gate.py --mode dry-run
```

模拟: PCR → mint plan → artifact → STRICT → Staging deploy → `/meta` → Evidence  
**不** mint · **不** deploy · **不** execute

## FG15_ELAPSED 后首次真实 Promotion（Staging only）

**原则：废弃旧运行态 · 禁止在旧环境上打补丁「恢复一致」。**

保持 FG-15 **观察对象不变**；当前 Staging Drift = Runtime Attestation **观察证据**，**不**修复部署。  
窗内继续准备：Runtime Attestation · Data/CMS Baseline 绑定 · Promotion 实战清单（不 redeploy）。

```text
FG15_ELAPSED
  → 废弃当前旧 Staging 运行态（旧 Image / 半新数据 不作「补丁修好」对象）
  → PCR（批准变更纳入）
  → PSG New Release Version
  → Artifact / Image
  → STRICT Gate
  → Canonical Deploy (scripts/deploy/*)
  → Runtime Attestation (/meta) + Data/CMS Baseline + Scanner
  → Evidence Final（八轴一致 · 新 Staging）
```

八轴：PSG · Git · Artifact · Image · Runtime `/meta` · Contract · DB · CMS · Evidence  

**禁止**直接 Production。**禁止**在 FG-15 认证 Staging（旧包）上叠补丁冒充一致。

## 相关

- [Release SSOT](./TT-PSG-RELEASE-SOURCE-OF-TRUTH-LATEST.md)
- [FG-15 Window](./TT-FG15-OBSERVATION-WINDOW-RUNNING-LATEST.md)
- [scripts/deploy/README.md](../../scripts/deploy/README.md)
