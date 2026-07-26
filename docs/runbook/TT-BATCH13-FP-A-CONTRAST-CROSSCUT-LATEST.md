# Batch-13 · FP-A · 全站对比度横切 · LATEST

**Machine:** `TT_ADMIN_BATCH13_FP_A_CONTRAST_CROSSCUT`  
**Stamp:** `20260726T073800Z`  
**Status:** **FP-A_CODE_LANDED · ① 机读绿 · ② Staging 复截待**  
**HUs closed (code):** **496 · 504 · 512 · 520 · 528 · 536 · 544 · 552 · 560**（对比度 P0 横切；叶页功能 HU **未**闭）  
**Patch:** `PATCH-STG-017`  
**≠ tip 移动 · ≠ Hard Gate unlock · ≠ Cutover · ≠ Production GO · ≠ FINANCE_WRITE**

---

## 1 · 改什么（一处）

| 面 | 动作 |
|----|------|
| `frontend/app/globals.css` | `[data-tt-admin-zone-content-stack]` / `[data-tt-admin-warm-l5-surface]` · `text-ink-600/500` + 深壳 `text-slate-400` → **slate-300** `rgb(203 213 225)` + `!important`；白卡 `bg-bg-console` 内恢复深色 |
| `frontend/lib/adminUi.ts` | `ADMIN_TEXT_SECONDARY_CLASS` · `ADMIN_TEXT_MUTED_CLASS=text-slate-300` · filter/chrome/detail muted 抬阶 |
| Hub 代表页 | config / onboarding / finance / growth / content / official / home cards / inbox → 副文用 `ADMIN_TEXT_SECONDARY_CLASS` |
| 机读 | `adminContrastL5.contract.test.ts` · FP-A assert |

---

## 2 · 验收

| 项 | 状态 |
|----|------|
| `npx vitest run lib/admin/adminContrastL5.contract.test.ts` | **11/11 PASS（①）** |
| 用户/订单/争议/入驻/内容/官方/增长/财务/平台设置副文一眼可读 | **① 代码闭环** · **② Staging 复截待 FP-E / 本波截图** |
| tip `ea71c577` | **未动** |
| Hard Gate / Cutover / Production GO | **LOCKED / NO_GO** |

---

## 3 · 下一波

**FP-B** · 已落码 — [`FP-B-CAPABILITY`](./TT-BATCH13-FP-B-CAPABILITY-BLOCKERS-LATEST.md) · 下一波 **FP-C**

```text
TT_ADMIN_BATCH13_FP_A: CODE_LANDED
TT_ADMIN_BATCH13_FP_A_STAGING_RESCREEN: PENDING
TT_ADMIN_BATCH13_FP_B: CODE_LANDED
TT_ADMIN_BATCH13_NEXT: FP_C
TT_ADMIN_BATCH13_TIP: ea71c577_IMMOBILE
TT_HARD_GATE_LOCKED: true
TT_CUTOVER_LOCKED: true
TT_PRODUCTION_GO: NO_GO
```
