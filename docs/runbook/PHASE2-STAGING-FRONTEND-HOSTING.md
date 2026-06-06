# Phase ②/③ · Staging 前端托管（tt-web-staging）

**状态：** PREP + deploy-ready（2026-06-06）  
**公网 URL（目标）：** https://tt-web-staging.fly.dev  
**配对 API：** https://tt-api-staging.fly.dev  

> **边界声明：** 本文档交付 **② staging 可浏览 UI**，**不等于 Production GO**，**不等于 Phase ③ 公网/主网 GO**。`PHASE2_GO_READY`（closing gap 7/7）**不包含**此前缺失的公网前端；G7 CDN/HLS 仍为 **PREP_PASS**。

---

## 1 · 部署缺口审计（变更前）

| 项 | 变更前 | 变更后 |
|----|--------|--------|
| Fly API | `deploy/fly/tt-api-staging/fly.toml` ✅ | 不变 |
| Fly / Vercel / Pages 前端 | **无** | **`deploy/fly/tt-web-staging/`** |
| 公网 UI | 仅 `localhost:3012` + 远程 API | **`https://tt-web-staging.fly.dev`** |
| `NEXT_PUBLIC_API_BASE_URL` | 本机 `.env.local` 手写 | **build-time 注入 staging API** |
| CORS | API 已预置 web origin（实测 OPTIONS 200） | 对拍脚本固化 |

---

## 2 · 平台选型：**Fly.io（tt-web-staging）**

| 平台 | 结论 |
|------|------|
| **Fly.io** ✅ | 与 `tt-api-staging` 同账号/区域（`sin`）；仓库已有 Fly 模式；CORS 已在 API 侧预留 `https://tt-web-staging.fly.dev`；无额外 SaaS 分叉。 |
| Vercel | Next 原生体验好，但 staging API 在 Fly，CORS/Secrets 双平台；仓库无 `vercel.json`。 |
| Cloudflare Pages | Next App Router SSR 限制多；无现有配置。 |

**决策：** 采用 **Fly `tt-web-staging`**，与 Phase ② 证据链「Fly API + 浏览器」一致，仅将浏览器 origin 从 `:3012` 升级为公网 HTTPS。

---

## 3 · 部署步骤

### 3.1 一次性准备

```bash
cp deploy/fly/tt-web-staging/build.env.example deploy/fly/tt-web-staging/build.env.local
# 按需改 NEXT_PUBLIC_*（默认已与 Sepolia staging 对拍）

fly auth login
# 若本机需代理：export HTTPS_PROXY=http://127.0.0.1:15715
```

### 3.2 对拍（不部署）

```bash
bash scripts/dev/deploy-tt-web-staging.sh --check-only
bash scripts/dev/check-staging-web-alignment.sh
```

### 3.3 部署

```bash
# 默认本地 Docker 构建（Depot 远程 builder 易 Next OOM · exit 137）
bash scripts/dev/deploy-tt-web-staging.sh

# 强制远程 Depot 构建（大内存 CI 可用）
FLY_WEB_REMOTE_BUILD=1 bash scripts/dev/deploy-tt-web-staging.sh
```

**前置：** 本机已安装并运行 **Docker Desktop**（`--local-only`）。

产物：`https://tt-web-staging.fly.dev`（`fly.toml` app = `tt-web-staging`）。

### 3.4 API CORS（若对拍 FAIL）

在 **tt-api-staging** 增加/更新 secret（示例）：

```bash
fly secrets set CORS_ORIGINS="https://tt-web-staging.fly.dev,http://localhost:3012,http://127.0.0.1:3012" -a tt-api-staging
```

然后 redeploy API（`bash scripts/dev/phase2-staging-fly-deploy-and-sync.sh --secrets-only` 或完整 deploy）。

---

## 4 · CORS / Env / Stripe / Sepolia 对拍清单

运行：`bash scripts/dev/check-staging-web-alignment.sh`

| # | 检查项 | 期望 |
|---|--------|------|
| C1 | `GET ${API}/health` | **200** |
| C2 | `OPTIONS ${API}/meta` + `Origin: https://tt-web-staging.fly.dev` | `access-control-allow-origin` 含 web origin |
| E1 | `NEXT_PUBLIC_API_BASE_URL` | `https://tt-api-staging.fly.dev` |
| E2 | `NEXT_PUBLIC_SITE_URL` | `https://tt-web-staging.fly.dev` |
| E3 | `NEXT_PUBLIC_CHAIN_ID` | **11155111**（Sepolia） |
| E4 | `NEXT_PUBLIC_RPC_URL` | 与 API `CHAIN_RPC_URL` 同源（如 `https://sepolia.drpc.org`） |
| E5 | `NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS` 等 | 与 `GET /meta` `chain.contracts.*` 及 `scripts/dev/.env.staging-onboarding.local` 一致 |
| S1 | API Stripe | **sk_test_*** · `TRAVELTRUST_ONBOARDING_STRIPE_ENABLED=1` · **禁止 live** |
| S2 | G-4 | staging **无** `TRAVELTRUST_ONBOARDING_LOCAL_DEV=1` |
| Sep1 | `GET /meta` `chain.chain_id` | **11155111** |
| Sep2 | Governor / EscrowFactory / FeeRouter | 与 Sepolia seq 1–5 部署地址一致 |
| Web1 | `GET https://tt-web-staging.fly.dev/` | **200**（部署后） |

**说明：** 当前 staging API `/meta` 中 `registry_address` / `staking_address` 可能为 null；全量 `meta-chain-contracts` E2E 请设 `PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1`（本 smoke 已设）。

---

## 5 · 最小 Playwright 验收

```bash
bash scripts/dev/smoke-staging-web.sh
```

或：

```bash
cd frontend
STAGING_WEB_SMOKE=1 \
  PLAYWRIGHT_BASE_URL=https://tt-web-staging.fly.dev \
  PLAYWRIGHT_API_BASE_URL=https://tt-api-staging.fly.dev \
  PLAYWRIGHT_REUSE_FE_SERVER=0 \
  PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1 \
  PLAYWRIGHT_EXPECT_CHAIN_ID=11155111 \
  npx playwright test e2e/staging-web-smoke.spec.ts --project=chromium
```

覆盖：首页 · `/market` · `/community` · `/auth/login` · 浏览器 CORS 拉 `/meta`。

---

## 6 · 本地 vs Staging 对照

| 场景 | 前端 | API |
|------|------|-----|
| ① 本地全栈 | `http://localhost:3012` | `http://127.0.0.1:8080`（rewrites 代理） |
| ② Staging（本方案） | **https://tt-web-staging.fly.dev** | **https://tt-api-staging.fly.dev**（跨域 + CORS） |
| ② 旧证据模式 | `localhost:3012` | `https://tt-api-staging.fly.dev` |

**勿** 把 API 绑到 3012（会与 Next 冲突，返回 API 头 `x-request-id` 而非 HTML）。

---

## 7 · 相关路径

- **Canonical Fly 配置：** `frontend/fly.staging.toml` · `frontend/Dockerfile.fly-staging`
- **索引/副本：** `deploy/fly/tt-web-staging/`（与 frontend 同步）
- `deploy/fly/tt-web-staging/build.env.example`
- `scripts/dev/deploy-tt-web-staging.sh`
- `scripts/dev/check-staging-web-alignment.sh`
- `scripts/dev/smoke-staging-web.sh`
- `frontend/e2e/staging-web-smoke.spec.ts`
- API 部署：`scripts/dev/phase2-staging-fly-deploy-and-sync.sh`

---

## 8 · 非目标（明确不做）

- ❌ Production GO / 主网 / live Stripe  
- ❌ 新增产品功能或五主路由 UI 结构变更  
- ❌ G7 生产 CDN/HLS GO（仍为 PREP_PASS）

## 9 · 全站 UAT（六大域）

```bash
bash scripts/dev/run-staging-uat-six-domains.sh
```

矩阵 SSOT：**[PHASE2-STAGING-UAT-PRODUCTION-READINESS-MATRIX.md](./PHASE2-STAGING-UAT-PRODUCTION-READINESS-MATRIX.md)**
