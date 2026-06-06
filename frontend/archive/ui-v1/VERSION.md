# V1版本 · 营销与首屏 UI 快照

| 项 | 值 |
|----|-----|
| **标签** | `ui-v1` |
| **生成时间 (UTC)** | 2026-05-19T02:31:00Z |
| **Git commit (生成时)** | `dd52fe2` (`dd52fe246d237b4f203a178a3ea3d9be6e626ab8`) |
| **说明** | **只读历史对照**（V1 · 2026-05-19）。**现行 `/` SSOT** = `frontend/app/(home)/page.tsx` + `components/landing/LandingHeroForm.tsx`。**勿**从本目录还原覆盖主线。 |

## 覆盖范围

- 首页 `/`：`app/(home)`、`components/landing`、氛围图逻辑
- 网络页 `/traveltrust`：cinematic 组件与 hero 布局 token
- 共享：`Header`、`TrustBadgesRow`

## 还原单文件示例

```bash
cp frontend/archive/ui-v1/snapshot/components/landing/LandingHeroForm.tsx \
   frontend/components/landing/LandingHeroForm.tsx
```

## V2 升级入口

共享营销 token：`frontend/lib/marketingUi.ts`（主线）；本目录**不**自动更新。
