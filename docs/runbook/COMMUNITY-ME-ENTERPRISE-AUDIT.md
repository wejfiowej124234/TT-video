# 社区个人中心（`/community/me`）企业级审计 Runbook

> **用途**：评审、发版前架构与风险对齐；与 [COMMUNITY-ME-P2-LAUNCH-CHECKLIST.md](./COMMUNITY-ME-P2-LAUNCH-CHECKLIST.md)（特性开关、契约、E2E、回滚）**互补**：本文件侧重**数据域、鉴权、双源模型与生产 UAT**，P2 表侧重**构建期开关与门禁**。  
> **范围**：`/community/me` 主壳、子页（likes / collects / posts / reports）、资料编辑、安全行、FAB 快捷、Trust 区、埋点与错误态。  
> **文档版本**：2026-04-21（对齐 `CommunityMePostsShowcaseThumbGrid` / `communityMePostsShowcaseModel`）；与仓库实现漂移时请同步更新「关键路径」表中的路径。

---

## 1. 信息架构与关键路径

| 区域 | 路由 / 入口 | 主要实现参考 |
| --- | --- | --- |
| 主壳 | `/community/me` | `frontend/app/community/me/page.tsx` |
| 顶卡 / 资料 / 统计 / Trust | 同上 | `CommunityMeAccountPanel`、`MeProfileSection`、`MeStatsSection`、`MeTrustSection` |
| 安全行（改密 / 订单 / 退出） | 面板内 | `CommunityMeAccountSecurityRow.tsx` |
| FAB 快捷抽屉 | 面板内 | `CommunityMeQuickLinksDrawer`、`MeQuickLinksSection` |
| 赞过 | `/community/me/likes` | `frontend/app/community/me/likes/page.tsx` |
| 收藏 | `/community/me/collects` | `frontend/app/community/me/collects/page.tsx` |
| 社区帖子橱窗（Tab：`community_me_tab_community_posts`） | `/community/me?tab=posts`（`/community/me/posts` **302→** 带 `tab`） | `frontend/components/me/communityMeNotes/CommunityMePostsExperience.tsx`、`CommunityMePostsShowcaseThumbGrid.tsx`、`frontend/lib/communityMePostsShowcaseModel.ts`、`frontend/lib/communityMePostsDrawerFetch.ts`、`frontend/app/community/me/posts/page.tsx`（仅重定向） |
| 举报列表 / 详情 | `/community/me/reports`、`/community/me/reports/[id]` | 对应 `page.tsx` |
| 数据态与埋点 | 各子页 | `CommunityMeDataStateSurface`、`data-tt-community-me-surface` |

---

## 2. 鉴权与会话

| 项 | 结论 | 说明 |
| --- | --- | --- |
| 登录判定 | **一致** | `CommunityAuthProvider` 与 `useMePage` 均依赖 `getMeFull`（`GET /api/v1/me`）；社区请求头与 `getAuthHeaders()` 同源（如 `frontend/lib/community.ts` 中 `defaultHeaders`）。 |
| 未登录 | **符合设计** | 无 `Authorization` / `X-User-Id` 时 `getMeFull` 为 `null`，主壳展示鉴权闸与登录链。 |
| `NEXT_PUBLIC_SKIP_ME_FETCH=1` | **高风险** | `getMeFull` 恒不拉取 → 全站社区个人中心表现为未登录；**仅联调**；生产禁止。 |
| 客户端超时 | **运维关注点** | `getMeFull` 约 12s 超时后按未登录处理；弱网可能被误判为匿名。 |
| 后端 404→401 | **有意行为** | `chain_off` 且用户不在内存 store 时，避免前端把「丢会话/清库」误当匿名（`routes/me.rs` 等实现以仓库为准）。 |

---

## 3. 数据域：双源模型（评审必读）

个人中心是 **「链 off / 内存用户快照」** 与 **「PostgreSQL 社区行为」** 的拼盘，不是单一领域模型。

| 能力 | 数据源 | 「真实可用」前提 |
| --- | --- | --- |
| 昵称、头像 URL、默认钱包等 | `PUT /api/v1/me` → `chain_off` 实现 | API 进程 **`chain_off` 已启用**；否则写路径可能未实现或不可用。 |
| 订单 / 支出 / 评价数等统计 | 嵌在 **`GET /me` 的 stats** | 同上；为**链下聚合展示**，非链上实时证明。 |
| 关注 / 粉丝 / 好友 / 获赞等 | Community 只读 API + `useQueries` | **`DATABASE_URL` 可用** + 会话校验通过；无 DB 时部分 handler 返回**占位 JSON**（口径见各路由实现）。 |
| 赞过 / 收藏 / 帖子 / 举报列表 | **PG `community_*` 等表** | 库内**确有该用户**相关行；与 `/me` 用户为**同一 UUID 会话体系**。 |

**UAT 含义**：仅「路由 200 + UI 不报错」不等于通过；必须在**与生产等价的 DB + 开关 + 会话**下用**真实业务数据**跑通下列清单。

---

## 4. 功能审计矩阵（代码路径级）

### 4.1 主页面 `/community/me`

| 功能 | 代码路径畅通 | 依赖 / 备注 |
| --- | --- | --- |
| 访客鉴权闸 | 是 | `deriveAuthGateDataState`；埋点 `data-tt-*`。 |
| 已登录资料卡 | 是 | `useMePage` + `CommunityMeAccountPanel`。 |
| 社交统计条 | 是 | 四路任一失败 → `error` + 重试 `invalidateQueries`。 |
| 底部 Tab（访客） / 内嵌 Tab（已登录） | 是 | **赞过**受 `NEXT_PUBLIC_COMMUNITY_ME_LIKES_LIST`；未登录进入子页可能再遇登录或空态。 |
| Auth 加载中 UI | 注意 | `showMeSections = isLoggedIn && !authLoading` 可能出现短暂「访客 Tab」闪烁；属 UX 改进项，非阻断。 |

### 4.2 编辑资料（`MeProfileSection`）

| 功能 | 代码路径畅通 | 依赖 / 备注 |
| --- | --- | --- |
| 保存昵称 / 头像 URL / 钱包 | 是（在 chain_off 可用时） | `putMe`、`clearGetMeFullCache`、`traveltrust:profile-updated`。 |
| 本地上传头像 | 条件 | `isCommunityMeAvatarUploadEnabled()`；生产默认关见 P2 检查表。 |
| 复制用户 ID / 钱包 | 部分环境 | `navigator.clipboard`；非 HTTPS 或权限被拒可能静默失败。 |
| 改密 / 向导台链接 | 是 | 改密 `/me/password?returnUrl=...`；**returnUrl 消费情况以订单/账户页为准**（体验缺口，非安全阻断）。 |

### 4.3 身份与安全行

| 功能 | 代码路径畅通 | 依赖 / 备注 |
| --- | --- | --- |
| 修改密码 | 是 | 依赖 `chain_off` 与后端实现。 |
| 我的订单 → `/orders` | 是 | 订单页自身权限与数据。 |
| 退出 | 是 | `runMeLogoutFlow` 与全站一致。 |

### 4.4 子页

| 页面 | 代码路径畅通 | 依赖 / 备注 |
| --- | --- | --- |
| 收藏 | 是 | `getMeCollects` + 批量 `getPostById`；无数据为 **empty**，非 invalid。 |
| 赞过 | 是 | Flag 关时列表为 **invalid**（与空列表区分）；开时依赖 `getMeLikes` + PG。 |
| 我的帖子 | 是 | 依赖发帖与 DB。 |
| 举报列表 / 详情 | 是 | 依赖举报 API 与 DB；无权限或未登录为对应 gate / invalid。 |

### 4.5 Trust / 页脚

| 区域 | 说明 |
| --- | --- |
| `MeTrustSection` | 数据来自 `getMeFull` 载荷；CTA 依赖业务配置（如向导注册）。 |
| `MePageFooter` | 交叉链接路由级存在；目标页业务数据需单独验收。 |

---

## 5. 安全与合规（摘要）

- **会话**：社区写操作与 `/me` 使用同一套鉴权头；`STRICT_SESSION_GATE` 下需 Bearer（以部署文档为准）。
- **头像**：`PUT /me` 仅接受 `avatar_url` 字符串（含 data URL）；注意体积与 WAF/超时。
- **剪贴板**：无强制 UI 降级；企业浏览器策略需纳入 UAT。

---

## 6. 自动化与手测交叉引用

| 项 | 参考 |
| --- | --- |
| P2 开关、E2E、回滚 | [COMMUNITY-ME-P2-LAUNCH-CHECKLIST.md](./COMMUNITY-ME-P2-LAUNCH-CHECKLIST.md) |
| Playwright | `frontend/e2e/community-me-data-state.spec.ts`、`frontend/e2e/smoke.spec.ts`（`data-tt-community-me-surface`） |
| 配置 | `frontend/playwright.config.ts` 中 P2 默认 env 注入；复用已起 dev 时需 `.env.local` 对齐 |

**说明**：现有 E2E 多覆盖 **empty / invalid / error** 等数据态；**不替代**下文「生产 UAT 必测真实数据」中的列表非空、跨服务一致性验证。

---

## 7. 生产 UAT 必测真实数据清单

> **目标**：在**目标环境（生产或预发）**用**真实账号 + 真实 DB 行**验证「双源模型」下个人中心**可读、可写、可导航**，避免仅验证空态与占位 JSON。  
> **签字建议**：每项勾选 + 执行人 + 日期；阻塞项不得带缺陷上线。

### 7.1 环境与开关（前置）

| # | 检查项 | 通过标准 |
| --- | --- | --- |
| E1 | `NODE_ENV`、构建产物与生产一致 | 与发版清单一致 |
| E2 | `NEXT_PUBLIC_COMMUNITY_ME_*` 与发布策略一致 | 与 P2 检查表 §2 一致 |
| E3 | **禁止** `NEXT_PUBLIC_SKIP_ME_FETCH=1` | 未设置或为 `0` |
| E4 | 后端 `DATABASE_URL` 指向**目标库**且迁移已应用 | 社区相关表可查询 |
| E5 | `chain_off`（或等价配置）与**发版说明**一致 | `/me` 读写与统计符合预期 |

### 7.2 测试账号与数据准备（真实数据）

| # | 数据项 | 准备动作 | 用于验证 |
| --- | --- | --- | --- |
| D1 | 已注册且可登录账号 A | 生产或预发真实注册 / SSO | 全流程 |
| D2 | 资料可写 | A 在编辑资料中修改昵称并保存，刷新仍一致 | `PUT /me` + `GET /me` |
| D3 | 头像 | 若开启本地上传：上传后个人中心与帖子作者头像一致；若仅 URL：粘贴 HTTPS 图链 | 与开关策略一致 |
| D4 | 钱包字段（若产品要求） | 设置默认钱包后订单/支付流是否引用（按产品范围） | 跨模块 |
| D5 | **至少 1 条社区收藏** | A 在 Feed 收藏一篇仍存在的帖子 | `/community/me/collects` 列表非空、点开帖子 |
| D6 | **至少 1 条赞过**（Flag 开时） | A 点赞一篇仍存在的帖子 | `/community/me/likes` 非 empty |
| D7 | **至少 1 条本人帖子** | A 发帖且未删 | `/community/me?tab=posts`（或书签 `/community/me/posts` → 重定向） |
| D8 | **至少 1 条举报记录**（若模块上线） | A 发起举报且后端已落库 | `/community/me/reports` 与详情页 |
| D9 | **订单域**（若个人中心暴露订单入口） | A 名下存在至少一笔**非空**订单（状态任意但可查） | `/orders` 从安全行 / FAB 进入 |
| D10 | 社交数字非全零（可选但推荐） | A 有关注/粉丝/好友/获赞中至少一类可观测数据 | 社交条与后端一致 |

### 7.3 页面级 UAT（逐项勾选）

| # | 路径 / 操作 | 通过标准 |
| --- | --- | --- |
| U1 | 未登录访问 `/community/me` | 鉴权闸；埋点 surface 符合预期；无控制台未处理异常 |
| U2 | 登录后 `/community/me` | 资料卡展示 D2 数据；社交条为 **success** 或符合预期的 **error** 可重试 |
| U3 | 编辑资料保存 | 保存成功提示或 UI 更新；刷新后一致 |
| U4 | 改密链接 | 打开改密页并完成一次「打开即关」或完整改密（按安全策略） |
| U5 | 我的订单 | 从安全行进入 `/orders`，列表含 D9 或符合「无订单」产品文案 |
| U6 | 退出再登录 | 会话清除后回到 U1→U2 闭环 |
| U7 | `/community/me/collects` | 列表含 D5；单条可跳转帖子且帖子可读 |
| U8 | `/community/me/likes`（Flag 开） | 列表含 D6；Flag 关时为 **invalid** 而非假 empty |
| U9 | `/community/me/posts` | 列表含 D7 |
| U10 | `/community/me/reports` | 列表或详情与 D8 一致；无数据时为明确 empty |
| U11 | Trust 区（若启用） | 与 `getMeFull` 及身份产品一致 |
| U12 | FAB 与页脚链接 | 关键外链 200 或产品定义的重定向；无死链 |

### 7.4 负面与韧性（建议）

| # | 场景 | 通过标准 |
| --- | --- | --- |
| N1 | 撤销 A 的会话 / 过期 Token | 社区页降级为未登录或明确错误，无白屏 |
| N2 | 模拟单路社区 API 5xx（预发可造） | 社交条 **error** + 重试可用 |
| N3 | 弱网（节流）打开 `/community/me` | 无无限 loading；超时后有可理解态 |

### 7.5 签字栏

| 角色 | 姓名 | 日期 | 备注 |
| --- | --- | --- | --- |
| 产品 | | | |
| 前端 | | | |
| 后端 / API | | | |
| 运维 / 发布 | | | |

---

## 8. 变更记录

| 日期 | 变更摘要 |
| --- | --- |
| 2026-04-19 | 初版：企业审计落盘 + 生产 UAT 真实数据清单 |
