# TT-9618 · 96-18 准入费：本地与测试网闭环（无 CI、无真实主网链）

**Status:** Living  
**Scope:** 覆盖 **① 本地** 与 **② 测试网** 验证 **PostgreSQL + API +（可选）Next +（可选）Stripe**；**不**替代 **GitHub CI**、**不**要求 **真实主网链**、**不**宣称 **生产 PCI / GO** 已闭。**③ 公网 / 生产真实链路** 不在本 Runbook 完成标准内（见根 **README**「工程规划方向」**阶段 B**）。

### 验收顺序（三阶 · 强制）

与根 **[README](../../README.md)**「工程规划方向」一致：**须顺序递进，禁止跳阶。**

1. **① 本地**：本机或 Docker；**`cargo test` / Vitest / `npm run build`**、可选 **Playwright** shell（**§4**）等；证据可复现即可。  
2. **② 测试网**：测试域名、测试 **PostgreSQL**、**Stripe test**、指向测试 API 的回调/网关；**在 ① 通过后再做**本阶复现（本 Runbook **§3.1** 检查表 + **§3.2** **Stripe 公网 webhook** 手工程序 + **§2～§4** 命令与证据）。**禁止**仅用 **①** 对外宣称「已在测试网验收」。  
3. **③ 公网 / 生产真实链路**：生产 PSP、公网 webhook、主网 **`CHAIN_RPC_URL`**、**go-live** 等 — **单独立项、单独门禁**；**禁止**用 **①②** 混句宣称「已生产 / 已主网闭」。详见 **96-18** 主文 **§0**、**[go-live-checklist](../go-live-checklist.md#go-decision-entry-point)**。

### 工程节奏（两阶段 · 与上列对应关系）

| 阶段 | 对应验收阶 | 环境 | 本 Runbook 下的「跑通」指什么 | **不**混入本阶段完成标准的项 |
|------|------------|------|------------------------------|--------------------------------|
| **A · 当前** | **① + ②** | **本地**（本机 / Docker）与 **测试网**（测试域名、**test** Stripe、测试 **PostgreSQL**） | **PG migrate + `chain_off.db_pool` + 04-附录 onboarding 路径**（报价、支付意图、资格、内网 webhook、可选 Stripe webhook）可按 **§2～§4** 与 **`scripts/dev/*`** 复现；命令见 **§4** | **主网 `CHAIN_RPC_URL`**、**链上收款 / OnboardingFeeReceiver**、**go-live 主网 P0** |
| **B · 后续** | **③** | **主网 / 真链 / 生产资金** | 见 **96-18** 主文 **§6**、**ops/RUNBOOK** 触链与 **95/96-05** 门禁；**单独立项、单独证据** | 禁止用「阶段 A 已 green」**冒充**主网经济或全站 **GO** |

### 文档互指（机读错态与页面）

- **HTTP 草案 / `error` 枚举 / 内网 webhook 边缘闸：** **[04-附录-商家主理人准入费HTTP契约草案-配96-18](../spec/04-附录-商家主理人准入费HTTP契约草案-配96-18.md)** **v1.0.32+** **§1～§2**（**Declaration** **机读下限** **仍** **见** **Hub** **`04-附录 §2 ≥v1.0.31`**）。  
- **路由 SSOT 与准入页：** **[04-后端与API §3.4](../spec/04-后端与API.md)** **读前摘要**（**96-18** 行）及 **页面路由表** **`/me/onboarding`**；前端 **`frontend/lib/apiClient/core.ts`**、**`mapOrderWriteError`**、**`locales`** 与附录 **「前端机读」** 段对拍。  
- **前端架构（无 BFF）与准入费 env Owner 域：** **本栈** **无** 独立 **BFF** — **`frontend/next.config.js`** **`rewrites`** 将 **`/api/v1/:path*`** **同源反代** 至 **`NEXT_PUBLIC_API_BASE_URL`**（与 **`frontend/lib/api.ts`** 同源）；**运维** **`ONBOARDING_*` / `TRAVELTRUST_ONBOARDING_*` · 建议责任域模板** **[96-10 §2.2](../spec/96-10-配置灰度与特性开关.md)**（**具名 Owner + [220](../spec/220-阶段配置中心-Config-Center.md)** 仍须变更单）。  
- **主文 / 工作台账：** **[96-18](../spec/96-18-商家与主理人准入费用与治理币兑换设计.md)** · **[96-18-未完成清单 · 一页优先级 / backlog](../spec/96-18-未完成清单与多维检查.md#9618-one-page-priority)** **v1.0.118+**（**[`cargo test` 速查 · `#9618-cmd-cheatsheet`](../spec/96-18-未完成清单与多维检查.md#9618-cmd-cheatsheet)**；**批次台账** **[`#9618-batches`](../spec/96-18-未完成清单与多维检查.md#9618-batches)**）。  
- **UI / a11y / i18n 走查（准入费页）：** **[96-13](../spec/96-13-UI-UX-i18n-a11y-性能走查.md)** **P0** **与** **`/me/onboarding`** **并联** **[96-16](../spec/96-16-全页面UI-UX优化方案总册.md)** **矩阵**（**§0** **`/me/onboarding`** **SSOT** **行**）；**G6～G9** **缺口** **台账** **见** **上条** **96-18-未完成** **§0～§2**。  
- **贡献者 · PR 前 PG 机读一键：** **[CONTRIBUTING.md](../../CONTRIBUTING.md)** **「必读入口」** **行** **「96-18 准入费 · PG 机读一键」** **与** **「提 PR 前」** **建议段**；**[`.env.example`](../../.env.example)** **`DATABASE_URL`** **段旁注释**；执行与筛子见 **§3.5.3**、**[`93-matrix-batch-tracker`](./93-matrix-batch-tracker.md)** **互指表** **「TT-9618」** **行**。  
- **未封口 TT 草稿 / 1 人极简节奏（同主题 `#9618`）：** **[AI任务卡索引.from-stash.md](../AI任务卡索引.from-stash.md)** **篇首** **与** **[AI任务卡索引.md](../AI任务卡索引.md)** **`#9618`** **专段** **对读**；**可选** **周节奏** **见** **[路线图-1人开发极简版.md](../路线图-1人开发极简版.md)** **§0～§2**（**真源** **仍** **以** **96-18-未完成** **与** **本** **Runbook** **为准**）。  
- **Admin 运营 HTTP 机读：** **[04 §3.5](../spec/04-后端与API.md)** **`/api/v1/admin/onboarding/*`**；本页 **§3.3** **curl** 卡片。  
- **Admin 通用 jobs（`async_jobs` / 04 §3.4）：** **`GET /api/v1/admin/jobs?queue_name=onboarding_webhook`**（须 **`admin`/`super_admin`**；**`ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR=1`** 时与 **`onboarding_webhook_jobs`** **镜像** **对拍**）；**[04 §3.4](../spec/04-后端与API.md)**；**PG·IT** **`matrix_93_admin_onb_031_*`**（**含于** **§3.1 步 5** **`cargo test … matrix_93_admin_onb`** **/** **§3.5.3** **一键脚本**）。  
- **批次 B · 拒服审计 stderr / 96-03 密钥清单：** 本页 **§3.4**；主 SSOT **[96-03](../spec/96-03-安全密钥与供应链.md)**。  
- **Hub · Declaration 机读下限（与 00 台账对拍）：** **[96-索引 · 95-96 Execution Linkage Declaration](../spec/96-索引-全链路外生产验收分册.md#95-96-execution-linkage-declaration)** — **96-18 ≥v1.2.37**、**04-附录 §2 ≥v1.0.31**、**93 §8.4 ≥v1.4.77**（**Hub** 正文 **Version** 见 **[00 · 文档版本与最后更新](../spec/00-文档索引.md#文档版本与最后更新)**）。**文首** **「创建 / 拆分」** **`00`/`Declaration`** **对拍** **须** **与** **`[00]`** **表体** **一致**（**bumps** **须** **Hub / `00` / 96-18-未完成** **同批**；**96-18-未完成 §5**）。**`#9618` 入口：** 根 **[README](../../README.md)** **`#9618-one-page-priority`** / **`#9618-cmd-cheatsheet`** **↔** **[96-18-未完成 §4](../spec/96-18-未完成清单与多维检查.md#9618-cmd-cheatsheet)** **·** **批次台账** **[§1 `#9618-batches`](../spec/96-18-未完成清单与多维检查.md#9618-batches)** **v1.0.118+**。

---

## 1. 前置条件

| 项 | 说明 |
|----|------|
| **PostgreSQL** | **`DATABASE_URL`** 已配置，API 已 **`sqlx migrate`**；否则 **`onboarding_payment_not_configured`** / 资格 **stub**。 |
| **`chain_off`** | 本地全栈须 **挂载 `db_pool`**（与 **04** 一致）。 |
| **内网 Webhook** | **`INTERNAL_API_SECRET`** 非空；请求头 **`X-Internal-Api-Secret`** 同值。 |
| **可选 HMAC** | 若 API 设 **`ONBOARDING_WEBHOOK_HMAC_SECRET`**，脚本或手工 **`curl`** 须带 **`X-Onboarding-Webhook-Signature: v1=<hex>`**（与 **`scripts/dev/onboarding-webhook-local.sh`** 一致）。 |
| **可选边缘硬闸** | 若 API 设 **`ONBOARDING_INTERNAL_WEBHOOK_ALLOWLIST_CIDRS`**：请求须带可解析对端 IP（**`X-Forwarded-For`** 首跳或 **`X-Real-Ip`**）；**`scripts/dev/onboarding-webhook-local.sh`** 默认 **`X-Forwarded-For: 127.0.0.1`**（可用 **`ONBOARDING_WEBHOOK_X_FORWARDED_FOR`** 覆盖）。若设 **`ONBOARDING_INTERNAL_WEBHOOK_REQUIRE_HTTPS_FORWARDED=1`**：须 **`X-Forwarded-Proto: https`**（脚本默认注入；**`ONBOARDING_WEBHOOK_X_FORWARDED_PROTO`** 可覆盖）。**mTLS** 在 **Ingress** 终止时由网关校验客户端证书，**应用进程不读 mTLS**。 |
| **Stripe（可选）** | **`TRAVELTRUST_ONBOARDING_STRIPE_ENABLED=1`** + **`TRAVELTRUST_STRIPE_SECRET_KEY`**；Webhook 端点 **`POST /api/v1/hooks/stripe/onboarding`** + **`TRAVELTRUST_STRIPE_WEBHOOK_SECRET`**；前端 **`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`**。测试网把 **`API_BASE_URL`** 换成网关 **HTTPS**。 |

---

## 2. 闭环 A：内网 JSON Webhook（无 Stripe）

1. 启动 API（及可选 Next），登录后打开 **`/me/onboarding`**。  
2. **创建支付意图**，从 JSON 复制 **`idempotency_key`**（或自行使用 UUID 作为 **`Idempotency-Key`** 头）。  
3. 仓库根执行：

```bash
export INTERNAL_API_SECRET=…
export API_BASE_URL=http://127.0.0.1:8080   # 测试网改为 https://你的 API
# 可选：export ONBOARDING_WEBHOOK_HMAC_SECRET=…
bash scripts/dev/onboarding-webhook-local.sh "<idempotency_key>"
```

4. 页面 **刷新资格** → **申请角色解锁**（须 **paid**）。

---

## 3. 闭环 B：Stripe（测试密钥 / 测试网 URL）

1. Stripe Dashboard 使用 **test mode**；**Webhook** 指向 **`https://<测试网 API>/api/v1/hooks/stripe/onboarding`**，保存 **`whsec_…`** → **`TRAVELTRUST_STRIPE_WEBHOOK_SECRET`**。  
2. 本地转发调试用 Stripe CLI（示例）：

```bash
stripe listen --forward-to http://127.0.0.1:8080/api/v1/hooks/stripe/onboarding
```

将 CLI 打印的 **`whsec_…`** 临时写入 API 环境（与 Dashboard 二选一即可，勿混用生产）。  
3. 前端配置 **`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`**（与 **sk_test** 同账户）。  
4. 用户流：**创建 intent → 页面卡支付 → `payment_intent.succeeded` → 刷新资格 → role-confirm**。

---

## 3.1 测试网验收清单（验收阶 **②**）

在 **§2～§3** 于 **① 本机** 跑通后，再将 **基址 / 密钥 / 回调** 切到 **测试网** 复现一遍；**禁止**仅用 **①** 对外写「已在测试网验收」。与根 **[README](../../README.md)**「工程规划方向」**阶段 A** 一致。

若对外写「**② 已跑机读门禁**」，**至少**须满足步骤 **5～6** 的前提：**Runner 能直连测试网 PostgreSQL**，**`DATABASE_URL`** 指向该库且迁移集与当前 **API** 镜像一致；**未设** **`DATABASE_URL`** 时相关用例 **skip**，**不得**单凭 **①** 的 skip 结果冒充 **②**。可选 **步 7** 收窄 **Stripe 验签 → `paid`**（**API·IT**，**非** Stripe 真网投递）。

| 步 | 要点 |
|----|------|
| 1 | **`API_BASE_URL`**（脚本、cURL、运维备忘）与前端 **`.env.example`** 所载 **`NEXT_PUBLIC_…`** 指向 **测试网 HTTPS API**；**`DATABASE_URL`**、**`whsec_…`**、**`TRAVELTRUST_STRIPE_SECRET_KEY`** **与生产隔离**（**禁止**混用同一 **`whsec`**）。 |
| 2 | **PostgreSQL**：测试库已 **`sqlx migrate`**；**`chain_off.db_pool`** 与 **§4** 命令所用的 **API** 镜像/二进制版本与本地 **①** 无未迁移偏差。 |
| 3 | **内网 webhook**：在能 **直连测试网 API** 的主机执行 **§5** 卡片或 **`scripts/dev/onboarding-webhook-local.sh`**，**`API_BASE_URL=https://<测试网 API>`**；**`X-Internal-Api-Secret`**、可选 **HMAC / 重放窗 / allowlist** 与部署一致；**勿**在浏览器打开 **`/api/v1/internal/...`**。 |
| 4 | **Stripe**：Dashboard **test mode**；**Webhook URL** **`https://<测试网 API>/api/v1/hooks/stripe/onboarding`**；若 API **无公网入站**，用 **`stripe listen --forward-to https://…`** 在可达网络的主机上转发（**`whsec`** 须与当前转发实例匹配）。 |
| 5 | **机读 · Admin 台账（PG）**：**`DATABASE_URL=<测试网 PG>`**（与步 **2** 同源）下 **`cargo test -p traveltrust-api matrix_93_admin_onb`** — 期望 **0 failed**（含 **§3.3** **`webhook-jobs`/`webhook-dlq`/`compliance-audit-events`** 与 **`021_*`/`022_*`/`026_*`/`028_*`** 证据名；**`029`/`030`** **`financial-reversal`**；**`031_*`** **`GET …/admin/jobs?queue_name=onboarding_webhook`** **与** **`async_jobs`** **镜像** **对拍** — **[04 §3.4](../spec/04-后端与API.md)**）。 |
| 6 | **机读 · 准入写路径 + 合规拒服落库（PG）**：同上 **`DATABASE_URL`** 下 **`cargo test -p traveltrust-api matrix_93_b_onb_006`** — 期望 **0 failed**（**`matrix_93_b_onb_006_*`** **`POST …/payment-intents`**；**`matrix_93_b_onb_006b_*`** **`POST …/role-confirm`**：**403** **`onboarding_forbidden_sanctions`** + **`onboarding_compliance_audit_events`** **COUNT=1** / **`route`** 与路径一致；**续** **`006e`～`006g`** **`list_file`**（**403/200/503** **`onboarding_compliance_screening_unavailable`**）；**`006h_*`** **`role-confirm`** **`list_file`** **403**；**`006i_*`**/**`006k_*`** **`role-confirm`** **`list_file`** **503** **`onboarding_compliance_screening_unavailable`**（**含** **超字节**）；**`006j_*`** **`payment-intents`** **`list_file`** **503** **超字节**；**`006l_*`/`006m_*`** **`list_file`** **503** **>100k** **行**（各用例写 **100001** 行临时文件，全矩阵 **`006`** 耗时较仅 **denylist** 略长）；**`006n_*`/`006o_*`** **`list_file`** **503** **非法 UTF-8**；**非** OFAC）。 |
| 7 | **机读 · Stripe 验签 webhook（可选）**：同上 **`DATABASE_URL`** 下 **`cargo test -p traveltrust-api matrix_93_d_onb_005_f036_ext`** — 期望 **0 failed**（**`matrix_93_d_onb_005_f036_ext_*`** → **`paid`**；用例内临时写入**合成** **`TRAVELTRUST_STRIPE_WEBHOOK_SECRET`**（**`whsec_…`**），**不**调 Stripe API）。**与** **§3.2 步 6** **同命令、同用例名**；**不能**替代 **步 4** **真 listen / Dashboard 投递** 或 **Playwright Elements** 全链。**续**：**`cargo test -p traveltrust-api matrix_93_d_onb_017`** — **`charge.refunded`** **部分退款审计 → 全额 `refunded`**（**`matrix_93_d_onb_017_*`**）；再 **`014`/`016`** — **`charge.dispute.funds_withdrawn`** **`paid→revoked`** **与终态幂等审计**（**`matrix_93_d_onb_014_*`/`016_*`**）；**[§3.5.3](#tt-9618-pg-evidence-one-shot)** 一键脚本在 **`005` 后** 已串跑 **017→014→016**。 |
| 8 | **证据**：保留脱敏请求片段或工单链；结论句**不**把 **②** 与 **③ 生产 GO** 合并表述。 |
| **一键** | **步 5～7**（含 **`005_f036_ext`** + **`017`** **`charge.refunded`** + **`014`/`016`** **`charge.dispute.funds_withdrawn`**）可合并执行：**[§3.5.3](#tt-9618-pg-evidence-one-shot)** **`bash scripts/gates/tt-9618-onboarding-pg-evidence.sh`**（须 **`DATABASE_URL`**；未设 **exit 2**）。**可选**：**`CHECK_FRONTEND_NPM_BUILD=1`** 同次 **`npm run build`**（**§3.5.3**）。 |

---

## 3.2 Stripe 公网 Webhook（`payment_intent.succeeded` / Checkout）— 与 **internal JSON** 的区别

**Playwright** **`optional: PG + internal webhook → paid`**（**§4** 末段）走 **`POST /api/v1/internal/onboarding/payments/webhook`** + **`X-Internal-Api-Secret`**，**不**经过 **`Stripe-Signature`**，**不能**替代「**Stripe → 公网端点 → 验签 → `paid`**」证据链。

要在 **① / ②** 收窄 **Stripe 公网路径**（仍属 **Partial**，**非** **③ 生产 GO**）：

| 步 | 要点 |
|----|------|
| 1 | API 配置 **`TRAVELTRUST_STRIPE_WEBHOOK_SECRET`**（**`whsec_…`**，与 **Dashboard 测试端点** 或 **`stripe listen`** 打印值**一致**；**勿**与生产混用）。未配置时 **`POST …/hooks/stripe/onboarding`** → **503** **`stripe_webhook_not_configured`**。 |
| 2 | **`stripe listen --forward-to http://127.0.0.1:8080/api/v1/hooks/stripe/onboarding`**（**①**）或 **`https://<测试网 API>/api/v1/hooks/stripe/onboarding`**（**②**）；将 **`whsec`** 写入 API 进程环境。 |
| 3 | **`TRAVELTRUST_ONBOARDING_STRIPE_ENABLED=1`** + **`TRAVELTRUST_STRIPE_SECRET_KEY`**（**sk_test**）；**`POST …/payment-intents`** 落 **`pending`** 且响应体须带 **`metadata.traveltrust_idempotency_key`**（与 **幂等头** 同源，供 webhook 读 **`payment_intent.metadata`**）。 |
| 4 | 用 **Stripe test 卡 / Elements / Hosted Checkout** 完成支付，使 Stripe **投递** **`payment_intent.succeeded`**（或 **`checkout.session.completed`** **`payment_status=paid`**）到上列端点；再 **`GET …/entitlements/me`** 断言 **`paid`**。 |
| 5 | **`stripe trigger payment_intent.succeeded`** **等 CLI 合成事件** **通常不含** 本栈写入的 **`metadata.traveltrust_idempotency_key`**，**不能**单独当作 **「intent→paid 已接线」** 的充分证据；以 **真实 test PI** 或 **Dashboard 重放** 为准。 |
| 6 | **API·IT（合成 `whsec`，非 Stripe 真网）**：**`cargo test -p traveltrust-api matrix_93_d_onb_005_f036_ext`** — **`onboarding_app_stack_db_api_tests`** 内 **`matrix_93_d_onb_005_f036_ext_stripe_payment_intent_succeeded_webhook_paid_app_stack_ok_pg`**：**`POST …/payment-intents`** → **`POST …/hooks/stripe/onboarding`**（**`Stripe-Signature`** + **`payment_intent.succeeded`** **`metadata.traveltrust_idempotency_key`**）→ **`GET …/entitlements/me`** 含 **`paid`**；须 **`DATABASE_URL`** 已迁移（未设则 **skip**）。**不**替代 **Playwright** 浏览器 **Elements** 全链。**测试网 ② 机读** 同命令亦登记于 **§3.1 步 7**（免重复成文）。 |

**单元侧**：**`crates/api/src/stripe_onboarding.rs`** — **`verify_stripe_signature_roundtrip`**、**`build_stripe_webhook_signature_header_verify_roundtrip`**（**`cargo test -p traveltrust-api build_stripe_webhook_signature_header_verify_roundtrip`**）。

---

## 3.3 Admin 运营与 webhook 队列台账（70 / 96-09 · 可选）

**目的**：在 **① / ②** 用 **admin 会话** 核对 **`onboarding_entitlements` / `onboarding_payment_events`** 与（若开启异步）**`onboarding_webhook_jobs` / `onboarding_webhook_dlq`**，**不**替代 **OFAC**、**mTLS** 或 **③ 生产 GO**。

| 项 | 说明 |
|----|------|
| **鉴权** | **`Authorization: Bearer <tts_…>`** 须为 **`admin`/`super_admin`**（与 **`GET …/admin/observability/overview`** 同源）；测试网可用 **`INTERNAL_API_SECRET` + `POST …/internal/testnet-mint-admin-bearer`**（见根 **`.env.example`** **TT-B435** 段）。 |
| **`GET …/admin/users/:id/onboarding-entitlements`** | 目标 **`user_id`** 须在 **`ChainOffStore`** 物化（与 **`GET …/admin/users/:id`** **404** 口径一致）；否则 **404** **`user_not_found`**。 |
| **异步入队** | **`ONBOARDING_WEBHOOK_ASYNC_QUEUE=1`**（见 **`.env.example`**）；**`ONBOARDING_WEBHOOK_QUEUE_INLINE_DRAIN=0`** 时 handler 可 **202** + 后台 **`tokio::spawn`**。 |

```bash
export API_BASE_URL='http://127.0.0.1:8080'
export ADMIN_BEARER_TOKEN='tts_…'   # 须为 admin/super_admin 会话
API="${API_BASE_URL%/}"

curl -sS "${API}/api/v1/admin/onboarding/entitlements?limit=10" \
  -H "Authorization: Bearer ${ADMIN_BEARER_TOKEN}" | jq .

curl -sS "${API}/api/v1/admin/onboarding/webhook-jobs?limit=20" \
  -H "Authorization: Bearer ${ADMIN_BEARER_TOKEN}" | jq .

curl -sS "${API}/api/v1/admin/onboarding/webhook-dlq?limit=20" \
  -H "Authorization: Bearer ${ADMIN_BEARER_TOKEN}" | jq .

curl -sS "${API}/api/v1/admin/onboarding/compliance-audit-events?limit=20" \
  -H "Authorization: Bearer ${ADMIN_BEARER_TOKEN}" | jq .

# 可选（ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR=1）：async_jobs 单列队镜像，与 04 §3.4 / matrix_93_admin_onb_031_* 对拍
# curl -sS "${API}/api/v1/admin/jobs?queue_name=onboarding_webhook&limit=50" \
#   -H "Authorization: Bearer ${ADMIN_BEARER_TOKEN}" | jq .

# 可选：按用户过滤（须为 UUID）
# curl -sS "${API}/api/v1/admin/onboarding/compliance-audit-events?user_id=<UUID>&limit=20" \
#   -H "Authorization: Bearer ${ADMIN_BEARER_TOKEN}" | jq .
```

**证据**：**`cargo test -p traveltrust-api matrix_93_admin_onb`**（须 **`DATABASE_URL`**；未设则各用例 **skip**）。**`compliance-audit-events`**：**`user_id`/`limit`** **query** **语义** 与 **`webhook-jobs`/`webhook-dlq`** **同证**（**`021_*`** / **`022_*`**）；**denylist** **落库**（**`028_*`**：**`payment-intents`** **+** **`role-confirm`** **各一行**）；**`super_admin`** **同权** **200**（**`026_*`**）。**`GET …/admin/jobs?queue_name=onboarding_webhook`**（**`031_*`**；**[04 §3.4](../spec/04-后端与API.md)**；**`ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR=1`** **下** **`async_jobs`** **镜像**）。

---

## 3.4 合规拒服审计与密钥轮换（96-03 / R3 · 批次 B 可落地子集）

### 3.4.1 **`ONBOARDING_COMPLIANCE_EMAIL_DENYLIST` 命中 → 403** 时的 stderr

**`POST …/payment-intents`** 与 **`POST …/role-confirm`** 在 **env 子串拒服** 分支返回 **`onboarding_forbidden_sanctions`** 前，API 另写 **stderr 单行 JSON**（**不**含 **email** **PII**）：

- **`audit_schema`**：`traveltrust.onboarding_compliance.v1`（运维 **`grep`** / 日志平台索引键）。  
- **`request_id`**：取自请求头 **`x-request-id`**（与 **`[req]`** 中间件、**`orders` `audit_key_write`** 同源头名）；缺省为 **`"-"`**。  
- **`user_id`**：当前会话 **UUID**。  
- **`decision` / `screening_tier`**：由 **`ONBOARDING_COMPLIANCE_SCREENING_MODE`** 与命中路径决定（默认 **`email_denylist_hit`** + **`env_substring_only`**）；**`stub_reject_all`** 时为 **`stub_provider_reject`** + **`stub_provider_only`**（**合成 403**，**非** OFAC）；**`list_file`** 命中时为 **`list_file_hit`** + **`static_file_exact_match`**（**仍非** OFAC 实时 API）。**`off`/`none`/`disabled`** 时**不**写本分支。

**`ONBOARDING_COMPLIANCE_SCREENING_MODE`（可选）**：未设或 **`env_email_denylist`** → 仅 **`ONBOARDING_COMPLIANCE_EMAIL_DENYLIST`**；**`off`** → 跳过子串拒服（**禁止**未经书面闸门用于生产）；**`stub_reject_all`** → 凡登录写路径一律 **403**（**IT / provider 链**；**禁止**生产）；**`list_file`**（别名 **`email_list_file`** / **`static_list_file`**）→ 须 **`ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE`**（**04-附录 §1**）；未知值 → 回落 **denylist** 并 **stderr** 一行告警。

**PostgreSQL（批次 B）**：**`onboarding_compliance_audit_events`**（迁移 **`20260506100000_onboarding_compliance_audit_events.sql`**；草案见 **[04-附录-DDL §10.7](../spec/04-附录-DDL草案.md)**）在 **有 `db_pool`** 且返回 **403** **`onboarding_forbidden_sanctions`** 时 **best-effort** 插入一行（**`user_id` / `request_id` / `route`**）；插入失败仍返回 **403**，见 **`insert_onboarding_compliance_audit_event`**。**PG** **IT**：**`matrix_93_b_onb_006_*`**（**payment-intents**）、**`matrix_93_b_onb_006b_*`**（**role-confirm**）、**`matrix_93_b_onb_006c_*`**（**`off`** **跳过** **denylist**）、**`matrix_93_b_onb_006d_*`**（**`stub_reject_all`**）、**`006e`～`006g`**/**`006j_*`**/**`006l_*`**/**`006n_*`**（**`list_file`** **`payment-intents`**）、**`006h_*`** / **`006i_*`** / **`006k_*`** / **`006m_*`** / **`006o_*`**（**`role-confirm`** **`list_file`** **403/503**）。**Admin 只读列表**：**`GET /api/v1/admin/onboarding/compliance-audit-events`**（**[04 §3.5](../spec/04-后端与API.md)**；**§3.3** **curl**；**`matrix_93_admin_onb_028_*`**：**`payment-intents`** **+** **`role-confirm`** **denylist** **各一行**）。

### 3.4.2 准入域相关密钥（轮换须走 **[96-03](../spec/96-03-安全密钥与供应链.md)** 双签窗口）

| 变量（示例名） | 用途 |
|----------------|------|
| **`INTERNAL_API_SECRET`** | **`/api/v1/internal/*`** 含内网 **JSON webhook** |
| **`ONBOARDING_WEBHOOK_HMAC_SECRET`** | 可选 **HMAC** raw body |
| **`TRAVELTRUST_STRIPE_SECRET_KEY`** / **`STRIPE_SECRET_KEY`** | **Stripe** 出网创建 **PI / Checkout** |
| **`TRAVELTRUST_STRIPE_WEBHOOK_SECRET`** | **`POST …/hooks/stripe/onboarding`** **`Stripe-Signature`** |

**勿**将上列值写入 **git**；预发/生产轮换时旧秘钥并行窗口、**break-glass** 与 **Ingress mTLS** 仍以 **96-03** + 运维 **Runbook** 为准。

---

## 3.5 测试网 · Ingress / mTLS / 私网入口（运维选修 · 批次 A）

**用途**：把 **96-18-未完成** 所述「**Ingress / mTLS 仍须运维侧 YAML**」落成**可复制模板**。**不**替代 **③ 生产 GO**；**应用层**仍只认 **`X-Forwarded-For` / `X-Forwarded-Proto`** 与 **[04-附录](../spec/04-附录-商家主理人准入费HTTP契约草案-配96-18.md) §1** 边缘闸；**客户端证书**在**网关**终止校验时，**API 进程不读 mTLS**（与 **§1** 前置表一致）。

### 3.5.1 路径分轨（推荐）

| 流量 | 路径前缀（示例） | 建议 |
|------|------------------|------|
| **Stripe 公网 webhook** | **`POST /api/v1/hooks/stripe/onboarding`** | **公网 HTTPS**；Stripe **IP 段 / Dashboard 签名** + **WAF**；与 **内网** 入口 **分 Ingress**。 |
| **内网 JSON webhook / internal** | **`/api/v1/internal/...`** | **私网**（**VPN / 内网 LB / 跳板机 curl**）；可选 **mTLS**；**禁止** 浏览器直打 **`/internal/`**。 |

### 3.5.2 ingress-nginx：私网 Ingress 仅暴露 `internal`（示意 YAML）

以下 **须**替换 **`host` / `secretName` / `service.name` / `ingressClassName`**；**TLS** 为网关—客户端；**上游** 仍可为 HTTP。**双向 TLS**（校验调用方证书）用注释内 **`auth-tls-*`**；**CA / client cert** 轮换见 **[96-03](../spec/96-03-安全密钥与供应链.md)**。

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: traveltrust-api-internal
  annotations:
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    # 可选：双向 TLS（运维签发 client cert；与 Stripe 公网 Ingress 分轨）
    # nginx.ingress.kubernetes.io/auth-tls-secret: "traveltrust/ingress-mtls-ca"
    # nginx.ingress.kubernetes.io/auth-tls-verify-client: "on"
    # nginx.ingress.kubernetes.io/auth-tls-pass-certificate-to-upstream: "false"
spec:
  ingressClassName: nginx-internal
  rules:
    - host: api-internal.staging.example.com
      http:
        paths:
          - path: /api/v1/internal
            pathType: Prefix
            backend:
              service:
                name: traveltrust-api
                port:
                  number: 8080
  tls:
    - hosts: [api-internal.staging.example.com]
      secretName: api-internal-tls
```

**仓库副本**（便于 **`kubectl apply -f`**）：**[`ops/kubernetes/examples/onboarding-internal-webhook-ingress-nginx.example.yaml`](../../ops/kubernetes/examples/onboarding-internal-webhook-ingress-nginx.example.yaml)**；**可选 NetworkPolicy** 骨架：**[`ops/kubernetes/examples/onboarding-internal-api-networkpolicy.example.yaml`](../../ops/kubernetes/examples/onboarding-internal-api-networkpolicy.example.yaml)**；索引：**[`ops/kubernetes/README.md`](../../ops/kubernetes/README.md)**。

**NetworkPolicy（可选）**：仅允许 **Ingress Controller** 与 **运维 CIDR** 访问 **API** **`Service`** 端口；**Stripe** 回调走**另一条**公网 Ingress，避免把 **`/internal/`** 误绑到公网 LB。

<a id="tt-9618-pg-evidence-one-shot"></a>

### 3.5.3 机读证据一键跑（与 **§3.1** 步 **5～7** + **Stripe `charge.refunded`（`017`）** + **`charge.dispute.funds_withdrawn`（`014`/`016`）** + **§3.6** **`008b`→`009`–`012`** 同源）

仓库根（须 **`DATABASE_URL`** + 已迁移，与 **§3.1** **步 5～7**、**`matrix_93_d_onb_017`**（**`charge.refunded`**）、**`matrix_93_d_onb_014`/`016`**（**拒付划出 **`paid→revoked`** **与终态审计**）、**§3.6** **`async_jobs` 镜像（`008b`）** **+** **队列·metrics·DLQ**（**`009`–`012`**）机读筛子一致）。**步 5** **`cargo test … matrix_93_admin_onb`** 已覆盖 **04 §3.5** **Admin onboarding** 全前缀用例（含 **`029`/`030`** **`POST …/financial-reversal`**）+ **04 §3.4** **`GET …/admin/jobs?queue_name=onboarding_webhook`**（**`matrix_93_admin_onb_031_*`** **`async_jobs`** **对拍**），**不**在脚本末尾重复跑 **`029`/`030`** **/** **`031`**。

```bash
bash scripts/gates/tt-9618-onboarding-pg-evidence.sh
```

未设 **`DATABASE_URL`** 时脚本 **exit 2** 并提示（**不**冒充 **②** 已验收）。

**可选（批次 M）**：本机已安装 **node/npm** 且希望与 **②** 机读同次跑 **`frontend` `npm run build`** 时，设 **`CHECK_FRONTEND_NPM_BUILD=1`** 再执行上列命令；脚本尾段会调用 **`scripts/gates/check-frontend-npm-build.sh`**（无 **node** 时仅 **stderr** 提示，**不**因缺前端工具而失败）。**`STRICT_FRONTEND_BUILD=1`** 仅传给 **`check-frontend-npm-build.sh`** 时：无 **node** **exit 1**（供显式 CI 用）。

**贡献者入口（与上脚本同源）：** **[CONTRIBUTING.md](../../CONTRIBUTING.md)** **必读表** **+** **提 PR 前段**；**[`.env.example`](../../.env.example)** **`DATABASE_URL`** **块注释**。**Prometheus `rule_files` 合入勾选（批次 N）**：**[`ops/monitoring/PROMETHEUS_ONBOARDING_RULE_MERGE_CHECKLIST.md`](../../ops/monitoring/PROMETHEUS_ONBOARDING_RULE_MERGE_CHECKLIST.md)**（与 **§3.6.3** 工单模板对读）。

**与 93 矩阵追踪**：全站 **93** 批次 **不**含本域 **批次 ID**；跑 **D-ADM-002** **Admin onboarding** **子集** **留证** **时**，**`notes.md`** **可** **互指** **[`93-matrix-batch-tracker.md`](./93-matrix-batch-tracker.md)** **互指表** **「TT-9618」** **行** **与** **本** **§3.5.3**。

---

## 3.6 96-09 · 独立 webhook worker（可选 · 批次 C 子集）

**与 250 边界**：准入 webhook 队列当前为 **域侧专用表**（**`onboarding_webhook_*`**），**尚未**并入 **[250-阶段 Job/Queue](../spec/250-阶段Job-Queue-异步任务系统.md)** 所述 **`async_jobs`** 统一面；**250 §二** 脚注与 **§3.1** 表末行是 **SSOT**。**①②** 交付以本 Runbook + **96-18-未完成** 为准，**不**以「未进 **`async_jobs`**」单独否 **GO**。

**用途**：当 **`ONBOARDING_WEBHOOK_ASYNC_QUEUE=1`** 且 **`ONBOARDING_WEBHOOK_QUEUE_INLINE_DRAIN=0`** 时，默认由 API 进程内 **`tokio::spawn(run_onboarding_webhook_job_worker)`** 消费 **`onboarding_webhook_jobs`**。若希望 **独立 Deployment / CronJob** 排空队列，设 **`ONBOARDING_WEBHOOK_QUEUE_EXTERNAL_ONLY=1`**（**API 不再 spawn**），并在侧车或 Job 中运行：

```bash
export DATABASE_URL='postgres://…'
# 排空队列后退出（K8s CronJob 友好）
cargo run -p traveltrust-api -- onboarding-webhook-worker
# 或常驻：ONBOARDING_WEBHOOK_WORKER_MODE=daemon ONBOARDING_WEBHOOK_WORKER_POLL_MS=500 cargo run -p traveltrust-api -- onboarding-webhook-worker
```

**机读**：**`cargo test -p traveltrust-api matrix_93_d_onb_009`**（**子串** **含** **`009_*`** **与** **`009b_*`**；须 **`DATABASE_URL`**）。**`matrix_93_d_onb_009_*`**：**域表先行** **`claim_next_pending_onboarding_webhook_job`** **`+`** **`apply_*`**；**`ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR=1`** 时断言 **`async_jobs`** **`pending`→`running`→`completed`**。**`matrix_93_d_onb_009b_*`**：**`claim_next_pending_onboarding_webhook_job_from_async_jobs`** — **`async_jobs`** **`SKIP LOCKED`** **主选队** **与** **域表** **同句** **`pending`→`processing`/`running`**（**`traveltrust-api onboarding-webhook-worker`** **`ONBOARDING_WEBHOOK_ASYNC_JOBS_PRIMARY_CLAIM=1`** **同源**；**须** **`MIRROR=1`**，见 **`.env.example`**）。**勿**与 **`EXTERNAL_ONLY=0`** 下同一库的 **`tokio::spawn`** 长期并发抢同一 **`pending`** 行（首写竞争）；生产择一：**spawn** **或** **external_only + 独立 worker**；**`PRIMARY_CLAIM=1`** 时**勿**再开 **API** **内联** **`spawn`** **抢** **同一** **队列**。

**`processing` 孤儿恢复**：worker 每轮循环开头调用 **`requeue_stale_onboarding_webhook_jobs_processing`**；阈值 **`ONBOARDING_WEBHOOK_REQUEUE_STALE_PROCESSING_SECS`**（默认 **600**，**0** = 关闭）。须 **大于** 正常 **`apply`** 耗时，避免误伤。**机读**：**`cargo test -p traveltrust-api matrix_93_d_onb_010`**。

### 3.6.1 积压与 DLQ（运维 Partial · 非 120 全量）

**不**替代 **[120-阶段开发观测告警日志与审计链路](../spec/120-阶段开发观测告警日志与审计链路.md)** 的指标族与 **SLO** 绑定；仅作 **②** 人工排障与值班核对：

1. **Admin 只读**（须 **`admin`/`super_admin`** 会话，见 **[04 §3.5](../spec/04-后端与API.md)**）：**`GET /api/v1/admin/onboarding/webhook-jobs`**（可选 **`user_id`** 过滤，与 **`onboarding_entitlements.idempotency_key`** 关联）、**`GET …/webhook-dlq`**。证据用例：**`matrix_93_admin_onb_012_*`**。  
2. **DB 直查（只读）**（**`psql`** / 运维只读账号）：**`SELECT status::text, count(*) FROM onboarding_webhook_jobs GROUP BY 1 ORDER BY 1;`** — 关注 **`pending`** 长期增长、**`processing`** 与 **`now()`** 的 **`updated_at`** 差（与 **`ONBOARDING_WEBHOOK_REQUEUE_STALE_PROCESSING_SECS`** 对照）。**`onboarding_webhook_dlq`**：可选 **`replayed_at`**（回灌后打戳）；行数增长仍须值班核对，**自动化** 仅 **`ONBOARDING_WEBHOOK_DLQ_AUTO_REPLAY=1`** **worker** 路径（**不**替代 **SLO/on-call** 落盘）。  
3. **Worker 日志**：**`onboarding-webhook-worker`** **`stderr`** 在 **`requeue_stale_*`** 命中时打印 **`requeued N stale processing job(s)`**（**N>0** 时）。  
4. **`GET /metrics`（120 Partial）**：**`traveltrust_onboarding_webhook_jobs_*`**、**`traveltrust_onboarding_webhook_dlq_total`**（**历史** DLQ 行数，含已 **`replayed_at`**）、**`traveltrust_onboarding_webhook_dlq_unreplayed`**（**`replayed_at IS NULL`**，**值班积压**；与 **`ops/monitoring/prometheus-alerts-onboarding-webhook-queue.example.yml`** **`…DlqUnreplayedBacklog`** 对拍）— **Prometheus** scrape 时读 **PG**（与 **`meta.database_connected`** 同源池）；无池或查询失败为 **`-1`**。**机读**：**`cargo test -p traveltrust-api matrix_93_d_onb_011`**（**含** **`GET …/quote`** **200** **与** **`?role=tourist`** **400** **对** **`http_responses_total`** **2xx/4xx**；**`POST …/payment-intents`**、**`GET …/entitlements/me`**、**`POST …/role-confirm`** **无** **Bearer** **→401** **对** **对应** **`route`·`4xx`**；**`chain_off` 缺省栈** **`GET …/quote`→503** **`chain_off_unavailable`** **对** **`quote`·`5xx`** **断言**）。  
   **HTTP 到达计数（进程内 counter）**：**`traveltrust_onboarding_quote_get_requests_total`**、**`…payment_intents_post…`**、**`…entitlements_me_get…`**、**`…role_confirm_post…`**（**`onboarding_counters.rs`**；**`rate()`** 可估 QPS）。  
   **HTTP 响应粗分桶（进程内 counter）**：**`traveltrust_onboarding_http_responses_total{route="quote"|"payment_intents"|"entitlements_me"|"role_confirm",status_class="2xx"|"4xx"|"5xx"}`**（**2xx** = 最终状态码 **低于 400**；与上列 **`*_requests_total`** 可组合估 **4xx/5xx** 占比）。  
5. **告警示例（非落盘）**：仓库 **`ops/monitoring/prometheus-alerts-onboarding-webhook-queue.example.yml`** — 合并到各环境 **`rule_files`** 前须调阈值与 **`for:`**；与 **`traveltrust_database_connected`** 交叉的 **`…MetricsBroken`** 规则**仅**用于**须** **PG** 的 scrape 目标。  
6. **告警示例语法（可选）**：已安装 **`promtool`** 时，仓库根 **`bash scripts/gates/check-ops-monitoring-prometheus-examples.sh`** — 对本文件与 **`prometheus-alerts-indexer.example.yml`** 做 **`promtool check rules`**；**`tt-9618-onboarding-pg-evidence.sh`** 在 **`promtool`** 可用时会**自动**串跑。CI 若要硬门禁：**`PROMTOOL_REQUIRED=1`**。  
7. **Grafana 看板草稿（非落盘）**：**`ops/monitoring/grafana-dashboard-onboarding-http.example.json`** — **Import** 后绑定 Prometheus **datasource UID**；含 **`http_responses_total`** **`rate`**、**`*_requests_total`** **`rate`**、**quote** **4xx/5xx** **占比**（**`clamp_min`**）、**`traveltrust_onboarding_webhook_jobs_pending` / `…_dlq_unreplayed` / `…_dlq_total`** **三** **Stat**（**`dlq_total`** **=** **历史** **行数** **含** **已** **`replayed_at`**）。说明见 **`ops/monitoring/README.md`**。

**120 阶段 SLO 占位（与本节对拍）**：**[120-阶段开发观测告警日志与审计链路](../spec/120-阶段开发观测告警日志与审计链路.md)** **§2.1.1** — 将上列 **gauge/counter/recording** 与 **告警示例** **抽象为** **SLI** **表**；**全量 SLO 绑定** **仍** **须** **§3.6.3** **运维落盘** **+** **Owner** **与** **120** **闭环**。

**一键机读**（与 **§3.1** 步 **5～7** 同源并含 **`matrix_93_d_onb_017`**（**`charge.refunded`**）、**`014`/`016`**（**`charge.dispute.funds_withdrawn`**）与 **§3.6**；**Admin** **`financial-reversal`**（**`029`/`030`**）**与** **`GET …/admin/jobs?queue_name=…`**（**`031_*`**）**含于** **步 5** **`matrix_93_admin_onb`**）：**`bash scripts/gates/tt-9618-onboarding-pg-evidence.sh`**（**`matrix_93_d_onb_008b`** **后** **`009`–`012`** 于 **§3.6** 段串跑；**`promtool`** 可选）。

<a id="tt-9618-onboarding-dlq-manual-replay"></a>

### 3.6.2 DLQ 人工核对与重放（可选 worker 自动回灌 · 批次 C 续）

**`onboarding_webhook_dlq`** 行表示 **`apply_payment_webhook`** 曾遇 **DB 级**失败等并已**落库留痕**。**`traveltrust-api onboarding-webhook-worker`** 在 **`ONBOARDING_WEBHOOK_DLQ_AUTO_REPLAY=1`** 时，每轮在 **`requeue_stale_*`** 之后将 **`replayed_at IS NULL`** 且 **`created_at` 已冷却**（**`ONBOARDING_WEBHOOK_DLQ_REPLAY_MIN_AGE_SECS`**，默认 **120**）的 **`raw_body`** 插入 **`onboarding_webhook_jobs`**（**`pending`**），并 **`UPDATE replayed_at = now()`**（**不** `DELETE` DLQ）；每轮上限 **`ONBOARDING_WEBHOOK_DLQ_REPLAY_MAX_PER_TICK`**（默认 **3**，**≤100**）。**机读**：**`cargo test -p traveltrust-api matrix_93_d_onb_012`**。**禁止**未读 **`error_message` / `raw_body`** 即依赖自动回灌或 **`DELETE`**（审计与二次付费风险）。

**推荐顺序**：

1. **只读列表**：**`GET …/admin/onboarding/webhook-dlq`**（**§3.6.1** 条 1）或 **`psql`**：**`SELECT id, created_at, idempotency_key, provider_event_id, outcome, left(error_message,200) FROM onboarding_webhook_dlq ORDER BY created_at DESC LIMIT 50;`**  
2. **对齐业务态**：用 **Admin** **`GET …/onboarding/entitlements`** / **`…/:id`** 或 **`GET …/entitlements/me`**（用户侧）确认 **`idempotency_key`** 对应 **`pending` / `paid` / `revoked`**；**已 `paid`** 的 **`succeeded`** **不得**再伪造成功体重放。  
3. **安全重放**（仅当步骤 2 允许补写/推进）：与 **§5** 内网 **`curl`** 同形，**`idempotency_key`** **须与 DLQ 行一致**，**`provider_event_id` 每次须新的唯一值**（与 **`POST …/internal/onboarding/payments/webhook`** 幂等语义一致）；**`outcome`** 与 **`raw_body`** 内原意图一致或按工单裁定为 **`failed`** 等。须 **`X-Internal-Api-Secret`**；若启用 **HMAC / 重放窗 / 边缘闸**，与运行中 API **同配**。  
4. **成功后处置**：**API 不暴露** DLQ 删除接口；**break-glass** **`DELETE FROM onboarding_webhook_dlq WHERE id = …`** 仅能在**变更单 + DBA** 下执行，且须保留 **`error_message`** 截屏/导出备审计。  
5. **不收敛时**：开 **70 / 财务** 工单（**chargeback / 对账** 仍以 **96-08** 为 SSOT），**不**以本小节替代 **OFAC / PCI** 闸门。

<a id="tt-9618-prometheus-onboarding-rules-merge"></a>

### 3.6.3 Prometheus `rule_files` 合入与 on-call 落盘（批次 2 · 运维清单）

**目的**：把仓库 **`ops/monitoring/prometheus-alerts-onboarding-webhook-queue.example.yml`** 从「示例」变成**各环境可值班**的告警（仍**不**替代 **[120](../spec/120-阶段开发观测告警日志与审计链路.md)** 全量 SLO 族；**不**解决 **`async_jobs`** 与 **[250](../spec/250-阶段Job-Queue-异步任务系统.md)** 统一面——见 **§3.6** 段首与 **96-18-未完成** **P2**）。

**可复制勾选清单（批次 N）**：**[`ops/monitoring/PROMETHEUS_ONBOARDING_RULE_MERGE_CHECKLIST.md`](../../ops/monitoring/PROMETHEUS_ONBOARDING_RULE_MERGE_CHECKLIST.md)** — 与下列步骤、下方 **工单模板** 对读。

**前置**：

1. **Scrape**：Prometheus 已抓取 **API** **`GET /metrics`**（与 **`meta.database_connected`**、**`traveltrust_onboarding_webhook_*`** 同源；无池时 gauge **`-1`**，勿对演示目标误开 **`…MetricsBroken`**）。  
2. **机读语法**：仓库根 **`bash scripts/gates/check-ops-monitoring-prometheus-examples.sh`**（**`promtool check rules`**；**`PROMTOOL_REQUIRED=1`** 可硬失败）。  

**合入步骤（建议变更单留痕）**：

1. **复制/派生**：将示例文件纳入运维 Git（或从本仓库 **vendor** 到 **`rule_files`** 目录），保留文件头 **SSOT** 注释与 **TT-9618** 互链。  
2. **调参**：按环境调整 **`expr` 阈值**、**`for:`**、**`labels.severity`**；**`TravelTrustOnboardingWebhookQueueMetricsBroken`** **仅**在**必须**挂载 **PG** 的 scrape 目标上启用（见示例内注释）。  
3. **注册**：在 **`prometheus.yml`**（或等价配置）**`rule_files:`** 增加该 YAML 路径；**`SIGHUP` / 动态加载** 或 **滚动重启** 使规则生效。  
4. **Grafana（可选）**：**`ops/monitoring/grafana-dashboard-onboarding-http.example.json`** **Import** 后绑定 **Prometheus datasource UID**（与 **§3.6.1** 条 7 一致）。  

**on-call / 值班落盘（须环境_owner 书面或工单模板）**：

| 项 | 说明 |
|----|------|
| **路由** | 将 **`TravelTrustOnboardingWebhookPendingBacklogHigh`** / **`…ProcessingElevated`** / **`…DlqUnreplayedBacklog`** / **`…DeadJobsPresent`** / **`…QueueMetricsBroken`** 映射到 **PagerDuty / Opsgenie / Slack** 等（**`labels.team`** / **`annotations.runbook_url`** 可按组织规范追加）。 |
| **Runbook 链** | 告警 **`annotations.description`** 已指 **TT-9618 §3.6**；**DLQ** 处置须再打开 **§3.6.2**；**dead** 行见 **Admin** **`webhook-jobs`** 与 **`last_error`**。 |
| **误报抑制** | 维护窗、**`ONBOARDING_WEBHOOK_ASYNC_QUEUE=0`** 的演示栈、或 **无 `DATABASE_URL`** 的 CI **须**在 **路由层 silence** 或 **不加载** 本 **`rule_files`** 条目。 |

<a id="tt-9618-onboarding-on-call-template"></a>

**工单 / 变更单模板（复制到运维工单；须环境 Owner 留痕）**

```text
[ ] 环境：________（staging / prod / …）
[ ] Prometheus 实例或 Helm release：________
[ ] 抓取 API /metrics 的 job 名：________（须与 traveltrust_database_connected / onboarding_webhook_* 同源实例）
[ ] 合入后的 rule 文件路径（运维 Git 真路径）：________
      源文件：本仓库 ops/monitoring/prometheus-alerts-onboarding-webhook-queue.example.yml（注明 vendor 时 commit / tag）
[ ] promtool check rules 已通过（或 CI PROMTOOL_REQUIRED=1 等价）：________ 日期
[ ] 已按环境调整：pending / processing / dlq_unreplayed / dead / for: / severity（逐条写旧值→新值或「沿用示例」）
[ ] TravelTrustOnboardingWebhookQueueMetricsBroken 仅挂在「须 PG」的 scrape 目标：是 / 否（否 → silence 或拆文件）
[ ] 告警路由：PagerDuty/Opsgenie/Slack 等 → ________________（含 team 或 channel）
[ ] Runbook：首链 §3.6.1；DLQ → §3.6.2；本清单 → §3.6.3
[ ] Owner 签字：________   生效日期：________
```

**`prometheus.yml` 最小合入形态（示例 · 路径须替换为运维仓实际文件）**

```yaml
# 片段示意 — 非本仓库可执行配置
rule_files:
  - "rules/prometheus-alerts-indexer.example.yml"            # 既有索引器示例或派生文件
  - "rules/prometheus-alerts-onboarding-webhook-queue.yml" # 由 example vendor / 调参后的落盘名
```

**示例 YAML 内告警名速查（`groups[0]` · `traveltrust_onboarding_webhook_queue`）**

| `alert:` | 默认 `labels.severity` | 值班首查 |
|----------|-------------------------|----------|
| **`TravelTrustOnboardingWebhookPendingBacklogHigh`** | `warning` | **§3.6.1** 条 1～3、worker / **`EXTERNAL_ONLY`** |
| **`TravelTrustOnboardingWebhookProcessingElevated`** | `warning` | **`requeue_stale_*`**、**`ONBOARDING_WEBHOOK_REQUEUE_STALE_PROCESSING_SECS`**、慢 **apply** |
| **`TravelTrustOnboardingWebhookDlqUnreplayedBacklog`** | `warning` | **§3.6.2**、Admin **`webhook-dlq`**、**`dlq_unreplayed`** **对** **`dlq_total`** |
| **`TravelTrustOnboardingWebhookDeadJobsPresent`** | `info` | Admin **`webhook-jobs`**、**`last_error`** / 产品裁定 |
| **`TravelTrustOnboardingWebhookQueueMetricsBroken`** | `warning` | **仅** **须 PG** 目标；**`-1` gauge**、迁移 / 权限 / **§3.6.1** 条 4 |

同文件第二组 **`traveltrust_onboarding_http_recording`** 为 **`record:`** 规则（**无** **`alert:`**），供 Grafana 占比面板使用；合入 **`rule_files`** 时与告警组**同一文件**即可。

**与 250 边界**：准入 **`onboarding_webhook_*`** 仍为**域侧旁路**；**未**迁入 **`async_jobs`** **不**单独否 **①②** 交付（见 **§3.6** 段首）。

---

## 3.7 Stripe 预生产读前（批次 B · 文档）

**不**替代 **③ 生产 GO** 或 **PCI / SAQ** 全量；仅作 **②→③** 切换前核对：

1. **Dashboard**：**Live** 端点只配 **live** **`whsec`**；与 **test** 账户、密钥、**`DATABASE_URL`** **物理隔离**（**96-03**）。  
2. **API 环境**：**`TRAVELTRUST_STRIPE_SECRET_KEY`** / **`TRAVELTRUST_STRIPE_WEBHOOK_SECRET`** 与当前 Dashboard **Signing secret** 一致；轮换时保留并行窗口 Runbook 行。  
3. **回调 URL**：公网 **HTTPS** **`/api/v1/hooks/stripe/onboarding`** 与 **Ingress** 证书链一致；**内网** **`/internal/...`** 勿绑同一公网 LB **无鉴权** 暴露。  
4. **幂等**：**`metadata.traveltrust_idempotency_key`** 与 **`POST …/payment-intents`** 头一致（**`stripe trigger`** **不足以** 冒充全链，见 **§3.2**）。  
5. **3DS / SAQ / Link**：仍以 **96-18-未完成 P0** 与 **96-02** 为准 — 接卡前须法务 + PCI 书面。

---

## 4. 全量测试（本阶段推荐，不上 CI）

在仓库根 / **frontend** 按需执行（**不**提交 workflow 变更即满足「先不上 Git CI」）：

```bash
# API（默认包全量）
cargo test -p traveltrust-api

# 可选 · PG 准入子集（须 DATABASE_URL + 已迁移；与 §3.1 步 5～7 同源筛子）
# cargo test -p traveltrust-api matrix_93_admin_onb
# cargo test -p traveltrust-api matrix_93_b_onb_006
# cargo test -p traveltrust-api matrix_93_d_onb_005_f036_ext
# cargo test -p traveltrust-api matrix_93_d_onb_017   # Stripe charge.refunded 部分审计 → 全额 refunded（§3.5.3 一键已串）
# cargo test -p traveltrust-api matrix_93_d_onb_008b  # 250 阶段 1 async_jobs 镜像（内联队列；§3.5.3 一键在 009 前已串）
# cargo test -p traveltrust-api matrix_93_d_onb_009   # 96-09 独立 worker claim+apply（§3.6；MIRROR=1 时 async_jobs 三态）
# cargo test -p traveltrust-api matrix_93_d_onb_010   # 96-09 processing 孤儿 → pending（§3.6）
# cargo test -p traveltrust-api matrix_93_d_onb_011   # 120/96-09 GET /metrics webhook 队列 gauge（§3.6.1）

# 前端
cd frontend && npm run test:i18n:ci && npm run build

# Vitest：准入 API 客户端（GET quote 429/503 chain_off；GET entitlements/me 200/500/503 chain_off；POST payment-intents 503 chain_off + 502/503/409/403/429/400/500 + 200 信封缺幂等；POST role-confirm 503 chain_off + 400/403/429/500；不依赖 Playwright）
cd frontend && npx vitest run lib/apiClient/onboarding.http.test.ts
# Vitest：`mapApiReadError`→`mapOrderWriteError` 准入码（`onboarding_compliance_screening_unavailable` / `onboarding_forbidden_sanctions` 等）
cd frontend && npx vitest run lib/mapApiReadError.test.ts

# Playwright：准入壳（须全栈或已起 API+Next）
cd frontend
PLAYWRIGHT_FULL_STACK=1 npx playwright test e2e/me-onboarding-96-18-shell.spec.ts --project=chromium
# 仅跑路由 mock（较快筛 UI）：-g "409 idempotency" / -g "429 user write" / -g "role-confirm 429" / -g "503 compliance"
```

**第四条（路由 mock）**：同一 spec 内 **`logged-in: 409 idempotency conflict then retry`** 用 **`page.route`** 拦截 **`POST …/payment-intents`**（首包 **409**、重试包 **200**），断言 **`me-onboarding-retry-payment-intent`**；**不**依赖 **PG** 真落 **payment-intents**（与 **可选闭环** 正交）。

**第五条（路由 mock）**：**`logged-in: 429 user write rate limited then retry`**（**`payment-intents`**）— 首包 **429** **`onboarding_user_write_rate_limited`**（可带 **`Retry-After`**），重试包 **200**；**不**依赖真实 **uid** 写桶计数。

**第六条（路由 mock）**：**`logged-in: role-confirm 429 write rate limited then retry`** — **`POST …/role-confirm`** 首包 **429**、重试包 **200** **`onboarding_role_confirm_db`**；筛跑 **`-g "role-confirm 429"`**。

**第七～八条（路由 mock）**：**`logged-in: payment-intents 503 compliance screening unavailable`** 与 **`logged-in: role-confirm 503 compliance screening unavailable`** — **`POST`** **恒** **503** **`onboarding_compliance_screening_unavailable`**；**`goto`** **后** **先** **等** **H1** **与** **`main`** **含** **`onboarding_entitlements_(stub|db)`**（**`-g "503 compliance"`** **单筛** **时** **与** **冷** **起** **全栈** **对齐**），**再** **点** **写** **按钮**；**`<main>`** **`locales`** **中英** **子串** **可见**，**不**出现 **`me-onboarding-retry-*`**；筛跑 **`-g "503 compliance"`**。

**Vitest（`onboarding.http.test.ts`、`mapApiReadError.test.ts`）**：**`onboarding.http.test.ts`** — **`GET …/quote`** **HTTP 429** **`onboarding_quote_rate_limited`** 与 **503** **`chain_off_unavailable`**（**`mapApiReadError`** → **`common_apiHttpServer`**，与 **`mapOrderWriteError`** 同源）；**`GET …/entitlements/me`**、**`POST …/payment-intents`**、**`POST …/role-confirm`** 遇 **503** **`chain_off_unavailable`** 同理。**`POST …/payment-intents`** **500** **`onboarding_user_missing` / `onboarding_intent_*`** 与 **`POST …/role-confirm`** **500** **`onboarding_role_confirm_*`** — **`mapApiReadError`** → **`me_onboarding_error_serverSide`**。**`mapApiReadError.test.ts`** — **`onboarding_compliance_screening_unavailable`/`onboarding_forbidden_sanctions`** **等** **`Error.message`** **→** **`me_onboarding_error_*`** **键**。**Stripe 公网 webhook** 全链证据见 **§3.2**（**≠** 本段 **internal** 可选闭环）。

**可选闭环用例**（须根目录 **`.env`** 中 **`INTERNAL_API_SECRET`** 已对齐，Playwright 启动时会注入 **`PLAYWRIGHT_INTERNAL_API_SECRET`**）：同一 spec 内 **`optional: PG + internal webhook → paid`** 会走 **HTTP 内网 webhook**，不依赖 shell；请求带 **`X-Forwarded-For: 127.0.0.1`** 与 **`X-Forwarded-Proto: https`**（可用 **`PLAYWRIGHT_ONBOARDING_WEBHOOK_X_FORWARDED_FOR`** / **`_PROTO`** 覆盖），与 **`scripts/dev/onboarding-webhook-local.sh`** 一致。**`payment_intent.succeeded` 经 Stripe 验签入口** 仍须按 **§3.2** 手工或 **②** 复现（**不**由此用例冒充）。

---

## 5. 内网 Webhook · curl 卡片（复制即用）

与 **`scripts/dev/onboarding-webhook-local.sh`** 同语义：**`X-Internal-Api-Secret`**、体 **`schema_version` / `idempotency_key` / `provider_event_id` / `outcome`**；默认带 **`X-Forwarded-For`** / **`X-Forwarded-Proto`**（**边缘硬闸** 开启时须与 allowlist / **HTTPS** 要求一致）。**`provider_event_id`** 每次须唯一（示例用时间戳）。

```bash
export INTERNAL_API_SECRET='与 API 进程同值'
export API_BASE_URL='http://127.0.0.1:8080'
IDEM='替换为 payment-intents 的 idempotency_key'
PEVID="evt_curl_$(date +%s)"
API="${API_BASE_URL%/}"
BODY=$(printf '{"schema_version":1,"idempotency_key":"%s","provider_event_id":"%s","outcome":"succeeded"}' "$IDEM" "$PEVID")

curl -sS -X POST "${API}/api/v1/internal/onboarding/payments/webhook" \
  -H "Content-Type: application/json" \
  -H "X-Internal-Api-Secret: ${INTERNAL_API_SECRET}" \
  -H "X-Forwarded-For: 127.0.0.1" \
  -H "X-Forwarded-Proto: https" \
  -d "$BODY"
echo
```

**内网 webhook 后核对拒服审计（可选）**：若本轮曾触发 **`ONBOARDING_COMPLIANCE_EMAIL_DENYLIST`** **403**（**intent** / **role-confirm**），可用 **§3.3** 同一 **`ADMIN_BEARER_TOKEN`** 调 **`GET …/admin/onboarding/compliance-audit-events`**（**`matrix_93_admin_onb_028_*`** / **`026_*`** **证据**；**不**替代 **OFAC**）。

- **HMAC**：若 API 设 **`ONBOARDING_WEBHOOK_HMAC_SECRET`**，须 **`X-Onboarding-Webhook-Signature: v1=<hex>`**（**`openssl dgst -sha256 -hmac`** 对 **raw body**，与脚本一致）。  
- **重放窗**：若 API 设 **`ONBOARDING_WEBHOOK_MAX_AGE_SECS`**，须 **`X-Onboarding-Webhook-Timestamp: <Unix 秒>`**。

---

## 6. 刻意不做（本 Runbook 边界）

- **不上传** 或 **不启用** 与本机无关的 **GitHub Actions** 变更。  
- **不**将 **主网 `CHAIN_RPC_URL`**、**真实资金** 作为本页完成标准。  
- **不**替代 **96-15** 深度多维正式勾选与 **R-002 / ISS-007** 全矩阵 **GO**。

---

**Related:** [README.md](../../README.md)（**工程规划方向**）· [04-附录-商家主理人准入费HTTP契约草案-配96-18.md](../spec/04-附录-商家主理人准入费HTTP契约草案-配96-18.md) · [96-18-未完成清单与多维检查.md（`#9618-one-page-priority` · v1.0.118+）](../spec/96-18-未完成清单与多维检查.md#9618-one-page-priority) · [96-18-未完成清单与多维检查.md（`#9618-batches` · v1.0.118+）](../spec/96-18-未完成清单与多维检查.md#9618-batches) · [AI任务卡索引.from-stash.md](../AI任务卡索引.from-stash.md) · [路线图-1人开发极简版.md](../路线图-1人开发极简版.md) · [96-13-UI-UX-i18n-a11y-性能走查.md](../spec/96-13-UI-UX-i18n-a11y-性能走查.md) · [96-16-全页面UI-UX优化方案总册.md](../spec/96-16-全页面UI-UX优化方案总册.md) · [TT-9600-96-HUB-LOCAL-VERIFICATION-PACK.md](./TT-9600-96-HUB-LOCAL-VERIFICATION-PACK.md)
