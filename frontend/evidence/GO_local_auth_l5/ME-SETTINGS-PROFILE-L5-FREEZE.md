# `/me/settings/profile` · ① 本地 L5 个人资料子页（2026-06-02）

**阶段：① 本地** — 设置族暖金壳；**非**五主路由 / **非**社区 cyan 资料卡。

**互指：** [ME-SETTINGS-L5-FREEZE](./ME-SETTINGS-L5-FREEZE.md) · [HEADER-UTILITY-MENU-L5-FREEZE](./HEADER-UTILITY-MENU-L5-FREEZE.md) · `lib/me/meSettingsPageTracker.v1.ts`

## 路由

| 路径 | 说明 |
|------|------|
| `/me/settings/profile` | 个人资料（头像/昵称/简介/钱包 · 社区统计 · 账户标识） |

顶栏 **profile strip**（`data-tt-header-user-menu-profile-strip`）· Hub 顶卡 · `/community/me` 裸路径 redirect 均指向 **`/me/settings/profile`**。

## 版式（L5 · 已锁）

1. **身份卡** — 暖金 `profileIdentityCard` · 单一主 CTA「编辑资料」· 头像「+」上传
2. **内联编辑** — 同卡内展开 `MeSettingsProfileEditForm`（昵称/简介/钱包）· **禁止**详情区重复编辑钮
3. **资料完整度** — 100% 时隐藏 progress
4. **社区互动** — 暖金统计格（非 cyan）
5. **账户详情** — 邮箱验证态 · ID/钱包复制 · 连接钱包未写入提示
6. **隐私与可见性** — 链 `/me/settings/privacy`

**发布 / 收藏 / 赞过：** 顶栏头像菜单「我的」SSOT（`header_userMenu_my_*`）；**禁止**在本页重复链 `/community/me/posts|collects|likes`。

**禁止：** `CommunityMeAccountPanel` · `TT_COMMUNITY_ME_PANEL_L5` · `TT_COMMUNITY_PAGE_L5.pill` 门闸 · 页级「加载中…」与 Panel 骨架双显 · 详情区重复「编辑资料」。

**头像：** `GET /uploads/profile-avatars/:name` 匿名可读（API 鉴权白名单）；加载失败须 `data-tt-me-settings-profile-avatar-load-failed` + 重试。

**① 本地：** `TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR=1` 开启上传落盘；dev 默认 bio + 头像上传 frontend 开关开启。

## 机读绿集

```bash
bash scripts/dev/smoke-me-settings-local.sh
# 含 meSettingsProfileL5.contract.test.ts
```

**data 属性：** `data-tt-me-settings-profile` · `data-tt-me-settings-profile-panel` · `data-tt-me-settings-profile-edit-form`

## 后续变更边界

- **仅允许：** 数据链路 · i18n · a11y · 门闸 · bugfix
- **禁止：** 退回社区 cyan 单卡壳 · 恢复 `/community/me` 为编辑 Hub · 详情区第二套「编辑资料」主钮 · 重复顶栏「我的发布/收藏/赞过」入口
