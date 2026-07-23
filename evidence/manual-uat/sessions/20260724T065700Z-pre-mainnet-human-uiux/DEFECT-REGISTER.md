# Pre-Mainnet Human UI/UX · Defect Register

**Session:** `20260724T065700Z-pre-mainnet-human-uiux`  
**Phase:** ①/② 真人手测（主网真网前）· ≠ Production GO  
**Tip cite:** `ea71c577` · Pin `PSG-REL-20260720-WEB3-CAND-V2`  
**Staging deploy HEAD:** `f123f691`（`STAGING_PATCH_HEAD_NE_TIP` = ED · 性能补丁已上 Staging）  
**Env:** https://tt-web-staging.fly.dev（未登录）  
**Accounts SSOT:** `docs/runbook/TT-TEST-ACCOUNTS-QUICK-REFERENCE.md`（密码不写入本表）  
**Rule:** Owner 口述的每一个问题均追加；结束时「问题清单 + 修改意见」再集体修改。

## 缺陷表

| # | 时间 | 账号 | 路径/页面 | 问题描述（原话） | 类型 | 严重度 | 修改意见 | 状态 |
|---|------|------|-----------|------------------|------|--------|----------|------|
| HU-001 | 2026-07-24 ~07:00 | 未登录 | `/traveltrust` Hero（Owner 称「首页」截图） | Hero 卡内「连接钱包」多余：顶栏已有连接钱包，这里应删除 | UX · UI | P1 | 按已冻 Delta `HOME-TRAVELTRUST-HERO-UX-DELTA-20260722`：移除 `TravelTrustHeroWalletConnect`；仅保留「开始规划行程」；顶栏 `#tt-header-wallet` 为唯一入口；同步 contract test（现仍断言有 wallet 次按钮 = 文档/代码漂移） | OPEN |
| HU-002 | 2026-07-24 ~07:00 | — | 真源 vs Staging | Owner 怀疑 Staging 不是真源最新；要求核对昨日性能优化是否更新真源 | 部署/真源 | P1（信息） | 见下方「真源/部署对拍」；性能补丁已在 Staging HEAD `f123f691`；Final Truth tip 仍为 `ea71c577`（ED 设计）；**钱包删除未进代码**（文档声称已删） | OPEN · 信息项 |
| HU-003 | 2026-07-24 ~07:07 | 未登录 | `/traveltrust` 角色剧场「选择您的旅行角色」 | 视频不是最新；最新在本地 `首页角色宣传片/`（游客/向导/商家/旅行收购 mp4+封面 jpg）；需永久储存；每个角色封面也要加上 | 媒资 · UX | P1 | 按 Media Asset SSOT：从 drop zone 摄入 → Git LFS 写入 `frontend/public/media/traveltrust/roles/`（traveler/guide/merchant+provider/acquisition.mp4 + 对应 `*.poster.jpg`）；更新 `registry/traveltrust-role-promo-media-assets.v1.yaml` + `PROMO-MANIFEST.json`；UI 绑定真实封面（替换现 SVG poster）；`region_steward` 本批仍无 Owner 素材 → 保持 TIER1_PLACEHOLDER 或 Owner 补齐；跑 `check-traveltrust-role-promo-media-ssot-gate.sh`；Staging 再 bake | OPEN |
| HU-004 | 2026-07-24 ~07:08 | 未登录 | `/traveltrust` 公告 / Pulse · `/traveltrust/announcements` | 首页公告内容须按 Final Truth Baseline 唯一真源做内容审计并更新对齐（Candidate v2 · V3.1.1 Final · PSG-EGM · Governance Anchor · Product/Release · Eng SSOT · Release Integrity · Delta Recertify · Feature Inventory · Reality Closure · PRR · Mainnet Hard Gate / Cutover） | 内容 · CMS | P1 | 见下方 HU-004 审计表：现 CMS 仍为 Phase1/2/3 Sepolia 叙事 + 过期「7月15日公网」；集体改时写 CMS 对齐稿 → seed/Admin publish → locale pulse 同源 → 诚实边界（≠ Production GO · Cutover 未放行） | OPEN |
| HU-005 | 2026-07-24 ~07:11 | 未登录 | 定制旅行 `/` Ambient 背景 | 默认背景是长城（十国之一），应改为品牌旅行高清图（AI 生成 · L5 · 行业旅行标准），不应默认某国；切换十国景区图响应慢，需优化（动画和/或提速） | UX · 性能 · 媒资 | P1 | 见 HU-005：① 新增 brand default ambient（非十国）永久入库；② 空国家绑定 brand URL；③ 十国切换：preload + decode + crossfade 保底，优先链路提速（CDN/尺寸/webp/预取邻国） | OPEN |
| HU-006 | 2026-07-24 ~07:13 | 未登录 | 定制旅行 `/` · AI 生成行程 | 未登录选完国家/日期/人数后点「AI生成行程」，「请先登录后再生成行程」现为页内内嵌白框；应改为符合站点风格的**弹窗** | UX · UI | P1 | 提交时 auth gate 改 modal：对齐 UnlockModal / L5 暗色玻璃壳；内嵌 `landing_error_login` 条从 `LandingHeroForm` 移除；CTA「登录/注册后继续」带 returnUrl 回本页表单态；Esc/遮罩关闭 | OPEN |
| HU-007 | 2026-07-24 ~07:16 | 未登录/登录 | 自由市场 · 自定义行程「创建行程」弹层 | ①「向导创作行程」改「自定义制作」，任何人可做不限向导；② 关闭草稿确认现为浏览器原生 confirm（截图2），应改为居中 L5 风格弹窗；③ 未登录不可点自定义行程，登录提示与定制旅行（HU-006）弹窗一致 | UX · 文案 · 权限 | P1 | 改文案键 `market_createAsGuide`→自定义制作并放宽角色闸；`market_studio_unsaved_confirm` 换 Dialog；入口加 auth gate 复用 HU-006 modal 壳 | OPEN |
| HU-008 | 2026-07-24 ~07:19 | 未登录 | TT 社区 `/community` Feed 筛选 | 关注/推荐/目的地/热点筛选需全面审计；点「中国」后 chip/结果异常（只见日本/泰国/印尼/新加坡）；点「全部」出现很多国家且城市混排、新加坡重复 | 功能 · UX · 数据 | P1 | 审计 region vs destination 双轨；REGION_KEYS 对齐十国；选国后热门城市应按 DESTINATION_BY_REGION 收敛；去重；Tab×筛选矩阵用例 | OPEN |
| HU-009 | 2026-07-24 ~07:20 | 未登录 | 自由市场 · 旅行收购详情抽屉 | 产品右侧弹层中「60–260 USDC」左侧文字与底色同色不可见 | UI · 对比度 | P1 | `AcquisitionListingDetailBody` header：`subsiteTagPill`（route/deadline）在暗色壳上对比度失效；改为暗底可读色（slate-100/白）并做 a11y 对比检查 | OPEN |
| HU-010 | 2026-07-24 ~07:22 | 未登录 | `/market/acquisition` 旅行收购列表 | ①「发布就绪度」大卡是否应出现在浏览页存疑；②「筛选」二字与底色过近不可读 | UX · IA · 对比度 | P1 | 浏览页以目录为主：就绪度收起到「发布」CTA / `/me/identities` 或折叠；筛选标签强制可读色（`filterBandLabel`） | OPEN |

## 真源 / 部署对拍（本轮核查）

| 轴 | 值 | 结论 |
|----|-----|------|
| Final Truth living tip | `ea71c577` | 产品 tip FROZEN |
| Staging Web release-identity | `f123f691` · build `2026-07-23T09:58:11Z` | **不是 tip** · 是 Staging Patch HEAD |
| Staging API `/meta` | `f123f691` · deploy `2026-07-23T09:34:30Z` | 同上 |
| HEAD vs tip | `STAGING_PATCH_HEAD_NE_TIP` | **Expected Difference（CONFIRM_DESIGN）** · ≠ 新 RC |
| 性能优化 Closure | `PERFORMANCE_OPTIMIZATION_CLOSURE_PASS` · PCR-20260723 | 真源板已更新；落地 commit 含 `f123f691 fix(perf): …` |
| Staging 是否含性能优化 | **是**（当前就跑在 `f123f691`） | 性能轨已上测试网 |
| Hero 去钱包（2026-07-22 Delta） | 证据文写「已移除」 | **代码 tip + Staging 仍渲染** `TravelTrustHeroWalletConnect` → **文档漂移 / 未落地** |
| 截图页面对拍 | 文案 = `/traveltrust`（非 `/` 定制旅行表单首屏） | 「TravelTrust 定制旅行」·「开始规划行程」·「向下 · 角色剧场」 |


## HU-003 素材映射（集体改时用）

| 本地 drop zone | 永久路径（Git LFS） | 封面永久路径 |
|----------------|---------------------|--------------|
| `游客.mp4` / `游客-封面.jpg` | `traveler.mp4` | `traveler.poster.jpg` |
| `向导.mp4` / `向导-封面.jpg` | `guide.mp4` | `guide.poster.jpg` |
| `商家.mp4` / `商家-封面.jpg` | `merchant.mp4` (+ `provider.mp4` 同校验) | `merchant.poster.jpg` |
| `旅行收购.mp4` / `旅行收购-封面.jpg` | `acquisition.mp4` | `acquisition.poster.jpg` |
| （未提供）主理人 | `region_steward.mp4` 仍占位 | 待 Owner |

**现况：** 仓内 MP4 为 2026-07-22 批；封面多为 `*.poster.svg` 占位，非 JPG 真封面。  
**drop zone：** `首页角色宣传片/` = 可选摄入，**永久真源 = Git LFS + Registry/Manifest**（禁止 bake 依赖本地文件夹）。


## HU-004 · 公告内容审计（Staging live · 2026-07-24）

**API：** `GET /api/v1/public/announcements` · source=cms · 10 条已发布

| 现 slug / 标题 | 与 Final Truth 关系 | 处置建议 |
|----------------|---------------------|----------|
| `phase3-entry-mainnet-prep` 主网发布工程 · Sepolia… | 未点名 Final Truth / Candidate v2 / Hard Gate 真状态 | **重写**为 Final Truth Baseline 状态条（cite-only · tip `ea71c577` · Hard Gate open 09/12/14） |
| `product-deploy-phase{1,2,3}` Phase N · Sepolia ACTIVE | 旧三阶段叙事 · 易与 Final Truth 阶梯混淆 | **归档或降级**为历史旁证；主列表改用 Final Truth 锚点条目 |
| `product-planned-launch` …计划于 **2026-07-15** 公网开放 | **日期已过** · 文案漂移 | **重写**日期/门槛口径（以 PRR / Hard Gate / Production GO 为准 · 禁止假完成） |
| `governance-*` / `product-escrow-*` / `product-guide-*` / `product-security-*` | 产品/治理面尚可 | **校对**用语：对齐 V3.1.1 / EGM / Candidate v2 表述 · 不改资金承诺 |
| （缺失）Final Truth 十二锚公开说明 | Staging **无**对应公告 | **新增** protocol/product 分轨条目（每锚一行摘要 · 链到白皮书/治理/信任说明 · 非投资要约） |

**集体改交付物：**
1. 内容审计矩阵（上表定稿）+ CN/EN 文案包  
2. CMS：`cms_public_announcements` seed 或 Admin Review→Publish（Staging DB）  
3. `frontend/locales/{zh,en}.ts` pulse 键与 CMS `message_key` 同源  
4. 证据：公告 API 复读 + 截图 · 更新本 Register 为 FIXED  

**禁止：** 用公告宣称 Production GO / Cutover PASS；平行 Phase 叙事覆盖 Final Truth。


## HU-005 · 定制旅行 Ambient（默认品牌图 + 十国切换性能）

**Owner 原话要点：** 默认不该是十国里的长城；要品牌旅行高清底图；点十国景区图慢 → 加动画或提速。

### A · 默认背景（品牌 · 非十国）

| 项 | 现况 | 修改意见 |
|----|------|----------|
| 空国家 / 首屏 default | `landingAmbientImageUrl("")` → 现落到 **CN Destination Ambient（长城类）** | 新增 **brand default** 资产（AI 生成 · 旅行氛围 · L5 · 非具体十国地标）永久存 CMS/COS 或 `frontend/public/media/…` + Registry |
| 绑定 | `LandingHomeAmbientBackdrop` · `useLandingAmbientResolution("")` | 空 `country` **只**用 brand URL；选中十国后才切对应 ambient |
| 质量闸 | — | Content QA / L5 视觉：分辨率、色温、无文字水印、版权可商用；**一张图 LOCK** 后不反复换美 |

### B · 十国切换慢（动画 + 提速 · 双管齐下）

| 杠杆 | 建议 | 说明 |
|------|------|------|
| **感知动画（必做）** | 保持/加强 **单次 crossfade**（现 ~0.36s）· 旧图不闪白 · Ken Burns 不 remount | 慢网络时仍「有过渡」不「卡顿切」 |
| **响应提速（主修）** | ① 点击前 **prefetch** 十国 URL（hover/idle）② `preloadAmbientImage` 完成后再换 displaySrc（已有雏形）③ 输出 **WebP/AVIF + 合适宽度**（非原图硬拉）④ Catalog API 延迟时 **先显示 TS 本地/CDN 映射** 再可选升级 | 动画不能代替字节体积与 RTT |
| **禁止** | 为国家切换再加长 loading 遮罩冒充「优化」 | |

**集体改顺序：** 生成/选定 brand 图 → 入库真源 → 改 default 绑定 → 加十国 prefetch + 体积优化 → Staging 复测切换体感。


## HU-006 · 未登录生成行程 → 登录弹窗（非内嵌条）

**现实现：** `LandingHeroForm.tsx` 内联渲染 `landing_error_login` + CTA（页流白边圆角框）。  
**真源钩子：** `useLandingPage.ts` `setSubmitError(t("landing_error_login"))`。  
**已有范式：** `UnlockModal.tsx`（同页解锁弹窗）— 集体改时复用壳/动效 token，新增 `LandingAuthRequiredModal`（或扩 UnlockModal 变体）。

| 要求 | 修改意见 |
|------|----------|
| 形态 | **Dialog/modal** overlay · 暗色半透明 · 细白描边 · L5 玻璃，非页内占位条 |
| 文案 | 保留 `landing_error_login` / `landing_error_login_cta`（可微调用语） |
| 触发 | 未登录点击「AI 生成行程」→ open modal（表单数据保留） |
| 关闭 | Esc · 点遮罩 · 次要「稍后再说」 |
| 登录后 | return 到 `/` 且偏好不丢（session/localStorage 已有则复用） |


## HU-007 · 自由市场「创建行程」三连

| # | Owner 要求 | 现况 | 修改意见 |
|---|------------|------|----------|
| A | 「向导创作行程」→ **自定义制作**；任何人可自定义 | 文案 `market_createAsGuide`；模式可能仍偏 guide 语义 | 改 CN/EN 文案；模式闸 **不**限 `guide` 角色（登录即可写自定义）；说明区同步「自定义模式」 |
| B | 关闭丢失草稿确认 · **风格统一 · 居中** | `market_studio_unsaved_confirm` + **`window.confirm`**（浏览器顶栏原生框） | 换成 L5 Dialog（暗色玻璃 · 确定/取消居中 overlay）· 禁原生 confirm |
| C | 未登录不能点自定义行程 · 提示与定制旅行一致 | 可能直接打开创建行程 | 点入口先 auth gate → **同 HU-006 modal 壳**（文案可市场语境）→ 登录 returnUrl=`/market` |

**代码锚点（集体改时）：** `market_createAsTourist` / `market_createAsGuide` · `market_studio_unsaved_confirm` · 市场 Custom Itinerary studio 组件。


## HU-008 · TT 社区 Feed 筛选审计

**Owner 现象：**
- 顶栏 Tab：关注 / 推荐 / 目的地 / 热点 — 整体筛选逻辑可疑，需全面审计
- 点 **中国**：只剩/只见 **日本·泰国·印尼·新加坡**（错）
- 点 **全部**：国家很多 + **城市混在国家行** + **新加坡重复**

**代码结构（现）：**
| 层 | 状态 | 键 |
|----|------|-----|
| Stream Tab | following / recommend / destination / hot | `applyCommunityDiscoveryStreamTab` |
| Region chips | `REGION_KEYS = all,cn,jp,th,id,sg`（**仅 5 国+全部** · 缺产品十国其余） | `regionFilter` |
| Hot destination chips | `hotDestinations` 全局城市名 | `destinationFilter` · **选国后未按区域收敛展示** |
| 过滤派生 | `DESTINATION_BY_REGION` + `useCommunityFeedFilters` | 客户端二次滤 |

**修改意见（集体改）：**
1. **全面审计矩阵**：4 Tab × region × destination × type × proximity × 清除筛选 — 每格预期帖子集  
2. **国家芯片对齐产品十国**（或明确「社区区域子集」并在 UI 标明）  
3. 选中某国后：**热门城市行只显示该国城市**；「全部」时国家行≠城市行，**禁止同标签重复**（新加坡国/城）  
4. 点「中国」后结果必须是中国相关帖/城，不得串成 JP/TH/ID/SG  
5. 补 vitest/contract：region→destination 收敛 · 去重 · Tab 切换不脏滤  


## HU-009 · 旅行收购详情 · USDC 左侧字不可见

**位置：** `/market/acquisition` 点 listing → 右侧详情（embed drawer）  
**现码：** `AcquisitionListingDetailBody.tsx` header 三 pill：`route` · `deadlineNote`（`D.subsiteTagPill`）· bounty（`D.trustTokenPill` 可见）  
**根因候选：** `TT_MARKETING_MARKET_DARK_PATH.subsiteTagPill` 文字色在暗底上失效（截图仅见空描边圆/框）  
**改法：** 暗路径 token 统一浅色字；保留金边赏金 pill；补合同测防回归。


## HU-010 · 旅行收购列表 · 发布就绪度位置 +「筛选」对比度

**Owner：** 就绪度卡该不该在这里？「筛选」字几乎看不见。

| 项 | 真源/现况 | 修改意见 |
|----|-----------|----------|
| 发布就绪度 | PD-009：浏览人人可用；发布门闸在 API；面板现挂在 `MarketStandaloneBusinessPage`（acquisition）大卡置顶 | **IA：** 列表页优先逛橱窗；就绪度 **勿抢主视线** — 方案择一：(A) 仅点「发布/打开 Studio」时弹出/展开；(B) 主展示在 `/me/identities` 收购槽，子站改为短链「发布前检查」；(C) 默认折叠一行 |
| 「筛选」 | `MarketSubsiteFilterBar` / `filterBandLabel` 对比不足 | 与 HU-009 同批：暗底强制浅色字 + 合同测 |

**诚实：** 门闸逻辑本身保留；改的是 **出现位置与层级**，不是取消 PD-009。

## 集体修改闸（结束时填）

- [ ] 问题清单已冻结
- [ ] 每条有修改意见
- [ ] 按严重度排序后集体改
- [ ] 同批复验勾选

## 诚实边界

五主：仅 bugfix / 数据链 / i18n / a11y · 禁止结构视觉回流（本条「删多余次 CTA」属已批准 Hero UX Delta，允许）。  
不改 tip / Candidate v2 / PSG-EGM / Product Baseline 字节身份；Staging 再部署属 Track B patch。
