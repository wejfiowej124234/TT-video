# Pre-Mainnet Human UI/UX · Defect Register

**Session:** `20260724T065700Z-pre-mainnet-human-uiux`  
**Phase:** ①/② 真人手测（主网真网前）· ≠ Production GO · ≠ Mainnet Cutover  
**Round-1:** HU-001～010 **FIXED**（2026-07-24 · Staging bake `2db694ae`）  
**Round-2 = 第二批（Batch-2）:** HU-011～017 · **CLOSING**（HU-014 PARTIAL · Resend 域名 Owner 残留）  
**Round-3 = 第三批（Batch-3）:** HU-018～021 **FIXED** · HU-014↻ **PARTIAL（Owner Resend 域名）**（2026-07-24 ~09:26 集体改）  
**Round-4 = 第四批（Batch-4）:** HU-022～025 **FIXED**（2026-07-24 · 集体改 · Staging bake 待本批 deploy）· HU-014↻ 仍 **PARTIAL（Owner Resend）**  
**Tip cite:** `ea71c577` · Pin `PSG-REL-20260720-WEB3-CAND-V2`  
**Staging deploy HEAD:** （Batch-4 部署后回填）  
**Env:** https://tt-web-staging.fly.dev  
**Accounts SSOT:** `docs/runbook/TT-TEST-ACCOUNTS-QUICK-REFERENCE.md`（密码不写入本表）  
**Evidence twin:** `evidence/manual-uat/sessions/20260724T065700Z-pre-mainnet-human-uiux/DEFECT-REGISTER.md`  
**Rule（写死）：** Owner 口述 → 立刻追加；「结束 / 出清单」→ 清单+意见；**「开始第 N 批集体改」** → 按 Batch-2 同级标准改 → 本地 → Staging → Git → **Final Truth cite 对齐**（不新开平行真源）。

---

## 第四批（Batch-4）· 实施状态（生产级 · L5 · 2026-07-24）

| # | 主题 | 严重度 | 状态 | 落地摘要 |
|---|------|--------|------|----------|
| **HU-022** | 兑换网关单主钮「兑换」 | P1 | **FIXED** | 底栏仅一主 CTA「兑换」；未连钱包 → 弹窗「请连接钱包」→ 顶栏同源；治理/托管降为文字链；短文案无挤行 |
| **HU-023** | 信任「可核对的事实」 | P1 | **FIXED** | Escrow 点名 USDC；去「第一阶段」工程词 → 开放十国网络；合规卡保留 |
| **HU-024** | 社区十国目的地面板 | P1 | **FIXED** | `productCountries` 十国；无印尼；每国≤4 城；紧凑行布局无竖滚 |
| **HU-025** | 顶栏钱包已连接态 | P1 | **FIXED** | 芯片短址+状态点；账户菜单「钱包会话 ≠ 网站登录」；禁「已登录」冒充 |
| **HU-014↻** | 注册验证码真发信 | **P0** | **PARTIAL** | 同 Batch-3 · Owner Resend 域名 |

**诚实边界：** Batch-4 ≠ Production GO / Hard Gate / Cutover。

---

## 第三批（Batch-3）· 实施状态（生产级 · L5 · 2026-07-24）

| # | 主题 | 严重度 | 状态 | 落地摘要 |
|---|------|--------|------|----------|
| **HU-018** | Hero「开始规划行程」→ 定制旅行 | P1 | **FIXED** | 默认 `/`；`build…WithRegion` 外链带 `?region=`；traveler/page-brief 同源 |
| **HU-019** | 角色剧场弹窗 L5 | P1 | **FIXED** | 舞台 ~90vw/`max-w-6xl`；hint `sr-only`；轻顶栏；Space/点画面播停；focus trap；chrome idle 淡出 |
| **HU-020** | 社区目的地筛选 App IA | P1 | **FIXED** | 仅城市分组 Sheet；去国城混排；热门 chip≤3 |
| **HU-021** | Console Geo + 未登录 401 | P1 | **FIXED** | `geolocation=(self)`；默认锚 `city_current`；预取 `hasClientAuthSession` 闸；扩展噪声不修 |
| **HU-014↻** | 注册验证码真发信 | **P0** | **PARTIAL** | 代码/文案生产纪律已到位；Staging 日志仍 Resend **403 test-mode**（仅 `plantartist778@gmail.com`）。**Owner：resend.com/domains 验证域名 → 改 `TRAVELTRUST_RESEND_FROM` → 复验任意 Gmail** |

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
| **HU-014** | 注册验证码未达邮箱 | **P0** | **PARTIAL · 生产级未闭** | 代码 fail-closed 已落地；**Staging ~09:21 复现** `503` + `yinhang744@gmail.com` 未收信。生产级 = Resend 域名验证 + `TRAVELTRUST_RESEND_FROM` + 入箱复验（见 HU-014 节） |
| **HU-015** | 社区「当前定位」 | P1 | **FIXED** | 下拉仅 GPS + 当前城市；默认 GPS；剔丽枫酒店 |
| **HU-016** | 社区规范 UI | P1 | **FIXED** | CTA 改 sun L5；内容仍诚实草稿（≠法务定稿） |
| **HU-017** | CMS 运营号仿用户 | P1 | **FIXED（代码+素材）** | dataset 真人昵称 + `/media/ocs/ops-avatars/*`；`sync-ocs-ops-personas-hu017.cjs` 写 Staging users |

**Owner 残留：** HU-014 Resend 域名验证后任意收件人可通。

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
| HU-014 | 2026-07-24 ~08:33 | 未登录（Staging） | `/auth/register` 验证码 | 倒计时但邮箱未收到 | 出站邮件 | **P0** | fail-closed 已落地；**Resend 域名仍须 Owner** | **PARTIAL · Batch-2** |
| HU-014↻ | 2026-07-24 ~09:21 | 未登录（Staging） | `/auth/register` ·「发送验证码」 | Console：`POST …/send-verification-code` **503**；未收到码；**要求真实生产级** | 出站邮件 | **P0** | **503 = 预期 fail-closed**（不许假成功）。根因仍 Resend 拒任意 Gmail。生产级清单见 **HU-014 生产级闭环** | **OPEN · Batch-3（Owner 出站配置）** |
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
| HU-014↻ | 2026-07-24 ~09:21 | 未登录（Staging） | `/auth/register` 发码 | 503 · 未收码 · 要生产级 | 出站邮件 | **P0** | fail-closed 保持；**Owner 验 Resend 域** | **PARTIAL · Owner ops** |

### Round-4 = 第四批 Batch-4（FIXED · 2026-07-24）

| # | 时间 | 账号 | 路径/页面 | 问题描述（原话） | 类型 | 严重度 | 修改意见 | 状态 |
|---|------|------|-----------|------------------|------|--------|----------|------|
| HU-022 | 2026-07-24 ~09:50 | 未登录（Staging） | `/traveltrust` · 兑换网关 | ① 内容须对齐最新真源 ② Escrow 换行挤行 ③ 只留「兑换」 ④ 未连钱包弹「请连接钱包」 | UX · 内容 · L5 | P1 | 单主 CTA + wallet prompt modal + 次级文字链；locale 生产口径 | **FIXED** |
| HU-023 | 2026-07-24 ~09:50 | 未登录（Staging） | `/traveltrust` · 信任事实 | 对齐最新真源 · 商业标准 | 内容 · 商业 · L5 | P1 | USDC Escrow 点名；去「第一阶段」；合规保留 | **FIXED** |
| HU-024 | 2026-07-24 ~09:52 | 未登录（Staging） | `/community` · 全部目的地 | 十国无印尼 · 简约无滚动条 | UX · IA · 数据 | P1 | `productCountries` + 紧凑行；无 `id` | **FIXED** |
| HU-025 | 2026-07-24 ~09:55 | 连钱包后（Staging） | 顶栏钱包 | 已连接应显示什么 · L5 | UX · L5 · 钱包 | P1 | 短址芯片 + 账户菜单；明确 ≠ 网站登录 | **FIXED** |

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

## HU-014 · 注册邮箱验证码 · 生产级闭环（Batch-2 PARTIAL · Batch-3/4 复确认）

**Staging 复现（2026-07-24 ~09:54）：** 游客注册 · `yinhang744@gmail.com` ·「发送验证码」→ **503**；Resend Emails 控制台**无新发送记录**（仅见 2 日前 `plantartist778@gmail.com` 的 password reset / probe · Delivered）。

### 与「改密曾通」对拍（纠正误解 · 非 API 配错）

| 现象 | 含义 |
|------|------|
| Resend 里改密/探针 **Delivered** → `plantartist778@gmail.com` | 证明 **Resend API Key + 出站链路畅通**（Feature Inventory / Reality Closure 对「账号邮箱」已通） |
| 注册发到 `yinhang744@gmail.com` → API **503** · Resend **无新行** | 请求**已到达** Resend，被 **403 test-mode** 拒绝后 API fail-closed；**不会**写入 Sending 成功表 |
| Staging 日志（~01:52Z） | `You can only send testing emails to your own email address (plantartist778@gmail.com). … verify a domain at resend.com/domains, and change the from address…` |

**结论：** 功能未「匹配错」——改密与注册走**同一** `send_via_resend`；差异只在**收件人是否 = Resend 账号邮箱**。任意 Gmail 生产级 = **验证域名 + 改 FROM**，不是再改注册代码假成功。

### Final Truth Baseline cite-only（本项落点）

| 锚点 | 本项关系 |
|------|----------|
| **Final Truth / Product·Release Baseline** | 注册 OTP 属用户产品真实能力 |
| **Engineering SSOT** | `email_transport_resend` + Fly secrets；代码 fail-closed 已对齐 |
| **Feature Inventory** | 「能发信」对 plantartist **已证**；对任意用户邮箱 **未证** |
| **Reality Closure** | Staging 真跑与 Baseline 对拍：**test-mode 限制 = OPEN gap** |
| **PRR / Mainnet Hard Gate / Cutover** | 本项闭 ≠ Hard Gate PASS；域名验证是 ②→③ 出站前置 |

| 层 | 状态 | 说明 |
|----|------|------|
| **产品代码（①）** | 已按生产纪律 | 投递失败 → **503 `email_delivery_failed`** + 回滚 OTP + 无假倒计时 |
| **出站投递（②）** | **未闭 · Owner** | Resend 仍 test-mode / 未用已验证域 `from` |
| **Owner 步骤（写死）** | 待办 | ① [resend.com/domains](https://resend.com/domains) 验证业务域 ② `fly secrets set TRAVELTRUST_RESEND_FROM='TravelTrust <noreply@已验证域>' -a tt-api-staging` ③ 复测 `yinhang744@gmail.com` → Resend 出现新 Delivered + 入箱 |
| **临时自测** | 可选 | 用 `plantartist778@gmail.com` 注册发码应能通（与改密同白名单）— **不能**冒充任意邮箱已 GO |

**禁止：** 为消 Console 503 改回假成功。`chext_driver` unload = 扩展噪声，忽略。

## HU-021 · Staging Console 分流（2026-07-24 · 先记未改）

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
