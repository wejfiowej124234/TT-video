# Admin 工作台 · ① 暖金 L5 视觉收口（2026-06-04）

**阶段口径：** **① 本地** → **② 测试网** → **③ 生产**

| 项 | 结论 |
|----|------|
| **有没有收口（① 产品+机读）** | **是（①）** |
| **有没有 UI 冻结** | **否**（Admin 非五主；仅维护型迭代） |

## 验收命令（①）

```bash
node scripts/dev/run-admin-l5-green.mjs
bash scripts/dev/run-admin-phase1-closure.sh   # 内层 Admin 绿集在 Windows 亦走 .mjs
```

**诚实边界：** ① 绿集 / Phase1 closure **≠** ② staging 全矩阵 GO **≠** ③ Production GO。

## 视觉分层（同源首页 `/` · 控制台浅壳）

| 层级 | 实现 |
|------|------|
| L0 页壳 | `TT_ADMIN_ZONE_ROOT` · `bg-bg-main` + vignette |
| 页头 / widget | `AdminWarmL5Surface` · `ADMIN_WARM_L5_*` |
| 详情/处置主块 | `AdminDetailContentPanel` |
| 枢纽 / KPI 链 | `ADMIN_HUB_KPI_LINK_FRAME_CLASS` + inner |
| 模态 | `AdminModalWarmL5Panel` |
| 筛选/toolbar | `ADMIN_FILTER_CARD_CLASS`（纯白 · 不铺金框） |
| 表格 | `ADMIN_TABLE_SECTION_CLASS` / `ADMIN_TABLE_SURFACE_CLASS` |
| Shell 预览 | `ADMIN_SHELL_PREVIEW_BANNER_CLASS` · `ADMIN_SHELL_PREVIEW_NOTICE_CLASS` |

## 机读

- `frontend/lib/admin/adminWarmL5CoverageL5.contract.test.ts`
- `frontend/lib/admin/adminStyleAlignmentL5.contract.test.ts`
- 绿集入口：`scripts/dev/run-admin-l5-green.mjs`

## 仍留 ② / ③（不在本收口宣称内）

- ADM-UX-IA-06：Staging 六角色矩阵 Playwright（① 已有 session 预览 + 顶栏快切 + `AdminAdmU01LocalPrepPanel`）
- ADM-UX-ONB-04：Stripe 真 webhook 回显
- ADM-UX-RBAC-05/06、ADM-UX-FIN-02、ADM-UX-CI-02

## 系统概况 · 数据诚实（2026-06-05 · ① 已闭）

真源：[`ADMIN-L5-HOME-SYSTEM-OVERVIEW-CODE-SSOT.md`](ADMIN-L5-HOME-SYSTEM-OVERVIEW-CODE-SSOT.md) · [`70 §3.0.2`](../../../docs/spec/70-管理员系统开发文档.md) · [`frontend/app/admin/README.md`](../../app/admin/README.md)

## 截图目视续扫（2026-06-04 · Vis-P0/P1/P2 已落地）

**真源：** [`ADMIN-L5-HOME-SCREENSHOT-AUDIT-20260604.md`](ADMIN-L5-HOME-SCREENSHOT-AUDIT-20260604.md) · **70 §3.0.1** 项 17–25 **均已 ✅**
