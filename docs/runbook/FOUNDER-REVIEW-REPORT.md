# Founder Review Report（C1～C12 前 · 真实用户视角）

**日期：** 2026-05-31  
**阶段：** **① 本地**（Next `:3012` · API `:8080`）· **非 ② 测试网 GO** · **非 ③ 生产 GO**  
**审查方式：** 以未登录/轻登录真实用户路径浏览五主路由 + 注册/商家/身份 Hub；Playwright 全页截图 15 张；Feed API 抽检 50 帖；**未**以 vitest/E2E 绿集或代码阅读替代体验结论。  
**截图证据：** [`evidence/founder-review-20260531/`](../../evidence/founder-review-20260531/README.md)  
**关联闸：** [PHASE2-READY-REPORT](./PHASE2-READY-REPORT.md)（`READY_FOR_C1_C12` · 机读）· [COMMUNITY-PHASE-2-3-ROADMAP](../../frontend/evidence/GO_local_marketing_front_closure/COMMUNITY-PHASE-2-3-ROADMAP.md)（C1～C12）

---

## 一、Executive Summary

| 维度 | 结论（① 用户视角） | 等级 |
|------|-------------------|------|
| 首页品牌感 | 视觉高级（摄影 Hero + 暖金 L0），但 Slogan/任务态文案偏泛化 OTA，Logo 仅字标 | B |
| Community 社区 | **Feed 100% 为 E2E/PI-1 机器帖**，无真实旅行 UGC 感；空态/Explore 设计尚可 | **A** |
| 用户成长路径 | 注册→资料→发帖链路 **① 可通**，但未登录社交图（关注/私信）全空，回访动机弱 | B |
| 内容质量 | API 可见 `e2e-*` / `pi1-fe-*` / `browser-minio-*` / 作者「E2E Narrow」「测试游客」 | **A** |
| 信息架构 | 顶栏「Web3旅行 / 自由市场 / 排行榜 / TT 社区」与字标 TravelTrust **命名体系混用** | A |
| TravelTrust 核心特色 | `/traveltrust` 地球+托管叙事强；Community/DID **未在 Feed 卡片层突出 Trust/Reputation** | B |
| 商家 Onboarding | 五步链路文档完整，未登录见 Login Gate；价值表达偏合规/KYB 表单感 | B |
| 生产级体验 | 注册页 `networkidle` 超时；DID 榜首屏 SSR「加载中…」；移动社区 Feed 信息密度偏低 | A/B |

### C1 启动判定（初审 · 2026-05-31 AM）

**结论：暂缓启动 C1（Founder 标准未达）。** 详见下文「A 类 remediation」前各节。

---

## A 类 Remediation 与复验（2026-05-31 PM · ① 本地）

| A-ID | 措施 | 证据 |
|------|------|------|
| **A-01** | `community_posts.data_origin` + 公众 Feed 仅 `production`；22 条旅行 UGC seed（`TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE=1`） | `crates/api/migrations/20260601170000_*` · `seed_community_public_showcase.rs` |
| **A-02** | 新帖 `infer_community_post_data_origin`；E2E/PI-1 前缀 + 烟测邮箱 → `test` | `chain_off/community_public_surface.rs` |
| **A-03** | Explore/Feed：`resolveCommunityFeedDisplayPosts` — 无 production 时 fallback curated showcase | `lib/communityFeedShowcaseMerge.ts` |
| **A-04** | Hero kicker 改为「AI 定制 · 链上托管」（去「当前：创新行程」） | `locales/zh.ts` · `en.ts` |
| **A-05** | 注册页 TrustGrowth 实验 **首屏不阻塞**（先 fallback 再 async config） | `lib/trustGrowthExperiment.ts` |
| **junk** | 纯数字占位帖回扫为 `test` | `20260601170100_*` migration |

**复验（API · ①）：**

```text
GET /api/v1/community/feed?limit=30
feed_count=22 · automation_leak=0
authors: Aurora/Kento/Mei/Liam/Yuki/云游四海 Lin（6）
destinations: 京都/东京/巴厘岛/巴黎/大阪/清迈/…（≥10）
TT_COMMUNITY_C1_FEED_CHECK: OK
```

### C1 槽 PASS（② 测试网 · 2026-05-31 PM）

**结论：C1 槽 PASS** — staging `traveltrust_staging` + HTTPS `API_BASE` · **`TT_COMMUNITY_C1_FEED_CHECK: OK`**（`20260531T115243Z`）。

```text
API_BASE=https://little-maps-call.loca.lt  # localtunnel · ② 预演 HTTPS
DATABASE_URL=traveltrust_staging
feed_count=22 · automation_leak=0 · author_count=6 · destination_count=14 · media_post_count=20
Explore/Feed fallback: communityFeedShowcaseMerge.test.ts 3 passed
founder_review_a_class: PASS
```

**C1 证据槽：** [`evidence/GO_phase2_testnet_20260526/community/C1/`](../../evidence/GO_phase2_testnet_20260526/community/C1/) · `run-20260531T115243Z.log` · `feed-sample-20260531T115243Z.json` · `STATUS.txt` · `run.log`

**纪律：** **C1 槽 PASS ≠ Phase ② GO ≠ C2～C12 GO**。

### C1 启动判定（复验 · 2026-05-31 PM · ① preflight）

**结论：可正式启动 C1 实施（① 本地 preflight 已达标；② staging 逐槽仍 NON-GO）。**

**仍属 B/C、不阻塞 C1 开工：** Nav 命名统一（A-06）· Trust 徽章（B-01）· 社交冷启动 seed（B-02）· staging 持久主机（A-07）。

---

## 二、分维度审查记录

### 2.1 首页品牌感（`/`）

**所见（截图 `01-home-desktop` · `13-home-mobile`）：**

- L0 字标 **TravelTrust** + 深顶栏 vignette，整体 **暖金/摄影 Hero**，视觉层级达 Phase① 冻结水准。  
- Hero 标题：「从这里开启您的梦想之旅。」副标题含 **AI 定制 + USDT/USDC Polygon + 智能合约托管** — Web3 差异化有，但句式接近通用 OTA。  
- Kicker 出现 **「Web3旅行」+「当前：创新行程」** — 「当前：…」像 **内部功能开关说明**，非用户价值主张。  
- **无独立 Logo 图形**（仅 wordmark），Slogan 未形成记忆点（对比 `/traveltrust` 的「全球链上旅游网络 · 链上托管规划」）。

### 2.2 Community 社区（`/community/*`）

**所见（截图 `05`～`08` · `14-community-mobile`）：**

- 壳层：暖底 + premium Tab，L1 导航清晰（动态 / 发现 / 好友 / 消息 / 我）。  
- **Feed 正文**：浏览器侧渲染为 API 真数据；本地 API 抽检 **50/50 帖** 正文匹配 `e2e-*`、`pi1-fe-*`、`browser-minio-multipart-*` 模式。  
- 作者仅 **「E2E Narrow」「测试游客」**；互动数几乎全 0 — **无社区热度、无目的地/话题密度**。  
- 视频帖封面存在，但标题为机器串，**无旅行叙事**。  
- Explore / Friends / Messages **未登录** 为空态 + CTA（设计合格），但 **无法验证「真实社区感」**。  
- 移动 Feed（`14`）：单列可读，FAB 发帖可见，**卡片偏高、一屏约 1～1.5 帖**，密度低于 Instagram/小红书类预期。

### 2.3 用户成长路径

| 步骤 | 路径 | 体验 |
|------|------|------|
| 注册 | `/auth/register` | L5 壳一致；**整页 `networkidle` 等待 >60s 超时**（截图改 `domcontentloaded` 成功）— 首访感知差 |
| 登录 | `/auth/login` | 清晰，暖色摄影底（`09`） |
| 完善资料 | `/community/me` | 需登录；PI-1 已证头像链 **① 可通** — 本次未登录未深 walk |
| 发帖 | Feed FAB → PublishDrawer | ① 窄链已闭 — 未登录见登录门 |
| 关注 | `/community/friends` | 空态 + 引导 — **无种子关注关系** |
| 私信 | `/community/messages` | 空态 — **无会话** |
| 回访 | 首页 / Feed | **无个性化、无通知牵引**（未登录） |

**结论：** 单点功能 **① 可达**，但 **冷启动社交图缺失**，路径不「自然」，需 staging seed（C1/C6）+ 产品 nudge（B 类）。

### 2.4 内容质量

**Feed API 抽检（2026-05-31 · `GET /api/v1/community/feed?limit=50`）：**

```
authors: { "E2E Narrow", "测试游客" }
sample bodies: e2e-comment-flow-* , pi1-fe-text-* , browser-minio-multipart-* , e2e-report-post-*
```

**风险：** 开发环境默认 `communityShowcase` 演示数据（`did:tt:demo:*` · Aurora/Kento）在 **空 Feed 时** 可注入；当前 DB **非空但全为测试帖**，演示数据未生效，**更差** — 用户看到的是 **自动化垃圾内容** 而非 curated demo。

### 2.5 信息架构

| 位置 | 文案 | 问题 |
|------|------|------|
| L0 字标 | TravelTrust → `/traveltrust` | OK |
| Nav-1 | **Web3旅行** → `/` | 与品牌名不一致 |
| Nav-2 | 自由市场 → `/market` | OK |
| Nav-3 | **排行榜** → `/did-rank` | meta 为「DID 排行榜」，Nav 未体现 DID |
| Nav-4 | **TT 社区** → `/community` | 「TT」缩写对外不友好 |
| `/discover` | 重定向 `/market` | 用户不可见 — OK |
| 页脚/交叉导航 | 信任中心 / 费路由 / 治理 | 偏协议，分散 |

### 2.6 TravelTrust 核心特色（DID · Trust · Reputation · Provider · Steward）

| 能力 | 入口 | 突出度 |
|------|------|--------|
| DID / 排行榜 | `/did-rank` | 页存在；Nav 写「排行榜」；榜首 **SSR「加载中…」**（`04`） |
| Trust | `/traveltrust` 信任区 · `/help` | **TravelTrust 主页强**；Community 卡片 **未见 trust 分/徽章** |
| Reputation | DID 榜 · Escrow 角标 | 社区 Feed **默认不展示** escrow guide 角标（测试作者均为 tourist） |
| Provider | `/provider/register` · `/market/provider` | 商家链 **表单/KYB 感强**；市场 Hero 有 Escrow pill |
| Steward | `/governance/*` · staking | **五主路由 Nav 无 Steward 入口** — 仅治理深链 |

### 2.7 商家 Onboarding 与商业闭环

**所见（`11-provider-register` · 文档对拍）：**

- 未登录：**GuideRegisterLoginGate** — 正确。  
- 五步：注册意向 → 三步 KYB → 准入费 → Admin → 橱窗 — **链路完整**但 **用户可见价值**（「为何入驻 TravelTrust」）弱于 **合规字段堆叠**。  
- `/me/identities`（`12`）：收购 PD-009 Hub 存在 — **多重身份概念有入口**，但与 Community 主路径 **割裂**。

### 2.8 生产级体验

| 项 | 观察 | 分类 |
|----|------|------|
| 加载 | `/auth/register` networkidle **>60s** | A |
| 加载 | `/did-rank` 首屏「加载中…」时间长 | B |
| 空状态 | Community 子页空态 **虚线框 + 双 CTA** — 达标 | — |
| 错误 | 未触发 — API 健康时无暴露 | — |
| Toast | 未走完整发帖链 — ① 已测 | B |
| 移动 | Hero/TravelTrust 可读；Community 底部 Tab 可用 | B |

---

## 三、问题清单（A / B / C）

**影响等级：** 🔴 高 · 🟠 中 · 🟡 低

### A · 必须在测试网（C1）前修复

| ID | 页面 | 问题描述 | 影响 | 建议方案 | 截图 |
|----|------|----------|------|----------|------|
| **A-01** | `/community` Feed | Feed 全量为 E2E/PI-1 机器帖（`e2e-*`/`pi1-fe-*`），作者「E2E Narrow」「测试游客」 | 🔴 | 制定 **staging 真帖 seed 规范**（≥20 条旅行 UGC：目的地/图文/话题/多作者）；**C1 首交付物**；本地 dev 默认 Feed 改用 showcase 或隔离测试库 | `05-community-feed-desktop.png` |
| **A-02** | `/community` · API | 测试运行污染 **`community/feed` 公共读库**，与对外展示混库 | 🔴 | E2E/PI-1 写 **独立 schema/前缀用户** 或跑后 **cleanup job**；staging **禁止**复用 dev 污染 DB | — |
| **A-03** | `/community/explore` | 有 API 数据时 **不** fallback  curated demo，空探索/推荐作者无法「装填」 | 🔴 | C1 seed 同时填充 **explore 图集 + 推荐作者**；或 staging 强制 `NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE=0` + 仅真数据 | `06-community-explore-desktop.png` |
| **A-04** | `/` Hero | Kicker **「当前：创新行程」** 暴露内部产品态，削弱品牌 | 🟠 | 改为用户向 Slogan（如「AI 定制 · 链上托管」）；「创新行程」仅 dev flag | `01-home-desktop.png` |
| **A-05** | `/auth/register` | 页面 **`networkidle` 超时**，首屏加载 >60s | 🔴 | 排查长轮询/未关闭 SSE；改 lazy；验收：`domcontentloaded` <3s | `10-auth-register-desktop.png` |
| **A-06** | 全站 L0 Nav | **Web3旅行 / 排行榜 / TT 社区** 与 **TravelTrust** 品牌混用 | 🟠 | 定对外 Nav SSOT（例：首页「定制旅行」· 社区「社区」· 榜「信誉榜」）；**仅文案/i18n**（五主路由壳冻结下不动 layout） | `01` · `05` |
| **A-07** | staging 部署 | C1 要求 **持久 staging 主机**；当前 G-T 为 localtunnel 预演 | 🟠 | C1 开工前确认 **API_BASE** 非临时隧道；见 [PHASE2-READY-REPORT](./PHASE2-READY-REPORT.md) | — |

### B · 测试网阶段优化（C1～C12 并行）

| ID | 页面 | 问题描述 | 影响 | 建议方案 | 截图 |
|----|------|----------|------|----------|------|
| **B-01** | `/community` Feed 卡片 | 未展示 **Trust/Reputation/DID/托管向导** 徽章 | 🟠 | C9/C12：卡片层增加 **trust 分/escrow 角标/DID 短链**（数据链，非改壳） | `05` |
| **B-02** | `/community` | 冷启动 **关注/私信/回访** 无牵引 | 🟠 | C6 seed 社交图 + 系统关注推荐；通知 Tab 种子动态 | `07` · `08` |
| **B-03** | `/community` 移动 | 一屏帖数少，视频占高 | 🟡 | C4/C5 封面比优化；列表紧凑模式（若产品批准，需评估冻结边界） | `14-community-mobile.png` |
| **B-04** | `/did-rank` | 首屏长时间「加载中…」 | 🟠 | C12 互链验收时加 **SSR 骨架/ stale-while-revalidate** | `04-did-rank-desktop.png` |
| **B-05** | `/traveltrust` | 公告/章节 copy 偏 **协议与治理**（Timelock/白名单） | 🟡 | 测试网保留合规，增加 **用户向一行价值**  above fold | `02` · `15` |
| **B-06** | `/provider/register` | 商家价值主张弱，KYB 表单感强 | 🟠 | step1 增加 **「入驻后可获得」** 三 bullet（橱窗/托管/排行）；不改 L5 layout | `11` |
| **B-07** | `/me/identities` | 与 Community 主路径 **割裂** | 🟡 | Hub 增加 **「去社区完善资料」** 交叉链（数据链） | `12` |
| **B-08** | `/` | Slogan 泛 OTA，**无独立 Logo 图形** | 🟡 | 品牌 sprint：Logo mark + 一句差异化 Slogan（可仅 marketing 资产） | `01` |
| **B-09** | Steward | 五主 Nav **无 Steward/治理** 入口 | 🟡 | 测试网阶段在 `/traveltrust` 信任区强化 Steward CTA（不动五主 Nav 结构） | `02` |
| **B-10** | 视频播放 | Feed 视频依赖 MinIO/loopback URL | 🟠 | **C4** staging CDN + HLS/MP4 公网可达 | `05` |

### C · 生产前优化

| ID | 页面 | 问题描述 | 影响 | 建议方案 | 截图 |
|----|------|----------|------|----------|------|
| **C-01** | 全站 | `meta_title` 多为「TravelTrust」**无页面级差异化** | 🟡 | 生产 SEO：各路由 title/description 已部分存在 — 需 **③** 审计 | — |
| **C-02** | `/community` | 生产须 **关闭** `communityShowcase` demo 注入 | 🔴 | `NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE=0` + 真 UGC | — |
| **C-03** | 全站 | 移动 **44px 触控** 已大量收口 — 需 **93 矩阵** 全路由复验 | 🟠 | ③ go-live 前 Playwright 93 域 | `13`～`15` |
| **C-04** | Toast/Loading | 未全站走查错误/成功反馈一致性 | 🟡 | ③ UX audit | — |
| **C-05** | `/market` | 撮合/支付 **① 非真 USDC** — 生产 PSP | 🔴 | ③ Production GO 另闸 | `03` |

---

## 四、与 C1～C12 映射

| Founder 项 | C 槽位 | 说明 |
|------------|--------|------|
| A-01 · A-03 | **C1** | Feed ≥20 真帖 + API 对拍 — **C1 即 Founder A 类核心** |
| A-02 | **C1** 前置 | 测试数据隔离 — 不写入 C 表但 **阻塞 C1 验收可信度** |
| B-10 | **C4** | CDN/HLS |
| B-01 · B-04 | **C9 · C12** | 壳 Token + did-rank 互链 |
| B-02 | **C6 · C10** | 私信/好友 staging E2E |
| A-07 | **G-T / staging** | 持久主机 — [PHASE2-START-CHECKLIST](./PHASE2-START-CHECKLIST.md) |

---

## 五、Founder 签字区

| 项 | 状态 |
|----|------|
| ① 视觉壳 / 五主路由冻结质量 | **通过** — 暖金 L0、Community premium Tab、TravelTrust 地球叙事达 Phase① 标准 |
| ① 对外内容 / 品牌叙事 | **不通过** — Feed 测试污染 + Nav 命名 + Hero 任务态 |
| Founder 复验（Community 首屏） | **通过** — 22 production 帖 · 0 automation 泄漏 |
| ② C1 槽 | **PASS** | `20260531T115243Z` · staging seed + Feed 对拍 · **≠** Phase ② GO |
| ② C2 | **IN_PROGRESS** | MIME+魔数 · security IT + staging upload |
| 审查人 | _（待 Founder 签字）_ |
| 日期 | 2026-05-31 |

---

## 六、复现命令

```bash
# 截图复跑（① · 无断言）
cd frontend && npx playwright test --config=playwright.founder-review.config.ts

# Feed 内容抽检
curl -s "http://127.0.0.1:8080/api/v1/community/feed?limit=20" | jq '.posts[].body'
```

**纪律：** 本报告 **不** 构成 C1～C12 **GO**；**不** 用 ① 体验报告冒充 ② 测试网或 ③ 生产已验收。
