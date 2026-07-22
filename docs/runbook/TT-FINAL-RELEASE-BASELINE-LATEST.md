# TT · FINAL RELEASE BASELINE（唯一体系 · UI Delta 后重新冻结）

**Machine key:** `TT_FINAL_RELEASE_BASELINE`  
**Status:** `BASELINE_FROZEN` · **Freeze:** `FROZEN`  
**Cert suite:** `DELTA_RECERTIFY_FORMAL_COMPLETE_NO_GO`  
**UI Delta:** `PENDING_STAGING_REDEPLOY`  
**Registry:** [`registry/final-release-baseline.v1.yaml`](../../registry/final-release-baseline.v1.yaml)  
**PCR：** `PCR-20260722-UI-DELTA-HOME-SOCIAL-FREEZE`（前次：`PCR-20260722-POLLUTION-CLEANUP-FREEZE`）  
**Gate:** `bash scripts/gates/check-final-release-baseline-freeze-gate.sh --require-frozen`

**唯一体系：** Candidate v2 + V3.1.1 Final + PSG-EGM Final  
**Pin：** `PSG-REL-20260720-WEB3-CAND-V2`（**未**新铸）  
**Freeze tip（Git / Registry）：** `4050f50a7d0c…`（UI Delta）  
**Staging bake tip（仍）：** `97289a718561…` → **Expected Difference** 直至 Web redeploy

---

## 0 · 冻结后仍禁止自动开跑

```text
FROZEN ≠ 已认证 ≠ Staging-grade GO ≠ Production GO
× Hard Gate · × 新 pin · × Reality W0–W7 当发版主线
下一枪：Staging Web redeploy @ UI tip → Inventory → Reality Closure
```

---

## 1 · 本轮 UI Delta（已合入 tip）

| 项 | 处置 |
|----|------|
| 进入定制旅行滚到中部 | 首屏 `scrollTo(0)`；仅用户生成后才滚结果区 |
| AI 行程未设国家 | 磨砂占位 `pointer-events-none`；选国家/城市后可解锁 |
| 关注我们 | 仅 Ins / TikTok / Threads / Medium / Discord / X（Owner URL） |
| 收购角标色 | `trustEscrowBadge` `[color:var(--ref-sun)]` |

---

## 2 · 八轴（诚实）

| 轴 | 状态 |
|----|------|
| local_git / registry_active / psg_pin | PASS @ `4050f50a` |
| web / api / runtime / evidence / release_identity | **EXPECTED_DIFFERENCE**（Staging 仍 `97289a71`） |

---

## 3 · 诚实边界

ALIGNED Freeze ≠ Staging 已烤入 UI ≠ Inventory READY ≠ Reality PASS ≠ Staging-grade GO ≠ Production GO。
