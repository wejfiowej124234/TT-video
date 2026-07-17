# TravelTrust Public Surface Governance（PSG）

**STATUS:** `ACTIVE` · supersedes PSTC naming for ongoing work  
**Hierarchy:** [Constitution v1](../governance/TT-ARCHITECTURE-CONSTITUTION-v1.md) → L0 → **[Governance Architecture](../../registry/governance-architecture.v1.yaml)**（稳定容器 · 六类 Domain · PSG-20 Platform Financial ≠ PSG-10 Payment · Repository Hygiene 平行轨）→ **PSG（slim · 生产认证 · PSG ∉ PF）** → PF  
**Domain matrix:** [`registry/psg-domain-coverage-matrix.v1.yaml`](../../registry/psg-domain-coverage-matrix.v1.yaml) · WBS：**Audit → Closure → Certification** · 一会话一域  
**Phase:** ② Staging only · **Production GO = NO_GO**（写死）  
**PF Step 5:** **FROZEN** until PSG Runtime Certification Exit PASS  
**Machine key:** `TT_PUBLIC_SURFACE_GOVERNANCE`  
**Board:** [TT-PUBLIC-SURFACE-GOVERNANCE-BOARD.md](./TT-PUBLIC-SURFACE-GOVERNANCE-BOARD.md)  
**PSTC legacy board:** [TT-PUBLIC-SURFACE-TRUTH-CLOSURE-BOARD.md](./TT-PUBLIC-SURFACE-TRUTH-CLOSURE-BOARD.md)（redirect → PSG）

---

## 0 · 一句话

所有公开面（UI · API · DB · CMS · COS · Media · Deploy · Runtime · Catalog · Bootstrap · Seed · Guest）遵守**同一套**数据生命周期与部署认证；**禁止**删库 / 手工清数据 / 前端去重掩盖 DB 非幂等。

**Solo Developer 执行梯（Owner = 你 · 无 PR / 无外部 Code Review）：**  
L0 → **PSG Review**（= Owner Self Review）→ Development → **Local Verification** → **Staging Certification** → **`TT_PSG_PRODUCTION_CERT=PASS`** → PF → **Production Entry Review**（= Owner Sign-off 前闸）→ Production GO。  
靠 **Evidence · Gate · Certification · Checklist · Release Archive** 自证，不靠 Approver / Reviewer / 双人审批。  
**默认工作流 SSOT：** [TT-PSG-SOLO-DEVELOPER-WORKFLOW-LATEST.md](./TT-PSG-SOLO-DEVELOPER-WORKFLOW-LATEST.md)。本地集：[solo-dev-rhythm §6.5](../solo-dev-rhythm.md)。

---

## 1 · 覆盖面（写死）

Home · Market · Provider · Acquisition · Guide · Community · Campaign · Pulse · Official Guide · Ambient · Banner

横切：CMS · COS · API DTO · Database UPSERT · Bootstrap · Seed · Guest · Deploy Evidence

---

## 2 · Runtime Certification 矩阵

| 模块 | 验证项 |
|------|--------|
| Home | Hero · CMS · Banner · Ambient |
| Market | Provider · Acquisition |
| Guide | Official Guide · Guide List |
| Community | Feed · Campaign · Official Post |
| CMS | Draft→Review→Approved→Published→Archived；Guest 仅 Published |
| COS | CMS→Asset→COS Object→CDN→Guest；引用断裂 = FAIL |
| API | DTO · country · status · language |
| Database | UPSERT · Canonical Key · Lifecycle（production/test/demo/historical） |
| Runtime | SHA · Migration · Bootstrap |
| Deploy | Board · Cockpit · Evidence |

---

## 3 · 永久 Deploy Gate（fail-fast）

```text
Git SHA → Migration → Database → OCS Bootstrap×2 → CMS Publish
  → COS Verify → API Contract → Public Surface Audit → Guest Runtime → PASS
```

任一步失败 → **Deploy FAIL** · 禁止进入下一步。  
入口：`bash scripts/gates/run-psg-runtime-certification.sh`

---

## 4 · P0 主线（当前）

| ID | 名称 | 目标 | 关闭条件 |
|----|------|------|----------|
| P0② | OCS/CMS UPSERT | 稳定键 + UNIQUE + 双次 bootstrap unique=10 | Staging 双次 bootstrap 后 Guest unique=10 |
| P0③ | CMS 治理 | Draft→…→Published→Archived；Guest 只读 Published | 生命周期机读 Gate PASS |
| P0④ | COS 治理 | 持久对象存储主存 · CMS→Asset→object_key→CDN→Guest | 破坏性 redeploy 后 broken=0 · 禁 ephemeral |
| P0⑤ | Public Data 治理 | production/test/demo/historical 彻底隔离 | Guest 混源 = FAIL |
| P0⑥–⑦ | API 契约 / Deploy Evidence | 见 Board | Board Exit |

PSTC 旧编号 ① LF / Step0 已吸收为 PSG Step0–①。

---

## 4a · Phase A · Foundation（当前最高优先级 · 禁止跳）

**顺序写死：** P0③ CMS → P0④ COS → P0⑤ Public Data → **再**整合部署 → 全表面 Runtime Cert → 才考虑解冻 PF Step 5。

| 文档 | 状态 |
|------|------|
| [TT-PSG-P0-3-CMS-GOVERNANCE.md](./TT-PSG-P0-3-CMS-GOVERNANCE.md) | FOUNDATION_READY |
| [TT-PSG-P0-4-COS-GOVERNANCE.md](./TT-PSG-P0-4-COS-GOVERNANCE.md) | GOVERNANCE_ENFORCED |
| [TT-PSG-P0-5-PUBLIC-DATA-GOVERNANCE.md](./TT-PSG-P0-5-PUBLIC-DATA-GOVERNANCE.md) | FOUNDATION_READY |
| [registry/psg-public-surface-matrix.v1.yaml](../../registry/psg-public-surface-matrix.v1.yaml) | ACTIVE |

**Deploy 纪律：** **禁止**单独部署 `46af7c70`（OCS Admin under freeze）。Foundation 三闸完成后一次整合部署。

**推进纪律：** 按治理能力推进，**禁止**继续按单页修 UI 冒充实收。


---

## 5 · 冻结与禁止

| 项 | 状态 |
|----|------|
| Production GO | **NO_GO** |
| PF Step 5 | **FROZEN** |
| 整树 Staging Deploy | **FORBIDDEN**（仅 scoped ACQ worktree） |
| DB DELETE / purge 伪装幂等 | **FORBIDDEN** |
| 前端去重冒充 DB 幂等 | **FORBIDDEN**（FE 仅 defense-in-depth） |

---

## 6 · Exit → 解冻 PF Step 5

**全部**公开面模块通过 §2 矩阵 + §3 Gate **PASS** 后，才可解除 PF 冻结并继续 Step 5。  
仍 **≠** Staging Batch PASS · **≠** Production GO。
