# 148 · PI3-005 Production Scope Decision Report

> **Sprint**：PI3-005 · **Production Scope Decision**（147 G1 闭合 · 链 scope 书面裁定）  
> **审计 SSOT**：[147 PI3 Closure Program Audit](./147-PI3-Closure-Program-Audit-Report.md) · [PRODUCTION-GO-DECISION-PACKAGE](../../runbook/PRODUCTION-GO-DECISION-PACKAGE.md) · [TT-MASTER §0.5 S-01](../../runbook/TT-MASTER-PUBLISH-GO-CHECKLIST-001.md) · [TT-MAINNET §0](../../runbook/TT-MAINNET-LAUNCH-PRECHECK-AFTER-B435-001.md)  
> **冻结基准**：[120](./120-S5-Catalog-Release-Freeze-Report.md) · [133](./133-G-S8-Growth-Release-Freeze-Report.md) · [145](./145-Operations-Platform-Release-Freeze-Report.md) · [146](./146-C-S6-Catalog-Consumer-OptIn-Cutover-Report.md)  
> **日期**：2026-06-08  
> **纪律**：**仅 scope 决策与程序文档** · **禁止** 新增产品功能代码 · **禁止** 修改生产 Fly/链上配置  
> **结论**：**`PRODUCTION_SCOPE_SEPOLIA`** · Mainnet Production **defer** · **`PRODUCTION_SCOPE_MAINNET: NOT_SELECTED`**

---

## 1. Executive verdict

| 维度 | 裁定 |
|------|------|
| **TravelTrust Production Scope（正式）** | **Sepolia Production** — `CHAIN_ID=11155111` · 专用 prod 域 + Fly PG + Stripe Live |
| **Mainnet Production** | **未选中** — 另开 **PI3-005-M** 程序（G0～G6+SL）· **不得** 与 Sepolia prod GO 并联 |
| **147 PI3-005 HOLD** | **闭合为 GO（scope 已决）** — Sepolia 路径解除 Mainnet 挡条 |
| **Production GO 整体** | **仍为 NO-GO** — PI3-001～004/006 **未闭** · 本 Sprint **仅** 决 scope |
| **推荐方案** | **Path A · Sepolia-only Production**（147 §5 Path A） |
| **148 Sprint 交付** | **GO** — 风险矩阵 · 合规/资金/运维/审计 · PI3 影响 · 上线 ETA |

**148 正式裁定：**

```text
PRODUCTION_SCOPE_DECISION: SEPOLIA
PRODUCTION_SCOPE_SEPOLIA: SELECTED
PRODUCTION_SCOPE_MAINNET: NOT_SELECTED
PRODUCTION_CHAIN_ID_PROD: 11155111
PI3_005_SCOPE: CLOSED
MAINNET_CUTOVER_AUTHORIZED: false
```

**Owner 签收（程序生效条件）：** Sebastian Ward · Release Authority — 本报告存档即 **G1 scope 书面决策**；并联更新 `evidence/GO_phase2_testnet_20260526/phase3-production-prep/RELEASE-SCOPE.md`（若存在）与 [PRODUCTION-GO-DECISION-PACKAGE](../../runbook/PRODUCTION-GO-DECISION-PACKAGE.md) §scope 附录。

---

## 2. Scope 选项定义

| 选项 | 定义 | 链上结算 | 用户可见「Production」 |
|------|------|----------|-------------------------|
| **A · Sepolia Production** | 专用 prod 域 + prod PG + Stripe Live · Escrow/治理在 **Sepolia** | 测试网资产（Sepolia ETH / 部署 track token） | **是** — `Production GO（Sepolia scope）` |
| **B · Mainnet Production** | `CHAIN_ID=1` · G0～G6+SL 全 GO · Shadow Launch GO | 主网真实资产 | **是** — 须 §9 全勾 |
| **C · HOLD（不选）** | 维持 147 状态 · scope 未书面 | — | **否** |

**本 Sprint 选择：A** — 与 TT-MASTER **S-01**（首发不含 Mainnet cutover）、147 Path A、Phase ② Sepolia 主脊已部署 **一致**。

---

## 3. 风险矩阵（Sepolia vs Mainnet Production）

| 风险域 | Sepolia Production | Mainnet Production | 差异 / 缓解 |
|--------|-------------------|-------------------|-------------|
| **不可逆资金损失** | **低～中** — 链上为测试网资产；**Stripe Live 仍为真钱** | **高** — Escrow/治理/用户资金主网不可逆 | Sepolia：**PSP 限额 + 准入费 cap** · 运维 runbook |
| **智能合约缺陷** | **中** — 真实用户流程 · 测试网资金 | **极高** — -bytecode 错误不可回滚 | Mainnet 须 **G1 bytecode 身份** + Shadow SL |
| **Indexer / 投影漂移** | **中** — Sepolia 已运维 PASS | **高** — 主网全量 replay（G2） | Mainnet 须 **indexer-replay/reconcile** 证据 |
| **治理 / Timelock** | **低～中** — Sepolia 栈已 R-02 对拍 | **高** — delay≥24h（G3）· 多签执行 | Mainnet 须 **G3 链上 delay 验** |
| **合规 / 牌照叙事** | **中** — 须声明 **测试网结算** · Stripe 真实 KYC/PSP | **高** — 主网金融/Travel 监管面 | 对外话术 **不可** 称 Mainnet |
| **运营复杂度** | **中** — PI3-001～004/006 · ~4～6 周 | **极高** — +G0～G6+SL · ~10～14 周 | Sepolia 先闭合 infra |
| **声誉 / 错误宣称** | **中** — 若误称 Mainnet | **高** | 148 + TT-MASTER **scope 锁** |
| **Growth 链上 GOV** | **低** — 133 **HOLD** · 链下运行时 **GO** | **高** — 与 Mainnet 并轨 | **两 scope 均不承诺** launch 时 GOV 链上发放 |
| **Catalog Consumer** | **低** — prod **`ENABLED=0`**（120/146） | **低** — 同 | post-GO 可选 staging 已 GO 程序 |
| **Shadow Launch NO_GO** | **不适用** — §9 **N/A** | **BLOCKED** — `shadow_launch_verdict: NO_GO` | Mainnet **禁止** 直至新 `run_<UTC>/` GO |

**矩阵结论：** Sepolia Production **P0 风险可控且与现有证据对齐**；Mainnet Production **当前证据链不满足 TT-MAINNET §0** → **不得选中**。

---

## 4. 合规影响

| 域 | Sepolia Production | Mainnet Production |
|----|-------------------|-------------------|
| **对外披露** | 须明确：**链上 Escrow 运行于 Ethereum Sepolia 测试网** · 非 Mainnet | 须完整 Mainnet 风险披露 · Shadow Launch 留痕 |
| **Stripe / PSP** | **Stripe Live 可启用**（真实法币 onboarding/准入费）· 与 **测试网 Escrow** 分离披露 | Live PSP + **主网** 结算 · SAQ/合规评审升维 |
| **KYC / 用户数据** | 生产 DB + 真实用户数据 · **同** GDPR/隐私 runbook | **同** · 额外主网资金合规 |
| **OFAC / 制裁** | go-live / TT-MASTER **S-06** defer 项 · **scope 内最小** | 96-15 深度项 **升维** |
| **证券 / 代币叙事** | TTG 在 Sepolia · **非** 主网公开发行 | 主网 GOV/token **监管风险显著** |
| **审计范围** | `FINAL_SYSTEM_AUDIT: PASS` **足够** · 不扩展五域 | **+** TT-MAINNET G0～G6+SL **独立审计包** |
| **Growth 133** | 链下 Referral/Early Bird **GO** · **禁止** 宣称链上 GOV 已上线 | 链上 GOV **HOLD** 维持 |

**合规裁定：** Sepolia Production **允许** 在 **诚实 scope 披露** 前提下推进 PI3-001～004/006；Mainnet **须** 独立合规评审 + Shadow GO **后** 方可重开 scope。

---

## 5. 资金风险

| 项 | Sepolia Production | Mainnet Production |
|----|-------------------|-------------------|
| **Escrow 锁仓** | Sepolia USDC/测试 token · **可 faucet/再部署** | 主网 USDC/ETH · **不可逆** |
| **用户赔付面** | 以 **Stripe 法币** 为主风险 · 链上为测试资产 | 链上 + 法币 **双高** |
| **Gas / 运维** | Sepolia gas **低** | Mainnet gas **高** · 需预算 |
| **错误 deploy 回滚** | 可 **重新部署** Sepolia 栈（成本高但非终局） | **不可** 链上回滚 · 仅 pause/治理 |
| **Shadow Launch 资金敞口** | **不要求** | go-live §9.0.7 **禁止** 未 GO 扩大敞口 |
| **推荐控险** | Stripe **单笔上限** · Escrow **单笔 cap** · 首发 **invite-only** | 须 **SL GO** + 小额灰度矩阵 |

**资金裁定：** 在 **Stripe 控额 + Sepolia 测试网披露** 下，Sepolia Production **可接受** 作为首版 Production；Mainnet **当前 NO-GO**（Shadow **NO_GO** + 无 G1 bytecode 包）。

---

## 6. 运营成本

| 成本项 | Sepolia Production（估算） | Mainnet Production（增量） |
|--------|---------------------------|---------------------------|
| **Fly infra** | `tt-api-prod` / `tt-web-prod` / `tt-traveltrust-prod` · 与 121 同型 | **同** infra · **更高** RPC/indexer 负载 |
| **域名 / TLS** | 品牌域 ×2 · ~$15–50/yr + Fly | **同** |
| **Stripe** | Live 账户 + 交易费 · **真实** | **同** · 量级随 GMV |
| **RPC** | Sepolia 提供商 · 中低 | Mainnet **归档节点** · **高** |
| **Indexer 运维** | 现有 Sepolia 运维 **PASS** | **+** 主网全量 replay 人力 **2～4 人周** |
| **值班 /  incident** | PRODUCTION-OPS-RUNBOOK · SEV 流程 **READY** | **+** Trigger Matrix 7×24 · **高** |
| **审计 / 证据** | PI3 gate 复跑 · R-003 prod · **~1 人周** | **+** G0～G6+SL 包 · **~4～8 人周** |
| **日历（147）** | **~4～6 周** Owner 日历 | **~10～14 周**（含 Mainnet 轨） |

**运维裁定：** Sepolia Production **最小可行运营成本**；Mainnet **defer** 至 Sepolia prod **稳定 + M-00 后** 单独立项。

---

## 7. 审计需求

| 审计包 | Sepolia Production | Mainnet Production |
|--------|-------------------|-------------------|
| **FINAL_SYSTEM_AUDIT** | **PASS（冻结）** · 不扩展 | **同** · 不替代 Mainnet 卡 |
| **PI3-001～004/006** | **必跑** · prod 环境证据 | **必跑** · **+** chain_id=1 对拍 |
| **PI3-005** | **148 本报告** + TT-MASTER **S-01 N/A §9** | **新 `run_<UTC>/`** · `check-mainnet-launch-precheck-gate.sh` |
| **go-live §9** | **N/A**（S-01 排除 Mainnet） | **全勾** · 9.0.7 Shadow |
| **R-002 / 93** | prod `report.json` · **`environment.name=production`** · **chain Sepolia** | **同** · **Mainnet 矩阵行** |
| **120 / 146 Catalog** | prod **`ENABLED=0`** gate | **同** |
| **133 Growth** | G-S8 freeze gate · **无** 链上 GOV | **同** · Mainnet GOV **另 Sprint** |
| **145 Ops** | 不重复审计 · freeze 回归可选 | **同** |
| **M-00 / Owner 签** | Sepolia scope **Production GO** | **禁止** 用 Sepolia M-00 冒充 Mainnet |

---

## 8. 预计上线时间（scope 选定后）

| 里程碑 | Sepolia Production | Mainnet Production（若未来选中） |
|--------|-------------------|--------------------------------|
| **Scope 决策（G1）** | **2026-06-08** · 148 | defer |
| **PI3-002 域 + PI3-001 备份** | T+**2～3 周** | T+0（infra 复用） |
| **PI3-003 Stripe Live** | T+**3 周** | 并行 |
| **PI3-004 prod 回归** | T+**4～5 周** | T+**+4～6 周**（Mainnet 矩阵） |
| **PI3-006 go-live 勾选** | T+**4～6 周** | T+**+8～12 周** |
| **PI3-005 Mainnet 轨** | **N/A** | T+**+10～14 周** from 148 |
| **Production GO（M-00）** | **目标 2026-07～08** | **≥2026-Q4**（假设） |

**ETA 声明：** 以上为 **Owner 顺序执行 147 §5** 的日历估算 · **非** 承诺日期 · **依赖** Fly/域名/Stripe 外部 SLA。

---

## 9. 对 PI3-001～006 的影响

| ID | Sepolia Production（148 选中后） | Mainnet Production（未选中） |
|----|----------------------------------|------------------------------|
| **PI3-001** | **不变 · BLOCKED→闭合路径开启** · prod PG + B-475 PASS **仍必达** | **同** · 额外 prod 数据含 Mainnet 链投影 |
| **PI3-002** | **不变 · 必达** · `app.*`/`api.*` · CORS 锁 prod FE | **同** |
| **PI3-003** | **P1 optional** · Stripe Live onboarding **仅当** `TRAVELTRUST_ONBOARDING_STRIPE_ENABLED=1` · **不挡** Web3-only GO | **同** |
| **PI3-004** | **必达** · R-003 prod · `report.json` 须标注 **Sepolia chain_id** | **另跑** Mainnet 行 · **不可** 窄切片冒充 |
| **PI3-005** | **GO（scope）** — 148 闭合 · go-live **§9 N/A** · TT-MASTER **S-01** | **NOT_SELECTED** — G0～G6+SL **整轨 defer** |
| **PI3-006** | **§9 勾选 N/A** · §0～§8/§10～§11 **仍必勾** · P0 十二项 **仍必达** | **§9 全必勾** · 挡 Mainnet |

**147 状态更新：**

| 147 项 | 148 前 | 148 后 |
|--------|--------|--------|
| PI3-005 | **HOLD** | **GO（Sepolia scope）** |
| Production GO | **NO-GO** | **NO-GO**（001～004/006 仍 open） |
| Path A 推荐 | 建议 | **正式选中** |

---

## 10. 推荐方案与未选路径

### 10.1 推荐：**Production Scope = Sepolia（148 裁定）**

**理由（权重序）：**

1. **147 / TT-MASTER 对齐** — Path A · **S-01** 已排除 Mainnet · **最小** Production GO 路径  
2. **证据就绪** — Phase ② Sepolia 主脊 · staging P0 链 **PASS** · Shadow **NO-GO** **不挡** Sepolia  
3. **风险/成本** — 资金与合规面 **显著低于** Mainnet · **4～6 周** vs **10～14 周**  
4. **冻结纪律** — 120/133/145/146 **均不要求** Mainnet prod · **不破** Consumer/Growth 边界  
5. **诚实产品叙事** — 「Production（Sepolia 结算）」可支撑 **真实用户 + Stripe Live** 冷启动  

**立即下一动作（147 §5 #1 起）：** PI3-002 域名 → PI3-001 备份 → PI3-003 Stripe → PI3-004 → PI3-006 → prod audit → M-00。

### 10.2 未选：**Mainnet Production**

**状态：** **`PRODUCTION_SCOPE_MAINNET: NOT_SELECTED`**

**重开条件（全部满足）：**

- Sepolia Production **已** M-00 · **稳定 ≥30d**（建议）  
- 新 `evidence/mainnet_shadow_launch/run_<UTC>/` · **`shadow_launch_verdict: GO`**  
- `bash scripts/check-mainnet-launch-precheck-gate.sh` **exit 0**  
- Owner **书面** 切换 scope · 新 **PI3-005-M** Sprint · **禁止** 偷跑 §9  

### 10.3 为何非 **HOLD**

147 已将 PI3-005 标为 **G1 阻塞**；TT-MASTER **S-01** 与 Phase ② 证据 **已支持** Sepolia 书面 scope。**继续 HOLD = 拖延 Path A**，无新增信息增益。本 Sprint **正式闭合** scope 为 Sepolia。

---

## 11. 机读键与门禁

```text
PRODUCTION_SCOPE_DECISION: SEPOLIA
PRODUCTION_SCOPE_SEPOLIA: SELECTED
PRODUCTION_SCOPE_MAINNET: NOT_SELECTED
PRODUCTION_CHAIN_ID_PROD: 11155111
PI3_005_SCOPE: CLOSED
MAINNET_CUTOVER_AUTHORIZED: false
PRODUCTION_GO_DECISION: NO_GO
```

```bash
bash scripts/check-pi3-005-production-scope-decision.sh
# → PI3_005_PRODUCTION_SCOPE_DECISION_GO
# → PRODUCTION_SCOPE_SEPOLIA
```

**并联更新（Owner · 非本 Sprint 代码）：**

- [PRODUCTION-GO-DECISION-PACKAGE](../../runbook/PRODUCTION-GO-DECISION-PACKAGE.md) — scope 附录  
- [PHASE3-ENTRY-PRODUCTION-READINESS-MATRIX](../../runbook/PHASE3-ENTRY-PRODUCTION-READINESS-MATRIX.md) — PI3-005 行 → **Sepolia scope GO**  
- go-live **§9** — 标记 **N/A（S-01 / 148）** 于 Sepolia prod 勾选包  

---

## 12. 交叉引用

| 文档 | 关系 |
|------|------|
| [147](./147-PI3-Closure-Program-Audit-Report.md) | G1 scope · Path A/B |
| [121](./121-PI3-002-Production-Domain-CDN-CORS-Readiness-Report.md) | prod 域 · 两 scope **同 infra** |
| [122](./122-PI3-001-Production-Database-Backup-Readiness-Report.md) | prod PG |
| [133](./133-G-S8-Growth-Release-Freeze-Report.md) | 链上 GOV **HOLD** 两 scope **同** |
| [146](./146-C-S6-Catalog-Consumer-OptIn-Cutover-Report.md) | prod **`ENABLED=0`** |
| [TT-PHASE2-SEPOLIA-SPINE](./../../runbook/TT-PHASE2-SEPOLIA-DEPLOYED-SPINE-SUMMARY.md) | 链上地址 SSOT |

---

**报告状态**：**PI3-005 Production Scope Decision · `PRODUCTION_SCOPE_SEPOLIA` · Mainnet defer**
