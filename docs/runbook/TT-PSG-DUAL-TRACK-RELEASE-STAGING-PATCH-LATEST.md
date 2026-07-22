# TT · PSG · Dual-Track Release ∥ Staging Patch（LATEST）

> **ARCHIVED_OR_SUPERSEDED under FINAL RELEASE** · Active = Candidate v2 @ `97289a71` · pin `PSG-REL-20260720-WEB3-CAND-V2` · FG-15-B **ELAPSED** · not release mainline.  
> tip `652bbab5` / RUNNING / wait-window wording below = **SUPERSEDED_SNAPSHOT** · cert **FORBIDDEN** until FINAL RELEASE `freeze_status=FROZEN`.


**阶段：** 治理活文档 · **≠** ③ Production GO · **≠** 变更 PSG Archive  
**Machine：** `TT_DUAL_TRACK_RELEASE: ENFORCED` · `TT_DEPLOYMENT_IDENTITY_GATE: ENFORCED` · `TT_PATCH_PROMOTION_GATE: ENFORCED`  
**Registry：** [`registry/staging-patch-queue.v1.yaml`](../../registry/staging-patch-queue.v1.yaml) · [`registry/deployment-identity-gate.v1.yaml`](../../registry/deployment-identity-gate.v1.yaml) · [`registry/patch-promotion-gate.v1.yaml`](../../registry/patch-promotion-gate.v1.yaml)  
**Ledger：** [TT-STAGING-PATCH-LEDGER-LATEST](./TT-STAGING-PATCH-LEDGER-LATEST.md) · **晋升：** [TT-PSG-PATCH-PROMOTION-GATE-LATEST](./TT-PSG-PATCH-PROMOTION-GATE-LATEST.md)

---

**PSG = 唯一 Release Source of Truth：** 变更须先 [PCR Change Record](../../registry/psg-change-records/) → 同步活文档 → mint [PSG Release Version](../../registry/psg-release-version-LATEST.yaml) → 才改代码/部署。部署链：Identity → **PSG Version Gate**（本地=测试网同版）→ Freshness。详见 [TT-PSG-RELEASE-SOURCE-OF-TRUTH-LATEST](./TT-PSG-RELEASE-SOURCE-OF-TRUTH-LATEST.md)。

---

## 0 · 写死：双轨 · 禁止混用 · Track B 非永久分叉

| 轨道 | 名称 | SHA / 队列 | 负责 | 可动？ |
|------|------|------------|------|--------|
| **A** | Web3 Candidate v2 / FG-15-B | `PSG-REL-20260720-WEB3-CAND-V2` · `v311_fund_safety_candidate_v2` | Candidate observation · Money Path · L5 Cert prep | **唯一 Web3 SSOT**（窗内禁 Hard Gate flip / Recalculate） |
| **A′** | FG-15-A Historical Archive | `09c72b93` · `v311_sepolia_clean_baseline` | Forensic only | **ARCHIVED** · NOT FOR PROMOTION · `ALLOW_HISTORICAL=1` only |
| **B** | Staging Operational Patch Queue | `PATCH-STG-*`（**临时**） | 运营稳定性 · 展示 · 闸 · 活文档 | 可排队 · **必须晋升** · 不得永久分叉 |

**禁止：** 用 Track B 冒充 Track A；用 Track A 冻结 SHA 假装已含 ops 补丁；**Staging 长期新于 Cert 却不晋升**（另一种漂移）。

**合法出口（Promotion）：** STAGING_PATCH → 验证 → 更新 PSG → RC → 再生 Release Identity → 下一次 Certification — 详见 [Patch Promotion Gate](./TT-PSG-PATCH-PROMOTION-GATE-LATEST.md)。

**PSG = Deployment Source of Truth（活层）：** Web / API / Contract / Indexer / CMS / Infra 变更须先更新 **Registry · Runbook · AGENTS/Cockpit · Evidence Index · Release Identity**，再进 Deploy Gate。旧文档 / 旧包 / 旧镜像 **不得**再当有效依据。

---

## 1 · Deployment Identity Gate（三问硬闸）

每次部署前必须回答：

| # | 问题 | 机读 |
|---|------|------|
| 1 | **部署来源？** Release SHA = ? | `git rev-parse HEAD` |
| 2 | **是否含工作区修改？** | `git status --porcelain` + artifact 声明 |
| 3 | **部署目标？** | `DEPLOY_TARGET` ∈ `CERTIFICATION_FREEZE` \| `STAGING_PATCH` \| `EXPERIMENT` |

```bash
export DEPLOY_TARGET=STAGING_PATCH          # 必填 · 禁止省略
export TT_STAGING_PATCH_IDS=PATCH-STG-001,PATCH-STG-005
python scripts/dev/run-deployment-identity-gate.py --mode pre-deploy

# 已挂：staging-rc-baseline-gate → deploy-freshness-gate → identity gate
```

| `DEPLOY_TARGET` | 规则 |
|-----------------|------|
| `CERTIFICATION_FREEZE` | HEAD 必须 = Candidate freeze `652bbab51a1e…`（`PSG-REL-20260720-WEB3-CAND-V2`）· **禁止 dirty** · 禁止挂 Patch ID |
| `STAGING_PATCH` | 必须 `TT_STAGING_PATCH_IDS` 且 ID 在 Ledger/Registry · dirty 须如实记录 · **须 FG-15-B ELAPSED** |
| `EXPERIMENT` | 须 `TRAVELTRUST_DEPLOY_EXPERIMENT_OK=1` · **禁止**宣称 Cert / GO |

**四方一致（与 Freshness 联闸）：** Git SHA · Artifact/Build · Docker/Fly image · Evidence/Runtime meta — 不一致 → **BLOCK**。

---

## 2 · 变更先分类（最重要）

| 类型 | 处理 |
|------|------|
| 金融规则 / 合约 / 权限 | **重新进入 Release**（Track A） |
| Web3 Runtime | **重新认证** |
| 用户功能 | Release Candidate |
| CMS / 展示数据 | **Patch Queue**（Track B） |
| 文档（活） | 不影响 Archive；同步入口 |
| 运维脚本 / 闸 | Patch Queue 独立 |

分类后：**同步** Registry · Runbook · AGENTS/Cockpit · Evidence Index。禁止只改代码不改 PSG 活层。

---

## 3 · FG-15-B 窗内正确动作（两类 · 勿混）

**冻结钉 `PSG-REL-20260720-WEB3-CAND-V2` 保护的是：Candidate v2 Web3 SSOT + FG-15-B 观察一致性。**  
**FG-15-A `09c72b93` = ARCHIVED_HISTORICAL · NOT FOR PROMOTION。**  
**不是**「一切都必须等满 48h」——看**变更类型**。

### 3.1 现在可以做（不改变 FG-15-B 观察对象）

| 类 | 允许 | 禁止 |
|----|------|------|
| **① Docs / Registry / Evidence** | PSG 文档 · Runbook · AGENTS/Cockpit · Patch Ledger · Evidence Index · Baseline Migration | 改 Candidate tip · 冒充已部署 · cite FG-15-A 为 ACTIVE |
| **② 非金融 UI Patch（准备）** | 登记 `PATCH-STG-*` / PCR · 改代码 · **本地**测 · Patch Evidence | **部署进当前认证 Staging** |

例：**旅行收购角标颜色**（`PATCH-STG-005`）= UI Presentation Bug  
不影响：合约 · 钱路 · 权限 · 数据模型 · Release Identity  

```text
PATCH-STG-xxx → 本地修复 → 测试 → Ledger（BLOCKED_FG15） → FG-15-B ELAPSED → Promotion → 新 Version → Staging Deploy
```

### 3.2 必须等 FG-15-B ELAPSED

| 禁止（窗内） |
|-------------|
| API / 数据结构 / CMS 基线变化 · Contract · 权限 · Web3 配置变化（Settlement finalize after ETA 除外） |
| 重新部署 Web/API · Promotion execute · 改 Candidate freeze tip · mint 新 Release Version |
| Hard Gate flip · PSG Completion Recalculate · cite `09c72b93` as ACTIVE |

| 继续 | 不要 |
|------|------|
| FG-15-B **append-only maintain**（`…_candidate_v2/`） | redeploy / merge patch 进冻结 tip |
| Track B Ledger **登记 + 本地验证** | Promotion **execute** |
| `run-patch-promotion-gate.py --mode check\|plan` | `STAGING_PATCH` / `EXPERIMENT` **部署** |
| Settlement finalize **after Timelock ETA** | Hard Gate flip / Recalculate |

**满窗后唯一合法路径：**

```text
FG-15-B ELAPSED
  → Web3 L5 Certification + PSG Completion Recalculate
  → Candidate v2 → formal PSG Web3 Release Baseline
  → PCR/Promotion → New Release Version → STRICT → Canonical Deploy
```

```bash
python scripts/dev/run-patch-promotion-gate.py --mode check
bash scripts/dev/run-web3-candidate-v2-fg15b-maintain.sh
```

诚实边界：Track B 本地 PASS ≠ Staging 已上该 patch ≠ Track A Cert ≠ Production GO。

---

## 4 · 现在最合理下一步（本轮）

1. **保持 Candidate v2 / FG-15-B freeze** — 观察对象固定 `PSG-REL-20260720-WEB3-CAND-V2`。  
2. 继续 ① 文档对齐 · ② 非金融 UI 本地准备 · **不**进认证 Staging。  
3. Timelock ETA 后 Settlement finalize + L5 Final Evidence。  
4. FG-15-B ELAPSED 后 L5 Cert + Recalculate + Baseline 晋升。
