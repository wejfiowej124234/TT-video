# TT-B435 · 用户钱包 → Escrow → FeeRouter 真实支付路径（`first_payment` 升级版）

**母表**：`B-435`（与 [TT-B435-FULLSTACK-FUND-TESTNET-RELEASE-CHAIN-001](./TT-B435-FULLSTACK-FUND-TESTNET-RELEASE-CHAIN-001.md) §3.3 互证）  
**卡号**：`TT-B435-USER-WALLET-ESCROW-FEEROUTER-PAYMENT-PATH-001`  
**前置**：`P3_CHAIN_OFF=0`、七键与 `GET /meta` 同源、[B-434](./TT-B434-FUND-TIMELOCK-TRUTH-ARBITRATION-001.md) 裁断已签署、`FEE_ROUTER_ADDRESS` 与 Escrow **`platformFeeRecipient`** 同址（见 `ops/RUNBOOK.md` 接线表）  
**对照**：[TT-B407](./TT-B407-REAL-CHAIN-REVENUE-E2E-001.md)（**release + distribute** 最小 Revenue 闭环）、[01 §三 资金流](../spec/01-总库总览.md) Escrow 硬约束  

---

## 1. 目的

在 **§3.3** 证据中，将 **`first_payment`** 从「治理/部署/接线类」交易，升级为能说明 **用户资金进入托管并最终与 FeeRouter 可观测链路一致** 的真实链上哈希，完成 **资金闭环验证** 的叙事与 Explorer 互证。

---

## 2. 交易类型怎么选（推荐顺序）

| 优先级 | 链上动作 | 典型 `from`（Explorer） | 说明 |
|--------|----------|-------------------------|------|
| **P0（首选）** | **ERC20 `approve` + `Escrow.deposit`**（或产品口径 **Paid**，链上对应 **Deposited**） | **用户 / 旅行者 EOA** | 最强「用户钱包出资」语义，与 **01** 资金流图一致。 |
| **P1** | **`Escrow.release`**（Completed 等终态，平台费腿进 **`platformFeeRecipient`→FeeRouter**） | 常为 **relayer/运营 EOA** | 强调 **资金进入 FeeRouter 余额**；与 **B-407** 链上段一致。 |
| **P2** | **`FeeRouter.distribute`** | **Timelock（owner）** | 强调 **84 拆分与 `PlatformFeeRouted`**；**不**替代用户 deposit 的「出资」叙事，可作为 **第二条** 哈希写入 `tx_hashes.json` 扩展键（若团队约定）。 |

**禁止**：把 **仅治理配置**（无用户资金、无 Escrow 状态迁移）的 `execute` 当作 **P0** 的 **`first_payment`**，除非团队书面降级为「阶段性证据」并单独说明。

---

## 3. 落地路径

### 3.1 路径 A — 复用 **TT-B407**（先有 **Funded** Escrow，再走 release → distribute）

1. **准备** **已** **`Funded`** **且** **`platformFeeRecipient == FEE_ROUTER_ADDRESS`** **的** **Escrow** **实例**（`B407_ESCROW_ADDRESS`）。  
   - **Funded** 来自 **路径 B** 的 **deposit**，或历史测试网已充值实例。  
2. 按 [TT-B407 §3](./TT-B407-REAL-CHAIN-REVENUE-E2E-001.md) 跑 **`b407-revenue-e2e-real-chain-runner.sh`**（HTTP 建单/绑地址 + **`b407-exec-chain-release-distribute.sh`**）。  
3. **选哈希**：  
   - 若已保留 **用户 deposit** tx → **优先**将该 tx 写入 **`first_payment`**。  
   - 若仅有 **release** / **distribute** → 可将 **release**（或团队约定的 **deposit**）写入 **`first_payment`**，并在证据 **README** 注明 **P0/P1**。

### 3.2 路径 B — **用户钱包直接 deposit**（`cast` 或前端）

1. 使用与部署一致的 **ERC20**（测试网 Mock/allowlist 稳定币）及 **`EscrowFactory` / `ESCROW_FACTORY_ADDRESS`**。  
2. **创建** **Escrow** **实例**（若尚无）：`createEscrow(...)`（参数与 **14** / 部署脚本一致）。  
3. 用户钱包：**`approve(escrow, amount)`** → **`deposit(amount)`**（或经前端同一 ABI）。  
4. 在 Sepolia Explorer 确认 **`from`** 为用户地址，复制 **tx hash**。  
5. 写入证据：  
   ```bash
   export B435_FIRST_PAYMENT_TX=0x……
   export B435_TX_HASHES_JSON=evidence/b435_fullstack_fund_testnet_closeout/run_<UTC>/tx_hashes.json
   bash scripts/ops/b435-merge-first-payment-tx.example.sh
   ```

### 3.3 路径 C — **观测闭环**（与 §3.4 一致）

在 API 与 **`INTERNAL_API_SECRET`** / **admin** 凭据就绪后：

- `POST …/internal/indexer-tick`  
- `POST …/internal/indexer-reconcile`（`persist:true`）  
- `GET …/admin/observability/overview`  

确保 **`fee_router_*` / 订单投影** 等与链上事件可对照（见现有 **`reconcile.json` / `overview.json`** 落盘脚本）。

---

## 4. 证据目录更新约定

- **`tx_hashes.json`**：**`first_payment`** = 选定主哈希（建议 **P0 deposit**）。  
- **`README.md`**（本 `run_<UTC>/`）：写一句 **「first_payment 等级：P0/P1」** 与 **Explorer 链接**。  
- 若另有 **release/distribute** 哈希：可增 **`first_payment_release`** / **`fee_router_distribute`** 等键（与团队台账一致即可）。

---

## 5. 脚本索引

| 脚本 | 用途 |
|------|------|
| [`scripts/ops/sepolia-escrow-traveler-approve-deposit.example.sh`](../../scripts/ops/sepolia-escrow-traveler-approve-deposit.example.sh) | 用户钱包 **`approve` + `deposit`**（**Created** Escrow；标准 ERC20） |
| [`scripts/ops/b435-merge-first-payment-tx.example.sh`](../../scripts/ops/b435-merge-first-payment-tx.example.sh) | 将 **`B435_FIRST_PAYMENT_TX`** 合并进 **`tx_hashes.json`** |
| [`scripts/ops/b435-evidence-internal-curls.example.sh`](../../scripts/ops/b435-evidence-internal-curls.example.sh) | §3.4 **tick / reconcile / overview**；可选 **`B435_INCLUDE_FEE_ROUTER_B383`**、**`VERIFY_FEE_ROUTER_EVENTS_RPC`** + **`FEE_ROUTER_VERIFY_TX_HASH`**（**B-383 / B-081**） |
| [`scripts/ops/b435-seal-run-bundle.example.sh`](../../scripts/ops/b435-seal-run-bundle.example.sh) | 合并 + 证据 curl **一键**（注意 **`API_BASE_URL`** 与监听端口一致） |
| [`scripts/ops/b407-revenue-e2e-real-chain-runner.sh`](../../scripts/ops/b407-revenue-e2e-real-chain-runner.sh) | **TT-B407** 编排 |
| [`scripts/ops/b407-exec-chain-release-distribute.sh`](../../scripts/ops/b407-exec-chain-release-distribute.sh) | **release → FeeRouter → distribute**；**`B407_SKIP_DISTRIBUTE=1`** 仅 **release**；**`B407_SKIP_RELEASE=1`** 仅 **distribute**（**已** **release** **后** **勿** **再** **全量** **跑** **本** **脚本** **，** **否则** **`release()`** **会** **失败** **） |

---

## 6. 验收口径（与 TT-B435 §3.3 对齐）

1. **`P3_CHAIN_OFF=0`**，未走 **`mock-pay`**。  
2. **Explorer** 可打开 **`first_payment`**，且字段语义与 **本节 P0/P1** 声明一致。  
3. **indexer / reconcile / overview** 与链上 **FeeRouter / Escrow** 投影 **无矛盾**（允许测试网 **零单** 下的 **空投影**，但须在 README 说明环境）。

---

## 7. 端到端顺序（deposit → escrowed → release → FeeRouter → 观测）

以下与 **`Escrow.sol`**、索引器 **`Deposited`→`Paid`** 投影一致，**按序执行**即可闭环验收。

| 阶段 | 链上 | API 订单态（索引后） | 你要验证什么 |
|------|------|----------------------|--------------|
| **① 入金** | 用户 EOA：**`approve` + `deposit`** → **`Deposited`**，`status=Funded` | 仍为 **`accepted`**，直至 tick | Explorer：**`Deposited`**；**`msg.sender`** = **`traveler`**；**`amount==totalAmount`** |
| **② 同步** | — | **`accepted` → `escrowed`** | **`POST …/internal/indexer-tick`** **200**；必要时 **`POST …/internal/indexer-reconcile`**（`persist:true`） |
| **③ 分账** | 任意调用方：**`release()`** → **`Released`**；**`fee`** 腿 **`IERC20.transfer(platformFeeRecipient, fee)`** | 向 **`completed`** 等投影（与 **B-409** 状态机一致） | **前置**：链上 **`Funded`**（与 **`escrowed`** 对齐）。**`platformFeeRecipient`** 须 = **`FEE_ROUTER_ADDRESS`**（Explorer 看 **ERC20 转入 FeeRouter 合约**） |
| **④（可选）池内路由** | **`FeeRouter.distribute`**（**`onlyOwner`**，常为 Timelock） | 与 **84 路由 / `PlatformFeeRouted`** 观测相关 | **与 ③ 不同笔交易**：③ 是 **release 把平台费代币打进 FeeRouter 地址**；④ 是 **Router 内再拆分**。Overview 里部分指标偏 **④**，验收时两种口径不要混用 |

**推荐命令（仓库根，`.env` 已含 `INTERNAL_API_SECRET` / `ADMIN_BEARER_TOKEN`，`API_BASE_URL` 与监听端口一致）：**

```bash
# ② 入金完成后
set -a && source .env && set +a
curl -sS -X POST "${API_BASE_URL:-http://127.0.0.1:8080}/api/v1/internal/indexer-tick" \
  -H "Content-Type: application/json" \
  -H "X-Internal-Api-Secret: $INTERNAL_API_SECRET" -d '{}'
# ③ release +（可选）distribute：与 B-407 同源
# bash scripts/ops/b407-exec-chain-release-distribute.sh
# ④ 再拉一次观测落盘（同上文路径 C）
# bash scripts/ops/b435-evidence-internal-curls.example.sh
```

**人工前端路径**：**①** 在 **`/escrow/{orderId}`** 完成 **approve+deposit**；**③** 可在同一页 **release**（或脚本 **`b407-exec-chain-release-distribute.sh`**，须 **`B407_ESCROW` / `B407_RELAYER_PK` / `B407_OWNER_PK`** 等，见脚本头注释）。**④** 观测落盘见上文 **路径 C** 与 **`b435-evidence-internal-curls.example.sh`**。

**证据**：除 **`first_payment`（deposit tx）** 外，可在 **`tx_hashes.json`** 增加 **`release_tx`** / **`fee_router_distribute_tx`**（若执行 **④**），并在 **`run_* / README.md`** 写 Explorer 链接与 **P0/P1/P2** 标注。

---

## 8. `escrowed` 后 `release`：交叉验证平台费进 FeeRouter

**前置（须同时成立）**

- API 订单 **`state=escrowed`**，且链上该 Escrow **`status=Funded`**（与 **第 7 节** **②** 一致）。  
- 建单时 **`platformFeeRecipient`** = **`GET /meta`** 中 **`chain.contracts`** 与 **`.env` `FEE_ROUTER_ADDRESS`** 同址；否则 **`release`** 仍可能成功，但平台费不会进「你们认定的」FeeRouter。

**执行 `release`**

- 前端 **`/escrow/{orderId}`** 链上 **release**，或 **`scripts/ops/b407-exec-chain-release-distribute.sh`**（可设 **`B407_SKIP_DISTRIBUTE=1`** 若只验 **release** 腿）。

**Explorer（链上真源）**

1. 打开 **release** 交易 → 目标 **Escrow** 合约。  
2. 在 **Logs** 中确认 **`Released(orderId, escrow, guideAmount, fee)`**（或合约 ABI 等价字段），记下 **`fee`**（平台费腿）。  
3. 在同一笔或紧随的 **ERC20 `Transfer`** 中，确认 **`to`** = **FeeRouter 地址**、**`value`** 与 **`fee`** 一致（余数归平台费的约定见 **`Escrow.sol` 注释**）。

**索引与后台（与链上对拍）**

```bash
set -a && source .env && set +a
curl -sS -X POST "${API_BASE_URL:-http://127.0.0.1:8080}/api/v1/internal/indexer-tick" \
  -H "Content-Type: application/json" \
  -H "X-Internal-Api-Secret: $INTERNAL_API_SECRET" -d '{}'
curl -sS -X POST "${API_BASE_URL:-http://127.0.0.1:8080}/api/v1/internal/indexer-reconcile" \
  -H "Content-Type: application/json" \
  -H "X-Internal-Api-Secret: $INTERNAL_API_SECRET" \
  -d '{"persist":true}'
# 落盘或人工查看（须 ADMIN_BEARER_TOKEN）
# bash scripts/ops/b435-evidence-internal-curls.example.sh
```

- **`GET …/admin/observability/overview`**：对照 **`fee_router_*` / 治理与费池相关块**（具体键名随版本扩展；以响应中 **FeeRouter 地址、链上读、投影行数** 与 Explorer 无矛盾为准）。  
- **`indexer-reconcile` 响应 / `reconcile.json`**：订单投影 **`completed`**（或你们状态机终态）与 **`Released`** 索引一致；FeeRouter 侧以 **DB/投影中已 ingest 的事件行** 与 **链上 `fee`** 可解释为准。

**口径提醒**：**③ `release` 转入 FeeRouter** 增加 **Router 合约 ERC20 余额**；**④ `distribute`** 才产生典型 **`PlatformFeeRouted`** 类路由观测。验收「平台费已入 FeeRouter」时，以 **Explorer 上转入 FeeRouter 的 `Transfer`** 为 **P0**；overview 中偏 **④** 的指标仅作 **辅助**。
