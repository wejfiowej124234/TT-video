# 93 矩阵 · 单条完整用户路径验证记录（本地 → 测试网 · 不部署 · 非主网）

**矩阵 SSOT**：[`docs/spec/93-全站功能验证矩阵-域别回归清单.md`](../../../docs/spec/93-全站功能验证矩阵-域别回归清单.md)  
**选定路径（产品叙事）**：**注册 → 登录 → 市场/向导 → 下单 → 向导接单 → 模拟支付（chain_off）→ 治理/奖励只读 API**  
**对应 93 用例 ID（可追溯）**：A-ENV-001 · **A-REG-001** · **A-LOG-001** · A-ME-001 · B-MKT-001 · B-GDE-001 · B-ORD-001 · B-MSG-002 · B-TRN-001 · B-ESC-001 · C-GOV-001 · C-GOV-002（奖励列表）  
**冻结声明**：本目录证据链 **已封闭**，见 **[`SCOPE-FROZEN.md`](./SCOPE-FROZEN.md)**；新增长路径请另建 `evidence/GO_*/93-path-*`（例：**[`../93-path-community-feed-post-detail/`](../93-path-community-feed-post-detail/REAL_CHAIN_VERIFY.md)**）。

**边界（与本轮指令一致）**

| 约束 | 含义 |
|------|------|
| **不部署** | 不执行 `forge script`/新合约部署；仅使用 `.env` / `frontend/.env.local` 中**已有**的合约地址与 RPC。 |
| **不跑「真实链」** | 不使用 **Ethereum 主网（chain id 1）** 等生产资金环境。**Sepolia（11155111）** 作为「测试网链上」阶段允许，仍为测试资产。 |
| **本地** | API +（可选）前端 + **chain_off** 能力；支付走 **`POST …/mock-pay`**（须 **`P3_CHAIN_OFF=1`**）。 |
| **测试网** | API/前端指向 **Sepolia** RPC + 已部署合约；**无 mock-pay**（该路径在链上环境为 **N/A** 或走真实托管 UI，需钱包与测试代币，本记录不冒充已跑通）。 |

## FREEZE（本条证据链已封闭）

- **权威清单**：[`SCOPE-FROZEN.md`](./SCOPE-FROZEN.md)。  
- **含义**：本目录下 **不再追加** 新用例 ID、新环境段（含测试网实战）、新前端路由；后续仅允许勘误 / 复跑登记类行级修订。  
- **下一条 93 路径**：见 **[`../93-path-community-feed-post-detail/REAL_CHAIN_VERIFY.md`](../93-path-community-feed-post-detail/REAL_CHAIN_VERIFY.md)**。

---

## §0.9 环境真值（本轮必须填写 · 禁止跨环境合并）

| 字段 | 本轮填写（**2026-04-19 执行轮**） |
|------|-----------|
| **`environment`** | `local` |
| **`database`** | `enabled`（`traveltrust-postgres` **healthy**，`DATABASE_URL` → `127.0.0.1:5432/traveltrust`） |
| **`chain_mode`** | `chain_off` + **`P3_CHAIN_OFF=1`**（mock-pay 可用）；`GET /meta` 中 `chain_id` 仍可为 **11155111**（元数据/对齐 hint，**非**本轮主网交易） |
| **`auth_mode`** | `bearer`（`tts_…` 会话 token） |

**进程备注**：首次 `docker compose up` 因引擎未起失败；已启动 **Docker Desktop** 后 Postgres **Up (healthy)**。API 启动命令前缀 **`STRICT_SSOT=0 CHECK_SSOT=0`**（避免根 `.env` 若开 **STRICT_SSOT** 与本机 sha 不一致导致拒启）；**`SEED_TEST_ACCOUNTS=1`**、**`P3_CHAIN_OFF=1`** 显式注入。

---

## 1) 依赖条件清单（env / 地址 / 进程）

### 本地（chain_off + mock-pay）

| 依赖 | 说明 |
|------|------|
| **Docker Postgres** | `docker compose up -d`，`DATABASE_URL` 与 [`docs/dev-local-smoke-baseline.md`](../../../docs/dev-local-smoke-baseline.md) 一致。 |
| **API** | `cargo run -p traveltrust-api`，默认 `http://127.0.0.1:8080`。 |
| **`SEED_TEST_ACCOUNTS=1`** | 注入 **`tourist@test.com` / `guide@test.com`**，密码 **`Test123!`**（见 `crates/api/src/chain_off/auth.rs`）。 |
| **`P3_CHAIN_OFF=1`** | 否则 **`POST …/mock-pay`** 返回 **501** `not_implemented`（见 `crates/api/src/routes/orders/mutations.rs`）。 |
| **chain_off 挂载** | 无 `chain_off` 状态时 mock-pay 同样 **501**；通常与 DB 联调同开。 |
| **STRICT_SSOT** | 若根 `.env` 开启 **`STRICT_SSOT=1`**，须满足 [`.env.example`](../../../.env.example) 最小清单（`SSOT_VERSION` / `SSOT_SHA256` / `CORS_ORIGINS` 等）。 |
| **前端（可选）** | `NEXT_PUBLIC_API_BASE_URL` 指向 API；根目录 `scripts/dev/sync-frontend-env-local-from-root.*` 同步链上展示字段。 |

### 测试网（Sepolia · 只读 + 可选钱包写）

| 依赖 | 说明 |
|------|------|
| **`CHAIN_ID=11155111`**、`CHAIN_RPC_URL` | 公开或自有 Sepolia RPC；**非主网**。 |
| **合约地址** | `FEE_ROUTER_ADDRESS`、`GOVERNANCE_*`、`ESCROW_FACTORY` 等以根 `.env` 与 **`GET /meta.chain.contracts`** 为真值；**不部署**即不新增地址。 |
| **B-ESC-001** | 在 **非 chain_off** 下 **不适用 mock-pay**；须 DApp + 钱包；无钱包则标 **BLOCKED** 并写原因。 |

---

## 2) 分步执行记录（API 为主；前端镜像路由）

**会话载体（§0.3）**：Bearer token（注册/登录响应中的 `token`）。

| 顺序 | 93 ID | 动作 | 本地（chain_off）期望 | 测试网备注 | 本轮结果 | 失败点 / 证据 |
|------|--------|------|------------------------|------------|----------|----------------|
| 0 | A-ENV-001 | `GET /health` · `GET /meta` | 均 **200** | 同左 | **PASS** | `health` **200**；`meta` **200**（`GET /meta` 偶发较慢，属环境观测）。 |
| 1 | A-REG-001 | `bash scripts/smoke-ab-core-chain.sh` 内 **HTTP** 注册新邮箱 | `POST /auth/register` **200** + token | 同左 | **PASS** | 邮箱形如 `ab.smoke.<unix>@example.com`（**以脚本 stdout 末行 `邮箱=` 为准**）。 |
| 1b | A-LOG-001 | 同脚本登录 | `POST /auth/login` **200** | 同左 | **PASS** | 与 **A-REG-001** 同一烟测 run。 |
| 1c | A-REG-001 | **浏览器** `/auth/register` 全段补口（与 F1-REG 同源） | 注册表单 → **POST** → 跳转登录 → 再进 **`/market`** | 同左 | **PASS** | **`frontend/e2e/93-matrix-path-f1-f4.spec.ts`** 首条用例；邮箱 `93-f1-reg-<unix>@e2e.local`。 |
| 2 | A-ME-001 | `GET /api/v1/me`（烟测 token） | **200** | 同左 | **PASS** | 烟测步骤 3。 |
| 3 | B-MKT-001 | `GET /api/v1/discover/orders` | **200** | 同左 | **PASS** | 烟测步骤 4。 |
| 4 | B-GDE-001 | `GET /api/v1/guides?city=杭州` | **200** + `items[0].id` | 同左 | **PASS** | 烟测步骤 5。 |
| 5 | B-ORD-001 | `POST /api/v1/orders` | **200** + `order.id` | 同左 | **PASS** | 烟测订单 **`ed672c36-4e3f-4bff-a533-b5ae51187ab7`**；`GET` 回读金额 **100**。 |
| 5b | B-MSG-002 | 订单消息 POST + GET | **200** / 列表含关键字 | 同左 | **PASS** | 烟测步骤 8–9；Docker `psql` 抽检 **OK**。 |
| 6 | A-LOG-001 | 种子 **`tourist@test.com` / `Test123!`** 登录 | **200** | 同左 | **PASS** | 扩展链（与烟测新注册账号独立）。 |
| 7 | B-ORD-001 | 游客下单（种子向导 `d548a82b-e9c8-44ce-a97c-3e2a418207cf`） | **200** | 同左 | **PASS** | 订单 **`22d9c717-6a13-4f4f-a285-e8d07ff1ee58`**，`status` 初始 **`created`**。 |
| 8 | B-TRN-001 | **`guide@test.com`** `POST …/accept` | **200**，`accepted` | 链上环境以 **04** 为准 | **PASS** | 响应体 `status":"accepted"`。 |
| 9 | B-ESC-001 | 游客 `POST …/mock-pay` | **200**，`escrowed` | **N/A** | **PASS** | 响应体 `status":"escrowed`**；依赖 **`P3_CHAIN_OFF=1`**。 |
| 10 | C-GOV-001 | `GET /api/v1/governance/pool` | **200**（须会话） | 同左 | **PASS**（Bearer） | **无** `Authorization` → **401**（未登录，与 **C-NEG-001** 一致）；**带** 游客 Bearer → **200**，`data_source":"database"`，`is_chain_ssot":false`。 |
| 11 | C-GOV-002 | `GET /api/v1/governance/rewards` | **200** | 同左 | **PASS**（Bearer） | 未登录 **401**；Bearer **200**，`items":[]`。 |

### 前端（与 §5 路由互证 · MANUAL-P1 → **AUTO-P0 等价：Playwright**）

| 顺序 | 路由 | 与 API 关系 | 本轮结果 |
|------|------|-------------|----------|
| F1-REG | `/auth/register` | **A-REG-001** 页面级 | **PASS** | 同文件 **`93-matrix-path-f1-f4.spec.ts`** 描述块 **「A-REG-001 /auth/register UI」**：`main`「注册」→ 提交 → **`/auth/login`** → 再登录进 **`/market`**。 |
| F1-LOG | `/auth/login` | **A-LOG-001** 页面级（种子游客） | **PASS** | 同文件第二用例：登录表单 → **`/market`**。 |
| F2 | `/market` | B-MKT / 下单入口 | **PASS** | 两用例均断言 **`main`「自由市场 / Market」** 与 **h1**（注册支路经登录后落市场）。 |
| F3 | `/escrow/[id]` | 订单详情 + 托管（API 已 **mock-pay** 后为 **escrowed**） | **PASS** | **mock-pay** 用例内 **API** 先建单→向导 **accept**→游客 **mock-pay**，再浏览器 **`/escrow/<uuid>`**；断言 **「已入金·待履约 / Funded · awaiting fulfillment」**。 |
| F4 | `/governance` | C-GOV 只读入口 | **PASS** | **h1「治理 / Governance」** + **`GOV_TARGET_NOTICE`**（与 **`smoke-governance.spec.ts`** 同源）。 |

**自动化复跑（Chromium · 链下 mock-pay）**：

```bash
# 终端 A：API（须 P3_CHAIN_OFF=1、DATABASE_URL、SEED_TEST_ACCOUNTS=1 等，与 §1 一致）
# 终端 B：frontend 目录
cd frontend
export PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1   # 本地 meta 可无满额 chain.contracts（与 CI 链关烟测同源）
export PLAYWRIGHT_BASE_URL=http://127.0.0.1:3012
export PLAYWRIGHT_API_BASE_URL=http://127.0.0.1:8080
export NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8080
npm run e2e -- e2e/93-matrix-path-f1-f4.spec.ts --project=chromium
```

**本轮机读结果**：**3 passed，1 skipped** — `setup-meta-chain` 中 **「Next rewrites /meta（full stack only）」** 在未设 **`PLAYWRIGHT_FULL_STACK=1`** 时 **skip**（预期）；**`93-matrix-path-f1-f4.spec.ts` 内 2 条用例**（**A-REG-001** 注册补口 + **F1–F4 mock-pay** 链）均 **passed**（约 **1～2 min**，含 Playwright 自启 **`npm run dev`**）。

---

## 3) 一键可复现命令（本地 API 已启动时）

**烟测（A+B 核心至消息，不含 mock-pay / 治理）**：

```bash
export DATABASE_URL='postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust'
export API_BASE_URL='http://127.0.0.1:8080'
bash scripts/smoke-ab-core-chain.sh
```

**在烟测之后补跑「接单 + mock-pay + 治理只读」（需 `P3_CHAIN_OFF=1` + 双账号 token）**：

```bash
API="${API_BASE_URL:-http://127.0.0.1:8080}"
T_JSON=$(curl -sS -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"tourist@test.com","password":"Test123!"}')
G_JSON=$(curl -sS -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"guide@test.com","password":"Test123!"}')
T_TOKEN=$(python -c "import json,sys; print(json.loads(sys.argv[1]).get('token',''))" "$T_JSON")
G_TOKEN=$(python -c "import json,sys; print(json.loads(sys.argv[1]).get('token',''))" "$G_JSON")
GUIDE_ID=$(curl -sS "$API/api/v1/guides?city=%E6%9D%AD%E5%B7%9E" | python -c "import json,sys; j=json.load(sys.stdin); print((j.get('items')or[{}])[0].get('id',''))")
ORDER=$(curl -sS -X POST "$API/api/v1/orders" -H "Authorization: Bearer $T_TOKEN" -H 'Content-Type: application/json' \
  -d "{\"guide_id\":\"$GUIDE_ID\",\"amount\":\"100\",\"currency\":\"USD\"}")
OID=$(python -c "import json,sys; print(json.loads(sys.argv[1])['order']['id'])" "$ORDER")
curl -sS -o /dev/null -w "accept %{http_code}\n" -X POST "$API/api/v1/orders/$OID/accept" -H "Authorization: Bearer $G_TOKEN"
curl -sS -o /dev/null -w "mock-pay %{http_code}\n" -X POST "$API/api/v1/orders/$OID/mock-pay" -H "Authorization: Bearer $T_TOKEN"
curl -sS -o /dev/null -w "pool %{http_code}\n" -H "Authorization: Bearer $T_TOKEN" "$API/api/v1/governance/pool"
curl -sS -o /dev/null -w "rewards %{http_code}\n" -H "Authorization: Bearer $T_TOKEN" "$API/api/v1/governance/rewards"
```

期望：`accept 200`、`mock-pay 200`；**`pool` / `rewards` 必须带** `Authorization: Bearer $T_TOKEN`（匿名为 **401**）。

**测试网阶段（不部署 · 仅只读 HTTP）**：

```bash
# 将 API_BASE_URL 指向已配置 Sepolia 的实例（或本地 API 已切 testnet env）
curl -sS "$API_BASE_URL/meta" | head -c 2000
curl -sS -o /dev/null -w "pool %{http_code}\n" -H "Authorization: Bearer <tts_…>" "$API_BASE_URL/api/v1/governance/pool"
```

**本条证据冻结后**：上表「测试网阶段」列为 **N/A（不在本链扩展）** — 若需 Sepolia 实战证据，**须另开目录**（见 **`SCOPE-FROZEN.md`**）。

托管支付 UI 与 tx 哈希：仅在有钱包与测试代币时记录；否则表内标 **BLOCKED**。

**契约勘误（本轮实测）**：**`GET /api/v1/governance/pool`** 与 **`GET /api/v1/governance/rewards`** 在**未带会话**时返回 **401**，须 **`Authorization: Bearer …`**（或 **`X-User-Id`**，见错误体）才得 **200**；矩阵 **§3**「只读」仍成立，但 **RBAC（93 §0.6 ③）** 为已登录可读。

---

## 4) 与自动化门禁的交叉引用

| 文档 / 脚本 | 覆盖范围 |
|-------------|----------|
| [`docs/dev-local-smoke-baseline.md`](../../../docs/dev-local-smoke-baseline.md) | 注册→消息；**不含** mock-pay / 治理。 |
| [`docs/runbook/TT-L4-CHROMIUM-SEPOLIA-E2E-BASELINE-001.md`](../../../docs/runbook/TT-L4-CHROMIUM-SEPOLIA-E2E-BASELINE-001.md) | 前端 Playwright **Sepolia** 子集；**grepInvert** 排除部分套件 ≠ 全站 93。 |
| [`frontend/e2e/93-matrix-path-f1-f4.spec.ts`](../../../frontend/e2e/93-matrix-path-f1-f4.spec.ts) | **A-REG-001** 注册 UI + **F1–F4** + **B-ESC-001** 数据前提（其中 mock-pay 段 **`@e2e-chain-off-mock-pay`**）。 |
| [`SCOPE-FROZEN.md`](./SCOPE-FROZEN.md) | 本链 **FROZEN**；禁止在本目录扩范围。 |
| [`../93-path-community-feed-post-detail/REAL_CHAIN_VERIFY.md`](../93-path-community-feed-post-detail/REAL_CHAIN_VERIFY.md) | **第二条** 93 路径（社区 D-COM）；与本链 **独立** 收敛。 |

---

## 5) 本轮结论（Release Gate 语义）

- **A+B 烟测（至消息 + DB 抽检）**：**PASS** — `bash scripts/smoke-ab-core-chain.sh` **exit 0**；订单 **`ed672c36-4e3f-4bff-a533-b5ae51187ab7`**。  
- **扩展链（接单 + mock-pay + 治理读）**：**PASS** — 订单 **`22d9c717-6a13-4f4f-a285-e8d07ff1ee58`** 经历 **`created` → `accepted` → `escrowed`**；**C-GOV** 在 **Bearer** 下 **200**。匿名调治理接口为 **401**（记为与 **C-NEG-001** 一致的负例语义，**不**将「未登录」记作 C-GOV 主路径 PASS）。  
- **前端 F1-REG / F1-LOG + F2–F4（浏览器）**：**PASS** — **`npm run e2e -- e2e/93-matrix-path-f1-f4.spec.ts --project=chromium`**，**3 passed / 1 skipped**（见上表「自动化复跑」）。托管页所验订单 UUID **由用例运行时 API 创建**（非固定 id，与 **B-466** 策略一致）。  
- **测试网段**：**N/A（本证据链冻结，不扩）** — 仍遵守「不部署 / 非主网资金链」；**Sepolia** 若需独立证据，走 **`SCOPE-FROZEN.md`** 所述 **新目录**。

---

**执行人 / 日期**：Agent 本机执行（Docker + API + bash 烟测 + curl + **Playwright 全段 F1**）· **2026-04-19**  
**证据目录**：`evidence/GO_20260419/93-path-register-order-mockpay-governance-read/`（Playwright 默认 HTML 报告：`frontend/playwright-report/index.html`）
