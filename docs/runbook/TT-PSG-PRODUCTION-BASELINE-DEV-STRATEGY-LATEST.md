# TT · PSG Production Baseline · Development Strategy（FROZEN）

**Status:** `FROZEN`  
**Effective:** 2026-07-17  
**Baseline Tag:** `v1.1.0-psg-go.20260717`  
**SHA:** `0bbc7adbd3142b111463fc398288ab94be5c0b84`  
**Freeze:** `RC-FREEZE-20260717T094900Z`  
**TT_PRODUCTION_GO:** `GO`  

**机读：** [`registry/psg-production-baseline-dev-strategy.v1.yaml`](../../registry/psg-production-baseline-dev-strategy.v1.yaml)  
**Archive：** [`evidence/GO_psg_foundation/release_archive/v1.1.0-psg-go.20260717/`](../../evidence/GO_psg_foundation/release_archive/v1.1.0-psg-go.20260717/)  
**Baseline：** [`TT-PSG-PRODUCTION-RELEASE-BASELINE-LATEST.md`](./TT-PSG-PRODUCTION-RELEASE-BASELINE-LATEST.md)

---

## 正式切换（写死）

本版视为 **冻结的生产基线**。开发策略自即日起切换为：

| # | 规则 |
|---|------|
| 1 | **不再修改** 这一版的任何 Evidence、Registry 快照或 Release Archive 字节 |
| 2 | 所有 **Hotfix / Patch / 新功能** 必须从 Tag `v1.1.0-psg-go.20260717`（或对应 SHA）**新建开发分支** |
| 3 | 未来正式发布须开启 **新的 Release 周期**（新 Freeze / 新认证链），**禁止**继续扩展本次 PSG Step1–5 流程 |

## 分支习惯

```bash
git fetch --tags
git switch -c hotfix/<name> v1.1.0-psg-go.20260717
# 或
git switch -c feature/<name> v1.1.0-psg-go.20260717
```

## 禁止

- 改写 `release_archive/v1.1.0-psg-go.20260717/` 内文件  
- 就地改写 Archive `manifest.json` 已登记的 cite 路径内容以“刷新基线”  
- 移动或覆盖 Tag `v1.1.0-psg-go.20260717`  
- 为维持本基线而重跑已 PASS Gate  
- 仅用文档宣称新的 `TT_PRODUCTION_GO`

## 诚实边界

策略冻结 ≠ 禁止修生产缺陷。缺陷修复走 **Baseline Patch 分支**；下一正式发版走 **新 Release 周期**。
