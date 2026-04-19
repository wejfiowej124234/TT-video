# TT-LOCAL-R003-DEV-FULLCHAIN-001 · 本地全链路（无 staging 域名）

**Version:** 1.0.0  
**Status:** 可执行（**不**替代 **93-R003-STAGING / TT-B486** staging 封口）  
**互指**：[dev-local-smoke-baseline.md](../dev-local-smoke-baseline.md) · [R-003 Runbook](../spec/R-003-Staging首次完整回归-A-B域-执行Runbook.md) · [from-stash §TT-LOCAL](../AI任务卡索引.from-stash.md#tt-local-r003-dev-fullchain-001)

---

## 你要解决什么问题

尚未部署 **公网/内网 staging API** 时，在 **本机 `127.0.0.1:8080` + Docker Postgres** 上：

1. 用 **bash 烟测** 跑通 **注册 → 登录 → /me → 市场 → 下单 → 订单 → 消息**，并尽量做 **DB 抽检**；  
2. 用 **`R003_LOCAL_CHAIN=1`** 跑通与 **R-003 同源**的 **Python 证据链**（回归 → **`validate --fail-on-no-go`**），产出 **`evidence/R003_local_evidence_chain/report.json`**。

**不是**：**`evidence/GO_20260418/`** 的 staging 首轮封口、**TT-B486** 行 420 已封口、生产发版闸。

---

## 环境前提

| 项 | 说明 |
|----|------|
| Docker | `docker compose up -d` 能拉起 Postgres（默认 **`traveltrust-postgres`**） |
| Rust | 能 `cargo run -p traveltrust-api` |
| Bash | Git Bash / WSL（Windows 可用 **`scripts/start-api-with-seed.bat`** 起 API） |
| 端口 | API **8080**（与 **`docs/dev-local-smoke-baseline.md`** 一致） |

---

## 步骤（按序）

### 1）起数据库

仓库根：

```bash
docker compose up -d
```

### 2）起 API（含种子账号，推荐）

仓库根（Unix 风格 shell）：

```bash
export DATABASE_URL='postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust'
export PORT=8080
export SEED_TEST_ACCOUNTS=1
cargo run -p traveltrust-api
```

**Windows**：优先 **`scripts/start-api-with-seed.bat`**（脚本内会轮询 `/health` 并同步前端 env，见 bat 头注释）。

另开终端继续下面步骤。

### 3）A+B 主链 bash 烟测（HTTP + 可选 DB 抽检）

仓库根：

```bash
export DATABASE_URL='postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust'
export API_BASE_URL='http://127.0.0.1:8080'
bash scripts/smoke-ab-core-chain.sh
```

**验收**：**exit 0**；成功标准见 **[dev-local-smoke-baseline.md §4](../dev-local-smoke-baseline.md)**。

### 4）R-003 同源证据链（local + validate）

仍在仓库根（**勿**在 `.env.r003.local` 里打开 **`R003_LOCAL_CHAIN`** 去污染 staging 行时，用**环境变量**一次性指定即可）：

```bash
export R003_LOCAL_CHAIN=1
python scripts/dev/run_r003_staging_evidence_chain.py --from-env
```

**验收**：终端末尾 **`validate-regression-report.py … --fail-on-no-go`** **exit 0**；**`evidence/R003_local_evidence_chain/report.json`** 中 **`release_gate`** 为 **GO** 或 **PARTIAL_GO**。

### 5）（可选）前端页面联调

- 配置 **`frontend/.env.local`** 中 **`NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8080`**（与 **`frontend/.env.example`**、**`docs/spec/04-后端与API.md`** 一致）。  
- **`cd frontend && npm run dev`**，按 **[测试账号与本地联调.md](../测试账号与本地联调.md)** 与 **[93 矩阵](../spec/93-全站功能验证矩阵-域别回归清单.md)** 逐页点验（**无**单命令覆盖全站 UI）。

---

## 封口与下一跳

| 条件 | 动作 |
|------|------|
| 本卡 **1～4** 全绿 | 可在 **PR / 团队台账** 将 **from-stash 一览行 433** 第三列改为 **已封口（日期 · local · 证据路径）**（模板团队自定）。 |
| 已拿到 **staging `https://…` API** | 改走 **[TT-B486](../AI任务卡索引.from-stash.md#tt-b486-93-r003-staging-batch-001)**：**勿**再依赖 **`R003_LOCAL_CHAIN`**，证据落 **`evidence/GO_20260418/`**。 |

---

## 维护

- **API / 脚本变更**导致烟测或证据链失败时，先修 **实现** 或 **本 Runbook 命令**，再更新 **from-stash 一览 433** 状态列。
