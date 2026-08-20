# TT · Staging Patch Ledger（LATEST）

> **Official living contrast (Wave-D1 · 2026-08-20):** Track A Official www = **OPS-2026.08.20-v9**  
> (`3e356617…` / `hybrid-live-auth-pin-nontarget-v9-20260820` / bootstrap v8) —  
> SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md).  
> **This Ledger = Track B only.** Staging ≠ Official.  
> **Staging www product identity (2026-08-20):** `git_sha=3e356617…` · `build_time=2026-08-20T10:50:46Z` (cite rebuild · staging env · Expected Difference vs Official wall-clock) — SSOT [`OFFICIAL-V9-LOCAL-STAGING-REPO-1TO1-MAP-20260820`](../../evidence/GO_official_www_product_surface/OFFICIAL-V9-LOCAL-STAGING-REPO-1TO1-MAP-20260820.md).  
> Historical Wave-D2 probe `2ba08bd4…` / `2026-08-15T12:30:19Z` = **SUPERSEDED as living Staging www**.  
> Candidate Web3 pin `PSG-REL-20260720-WEB3-CAND-V2` / Staging API = **separate plane · not this identity knife**.

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
| **008** | Auth L5 出站邮件 + brand/BIMI（HU-014） | Web/API/Docs | Round-8 bake | N | N | **FIXED ②** Auth+DNS；Round-8 L5 折行抛光；Postmaster/Inbox Owner；BIMI 不挡 HG | DEFERRED | bug_fix | OPEN（Staging ops · 待 Promotion） |
| **009** | Batch-5 UI：登录去工程板 · favicon/钱包 TT 标（HU-026/029/030）· 向导 10 验真（HU-031） | Web/Docs | bake `817b0d07` | N | N | **FIXED ②** Web live favicon TT；vitest PASS；页面表面 Unsplash DRIFT = 既有旁证（非本批引入） | DEFERRED | bug_fix | OPEN（Staging ops） |
| **010** | Batch-6 UI：钱包当前/目标链文案（HU-032/033）· 社区地理单入口（HU-035）· identities 三卡常显（HU-036）· C3 UAT Path B（HU-034 PARTIAL） | Web/Docs | Git `1e1908a1` | N | N | **FIXED ②** vitest PASS；HU-034 Path B；Unsplash DRIFT = 既有旁证 | DEFERRED | bug_fix | OPEN（Staging ops） |
| **011** | Batch-7 Admin：Freeze 窄豁免 · Shell IA hub-first（≤5/≤12）· Inbox+guide · Home≤8 · 双控正名 · 预览维护者-only（HU-037～050） | Web/Docs | Git `892c20c8` | N | N | **FIXED ② R1=100** Staging UAT PASS · Delta dry-run PASS_WITH_ED · Batch-7 Final Truth cite · Unsplash DRIFT=既有旁证 | DEFERRED | bug_fix | OPEN（Staging ops · 待 Promotion） |
| **012** | Batch-8 Admin：**ARCHIVED** · UI+HU-098 API FROZEN · WP-01～10 | Web/API/Docs | WORKTREE on `892c20c8` · Web `10:08:13Z` / API `11:19:01Z` | N | N | **FIXED ② ARCHIVED** freeze recheck PASS · archive pack · Phase③ = 新批次 Promotion | DEFERRED | bug_fix | OPEN（Staging ops · 待 Promotion · 新批次执行） |
| **013** | Batch-9 Admin Workbench L5 + 企业审计：概况置顶 · 池图 · 去噪 · HU-109～164 · HU-144 API · **B19 Residual A** · **Residual Final** | Web/API/Docs | WORKTREE | N | N | **FINAL CLOSED ②** + **`TT_BATCH9_RESIDUAL_FINAL: CLOSED`** · DEFER/Owner sealed · mainnet **PLACEHOLDER** · tip cite-only · pin `892c20c8` | DEFERRED | bug_fix | CLOSED（Batch-9 WP + Residual A + Residual Final · viz/Owner ledgers sealed） |
| **014** | Batch-10 Admin L5：…+**W14 CLOSED ②** + **FINAL CLOSED FROZEN** | Web/Docs | bake `2026-07-25T06:16:38Z` · `892c20c8…` | N | N | **FINAL CLOSED · FROZEN** · P0/P1=0 · P2 DEFER · PAGE_SURFACE_DRIFT=ED · Mainnet Prep PLACEHOLDER · **≠** GO | DEFERRED | bug_fix | CLOSED（Batch-10 FINAL · Promotion only for future RC） |
| **015** | Batch-11 Admin：W01～W15 CLOSED ② · **FINAL CLOSED FROZEN** · PRR PREP · Gap Class · HG Eval APPLIED | Web/Docs | WORKTREE | N | N | **FINAL CLOSED · FROZEN** · PRR PREP PASS · Gap Class PASS · HG Eval **APPLIED observe** · W15 10/10 · P0=0 · HU-397 DEFER · Hard Gate LOCKED unlock=false · **≠** GO | DEFERRED | bug_fix | CLOSED（Batch-11 FINAL · Promotion only for future RC） |
| **016** | Batch-12 Admin：工作台+目录满分 · **FINAL CLOSED FROZEN** · 走廊 Release Gate CERT | Web/Docs | bake `2026-07-26T05:32:42Z` | N | N | **FINAL CLOSED · FROZEN** · 40/40 · OPEN=0 · CERT_PASS · **≠ Owner 发布级** · **≠** GO | DEFERRED | bug_fix | CLOSED（Batch-12 FINAL · Owner 开 Batch-13） |
| **017** | Batch-13 Admin：**CONTENT_PREP** · HU-478～567 · 叶页13～21（财务13最低 · 平台设置20） · FIX_NOT_STARTED | Docs | WORKTREE | N | N | Owner：**未达发布级** · OPEN=90 · CF1～CF12 · FN1～FN12 · 订单满分在册 · `FINANCE_WRITE` FORBIDDEN · 禁 HG 解锁 · 只记不改 · Hard Gate LOCKED · **≠** GO | DEFERRED | bug_fix | OPEN（Content-prep · 待「开始第 13 批集体改」） |
| **018** | Track B six-fix Studio FE + platform cover Local SSOT（HU-007-B · z-410 · assertive publish · media limits · `cover_media_asset_id`） | Web/API/Docs | WORKTREE · cite tip `ea71c577` | N | N | **① Local PASS** vitest 12 · cargo media_service 2 · Staging Deploy **not** this session · B-MEDIA still WAITING_OWNER_CF · **≠** GO | DEFERRED | bug_fix | OPEN（class 2 Local · 待 Owner Staging Deploy） |
| **019** | V65 Batch3 Cut B Remaining · R022/R030/R032 FE honesty | Web | tip `5e9927be…` | N | N | Content Hub queue CTA de-dupe + Ops empty-tile honesty · publish-queue action honesty · Finance Suite TARGET matrix · Staging Web only · API tip Expected Difference · **≠** GO | DEFERRED | bug_fix | SMOKE_PASS（20260806T003800Z · tip 5e9927be · R022/R030/R032 CLOSED · ≠ Cut C · ≠ GO） |

### 备注

- **019** = V65 Batch3 Cut B Remaining FE tip `5e9927bef60d7dc44e6a9f14426bcab0cb075561` · R022/R030/R032 · Staging Web only · API tip Expected Difference · Evidence `evidence/GO_v65_prod_003_batch3_cut_b_remaining/` · **≠** Cut C · **≠** Production GO · `TT_PRODUCTION_GO=NO_GO`。
- **018** = Track B Staging Reality six-fix · PCR `PCR-20260727-TRACK-B-STAGING-REALITY-SIX-FIX` · Evidence `20260727T081945Z-staging-reality-six-fix-local/` · **≠** B-MEDIA CLOSED · **≠** Blocking−1 · **禁止** Batch-9 `ADMIN_HOME_CARDS` refill · Living score **no uplift**。  
- **014 / 013 / 012 / 011 / 010 / 009 / 008** 真源落点：**Product / Release Baseline**（活面）+ **Engineering SSOT**（Track B runtime cite）· Final Truth / Candidate / V3.1.1 / EGM / Governance / Hard Gate / Cutover = **cite-only** · **≠** Production GO。  
- **017** = Batch-13 **CONTENT_PREP**（[`BATCH13-OPEN`](./TT-BATCH13-OPEN-RECORDING-LATEST.md) · [`FAST-PATH`](./TT-BATCH13-FAST-PATH-REMEDIATION-PLAN-LATEST.md) **FP-A→E** · [`FINAL-TRUTH-CITE`](./TT-BATCH13-FINAL-TRUTH-BASELINE-CITE-LATEST.md) tip immobile · OPEN=90 · **② 可满分** · **禁资金写 / 禁 HG 解锁** · FIX_NOT_STARTED · 发布级=**NO** · Hard Gate **LOCKED** · **≠** GO）。

- **016** = Batch-12 **FINAL CLOSED · FROZEN**（[`FINAL-CLOSED`](./TT-BATCH12-FINAL-CLOSED-LATEST.md) · 走廊 [`RELEASE-GATE-CERT`](./TT-BATCH12-RELEASE-GATE-CERT-LATEST.md) · **≠** Owner 发布级签收 · Hard Gate unlock **NOT_MET** · **≠** GO）。
- **015** = Batch-11 **FINAL CLOSED · FROZEN** + PRR PREP + Gap Class + HG Eval APPLIED observe（[`FINAL-CLOSED`](./TT-BATCH11-FINAL-CLOSED-LATEST.md) · [`PRR-PREP`](./TT-BATCH11-PRR-PREP-LATEST.md) · W01～W15 **CLOSED ②** · **Hard Gate unlock=false** · tip cite-only · Mainnet **PLACEHOLDER** · **≠** GO）。
- **014** = Batch-10 **FINAL CLOSED · FROZEN**（[`FINAL-CLOSED`](./TT-BATCH10-FINAL-CLOSED-LATEST.md) · [`W14-VERIFY`](./TT-BATCH10-W14-STAGING-VERIFY-LATEST.md) PASS · bake `2026-07-25T06:16:38Z` · stamp `20260725T064200Z`）· Phase now = **MAINNET_DEPLOY_PREP_PLACEHOLDER** · tip cite-only · Mainnet **PLACEHOLDER** · Hard Gate **LOCKED** · **≠** GO · P2 DEFER_NON_BLOCKING sealed。
- **013** = Batch-9 **FINAL CLOSED** + **B19 Residual A CLOSED** + **Residual Final CLOSED**（Web bake `2026-07-25T01:00:44Z` · DEFER/Owner ledgers sealed · mainnet Final Truth **PLACEHOLDER** · formal Recertify **DEFERRED_UNTIL_MAINNET_DEPLOY_COMPLETE**）· tip `ea71c577` **不动** · pin `892c20c8` · **≠** GO · cite [`TT-BATCH9-RESIDUAL-FINAL-CLOSURE-LATEST`](./TT-BATCH9-RESIDUAL-FINAL-CLOSURE-LATEST.md) · [`TT-B19-RESIDUAL-A-CLOSURE-LATEST`](./TT-B19-RESIDUAL-A-CLOSURE-LATEST.md) · [`TT-BATCH9-FINAL-CLOSED-LATEST`](./TT-BATCH9-FINAL-CLOSED-LATEST.md)。
  Cite: [`TT-PRE-MAINNET-HUMAN-UIUX-BATCH-9-FINAL-TRUTH-BASELINE-CITE-LATEST`](./TT-PRE-MAINNET-HUMAN-UIUX-BATCH-9-FINAL-TRUTH-BASELINE-CITE-LATEST.md)  
- **012** = Batch-8 Admin **ARCHIVED**（`TT_ADMIN_BATCH8_ARCHIVED` · UI+HU-098 API FROZEN · 禁止再改本批）· tip `ea71c577` **不动** · Phase③ Promotion/Hard Gate/Cutover = **新批次** · **≠** GO · **ED：** C2 Staging `users.role=region_steward` post-UAT。
- **011** = Batch-7 Admin R1（Owner Freeze 窄豁免 · `TT_ADMIN_BATCH7_FREEZE_UNLOCK`）· **禁止**改 tip / Hard Gate / Cutover。  
- **010** 落点：Product/Release Baseline + Engineering SSOT · Final Truth cite-only · **≠** Hard Gate / Production GO。  
- **009** 落点：Product/Release Baseline + Engineering SSOT · Final Truth cite-only · **≠** Hard Gate / Production GO。  
- **008** 落点：**Product / Release Baseline** + **Engineering SSOT** · Final Truth / Candidate v2 / V3.1.1 / PSG-EGM / Governance Anchor / Hard Gate / Cutover = **cite-only** · **≠** Production GO。  
- Round-8：`alt=TT` 修复屏蔽图折行；DNS 仍冻；信誉闸见 [`TT-EMAIL-DELIVERABILITY-CLOSURE-LATEST.md`](./TT-EMAIL-DELIVERABILITY-CLOSURE-LATEST.md)。  
- 历史 `001～007` 窗内 `BLOCKED_FG15` 行保留为台账；FG-15-B **ELAPSED**。  
- **两类勿混：** ① Docs/Evidence 对齐 ✅ · ② 非金融 UI/出站体验 Patch ✅ · 金融/合约/Hard Gate ❌。  
- 合法出口：Promotion → 新 PSG Version → STRICT → Canonical Deploy（本补丁 **不**改 Candidate tip）。

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
