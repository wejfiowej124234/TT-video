# `/community/me` · P2 发布闭环检查表（合并 / 发版门禁）

> 用途：合并 PR 与发版前逐项确认；**不替代** CI，但 CI 绿仍应与本表关键项一致。  
> **企业审计 / 双源模型 / 生产 UAT 真实数据清单**：[COMMUNITY-ME-ENTERPRISE-AUDIT.md](./COMMUNITY-ME-ENTERPRISE-AUDIT.md)。  
> 特性开关：**构建时** `NEXT_PUBLIC_*`（见 `frontend/lib/communityMeFeatureFlags.ts`、`frontend/.env.example`）。

## 1. 契约（API / 数据）

| 项 | 验证 |
| --- | --- |
| 赞过列表 | 开关 **`NEXT_PUBLIC_COMMUNITY_ME_LIKES_LIST=1`** 时：`GET /api/v1/community/me/likes` 与 04 §3.4 表一致；占位/未鉴权仍返回 `status: ok` + 空数组（与 `me/collects` 同口径）。 |
| 头像 | 开关 **`NEXT_PUBLIC_COMMUNITY_ME_AVATAR_UPLOAD=1`** 时：`PUT /api/v1/me` 仍只接受 `avatar_url` 字符串（含 data URL 长度需在前后端容忍范围内）；**无**独立 multipart 头像接口。 |
| Bio | **非 production**：`NEXT_PUBLIC_COMMUNITY_ME_BIO=1` 时仅前端占位。**production**：还须 **`NEXT_PUBLIC_COMMUNITY_ME_BIO_ALLOW_PRODUCTION=1`** 才露出（防单开关误开）。**持久化字段未上 API 前不得宣称已上线**。 |

## 2. 特性开关与产品行为

| 开关 | 关闭（默认 / 生产） | 开启 |
| --- | --- | --- |
| `NEXT_PUBLIC_COMMUNITY_ME_LIKES_LIST` | 隐藏「赞过」Tab；不请求 `GET …/me/likes-received`、资料卡统计条不展示「获赞」；**旧书签** `/community/me/likes` **服务端**重定向至 `/community/me`（**不带** `?tab=likes`，避免落地后再 strip 的闪烁）；弹层内赞过列表 DataState 仍为 **`invalid`**（与空列表区分） | Tab + 列表与获赞统计同源 |
| `NEXT_PUBLIC_COMMUNITY_ME_AVATAR_UPLOAD` | **production** 构建且未设置：关（编辑资料内「本地上传」隐藏，仅 URL）。**非 production**（如 `next dev`）未设置：**开**（本地默认可传）。显式 `0`/`false` 任环境均关。 | 设为 `1` 或依赖非 production 默认 |
| `NEXT_PUBLIC_COMMUNITY_ME_BIO`（+ production 下 **`NEXT_PUBLIC_COMMUNITY_ME_BIO_ALLOW_PRODUCTION`**） | 不展示简介区块（production 仅设 BIO、未设 ALLOW → 仍关） | 展示占位区（`data-tt-community-me-surface=community_me_bio_preview`） |

## 3. 埋点与可观测

| 项 | 验证 |
| --- | --- |
| DataState | `CommunityMeDataStateSurface` 上 `data-tt-community-me-surface` / `data-tt-data-state` 与 `trackCommunityMeDataStateRender` 一致；赞过关时 likes 列表为 **`invalid`**（非 `empty`），避免与「空列表」混淆。 |
| 回归 | 开发态 `NODE_ENV=development` 下 `community_me_data_state` 日志含 `surface` + `kind`。 |

## 4. E2E（本地 / 后续 CI）

| 项 | 说明 |
| --- | --- |
| Playwright 默认 | `playwright.config.ts` 为 **未在 shell 设置** 的 P2 变量注入默认值（`likes`/`avatar` 开、`bio` 关），保证现有 `e2e/community-me-data-state.spec.ts`（赞过 **empty**）不因默认关赞过而失败。 |
| 复用已有 `npm run dev` | 若 `PLAYWRIGHT_REUSE_FE_SERVER` 复用本机已起的 Next，**不会**带上表内注入值；须在 `frontend/.env.local` 手动设 `NEXT_PUBLIC_COMMUNITY_ME_LIKES_LIST=1`（及按需头像开关），或临时 `PLAYWRIGHT_REUSE_FE_SERVER=0` 让 Playwright 自拉起带默认 env 的进程。 |
| 全关演练 | 本地可设 `NEXT_PUBLIC_COMMUNITY_ME_LIKES_LIST=0` 等覆盖默认，手测 `/community/me/likes` → `/community/me`（无 `tab`）、Tab 隐藏。 |
| 命令 | `npm run e2e:ci-community-me`（后续接 CI 时再纳入流水线）。 |

## 5. 回滚

| 场景 | 操作 |
| --- | --- |
| 仅关赞过 / 头像 / bio | 去掉对应 `NEXT_PUBLIC_*` 或设为 `0` / `false`，**重新构建并部署前端**（Next 构建期读 env）。 |
| 整站回退 P2 UI | 三键均关闭或不注入；后端 `GET …/me/likes` 可保留（无副作用），由前端不请求、不展示。 |
| 数据 | 赞过/收藏数据在 DB 中不因关开关被删；用户重新开开关后仍可见（在 API 与权限不变前提下）。 |

## 6. 合并前最小自检（不跑 CI 时）

1. `cd frontend && npx vitest run lib/communityMeFeatureFlags.test.ts`  
2. `cd frontend && npx tsc --noEmit`  
3. 手测：`/community/me` Tab 与 `/community/me/likes` 在开关 on/off 下与上表一致。

---

**文档版本**：与仓库 P2 开关实现同批；变更开关语义时请同步更新本表与 `frontend/.env.example`。
