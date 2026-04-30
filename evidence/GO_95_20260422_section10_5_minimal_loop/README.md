# GO_95 · §10.5 终验最小闭环 — 机读旁证（2026-04-22）

## 1. 定位

**《95》§10.5** 四子条：**数据库** / **API** / **前端** / **一条端到端**。本包为 **§10.5** 之 **Docker·PG 态**（**§2**；**v1.4.148** **`[x]`**）+ **`npm run build`** **旁证**（**§3**；**v1.4.119** **`[x]`**）+ **Playwright 一条端到端** **有界 `[x]`**（**§6.2**；**v1.4.149**）；**API** 仍以 **`…section10_repo_windup/README.md` §10.5** 与 **95** 正文 **`[x]`** 为准；**不**宣称 **ISS-007** / **CI `build.yml` `e2e` job 全绿** / **93 最小子集** / **R-001** 主链已闭。

## 2. 数据库（`docker compose` + **已应用迁移**旁证）

**`docker compose` 配置**（仓库根）：

```bash
docker compose -f docker-compose.yml config -q
# → exit 0
```

**`postgres` 服务**（本机当次）：

```bash
docker compose ps
# → traveltrust-postgres … Up … (healthy) … 5432:5432
```

**`_sqlx_migrations` 行数**（与 **文首 `migrations` 真值 70** 对齐；**不**等价「本包内刚执行 `down -v` 冷启动链」）：

```bash
docker compose exec -T postgres psql -U traveltrust -d traveltrust -c "SELECT COUNT(*) AS migration_rows FROM _sqlx_migrations;"
# → migration_rows = 70
```

## 3. 前端（`npm run build`）

**环境**：**Git Bash** on **Windows**；**`frontend/`** 下若**无** **`node_modules/`** 则先 **`npm ci`**（当次 **`node_modules` 已存在`**，**未**强制重跑 **`npm ci`**）。

```bash
cd frontend
npm run build
# → exit 0（尾部见 Next 路由表摘要 + `sync-server-chunks: copied 127 chunk files to .next/server/`）
```

**诚实边界**：**不**替代 **`.github/workflows/build.yml`** 全矩阵绿；**历史** **`npm run build` exit 1** 仍见 **`evidence/GO_95_20260422_section10_npm_build_header_suspense/README.md`**；**ISS-007**/**Playwright E2E** 仍开。

## 4. 契约闸（**v1.4.148** 台账同批）

```bash
bash scripts/run-check-04-routes.sh
# → exit 0（本证据落盘当次；与 **95** **§0.2** / **00** 表 **95** 行互证）
```

## 5. 与 **§0.2** 台账

- **v1.4.119**：**95 §10.5** **「前端」** 子条 **`[x]`** → **`P=9→10`**、**`K=9/22→10/22`**、**总 %=35→37**（**`python -c "x=(15/33)+(43/78)+(0/33)+(10/22); print(round(100*x/4))"`** → **37**）。
- **v1.4.148**：**「数据库」** 子条 **`[x]`**（**§2** **`config -q`/`ps`/`psql`→70** + **§4** **`run-check-04` exit 0**）→ **`P=20→21`**、**`K=20/22→21/22`**、**总 %=48→49**（**`python -c "x=(15/33)+(44/78)+(0/33)+(21/22); print(round(100*x/4))"`** → **49**）；**台账同批** **[00](../../docs/spec/00-文档索引.md)** 表 **95** 行 **Version** **v1.4.148**（**端到端 `[x]`** 见 **v1.4.149** 下行）。
- **v1.4.149**：**「一条端到端」** **Playwright** **`[x]`**（**§6.2**；**`npx playwright test …` → `exit 0`**，**`2 passed` / `2 skipped`**）→ **`P=21→22`**、**`K=21/22→22/22`**、**`总 %=49→50`**；**台账同批** **00** **v1.4.149**（与 **[95](../../docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md)** **§0.2** / **§6** **1.4.149** 行互证）。

## 6. 一条端到端（Playwright · **有界 `[x]` · v1.4.149**）

**《95》§10.5** 正文要求：**单条 E2E**（**登录 → 主列表/Feed**）在 **staging** 或本地 **PASS**（证据可选进 **R-001**）。

**仓库内候选用例**：**`frontend/e2e/section10-5-login-community-feed.spec.ts`** — **`POST /auth/register`**（唯一邮箱）→ **UI 登录** **`returnUrl=/community`** → **`main` Feed** + **TT 社区** 标题 + **用户菜单** 可见。

### 6.1 与 **CI `build.yml`** 的差分（须读）

CI **`e2e` job** 起 **`traveltrust-api`** 时注入 **`SEED_TEST_ACCOUNTS`/`P3_CHAIN_OFF`/`DATABASE_URL`** 等；**本机 bounded 绿**额外依赖：**显式 `CHAIN_RPC_URL=`**（**空串**）以**屏蔽**仓库根 **`.env`** 里可能存在的 **`CHAIN_RPC_URL`**（否则 **`GET /meta`** 易 **`HTTP 408`**，**`setup-meta-chain`** 失败），以及 **`PLAYWRIGHT_FULL_STACK=0`** + **`PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1`** 与 **95 §0.2** 同口径。

### 6.2 本机复跑（**登记当次**）

**API**（**另开终端**；**勿**与 **`npm run dev`** 争 **8080**）：

```bash
CHAIN_RPC_URL= P3_CHAIN_OFF=1 SEED_TEST_ACCOUNTS=1 DATABASE_URL='postgres://…' \
  cargo run -p traveltrust-api
# → `curl -sf http://127.0.0.1:8080/health` / `curl -sf http://127.0.0.1:8080/meta` 200
```

**Playwright**（**`frontend/`**）：

```bash
cd frontend && npm ci && npx playwright install chromium && npm run build
PLAYWRIGHT_FULL_STACK=0 PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1 \
  npx playwright test e2e/section10-5-login-community-feed.spec.ts --project=chromium
# → exit 0（本登记：`2 passed` / `2 skipped`）
```

### 6.3 诚实边界

- **不**闭 **ISS-007** / **CI `build.yml` `e2e` job 全矩阵绿** / **93 最小子集** / **R-001 `report.json`** 主链。
- **`PLAYWRIGHT_FULL_STACK=1`**（**`scripts/dev/start-api-for-playwright.*`**）且根 **`.env`** 仍含 **非空 `CHAIN_RPC_URL`** 时，**`setup-meta-chain` → `GET /meta` 408** 风险**仍存在**；**本包 §6.2** 路径**刻意**规避该组合。
