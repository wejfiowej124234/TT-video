# Screenshot-level IA Regression · Machine-locked order

**Stamp:** `20260730T124928Z`  
**Source:** `frontend/components/admin/AdminHomeClient.tsx` focus branch  
**Policy:** `adminHomeInboxFocusLayoutActive() === true`（Product Baseline）

## Expected DOM / visual order（focus = always）

```
[widget grid · data-tt-admin-home-inbox-focus="1"]
  └─ [inbox column · data-tt-admin-home-focus-inbox-first="1"]
       1. AdminHomeInboxStrip     ← 待办 / 收件箱 / 运营动作优先
       2. AdminHomeSystemOverviewSection  ← 概况辅助（defaultOpen=false）
  └─ AdminHomeFocusCompanion      ← 域健康等辅助
  └─ KPI / modules folds          ← 辅助 · modulesFoldDefaultOpen=false
```

## Non-focus branch

Still present in source for legacy/tests, but **unreachable** under Product Baseline (`focusInbox` always true). Warm「概况优先」不再为默认产品体验。

## Contract anchors

| Check | File |
|-------|------|
| Driver string | `adminDesignSystemBaseline.test.ts` |
| Focus always-on | `adminShellUxPolicy.test.ts` |
| Overview auxiliary | `adminWorkbenchW02.batch12.contract.test.ts` (HU-455) |
| Modules fold closed | `adminHomeInboxPendingTotal.test.ts` |

## Vitest

`VITEST.txt` · **35/35 PASS · exit 0**
