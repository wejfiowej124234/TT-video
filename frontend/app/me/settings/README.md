# `/me/settings` · ① 设置 Hub（L5 · 2026-06-02 收口冻结）

**阶段：① 本地** — 顶栏「设置」入口；个人资料编辑在 **`/me/settings/profile`**（顶栏 profile strip 同链）。

## 读序

| 顺序 | 文档 |
|------|------|
| ① | [`ME-SETTINGS-L5-FREEZE.md`](../../evidence/GO_local_auth_l5/ME-SETTINGS-L5-FREEZE.md)（**代码 SSOT 表 · 分组 IA**） |
| ② | [`ME-SETTINGS-PROFILE-L5-FREEZE.md`](../../evidence/GO_local_auth_l5/ME-SETTINGS-PROFILE-L5-FREEZE.md) |
| ③ | [`HEADER-UTILITY-MENU-L5-FREEZE.md`](../../evidence/GO_local_auth_l5/HEADER-UTILITY-MENU-L5-FREEZE.md) |
| ④ | [`/me/password` README](../password/README.md) · [`/me/security`](../security/) · [`/me/identities`](../identities/README.md) |

## 代码 SSOT（改 Hub 先改此处）

| 文件 | 职责 |
|------|------|
| `app/me/settings/MeSettingsPageInner.tsx` | Hub 页身组装 |
| `lib/me/meSettingsNavModel.ts` | 五分组 + 折叠 + href |
| `components/me/MeSettingsHubSection.tsx` | 分组 UI |
| `components/me/MeSettingsProfileCard.tsx` | 顶卡 → profile 子页 |
| `components/me/MeSettingsL5BackLink.tsx` | 顶返回（`?from=`） |
| `components/me/MeSettingsL5MinimalFooter.tsx` | 底栏 → 社区 Feed |
| `lib/me/meSettingsPageTracker.v1.ts` | 机读逐页闸 |

## 机读（改动 Hub / 顶栏菜单须 exit 0）

```bash
bash scripts/dev/smoke-me-settings-local.sh
bash scripts/dev/smoke-account-nav-full-local.sh
```

## 逐页追踪

| 路径 | `data-tt-me-settings-route` |
|------|-----------------------------|
| `/me/settings` | `hub` |
| `/me/settings/profile` | `settings-profile` |
| `/me/settings/privacy` | `privacy` |
| `/me/settings/language` | `language` |
| `/me/settings/data` | `data` |
| `/me/settings/notifications-prefs` | `notifications-prefs` |
| `/me/settings/trust` | `settings-trust` |
| `/me/password` | `password` |
| `/me/security` | `security` |

清单与断言：`lib/me/meSettingsPageTracker.v1.ts` · `meSettingsPageTracker.contract.test.ts`。
