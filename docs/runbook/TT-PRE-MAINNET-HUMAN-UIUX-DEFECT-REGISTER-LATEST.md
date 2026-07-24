# Pre-Mainnet Human UI/UX · Defect Register

**Session:** `20260724T065700Z-pre-mainnet-human-uiux`  
**Phase:** ①/② 真人手测（主网真网前）· ≠ Production GO · ≠ Mainnet Cutover  
**Round-1:** HU-001～010 **FIXED**（2026-07-24 · Staging bake `2db694ae`）  
**Round-2 = 第二批（Batch-2）:** HU-011～017 · **CLOSING**（HU-014 PARTIAL · Resend 域名 Owner 残留）  
**Round-3 = 第三批（Batch-3）:** HU-018～021 **FIXED** · HU-014↻ **PARTIAL（Owner Resend 域名）**（2026-07-24 ~09:26 集体改）  
**Round-4 = 第四批（Batch-4）:** HU-022～025 **FIXED**（2026-07-24 · 集体改 · Staging bake `3d85df4f`）· HU-014↻ 仍 **PARTIAL（Owner Resend）**  
**Round-5 = PATCH-STG-008（2026-07-24）：** HU-014 **FIXED（② Staging 出站 + Auth L5）** · bake `3b06b54a` · Logo/BIMI **HTTP 200** · Cloudflare **DMARC+BIMI TXT 已生效** · Gmail 列表圆头像 **VMC 可选残留**  
**Round-6 = PATCH-STG-008↻（2026-07-24）：** 垃圾箱根因说明 + **TT 方标 SSOT**（`bimi-logo.svg`）对齐邮件 PNG/HTML · L5 正文升级 · 主题/投递头 · **≠** ③ GO  
**Round-7 = 投递收口（2026-07-24）：** **停** Staging 挂域 / **冻**邮件模板 · SPF/DKIM/DMARC **AUTH PASS** · Postmaster+Gmail Inbox = Owner · BIMI/VMC **DEFERRED · 不挡 Hard Gate** · SSOT [`TT-EMAIL-DELIVERABILITY-CLOSURE-LATEST.md`](./TT-EMAIL-DELIVERABILITY-CLOSURE-LATEST.md)  
**Round-8 = Owner 授权 L5 抛光（2026-07-24）：** `alt=TT` 修折行 · 金框头标 · 码 `&nbsp;` 字距 · Final Truth cite-only · 部署 API 后模板再冻  
**Round-8 Owner 签收（~13:05）：** 验证码邮件版式 **「感觉可以了」** · 产品 L5 抛光闭合；进垃圾箱仍属信誉闸（Postmaster / Inbox 3/3 · OPEN）  
**当前批次口径：** **第 6 批 Batch-6 集体改 FIXED**（HU-032/033/035/036 · HU-034 PARTIAL）  
**Final Truth Baseline cite（1～6 批十四锚）：** [`TT-PRE-MAINNET-HUMAN-UIUX-BATCHES-1-6-FINAL-TRUTH-BASELINE-CITE-LATEST.md`](./TT-PRE-MAINNET-HUMAN-UIUX-BATCHES-1-6-FINAL-TRUTH-BASELINE-CITE-LATEST.md) · PCR-20260724 · tip **cite-only** `ea71c577`  
**Tip cite:** `ea71c577` · Pin `PSG-REL-20260720-WEB3-CAND-V2`（cite-only · 本批不改 tip）  
**Staging deploy HEAD:** Batch-6 Web **已 bake**（PATCH-STG-010 · Git `1e1908a1` · post-deploy Unsplash **PAGE_SURFACE_DRIFT** = 既有旁证）· Round-8 API 仍在 · DNS 未改  
**Env:** https://tt-web-staging.fly.dev  
**Accounts SSOT:** `docs/runbook/TT-TEST-ACCOUNTS-QUICK-REFERENCE.md`（密码不写入本表）  
**Evidence twin:** `evidence/manual-uat/sessions/20260724T065700Z-pre-mainnet-human-uiux/DEFECT-REGISTER.md`  
**Rule（写死）：** Owner 口述 → 立刻追加；「结束 / 出清单」→ 清单+意见；**「开始第 N 批集体改」** → 按 Batch-2 同级标准改 → 本地 → Staging → Git → **Final Truth cite 对齐**（不新开平行真源）。

---

## 进度总览（2026-07-24）

| 批次 | 范围 | 状态 |
|------|------|------|
| **第 1 批** Round-1 | HU-001～010 | **FIXED** |
| **第 2 批** Batch-2 | HU-011～017 | **FIXED** |
| **第 3 批** Batch-3 | HU-018～021 | **FIXED** |
| **第 4 批** Batch-4 | HU-022～025 | **FIXED** |
| Round-5～8 | HU-014 邮件 | 版式已签收 · 信誉闸 OPEN |
| **第 5 批** Batch-5 | HU-026～031 | **FIXED**（HU-027 不修 · HU-028 待证） |
| **第 6 批** Batch-6 | HU-032～036 | **FIXED**（HU-034 **PARTIAL** · 见下） |

**流程位：** Batch-6 集体改已执行 · Owner 复测 Staging → 继续口述下一批。

---

## 第六批（Batch-6）· 集体改 FIXED（2026-07-24 · PATCH-STG-010）

| # | 主题 | 严重度 | 状态 | 摘要 |
|---|------|--------|------|------|
| **HU-032** | 已连接钱包下拉 · 网络不匹配文案/信息架构 | P1 | **FIXED** | `walletChainName` / `targetChainName`；错链文案「当前 X · 需要 Y」；判定仍 `wrongNetwork` |
| **HU-033** | 已连接钱包菜单整体 L5 抛光 | P2 | **FIXED** | 单条 warning 状态 + 主 CTA 切网；去重复「网络不匹配」；告警用 `text-warning` |
| **HU-034** | C3 向导测试号 · 上向导页供游客选导真人验 | P1 · Staging UAT | **PARTIAL** | Path A 开闸后 `GET /guides` 仍 **OCS 10**（无杭州/C3 行）→ 库内无 walkthrough 向导；**UAT 用 Path B**（OCS 选导 + C3 工作台）直至 Owner 种子 C3 |
| **HU-035** | 社区筛选 · 目的地双轨合二为一 | P1 · L5 | **FIXED** | 唯一地理入口 = `CommunityFeedDestinationPicker`；删展开区 `REGION_KEYS`/热门城重复行 |
| **HU-036** | `/me/identities` 经营身份申请入口缺失感 | P1 · L5 · IA | **FIXED** | 经营三卡常显（取消旅行者折叠藏入口）；资料要求+申请 CTA 首屏可达 |

**诚实边界：** Batch-6 FIXED（② Staging UI）≠ Production GO / Hard Gate。 Staging 目标链 = Sepolia（②）· **≠** ③ 主网。

### L5 / 生产级判定（修后 · 诚实）

| 维度 | 判定 | 说明 |
|------|------|------|
| **功能安全** | ✅ 生产向 | 错链拦写 + 切网 CTA 保留 |
| **文案/信息** | ✅ L5 | 「当前 · 需要」对照；未知链走 `wallet_network_unknown` |
| **视觉层级** | ✅ | 会话 hint · 地址金 · 告警 warning · 主 CTA 加重 |
| **② Staging 策略** | ✅ 预期 | 仍须 Sepolia；Bitget 主网 → 仍报不匹配（正确） |

**一句话：** 错链该报就报；**修的是文案冒充当前网**，不是取消 Sepolia 闸。

## HU-032 · 已连接钱包 ·「网络不匹配」为何出现 + 文案缺陷（**FIXED · Batch-6**）

**Owner 原话：** 登录钱包后截图；内容符合 L5 / 生产级吗；优化升级；**为什么显示网络不匹配？？？？**

### 为什么显示「网络不匹配」（真因 · 非假阳性）

| 项 | 值 |
|----|-----|
| Staging 站点目标链 | `NEXT_PUBLIC_CHAIN_ID=11155111` → **Sepolia**（② 测试网） |
| 判定代码 | `wrongNetwork = chainId !== expectedChainId`（`useWalletConnectionController`） |
| 你的 Bitget | 当前链 **不是** 11155111（常见：以太坊主网 / 其它网） |
| 结论 | **该报就报** — 否则链上写操作会打到错误网络（资金/签名风险） |

点「切换到 Sepolia」→ 调钱包 `switchChain` 到 11155111；切成功后橙点/告警应消失。

### 文案为何看起来「已经在 Sepolia 却不匹配」（Bug）

代码把菜单里的 `chainName` **写死为目标链名**：

```ts
chainName: targetChain.name, // 永远是 Sepolia，不是钱包当前网
```

于是错链时渲染成：「网络不匹配 · **Sepolia** · Bitget Wallet」——读起来像「当前就是 Sepolia」。  
按钮「切换到 Sepolia」语义对；**状态行语义错**。

### 已落地（Batch-6）

1. `getChainDisplayName` + controller 暴露 `walletChainName` / `targetChainName`  
2. 错链行：`wallet_network_current_need`（当前 {{current}} · 需要 {{target}}）+ `text-warning`  
3. 单条状态 + 主 CTA「切换到 {{target}}」；去重复告警行  
4. locale zh/en + `walletConnectionCenter.contract.test.ts`  

**诚实边界：** 修文案 ≠ 取消 Staging Sepolia 闸；≠ ③ 主网 GO。Bitget 壳皮肤仍 Expected Difference。

## HU-033 · 已连接钱包菜单 L5 抛光（**FIXED · Batch-6 · 与 HU-032 同批**）

**范围：** `WalletAccountMenu` 已连接态。  
**保留：** 「钱包会话 · 不等于网站账号登录」（HU-025 ✅）。  
**已升级：** 信息层级、切网主钮 `SWITCH_CTA`、explorer/复制/断开次级密度。

## HU-034 · C3 向导测试账号上向导页 · 游客选导真人验证（**PARTIAL · Batch-6**）

**Owner 原话（2026-07-24 ~13:36）：** 向导测试账号 **上一下** 向导页面，因为要跑 **游客下单选择向导** 真人验证流程 · **记上**。

| 项 | SSOT |
|----|------|
| 账号 | **C3** · `guide@test.com` · [`TT-TEST-ACCOUNTS-QUICK-REFERENCE`](./TT-TEST-ACCOUNTS-QUICK-REFERENCE.md) |
| 既有口径（HU-031-B） | [`display-data-governance.v1.yaml`](../../registry/display-data-governance.v1.yaml) · `must_appear_in_public_catalog: false` · 泄漏 = **DDG FAIL** |
| 本条意图 | **② Staging 真人 UAT**：游客路径能选导并完成对手方履约 |

### 与 HU-031 的关系（诚实 · 勿混）

| 轨 | 口径 |
|----|------|
| **公众运营 Catalog** | 仍仅 **OCS 10** · C3 **默认不上架**（HU-031 CONFIRM_DESIGN 不废） |
| **本条 · UAT** | Path A 尝试后仍无 C3 列表行 → **改走 Path B** |

### 路径处置（Batch-6 已执行）

| 方案 | 状态 | 说明 |
|------|------|------|
| **A. Staging 临时开闸** | **尝试 · 未达列表可见** | `TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET` 已在 `tt-api-staging` secrets；公开 `GET /guides` 仍 **count=10** · 无杭州 → **库内无 C3 walkthrough 向导行**（开闸≠自动造数据） |
| **B. 推荐 UAT（本批默认）** | **ACTIVE** | 游客在市场选 **任意 OCS 官导**；C3 登录 **向导工作台** 接单/履约 |
| **C. 深链** | 未做 | 需 guide id；列表仍干净 |

**Owner 若仍要市场点选 C3：** 须单独授权 Staging **种子/对齐 C3 向导行** + UAT 窗结束后 **`TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET=0`**。

**诚实边界：** PARTIAL ≠ 永久改 DDG · ≠ Production GO · ≠ 公众目录应含测试号。

## HU-035 · 社区 Feed 目的地筛选双轨 · 合二为一（**FIXED · Batch-6**）

**Owner 原话（2026-07-24 ~13:37 · 两张截图）：** 选「照片」后下面又弹出「全部 · 国家」；第二张是上面的「全部目的地」筛选；**这两个要合二为一，不能单独出现**；要修复 · 重新设计 · 优化。

### 为何会出现（根因 · 非「照片」魔法）

| 层 | 控件 | 代码 |
|----|------|------|
| **轨 A** | 顶栏「全部目的地」/ 城市下拉 → `CommunityFeedDestinationPicker`（十国·城 Sheet · HU-024） | `CommunityFeedDiscoveryChrome` |
| **轨 B** | 展开筛选区横向 chip：`全部/中国/日本/…`（`REGION_KEYS`）+ 热门城 | 同文件 · `filtersExpanded` 块内 `REGION_KEYS.map` |
| **类型行** | 最新/最热 · 全部/照片/视频/… | 与地理 **正交**；选「照片」只改 `typeFilter` |

选「照片」时若筛选已 **展开**（截图有「收起」），会同时看见类型行 + **轨 B 国家行**，易误认为「点照片才弹出国家」。真因是 **展开态下轨 B 一直挂着**，与轨 A **功能重叠**。

### L5 / 生产级判定

| 项 | 判定 |
|----|------|
| 双轨并存（Sheet + 横向国 chip） | ❌ 未达 L5 · IA 冗余 |
| 热门城重复（顶行 chip + 展开区） | ⚠️ 重复触点 |
| 「英国」下列纽约/洛杉矶/旧金山（截图 2） | ❌ 数据错标 · 集体改同批核对 `DESTINATION_*` / PRODUCT_COUNTRIES |

### 已落地（Batch-6 · 重设计）

1. **唯一地理入口：** `CommunityFeedDestinationPicker`（顶行可保留 ≤3 热门城快捷）  
2. 展开区 **删除** `REGION_KEYS` 横向国行 + 重复热门城行（DiscoveryChrome / FilterBar / ChipFilters）  
3. 类型/排序与地理解耦：选「照片」不再带出第二套国家 UI  
4. 绿集：`communityFeedConstants` + 相关契约  

**诚实边界：** ≠ Production GO。社区壳 L5 冻结下本条属 **缺陷/IA 收口**。

## HU-036 · `/me/identities` 多重身份 · 经营三卡申请入口与标准（**FIXED · Batch-6**）

**Owner 原话（2026-07-24 ~13:42）：** 多重身份申请页感觉很乱；真源上除旅行者外还可申请 **向导、商家、区域主理人**；本页应有这几个身份的 **申请入口 + 提交资料相关要求** · **记上**。

### 真源期望（对）

| 身份 | Hub 预期 |
|------|----------|
| 旅行者 | 基础能力 · 注册即有（非「申请」） |
| 旅行收购 | 附加能力 · 工作台/资料（PD-009） |
| **向导 / 商家 / 区域主理人** | **经营身份** · 可见卡片 · 申请/工作台 CTA · 资料与准入要求可读 |

SSOT：[`ME-IDENTITIES-UI-FREEZE`](../../frontend/evidence/GO_local_auth_l5/ME-IDENTITIES-UI-FREEZE.md) · Hub 经营区应有商家/主理人/向导 `MeIdentitiesL5IdentityCard`；申请链 `/guide/register` · `/provider/register` · `/steward/register`（及 onboarding）。

### 现页为何「乱 / 像没有入口」

| 现象 | 根因 |
|------|------|
| 标题/副文说「请选择下方经营身份卡片」 | 有文案 |
| 「经营身份」下只见灰字「展开向导 / 商家 / 区域主理人申请」 | 纯旅行者默认 **`<details>` 折叠**（`meIdentitiesHubOperatorSectionDefaultOpen` → 三槽皆 `inactive` 则 **false**） |
| 页脚仍写「请点上方商家/主理人卡片」 | 卡片未展开时 **指空** · IA 自相矛盾 |
| 三卡与资料要求 | **折叠内存在** · 首屏不可见 → Owner 感知为缺失 |

**判定：** 功能未删光，但 **首屏 IA 未达 L5/生产发现性**；申请入口与「提交资料要求」应对申请者 **默认可见**（或等价一屏可达），不能只靠一行「展开」。

### 已落地（Batch-6）

1. 取消旅行者-only `<details>` 折叠；经营三卡 **常显 grid**  
2. `meIdentitiesHubOperatorSectionDefaultOpen` → 恒 `true`；冻结文 + IA/page 契约同步  
3. 每卡：身份名 · desc（资料/标准）· 申请/工作台 CTA；页脚与卡片同指  
4. 绿集：`meIdentitiesIaClosure` + `meIdentitiesPage` PASS  

**诚实边界：** ≠ Production GO · ≠ 主网准入已通 · ≠ 收购第五 `users.role`。

---

## 第五批（Batch-5）· 实施状态（生产级 · L5 · 2026-07-24）

| # | 主题 | 严重度 | 状态 | 落地摘要 |
|---|------|--------|------|----------|
| **HU-026** | 登录页治理币 SSOT 修补进度 | P1 | **FIXED** | `/auth/login` 移除工程看板；Freeze 契约禁回挂 |
| **HU-027** | Console 扩展噪声 | — | **CLOSED · 不修** | 浏览器扩展 · 非本品 |
| **HU-028** | Console `GET …/orders/…` | P2 | **OPEN · 待证** | 待 Owner 补 HTTP 状态；未并入必改 |
| **HU-029** | Bitget 头像「N」 | P1 | **FIXED** | wagmi 元数据 `icons`/`iconUrl`/`appLogoUrl` → TT `bimi-logo.png`；`appName=TravelTrust`；Bitget 壳 = Expected Difference |
| **HU-030** | 标签栏 favicon「N」 | P1 | **FIXED** | `favicon.svg` = TT 方标（与 BIMI 同源）；`layout` icons 含 PNG |
| **HU-031** | 向导 9≠10 · C3 未见 | P1 | **FIXED（拆层）** | A：Staging API/Web `GET /guides` = **10** OCS **已验**；B：C3 **CONFIRM_DESIGN** 不上公众目录 |

**诚实边界：** Batch-5 ≠ Production GO / Hard Gate / Cutover。OCS 10 城含 JP×2、无 CN — **国家覆盖≠卡片数**；若要中国杭州官导向导另开产品票。

---

## 第四批（Batch-4）· 实施状态（生产级 · L5 · 2026-07-24）

| # | 主题 | 严重度 | 状态 | 落地摘要 |
|---|------|--------|------|----------|
| **HU-022** | 兑换网关单主钮「兑换」 | P1 | **FIXED** | 底栏仅一主 CTA「兑换」；未连钱包 → 弹窗「请连接钱包」→ 顶栏同源；治理/托管降为文字链；短文案无挤行 |
| **HU-023** | 信任「可核对的事实」 | P1 | **FIXED** | Escrow 点名 USDC；去「第一阶段」工程词 → 开放十国网络；合规卡保留 |
| **HU-024** | 社区十国目的地面板 | P1 | **FIXED** | `productCountries` 十国；无印尼；每国≤4 城；紧凑行布局无竖滚 |
| **HU-025** | 顶栏钱包已连接态 | P1 | **FIXED** | 芯片短址+状态点；账户菜单「钱包会话 ≠ 网站登录」；禁「已登录」冒充 |
| **HU-014↻** | 注册验证码真发信 | **P0** | **FIXED · Round-5** | 见 Round-5 / HU-014 节（Resend 域 + L5 邮件 + DMARC/BIMI） |

**诚实边界：** Batch-4 ≠ Production GO / Hard Gate / Cutover。

---

## 第三批（Batch-3）· 实施状态（生产级 · L5 · 2026-07-24）

| # | 主题 | 严重度 | 状态 | 落地摘要 |
|---|------|--------|------|----------|
| **HU-018** | Hero「开始规划行程」→ 定制旅行 | P1 | **FIXED** | 默认 `/`；`build…WithRegion` 外链带 `?region=`；traveler/page-brief 同源 |
| **HU-019** | 角色剧场弹窗 L5 | P1 | **FIXED** | 舞台 ~90vw/`max-w-6xl`；hint `sr-only`；轻顶栏；Space/点画面播停；focus trap；chrome idle 淡出 |
| **HU-020** | 社区目的地筛选 App IA | P1 | **FIXED** | 仅城市分组 Sheet；去国城混排；热门 chip≤3 |
| **HU-021** | Console Geo + 未登录 401 | P1 | **FIXED** | `geolocation=(self)`；默认锚 `city_current`；预取 `hasClientAuthSession` 闸；扩展噪声不修 |
| **HU-014↻** | 注册验证码真发信 | **P0** | **FIXED · Round-5 收口** | 历史：test-mode 403；现：`web3-ttg.com` 已验证 + `TRAVELTRUST_RESEND_FROM` + bake `3b06b54a`（见 HU-014 节） |

**诚实边界：** Batch-3 ≠ Production GO / Hard Gate / Cutover。

---

## 第二批（Batch-2）· 修复标准与真源对齐（Owner 2026-07-24 ~08:39）

### 验收条（写死）

| 条 | 标准 |
|----|------|
| **生产级** | 可上 Staging 真用户路径验收：无假成功、无脏数据占位、无调试残留、权限/出站失败 fail-closed |
| **UI/UX = L5** | 对齐 Product/Release Baseline 视觉与交互（社区壳 · AuthL5 · 五主冻结边界）；禁止默认蓝白/占位壳冒充 L5 |
| **修后闭环** | ① 更新本 Register + 相关 runbook/locale/CMS 真源句 ② **本地**绿集/烟测 ③ **Staging** 复验截图 ④ **Git** commit（Owner 授权时）⑤ **Final Truth Baseline cite-only 对齐**（见下表）— **禁止**用本批冒充 Production GO / Hard Gate PASS / Cutover |

### TravelTrust Final Truth Baseline（唯一真源标准 · cite-only）

本批产品/UI 变更落在 **Product / Release Baseline** 与 **Engineering SSOT**；Web3/治理锚**只引用、不重写宪章**。Hard Gate / Cutover **不因本批 UI 缺陷关闭而自动 PASS**。

| # | 锚点 | 本批关系 |
|---|------|----------|
| 1 | **Final Truth Baseline**（唯一真源标准） | 本 Register + tip/pin cite；修后不漂移平行叙事 |
| 2 | **Candidate v2** · 最新 Web3 协议基线 | cite pin `PSG-REL-20260720-WEB3-CAND-V2` · tip `ea71c577` |
| 3 | **V3.1.1 Final** · 中文 Web3 宪章与规则 | 本批不改正文；公告/规范文案不得与之冲突 |
| 4 | **PSG-EGM Final** · 经济治理框架 | 本批无资金规则变更 |
| 5 | **PSG Governance Anchor** | 治理层唯一锚 · 本批不另起治理真源 |
| 6 | **Product / Release Baseline** | **本批主战场**：用户产品 · UI/UX · 业务流程 |
| 7 | **Engineering SSOT Anchor** | 代码 · Git · Build · Runtime · Registry · Evidence 同源 |
| 8 | **Release Integrity** | Delta → Recertify → Freeze 纪律；禁止平行版本 |
| 9 | **PSG Delta Recertify（dry-run）** | 集体改合入后对 Batch-2 Delta 做 dry-run 对拍 |
| 10 | **Feature Inventory Baseline** | 注册 OTP / 社区定位 / Ambient 等能力与真实能力一致 |
| 11 | **Reality Closure Framework** | Staging 真运行与 Baseline 对拍（含邮件投递） |
| 12 | **PRR** | 本批不替代 PRR 签字 |
| 13 | **Mainnet Hard Gate** | 本批 **≠** Hard Gate 关闭 |
| 14 | **Mainnet Cutover Hard Gate** | 本批 **≠** 资金切闸 PASS |

### 第二批清单（实施状态）

| # | 主题 | 严重度 | 状态 | 落地摘要 |
|---|------|--------|------|----------|
| **HU-011** | 角色剧场封面进播放框 | P1 | **FIXED** | `TravelTrustRoleVideoPlayer`：有 `posterSrc` 即铺满框；播中/剧场隐藏封面 |
| **HU-012** | `/` 默认 Ambient L5 海报 | P1 | **FIXED** | 新图 `frontend/public/media/landing/brand-ambient-default.jpg`（十国分层宣传海报） |
| **HU-013** | Ambient 闪/双跳 | P1 | **FIXED** | decode-before-commit + 优先稳定 TS URL |
| **HU-014** | 注册验证码未达邮箱 | **P0** | **FIXED · Round-5（②）** | Resend 域 `web3-ttg.com` + FROM `noreply@web3-ttg.com` + Auth L5 bake `3b06b54a`；见 HU-014 节 |
| **HU-015** | 社区「当前定位」 | P1 | **FIXED** | 下拉仅 GPS + 当前城市；默认 GPS；剔丽枫酒店 |
| **HU-016** | 社区规范 UI | P1 | **FIXED** | CTA 改 sun L5；内容仍诚实草稿（≠法务定稿） |
| **HU-017** | CMS 运营号仿用户 | P1 | **FIXED（代码+素材）** | dataset 真人昵称 + `/media/ocs/ops-avatars/*`；`sync-ocs-ops-personas-hu017.cjs` 写 Staging users |

**Owner 残留（可选）：** Gmail 列表圆头像 **VMC**（无 VMC 时正文品牌标仍可见；列表可能仍灰人像）。③ 生产 API 须同配 Resend FROM（另闸）。

---

## 缺陷表

| # | 时间 | 账号 | 路径/页面 | 问题描述（原话） | 类型 | 严重度 | 修改意见 | 状态 |
|---|------|------|-----------|------------------|------|--------|----------|------|
| HU-001 | 2026-07-24 ~07:00 | 未登录 | `/traveltrust` Hero（Owner 称「首页」截图） | Hero 卡内「连接钱包」多余：顶栏已有连接钱包，这里应删除 | UX · UI | P1 | 按已冻 Delta：移除 Hero wallet CTA；顶栏 `#tt-header-wallet` 唯一入口；contract/e2e 已翻 | **FIXED · Round-1** |
| HU-002 | 2026-07-24 ~07:00 | — | 真源 vs Staging | Owner 怀疑 Staging 不是真源最新；要求核对昨日性能优化是否更新真源 | 部署/真源 | P1（信息） | Staging Round-1=`2db694ae` ED vs tip `ea71c577`；性能+UI 补丁已上 Staging | **FIXED · 信息闭合** |
| HU-003 | 2026-07-24 ~07:07 | 未登录 | `/traveltrust` 角色剧场 | 视频不是最新；需永久储存 + 封面 | 媒资 · UX | P1 | drop zone 摄入 → LFS + Registry/Manifest + JPG posters；`region_steward` 仍占位 | **FIXED · Round-1**（主理人待补） |
| HU-004 | 2026-07-24 ~07:08 | 未登录 | 公告 / Pulse | 对齐 Final Truth Baseline | 内容 · CMS | P1 | migration 归档旧 Phase/7-15 文案 + 新增 Final Truth/Hard Gate 条；locale pulse 键 | **FIXED · Round-1** |
| HU-005 | 2026-07-24 ~07:11 | 未登录 | `/` Ambient | 默认不该长城；品牌图 + 切换慢 | UX · 性能 | P1 | `AMBIENT_BG_HOME`→品牌 JPG；十国 idle prefetch + crossfade | **FIXED · Round-1** |
| HU-006 | 2026-07-24 ~07:13 | 未登录 | `/` AI 生成 | 登录提示改弹窗 | UX · UI | P1 | `AuthRequiredModal` 替代内嵌条 | **FIXED · Round-1** |
| HU-007 | 2026-07-24 ~07:16 | 未登录/登录 | `/market` 创建行程 | 自定义制作 · L5 确认 · 未登录弹窗 | UX | P1 | 文案+DiscardConfirmModal+auth gate | **FIXED · Round-1** |
| HU-008 | 2026-07-24 ~07:19 | 未登录 | `/community` 筛选 | 中国错绑外城 · 全部混排重复 | 功能 | P1 | 停 dump unmapped→cn；热门仅已知城市；国家别名入 map | **FIXED · Round-1** |
| HU-009 | 2026-07-24 ~07:20 | 未登录 | 收购详情抽屉 | 左侧文字不可见 | UI | P1 | `subsiteTagPill` 强制可读色 | **FIXED · Round-1** |
| HU-010 | 2026-07-24 ~07:22 | 未登录 | `/market/acquisition` | 就绪度是否应在浏览页；筛选对比度 | UX · IA | P1 | 就绪度默认折叠；`filterBandLabel` 提对比 | **FIXED · Round-1** |

### Round-2 = 第二批 Batch-2

| # | 时间 | 账号 | 路径/页面 | 问题描述（原话） | 类型 | 严重度 | 修改意见 | 状态 |
|---|------|------|-----------|------------------|------|--------|----------|------|
| HU-011 | 2026-07-24 ~08:25 | 未登录（Staging） | `/traveltrust` · 角色剧场播放框 | 封面须在播放框内；点击后播视频不再显示封面 | UX · 媒资 | P1 | poster 层绑框；play/cinema 隐藏 | **FIXED · Batch-2** |
| HU-012 | 2026-07-24 ~08:28 | 未登录（Staging） | `/` 默认 Ambient | 默认背景须 L5 十国宣传海报 | UX · 品牌 | P1 | AI 出图入库 `brand-ambient-default.jpg` | **FIXED · Batch-2** |
| HU-013 | 2026-07-24 ~08:30 | 未登录（Staging） | `/` 选国家 Ambient | 切换闪一下 / 像刷两次 | UX · 性能 | P1 | decode-before-commit；抑 catalog 双跳 | **FIXED · Batch-2** |
| HU-014 | 2026-07-24 ~08:33 | 未登录（Staging） | `/auth/register` 验证码 | 倒计时但邮箱未收到 | 出站邮件 | **P0** | Resend 域 + FROM + L5 bake | **FIXED · Round-5** |
| HU-014↻ | 2026-07-24 ~09:21 | 未登录（Staging） | `/auth/register` ·「发送验证码」 | Console：**503**；未收到码 | 出站邮件 | **P0** | fail-closed 正确；根因 test-mode → 域验证后闭合 | **FIXED · Round-5** |
| HU-014↻ | 2026-07-24 ~12:09 | 未登录（Staging） | `/auth/register` 发码 | Console：**409**；`chext_driver` unload | 出站/UX | **P0→信息** | **409=`email_already_registered`**（非投递失败）；扩展噪声忽略；换未注册邮箱或登录 | **CLOSED · 预期冲突** |
| HU-015 | 2026-07-24 ~08:35 | 未登录（Staging） | `/community` 当前定位 | 非生产级下拉 | UX · L5 | P1 | 仅 GPS + 当前城市 | **FIXED · Batch-2** |
| HU-016 | 2026-07-24 ~08:36 | 未登录（Staging） | `/terms/community-guidelines` | UI 不符；真源对齐？ | UX · 内容 | P1 | sun L5 CTA；内容仍草稿诚实 | **FIXED · Batch-2** |
| HU-017 | 2026-07-24 ~08:37 | 未登录（Staging） | `/community` 推荐关注 | 运营号无头像、名不真实 | CMS · UX | P1 | 人格包 + sync 脚本 | **FIXED · Batch-2**（Staging 须跑 sync） |

### Round-3 = 第三批 Batch-3（集体改 · 生产级 · L5）

| # | 时间 | 账号 | 路径/页面 | 问题描述（原话） | 类型 | 严重度 | 修改意见 | 状态 |
|---|------|------|-----------|------------------|------|--------|----------|------|
| HU-018 | 2026-07-24 ~09:13 | 未登录（Staging） | `/traveltrust` Hero ·「开始规划行程」 | 应跳转**定制旅行**页 | UX · 导航 | P1 | 默认 `/` + region query | **FIXED · Batch-3** |
| HU-019 | 2026-07-24 ~09:15 | 未登录（Staging） | 角色剧场点播弹窗 | L5/生产级？hint？尺寸？ | UX · L5 | P1 | 沉浸舞台 · 去说明书 · 交互补齐 | **FIXED · Batch-3** |
| HU-020 | 2026-07-24 ~09:18 | 未登录（Staging） | `/community` 全部目的地 | 国城混排太乱 · App 标准整体优化 | UX · IA · L5 | P1 | 城市分组 Sheet | **FIXED · Batch-3** |
| HU-021 | 2026-07-24 ~09:20 | 未登录（Staging） | Console | Geo policy · me/* 401 · 扩展噪声 | 运行时 | P1 | Geo+auth 闸；扩展忽略 | **FIXED · Batch-3** |
| HU-014↻ | 2026-07-24 ~09:21 | 未登录（Staging） | `/auth/register` 发码 | 503 · 未收码 · 要生产级 | 出站邮件 | **P0** | 域验证 + FROM + Round-5 bake | **FIXED · Round-5** |

### Round-4 = 第四批 Batch-4（FIXED · 2026-07-24）

| # | 时间 | 账号 | 路径/页面 | 问题描述（原话） | 类型 | 严重度 | 修改意见 | 状态 |
|---|------|------|-----------|------------------|------|--------|----------|------|
| HU-022 | 2026-07-24 ~09:50 | 未登录（Staging） | `/traveltrust` · 兑换网关 | ① 内容须对齐最新真源 ② Escrow 换行挤行 ③ 只留「兑换」 ④ 未连钱包弹「请连接钱包」 | UX · 内容 · L5 | P1 | 单主 CTA + wallet prompt modal + 次级文字链；locale 生产口径 | **FIXED** |
| HU-023 | 2026-07-24 ~09:50 | 未登录（Staging） | `/traveltrust` · 信任事实 | 对齐最新真源 · 商业标准 | 内容 · 商业 · L5 | P1 | USDC Escrow 点名；去「第一阶段」；合规保留 | **FIXED** |
| HU-024 | 2026-07-24 ~09:52 | 未登录（Staging） | `/community` · 全部目的地 | 十国无印尼 · 简约无滚动条 | UX · IA · 数据 | P1 | `productCountries` + 紧凑行；无 `id` | **FIXED** |
| HU-025 | 2026-07-24 ~09:55 | 连钱包后（Staging） | 顶栏钱包 | 已连接应显示什么 · L5 | UX · L5 · 钱包 | P1 | 短址芯片 + 账户菜单；明确 ≠ 网站登录 | **FIXED** |

### Round-6 = 第六批 Batch-6（集体改 FIXED · 2026-07-24 · PATCH-STG-010）

| # | 时间 | 账号 | 路径/页面 | 问题描述（原话） | 类型 | 严重度 | 修改意见 | 状态 |
|---|------|------|-----------|------------------|------|--------|----------|------|
| HU-032 | 2026-07-24 ~13:34 | Staging · Bitget 已连 | 顶栏钱包账户菜单 | 截图内容是否 L5/生产级；**为什么网络不匹配**；要优化升级 | UX · 钱包 · 文案 | **P1** | 当前/目标链对照文案 | **FIXED** |
| HU-033 | 2026-07-24 ~13:34 | 同上 | 同上菜单整体 | （同截图）L5 抛光 | UX · L5 | **P2** | 单告警 + 主 CTA | **FIXED** |
| HU-034 | 2026-07-24 ~13:36 | Staging UAT | `/market` 向导 · C3 | 向导测试账号 **上一下** 向导页 · 跑游客下单选导向真人验证 · **记上** | UAT · 数据 · DDG | **P1** | Path B：OCS 选导 + C3 工作台（开闸后仍无 C3 行） | **PARTIAL** |
| HU-035 | 2026-07-24 ~13:37 | Staging · `/community` | 筛选栏 · 照片 + 全部目的地 | 选照片后弹出全部/国家；与上面全部目的地 **合二为一** · 不能单独出现 · 修复重设计 | UX · IA · L5 | **P1** | 唯一 DestinationPicker | **FIXED** |
| HU-036 | 2026-07-24 ~13:42 | Staging · `/me/identities` | 多重身份 Hub | 页很乱；除旅行者外应有向导/商家/主理人申请入口+资料要求 · **记上** | UX · IA · L5 | **P1** | 经营三卡常显 | **FIXED** |

### Round-5 = 第五批 Batch-5（集体改 FIXED · 2026-07-24）

| # | 时间 | 账号 | 路径/页面 | 问题描述（原话） | 类型 | 严重度 | 修改意见 | 状态 |
|---|------|------|-----------|------------------|------|--------|----------|------|
| HU-026 | 2026-07-24 ~13:07 | `plantartist778@…`（Staging 登录页） | `/auth/login` | 下面「治理币 SSOT 修补进度（① 本地）」整块（8/12·67% 清单 + params 链）**不应该出现就清除** | UX · IA · L5 | **P1** | 从登录页移除 `AuthLoginGovernanceRemediationProgress`；进度属工程/治理轨，不应挂在账号入口；治理公示保留在 `/governance/params` | **FIXED** |
| HU-027 | 2026-07-24 ~13:08 | Staging（登录相关） | Console | `chext_driver` unload · Immersive Translate `token invalid` · `content_main.js` `toLowerCase` | 运行时 · 扩展 | — | **浏览器扩展噪声 · 不修**（HU-021 同口径） | **CLOSED · 不修** |
| HU-028 | 2026-07-24 ~13:08 | Staging | Console · `GET /api/v1/orders/df27a3fc-a149-4a2f-8bc…` | 这些有没有问题 · 需要修复？ | 运行时 · API | **P2 待证** | 见 HU-028 节：先补 HTTP 状态与完整 UUID；Console 常截断 URL | **OPEN · 待证** |
| HU-029 | 2026-07-24 ~13:10 | Staging · Bitget 连接 | Bitget 授权弹窗 | 连接钱包 UI 不符整体设计；头像「N」不对；要以 **TT 方标**（第三图 / `bimi-logo`）为准 · 需修改优化 | UX · 品牌 · 钱包 | **P1** | 见 HU-029：补齐 dApp `metadata.icons` + 名称 TravelTrust；Bitget 壳按钮区部分不可改 | **FIXED** |
| HU-030 | 2026-07-24 ~13:11 | Staging（任意页 · 标签栏） | 浏览器标签 favicon | 网址头像也是 **N**，不是已定 TT 方标 · 要更新 | UX · 品牌 · favicon | **P1** | 见 HU-030：替换 `frontend/public/favicon.svg`；与 HU-029 同批 | **FIXED** |
| HU-031 | 2026-07-24 ~13:13 | Staging · 选向导 | `/market` 认证向导列表 | CMS 应有 **10** 个向导却只显示 **9**；测试账号向导（C3）为何不显示；是不是 CMS 写死 10？要解决 | 数据 · 展示 · OCS/DDG | **P1** | 见 HU-031：10=OCS 目标；C3 **禁止**上公众目录 | **FIXED（拆层）** |

## HU-031 · 市场向导 9≠10 · 测试向导 C3 未见（**FIXED · Batch-5 · 拆层**）

**Owner 原话：** 选向导时 CMS 应有 10 个却只显示 9；测试账号向导为何不在这里；是不是 CMS 写死了 10？怎么解决。

### 这不是「前端写死只渲染 9」

| 层 | 真源 | 含义 |
|----|------|------|
| **OCS 目标数** | `registry/official-cold-start-dataset.v1.yaml` · `official_guides` **count: 10** · `expected_guides: 10` | 公众运营展示应 **10** 名官方向导 |
| **市场列表** | FE `getGuides` ← Staging API/DB 已发布向导 | 显示几个 = 库里 **published 公众可见** 有几个 |
| **测试向导 C3** | `guide@test.com` · Registry **C3** · [`display-data-governance.v1.yaml`](../../registry/display-data-governance.v1.yaml) | **`must_appear_in_public_catalog: false`** · 泄漏 = **TEST_DATA_LEAKAGE / DDG FAIL** · `TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET=0` |

### 拆条处置（集体改 · 落地）

| 子项 | 判定 | 动作 |
|------|------|------|
| **A. 只显示 9 个** | **VERIFIED · 无需再对齐** | 2026-07-24 复验 Staging `GET /api/v1/guides?limit=50`（API + Web 代理）= **10**（迪拜…东京/京都）；空筛选下市场应显示 **10**。若仍见 9：清市场筛选/硬刷；**勿**把「9 个国家码（JP×2 · 无 CN）」当成缺卡 |
| **B. C3 测试向导不在列表** | **CONFIRM_DESIGN**（Expected Difference） | **禁止**为「看见测试号」把 C3 推上公众目录；联调用 C3 登录工作台/接单，不走公开市场卡 |
| **C. 「CMS 写死 10」** | **否** | 10 是 OCS **目标库存**，不是 FE `slice(0,10)` 写死 |

**修改意见一句（已闭）：** 公众目录保持 **10 OCS**；C3 继续隐藏；中国杭州官导若要进 10×1 国覆盖 = **另开产品票**（会改 OCS pin，非本批 bugfix）。

**诚实边界：** ①/② 展示对齐 ≠ Hard Gate；≠ 用测试账号冒充运营向导。

## HU-030 · 浏览器标签 favicon 蓝底「N」→ TT 方标（**FIXED · Batch-5**）

**现象：** 标签栏 favicon = 蓝底白「N」（Owner 截图「自由市场 | T…」旁）；非已定 **暗底金框 TT**。

**落地：**

1. `frontend/public/favicon.svg` = 与 `brand/bimi-logo.svg` 同构图（暗底金框 TT）  
2. `app/layout.tsx` `icons`: SVG + `/brand/bimi-logo.png`（apple 同 PNG）  
3. 部署 Staging Web 后 **强刷/清缓存** 复验标签栏  

**诚实边界：** 改 favicon ≠ 改 Bitget 扩展壳皮肤；≠ Hard Gate。

## HU-029 · Bitget 连接弹窗 · 头像「N」→ TT 方标（**FIXED · Batch-5**）

**场景：** `/market` → 连接钱包 → Bitget 授权窗蓝圆「N」；真源 = **暗底金框 TT**。

**落地：**

| 层 | 处置 |
|----|------|
| **本品 Sheet** | 维持 Auth/Trust L5 `TravelTrustWalletSheet` |
| **Bitget 扩展 chrome** | **Expected Difference**（不可改壳） |
| **dApp 元数据** | `createTravelTrustWagmiConnectors`：`icons`/`iconUrl`/`appLogoUrl` → `${appUrl}/brand/bimi-logo.png`；`appName=TravelTrust`；`readTravelTrustAppUrlFromEnv` ← `NEXT_PUBLIC_SITE_URL` |

**Owner 复验：** 清 Bitget 站点缓存后重连；若元数据已对仍「N」→ 记钱包缓存残留（非再改本品）。

**诚实边界：** 修元数据 ≠ 把 Bitget 弹窗皮肤改成 TravelTrust L5 整页；≠ Hard Gate / Production GO。

## HU-028 · Console `GET /api/v1/orders/…`（**OPEN · 待证 · Batch-5**）

**现象：** DevTools 出现 `GET https://tt-web-staging.fly.dev/api/v1/orders/df27a3fc-a149-4a2f-8bc…`（日志常被截断）。

**要不要修（诚实）：**

| 若 Network 里… | 结论 |
|----------------|------|
| 完整 UUID + **200** / 预期 **401**（未登录）/ 预期 **404**（无单） | **不修** · 正常业务请求 |
| 真短 ID（非完整 UUID）或 **5xx** | **要修** · 记清页面路径后集体改 |
| 仅 Console 红字但 Network 成功 | **不修** · 展示截断 |

**Owner 请补一句：** 该请求的 **HTTP 状态码** + 当时所在 **路径**（如 `/escrow/…` / `/` 预览）。未补前保持 OPEN·待证，**不**并入必改清单。

## HU-027 · Console 扩展噪声（**CLOSED · 不修 · Batch-5**）

| 日志 | 来源 | 要修？ |
|------|------|--------|
| `chext_driver.js` · unload Permissions policy | 浏览器扩展 | **否** |
| `content_main.js` · Immersive Translate `token invalid` | **沉浸式翻译**扩展 | **否** |
| `content_main.js` · `toLowerCase` of undefined | 同上扩展 | **否** |

**结论：** 与 HU-021 同口径 · **不进集体改** · 无痕模式/关扩展可验证本品 Console。

## HU-026 · 登录页「治理币 SSOT 修补进度」整块清除（**FIXED · Batch-5**）

**这是什么（说明 · 非保留理由）：** 内部/企业级 **TTG 治理币 SSOT 修补跟踪看板**（文档+UI 完成度 8/12），曾挂在登录页底部做工程可见性。属 **Engineering 审阅进度 UI**，不是用户登录产品能力。

**Owner 原话：** 不应该出现就清除。

**落地：**

1. `frontend/app/auth/login/page.tsx` 已去掉 `<AuthLoginGovernanceRemediationProgress />`  
2. `authLoginUiFreeze.contract.test.ts`：**禁止**登录页再挂该组件  
3. 组件文件可保留作工程参考，但 **登录/注册零渲染**  
4. 治理公示仍在 `/governance/params`  

**诚实边界：** 清除登录页 ≠ Tokenomics/GOV 文档废止；≠ Hard Gate / Production GO。

## HU-025 · 顶栏钱包已连接态 · L5（2026-07-24 · **FIXED · Batch-4**）

**落地：** `WalletStatusMini` 芯片 = 状态点 + `whitespace-nowrap` 短址；`WalletAccountMenu` 首行 `wallet_account_session_hint`（钱包会话 ≠ 网站登录）；文案禁「已登录」冒充。

**诚实边界：** ①/② 顶栏 UX · ≠ 主网签名/资金 GO。

## HU-024 · 社区「全部目的地」· 十国简约面板（2026-07-24 · **FIXED · Batch-4**）

**落地：** `communityFeedConstants` ← `PRODUCT_COUNTRIES`；无 `id`/印尼；每国 ≤4 城；`CommunityFeedDestinationPicker` 紧凑国+城行、`overflow-visible`（无竖滚）。

**诚实边界：** ①/② UX · ≠ 全站 POI CMS 十国内容已齐。

## HU-023 · 信任「可核对的事实」（2026-07-24 · **FIXED · Batch-4**）

**落地：** `traveltrust_trust_fact_*` zh/en — USDC Escrow 点名；「开放十国目的地网络」替换「第一阶段十国」；合规/免责保留。

**诚实边界：** 文案对齐 ≠ Production GO / Hard Gate PASS。

## HU-022 · 兑换网关 CTA / 真源（2026-07-24 · **FIXED · Batch-4**）

**落地：** 单主钮「兑换」；未连接 → `data-tt-traveltrust-liquidity-wallet-prompt` 弹窗 → 顶栏 `#tt-header-wallet`；治理/托管次级文字链；短 `escrow_link`；去「v1 草案」口吻。

**诚实边界：** ①/② Staging UX · ≠ 主网真兑换 GO · ≠ Production GO。

## HU-014 · 注册邮箱验证码 · 生产级闭环（**FIXED · Round-5 / PATCH-STG-008 · ② Staging**）

**历史复现（已闭）：** ~09:54 `yinhang744@gmail.com` → **503** + Resend test-mode 403（仅允许 `plantartist778@gmail.com`）。

**Round-5 闭合证据（2026-07-24）：**

| 证据 | 结果 |
|------|------|
| Resend 域 | `web3-ttg.com` **已验证** |
| Staging FROM | `TRAVELTRUST_RESEND_FROM='TravelTrust <noreply@web3-ttg.com>'`（`tt-api-staging`） |
| 新邮箱发码 | `POST …/send-verification-code` → **200** `verification_code_sent` + `email_sent:true` |
| 已注册邮箱 | 同址 → **409** `email_already_registered`（**预期** · 非投递失败；换未注册邮箱或登录） |
| Auth L5 正文 | Round-5 bake `3b06b54a`；**Round-6** 升级中英 · preheader · 去不可靠 `background-clip` · 域身份行 |
| 品牌标 / BIMI 资产 | **SSOT = `frontend/public/brand/bimi-logo.svg`（暗底金框 TT）**；邮件 PNG `traveltrust-email-mark.png` **同构图**；公网 URL **HTTP 200** |
| Cloudflare DNS | `_dmarc`=`v=DMARC1; p=quarantine;` · `default._bimi`=`v=BIMI1; l=https://tt-web-staging.fly.dev/brand/bimi-logo.svg;`（公网已解析） |
| Console `chext_driver` unload | **扩展噪声 · 忽略**（HU-021 同口径） |

### Round-6 · 为何进垃圾箱（② · 诚实诊断 · 非缺 SPF）

| 因子 | 说明 | 处置 |
|------|------|------|
| **新域信誉** | `web3-ttg.com` 出站量低 · Gmail 对 OTP 默认偏严 | Owner：在 Gmail 点 **「不是垃圾邮件」**；逐步正常发码暖域 |
| **OTP 内容** | 验证码类正文易触发内容过滤 | 主题改「TravelTrust · 注册验证码…」；纯文本+HTML 双轨；无假营销 CTA |
| **DMARC `p=quarantine`** | 正确生产策略；对齐失败时更易进垃圾箱 | 保持；Resend `send.` SPF + DKIM 已对齐时不应 soft-fail |
| **Apex 无 SPF TXT** | **预期差异**：Resend 用 `send.web3-ttg.com` SPF，**不是**缺配置 | **CONFIRM_DESIGN** · 禁止乱加冲突 SPF |
| 屏蔽图折行 TravelTr/ust | **FIXED Round-8** | `alt="TT"` + 56×56 金框 + 品牌 `nowrap`；部署后复测 |
| 列表圆头像灰「T」 | 多数客户端需 **BIMI + VMC** | VMC = 可选商业件 · **≠** 出站未闭 · **不挡 Hard Gate** |
| **工程侧 Round-6/8** | L5 正文 + Round-8 折行修复 | 信誉仍靠 Postmaster / Inbox 3/3 |

**禁止：** 把「进垃圾箱」写成「没配 SPF」；用 VMC 未购冒充 HU-014 未闭。

### Round-7 · 投递收口移交（ACTIVE · 停模板 / 停挂域）

| 项 | 状态 |
|----|------|
| Staging 自定义域名（为发信） | **STOPPED** · 非投递根因 |
| 邮件模板 / 主题 / 品牌标再改 | **FROZEN** |
| SPF · DKIM · DMARC | **AUTH PASS** · `bash scripts/dev/check-email-deliverability-dns.sh` |
| Google Postmaster Tools | **OWNER_ACTION** · `TT_POSTMASTER_VERIFIED: PENDING` |
| Gmail 收件箱 3/3 | **`TT_GMAIL_INBOX_GATE: OPEN`** |
| BIMI / VMC | **DEFERRED** · **不阻塞** Mainnet Hard Gate / Production GO |
| 活轨 SSOT | [`TT-EMAIL-DELIVERABILITY-CLOSURE-LATEST.md`](./TT-EMAIL-DELIVERABILITY-CLOSURE-LATEST.md) |

### 与「改密曾通」对拍（历史纠偏 · 保留）

| 现象 | 含义 |
|------|------|
| 改密/探针 Delivered → `plantartist778@…` | 早先证明 Resend Key 通，但 **test-mode** 限白名单 |
| 任意 Gmail 曾 503 | fail-closed 正确；闭合靠 **域验证 + FROM**，不是假成功 |

### Final Truth Baseline cite-only（本项落点）

| 锚点 | 本项关系 |
|------|----------|
| **Final Truth Baseline** | 本 Register 活轨对齐；**不**新开平行真源 |
| **Candidate v2** · pin `PSG-REL-20260720-WEB3-CAND-V2` | **cite-only** · 不改 tip / 协议基线 |
| **V3.1.1 Final / PSG-EGM / Governance Anchor** | **cite-only** · 本批无资金/治理规则变更 |
| **Product / Release Baseline** | **主战场**：注册 OTP · Auth L5 邮件体验 |
| **Engineering SSOT** | Round-5/`3b06b54a` + Round-6 TT 标/HTML；Resend secrets · `auth_email_templates` · brand 公网资产 |
| **Release Integrity / Delta Recertify** | Staging Patch **PATCH-STG-008↻**；晋升仍 DEFERRED |
| **Feature Inventory / Reality Closure** | ② 发码路径已证；垃圾箱 = 域暖 + 用户「非垃圾」动作；Logo 200 + DMARC/BIMI DNS 已证 |
| **PRR / Mainnet Hard Gate / Cutover** | **本项闭 ≠** Hard Gate / Cutover / Production GO；③ 生产 API 须同配 FROM（另闸） |

| 层 | 状态 | 说明 |
|----|------|------|
| **产品代码（①）** | ✅ | 投递失败 → **503 `email_delivery_failed`** + 回滚 OTP；已注册 → **409** |
| **出站投递（②）** | ✅ **FIXED** | 已验证域 + Staging FROM + 新邮箱 **200 Delivered 路径** |
| **Auth L5 邮件壳（②）** | ✅ Round-6 | TT 方标 SSOT + 中英 L5 壳（部署后生效） |
| **DNS BIMI/DMARC（②）** | ✅ | Cloudflare 记录公网可解析；Logo URL 200 |
| **Gmail 垃圾箱** | 暖域残留 | 见 Round-6 表；**Round-7** 移交 Postmaster + Inbox gate（非再改模板） |
| **Gmail 列表圆头像** | **DEFERRED** | BIMI/VMC 品牌轨 · **≠** Hard Gate 阻塞 · **≠** HU-014 出站未闭 |
| **③ 生产** | 未做 | 生产 API 同配 Resend FROM + 域；另闸 |

**禁止：** 为消 Console 503/409 改回假成功；用已注册邮箱 409 冒充「发信坏了」。

---

| # | 日志 | 来源判断 | 要修？ | 集体改动作 |
|---|------|----------|--------|------------|
| A | `chext_driver.js` · unload Permissions policy | **浏览器扩展** | **否** | 忽略 |
| B | `content_main.js` · `toLowerCase` of undefined | **浏览器扩展** | **否** | 忽略 |
| C | `Geolocation … permissions policy`（多次） | **本品真问题** | **是 · P1** | `next.config.js` 现 `geolocation=()`，但 HU-015 默认锚点 `gps` + `useCommunityFeedAnchorPoi` 仍调 `getCurrentPosition` → **策略自相矛盾**。改法二选一（或组合）：① Policy 改为 `geolocation=(self)`（社区「附近」产品需要）② 默认锚点改 `city_current`，仅用户显式选 GPS 且 `document.featurePolicy?.allowsFeature('geolocation')` 才请求 |
| D | `GET …/community/me/*` · `friends/list` → **401**（未登录） | **本品真问题** | **是 · P1** | 未登录不应打需鉴权接口。根因候选：`warmCommunityFriendsSocial` / 活动入口 `prefetchQuery(getMeLikesReceived)` **无 `isLoggedIn` 闸**。集体改：预取与 Query `enabled: isLoggedIn`；未登录 hover 只 `router.prefetch` JS，不打 API |
| E | 401 本身（已登录仍 401） | 若登录后仍现 | **是 · P0** | 另查 token/cookie；Owner 本条为未登录场景 → 先按 D |

**结论一句：** 扩展两条不修；**Geolocation + 未登录 401 要修**（生产级控制台应干净、附近能力应可用或诚实降级）。

## HU-020 · TT 社区 Feed 筛选 · 整体 IA / App 标准（2026-07-24 · 先记未改）

**截图：**「全部目的地」原生长列表 · 中国/厦门/丽江…日本/富士山…泰国…印尼×2/巴厘岛混排  
**相关：** HU-008（Round-1）修了区域错绑；**本条 = 信息架构 + 排版 + App 级选择器**，非再修错绑 alone。

### 为什么乱（代码真源）

| 点 | 现状 |
|----|------|
| 列表来源 | `PUBLISH_DESTINATION_OPTIONS = flat(DESTINATION_BY_REGION)` — **国别名 + 城市同级** |
| 重复感 | `印尼` + `印度尼西亚` 两 option、同一 i18n → 视觉双「印尼」 |
| 控件堆叠 | 当前定位 · 全部目的地 · 附近/1km · 好吃好玩 · 热门城 chip · 最新/最热/类型 chip — **双行原生 select + 多 pill，像后台筛选条** |
| 控件形态 | 桌面原生 `<select>` 白底长表 — **非手机 App 底部表单 / 分组 sheet** |

### 目标信息架构（对齐本项目 · 十国 / 城级 Feed · 手机 App）

参考小红书/Instagram「地点」：一层入口、分组展开、少并行控件。

```
行 1（地点 · 唯一主入口）
  [当前定位 ▾]  [目的地：全部 ▾] → 点开 = 底部 Sheet / 面板
    Sheet 内：
      · 全部
      · 按国分组（仅国作分区标题，不可点或点=该国全部城）
      · 其下仅城市（用 DESTINATION_CITY_BY_REGION；禁止国名进 option）
      · 热门快捷（新加坡/曼谷/京都/东京）放 Sheet 顶，不与外层再堆一排重复城名（外层最多留 0～3 热门，可滚）

行 2（内容 · 单一横滑）
  最新 | 最热 | 推荐 | 照片 | 视频 | 美食 | 旅游 | 文字
  （附近 / 附近1km / 好吃 / 好玩 并入类型或「更多筛选」抽屉，避免与地点抢注意力）
```

### 集体改验收条

1. 「全部目的地」**不再**国城混排；无印尼双行  
2. 选择器 = L5 自定义 sheet（非系统白底长 select）· 触摸目标 ≥44px  
3. 筛选条视觉密度降到 App 级：默认两行清晰，无「工具栏爆炸」  
4. 与发布目的地 / 热门打卡 / region filter **同源**（`DESTINATION_CITY_BY_REGION` + 国分组）  
5. COMMUNITY Phase① 冻结边界：只动筛选 IA/数据链 · 不回流社区壳 layout token  

**诚实边界：** ①/② Staging UX · ≠ Production GO。

## HU-019 · 角色剧场播放弹窗 · L5 / 生产级评审（2026-07-24 · 先记未改）

**页面：** `/traveltrust`（Owner 称首页）· `TravelTrustRoleVideoCinemaOverlay`  
**现状码：** `max-w-5xl` 浮层 · 左上角色名 + `traveltrust_role_video_cinema_dismiss_hint` · 暖色自研底栏 · Esc/遮罩/✕/播完关

| 问项 | 结论 | 说明 |
|------|------|------|
| **是否已达 L5 / 生产用户体验** | **未完全达标（骨架可用 · 观感偏「说明型模态」）** | 有 dialog、自研暖控、遮罩、无原生 controls — 工程闭环 OK；但对真实用户仍像带说明书的中号卡片，非影院级沉浸 |
| **左上「播完自动返回 · Esc / 点遮罩…」有必要吗** | **否 · 生产级应去掉** | 属开发/无障碍口头说明书；Netflix 级产品只留 ✕ + Esc（不写出来）。「游客」角色名可留；自动返回行为可保留，**不必写在画面上** |
| **弹窗尺寸合理吗** | **偏小 · 未达生产沉浸** | 现 `max-w-5xl`（~64rem）+ 四周大留白 → 截图观感「中间一块」。L5 短片剧场宜 ≈ **90vw / `max-w-6xl`～`7xl`**，竖屏仍 `aspect-video` + 安全边距 |
| **还要优化什么（集体改清单）** | 见右 | ① 去 hint 文案 ② 加大舞台 ③ 顶 meta 轻量（勿厚玻璃卡片压画面）④ idle 后 chrome 淡隐 ⑤ Space / 点画面播停 ⑥ focus trap + 关后焦点回播放卡 ⑦（可选）播完留「重播」1s 再关，避免突兀 |

**诚实边界：** ①/② Staging 体验补丁 · ≠ Production GO · ≠ 五主 UI 冻结回流（本改属 `/traveltrust` 数据链/交互层允许项，仍须 L5 contract 绿）。

## HU-012 · 创意剧本草稿（集体改时定稿 · 非已出图）

**用途：** `/` 定制旅行首屏默认 Ambient（未选国家时）· 宣传海报气质 · 16:9 / 高分屏可裁。

**叙事一句：** TravelTrust — 十国定制旅行网络 · AI 生成专属行程 · 认证向导 · USDC 托管。

**分层构图（由远→近 / 由上→下）：**
1. **天际带：** 阿联酋哈利法塔夜景剪影 + 新加坡滨海湾轮廓（都市科技感）
2. **中景左：** 日本富士山 / 河口湖；中景右：法国埃菲尔 + 西班牙奎尔马赛克色块
3. **中景中央焦点：** 柔光路径 / 行程卡剪影暗示「AI 生成行程」→ 导向品牌名区（勿堆字过多；文案可后期 CSS/UI 叠，图内最多短标「10 Countries · AI Itinerary」）
4. **近景下：** 泰国玛雅湾碧水 + 澳大利亚悉尼港湾弧线；中国长城脊线作地平节奏（勿占满默认整屏「单长城」）
5. **点缀：** 韩国景福宫暖色门楼一角 · 美国曼哈顿天际细线

**调性：** 中低明度 · 便于叠 landing vignette · 金/琥珀品牌点缀 · **非**紫渐变 / 奶油衬线海报套；真实景区可识别 · 拼贴层次清晰 · 一图读出「全球定制游」。

**交付验收：** Owner 目视 L5 PASS → 替换默认 Ambient → Staging 复验默认态；选国家后仍切各国图。

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
