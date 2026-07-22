# TT · Engineering SSOT Anchor（工程实体绑定 · 在 PSG 之下）

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
| Tip SHA | `1ed03a9a959d2404fd561a72dc724b59ecf1635e` |
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

---

## 4 · 任务链（冻结后 · 非本文件执行）

```text
FG-15-B 48h ELAPSED（证据已 ELAPSED · Registry 须对齐）
  → Project A
  → PSG Recalculate / Feature Inventory / Delta
  → Reality Closure
  → Staging-grade GO 判定
  →（另闸）Production GO
```

**当前：** FINAL RELEASE `freeze_status=FROZEN` · RC tip `1ed03a9a959d`（含 ACL `6b85bde9`）· Staging Web tip **待烤** · 认证套件 **暂停** · P1-05/06/07 **暂缓**。

---

## 诚实边界

Engineering SSOT Anchor 建立 ≠ 已冻结 ≠ 已认证 ≠ Staging-grade GO ≠ Production GO。
