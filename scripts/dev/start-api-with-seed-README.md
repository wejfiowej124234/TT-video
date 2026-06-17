# start-api-with-seed 环境变量说明（唯一本地一键启动入口）

从仓库根运行（**推荐双击**）：**`start-api-with-seed.bat`**（仓库根）或 **`scripts\start-api-with-seed.bat`**（实现：`scripts\dev\start-api-with-seed.bat`）

维护者改 `scripts\dev\start-api-with-seed.bat` 后请执行：`powershell -File scripts\dev\normalize-start-api-bat.ps1`（生成 **GBK + CRLF**，避免 cmd 双击误解析 UTF-8 括号）。

Git Bash 在 Windows 上可：`bash scripts/start-api-with-seed.sh`（内部委托上述 `.bat`）

**勿在 .bat 的 `echo` 行里写半角 `;` `(` `)`**，cmd 会误拆命令；说明以本文件为准。

## 全站主题 V1 走查（marketDark · ①）

改 `marketingUi` / `community` / `uiSystem` 后若 dev 出现 `OFF950`、`routes-manifest` ENOENT、`Cannot find module './NNNN.js'`：

1. 关 **TravelTrust-Frontend** 窗口  
2. **`set TRAVELTRUST_SITE_THEME_V1=1`** 后 **`scripts\start-api-with-seed.bat`**  
   - 默认：`TRAVELTRUST_PREP_CLEAN=1`（Step 0b + Step 8 双保险清 `.next`）、`TRAVELTRUST_SITE_THEME_VITEST=1`（Step 7c **§6.1 vitest bundle**）、跳过 04 + Resend  
3. 浏览器硬刷新 **`/market` `/community` `/did-rank` `/traveltrust`**  
4. 仍异常：`cd frontend && npm run doctor:3012`  

Runbook：`docs/runbook/TT-PH1-SITE-THEME-V1-UPGRADE-001.md` §6.1。

## Hero `/traveltrust` 模块化走查（layout lock v10）

架构：`app/traveltrust` → `modules/traveltrust-home` → `@/lib/traveltrust/home/cinematic-bridge` → `components/traveltrust/cinematic`（cinematic **不得** import home module）。

改 Hero / 叠层 / bridge 路径后请：

1. 关旧 **TravelTrust-Frontend** 窗口  
2. **`set TRAVELTRUST_UI_HANDOFF=1`** 后运行 **`scripts\start-api-with-seed.bat`**  
   - 默认：`TRAVELTRUST_PREP_CLEAN=1`（清 `.next`）、跳过 04 + Resend、`TRAVELTRUST_HOME_VITEST=1`（Step 7b vitest 16/16）、`TRAVELTRUST_WAIT_FE_READY=1`、打开 `/traveltrust`  
3. 浏览器用 **http://127.0.0.1:端口/traveltrust** 硬刷新（Ctrl+Shift+R）  
4. 叠层审计：`frontend/evidence/GO_local_hero_globe_a_closure/HERO_SKY_COLOR_LAYER_AUDIT.md`  
5. **ChunkLoadError / 缺 layout.js**：务必走 UI handoff（或手动 `TRAVELTRUST_PREP_CLEAN=1`），勿在旧 dev 进程上热改 bridge 路径  

**FE 已起后的可选 QA**

| 命令 | 说明 |
|------|------|
| `cd frontend && npx vitest run modules/traveltrust-home/` | 模块化 16 维（Step 7b 已跑子集） |
| `cd frontend && set PLAYWRIGHT_REUSE_FE_SERVER=1 && npm run e2e:traveltrust-home-modular-qa` | P1 目视 probe + 清单 |
| 手填清单 | `frontend/evidence/traveltrust-home-visual-qa/README.md` |

## 启动成功后的本地 URL（脚本收尾只打印简短行，详情在此）

| 用途 | URL |
|------|-----|
| 首页 · Landing Hero | http://localhost:3012/ |
| 首页 · 清理行程草稿（cap 20） | http://localhost:3012/orders?state=draft |
| 登录 | http://localhost:3012/auth/login |
| 管理后台 | http://localhost:3012/admin · 登录 http://localhost:3012/auth/login?returnUrl=/admin |
| 管理后台账号 | `tourist@test.com` / `Test123!` · **Step 6b** promote + **6b2** `super_admin` + `admin_console_roles.SuperAdmin` + **`console_role_70=SuperAdmin`** · 2FA 策略本地默认关闭 |
| 管理后台子页 | `/admin/permissions` · `/admin/onboarding` · `/admin/approvals` · `/admin/audit/logs` |
| 一键打开管理登录 | `set TRAVELTRUST_OPEN_ADMIN=1` 后运行 `start-api-with-seed.bat`（清 `.next` + Admin vitest + ABI smoke + 打开 `returnUrl=/admin` 登录页） |
| **全功能人工检查** | `set TRAVELTRUST_MANUAL_QA=1`（等同 `OPEN_ADMIN` + **Step 6k** CMS/Growth/Official 烟测 + 打开 **`/admin/operator-guide`**）；首次或 schema drift 同批 **`RESET_DOCKER_DB=1`** |
| **全角色人工验收** | `set TRAVELTRUST_MANUAL_ACCEPTANCE=1`（等同 `MANUAL_QA` + **Step 6b5** 验证登录 + **`GET /guides?city=杭州`** 含 `guide@test.com` + **Step 6o** 种子全链交易 + **Step 6q** 向导经营+订单走廊 vitest+API + 人工 UI 核对（`/guide` 无准入卡 · `/orders?hat=guide` 接待语境 · `multi-demo` 旅客单不进向导待办）+ 打开 **`/auth/login`**） |
| Operator Guide | http://localhost:3012/admin/operator-guide |
| CMS · 国家发布 | http://localhost:3012/admin/content/countries |
| Official Hub | http://localhost:3012/admin/official |
| 社区举报向导 | http://localhost:3012/admin/community/reports |
| Hero /traveltrust | http://localhost:3012/traveltrust |
| 多重身份 Hub | http://localhost:3012/me/identities |
| **向导经营工作台** | http://localhost:3012/guide（收件箱 · 市场曝光 · 统计；**无**准入 checklist） |
| **商家经营工作台** | http://localhost:3012/provider（收件箱 · 市场曝光 · 橱窗库存 · 统计；准入 SSOT `/me/settings/trust`） |
| **向导接待订单** | http://localhost:3012/orders?hat=guide（仅 `guide_id` 匹配；旅客单见 `/orders`） |
| **商家服务订单** | http://localhost:3012/orders?hat=merchant&state=in_progress |
| **向导准入 SSOT** | http://localhost:3012/me/settings/trust（邮箱→钱包→KYC→向导资质→挂牌） |
| Identity P2 · 向导 listing 编辑 | http://localhost:3012/me/identities/guide/settings（dirty-only 预览） |
| Identity P2 · 商家 / 区域主理人 / 收购 settings | `/me/identities/merchant/settings` · `region-steward/settings` · `acquisition/settings` |
| 社区资料（头像/简介/内容预览） | http://localhost:3012/community/me |
| 设置 Hub（L5） | http://localhost:3012/me/settings |
| 设置 · 隐私（获赞隐藏等） | http://localhost:3012/me/settings/privacy |
| 账号安全 · 会话 | http://localhost:3012/me/security?focus=sessions |
| 市场 | http://localhost:3012/market |
| **主链 ① 创建行程** | http://localhost:3012/ · `POST /itineraries` **不带 `guide_id`** |
| **主链 ② 选择向导** | http://localhost:3012/escrow/`<order_id>` 显示 **「请选择向导」** → http://localhost:3012/market?view=guides&bindGuideToOrder=`<order_uuid>` → 城市 **杭州** → 点选 **`guide@test.com`（测试向导）** → **预约向导**（默认 **`TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET=1`**；**① 本地**正常客户 UI，非 API 绑单） |
| **主链 ③ 确认/付款** | Escrow 已绑向导后 **确认最终方案** → 向导接单 → `/pay?orderId=` |
| 我的订单 | http://localhost:3012/orders |
| 市场 · 绑定向导（步骤②） | http://localhost:3012/market?view=guides&bindGuideToOrder=`<order_uuid>`（推荐 `view=guides`；`view=split` 仍可用） |
| Escrow 体验草稿 | http://localhost:3012/escrow/`<order_id>`（步骤①创建后进入；无向导时须步骤②） |
| 旅行收购 PD-009 | http://localhost:3012/market/acquisition |
| 社区 | http://localhost:3012/community |
| 社区 · 发帖直开 | http://localhost:3012/community?publish=1 |
| 社区资料 | http://localhost:3012/community/me |
| 社区 · 我的发布/收藏/赞过 | 顶栏「我的」菜单 → 独立页；资料卡仅「查看全部」预览 |
| 多重身份 | http://localhost:3012/me/identities |
| DID 榜 | http://localhost:3012/did-rank |
| 区域主理人申请 | http://localhost:3012/steward/register |
| API 健康 | http://127.0.0.1:8080/health |

种子账号：`tourist@test.com` / `guide@test.com` / `merchant@test.com` / `provider-did-rank-demo@test.com` / `multi-demo@test.com`，密码 `Test123!`（`SEED_TEST_ACCOUNTS=1`）。**Step 6b5** 探针除登录外还验 **`GET /api/v1/me` → `user.email_verified_at`**（注册 OTP 与信任页同源；种子启动时写入 canonical 账号）。**全栈默认** `TRAVELTRUST_VERIFY_SEED_ACCOUNTS=1`（五账号登录 + 杭州向导列表）。

**人工验收（推荐一键）**：

```bat
set TRAVELTRUST_MANUAL_ACCEPTANCE=1
scripts\start-api-with-seed.bat
```

| 角色 | 邮箱 | 密码 | 说明 |
|------|------|------|------|
| **游客** | `tourist@test.com` | `Test123!` | 下单、支付、评价；同一账号 Step 6b2 可进 `/admin`（SuperAdmin） |
| **向导** | `guide@test.com` | `Test123!` | 杭州向导（walking+culture）；**Chain B** — 游客在 **`/market?view=guides`** 正常点选（默认 **`TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET=1`**） |
| **商家** | `merchant@test.com` | `Test123!` | 商家工作台 **`/provider`**（`seed_merchant_workbench_demo_accounts`）；**PWB-L5** Step **6r** |
| **DID 榜商家演示** | `provider-did-rank-demo@test.com` | `Test123!` | 五角色 merchant 登录 · DID 副榜 demo listing；与 `merchant@test.com` 同源种子函数 |
| **多重身份** | `multi-demo@test.com` | `Test123!` | 四 operator 槽 + steward 钱包；**PH-L5** Step **6s** 灌五轨演示 + **`/me/publish`** Workspace Context |

登录页：http://localhost:3012/auth/login — 测完一种角色先退出再换账号。

**Step 6o · 人工审核（Chain B 全链交易）**：`TRAVELTRUST_MANUAL_ACCEPTANCE=1` 默认跑 API 链（游客下单 → 向导接单 → mock-pay → 完成 → 评价）。证据：`evidence/manual-transaction-review/latest.json`；栈收尾打印 Escrow/Orders URL。

## 管理后台 · Admin RBAC（① · 与 start-api-with-seed 对齐）

| 步骤 | 内容 |
|------|------|
| **Step 1ba** | `check-frontend-api-routes-admin.ps1` — `api.ts` ↔ `routesAdminCore` / `routesAdminOnboarding` / `routesAdminCommunityPolicies` · `app/api/v1/admin/capabilities/route.ts` · **`AdminHomeQueuesProvider`** · **`AdminSessionCookieSync`** · 根 `layout` 加载 **`public/tt-session-cookie-bootstrap.js`** + **`tt-dev-chunk-recovery.js`**（`SKIP_ADMIN_ROUTES_GATE=1` 跳过） |
| **Step 1bb** | `check-frontend-api-routes-identity-p2.ps1` — `meGuideProfile` · `meMerchantProfile` · `meRegionStewardProfile` · `meAcquisitionProfile` · **`meGuideExitStatus` / `meGuideExitRequest`**（`SKIP_IDENTITY_P2_ROUTES_GATE=1` 跳过） |
| **Step 3d** | SQLx migrate 含 **`20260607120000`～`20260613120000`**（CMS catalog · Official OPS · Growth · Sprint168 `country_market_launches` · **`guides.hourly_rate` / `guides.avatar_url` / `guides.public_title`** · **`guide_exit_requests`**）；PG 探针同上 + Identity P2 向导列 + GWB 退出申请表 |
| **Step 6b** | `POST /auth/seed-test-accounts` `{}` 后 **`{"promote_admin_email":"tourist@test.com"}`** |
| **Step 6b2** | `bootstrap-local-admin-console.ps1`：`users.role=super_admin` · `admin_console_roles=SuperAdmin` · `admin_2fa_policy.enforced=false` · 探针 login + `GET /admin/capabilities`（**`console_role_70=SuperAdmin`**） |
| **Step 5 API** | 未设时默认 `TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT=1` · **`CORS_ORIGINS=http://127.0.0.1:3012,http://localhost:3012`**（随 `FRONTEND_PORT`）· **`TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE=1`**（与 `main.rs` seed 栈同源）；本地默认 **`API_RATE_LIMIT_PER_MINUTE=0`**（避免 `/admin` 工作台多队列 **429**）；生产级限流：`TRAVELTRUST_STRICT_API_RATE_LIMIT=1` |
| **Step 6b 探针** | `bash scripts/dev/check-admin-capabilities-route.sh`（`TRAVELTRUST_API_BASE` 随 API 端口；须 **401** 非 **404**） |
| **Step 6c** | `post-start-api-abi-smoke.ps1`：… + **`GET /me/publish-summary`**（**`multi-demo@test.com` 200 · `meta.implementation_status=me_publish_summary_api_v1` · W1-A3**；404 = 旧 API）+ … |
| **Step 6p** | `smoke-multi-identity-closure-local.sh` — **`multi-demo@test.com`** 四轨 profile 写 + provider/acquisition listing 发布 + governance 读（**全栈默认开** · `SKIP_POST_START_L3_MULTI_IDENTITY_SMOKE=1` 跳过） |
| **Step 6n** | `smoke-identity-p2-settings-local.sh`（四轨 profile **GET/PATCH**；**全栈默认跑**；`SKIP_POST_START_IDENTITY_P2_SMOKE=1` 跳过；`TRAVELTRUST_MANUAL_ACCEPTANCE=1` 强制开） |
| **Step 6o** | `smoke-seed-tourist-guide-transaction-local.sh`（**Chain B** · `tourist@test.com`+`guide@test.com` · create→accept→mock-pay→complete→review；**`TRAVELTRUST_MANUAL_ACCEPTANCE=1` 默认开**；`SKIP_POST_START_SEED_TRANSACTION_SMOKE=1` 跳过） |
| **Step 6q** | `smoke-guide-workbench-l5-local.sh`（**GWB-L5** · vitest 含 `guideOrderCorridor*` + `meSettingsTrustProgress*` + ops-only 契约 + `guide@test.com` · `GET /me`（`email_verified_at`）· `GET /me/guide-profile` · **`GET /me/guide-exit-status`** · `GET /guides/:id/availability` · **`multi-demo@test.com` 订单走廊 `guide_id` 旁证**；**全栈默认开**；`SKIP_POST_START_GUIDE_WORKBENCH_L5_SMOKE=1` 跳过） |
| **Step 6r** | `smoke-provider-workbench-l5-local.sh`（**PWB-L5** · …；**全栈默认开**；`SKIP_POST_START_PROVIDER_WORKBENCH_L5_SMOKE=1` 跳过） |
| **Step 6s** | `smoke-publish-hub-post-start-local.sh`（**PH-L5 / Wave1** · `seed-publish-hub-multi-demo-local.sh` + **`GET /me/publish-summary` strict** · 可选 vitest；**全栈默认开** · post-start **SKIP_VITEST=1**；`TRAVELTRUST_POST_START_PUBLISH_HUB_VITEST=1` 或 **`TRAVELTRUST_MANUAL_ACCEPTANCE=1`** 开 vitest；`SKIP_POST_START_PUBLISH_HUB_L5_SMOKE=1` 跳过） |
| **Step 6k** | `smoke-admin-cms-growth-official-p0-local.sh`（**`TRAVELTRUST_OPEN_ADMIN=1`** 或 **`TRAVELTRUST_MANUAL_QA=1`** 默认跑；`SKIP_POST_START_ADMIN_OPS_SMOKE=1` 跳过） |
| **Step 7f** | `TRAVELTRUST_ADMIN_VITEST=1`（**`TRAVELTRUST_OPEN_ADMIN=1` 默认开**）→ `run-admin-l5-vitest.ps1` / `run-admin-l5-green.mjs` |
| **FE 壳层** | `AdminCapabilitiesShell` 内 **`AdminHomeQueuesProvider`** + **`AdminSessionCookieSync`** — 侧栏/顶栏/首页共享单次 inbox+KPI 拉取；根 layout 静态脚本同步 cookie / 开发态 chunk 恢复 |

**现象 `capabilities` 503 / panic `Overlapping method route`：** 8080 上 API 须为**当前仓库**编译（`admin/mod.rs` 勿与 `admin_rbac::router()` 重复注册 capabilities）。修复后重跑一键脚本或 `powershell -File scripts/dev/restart-api-local.ps1`。

**现象 `GET /api/v1/me/steward-seat` 404（工作台 TTG 质押）：** 8080 进程为**旧二进制**（路由未注册）。须 **停 API** → `cargo build -p traveltrust-api` → 重跑 `scripts\start-api-with-seed.bat` 或 `scripts\dev\restart-api-local.ps1`。Step **6c** 对 **`multi-demo@test.com`** 会验 **`GET /me/steward-seat` 200**；404 即 FAIL 并提示重编译。

**现象 `GET /api/v1/me/guide-exit-status` 404 空 body（`/guide` 退出卡片）：** 与 steward-seat 同源 — **8080 旧二进制**或未跑 Step **4** `cargo build`。空 body 404 ≠ `guide_profile_not_found` JSON。修复：**停 API** → `cargo build -p traveltrust-api` → 重跑一键脚本；Step **6c** / **6q** 会验 **`guide@test.com` 200** 与未登录 **401**。

**现象 `GET /api/v1/me/merchant-listings` 404 空 body（`/provider` 橱窗库存）：** 与 guide-exit 同源 — **8080 旧二进制**。`merchant-listings-summary` 可能仍 200 而 `merchant-listings` 404。修复：**停 API**（`scripts\dev\stop-api-thorough.ps1`）→ Step **4** `cargo build -p traveltrust-api` → 重跑一键脚本；Step **6c** / **6r** 会验 **`merchant@test.com` 200** + `published[]`/`drafts[]`。

**现象 `GET /api/v1/me/publish-summary` 404（`/me/publish` 汇总条 · W1-A3）：** 与 steward-seat 同源 — **8080 旧二进制**。修复：**停 API** → Step **4** `cargo build -p traveltrust-api` → 重跑一键脚本；Step **6c** / **6s** 会验 **`multi-demo@test.com` 200** + `meta.implementation_status=me_publish_summary_api_v1`。全量绿集：`bash scripts/dev/smoke-publish-hub-local.sh`。

**现象 `POST /auth/login` → `127.0.0.1:8080` `ERR_CONNECTION_REFUSED`：** API 未在 **8080** 监听（勿把 API 起在 3012）。确认根 `.env` **`PORT=8080`**、TravelTrust-API 窗口标题进程存活、`curl http://127.0.0.1:8080/health` 为 200。

**前端：** Next 须加载 `app/api/v1/admin/capabilities/route.ts`；503 且 JSON 含 `admin_capabilities_route_missing` → 重启 API + 重启 `npm run dev`。

| 验收（可选） | 命令 |
|--------------|------|
| 能力路由探针 | `bash scripts/dev/check-admin-capabilities-route.sh` |
| Admin ① 绿集 | `bash scripts/dev/run-admin-l5-green.sh` |
| 一键验收 | `bash scripts/dev/verify-admin-audit-closure.sh` |
| RBAC 矩阵（须 `psql`） | `bash scripts/dev/smoke-admin-rbac-matrix-local.sh` |
| CMS/Growth/Official 烟测 | `bash scripts/dev/smoke-admin-cms-growth-official-p0-local.sh` |

## 管理后台 · 全功能人工检查（TRAVELTRUST_MANUAL_QA）

准备本地栈并对齐 **API · ABI · DB · Admin CMS/Growth/Official** 后，按 Operator Guide 四条日常任务逐项手测：

```bat
set RESET_DOCKER_DB=1
set TRAVELTRUST_MANUAL_QA=1
scripts\start-api-with-seed.bat
```

| 项 | 说明 |
|----|------|
| **预设** | 清 `.next` · Admin vitest · Step **6c** ABI smoke · Step **6k** CMS/Growth/Official · 打开 **`/auth/login?returnUrl=/admin/operator-guide`** |
| **登录** | `tourist@test.com` / `Test123!` → SuperAdmin |
| **Guide → Countries → Publish** | `/admin/content/countries`（publish-queue 只读，发布走 Countries） |
| **Guide → Official Hub** | `/admin/official` → accounts / guides / itinerary-templates / cold-start |
| **Guide → Reports 向导** | `/admin/community/reports`（2-step moderation wizard） |
| **Growth 面** | `/admin/growth` · referral · analytics · early-bird · anti-fraud |
| **跳过 6k** | `SKIP_POST_START_ADMIN_OPS_SMOKE=1` |
| **6k 仅 WARN** | `TRAVELTRUST_POST_START_ADMIN_OPS_WARN=1` |

**端口**：API **8080** · Next **3012**（根 `.env` **`PORT=8080`**，勿把 API 绑到 3012）。

## 区域主理人 · 第 2 步钱包签名（① · 与 start-api-with-seed 对齐）

**现象**：MetaMask 已连接、地址已填，但「下一步」灰色，或红字「未能向服务器申请签名挑战」。

| 原因 | 处理 |
|------|------|
| 只点了「使用当前钱包」 | 还须点 **「签名验证钱包」** 并在钱包里确认 personal_sign；成功后「下一步」才亮 |
| 未用站点登录 / 无 Bearer | 先 **`/auth/login`**（种子账号），Local Storage 须有 **`traveltrust_session_token`**（`tts_…`） |
| `lib/api.ts` 缺 `meWalletVerify*` 路由常量 | Step **1b4** `check-frontend-api-routes-wallet-verify.ps1` 会失败；与 `lib/api/routes.ts` 对拍 |
| API 未起 / chain_off 未挂 | Step **6c** 会测 `POST /auth/login` + `POST /api/v1/me/wallet/verify/challenge`；失败则先修 API 栈 |

**全栈验收（可选）**：API 已起后 `bash scripts/dev/smoke-steward-onboarding-local.sh`（含 steward 申请；不含 MetaMask 真签名时可另测 challenge）。

## P03–P06 + GD/P06 公众向导主链（① · 与 start-api-with-seed 对齐 · 2026-06-09 冻结）

| 步骤 | 内容 |
|------|------|
| **Step 3f** | `run-clear-hangzhou-seed-guide-slots-db.ps1` — API 启动前清 **`f0e0b101-*`** accepted/escrowed 占位（`SKIP_CLEAR_HANGZHOU_GUIDE_SLOTS=1` 跳过） |
| **Step 6b4** | `bootstrap-gd-p06-public-catalog-local.sh` — **`POST /auth/seed-trust-gate-e2e`** + **`tourist@test.com` Bearer** 探针 **`GET /guides/f0e0b101-…`** · **`GET …/availability` 有 Bearer 200 / 无 Bearer 401**（`STRICT_SESSION_GATE=1` 时 **`:id` 非公开读**；`SKIP_BOOTSTRAP_GD_P06_PUBLIC_CATALOG=1` 跳过） |
| **Step 6b5** | `verify-seed-test-accounts-login.ps1` — **`tourist@test.com` / `guide@test.com` / `merchant@test.com` / `provider-did-rank-demo@test.com` / `multi-demo@test.com` 登录**；**`TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET=1`** 时 **`GET /guides?city=杭州`** 须含 seed 向导（**全栈默认 `TRAVELTRUST_VERIFY_SEED_ACCOUNTS=1`**） |
| **Step 6c** | `post-start-api-abi-smoke.ps1` 增验公众 catalog 杭州向导详情 + 档期鉴权门闸 + seed 向导列表（`SEED_GUIDE_PUBLIC_MARKET=1`） |
| **冻结 SSOT** | `frontend/evidence/GO_local_web3_itinerary_l5/ESCROW-P03-P06-GD-MAIN-CHAIN-FREEZE.md` |
| **异常流证据** | `bash scripts/dev/record-escrow-p03-p06-exception-flows-evidence.sh`（启动脚本**不**默认跑） |
| **主链证据** | `bash scripts/dev/record-escrow-gd-p06-public-catalog-evidence.sh` |

向导账号：**`tg_guide_main@trustgate-e2e.local`** / `Test123!`（trust-gate 种子；与 Playwright `publicCatalogHangzhouGuide.ts` 同源）。

**Chain B 正常市场手测**：**`guide@test.com`** / `Test123!` — 默认 **`TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET=1`**（Step **6b5** / **6c** 探针 **`GET /guides?city=杭州`**）；与 Chain A 订单勿混用。

## 创新行程主链 · itinerary-first（① · Web3 行程 L5）

**产品顺序（与 Escrow `OrderFlowSteps` 一致）**：

| 步 | 动作 | 本地 URL / API |
|----|------|----------------|
| **① 创建行程** | Landing Hero / 市场自定义；**创建时不绑向导** | `POST /api/v1/itineraries` 无 `guide_id` → `/escrow/:id` |
| **② 选择向导** | 草稿已发布后 Escrow 显示 **「请选择向导」**；**Chain B 手测**：`/market?view=guides` 城市 **杭州** 点 **`guide@test.com`**（默认 **`TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET=1`**） | `/market?view=guides&bindGuideToOrder=<order_uuid>` → 预约向导 → `PATCH /orders/:id/guide` |
| **③ 确认终版/付款** | 已绑向导后可更换（`PATCH` reassign）→ 确认方案 | 向导接单 → `/pay?orderId=`（本地须 **`P3_CHAIN_OFF=1`**） |

**勿混淆**：订单详情出现向导 = 用户曾在步骤②绑定（或市场深链 `?guide_id=`）；**不是**创建时默认指派。

## Escrow 体验草稿 · 市场绑定向导（① · Web3 行程 L5）

**流程**：游客登录 → **①** 创建行程（无向导）→ 保存发布 → **②** Escrow「请选择向导」/ 市场 `bindGuideToOrder` → `PATCH` 绑定（可 **更换向导** reassign）→ **③** **确认最终方案** → 向导 **接单** 后 `/pay?orderId=`（本地 mock-pay 须 **`P3_CHAIN_OFF=1`**）。

| 项 | 说明 |
|----|------|
| `P3_CHAIN_OFF` | **Step 5** 本地默认 **强制 `1`**（mock-pay + 公众 catalog）；根 `.env` 含 Anvil 块 `P3_CHAIN_OFF=0` 时仍被覆盖。**链上 / 测试网 E2E** 启动前设 **`TRAVELTRUST_CHAIN_ON=1`**，则沿用 `.env` |
| `TRAVELTRUST_CHAIN_ON=1` | Step 5 **不**强制 `P3_CHAIN_OFF=1`；`dotenv` 读根 `.env`（Anvil / Sepolia 同源） |
| Step **1b5** | **`check-frontend-api-routes-web3-itinerary.ps1`** — `lib/api.ts` ↔ `lib/api/routes.ts`（`orderPatchGuide` · `guideAvailability` · `confirm-final-plan` · `itineraries` · `discover`）。`SKIP_WEB3_ITINERARY_ROUTES_GATE=1` 跳过。 |
| Step **6f** | 默认（6d+6e 均未跳过）跑 **`smoke-web3-itinerary-full-chain-local.sh`**（6e 断言创建/发布 **无 guide_id**；6d 绑定 + **reassign**）。`SKIP_POST_START_WEB3_ITINERARY_SMOKE=1` 跳过整段；仅跳过其一则仍跑 **6d** 或 **6e** 单项。 |
| Step **6d** / **6e** | 仅当另一项被 `SKIP_*` 时单独跑；WARN：`TRAVELTRUST_POST_START_WEB3_ITINERARY_WARN=1` 或 legacy `TRAVELTRUST_POST_START_ESCROW_BIND_WARN` / `TRAVELTRUST_POST_START_LANDING_ITINERARY_WARN`。 |
| 前端绿集 | `bash scripts/dev/run-web3-itinerary-l5-green.sh`（vitest · ①；启动脚本不默认跑） |

## itinerary-date-as-source · 行程日期真源（① · 2026-06-09 冻结）

**产品**：创建行程时写入的出行日期 = 市场绑定向导 / 向导详情「查看·预约」档期真源；忙档向导市场隐藏 + `PATCH …/guide` **409**。

| 项 | 说明 |
|----|------|
| **冻结 SSOT** | `frontend/evidence/GO_local_web3_itinerary_l5/ITINERARY-DATE-AS-SOURCE-PHASE1-FREEZE.md` |
| **Step 1b5** | FE 路由含 **`guideAvailability`**（`GET /api/v1/guides/:id/availability`） |
| **Step 6c** | ABI smoke 已验杭州向导 **`…/availability`** Bearer 200 / 无 Bearer 401 |
| **Step 6m** | 默认 **跳过**；设 **`TRAVELTRUST_POST_START_ITINERARY_DATE_AS_SOURCE_SMOKE=1`** 跑 `smoke-itinerary-date-as-source-busy-guide-local.sh`（忙档 **409** + 档期矩阵） |
| **跳过 6m** | `SKIP_POST_START_ITINERARY_DATE_AS_SOURCE_SMOKE=1`；`TRAVELTRUST_MARKET_CLEAN=1` 默认已设 |
| **6m 仅 WARN** | `TRAVELTRUST_POST_START_ITINERARY_DATE_AS_SOURCE_WARN=1` |
| **权威证据** | `bash scripts/dev/record-itinerary-date-as-source-evidence.sh`（绿集 + contract + Playwright + 6m 同源 busy smoke） |
| **429 缓解** | Step 5 默认 **`API_RATE_LIMIT_PER_MINUTE=0`**；前端 **`guideAvailabilityClient`** 缓存/去重/并发上限 + 市场过滤 **350ms debounce** |

**浏览器走查**：`/market?view=guides&bindGuideToOrder=<uuid>` → 横幅「行程出行」→ 过滤后向导列表 → `/guides/<id>` 日历只读高亮 → 预约向导 → Escrow「等待向导接单」。
| 手动烟测 | `bash scripts/dev/smoke-web3-itinerary-full-chain-local.sh` |

**前端单测**：`cd frontend && npx vitest run lib/apiClient/me/me.walletVerify.test.ts`

## Landing Hero 行程生成 · 天数对齐（① · L5）

**现象**：表单选 5 天 + 单城 `cities:["北京"]`，解锁后订单/Escrow 只显示 1 天。

**根因（已修）**：mock 曾用 `cities.len()` 当天数；现 **`body.days` 驱动日行数**，多城市轮询分配。

| 项 | 说明 |
|----|------|
| Step **6e** | 默认跑 **`smoke-landing-itinerary-flow-local.sh`**（POST 5 天 **无 guide** → GET 断言 `guide_id` 空 → PATCH 保存发布仍无向导 → discover）。`SKIP_POST_START_LANDING_ITINERARY_SMOKE=1` 跳过；`TRAVELTRUST_POST_START_LANDING_ITINERARY_WARN=1` 失败仅 WARN。 |
| Step **6d** | **`smoke-escrow-draft-guide-bind-local.sh`**：创建/保存后无向导 → `PATCH` 绑定 → 第二向导 **reassign**。 |
| 市场可见性 | **Draft 不在 discover**；Escrow **保存发布后**才进 **`/market`**（`Created` + **未指派向导**） |
| 前端 | 首页 `/` 生成后 **1 张预览卡** · 整单解锁 · 目的地 ambient 封面 |
| 手动烟测 | `bash scripts/dev/smoke-landing-itinerary-flow-local.sh` |
| 前端绿集 | `npx vitest run app/(home)/homeMarketing.contract.test.ts components/landing/` |

**改 mock / Landing 后**：须 **重启 API**（或重跑 `start-api-with-seed.bat`）再跑 Step 6e，否则仍可能是旧二进制。

## 首页 Landing · 行程草稿上限（cap 20 · 用户可见）

| 现象 | 说明 |
|------|------|
| 点击 **AI 生成行程** 无新卡片 | 多为 **`POST /api/v1/itineraries` 409 `draft_cap_exceeded`**（每用户最多 20 份 Draft） |
| 首页橙黄提示 | 文案含 **`20/20`** 与 **「前往我的订单 → 行程草稿」**；409 后按钮下方也会显示 |
| 删了订单仍满 | 旧版列表只显示部分 Draft（链范围过滤）；**须重启 API 使 `?state=draft` 列出全部 Draft** 后再删 |

| 项 | 说明 |
|----|------|
| **用户清理** | http://localhost:3012/orders?state=draft — 逐条取消/删除草稿 |
| **Step 3g** | **`prune-tourist-seed-orders-db.sh`** — API 启动前从 PG **硬删** `tourist@test.com` 的 **cancelled** 订单（避免 hydrate 后刷新又出现）；`SKIP_PRUNE_TOURIST_SEED_ORDERS_DB=1` 跳过 |
| **Step 6b3** | **`ensure-tourist-test-account-order-cleanup.sh`**：进行中 ≤**2** · 草稿 ≤**3** · 再跑 PG 清理已取消行（**删了刷新还在** = 仅内存标 cancelled，须 **3g/6b3 + 重启 API**） |
| 跳过 6b3 | `SKIP_ENSURE_TOURIST_DRAFT_HEADROOM=1` |
| 6b3 失败即中断栈 | `TRAVELTRUST_ENSURE_TOURIST_DRAFT_HEADROOM_STRICT=1`（默认仅 WARN） |
| 手动 | `bash scripts/dev/ensure-tourist-test-account-order-cleanup.sh` |
| 前端「全部」 | 默认列表 **不展示 cancelled**；已取消单在 **`?state=cancelled`** Tab |
| 后端 | `order_visible_in_orders_list` — **`?state=draft` 不施加 B-102 链过滤**，与 cap 计数一致 |
| 前端 | `/orders?state=draft` 修复 **`filterOrdersForOrdersListPage`**；首页 **`landingDraftQuota`** 预检 + 409 提示 |

**验收（tourist@test.com）**：重启 API → 重跑 `start-api-with-seed.bat` → 首页可生成；或打开 `/orders?state=draft` 可见全部草稿并删至 <20。

## 社区 · 资料头像 · DM（① · F-007 / 51-31-6）

| 项 | 说明 |
|----|------|
| **Step 1b7** | `check-frontend-api-routes-community.ps1` — `api.ts` / `routes.ts` / `routesCommunity.ts`（`mediaCapabilities` · `postsUploadMedia` · `conversationsEnsure` · `me/profile-avatar` presign/commit）。`SKIP_COMMUNITY_ROUTES_GATE=1` 跳过。 |
| **Step 1b8** | `check-frontend-api-routes-me-security.ps1` — `api.ts` ↔ `routes.ts`（`meSessions` · `meSessionCurrent` · `meSessionBySuffix` · `meSecurityNotifications`）。`SKIP_ME_SECURITY_ROUTES_GATE=1` 跳过。 |
| **Step 1b9** | `check-frontend-api-routes-phase15-identity.ps1` — `meWallets` · `meRoleApplications`（`/api/v1/me/wallets` · `/api/v1/me/role-applications`）。`SKIP_PHASE15_IDENTITY_ROUTES_GATE=1` 跳过。 |
| **Step 1ba** | `check-frontend-api-routes-admin.ps1` — Admin RBAC · 工作台六队列 · `capabilities` Next 代理 · **`AdminHomeQueuesProvider`**。`SKIP_ADMIN_ROUTES_GATE=1` 跳过。 |
| **Step 3d** | `ensure-api-db-migrations.ps1` — `sqlx migrate` + PG 探针（至 **`20260608120000`**）：legacy admin RBAC/TOTP/compliance + **`catalog_*`** · **`ops_official_*` / `ops_cold_start_*`** · **`referral_codes` / `growth_*` / `early_bird_stages` / `airdrop_*`** · **`country_market_launches` / `growth_fraud_scan_runs`** |
| **Step 3e** | `ensure-community-media-minio.ps1` — **`traveltrust-community-minio-evidence`** `:19000`（持久卷 + 建桶）；根 `.env` 无 **`COMMUNITY_MEDIA_S3_*`** 时自动追加 snippet（改后须重启 API）。`SKIP_ENSURE_COMMUNITY_MINIO=1` 跳过。 |
| **Step 5** | 未设置时注入 **`TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR=1`**（社区资料本机头像落盘；与 `start-api-for-playwright.*` 同源）。未设置时另注入 **`TRAVELTRUST_EMAIL_TRANSPORT=log`** + **`TRAVELTRUST_AUTH_REGISTER_DEV_CODE_IN_RESPONSE=1`**（本地注册/烟测与 G-0 同源；根 `.env` 可覆盖）。 |
| **Step 6c** | `post-start-api-abi-smoke.ps1` 增测 **`GET /api/v1/admin/capabilities`**（401/200 · promote+login）· **`GET /api/v1/admin/rbac/route-matrix`** · **admin 工作台六队列 `items[]`** · **`GET …/me/wallets`** · **`GET …/me/role-applications`** · **`GET/DELETE …/me/sessions*`** · **`GET …/me/security-notifications`** · 社区 **`media/capabilities` / feed / recommend`** · **`profile-avatar` presign/commit**（401）。 |
| **Step 6i** | `run-post-start-community-media-align-smoke.ps1` — feed/recommend **`primary_media_asset_id`** + PG schema + MinIO 旁证。`SKIP_POST_START_COMMUNITY_MEDIA_ALIGN_SMOKE=1` 跳过。 |
| **Step 7d** | `run-community-drawer-vitest.ps1` — PostDetail **全帖切条** + **演示帖/MinIO 横幅** + drawer 合约（默认 `TRAVELTRUST_COMMUNITY_VITEST=1`；`TRAVELTRUST_COMMUNITY_VITEST=0` 跳过）。 |
| **Step 7e** | `run-community-me-l5-vitest.ps1` — **社区资料 IA** contract（`communityMePageTracker` · `communityMeProfile` · `meSettingsHubSection` · **无 Playwright**）。`TRAVELTRUST_COMMUNITY_ME_VITEST=1` 启用；全量含 Playwright：`bash scripts/dev/run-community-me-l5-green.sh`。 |
| **IA（2026-06-02）** | **`/community/me`** = 社交身份 + 编辑资料 + 内容预览 + 旅行数据外链；**改密/退出/完整「我的」** → 顶栏下拉或 **`/me/settings`**；**获赞总数隐藏** → **`/me/settings/privacy`**。 |
| **手动** | `cd frontend && npm run e2e:pi1-community-all`（API 已起且头像 env 为 1） |
| **手动 · 窄证据** | `bash scripts/evidence/run-community-phase1-local-evidence.sh`（含 7d 同套 vitest + E2E 窄切片 · **① 非 ②③ GO**） |

## 旅行收购 PD-009 · 市场子站（① · data_origin / PG）

**Step 6h**（默认跑）：`smoke-acquisition-pd009-local.sh` — 发布保证金 → 发布 listing → 承运接单 → mock-pay → `/me` trust 字段。

| 项 | 说明 |
|----|------|
| **Step 3d** | `ensure-api-db-migrations.ps1` — 从根 `.env` 读 `DATABASE_URL` 后 `sqlx migrate`（含 `data_origin` / `market_listings` / `orders.order_kind`） |
| **Step 5** | 本地 **强制 `P3_CHAIN_OFF=1`** + **`TRAVELTRUST_PUBLIC_CATALOG_SURFACE=1`**（覆盖 `.env` Anvil 块里的 `P3_CHAIN_OFF=0`）；链上 E2E 用 **`TRAVELTRUST_CHAIN_ON=1`** |
| **Step 1b** | ABI：`align-api-abi-local.ps1`（55-S13 + 可选 forge sync）— 与 API `/meta` 链字段同源 |
| **Step 6h** | `SKIP_POST_START_ACQUISITION_PD009_SMOKE=1` 跳过；`TRAVELTRUST_POST_START_ACQUISITION_PD009_WARN=1` 失败仅 WARN |
| **干净走查** | `TRAVELTRUST_MARKET_CLEAN=1` 默认跳过 **6h** + **6n** + **6p**（不写 PG 烟测单） |
| **手动** | `bash scripts/dev/smoke-acquisition-pd009-local.sh` |
| **PG IT** | `cargo test -p traveltrust-api market_subsite_catalog_db_api_tests`（需 `DATABASE_URL`） |

**入驻页（最后一步）**：`/me/onboarding?role=region_steward&from=steward_register` 顶部有 **主理人后续三步** 指引；支付区有 **1→4 编号步骤**；须 **创建支付 → 刷新资格 → 确认身份**（本地 `$0` 演示仍走流程）。

**DID 副榜演示数据（①）**：`start-api-with-seed.bat` / `start-api-for-playwright.*` 默认 **`DID_RANK_SEED_MARKET_DEMO=1`**（可 `set DID_RANK_SEED_MARKET_DEMO=0` 关闭）。有 PostgreSQL 时幂等写入 demo 用户、已发布 `market_listings`，并在治理池无十进制余额时写入 **`125000` TTG** 供 `prize-pool` 走 **`governance_pool_db`**（仍 illustrative）。验收：`GET /api/v1/did-rank/providers?period=all` 非空；`prize-pool` 的 `.source` 常为 `governance_pool_db`。

**`rank_delta` 表**：首次本地 PG 请执行 **`bash scripts/dev/ensure-did-rank-migrations.sh`**（或 `start-api-with-seed` Step 1 已跑全量 migrate 则已含 **`20260531120000_did_rank_rank_snapshots.sql`**）。

## Phase ①.5 身份 · 钱包 · 角色申请（① · PD-004/007）

| 项 | 说明 |
|----|------|
| **Step 1b9** | `check-frontend-api-routes-phase15-identity.ps1` — `meWallets` · `meRoleApplications` |
| **Step 3d** | PG 须含 **`wallets`** · **`role_applications`** 表（`20260601120000` 等） |
| **Step 6c** | `GET /api/v1/me/wallets` · `GET /api/v1/me/role-applications`（401/200 烟测） |
| **Step 6j** | 默认 **跳过**；设 **`TRAVELTRUST_POST_START_PHASE15_IDENTITY_SMOKE=1`** 跑 `smoke-phase15-identity-demo-local.sh`（含 provider+steward 全链，较重） |
| **手动** | `bash scripts/dev/run-phase15-s1-s4-it-green.sh`（cargo IT + 可选 smoke） |

## 账号设置 Hub · `/me/security`（① · me-settings L5）

| 项 | 说明 |
|----|------|
| **Step 1b8** | `check-frontend-api-routes-me-security.ps1` — 前端 `lib/api.ts` 与 `routes.ts` 会话/安全通知路径对拍 |
| **Step 3d** | PG 须含 **`sessions.revoked_at`**、**`user_security_notifications`**、**`disputes`** 遗留列对齐（`20260602120000`） |
| **Step 6c** | `GET /api/v1/me/sessions` · `DELETE /api/v1/me/sessions/current` · `GET /api/v1/me/security-notifications` |
| **前端绿集** | `bash scripts/dev/smoke-me-settings-local.sh`（vitest；API 已起时设 **`PLAYWRIGHT_REUSE_API_SERVER=1`** 可接 Playwright） |
| **社区资料绿集** | `bash scripts/dev/run-community-me-l5-green.sh` 或启动时 **`TRAVELTRUST_COMMUNITY_ME_VITEST=1`**（Step **7e** vitest only） |
| **账户导航** | `bash scripts/dev/smoke-account-nav-local.sh` |
| **手动** | 登录 `tourist@test.com` → http://localhost:3012/community/me 编辑资料；http://localhost:3012/me/settings 账号/隐私 |

旧库缺列：`set RESET_DOCKER_DB=1` 后重跑 `scripts\start-api-with-seed.bat`，或 Step 3d 非 WarnOnly 下看 `ensure-api-db-migrations` 失败提示。

**本地治理币 TTG（② Anvil · 可选）**：`set TRAVELTRUST_TTG_ANVIL=1` 后运行 **`scripts\start-api-with-seed.bat`** → Step **3c** 部署 MockERC20 + 质押池并写入根 `.env`；**Anvil 状态持久化** + **自动补测试钱包 ETH/TTG** 见 **[`scripts/dev/TTG-ANVIL-LOCAL-README.md`](TTG-ANVIL-LOCAL-README.md)** §避免 ETH/TTG 丢失。

### multi-demo 主理人质押 · Plan A（① · 与 Step 3c / 6c 对齐）

| 项 | 说明 |
|----|------|
| **种子账号** | `multi-demo@test.com` / `Test123!` |
| **申报钱包** | `0x104FCb93B5e097F92c93Ee4621C487C6C953D212`（Anvil deployer #0 · MetaMask 可导入） |
| **Step 3c** | `deploy-ttg-anvil-local` 后 **默认** 向该地址补 **10 ETH** + **1.25M TTG**（无 `ttg-anvil-fund-wallets.local` 时仍生效） |
| **Step 6c** | `post-start-api-abi-smoke` 断言 `GET /me/steward-application` 的 `wallet_address` 为上址 |
| **工作台** | http://localhost:3012/governance?view=region#steward-ttg-stake — MetaMask 须连接 **同一地址** 才显示 approve/stake |
| **旧库迁移** | PG 仍存合成钱包 `0x4d55…0001` 时：`RESET_DOCKER_DB=1` 重跑一键栈，或 API 起后 `POST /auth/seed-test-accounts` |

手动烟测：`bash scripts/dev/smoke-steward-workbench-l5-local.sh`（vitest + steward-application 钱包探针）。

## `/market` 干净走查（① · TRAVELTRUST_MARKET_CLEAN）

调 L5 / 给产品演示时推荐：

```bat
set RESET_DOCKER_DB=1
set TRAVELTRUST_MARKET_CLEAN=1
scripts\start-api-with-seed.bat
```

| 项 | 行为 |
|----|------|
| **`TRAVELTRUST_MARKET_CLEAN=1`** | 跳过 Step **6f** / **6h** 烟测写入；强制 **`TRAVELTRUST_PUBLIC_CATALOG_SURFACE=1`**（与 **`TRAVELTRUST_MARKET_PUBLIC_SURFACE`** 同源）；**`DID_RANK_SEED_MARKET_DEMO=0`**；默认 **`TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET=1`**（`guide@test.com` 仍可在向导列表手测） |
| **公众 catalog 过滤（企业级 · ①）** | **`TRAVELTRUST_PUBLIC_CATALOG_SURFACE=1`**（或 **`P3_CHAIN_OFF=1`** 默认开）：`GET /discover/orders` · `GET /guides`（含 `:id`）· `GET /market/provider|acquisition/listings`（含 `:id`）· `GET /did-rank/providers|acquisitions` 均排除烟测/演示账号与 demo listing 标题 |
| **`TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET=1`** | **① 本地手测默认开**（一键脚本未设时自动 `=1`）：仅 **`guide@test.com`** 例外出现在 **`GET /guides`** / **`/market?view=guides`**，供 **`tourist@test.com`** 走正常选向导 UI；`=0` 关闭（与其它 dev 账号同过滤）。**`TRAVELTRUST_MANUAL_ACCEPTANCE=1`** 等同开启。API 窗口与 Step **6c** 烟测均依赖此变量 |
| **`TRAVELTRUST_MARKET_PUBLIC_SURFACE`** | 与 **`TRAVELTRUST_PUBLIC_CATALOG_SURFACE`** 同义别名（向后兼容） |
| **前端子站 demo 回退** | 默认 **关**；仅 **`NEXT_PUBLIC_MARKET_SUBSITE_DEMO_FALLBACK=1`** 时在 API 空目录时合并内置 masonry |
| **默认全栈** | 未设时 **`P3_CHAIN_OFF=1`** → 公众读面过滤 **默认开**；验全链烟测仍用默认启动（可 `=0` 看全量） |
| **演示数据** | 登录 `tourist@test.com` → 首页建 1～2 条行程并发布 → `/market` 即真实公众单 |

全链路验收（写烟测单进库）：**不要**设 `TRAVELTRUST_MARKET_CLEAN`；旧烟测单在 **`PUBLIC_SURFACE=1`** 下不会出现在 `/market`（仍在 PG）。

## Step 1c 里 `? /api/v1/...` 是什么

Python 门禁列出的行首 **`?`** 表示：该路由已在代码里挂载，但 **04 文档 §3.4 表尚未登记**。本地一键默认 `STRICT_WARNINGS=0`，**只 WARN 不阻断**；与脚本失败无关。合线前补文档或设 `TRAVELTRUST_STRICT_ROUTES_GATE=1`。

## 常用

| 变量 | 说明 |
|------|------|
| *(auto)* | Step **0** / **3**：Docker 未就绪时尝试启动 **Docker Desktop** 并等待最多 **120s**（`ensure-docker-daemon.ps1`） |
| `TRAVELTRUST_SKIP_DOCKER_AUTOSTART=1` | 禁用 Step 0/3 自动启动 Docker Desktop；须手动 `docker info` 成功后再跑 |
| `TRAVELTRUST_TTG_ANVIL=1` | **Step 3c**：Anvil `:8545` 部署 **MockERC20（本地 TTG）** + **RegionStewardStakePool**，合并根 `.env` 标记块并 sync 前端 **31337**（须 **Git Bash** + **Foundry**；`SKIP_TTG_ANVIL=1` 跳过） |
| *(auto)* | 根 `.env` 已含 **`BEGIN TT ANVIL LOCAL`** 且未设 `SKIP_TTG_ANVIL=1` 时，**Step 3c 自动等同 `TRAVELTRUST_TTG_ANVIL=1`**（须 **Git for Windows** 的 `bash.exe`，**非** WSL `System32\bash`；可设 **`GIT_BASH=C:\Program Files\Git\bin\bash.exe`**；缺工具或 deploy 失败时 **WARN 并继续**，post-start 仍接受 stake-status 503/502） |
| `SKIP_TTG_ANVIL=1` | 跳过 Step 3c（即使 `TRAVELTRUST_TTG_ANVIL=1` 或 `.env` 含 TT ANVIL 块） |
| `TRAVELTRUST_FRONTEND_ONLY=1` | 仅起 Next：跳过 SQLx/ABI/04/Resend/Docker/API；Step 0 仅检 Node；停旧 FE 端口 |
| `TRAVELTRUST_SITE_THEME_V1=1` | 主题 V1：清 `.next` + Step 7c vitest 49/49 + 默认跳过 04/Resend |
| `TRAVELTRUST_SITE_THEME_VITEST=1` | Step 7c：§6.1 主题 contract bundle（`SITE_THEME_V1` 默认开） |
| `TRAVELTRUST_SITE_THEME_VITEST=0` | `SITE_THEME_V1` 仍清 `.next`，但跳过 7c |
| `TRAVELTRUST_CLEAN_FRONTEND_NEXT=1` | Step 8 前端窗口内再 `npm run clean`（`PREP_CLEAN` 已默认联动） |
| `TRAVELTRUST_UI_HANDOFF=1` | Hero 走查：清 `.next` + vitest 7b + 等 `/traveltrust` + 打开 Hero |
| `TRAVELTRUST_HOME_VITEST=1` | Step 7b：首页模块化 vitest（handoff 默认开） |
| `TRAVELTRUST_HOME_VITEST=0` | UI handoff 仍清 `.next`，但跳过 7b vitest |
| `TRAVELTRUST_COMMUNITY_VITEST=1` | Step **7d**：PostDetail drawer vitest（**全栈默认开**） |
| `TRAVELTRUST_COMMUNITY_VITEST=0` | 跳过 Step 7d drawer vitest |
| `TRAVELTRUST_COMMUNITY_ME_VITEST=1` | Step **7e**：社区资料 + 账户导航 contract vitest（**无 Playwright**） |
| `SKIP_COMMUNITY_ME_VITEST=1` | `run-community-me-l5-green.sh` 内跳过 vitest 子集 |
| `SKIP_COMMUNITY_ME_ACCOUNT_NAV_IA=1` | `run-community-me-l5-green.sh` 内跳过 account-nav Playwright |
| `RESET_DOCKER_DB=1` | 清空 Postgres 卷后重建 |
| `SKIP_API_BUILD=1` | 跳过 cargo build |
| `TRAVELTRUST_API_CLEAN_BUILD=1` | Step 4 前 `cargo clean -p traveltrust-api`（仓库搬家后迁移 `os error 3` 时用） |
| `SKIP_API_WAIT=1` | 跳过 wait-for-api |
| `SKIP_WAIT_POSTGRES=1` | 跳过 Step 3b `wait-for-postgres.ps1` |
| `SKIP_ROUTES_GATE=1` | 跳过 Step 1c 04 路由表门禁 |
| `TRAVELTRUST_STRICT_ROUTES_GATE=1` | Step 1c 与 CI 一致：`STRICT_WARNINGS=1`，04 未登记路由即失败 |
| `SKIP_ABI_GATE=1` | 跳过 55-S13 |
| `TRAVELTRUST_ABI_AUTO_ALIGN=1` | **默认**：Step **1b0** 将 `contracts/abi` 六件套复制到 `frontend/dapp/abis`（55-S13 字节一致） |
| `TRAVELTRUST_ABI_AUTO_ALIGN=0` | 跳过 1b0，仅跑 55-S13 门禁 |
| `TRAVELTRUST_ABI_SYNC_FROM_FORGE=1` | **全栈默认**（未设即 `1`）：Step **1b** 先检 **RegionStewardStakePool** / **CountryPoolSubVaultsV0** / **CountryPoolRedemptionEpochV0** + **`verify-abi-forge`**；缺失或 drift 时自动 **`align-api-abi-local.ps1 -FromForge`**；55-S13 仍失败时同样重试 |
| `TRAVELTRUST_ABI_SYNC_FROM_FORGE=0` | 关闭自动 forge 导出（仅复制 + 55-S13；缺协议 ABI 时 Step 1b 失败） |
| `SKIP_AUTH_EMAIL_RESEND_GATE=1` | 跳过 Resend 检查 |
| `NO_PAUSE=1` | 末尾不 pause |
| `TRAVELTRUST_PREP_CLEAN=1` | 启动前 `npm run clean` |
| `TRAVELTRUST_WAIT_FE_READY=1` | 轮询 FE 直至 200（`OPEN_TRAVELTRUST=1` 时查 `/traveltrust`，否则 `/`） |
| `TRAVELTRUST_OPEN_TRAVELTRUST=1` | 收尾打开 /traveltrust |
| `TRAVELTRUST_OPEN_ADMIN=1` | 管理后台走查：Step 6b2 SuperAdmin bootstrap + Step **6k** + 打开 `/auth/login?returnUrl=/admin` |
| `TRAVELTRUST_MANUAL_QA=1` | **全功能人工检查**：等同 `OPEN_ADMIN` + 打开 **`returnUrl=/admin/operator-guide`** + Step **6k** CMS/Growth/Official 烟测 |
| `TRAVELTRUST_MANUAL_ACCEPTANCE=1` | **全角色人工验收**：等同 `MANUAL_QA` + **Step 6b5** seed 登录 + 杭州向导列表探针 + **Step 6o** 种子全链交易 + 打开 **`/auth/login`** |
| `TRAVELTRUST_POST_START_SEED_TRANSACTION_SMOKE=1` | 显式开 Step **6o**（`MANUAL_ACCEPTANCE` 默认已设） |
| `SKIP_POST_START_SEED_TRANSACTION_SMOKE=1` | 跳过 Step **6o** |
| `TRAVELTRUST_POST_START_SEED_TRANSACTION_SMOKE_WARN=1` | Step 6o 失败仅 WARN |
| **TRAVELTRUST_VERIFY_SEED_ACCOUNTS=1** | 启用 Step **6b5** `verify-seed-test-accounts-login.ps1`（**全栈默认开** · 五种子账号 + 杭州向导列表）；**`MANUAL_ACCEPTANCE` 默认已设** |
| `SKIP_VERIFY_SEED_ACCOUNTS=1` | 跳过 Step **6b5** |
| `TRAVELTRUST_VERIFY_SEED_ACCOUNTS_STRICT=1` | Step 6b5 失败即中断栈 |
| `SKIP_POST_START_ADMIN_OPS_SMOKE=1` | 跳过 Step **6k** |
| `TRAVELTRUST_POST_START_ADMIN_OPS_WARN=1` | Step 6k 失败不阻断启动（仅 WARN） |
| `TRAVELTRUST_ADMIN_LOGIN_RETURN_URL` | 自定义管理登录 `returnUrl`（`MANUAL_QA` 默认 `/admin/operator-guide`） |
| `TRAVELTRUST_OPEN_HOME=0` | 不打开首页（UI handoff 已默认） |
| `TRAVELTRUST_POST_START_ABI_CHECK=1` | Step 6c：`post-start-api-abi-smoke.ps1` — `/health`、`/meta`（728+807）、page-brief v6、steward/redemption、**steward-seat/resign（401 挂载 + multi-demo 200）**、**`multi-demo@test.com` L3 identity_slots 探针**、**`GET /api/v1/admin/capabilities`** + **`GET /api/v1/admin/rbac/route-matrix`**、**`GET /me/wallets`** + **`GET /me/role-applications`** + **Identity P2 `GET /me/*-profile` x4** + **`GET /me/steward-application`** + **`GET /me/steward-seat`** + sessions/security-notifications、wallet-verify、community/profile-avatar、public-catalog（**全栈默认开**） |
| `SKIP_ADMIN_CAPABILITIES_PROBE=1` | 跳过 Step **6b** 后 `check-admin-capabilities-route.sh` 探针 |
| `SKIP_PHASE15_IDENTITY_ROUTES_GATE=1` | 跳过 Step **1b9**（Phase15 `meWallets` / `meRoleApplications` FE 路由对拍） |
| `SKIP_ADMIN_ROUTES_GATE=1` | 跳过 Step **1ba**（Admin 控制台 FE 路由 + `AdminHomeQueuesProvider` 壳层对拍） |
| `SKIP_IDENTITY_P2_ROUTES_GATE=1` | 跳过 Step **1bb**（Identity P2 四轨 profile + guide-exit FE 路由对拍） |
| `SKIP_POST_START_IDENTITY_P2_SMOKE=1` | 跳过 Step **6n** `smoke-identity-p2-settings-local.sh` |
| `TRAVELTRUST_POST_START_IDENTITY_P2_SMOKE=1` | 显式开 Step **6n**（`MANUAL_ACCEPTANCE` 默认已设） |
| `TRAVELTRUST_POST_START_IDENTITY_P2_WARN=1` | Step 6n 失败不阻断启动（仅 WARN） |
| `TRAVELTRUST_POST_START_L3_MULTI_IDENTITY_SMOKE=1` | Step **6p** `smoke-multi-identity-closure-local.sh`（**全栈默认开**） |
| `SKIP_POST_START_L3_MULTI_IDENTITY_SMOKE=1` | 跳过 Step **6p** |
| `TRAVELTRUST_POST_START_L3_MULTI_IDENTITY_WARN=1` | Step 6p 失败不阻断启动（仅 WARN） |
| `TRAVELTRUST_STRICT_API_RATE_LIMIT=1` | Step 5 **不**注入 `API_RATE_LIMIT_PER_MINUTE=0`（与生产同限流；`/admin` 须依赖 `AdminHomeQueuesProvider` 避免 429） |
| `TRAVELTRUST_POST_START_PHASE15_IDENTITY_SMOKE=1` | 启用 Step **6j** `smoke-phase15-identity-demo-local.sh`（默认关；较重） |
| `SKIP_POST_START_PHASE15_IDENTITY_SMOKE=1` | 在已设 `TRAVELTRUST_POST_START_PHASE15_IDENTITY_SMOKE=1` 时仍跳过 6j |
| `TRAVELTRUST_POST_START_PHASE15_IDENTITY_WARN=1` | Step 6j 失败不阻断启动（仅 WARN） |
| `SKIP_POST_START_ABI_CHECK=1` | 跳过 Step 6c 启动后 API 契约烟测 |
| `SKIP_PAGE_BRIEF_GATE=1` | 跳过 Step 1b3 `cargo test page_brief_doc_version` |
| `SKIP_WALLET_VERIFY_ROUTES_GATE=1` | 跳过 Step **1b4**（`lib/api.ts` 与 `lib/api/routes.ts` 钱包验证路径对拍） |
| `SKIP_ME_SECURITY_ROUTES_GATE=1` | 跳过 Step **1b8**（`meSessions` / `meSecurityNotifications` FE 路由对拍） |
| `SKIP_WEB3_ITINERARY_ROUTES_GATE=1` | 跳过 Step **1b5**（Web3 行程 / Escrow 草稿订单 FE 路由对拍） |
| `SKIP_POST_START_WEB3_ITINERARY_SMOKE=1` | 跳过 Step **6f**（及默认合并的 6d+6e 全链烟测） |
| `TRAVELTRUST_POST_START_WEB3_ITINERARY_WARN=1` | Step **6f** 失败不阻断启动（仅 WARN） |
| `TRAVELTRUST_POST_START_META_CHECK=1` | 别名 → 强制 `TRAVELTRUST_POST_START_ABI_CHECK=1` |
| `TRAVELTRUST_POST_START_DEEP_VERIFY=1` | Step 6c 烟测通过后追加 **`check-55-quick-verify.ps1`**（完整 55 运行时验收，较慢） |
| `P3_CHAIN_OFF` | 本地一键默认 **强制 `1`**（mock-pay）；链上 E2E 用 **`TRAVELTRUST_CHAIN_ON=1`** |
| `TRAVELTRUST_CHAIN_ON=1` | 保留根 `.env` 的 `P3_CHAIN_OFF`（如 Anvil 块 `0`） |
| `SKIP_POST_START_ACQUISITION_PD009_SMOKE=1` | 跳过 Step **6h** `smoke-acquisition-pd009-local.sh`（发布保证金 → listing → mock-pay → `/me` trust） |
| `TRAVELTRUST_POST_START_ACQUISITION_PD009_WARN=1` | Step 6h 失败不阻断启动（仅 WARN） |
| `TRAVELTRUST_POST_START_GUIDE_DETAIL_BOOKING_SMOKE=1` | 启用 Step **4b**（API 前清 `f0e0b101-*` 档期 DB 占位）+ Step **6l** `smoke-guide-detail-booking-local.sh`（GD-L5 · `tourist@test.com` 预约建单）；**默认不跑** |
| `SKIP_POST_START_GUIDE_DETAIL_BOOKING_SMOKE=1` | 即使开启上一行也跳过 6l（4b 亦跳过）；`TRAVELTRUST_MARKET_CLEAN=1` 默认已设 |
| `TRAVELTRUST_POST_START_GUIDE_DETAIL_BOOKING_SMOKE_WARN=1` | Step 6l 失败不阻断启动（仅 WARN） |
| `TRAVELTRUST_POST_START_GUIDE_WORKBENCH_L5_SMOKE=1` | 启用 Step **6q**（**全栈默认已设**；`=0` 可关） |
| `SKIP_POST_START_GUIDE_WORKBENCH_L5_SMOKE=1` | 跳过 Step **6q**（`TRAVELTRUST_MARKET_CLEAN=1` 预设默认跳过） |
| `TRAVELTRUST_POST_START_GUIDE_WORKBENCH_L5_SMOKE_WARN=1` | Step 6q 失败不阻断启动（仅 WARN） |

## 向导四职责 GWB-L5（① · Order Corridor Closure · 2026-06-12）

| 职责 | 路由 | 说明 |
|------|------|------|
| **经营** | `/guide` | 收件箱（`guide_id` SSOT）· 市场曝光 · 经营统计；**无**准入 checklist |
| **准入** | `/me/settings/trust` | 邮箱→钱包→KYC→向导资质→挂牌（**唯一真源**） |
| **编辑** | `/me/identities/guide/settings` | 挂牌表单；**仅 dirty 或头像待保存** 时显示市场预览 |
| **接待订单** | `/orders?hat=guide` · `/escrow/[id]` | 向导专属列表；多重身份下旅客单不进此走廊 |
| **旅客订单** | `/orders` | 与 `hat=guide` 分离；「我的旅客订单」链回此页 |

| 项 | 说明 |
|----|------|
| **账号** | `guide@test.com` / `Test123!`；演示：`multi-demo@test.com` / `Test123!` |
| **Step 6q** | vitest（`guideOrderCorridor*` + Trust + settings）+ API（guide@test + multi-demo 走廊旁证）；**全栈默认**；**不**含 Playwright |
| **烟测** | `bash scripts/dev/smoke-guide-workbench-l5-local.sh` |
| **全页证据** | `TRAVELTRUST_EVIDENCE_REUSE_API=1 bash scripts/dev/record-guide-workbench-l5-evidence.sh`（API 已由一键栈拉起时复用，避免杀端口） |
| **冻结 SSOT** | `frontend/evidence/GO_local_guide_workbench_l5/GUIDE-WORKBENCH-L5-FREEZE.md` |
| `TRAVELTRUST_POST_START_ITINERARY_DATE_AS_SOURCE_SMOKE=1` | 启用 Step **6m** `smoke-itinerary-date-as-source-busy-guide-local.sh`（忙档向导 **409** · itinerary-date-as-source 门闸）；**默认不跑** |
| `SKIP_POST_START_ITINERARY_DATE_AS_SOURCE_SMOKE=1` | 即使开启上一行也跳过 6m；`TRAVELTRUST_MARKET_CLEAN=1` 默认已设 |
| `TRAVELTRUST_POST_START_ITINERARY_DATE_AS_SOURCE_WARN=1` | Step 6m 失败不阻断启动（仅 WARN） |
| `SKIP_POST_START_ESCROW_BIND_SMOKE=1` | 跳过 Step **6d** Escrow 绑定向导 API 烟测 |
| `TRAVELTRUST_POST_START_ESCROW_BIND_WARN=1` | Step 6d 失败不阻断启动（仅 WARN） |
| `SKIP_POST_START_LANDING_ITINERARY_SMOKE=1` | 跳过 Step **6e** Landing 行程天数 API 烟测 |
| `TRAVELTRUST_POST_START_LANDING_ITINERARY_WARN=1` | Step 6e 失败不阻断启动（仅 WARN） |
| `TRAVELTRUST_MARKET_CLEAN=1` | **市场走查**：跳过 **6f** + **6h** + **6n** + **6p** + **6m** + 强制 **`TRAVELTRUST_MARKET_PUBLIC_SURFACE=1`**；建议同批 **`RESET_DOCKER_DB=1`** |
| `TRAVELTRUST_MARKET_PUBLIC_SURFACE=1` | API 过滤内部向导 / 烟测 discover 行（**`P3_CHAIN_OFF=1` 且未设时默认等同**） |
| `TRAVELTRUST_MARKET_PUBLIC_SURFACE=0` | 关闭过滤（调试烟测全量列表） |
| `TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET=1` | **全栈默认**（未设即 `1`）：`guide@test.com` 出现在公众 **`GET /guides`**，支持 **`/market`** 正常选向导 UI；`=0` 与其它测试账号同隐藏 |
| `TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET=0` | 关闭 seed 向导市场可见性（仍可通过 Admin/内部路径调试） |
| `TRAVELTRUST_ENSURE_DB_MIGRATIONS_WARN=1` | Step 3d 失败仅 WARN |
| `SKIP_CLEAR_HANGZHOU_GUIDE_SLOTS=1` | 跳过 Step **3f** 杭州公众 catalog 向导档期 DB 清理 |
| `SKIP_BOOTSTRAP_GD_P06_PUBLIC_CATALOG=1` | 跳过 Step **6b4** `POST /auth/seed-trust-gate-e2e` + 向导探针 |
| `TRAVELTRUST_BOOTSTRAP_GD_P06_WARN=1` | Step 6b4 失败不阻断启动（仅 WARN） |
| `SKIP_ENSURE_COMMUNITY_MINIO=1` | 跳过 Step **3e** 社区 MinIO `:19000` |
| `TRAVELTRUST_ENSURE_COMMUNITY_MINIO_WARN=1` | Step 3e MinIO 失败不阻断 |
| `SKIP_POST_START_COMMUNITY_MEDIA_ALIGN_SMOKE=1` | 跳过 Step **6i** 社区媒体 API+DB 对齐烟测 |
| `TRAVELTRUST_POST_START_COMMUNITY_MEDIA_ALIGN_WARN=1` | Step 6i 失败不阻断 |
| `TRAVELTRUST_API_CLEAN_BUILD=1` | Step 4 前 `cargo clean -p traveltrust-api`（迁移路径 `os error 3` 时用） |
| `SKIP_POST_START_MARKET_HUB_SMOKE=1` | 跳过 Step **6g** `/market` 公开读面烟测（`vertical-slice-03`） |
| `TRAVELTRUST_POST_START_MARKET_HUB_WARN=1` | Step 6g 失败不阻断启动（仅 WARN） |

## 门禁矩阵（① 本地 · API / ABI / 路由）

| Step | 检查项 | 默认全栈 | `TRAVELTRUST_UI_HANDOFF=1` | `TRAVELTRUST_SITE_THEME_V1=1` | `TRAVELTRUST_FRONTEND_ONLY=1` |
|------|--------|----------|----------------------------|-------------------------------|-------------------------------|
| 0 | Docker / Rust / Node / `.env` 预检 | ✅ | ✅ | ✅ | ✅（**仅 Node**） |
| 0b | `npm run clean` | ⏭ | ✅ | ✅ | 可选 |
| 1 | SQLx 迁移前缀唯一 | ✅ | ✅ | ✅ | ⏭ 跳过 |
| 1b0 | **协议 ABI 存在**（三件套 + **17-contract** `verify-abi-forge.py` multiset；默认 `TRAVELTRUST_ABI_SYNC_FROM_FORGE=1` 时 drift 自动 `-FromForge`） | ✅ 默认 | ✅ | ✅ | ⏭ 跳过 |
| 1b | **55-S13 复制对齐** `align-api-abi-local.ps1`（六件套 → `frontend/dapp/abis` + gate；失败再 `-FromForge`） | ✅ 默认 | ✅ | ✅ | ⏭ 跳过 |
| 1b3 | **page-brief** `cargo test page_brief_doc_version`（ia_version **v6**） | ✅ | ✅ | ✅ | ⏭ 跳过 |
| 1b4 | **钱包验证 FE 路由** `check-frontend-api-routes-wallet-verify.ps1`（`api.ts` ↔ `api/routes.ts`） | ✅ | ✅ | ✅ | ⏭ 跳过 |
| 1b5 | **Web3 行程 FE 路由** `check-frontend-api-routes-web3-itinerary.ps1`（`orderPatchGuide` · `guideAvailability` 等） | ✅ | ✅ | ✅ | ⏭ 跳过 |
| 1ba | **Admin 控制台 FE 路由** `check-frontend-api-routes-admin.ps1` | ✅ 默认 | ✅ | ✅ | ⏭ 跳过 |
| 1bb | **Identity P2 profile + guide-exit FE 路由** `check-frontend-api-routes-identity-p2.ps1` | ✅ 默认 | ✅ | ✅ | ⏭ 跳过 |
| 1b2 | forge ABI multiset（须 `TRAVELTRUST_ABI_FORGE_VERIFY=1`） | 可选 | 可选 | 可选 | ⏭ |
| 1c | **04 路由表** `run-check-04-routes`（API 挂载 + 前端路由） | ✅ | ⏭ 默认跳过 | ⏭ 默认跳过 | ⏭ 跳过 |
| 1d | Resend 出站变量 | ✅ | ⏭ 默认跳过 | ⏭ 默认跳过 | ⏭ 跳过 |
| 3 | Docker **`ensure-docker-stack.ps1`**（复用已跑 Postgres；`RESET_DOCKER_DB=1` → `down -v`） | ✅ | ✅ | ✅ | ⏭ 跳过 |
| 3b | **`wait-for-postgres.ps1`** | ✅ | ✅ | ✅ | ⏭ |
| 3d | **`ensure-api-db-migrations.ps1`** — `sqlx migrate run` + PG **legacy + CMS + Official OPS + Growth + Sprint168 + guides P2 cols + `guide_exit_requests`**（至 **20260613120000**） | ✅ 默认 | ✅ | ✅ | ⏭ |
| 3e | **`ensure-community-media-minio.ps1`** — MinIO `:19000` 持久卷 + 桶 + 合并 **`COMMUNITY_MEDIA_S3_*`** 到根 `.env` | ✅ 默认 | ✅ | ✅ | ⏭ |
| 3f | **`run-clear-hangzhou-seed-guide-slots-db.ps1`** — GD/P06 **`f0e0b101-*`** 档期清库（API 前） | ✅ 默认 | ✅ | ✅ | ⏭ |
| 3c | **TTG Anvil** deploy + `.env`（`TRAVELTRUST_TTG_ANVIL=1` 或 `.env` 含 TT ANVIL 块自动开） | ⏭* | ⏭* | ⏭* | ⏭ |
| 4–6 | 编译 API、健康、seed、**6b5**（含 **multi-demo** 登录）、**6c** ABI smoke（含 **L3 multi-demo 探针**）、**6p** L3 全链 smoke、**6k**、… | ✅ | ✅ | ✅ | ⏭（假定 API 已起） |
| 7 | `frontend/.env.local` **NEXT_PUBLIC_*** 与 API 端口同步 | ✅ | ✅ | ✅ | ✅ |
| 7b | **traveltrust-home** vitest（`run-traveltrust-home-vitest.ps1` · `TRAVELTRUST_HOME_VITEST=1`） | ⏭ | ✅ 默认 | ⏭ | ⏭ |
| 7c | **site theme V1** vitest §6.1 bundle（`run-site-theme-v1-vitest.ps1`） | ⏭ | ⏭ | ✅ 默认 | ⏭ |
| 7d | **community drawer** vitest（`run-community-drawer-vitest.ps1` · PostDetail 切帖 + feed 横幅合约 · `TRAVELTRUST_COMMUNITY_VITEST=1`） | ✅ 默认 | ✅ 默认 | ⏭ | ⏭ |
| 7e | **community profile IA** vitest（`run-community-me-l5-vitest.ps1` · `TRAVELTRUST_COMMUNITY_ME_VITEST=1`） | ⏭ | ⏭ | ⏭ | ⏭ |
| 8b | **wait-for-frontend-ready.ps1**（`TRAVELTRUST_WAIT_FE_READY=1` · `/traveltrust` 或 `/`） | ⏭ | ✅ 默认 | ⏭ | ⏭ |

**本轮机读结论（仓库根执行）**：`check-55-s13.ps1` **PASS**；`run-check-04-routes.ps1` **PASS**（含 `check-04-routes-vs-code`、`check-04-frontend-routes-vs-app`）。

**改合约 / ABI 后**：勿长期 `SKIP_ABI_GATE=1`。推荐 `set TRAVELTRUST_ABI_SYNC_FROM_FORGE=1` 后重跑全栈（Step 1b 自动 `align-api-abi-local.ps1 -FromForge`，含 **CountryPoolSubVaultsV0**），或手动 `scripts\dev\align-api-abi-local.ps1 -FromForge` / `scripts\sync-abi-from-forge.ps1` + `check-55-s13.ps1`。

**不等于**发版级深度多维（`ci-local` / `local-delivery-expanded` / 31 全文 / 96-15 Tier C）— 见 [TT-GATE](../../docs/runbook/TT-GATE-COVERAGE-vs-96-15-GAP-REGISTRY-001.md)。

## 端口与数据

- Step 0a 解析 `BACKEND_PORT` / `FRONTEND_PORT`（常见 8080 / 3012）
- 未设 `DATABASE_URL` 时 API 窗口注入 Docker 默认串
- **Step 3** 调用 `scripts/dev/ensure-docker-stack.ps1`：Postgres 已在跑则复用，避免 `compose up` 容器名冲突；`RESET_DOCKER_DB=1` 时 `compose down -v` 后重建
- **Step 3d** 调用 `scripts/dev/ensure-api-db-migrations.ps1`：Postgres ready 后显式 `sqlx migrate run`（与 API 启动内嵌 migrator 同源）；无 sqlx-cli 时 WARN 并继续
- **Step 6c** `post-start-api-abi-smoke.ps1` 追加 **`GET /api/v1/discover/orders`** + **`GET /api/v1/guides`**（与 `useMarketPage` / **vertical-slice-03** 对齐）
- **Step 6g** 默认跑 **`vertical-slice-03-market-hub-public-smoke.sh`**（Git Bash + jq；`SKIP_POST_START_MARKET_HUB_SMOKE=1` 跳过）
- **Step 4** 校验 `crates/api/migrations/` 存在；API 须在**仓库根** `cargo run -p traveltrust-api`（迁移路径 `env!("CARGO_MANIFEST_DIR")/migrations`）
- **迁移失败**（日志 `while resolving migrations` + `os error 3`）：`set TRAVELTRUST_API_CLEAN_BUILD=1` 后重跑；或手动 `cargo clean -p traveltrust-api` + `cargo build -p traveltrust-api`

## 停止（不关 Docker）

- **`scripts\stop-all.bat`** 或 **`./scripts/stop_dev.sh`**

## 文档

- `docs/测试账号与本地联调.md`
- `scripts/README.md`
