# 本地 A+B 主链 · 开发验收基线（可重复）

**范围**：本地/可控环境，验证注册→登录→`/me`→市场→下单→订单→消息；**不涉及** staging 证据、`report.json`、发布或 GO/NO_GO。

**任务卡（无 staging 域名时的「本地全链路」）**：[**TT-LOCAL-R003-DEV-FULLCHAIN-001**](runbook/TT-LOCAL-R003-DEV-FULLCHAIN-001.md)（from-stash **一览** **433**）。

**Sepolia 浏览器全绿基线（Playwright `chromium-sepolia`）**：[**TT-L4-CHROMIUM-SEPOLIA-E2E-BASELINE-001**](runbook/TT-L4-CHROMIUM-SEPOLIA-E2E-BASELINE-001.md)（`frontend`：`npm run e2e:sepolia`）。

**GitHub Actions 上同套件的并行观测（CI · 与本地正交）**：[**TT-L4-PARALLEL-CI-001**](runbook/TT-L4-PARALLEL-CI-001.md)（**workflow 总结论 ✓** **不**等价于已在 CI 跑完 **`e2e:sepolia`**，见该文 **§2** / **§5**）。

**权威脚本**：仓库根 `bash scripts/smoke-ab-core-chain.sh`（薄入口：`scripts/smoke-ab-core-chain.sh` → `scripts/dev/smoke-ab-core-chain.sh`）。

---

## 1. 环境前提

| 项 | 说明 |
|----|------|
| Docker | `docker compose up -d` 能拉起 **`traveltrust-postgres`**（默认端口 **5432**） |
| API | `traveltrust-api` 监听 **`API_BASE_URL`**（默认 **`http://127.0.0.1:8080`**） |
| **可选 · 社区媒体** | MinIO **`:19000`**（`bash scripts/dev/setup-community-media-minio-local.sh` · CFG-006） |
| **可选 · 链上** | Anvil **`:8545`** + 根 `.env` **`TT ANVIL LOCAL`** 块；未起链时 **`P3_CHAIN_OFF=1`** 走链下走廊（CFG-007） |
| **配置漂移登记** | **FROZEN** · [CFG-REGISTRY](../evidence/manual-uat/summary/CFG-REGISTRY.md)（CFG-001～028 · 维护验证 `bash scripts/dev/verify-cfg-drift-closure.sh` · [TT-CONFIGURATION-ZERO-DRIFT-FROZEN](../docs/runbook/TT-CONFIGURATION-ZERO-DRIFT-FROZEN.md)） |
| 链下种子 | 建议 **`SEED_TEST_ACCOUNTS=1`**，保证杭州 **`/api/v1/guides?city=杭州`** 至少有一名 active 向导 |
| 客户端 | **curl**、**bash**、能 **`import json`** 的 **python** 或 **python3**（Windows 勿用 Store 占位 `python3`；脚本会择优） |
| 工作目录 | 在**仓库根**执行烟测（脚本使用相对路径 `.smoke_ab_body.json`） |
| **STRICT_SSOT=1** | 根 `.env` 须含 **`SSOT_VERSION`**（非 `unset`）、**`SSOT_SHA256`**（与 `docs/spec/08-3-参数与门禁表.md` 一致）、**`CHARGEBACK_POLICY`**、**非空 `CORS_ORIGINS`**（本地全栈建议含 **`http://localhost:3012`** 与 **`http://127.0.0.1:3012`**）；预检：`bash scripts/dev/check-strict-ssot-local-prereqs.sh` 或 `powershell -File scripts/dev/check-strict-ssot-local-prereqs.ps1`。详见 **`.env.example`** 中「STRICT_SSOT 本地最小清单」。 |
| **链上地址 ↔ 前端** | 根 `.env` 的 **`CHAIN_ID` / `CHAIN_RPC_URL` / 合约地址** 与 **`scripts/dev/sync-frontend-env-local-from-root.*`** 写入的 **`NEXT_PUBLIC_*`** 须与目标部署一致；同步脚本在缺 **`CHAIN_RPC_URL`** 或 **`GOVERNANCE_TOKEN_ADDRESS`** 时会 **WARN**。 |

---

## 2. 一键启动 API（最低成本）

在项目根：

```bash
docker compose up -d
export DATABASE_URL='postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust'
export PORT=8080
export SEED_TEST_ACCOUNTS=1
cargo run -p traveltrust-api
```

Windows 也可用 **`scripts\start-api-with-seed.bat`**（已注入默认 `DATABASE_URL`、轮询 `/health`、同步 `frontend/.env.local`）。

**说明**：若根目录存在 `.env` 且含 `DATABASE_URL`，运行时仍以 dotenv 为准；未配置时请保证与上表一致，否则 API 可能无 PgPool，订单/消息不落库。

---

## 3. 一键烟测

另开终端，仓库根：

```bash
export DATABASE_URL='postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust'
export API_BASE_URL='http://127.0.0.1:8080'
bash scripts/smoke-ab-core-chain.sh
```

`DATABASE_URL` 用于脚本第 10 步 **PostgreSQL 抽检**（与 API 指向同一库）。

---

## 4. 成功标准（开发验收）

全部满足即视为**本基线通过**：

| # | 条件 |
|---|------|
| A | **`bash scripts/smoke-ab-core-chain.sh` 退出码为 `0`** |
| B | **`GET ${API_BASE_URL}/health` 返回 HTTP `200`**（脚本开头即检查） |
| C | **数据库**：存在**至少一条**与本 run 订单关联的 **`order_messages`** 行，且内容匹配脚本发帖关键字（脚本第 10 步；或手工用下方 SQL 核对） |

**非目标**：不替代 **R-003** staging 的 `report.json`、四门证据与发布闸。

---

## 5. 数据库验证方式（不依赖本机 `psql`）

烟测脚本优先顺序：

1. 若存在 **`psql`** 且设置了 **`DATABASE_URL`**：用 `psql "$DATABASE_URL"` 执行抽检。
2. 否则若存在 **Docker** 且容器 **`traveltrust-postgres`**（可用 **`SMOKE_PG_CONTAINER`** 覆盖）在运行：用  
   **`docker exec "$SMOKE_PG_CONTAINER" psql -U traveltrust -d traveltrust ...`**  
   执行同等 SQL（与 `docker-compose.yml` 默认用户/库一致）。
3. 若两者皆不可用：第 10 步打印**跳过**，仅 HTTP 仍验收；此时若需基线 **C**，请安装客户端工具或启动 Docker 后重跑。

**手工复核示例**（订单 ID、邮箱替换为本次脚本输出）：

```bash
docker exec traveltrust-postgres psql -U traveltrust -d traveltrust -c \
  "SELECT count(*) FROM order_messages WHERE order_id='<ORDER_UUID>'::uuid AND content LIKE '%smoke-ab-core-chain%';"
```

---

## 6. 互指

- **Runbook（staging 真跑，非本基线）**：[R-003-Staging首次完整回归-A-B域-执行Runbook.md](spec/R-003-Staging首次完整回归-A-B域-执行Runbook.md) · `#r003-ab-core-acceptance`
- **脚本索引**：[scripts/README.md](../scripts/README.md) 表项 **smoke-ab-core-chain.sh**
- **商家入驻全链（① · 相对 A+B 正交）**：**§8** · **[provider/register README](../frontend/app/provider/register/README.md)** · **[TT-9618 §2.1](runbook/TT-9618-onboarding-local-testnet.md)**
- **旅行收购 PD-009（① · 相对 A+B 正交）**：**§9** · **[market/acquisition README](../frontend/app/market/acquisition/README.md)** · **[acquisition-publish-trust-rules §8.1](spec/artifacts/acquisition-publish-trust-rules.v1.md#81-第一阶段--本地--closed2026-05-27)**
- **`/` Web3旅行 + `/market` 主入口（① · 相对 A+B 正交）**：**§10** · **[LANDING-MARKET-PAGES-CODE-SSOT](../frontend/evidence/GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md)** · **[WEB3-LANDING-MARKET-LOCAL-REMAINING](../frontend/evidence/GO_local_web3_pages_closure/WEB3-LANDING-MARKET-LOCAL-REMAINING.md)**

---

## 7. 干净环境 / 同事机复跑登记（基线成立证明）

在**非文档作者**机器上严格按 **§2 → §3** 执行后，若满足 **§4**（含 **§5** 之 DB 路径），即视为**本地开发验收基线**在该环境成立。建议在 PR 或内部工单中贴**本节表格一行**。

**团队可复现（推荐）**：仓库 **GitHub Actions** 工作流 **`Dev local smoke baseline`**（**`.github/workflows/dev-local-smoke-baseline.yml`**）在**每次 push/PR 至 `main`** 于**干净 Ubuntu Runner** 上自动执行与本文等价的流程：空 **Postgres 16** service → **`cargo run -p traveltrust-api`** → **`bash scripts/smoke-ab-core-chain.sh`**。CI 内安装 **`postgresql-client`**，第 10 步走 **`psql "$DATABASE_URL"`**（与 §5 第 1 条一致；**无** Docker 容器名 `traveltrust-postgres`，故不使用 `docker exec` 分支）。**工作流绿 = 非本机、非原作者的自动化互证**，与下表「同事手工登记」二选一或并存。

### 7.1 已登记复跑（示例 · 手工）

| 日期 | 环境摘要 | 本机 `psql` | DB 抽检路径 | `smoke` exit | 备注 |
|------|-----------|---------------|-------------|--------------|------|
| 2026-04-18 | Win10 · Git Bash · Docker Desktop · 仓库根 | **无**（`command -v psql` 空） | **docker exec `traveltrust-postgres` psql**（第 10 步文案含「无本机 psql」） | **0** | `docker compose down -v` 后重建卷；`cargo run` 与文档 §2 一致；第 10 步末行 `DB: orders + users + order_messages OK` |

**说明**：无法在自动化环境中替代**每一位同事的本机**；上表为按本文**完整命令序列**在独立会话中复跑的一次**有效样本**。其他同事只需在同一表格**追加一行**（或复制本段至 PR 描述）即完成「非原作者」互证。

### 7.2 推荐一键命令块（与 §2 §3 相同，便于复制）

```bash
# 终端 A — 数据库（可选：全新卷）
docker compose down -v
docker compose up -d

# 终端 A — API（与 §2 一致）
export DATABASE_URL='postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust'
export PORT=8080
export SEED_TEST_ACCOUNTS=1
cargo run -p traveltrust-api
```

待 `curl -sf -o /dev/null -w '%{http_code}' http://127.0.0.1:8080/health` 输出 `200` 后，**终端 B**：

```bash
export DATABASE_URL='postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust'
export API_BASE_URL='http://127.0.0.1:8080'
bash scripts/smoke-ab-core-chain.sh
echo "exit=$?"
```

**期望**：`exit=0`；第 **10** 步为 **`psql` + DATABASE_URL** 或 **`docker exec … psql`** 之一；末行含 **`DB: orders + users + order_messages OK`**。若本机**未**安装 `psql`，应出现「**docker exec … psql，无本机 psql**」类提示且仍 **OK**。

---

## 8. 商家入驻全链（① · 相对 A+B 正交）

**范围**：注册 → 钱包 → 资质 → 96-18 准入费 → **`PATCH …/admin/users/:id/provider-application-review`**（Admin 审核）→ 市场 listing。**不**替代 **§3～§4** A+B 烟测；**不**冒充 **②③**。

**Admin UX（代码）**：列表 **`/admin/provider-applications`** → 审核 **`/admin/users/[id]`** · **`AdminProviderApplicationReviewCard`**（见 SSOT §2.4）。

**权威脚本**：`bash scripts/dev/smoke-provider-onboarding-local.sh`（Windows：`scripts\smoke-provider-onboarding-local.bat`）。

**代码 SSOT**：[`frontend/app/provider/register/README.md`](../frontend/app/provider/register/README.md) · [TT-9618 §2.1](runbook/TT-9618-onboarding-local-testnet.md) · [04 §3.4 · 商家入驻实现真源](spec/04-后端与API.md)。

**前置（在 §1 基础上）**：`INTERNAL_API_SECRET` · `SEED_TEST_ACCOUNTS=1`（Admin `promote_admin_email`）。

```bash
export DATABASE_URL='postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust'
export INTERNAL_API_SECRET='…'   # 与 .env 同源
export SEED_TEST_ACCOUNTS=1
bash scripts/dev/smoke-provider-onboarding-local.sh
echo "exit=$?"
```

**期望**：`exit=0`；覆盖 **`GET /me` role=provider**（内存同步）与 **`POST/GET …/market/provider/listings`**。

---

## 9. 旅行收购 PD-009（① · 相对 A+B 正交）

**范围**：**`/me/identities`** **「进入子站」** → **`/market/acquisition`** 绑主钱包 → **`POST …/me/acquisition/publish-bond`**（或信用免押）→ **`POST …/market/acquisition/listings`**（**`acquisition_publish_gate.rs`** · **非** **`region_steward`** / **96-18 准入费**）→ 目录/草稿/创单。**不**替代 **§3～§4** A+B 烟测；**不**冒充 **②③**。

**权威脚本**：`bash scripts/dev/smoke-acquisition-pd009-local.sh`。

**代码 SSOT**：[`frontend/app/market/acquisition/README.md`](../frontend/app/market/acquisition/README.md) · [acquisition-publish-trust-rules v1 §8.1](spec/artifacts/acquisition-publish-trust-rules.v1.md#81-第一阶段--本地--closed2026-05-27) · [93 §2.1b](spec/93-全站功能验证矩阵-域别回归清单.md#93-21b-acquisition-pd009) · [96-17 §0.3.3](spec/96-17-多重身份与钱包真值.md)。

**前置（在 §1 基础上）**：`SEED_TEST_ACCOUNTS=1`。

```bash
export DATABASE_URL='postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust'
export SEED_TEST_ACCOUNTS=1
bash scripts/dev/smoke-acquisition-pd009-local.sh
echo "exit=$?"
```

**期望**：`exit=0`；覆盖 **`GET /me.trust.acquisition_*`**、**`POST …/market/acquisition/listings*`** 门闸与可选 Admin suspend 子路径。

---

## 10. Web3 旅行首页 + 自由市场主入口（① · 相对 A+B 正交）

**范围**：**`/`** 创新行程 **1×** `POST /itineraries` · **`ITINERARY_CARD_COUNT=1`** · **`landingItinerarySession`**（**`localStorage`** · 跨 tab）· 预览 **`UnlockModal`→`getOrder`** → **`/escrow/[id]`** 草稿链；**`/market`** **`useMarketPage`**（**300ms debounce** · 收藏 **`localStorage` + F-020 best-effort**（已登录）· **②** 跨设备 SLA）。**不**替代 **§3～§4** A+B 烟测；**不**冒充 **②③**。

**权威脚本（①）**：

```bash
bash scripts/dev/run-web3-itinerary-l5-green.sh
bash scripts/dev/smoke-web3-itinerary-full-chain-local.sh
```

**代码 SSOT**：[LANDING-MARKET-PAGES-CODE-SSOT](../frontend/evidence/GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md) · [`app/(home)/README`](../frontend/app/(home)/README.md) · [`app/market/README`](../frontend/app/market/README.md) · [GO_local_web3_itinerary_l5](../frontend/evidence/GO_local_web3_itinerary_l5/README.md)

**前置（在 §1 基础上）**：`traveltrust-api` + DB（走廊烟测 **`smoke-web3-itinerary-full-chain-local.sh`** 会创单/读单）；前端 Vitest 绿集 **`run-web3-itinerary-l5-green.sh`** 可 **无** 浏览器。

**期望**：两脚本 **`exit 0`**；与 **CODE SSOT §7** 机读验收列表一致。

---

## 11. Admin 控制台（① · 相对 A+B 正交）

**范围**：**`/admin`** 工作台（系统概况 · 待办 · KPI）· Shell/RBAC · 队列台账 · L5 危险写确认 · 列表/详情 SWR。**不**替代 **§3～§4** A+B 烟测；**不**冒充 **② staging 六角色矩阵 / ③ Production GO**。

**代码 SSOT**：[`frontend/app/admin/README.md`](../frontend/app/admin/README.md) · [70 §3.0.2](spec/70-管理员系统开发文档.md) · [ADMIN-L5-HOME-SYSTEM-OVERVIEW-CODE-SSOT](../frontend/evidence/GO_local_admin_workspace_closure/ADMIN-L5-HOME-SYSTEM-OVERVIEW-CODE-SSOT.md)

**前置（在 §1 基础上）**：API **:8080** · FE **:3012** · **`SEED_TEST_ACCOUNTS=1`**（RBAC/ADM-U02 烟测）· **`DATABASE_URL`**（docker **`traveltrust-postgres`** 或本机 psql）

```bash
# 推荐一键（capabilities 探针 + L5 绿集 + M-03 页面 HTTP）
bash scripts/dev/verify-admin-audit-closure.sh

# 或分项：
bash scripts/dev/run-admin-l5-green.sh              # Vitest 绿集
bash scripts/dev/smoke-admin-pages-local.sh         # M-03
bash scripts/dev/smoke-admin-rbac-matrix-local.sh   # M-01 · promote + 重登
bash scripts/dev/smoke-admin-adm-u02-local.sh       # M-02 · TT_ADM_U02_LOCAL: PASS
echo "exit=$?"
```

**期望**：绿集 **`exit 0`**；M-02 末行 **`TT_ADM_U02_LOCAL: PASS`**；M-01/M-03 **`exit 0`**。
