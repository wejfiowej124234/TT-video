# TT · Engineering SSOT Anchor（工程实体绑定 · 在 PSG 之下）



> **ACTIVE tip (machine SSOT · Hygiene Final Hardening 2026-07-23):** `ea71c577` (`ea71c577ce6f99696df33f9394cf96746edc843b`) · Pin `PSG-REL-20260720-WEB3-CAND-V2` — ancestry SHAs in body = historical lineage only.

> **ACTIVE tip (machine SSOT · 2026-07-23 Hygiene Final):** `ea71c577` · Pin `PSG-REL-20260720-WEB3-CAND-V2` — older SHA lines below = ancestry / SUPERSEDED snapshot, not living tip.
**STATUS:** `ACTIVE_UNDER_PSG` · **≠** FREEZE · **≠** GO  
**Machine key:** `TT_ENGINEERING_SSOT_ANCHOR`  
**Machine:** [`registry/engineering-ssot-anchor.v1.yaml`](../../registry/engineering-ssot-anchor.v1.yaml)  
**Parent:** PSG Release SSOT · [`TT-PSG-RELEASE-SOURCE-OF-TRUTH-LATEST`](./TT-PSG-RELEASE-SOURCE-OF-TRUTH-LATEST.md)  
**Unique system:** [`TT-FINAL-RELEASE-BASELINE-LATEST`](./TT-FINAL-RELEASE-BASELINE-LATEST.md)  
**Gate:** `bash scripts/gates/check-engineering-ssot-anchor-gate.sh`

---

## 1 · 最高治理锚

```text
Architecture Constitution / L0 / PGC
        ↓
   PSG = unique Release SSOT + Version Gate
        ↓
   FINAL RELEASE BASELINE（唯一体系 · 认证前冻结）
        ↓
   Engineering SSOT Anchor（绑定全部工程实体）
```

**禁止**用 handbook / 窄切片 GO / Reality W0–W7 / FG-15-A 活文档冒充本锚。

---

## 2 · 唯一身份（写死）

| 键 | 值 |
|----|-----|
| Pin | `PSG-REL-20260720-WEB3-CAND-V2` |
| Tip SHA | `ea71c577ce6f99696df33f9394cf96746edc843b` · **living** |
| Tip (SUPERSEDED ancestry) | `3b310ca856ce…` · `1ed03a9a…` · `6b85bde9…` — cite only, not living tip |
| Contract profile | `v311_fund_safety_candidate_v2` |
| Economic | **V3.1.1 Final** |
| EGM | **PSG-EGM Final** · `CLOSED_AS_FRAMEWORK_DESIGN` |

---

## 3 · 工程实体绑定矩阵

| 实体 | 轴 | 必须同钉 | 默认污染禁止 |
|------|-----|----------|--------------|
| Git | local_git | tip SHA | 脏树冒充 tip |
| Web | web_image | tip + pin + profile | `STAGING-ALIGN-W0` Dockerfile/fallback |
| API | api_image | tip + pin + profile | `DEFAULT_PSG=STAGING-ALIGN` |
| Runtime | runtime_meta | attestation `ok` | unknown |
| Contract | bytecode pin | Candidate v2 | `gov_freeze_v2_clean_baseline` 当 ACTIVE |
| DB | database_baseline | Staging RC SSOT | 平行 ledger |
| Migration | checksum | LF · 与已应用一致 | CRLF drift |
| Registry | ACTIVE | Candidate pin | 平行 ACTIVE |
| Evidence | bundle | `GO_web3_candidate_v2` | 写 FG-15-A 根 |
| Docs | cites | FINAL + Cand + V3.1.1 + EGM | 活体称 FG15-A ACTIVE |
| Media | role_promo | Git LFS + registry checksum | ignored drop-zone bake |

---

## 4 · 任务链（Final Truth 下 · Pre-Mainnet 执行序 · 20260723T140924Z）

```text
Engineering SSOT Anchor
  → 代码质量与模块化优化（Code Quality Gate）
  → PSG Delta Recertify（dry-run）
  → Release Integrity
  → Error Experience / Boundary Validation（自动 + 半自动）
  → 人工全产品验收 L5（含 Error Experience）
  → PRR
  → Mainnet Hard Gate
  →（另闸）WEB3_FREEZE / Package / AXIS-11 …
```

**Cite:** [`TT-FINAL-TRUTH-PRE-MAINNET-EXECUTION-LADDER-LATEST.md`](./TT-FINAL-TRUTH-PRE-MAINNET-EXECUTION-LADDER-LATEST.md) · [`registry/final-truth-pre-mainnet-execution-ladder.v1.yaml`](../../registry/final-truth-pre-mainnet-execution-ladder.v1.yaml)

### Living · Batch-10 FINAL CLOSED FROZEN · Mainnet Deploy Prep Engineering cite（2026-07-25 · tip immobile）

| 键 | 值 |
|----|-----|
| Track | **B** Staging · `PATCH-STG-014` · Batch-10 **archive face FROZEN** |
| Status | `TT_ADMIN_BATCH10_STATUS: FINAL_CLOSED_FROZEN` · `TT_ADMIN_BATCH10_FREEZE_STATUS: FROZEN` · **W14 CLOSED ②** · bake `2026-07-25T06:16:38Z` · **FINAL CLOSED: YES** |
| Phase now | `TT_PHASE_NOW: MAINNET_DEPLOY_PREP_PLACEHOLDER` |
| Sync rule | 冻结基线不可改写冒充新 GO · 部署后一次性 Final Align |
| Mainnet | **PLACEHOLDER** · Post-mainnet Final Align **DEFERRED** · Hard Gate/Cutover **LOCKED** · GO **NO_GO** |
| Freeze | [`TT-BATCH10-FINAL-CLOSED-LATEST`](./TT-BATCH10-FINAL-CLOSED-LATEST.md) |
| Phase | [`TT-FINAL-TRUTH-PHASE-TRANSITION-BATCH10-MAINLINE-LATEST`](./TT-FINAL-TRUTH-PHASE-TRANSITION-BATCH10-MAINLINE-LATEST.md) |
| Cite | [`BATCH-10-FINAL-TRUTH-CITE`](./TT-PRE-MAINNET-HUMAN-UIUX-BATCH-10-FINAL-TRUTH-BASELINE-CITE-LATEST.md) · [`W14-VERIFY`](./TT-BATCH10-W14-STAGING-VERIFY-LATEST.md) · prior W13～W7 verify retained |
| Tip | **仍** `ea71c577` · **≠** GO |

### Living · Batch-10 W7 Engineering cite（2026-07-25 · tip immobile · **retained under FINAL CLOSED FROZEN**）

| 键 | 值 |
|----|-----|
| Patch | PATCH-STG-014 · Web bake `892c20c8` · `build_time=2026-07-25T03:19:32Z` |
| Product face | W7 CLOSED ② · HU-278/280/281/289/302 · four-greens PASS |
| Refresh | [`TT-FINAL-TRUTH-BASELINE-REFRESH-LATEST`](./TT-FINAL-TRUTH-BASELINE-REFRESH-LATEST.md) |
| Tip | **仍** `ea71c577` · **≠** GO |

**禁止**新平行体系 · **禁止**改 Candidate v2 / PSG-EGM / Product Release Baseline 字节（仅活面 cite）。

### 4.1 · Living ops cite（Batch-7 · 2026-07-24 · tip immobile · **R1 CLOSED**)

| 键 | 值 |
|----|-----|
| Track | **B** Staging Patch · `PATCH-STG-011` · Product/Release Baseline 活面 |
| Scope | Admin Shell IA + Inbox+guide + Home slim（HU-037～050）· Owner Freeze 窄豁免 |
| Tip / Pin | **cite-only** `ea71c577` · `PSG-REL-20260720-WEB3-CAND-V2` — **不**因本批移动 |
| Staging Web bake | `892c20c8`（≠ tip · CONFIRM_DESIGN） |
| R1 | `TT_ADMIN_BATCH7_PUBLISH_SCORE: 100` · Staging UAT PASS · Delta dry-run PASS_WITH_ED |
| Cite | [`TT-PRE-MAINNET-HUMAN-UIUX-BATCH-7-FINAL-TRUTH-BASELINE-CITE-LATEST`](./TT-PRE-MAINNET-HUMAN-UIUX-BATCH-7-FINAL-TRUTH-BASELINE-CITE-LATEST.md) · PCR-20260724-HUMAN-UIUX-BATCH-7-FINAL-TRUTH-CITE |
| Forbidden | Candidate v2 · V3.1.1 · EGM · Gov Anchor · Hard Gate · Cutover · Production GO |
| SSOT | [`TT-PRE-MAINNET-HUMAN-UIUX-DEFECT-REGISTER-LATEST`](./TT-PRE-MAINNET-HUMAN-UIUX-DEFECT-REGISTER-LATEST.md) · [`TT-STAGING-PATCH-LEDGER-LATEST`](./TT-STAGING-PATCH-LEDGER-LATEST.md) |

### 4.2 · Living ops cite（Batch-8 · 2026-07-24 · tip immobile · **ARCHIVED**)

| 键 | 值 |
|----|-----|
| Track | **B** Staging Patch · `PATCH-STG-012` · Product/Release Baseline 活面 |
| Scope | Batch-8 **ARCHIVED** · UI+HU-098 API frozen · Phase③ 剩余工作 = 新批次 · sole SSOT = Final Truth Baseline |
| Tip / Pin | **cite-only** `ea71c577` · `PSG-REL-20260720-WEB3-CAND-V2` — **不**因本批移动 |
| Staging Web/API bake | stamp `892c20c8` · Web `build_time=2026-07-24T10:08:13Z` · API `11:19:01Z`（HU-098 user-upsert rebake · WORKTREE code · ED） |
| Gates | ① vitest PASS · Delta dry-run PASS_WITH_ED（2026-07-24T11:34:16Z）· Staging bake WEB+API OK · **Owner UAT PASS** · **HU-098 business UAT PASS** · **HU-098 freeze recheck PASS** |
| Status | `TT_ADMIN_BATCH8_STATUS: ARCHIVED` · `TT_ADMIN_BATCH8_FINAL_CLOSURE: true` · `TT_ADMIN_BATCH8_HU098: CLOSED` · `TT_HU098_STATUS: CLOSED` · `TT_HU098_API_CODE_FROZEN: true` · `TT_HU098_ACCEPTANCE_BASELINE: second_reinforce_user_kind_upsert` · `TT_HU098_FREEZE_FINAL_RECHECK: PASS` · `TT_ADMIN_BATCH8_OWNER_UAT: PASS` |
| HU-098 evidence | business `HU098-STEWARD-APPROVE-RUNTIME.json` · freeze `HU098-FREEZE-FINAL-RECHECK.json` · baseline API `build_time=2026-07-24T11:19:01Z` · **不再调整 API** |
| Cite | [`BATCH-8-ARCHIVE`](../../evidence/GO_pre_mainnet_human_uiux/batch8_archive/BATCH-8-ARCHIVE-LATEST.md) · [`Phase③ remaining`](./TT-PHASE3-REMAINING-WORK-AFTER-BATCH8-ARCHIVE-LATEST.md) · PCR-20260724-HUMAN-UIUX-BATCH-8-ARCHIVE |
| Forbidden | Candidate v2 · V3.1.1 · EGM · Gov Anchor · Hard Gate · Cutover · Production GO · tip move |
| Residual | PAGE_SURFACE Unsplash DRIFT · WORKTREE SHA ED · origin unpushed · C2 Staging `users.role=region_steward` post-UAT（Owner 可恢复 tourist · ≠ GO） |
| SSOT | Register · Ledger PATCH-STG-012 |

### 4.3 · Living ops cite（Batch-9 · tip immobile · **FINAL CLOSED** · Residual Final **CLOSED**）

| 键 | 值 |
|----|-----|
| Track | **B** Staging Patch · `PATCH-STG-013` · Product/Release Baseline **archive face**（Admin Workbench L5） |
| Scope | U-pack FINAL CLOSED · B19 Residual A CLOSED · Residual Final disposition CLOSED · Batch-8 **不回流** |
| Tip / Pin | **cite-only** `ea71c577` · `PSG-REL-20260720-WEB3-CAND-V2` — **不**因本批移动 |
| Staging bake | Web `build_time=2026-07-25T01:00:44Z` · API `2026-07-24T15:51:36Z` · pin `892c20c8` ED |
| Status | `TT_ADMIN_BATCH9_STATUS: FINAL_CLOSED` · `TT_BATCH9_RESIDUAL_FINAL: CLOSED` · `TT_WEB3_MAINNET_BASELINE: PLACEHOLDER` |
| Cite | [`BATCH-9-FINAL-TRUTH-CITE`](./TT-PRE-MAINNET-HUMAN-UIUX-BATCH-9-FINAL-TRUTH-BASELINE-CITE-LATEST.md) · [`TT-BATCH9-RESIDUAL-FINAL-CLOSURE-LATEST`](./TT-BATCH9-RESIDUAL-FINAL-CLOSURE-LATEST.md) · [`TT-BATCH9-FINAL-CLOSED-LATEST`](./TT-BATCH9-FINAL-CLOSED-LATEST.md) · PCR-20260725-BATCH9-RESIDUAL-FINAL-MAINNET-PLACEHOLDER |
| Forbidden | Candidate v2 bytes mutate · Hard Gate unlock · Cutover · Production GO · tip move · Batch-9 WP reopen |
| SSOT | Register · Ledger PATCH-STG-013 |
| Mainnet | **PLACEHOLDER** in Final Truth · formal Recertify **DEFERRED_UNTIL_MAINNET_DEPLOY_COMPLETE** |

### Living · Batch-14 Collective Fix · Engineering cite（2026-07-26 · tip immobile）

| 键 | 值 |
|----|-----|
| Track | **B** Staging Patch · `PATCH-STG-019` · Admin Release Reality NEED_FIX → Collective Fix |
| Working bake | **Web+API `5d73c50d…` ALIGNED** · FP-E markers **8/8** · **≠ tip**（cite-only `ea71c577`） |
| Bake note | Web fresh bake + API align · post-deploy `PAGE_SURFACE_DRIFT` = **HU-576 ED** · deploy shipped |
| L1 / L2 | Admin users/orders/disputes **PG-first** · `meta.source=postgres` · L2 probe **PASS** |
| Disputes CAST | `list_disputes_admin` · `CAST(refund_ratio AS double precision)` + tourist_id 补查 · **SSOT 固化** |
| HU-491 | Staging probe **CLOSED** · guides list/detail + guide-application `postgres` |
| W3/W4 | 572 CLOSED · 573 CLOSED · **574 CLOSED**（ADM-U01 102/102） · 575 CLOSED · 576 ED · 577 pending |
| Score | **144/200 NEED_FIX**（auth 36 · loop 26 · ≠ 满分 · ≠ RELEASE_GRADE） |
| Tip / Pin | **cite-only** `ea71c577` · `PSG-REL-20260720-WEB3-CAND-V2` — **不**因本批移动 |
| Forbidden | Hard Gate unlock · Cutover · Production GO · tip move · FINANCE_WRITE |
| Cite | [`TT-BATCH14-COLLECTIVE-FIX-IN-PROGRESS-LATEST`](./TT-BATCH14-COLLECTIVE-FIX-IN-PROGRESS-LATEST.md) · [`ADMIN-RELEASE-REALITY-AUDIT`](./TT-BATCH14-ADMIN-RELEASE-REALITY-AUDIT-LATEST.md) · `evidence/GO_batch14_collective_fix/` |
| HU-495/487/490 | 本会话已授权验收 · **仍 OPEN**（能力/八维 **禁止 4.x 假满分** · 须 §5 勾满 + Owner 复截） |
| L5 Recertify | **DEFERRED** · prep note `L5-RECERTIFY-PREP-LATEST.json` · **≠** Production GO |

**禁止**用本批 Working bake SHA 冒充 tip · **禁止**宣称 Production GO。

---

## 诚实边界

Engineering SSOT Anchor 建立 ≠ 已冻结 ≠ 已认证 ≠ Staging-grade GO ≠ Production GO。

**Compatibility Revalidation（CQ 后 · 进 HA 前）**

**Stamp:** `20260723T140610Z` · **Verdict:** `ENGINEERING_SSOT_COMPATIBILITY_REVALIDATION_PASS_WITH_ED`  
**Cite:** [`TT-ENGINEERING-SSOT-COMPATIBILITY-REVALIDATION-LATEST.md`](./TT-ENGINEERING-SSOT-COMPATIBILITY-REVALIDATION-LATEST.md)

CQ-02 后须先过 Compatibility Revalidation，再进 Human Product Acceptance。  
禁止改 Candidate v2 / PSG-EGM / Product Release Baseline / tip。

---

## Track B · Batch-12 W08a（cite · tip 不变 · 2026-07-25）

**PCR / Patch:** `PATCH-STG-016` · [`W08A-FIX`](./TT-BATCH12-W08A-SHELL-PERMISSIONS-FIX-NOTE-LATEST.md) · [`W08A-STAGING 7/7`](./TT-BATCH12-W08A-STAGING-VERIFY-LATEST.md) · [`W08A-PROGRESS-CITE`](./TT-BATCH12-W08A-FINAL-TRUTH-PROGRESS-CITE-LATEST.md)

| 键 | 值 |
|----|-----|
| Living tip（仍唯一） | `ea71c577` · pin Candidate v2 |
| Product patch HEAD | WORKTREE · Admin Shell W08a（HU-465/466/467）**CLOSED ②** |
| Staging Web bake | `build_time=2026-07-25T14:44:24Z` · sync · PAGE_SURFACE_DRIFT=ED |
| Scope | 顶栏分叶资金闸 · caps 失败注入权限中心 · 加载骨架 · ≤5×12 保持 |
| Hard Gate / Cutover / GO | **LOCKED / LOCKED / NO_GO** |
| Finance write | **FORBIDDEN_BY_DESIGN** |
| Next | **W08b** |

**禁止**把 Track B bake SHA 写成 tip；**禁止**用本波冒充 Batch-12 CLOSED / Hard Gate PASS / Production GO。  
**全量 Final Truth 十四锚刷新：** 留到 **Batch-12 收口**（本波仅 progress cite）。

---

## Track B · Batch-11 FINAL CLOSED + PRR PREP（cite · tip 不变）

**PCR:** [`PCR-20260725-BATCH11-PRR-PREP`](../../registry/psg-change-records/PCR-20260725-BATCH11-PRR-PREP.json)  
**Runbook:** [`TT-BATCH11-PRR-PREP-LATEST.md`](./TT-BATCH11-PRR-PREP-LATEST.md) · [`TT-BATCH11-FINAL-CLOSED-LATEST.md`](./TT-BATCH11-FINAL-CLOSED-LATEST.md)

| 键 | 值 |
|----|-----|
| Living tip（仍唯一） | `ea71c577` · pin Candidate v2 |
| Product patch HEAD | WORKTREE on `892c20c8`（Track B ED） |
| Staging Web bake cite | `2026-07-25T12:41:19Z` · W14/W15 · `PATCH-STG-015` |
| PRR PREP | `PRR_PREP_PASS_WITH_ED` · Feature Inventory / Reality / Owner / Release Integrity **ALIGNED** |
| Hard Gate / Cutover / GO | **LOCKED / LOCKED / NO_GO** · **eval Hard Gate = false** |
| Finance write | **FORBIDDEN_BY_DESIGN** |

**禁止**把 Track B bake SHA 写成 tip；**禁止**用本批冒充正式 Hard Gate PASS / Production GO。

---

## Track B · Pre-Mainnet Human UI/UX Batches 1–6（cite · tip 不变）

**PCR:** [`PCR-20260724-HUMAN-UIUX-BATCHES-1-6-FINAL-TRUTH-CITE`](../../registry/psg-change-records/PCR-20260724-HUMAN-UIUX-BATCHES-1-6-FINAL-TRUTH-CITE.json)  
**Runbook:** [`TT-PRE-MAINNET-HUMAN-UIUX-BATCHES-1-6-FINAL-TRUTH-BASELINE-CITE-LATEST.md`](./TT-PRE-MAINNET-HUMAN-UIUX-BATCHES-1-6-FINAL-TRUTH-BASELINE-CITE-LATEST.md)

| 键 | 值 |
|----|-----|
| Living tip（仍唯一） | `ea71c577` · pin Candidate v2 |
| Product patch HEAD | WORKTREE on `892c20c8`（Batch-8 bake cite · Batch-7 stamp） |
| Staging Web bake | stamp `892c20c8` · Batch-8 `build_time=2026-07-24T10:08:13Z`（PATCH-STG-012）· 祖先 Batch-7/6 |
| Staging API | stamp `892c20c8` · Batch-8 `build_time=2026-07-24T11:19:01Z`（HU-098 business UAT rebake） |
| Patch IDs | PATCH-STG-008 · 009 · 010 · 011 · **012** |
| Hard Gate / Cutover / GO | **未因本批关闭或 PASS** |

**禁止**把 Track B bake SHA 写成 tip；**禁止**用本批冒充正式 Delta Recertify / Production GO。
