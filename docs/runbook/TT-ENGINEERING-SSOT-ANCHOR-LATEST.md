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

**禁止**新平行体系 · **禁止**改 Candidate v2 / PSG-EGM / Product Release Baseline。  
L5 达标前 **禁止** Web3 主网部署。

## 诚实边界

Engineering SSOT Anchor 建立 ≠ 已冻结 ≠ 已认证 ≠ Staging-grade GO ≠ Production GO。

**Compatibility Revalidation（CQ 后 · 进 HA 前）**

**Stamp:** `20260723T140610Z` · **Verdict:** `ENGINEERING_SSOT_COMPATIBILITY_REVALIDATION_PASS_WITH_ED`  
**Cite:** [`TT-ENGINEERING-SSOT-COMPATIBILITY-REVALIDATION-LATEST.md`](./TT-ENGINEERING-SSOT-COMPATIBILITY-REVALIDATION-LATEST.md)

CQ-02 后须先过 Compatibility Revalidation，再进 Human Product Acceptance。  
禁止改 Candidate v2 / PSG-EGM / Product Release Baseline / tip。

---

## Track B · Pre-Mainnet Human UI/UX Batches 1–6（cite · tip 不变）

**PCR:** [`PCR-20260724-HUMAN-UIUX-BATCHES-1-6-FINAL-TRUTH-CITE`](../../registry/psg-change-records/PCR-20260724-HUMAN-UIUX-BATCHES-1-6-FINAL-TRUTH-CITE.json)  
**Runbook:** [`TT-PRE-MAINNET-HUMAN-UIUX-BATCHES-1-6-FINAL-TRUTH-BASELINE-CITE-LATEST.md`](./TT-PRE-MAINNET-HUMAN-UIUX-BATCHES-1-6-FINAL-TRUTH-BASELINE-CITE-LATEST.md)

| 键 | 值 |
|----|-----|
| Living tip（仍唯一） | `ea71c577` · pin Candidate v2 |
| Product patch HEAD | `359273e5`（含 Batch-6） |
| Staging Web bake | `1e1908a1` |
| Staging API | `12b41d56`（邮件 Round · ED） |
| Patch IDs | PATCH-STG-008 · 009 · 010 |
| Hard Gate / Cutover / GO | **未因本批关闭或 PASS** |

**禁止**把 Track B bake SHA 写成 tip；**禁止**用本批冒充正式 Delta Recertify / Production GO。
