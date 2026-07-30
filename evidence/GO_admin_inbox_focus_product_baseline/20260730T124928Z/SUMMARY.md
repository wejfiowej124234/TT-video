# Admin Inbox Focus · Product / Release Baseline

**Stamp:** `20260730T124928Z`  
**Verdict:** `PASS`（① Local · UX Policy Product Baseline）  
**Phase:** ① → ② → ③（本包仅①；禁止冒充 Staging/Production GO）

## Pins（写死 · 本包不变）

| Pin | Value | Status |
|-----|--------|--------|
| Runtime Data Closure | `GO_admin_dashboard_runtime_data_closure/20260730T122703Z` | PASS · CITED |
| FE tip | `6929606a2d66bc1e187c0e63373b35a03d10a286` | **UNCHANGED**（禁止本轨 bake） |
| CSS Baseline | `38ee6c50cc925a9a.css` | **UNCHANGED** |

## 做了什么

将 Staging 已验的 **Admin Inbox Focus Workbench** 提升为 **三环境 Admin 首页默认 Product Baseline**：

1. `adminHomeInboxFocusLayoutActive` → **恒 `true`**（不再按 pending 切 warm↔focus）
2. `adminHomeSecondaryWidgetsCollapsed` → **恒 `true`**
3. `adminHomeSystemOverviewDefaultOpen` → **恒 `false`**（概况辅助）
4. `adminHomeModulesFoldDefaultOpen` → **恒 `false`**
5. `ADMIN_WORKBENCH_LAYOUT_DRIVER` = `inbox_focus_product_baseline_default`

**信息架构（focus 路径 · `AdminHomeClient`）：**

1. **待办 / 收件箱 / 运营动作** — `AdminHomeInboxStrip`（`data-tt-admin-home-focus-inbox-first="1"`）
2. **系统概况** — `AdminHomeSystemOverviewSection`（后置 · 默认收起）
3. **域健康 / KPI / 最近访问** — `AdminHomeFocusCompanion` + folds（辅助）

## Forbidden（本轨遵守）

- × API / 权限 / 数据模型  
- × FE release tip 变更 / re-bake  
- × CSS Baseline 变更  
- × 覆写 `GO_production_admin_uiux_baseline_alignment/20260730T110918Z/`  
- × 覆写 Runtime Data Closure 冻结包  

## 机读回归

```text
4 files / 35 tests PASS · exit 0
adminDesignSystemBaseline · adminShellUxPolicy · adminHomeInboxPendingTotal · adminWorkbenchW02.batch12
```

见 `VITEST.txt`。

## 截图级回归

见 `HUMAN-UAT.md` / `SCREENSHOT-IA-REGRESSION.md`。  
合约锁定 DOM 顺序与 policy；Owner 在本树 Local（或含本 policy 的下一 tip）对照清单截图。

## 诚实边界

- 本包 = **① Product Baseline 源码/策略 PASS**  
- **≠** ② Staging 全矩阵 GO · **≠** ③ Production GO  
- tip `6929606a…` 冻结 ⇒ 已部署 Staging/Prod 在 **下一 tip 合入本 policy 前** 仍可能是旧 pending 驱动壳；提升对象是 **默认产品基线声明 + 源码路径**
