# `/me/settings` · ① 设置 Hub（L5 · 2026-06-02 收口冻结）

**阶段：① 本地** — 顶栏「设置」入口；个人资料编辑在 **`/me/settings/profile`**（顶栏 profile strip 同链）。

## 读序

| 顺序 | 文档 |
|------|------|
| ① | [`ME-SETTINGS-L5-FREEZE.md`](../../evidence/GO_local_auth_l5/ME-SETTINGS-L5-FREEZE.md)（**代码 SSOT 表 · 分组 IA**） |
| ② | [`ME-SETTINGS-PROFILE-L5-FREEZE.md`](../../evidence/GO_local_auth_l5/ME-SETTINGS-PROFILE-L5-FREEZE.md) |
| ③ | [`HEADER-UTILITY-MENU-L5-FREEZE.md`](../../evidence/GO_local_auth_l5/HEADER-UTILITY-MENU-L5-FREEZE.md) |
| ④ | [`/me/password` README](../password/README.md) · [`/me/security`](../security/) · [`/me/identities`](../identities/README.md) |
| ⑤ | [identity-multi-slot-naming-l5.v1.md](../../../../docs/spec/artifacts/identity-multi-slot-naming-l5.v1.md) — **分场景名称 · settings 子页 TARGET** |

## 职责边界（L5）

| 本 Hub / 子页 | 只管 |
|---------------|------|
| **`/me/settings/profile`** | Account：nickname · avatar · bio（社区）· 语言/隐私链 |
| **`/me/identities`** | 身份槽状态 · 申请 CTA · 链到各业务 settings（升级轨） |
| **向导/商家挂牌** | **不在** profile 改；见 [identities README 名称分层](../identities/README.md#名称与资料分层l5--2026-06-10) |

**TARGET 提示文案（P0 i18n）：**「这里修改的是账户资料…向导、商家等公开业务资料请到身份中心管理。」

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
