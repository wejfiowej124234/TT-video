# TT · FINAL RELEASE BASELINE（唯一体系 · UI Delta Cinema/Promo 后重新冻结）

**Machine key:** `TT_FINAL_RELEASE_BASELINE`  
**Status:** `BASELINE_FROZEN` · **Freeze:** `FROZEN`  
**Cert suite:** `DELTA_RECERTIFY_FORMAL_COMPLETE_NO_GO`  
**UI Delta:** `PENDING_STAGING_REDEPLOY`  
**Registry:** [`registry/final-release-baseline.v1.yaml`](../../registry/final-release-baseline.v1.yaml)  
**PCR：** `PCR-20260722-UI-DELTA-CINEMA-PROMO-FREEZE`（前次：`PCR-20260722-UI-DELTA-HOME-SOCIAL-FREEZE`）  
**Gate:** `bash scripts/gates/check-final-release-baseline-freeze-gate.sh --require-frozen`

**唯一体系：** Candidate v2 + V3.1.1 Final + PSG-EGM Final  
**Pin：** `PSG-REL-20260720-WEB3-CAND-V2`（**未**新铸）  
**Freeze tip（Git / Registry）：** `f9c227de14ab…`（L5 Cinema + 角色宣传片同步）  
**Staging Web tip：** 仍 `4050f50a7d0c…` · API tip 仍 `97289a718561…`（Expected Difference · 待 redeploy）

---

## 0 · 冻结后仍禁止自动开跑

```text
FROZEN ≠ 已认证 ≠ Staging-grade GO ≠ Production GO
× Hard Gate · × 新 pin · × Reality W0–W7 当发版主线
下一枪：Staging Web redeploy @ f9c227de（先 sync 宣传片）→ Inventory → Reality Closure
```

---

## 1 · 本轮 UI Delta（已合入 tip）

| 项 | 处置 |
|----|------|
| L5 Cinema 剧场 | 点 ▶ 站内展开动画；Esc/遮罩/播完关闭 |
| 角色宣传片 ×4 | `首页角色宣传片/` → `sync-traveltrust-role-promo-videos.cjs` → `public/media/traveltrust/roles/` |
| merchant/acquisition 默认路径 | 各自独立 MP4（不再共用 provider） |
| 前次 tip 4050f50a | 首页滚动 / AI 磨砂 / 社媒六链 · 血统保留 |

---

## 2 · 八轴（诚实）

| 轴 | 状态 |
|----|------|
| local_git / registry_active / psg_pin | PASS @ `f9c227de` |
| web / release_identity | **EXPECTED_DIFFERENCE**（Staging 仍 `4050f50a`） |
| api / evidence | **EXPECTED_DIFFERENCE**（API 仍 `97289a71`） |

---

## 3 · Delta dry-run

**Verdict:** `DRY_RUN_PASS_WITH_EXPECTED_DIFFERENCE` · P0=0 · Expected=WEB+API tip lag  
**报告：** [`TT-PSG-DELTA-RECERTIFY-THREE-BASELINE-DRY-RUN-LATEST.md`](./TT-PSG-DELTA-RECERTIFY-THREE-BASELINE-DRY-RUN-LATEST.md)

---

## 4 · 诚实边界

ALIGNED Freeze ≠ Staging 已烤入 Cinema/宣传片 ≠ Inventory READY ≠ Reality PASS ≠ Staging-grade GO ≠ Production GO。
