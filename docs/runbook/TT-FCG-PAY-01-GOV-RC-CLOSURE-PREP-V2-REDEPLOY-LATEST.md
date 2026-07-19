# TT · FCG-PAY-01 · Gov RC Closure Prep + Full Capability v2 Redeploy Plan

**Machine:** `TT_FCG_PAY01_GOV_RC_CLOSURE_PREP_V2_REDEPLOY`  
**Status:** **PREP_ONLY_PREAUTH_PLUS_V2_REDEPLOY_PLAN** · `2026-07-19`  
**机读：** [`registry/psg-fcg-pay01-gov-rc-closure-prep-v2-redeploy.v1.yaml`](../../registry/psg-fcg-pay01-gov-rc-closure-prep-v2-redeploy.v1.yaml)  
**证据：** [`FCG-PAY-01-GOV-RC-CLOSURE-PREP-V2-REDEPLOY-LATEST.json`](../../evidence/GO_pre_eta_production_prep/full-capability-gap-closure-20260719/FCG-PAY-01-GOV-RC-CLOSURE-PREP-V2-REDEPLOY-LATEST.json)  
**Preauth：** [TT-FCG-PAY-01-GOV-RC-CLOSURE-PREAUTH-LATEST](./TT-FCG-PAY-01-GOV-RC-CLOSURE-PREAUTH-LATEST.md)（保持 **PREAUTH_ONLY**）

```text
本窗:     G-RC 关闭条件梳理 + Full Capability v2 全新部署方案（纸面）
下一阶段主叙事: Protocol v2 Testnet Deployment Plan（非「升级旧合约」）
正确顺序: G-RC CLOSE → Protocol Impl → New Testnet Deploy → Full Capability Validation
保持:     PREAUTH_ONLY · 不开 Step 3 · 不广播 · 不改 ACTIVE 地址
禁止:     跳过 Governance RC · 先部署后发现规则不一致返工 · 旧证冒充 MAINNET_COMMERCIAL_FULL
```

**顺序 SSOT：** [TT-PROTOCOL-V2-TESTNET-DEPLOYMENT-PLAN-LATEST](./TT-PROTOCOL-V2-TESTNET-DEPLOYMENT-PLAN-LATEST.md)

---

## 0 · 诚实边界

| 项 | 本窗 |
|----|------|
| PREAUTH 五项 | 已 ACCEPTED（不变） |
| Governance RC CLOSED | **否** |
| ACTIVE baseline | 仍为 `v311_sepolia_clean_baseline`（**未翻转**） |
| v2 地址 | **TBD**（未部署） |
| Step 3 / 支付编码 | **禁止** |
| Production GO | **否** |

---

## 1 · G-RC-01～05 关闭条件梳理

**顺序（与 Operator Card 对齐）：** G-RC-01 → G-RC-02 → **G-RC-04 (UI)** → **G-RC-03 (Product)** → G-RC-05

| Gate | 关闭必须满足 | 当前 | PASS？ |
|------|--------------|------|:------:|
| **G-RC-01** | `execute_allowed_now` · Proposal #1 **Executed** · Sepolia 收据 · F-02 更新 | 等 Execute | ❌ |
| **G-RC-02** | **54/0/0** · Upgrade Arch · 纯 Sepolia 集 | 50 PASS / 4 OWNER_REQUIRED · FAIL | ❌ |
| **G-RC-04** | UI Full Cert PASS（或策略允许的非阻塞 ACCEPT） | PARTIAL | ❌ |
| **G-RC-03** | Product Full Cert PASS（在 UI/Function 后） | OPEN | ❌ |
| **G-RC-05** | 01–04 满足 + `DEFERRED=[TRE-02,REG-01,REG-04]` + **PREAUTH-01…05 附卷** + Close stamp | 戳缺失 | ❌ |

**G-RC-05 附卷（已备）：** Preauth Evidence · LEGACY 直付非 SSOT · SettlementRouter 架构 · SETTLEMENT_READY · Executor/Arbitrator。

**G-RC-05 之后才允许：** M-RC-00 · v2 CLEAN 广播（另闸）· TRE/REG · Step 3。

---

## 2 · Full Capability v2 · 测试网重新部署方案

### 2.1 策略（写死）

| 项 | 决策 |
|----|------|
| 路径 | **CLEAN_SEPOLIA_REDEPLOY**（全新部署） |
| 非路径 | ❌ 原地 upgrade / proxy 槽迁移冒充改轨 |
| 计划 ACTIVE key | **`fcg_full_capability_v2_sepolia`** |
| 现 ACTIVE（直至 cutover） | `v311_sepolia_clean_baseline` |
| Cutover 后旧基线 | **`LEGACY_READ_ONLY`** |
| Chain | `11155111` Sepolia |

### 2.2 证据禁令（写死）

**禁止**将以下任一用作 **MAINNET_COMMERCIAL_FULL** / Money-Path / Full Capability 商业闭环证明：

- `v311_sepolia_clean_baseline`（cutover 后）及更早 V2/V1 地址  
- LEGACY composite `EscrowFactory` / `FeeRouter`  
- `Escrow.release` → `platformFeeRecipient` 直付路径（LEGACY_NON_SSOT）

Cutover 后商业闭环证据 **仅** 绑定 `fcg_full_capability_v2_sepolia` + 新 Evidence 根。

### 2.3 新部署清单

| ID | 组件 | 内容 | Env / Registry | 本窗 |
|----|------|------|----------------|------|
| **DEP-V2-01** | **Escrow** | Factory + 实现（接 SettlementRouter） | `ESCROW_FACTORY_ADDRESS` · `escrow_factory_address` | 地址 TBD |
| **DEP-V2-02** | **SettlementRouter** | 结算入口（Step 2.5 锁定名） | `SETTLEMENT_ROUTER_ADDRESS` | **新模块 · 未编码** |
| **DEP-V2-03** | **FeeRouter** | V3.1.1 Distributable 路由（非 LEGACY 四桶 SSOT） | `FEE_ROUTER_ADDRESS` | 须进 ACTIVE（补现基线缺口） |
| **DEP-V2-04** | **Distributable** | SM含 **SETTLEMENT_READY** · 45/55 · PRP 轨 live | `PROJECT_REVENUE_POOL_ADDRESS` 等 | 地址 TBD |
| **DEP-V2-05** | **Registry** | `active_deploy_baseline` 翻转 · matrix freeze · 旧标 LEGACY_READ_ONLY | `protocol-convergence-deployments` 等 | **本窗不改** |
| **DEP-V2-06** | **Indexer** | 重绑地址 · Escrow/Router/Fee/SF 事件 · 新投影命名空间 | `INDEXER_*` | 方案 only |
| **DEP-V2-07** | **Frontend / API** | `/meta.chain.contracts` → 仅 v2 ACTIVE · `NEXT_PUBLIC_*` | FE+API env | 方案 only |
| **DEP-V2-08** | **Evidence 绑定** | `evidence/GO_phase2_fcg_full_capability_v2_sepolia/` · broadcast · verify · cutover stamp · 禁旧证 | 新根 | 广播前不建 |

**四轨（v2 必须 live 非空）：** Order Escrow · GovernanceTreasuryP4Cap · Project Revenue Pool · Founder Bootstrap。

### 2.4 授权后阶梯（未来 · 非本窗）

```text
G-RC-05 CLOSED
  → M-RC-00 (+ OPT)
  → Money-Path 编码窗（SettlementRouter 等）
  → CLEAN deploy fcg_full_capability_v2_sepolia（Owner broadcast OK）
  → Registry ACTIVE 翻转 · 旧基线 LEGACY_READ_ONLY
  → Indexer + FE/API 重绑
  → On-chain verify + Evidence
  → TRE-02 / REG-01 / REG-04（新地址）
  → Step 3 Happy Path（仅新栈）
```

---

## 3 · 与现 ACTIVE 的关系（PFA-02 对齐）

当前 `v311_sepolia_clean_baseline`：**治理脊**（TTG/Governor/Timelock/Seat…）ACTIVE；**EscrowFactory/FeeRouter 不在 ACTIVE 清单**（PFA-CM-03）。  
v2 改轨目标：商业资金路径组件 **进入同一 ACTIVE key**，结束「治理 ACTIVE / 资金 LEGACY composite」双表面作为 Full Capability 证明。

---

## 4 · 纪律

| 规则 | |
|------|--|
| 本窗广播 / 改 ACTIVE / Step 3 | **禁止** |
| Track A | **FROZEN** |
| PREAUTH_ONLY | **保持** |
| PASS / GO / Governance CLOSED | **不宣称** |
