# Web3 Sepolia Reality Certification（② 唯一 SSOT）

**Document ID:** `TT-WEB3-SEPOLIA-REALITY-CERTIFICATION`  
**Supersedes display title:** ~~Reality Verification Checklist~~（同文件 lineage · 禁止平行 Runbook）  
**Phase:** **② Sepolia · Web3 Reality Certification**（测试币 · 真实钱包 · 真实交易 · ≠ ③ Production GO）  
**Engineering HEAD（① 冻结）：** `9de9c1eb`  
**Baseline chain:** `9f500335` → `4f56727e` → `f575d459` → `1f205af1` → `d1bee7fc` → `ee9df065` → `9de9c1eb`  
**Status:** **PREPARED · NOT STARTED**

> **职责：** 在 Sepolia 上对 **整个 Web3**（Governance · PM · Escrow · FeeRouter · Country Pool · Treasury · Indexer · Frontend）做 **生产级认证** — 非「看看能不能跑」，而是 Success **与** Failure 路径均经 **Wallet → Tx → Explorer → Indexer → API → Frontend → Accounting → Evidence → Certificate** 全链一致。  
> **不等于：** ① 本地机读 PASS · ③ 主网部署 · Production GO。

---

## 三阶段（写死 · 禁止跳阶）

```
① Local Engineering          ← 已收口 · HEAD 9de9c1eb · 停止 Web3 工程扩展
        ↓
② Sepolia Reality Certification   ← 本文档 · 唯一 Web3 主线
        ↓
③ Mainnet Production         ← 部署 · Owner · Safe · Secrets · 法务 · 真资产
```

**术语：**

| 词 | 含义 |
|----|------|
| **SC-*** | **Certification Domain**（认证域）— Dashboard 统计单位 |
| **SV-*** | **Verification Step**（具体认证步骤）— 可执行 · 保留历史编号 |
| **Certificate** | 单项 SC 全部 SV + Success/Failure 子项 PASS 后的签字记录 |

**证据根目录（写死）：** `evidence/GO_phase2_testnet_20260526/sepolia-reality/`  
**禁止：** 裸 `forge script … --broadcast` · 主网 `chain_id` · 真实商业 USDC · Agent 代签

---

## 认证链（每项 SV 必须齐）

```
Wallet（MetaMask / WalletConnect · 真实签名）
  → Tx Hash（Sepolia）
  → Explorer（Etherscan 可核对）
  → Indexer（DB · 无丢 · 无重 · 顺序 · 金额）
  → API（与 Indexer 同源）
  → Frontend（用户可见 · 及时）
  → Accounting（分轨 · 45/55 · 守恒）
  → Evidence（JSON · 可选截图）
  → Certificate（该项 PASS）
```

缺任一环节 → **INCOMPLETE** 或 **FAIL**（不得计为 PASS）。

---

## Dashboard（Production Review 一眼进度）

**更新规则：** 仅 Owner / 执行人在完成 **全链证据** 后更新；Agent **不得**代填 tx hash。

| SC | 认证域 | 关键 SV | 状态 | Tx / 证据 | 完成 UTC |
|----|--------|---------|------|-----------|----------|
| **SC-0** | Entry Gate | — | NOT RUN | — | |
| **SC-A** | Governance | SV-04 | NOT RUN | | |
| **SC-B** | Primary Market | SV-01 · SV-01-B* | NOT RUN | | |
| **SC-C** | Escrow | SV-02 | NOT RUN | | |
| **SC-D** | FeeRouter | SV-03 | NOT RUN | | |
| **SC-E** | Country Pool | SV-05 · SV-05-NP | NOT RUN | | |
| **SC-F** | Treasury | SV-06 | NOT RUN | | |
| **SC-G** | Indexer | SV-05 · SV-05-NP · 横切 | NOT RUN | | |
| **SC-H** | Frontend | 横切 · UI 对拍 | NOT RUN | | |

\* SV-01-B = SC-B 购买路径（测试 USDC → TTG · 见 SC-B Success Cases）

**汇总行（② CLOSED 前每日对拍）：**

| 指标 | 值 |
|------|-----|
| **Reality Certification** | **0 / 8 SC PASS**（SC-A … SC-H；SC-0 为前置闸） |
| **SV 明细** | 0 / 7 SV PASS（SV-01 … SV-06 + SV-05-NP；SV-05 计入 SC-E+G） |
| **② Sepolia Reality Certification** | **NOT STARTED** |

---

## SC-0 · Entry Gate（任何写链 / 全量认证前）

### Success Cases

| # | 项 | 要求 |
|---|-----|------|
| 0.1 | Owner 授权 | `TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1` **本轮书面授权**（写链 SV 必需） |
| 0.2 | 网络 | `chain_id=11155111` · Sepolia RPC 可用 · 延迟可接受 |
| 0.3 | 钱包 | MetaMask / WalletConnect · **非 Agent 模拟** |
| 0.4 | 地址 SSOT | [protocol-convergence-deployments.v1.yaml](../../registry/protocol-convergence-deployments.v1.yaml) · gov_freeze_v2_clean_baseline |

### Failure Cases（须记录为 **预期 FAIL** 证据）

| # | 场景 | 期望 |
|---|------|------|
| 0.F1 | 错误 chain_id（如 Mainnet） | 前端 / 钱包拒绝或只读闸 FAIL |
| 0.F2 | RPC 不可用 | 连接失败 · 不静默 fallback 到错误网络 |
| 0.F3 | 无 Owner 授权执行 broadcast | **禁止执行** · 记录 ABORT |

### Required Evidence

`evidence/GO_phase2_testnet_20260526/sepolia-reality/SC-0-entry-gate-<stamp>.json`

### PASS Criteria

0.1–0.4 全部 ☑ · 0.F1–0.F3 按需 ☑（Failure 路径至少抽检 0.F1）

### Exit Criteria

SC-0 **PASS** 后，方可启动 SC-A … SC-H 写链类 SV。

---

## SC-A · Governance

**SV：** [SV-04](#sv-04--governor-propose--vote--queue--execute)

### Success Cases

| # | 路径 | 验证 |
|---|------|------|
| A.S1 | `propose` → `vote` → `queue` → `execute` | 全 tx · Timelock 延迟满足 · 状态机终态正确 |
| A.S2 | Snapshot / vote weight | `getPastVotes` 或 API 与链一致 |
| A.S3 | Indexer | `ProposalCreated` / `VoteCast` / … → DB → `/governance/proposals/[id]` |

### Failure Cases

| # | 场景 | 期望 |
|---|------|------|
| A.F1 | Timelock 未到 `execute` | revert · UI 显示不可执行 |
| A.F2 | 重复 `execute` | revert |
| A.F3 | 重复 `vote`（同一 proposal） | revert 或权重不 double-count |
| A.F4 | 拒签 / Wallet disconnect | 无 tx · UI 错误态可理解 |
| A.F5 | 错误 chain | 无提交 |

### Required Evidence

`evidence/.../SV-04-governance-path-<stamp>.json` · 含全部 tx hash · Explorer URL · API 快照 hash

### PASS Criteria

A.S1–A.S3 PASS · Failure 子集 **A.F1 + A.F2 + A.F4** 至少各 1 条预期 FAIL 证据

### Exit Criteria

SC-A 行 Dashboard → **PASS** · Certificate 签字

---

## SC-B · Primary Market

**SV：** [SV-01](#sv-01--primary-market-usdc-sink-对拍)（read）· **SV-01-B** 购买路径（write · 见下）

### Success Cases

| # | 路径 | 验证 |
|---|------|------|
| B.S0 | **SV-01** sink 对拍 | `TtgPrimaryMarketV1.usdcTreasury()` == `GovernanceTreasuryP4Cap` |
| B.S1 | 测试 USDC → 购买 TTG | 买家收到 TTG · USDC 进入 **P4Cap**（**≠ Escrow**） |
| B.S2 | Explorer + Indexer + API | 购买 tx 可追 · 余额与链一致 |

### Failure Cases

| # | 场景 | 期望 |
|---|------|------|
| B.F1 | USDC 余额不足 | revert · 无 TTG mint |
| B.F2 | 超 round cap（若适用） | revert |
| B.F3 | 拒签 | 无 tx |

### Required Evidence

- `SV-01-pm-usdc-sink-<stamp>.json`（read）
- `SV-01B-pm-purchase-<stamp>.json`（write · tx · buyer balance · treasury balance delta）

### PASS Criteria

B.S0 **必须** PASS 后 B.S1 才计 PASS · USDC **不得** 进入 Escrow 地址

### Exit Criteria

SC-B Dashboard → **PASS**

---

## SC-C · Escrow

**SV：** [SV-02](#sv-02--escrow-v1-全生命周期-smoke)

### Success Cases

| # | 路径 | 验证 |
|---|------|------|
| C.S1 | create → fund → **release** | 全 tx · USDC 至 beneficiary |
| C.S2 | **或** create → fund → **refund** | 全 tx |
| C.S3 | **或** create → fund → dispute → resolve | 全 tx |
| C.S4 | Indexer + `/escrow/[id]` | 与链状态一致 · 及时 |

### Failure Cases

| # | 场景 | 期望 |
|---|------|------|
| C.F1 | Gas 不足 | 无 partial 脏状态 |
| C.F2 | 拒签 deposit | 订单保持 pre-fund |
| C.F3 | 错误状态 release/refund | revert |
| C.F4 | RPC 超时后重试 | 无 duplicate 投影（幂等） |

### Required Evidence

`SV-02-escrow-lifecycle-<stamp>.json` · ① 前置：`bash scripts/dev/smoke-web3-itinerary-full-chain-local.sh` exit 0（引用 · 非 ② PASS）

### PASS Criteria

C.S1 / C.S2 / C.S3 **至少一条**完整路径 PASS · C.F2 + C.F3 各 1 条 FAIL 证据

### Exit Criteria

SC-C Dashboard → **PASS**

---

## SC-D · FeeRouter

**SV：** [SV-03](#sv-03--feerouter--regionvault--global-treasury)

### Success Cases

| # | 路径 | 验证 |
|---|------|------|
| D.S1 | Settlement 触发 `PlatformFeeRouted` | country **45%** + global **55%** 链上可算 |
| D.S2 | RegionVault forward（若适用） | `vault-forwards` API |
| D.S3 | Global leg | 进入 P4Cap / fund-flow-ssot R4 叙事一致 |

### Failure Cases

| # | 场景 | 期望 |
|---|------|------|
| D.F1 | 零金额 / 错误 token | revert 或无事件 |
| D.F2 | Indexer 重复 `(block, log_index)` | 无 double-count |

### Required Evidence

`SV-03-fee-router-<stamp>.json`

### PASS Criteria

D.S1–D.S3 PASS · 45/55 与 accounting 叙事一致（**≠** D-4555-B 国家池净利润 45/55）

### Exit Criteria

SC-D Dashboard → **PASS**

---

## SC-E · Country Pool

**SV：** [SV-05](#sv-05--vacancy-indexer-reconcile) · [SV-05-NP](#sv-05-np--country-pool-net-profit-d-4555-b)

### Success Cases

| # | 路径 | 验证 |
|---|------|------|
| E.S1 | **SV-05** Vacancy 六事件 | reconcile gate exit 0 · `/governance/vacancy-ledger` |
| E.S2 | **SV-05-NP** Net Profit 生命周期 | `EpochOpened` … `NetProfitSplit` / Vault deposit → indexer → API → UI |
| E.S3 | Accounting | `accountingAudit.status` == `PASS` · 45/55 守恒 |

### Failure Cases

| # | 场景 | 期望 |
|---|------|------|
| E.F1 | split 未 fund | 状态机不 advance · UI 显示 pending |
| E.F2 | 错误 jurisdiction 读 API | 空或 filter 正确 · 无串账 |

### Required Evidence

- `SV-05-vacancy-reconcile-<stamp>.json`
- `SV-05-NP-net-profit-<stamp>.json`

### PASS Criteria

E.S1 + E.S2 + E.S3 全部 PASS

### Exit Criteria

SC-E Dashboard → **PASS**

---

## SC-F · Treasury

**SV：** [SV-06](#sv-06--treasury-p4-cap-实花-txgov-01)

### Success Cases

| # | 路径 | 验证 |
|---|------|------|
| F.S1 | Read `treasuryP4DeployCapBps()` == 3000 | 链上只读 |
| F.S2 | **合法** P4 spend via Timelock | success tx · P1–P4 分类正确 |
| F.S3 | Indexer + API treasury 读数 | 与链一致 |

### Failure Cases

| # | 场景 | 期望 |
|---|------|------|
| F.F1 | **超 cap** P4 spend | revert `P4CapExceeded` · tx hash 保留 |
| F.F2 | Timelock 未到 execute | revert |

### Required Evidence

`SV-06-p4-cap-<stamp>.json` · revert + success tx 均登记

### PASS Criteria

F.S1 + F.F1（预期 revert）+ F.S2 全部 PASS

### Exit Criteria

SC-F Dashboard → **PASS**

---

## SC-G · Indexer（横切）

**覆盖：** SC-A … SC-F 全部链上事件的 DB 投影 · 含 SV-05 / SV-05-NP

### Success Cases

| # | 路径 | 验证 |
|---|------|------|
| G.S1 | `POST /internal/indexer-tick` on Sepolia | checkpoint 前进 |
| G.S2 | 无丢事件 | 链上 log 集合 ⊆ DB（抽样） |
| G.S3 | 无重复 | `(chain_id, block, log_index)` 唯一 |
| G.S4 | 重组 rewind（若发生） | 脚本 / 文档化恢复 · 无脏终态 |

### Failure Cases

| # | 场景 | 期望 |
|---|------|------|
| G.F1 | RPC 超时 tick | 可重试 · 无 partial commit |
| G.F2 | 重复 tick 同一 block | 幂等 · `events_new` 不 double |

### Required Evidence

`SC-G-indexer-crosscut-<stamp>.json` · 引用各 SV 的 tx 列表 · DB row counts

### PASS Criteria

G.S1–G.S3 PASS · G.F2 抽检 PASS

### Exit Criteria

SC-G Dashboard → **PASS**

---

## SC-H · Frontend（横切）

**覆盖：** WalletConnect · MetaMask · 各 SC 触发的 UI 对拍

### Success Cases

| # | 路径 | 验证 |
|---|------|------|
| H.S1 | 交易提交后 UI / API | 确认数内可见更新 |
| H.S2 | `/governance/*` · `/escrow/[id]` · net-profit / vacancy 页 | 与 API 同源 |
| H.S3 | 网络指示 | Sepolia · chainId 11155111 |

### Failure Cases

| # | 场景 | 期望 |
|---|------|------|
| H.F1 | Wallet disconnect |  graceful · 无假成功 |
| H.F2 | 错误 network | 阻断或强提示 |
| H.F3 | RPC 超时 | 错误态 · 可重试 |

### Required Evidence

`SC-H-frontend-crosscut-<stamp>.json` · 可选截图 · API response hash

### PASS Criteria

H.S1–H.S3 PASS · H.F1 + H.F2 各 1 证据

### Exit Criteria

SC-H Dashboard → **PASS**

---

## SV 执行明细（保留编号 · 嵌入 SC）

### SV-01 · Primary Market USDC sink 对拍

**所属 SC-B** · **类型：** read-only（可无 tx）

| 字段 | 值 |
|------|-----|
| **Read** | `cast call $PRIMARY_MARKET "usdcTreasury()(address)" --rpc-url $SEPOLIA_RPC` |
| **期望** | 与 `GOVERNANCE_TREASURY_P4CAP_ADDRESS` / 链上 P4Cap 一致（Sepolia baseline 以 registry 为准） |
| **证据** | `SV-01-pm-usdc-sink-<stamp>.json` |

```json
{
  "check_id": "SV-01",
  "sc_domain": "SC-B",
  "primary_market_usdc_treasury": "OWNER_FILL",
  "governance_treasury_p4cap": "OWNER_FILL",
  "match": false,
  "verified_utc": null
}
```

**SC-B 购买路径（SV-01-B · write）：** 测试 USDC approve + `TtgPrimaryMarketV1` 购买 → TTG 到账 · USDC 进 P4Cap · 证据 `SV-01B-pm-purchase-<stamp>.json`

---

### SV-02 · Escrow V1 全生命周期 smoke

**所属 SC-C**

| 步骤 | 动作 | tx |
|------|------|-----|
| 2.1 | `EscrowFactory.createEscrow` | `0x…` |
| 2.2 | `Escrow.deposit` | `0x…` |
| 2.3 | release **或** refund **或** dispute→resolve | `0x…` |
| 2.4 | indexer-tick + `/escrow/[id]` | aligned |

**参考：** `scripts/dev/run-g3-02-web3-payment-production-verification.cjs` · 证据 `SV-02-escrow-lifecycle-<stamp>.json`

---

### SV-03 · FeeRouter → RegionVault + Global Treasury

**所属 SC-D**

触发 settlement → `PlatformFeeRouted` → `GET /api/v1/governance/fee-routes` · 证据 `SV-03-fee-router-<stamp>.json`

---

### SV-04 · Governor propose → vote → queue → execute

**所属 SC-A**

| 步骤 | tx |
|------|-----|
| propose / vote / queue / execute | `0x…` |

**前置：** Governor V1.1 若未 broadcast → [TT-PHASE2-GOVERNANCE-STACK-SEPOLIA-BROADCAST-CHECKLIST.md](TT-PHASE2-GOVERNANCE-STACK-SEPOLIA-BROADCAST-CHECKLIST.md)  
**证据：** `SV-04-governance-path-<stamp>.json`

---

### SV-05 · Vacancy indexer reconcile

**所属 SC-E · SC-G**

```bash
CHAIN_RPC_URL=$SEPOLIA_RPC CHAIN_ID=11155111 bash scripts/gates/check-web3-vacancy-indexer-reconcile-gate.sh
```

API：`GET /api/v1/governance/vacancy-ledger` · 证据 `SV-05-vacancy-reconcile-<stamp>.json`

---

### SV-05-NP · Country Pool Net Profit（D-4555-B）

**所属 SC-E · SC-G**

| 步骤 | 验证 |
|------|------|
| ① 能力闸（引用） | `bash scripts/gates/run-country-pool-net-profit-closure-audit.sh` exit 0（① · 非 ② PASS） |
| Indexer | tick · `COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS` |
| API | `GET …/net-profit-ledger?jurisdiction=DE` · admin ops |
| UI | `/governance/net-profit-ledger` · `/admin/net-profit-ledger` |
| Accounting | `accountingAudit.status` == `PASS` |

证据：`SV-05-NP-net-profit-<stamp>.json`

---

### SV-06 · Treasury P4 cap 实花 tx（GOV-01）

**所属 SC-F**

| 步骤 | 期望 |
|------|------|
| 超 cap spend | revert · tx 登记 |
| 合法 spend | success · tx 登记 |

参考：`contracts/test/TtgGovFreezeV1Enforcement.t.sol` · 证据 `SV-06-p4-cap-<stamp>.json`

---

## Certificate · ② CLOSED 条件

| # | 条件 | 状态 |
|---|------|------|
| 1 | **SC-0** Entry Gate PASS | ☐ |
| 2 | **SC-A … SC-H** 全部 PASS（Dashboard **8 / 8**） | ☐ |
| 3 | 各 SC **Failure Cases** 最低抽检满足（见各 SC PASS Criteria） | ☐ |
| 4 | 全部 material tx hash + Explorer URL 已登记 | ☐ |
| 5 | Indexer / API / UI / Accounting **无 P0 drift** | ☐ |
| 6 | **Reality Certification Certificate** Owner 签字 | ☐ |
| | **② Sepolia Reality Certification** | **NOT STARTED** |

**② CLOSED 之后合法工作：** ③ Owner 输入 · Mainnet 部署计划 · PER / Production Entry Review — **不是** 继续 ① 工程功能扩展。

**诚实边界：** ② CLOSED **≠** ③ Mainnet OWNER_INPUT filled **≠** Production GO **≠** 真实商业 USDC。

---

## 推荐执行顺序（② 主线）

```
SC-0  Entry Gate
  ↓
SV-01 / SC-B  PM sink（read）→ SV-01-B 购买（write · 需授权）
  ↓
SV-05 + SV-05-NP / SC-E,G  Indexer 对拍（可先 read-heavy）
  ↓
SV-02 / SC-C  Escrow
  ↓
SV-03 / SC-D  FeeRouter
  ↓
SV-04 / SC-A  Governance
  ↓
SV-06 / SC-F  Treasury P4
  ↓
SC-H  Frontend 横切验收
  ↓
Certificate 汇总
```

---

## 交叉引用

| 文档 | 关系 |
|------|------|
| [WEB3-FULL-SYSTEM-CLOSURE-AUDIT-LATEST.md](../spec/governance-token/WEB3-FULL-SYSTEM-CLOSURE-AUDIT-LATEST.md) | ①  inventory · gaps · **非** ② PASS |
| [PHASE2-REPOSITORY-STATUS.md](PHASE2-REPOSITORY-STATUS.md) | 阶段闸 G-1/G-2 |
| [TT-PHASE2-GOVERNANCE-STACK-SEPOLIA-BROADCAST-CHECKLIST.md](TT-PHASE2-GOVERNANCE-STACK-SEPOLIA-BROADCAST-CHECKLIST.md) | SV-04 前置 broadcast |

---

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v1-20260712 | 2026-07-12 | 初版 SV-01～06 + SV-05-NP（Verification 标题） |
| v2-20260712 | 2026-07-12 | **升格为 Reality Certification SSOT** · SC-0～H · Dashboard · Failure Cases · Certificate · 文件名 `TT-WEB3-SEPOLIA-REALITY-CERTIFICATION.md` |
