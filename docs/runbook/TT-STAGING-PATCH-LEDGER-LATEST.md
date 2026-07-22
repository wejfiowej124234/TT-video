# TT · Staging Patch Ledger（LATEST）

> **ARCHIVED_OR_SUPERSEDED under FINAL RELEASE** · Active = Candidate v2 @ `97289a71` · pin `PSG-REL-20260720-WEB3-CAND-V2` · FG-15-B **ELAPSED** · not release mainline.  
> tip `652bbab5` / RUNNING / wait-window wording below = **SUPERSEDED_SNAPSHOT** · cert **FORBIDDEN** until FINAL RELEASE `freeze_status=FROZEN`.


**轨道：** B · Staging Operational Patch Queue（**临时** · 须晋升）  
**Machine：** `TT_STAGING_PATCH_QUEUE: ACTIVE_TEMPORARY` · `TT_PATCH_PROMOTION_GATE: ENFORCED`  
**Registry：** [`registry/staging-patch-queue.v1.yaml`](../../registry/staging-patch-queue.v1.yaml)  
**晋升闸：** [TT-PSG-PATCH-PROMOTION-GATE-LATEST](./TT-PSG-PATCH-PROMOTION-GATE-LATEST.md)  
**双轨 SSOT：** [TT-PSG-DUAL-TRACK-RELEASE-STAGING-PATCH-LATEST](./TT-PSG-DUAL-TRACK-RELEASE-STAGING-PATCH-LATEST.md)  
**冻结 tip（Track A · Candidate v2 · 勿为下列补丁改 tip）：** `PSG-REL-20260720-WEB3-CAND-V2` · `97289a7185610ef0ad8822f0af04bfa533e42986`（supersedes historical tip `652bbab5`）  
**FG-15-A archive tip（只读）：** `09c72b934b62f848e60b38bcc7ff0e6cac44f923`

> 运营稳定性补丁台账。**不是** Financial Protocol Release。**不是**永久分叉。  
> FG-15-B 窗内：**仅登记与验证状态** · **禁止** Promotion execute · **禁止** 补丁绕过 PSG 进 Staging/Production。  
> 满窗后唯一路径：Promotion Gate → PSG 更新 → Release Identity 重建 → 下一 Certification。

---

## 字段（写死 · 含晋升）

| 字段 | 含义 |
|------|------|
| Patch ID | `PATCH-STG-NNN` |
| 影响范围 | Web / API / Data / Docs / Gate |
| 代码 SHA | 已提交 · 或 `WORKTREE` |
| 影响 PSG | Yes/No |
| 影响 FG/Web3 | Yes/No |
| 验证结果 | PASS / PENDING / … |
| 合并 Release | No / DEFERRED_TO_NEXT_RC / Yes |
| promotion_class | cms_display · bug_fix · api_behavior_change · financial_logic · contract_or_permissions · ops_gate_docs |
| promotion_status | OPEN · PLAN_RECORDED · PROMOTED · SUPERSEDED · **BLOCKED_FG15** |

**队列状态词：** `LIVING_ENFORCED` · `DATA_LOCKED_CODE_PENDING_DEPLOY` · `CODE_IN_WORKTREE_PENDING_STAGING_DEPLOY` · `LIVING_PARTIAL_IMAGE_STALE` · `CLOSED`

---

## Ledger

| Patch ID | 内容 | 范围 | SHA | PSG | FG/Web3 | 验证 | 合并 Release | class | promo |
|----------|------|------|-----|-----|---------|------|--------------|-------|-------|
| **001** | Public Display 10×4 | Data/API/脚本 | WORKTREE | Y | N | 10×4 PASS | DEFERRED | cms_display | BLOCKED_FG15 |
| **002** | Deploy Freshness Gate | Gate | WORKTREE | Y | N | ENFORCED | DEFERRED | ops_gate_docs | BLOCKED_FG15 |
| **003** | market `display_status` | API | WORKTREE | Y | N | PENDING | DEFERRED | api_behavior_change | BLOCKED_FG15 |
| **004** | CMS/COS + Catalog bake | Web | WORKTREE | Y | N | PARTIAL | DEFERRED | cms_display | BLOCKED_FG15 |
| **005** | 收购角标对比度（UI Presentation） | FE | WORKTREE | N | N | 本地 vitest PASS | DEFERRED | bug_fix | BLOCKED_FG15 |
| **006** | Dual-track + Identity | Gate/Docs | WORKTREE | Y | N | ENFORCED | DEFERRED | ops_gate_docs | BLOCKED_FG15 |
| **007** | Patch Promotion Gate | Gate/Docs | WORKTREE | Y | N | ENFORCED | DEFERRED | ops_gate_docs | BLOCKED_FG15 |

### 备注

- 全部 `BLOCKED_FG15`：窗内可 **本地修 + 测 + Ledger**；**不** merge 进冻结 tip；**不**部署进认证 Staging。  
- **两类勿混：** ① Docs/Evidence 对齐 ✅ · ② 非金融 UI Patch 准备 ✅ · 金融/API/数据/合约/Web3/Redeploy ❌ 等 ELAPSED。  
- `PATCH-STG-005`：代码可在本地；**Staging 故意未上**（保持 48H 观察对象固定）。  
- 合法出口：ELAPSED → Promotion → 新 PSG Version → STRICT → Canonical Deploy → 八轴 Evidence。

---

## 新增补丁模板

```text
PATCH-STG-00N
title: …
scope: …
code_sha_or_worktree: WORKTREE|sha
impacts_psg: true|false
impacts_fg_or_web3: false
verification_result: PENDING
merge_into_release: DEFERRED_TO_NEXT_RC
promotion_class: cms_display|bug_fix|api_behavior_change|…
promotion_status: BLOCKED_FG15   # during FG-15
```

同步：本表 · `registry/staging-patch-queue.v1.yaml` · 必要时 Cockpit 一行。
