# TT · V9 Official Website Alignment Candidate — Owner 审阅清单（先看后做）

**STATUS:** `OFFICIAL_V9_PRODUCT_AND_WEB3_CLEAN_BASELINE` · **STOP**  
**Clean baseline commit/tag:** `OFFICIAL_V9_PRODUCT_AND_WEB3_CLEAN_BASELINE`（见 `evidence/GO_ttg_v9_audit/OFFICIAL_V9_PRODUCT_AND_WEB3_CLEAN_BASELINE.json`）  
**Product mother:** OPS-2026.08.20-v9 · `3e356617…` · live www matched  
**Metrics:** `git status --porcelain=0` · `OFFICIAL_PRODUCT_DRIFT=0` · `V9_WEB3_TRUTH_LOSS=0` · `OLD_V9_ACTIVE_DOCUMENT_REFERENCES=0`  
**Website P0+P1：** 尚未实施（须在干净基线上另开一轮 allowlist）  
**上游：** `V9_DOCUMENTATION_TRUTH_BASELINE` · Whitepaper PASS · GitHub Official PASS · Design Lock **DL_R1**  
**目标状态展示（未来官网对齐）：** `MAINNET_DEPLOYED_PHASE1` / `TIMELOCK_CUTOVER_PENDING` · **≠** Fully Active · **≠** 公售已开放 · **≠** `TT_PRODUCTION_GO`

> Dirty closure 已完成：Production 产品母版 + V9 Web3 成果合并为干净基线。**未** Production deploy · **未** `/meta`/Indexer 切针 · **未** `git reset --hard`。  
> Gate 目标（洁净开工并执行官网 P0+P1 后）：`WEBSITE_V9_TRUTH_CONFLICTS=0` · … → stamp `V9_OFFICIAL_WEBSITE_ALIGNMENT_CANDIDATE_PASS`

---

## 0 · 边界（写死）

| 允许 | 禁止（本 Candidate） |
|------|----------------------|
| Local 文案 / i18n / 数据常量 / 链接校正 | Production deploy / www bake |
| `/governance/*` 等非五主页结构重写（若需要） | `/meta` · Indexer 切针 |
| 五主路由 **仅** copy/data（结构/视觉冻结） | 改 DL_R1 合约 / Phase1 地址 / 链上参数 |
| 引用 `docs/github-official` ACTIVE Registry | 翻 `TT_PRODUCTION_GO` |
| 明确 LEGACY 降级文案 | 开放 TTG Public Sale CTA / “Mainnet 已全部完成” |

**五主冻结：** `/` · `/traveltrust` · `/market` · `/did-rank` · `/community/*` — **禁止**改 layout / section 顺序 / visual token；经济修正只动 **locale 字符串 + 数据常量**。

---

## 1 · 必须升级的 ACTIVE 口径（目标文案）

| # | 主题 | 官网必须写成 |
|---|------|----------------|
| A1 | 供给 | **25T · NO-MINT** |
| A2 | Genesis | **50 / 35 / 3 / 5 / 7** |
| A3 | 一级市场 | **五批 Norm** · 窗口 **未对公众开放** · `seedBatches` 仍属 cutover pending |
| A4 | 公售 USDC | → **NEW ProjectPool**（禁止 ACTIVE 写旧 P4Cap） |
| A5 | 平台费 | **5%（500 bps）** → 有主理人 **45% 登记钱包 / 55% ProjectPool** · 无主理人 **100% ProjectPool** |
| A6 | 准入 | **300,000 USDC** Access Fee |
| A7 | Role Stake | Steward **ACTIVE** · live `totalSupply()×bps` · Merchant/Guide **DISABLED** |
| A8 | Pool 拨付 | **90d ≤ 30%** · ops `to` = Treasury Norm |
| A9 | 治理 | Governor → **48h SoloTimelock** · **无 Safe** 作 V9 Official admin |
| A10 | 架构 | **NEW / KEEP / LEGACY** |
| A11 | 状态机 | 只展示 **`MAINNET_DEPLOYED_PHASE1` / `TIMELOCK_CUTOVER_PENDING`** |
| A12 | 地址 | 仅来自 Official ACTIVE Contract Registry（GitHub pack / Baseline） |

---

## 2 · 页面升级清单（按优先级）

### P0 — 错误 ACTIVE 经济 / 地址（必须先改）

| ID | 路由 / 表面 | 现状问题 | 拟升级动作 | Owner |
|----|-------------|----------|------------|-------|
| W-P0-01 | `/governance/params` | 文案写 25T·50/35/3/5/7，表格仍可能渲染 **10M / 15/5/30/50**（`governanceParamsTokenomicsModel.ts`） | 统一为 **25T · 50/35/3/5/7** 单表；旧 Genesis V2 表 **LEGACY 降级或移出 ACTIVE** | ☐ |
| W-P0-02 | `/governance/params` Fee / Treasury 文案 | **P4Cap**、Global **65/20/15 stakers**、旧 FeeRouter L1 叙事 | 改为 CountryFeeRouter：**5% → 45/55\|100% → ProjectPool**；`globalStakers`/`P4Cap` 标 **LEGACY** | ☐ |
| W-P0-03 | `governanceParamsProtocolReferenceMirror.ts` | 离线镜像仍含 Legacy 全局分账 | 镜像对齐 DL_R1 或显式 `LEGACY_MIRROR` 不进 ACTIVE UI | ☐ |
| W-P0-04 | `/traveltrust#settlement` | Settlement 条依赖旧 PM/TTG LIVE 地址模块（且可能缺失/错针） | 改挂 **V9 Phase1 ACTIVE Registry**（TTG + Market + **ProjectPool** 等）+ 状态 `DEPLOYED_PENDING_CUTOVER` | ☐ |
| W-P0-05 | `/traveltrust` liquidity / unlock | 批次日程可能按日期显示 **`open`** | 强制公售 CTA / 状态 = **窗口未开放** · Phase1 cutover pending；禁止 Fully Active | ☐ |
| W-P0-06 | 三轮旧公售模型 | `traveltrustTtgPublicRounds.ts`（800k/1.2M/3M 等）与五批冲突 | ACTIVE UI **停用**旧三轮；仅五批 Norm | ☐ |
| W-P0-07 | 参考价模型 | `ttgReferencePriceV1.ts`（10M / $25 等） | 降级 LEGACY 或移出公开页 | ☐ |
| W-P0-08 | i18n `governance_params_*` / `traveltrust_*`（en+zh） | 混用「全球财库 55%」「P4Cap」「持币分红」暗示；缺 ProjectPool / 5% 平台费明示 | 中英同步改到 A1–A12；禁止 ACTIVE `globalStakers` | ☐ |

### P1 — 导航 / CTA / 链接 / 角色认知

| ID | 路由 / 表面 | 现状问题 | 拟升级动作 | Owner |
|----|-------------|----------|------------|-------|
| W-P1-01 | `/traveltrust` FAQ / 兑换 CTA | “如何获得 TTG” 须保持关闭窗 | CTA → 规则预览 + **非发售邀请**；链到白皮书 / GitHub Official Docs | ☐ |
| W-P1-02 | `/traveltrust#roles` Merchant/Guide | 产品角色 CTA 易被理解成 Role Stake 已开 | 加一句：**Role Stake Merchant/Guide = DISABLED** | ☐ |
| W-P1-03 | `/staking` | Guide/Provider identity stake 易与 V9 RoleStake 混淆 | 页眉/说明：**≠ V9 Role Stake** · Steward 另述 | ☐ |
| W-P1-04 | `/governance/fee-routes` | 名称与旧 FeeRouter 绑定 | 标题/导语区分 **KEEP Money Path 事件** vs **NEW CountryFeeRouter**；未切针前诚实 pending | ☐ |
| W-P1-05 | Footer / Protocol / Brand / Assurance | 白皮书多为 placeholder | 链到 Mainnet Edition Whitepaper + `docs/github-official`；审计页保持诚实 | ☐ |
| W-P1-06 | Explorer / Etherscan 链接 | 可能仍指旧地址 | 一律指向 ACTIVE Registry 地址 | ☐ |
| W-P1-07 | 中英文对拍 | 改 EN 必须同批 ZH（及反之） | 双语 diff 入 Gate | ☐ |

### P2 — 抛光 / 残留 / 低风险

| ID | 路由 / 表面 | 拟升级动作 | Owner |
|----|-------------|------------|-------|
| W-P2-01 | `/` 首页 | 几乎无 TTG 板；确认不引入假 Fully Active；可选轻量状态条（Phase1 pending）— **五主仅 copy** | ☐ |
| W-P2-02 | `/market` `/did-rank` `/community/*` | 当前几乎无 tokenomics；扫漏即可 | ☐ |
| W-P2-03 | Legacy FAQ keys | 保留但不得挂 ACTIVE 壳 | ☐ |
| W-P2-04 | Admin FeeRouter 页 | 非官网公开展示主路径；本 Candidate 可 **不改** 或仅加 LEGACY 注 | ☐ |
| W-P2-05 | 移动端 / UX | 改文案后抽检 settlement / params / liquidity 不换行崩、CTA 不诱导买入 | ☐ |

---

## 3 · 建议新增（Local Candidate · 可选但推荐）

| ID | 项 | 说明 | Owner |
|----|----|------|-------|
| W-NEW-01 | `frontend` 内 **V9 Public Contract Registry** 单源模块 | 从 Baseline / `docs/github-official` 派生 Phase1 地址；禁止手写散落 | ☐ |
| W-NEW-02 | 公开「V9 Status」只读条 | 文案：`MAINNET_DEPLOYED_PHASE1` · cutover pending · 公售未开放 | ☐ |
| W-NEW-03 | Website alignment Gate 脚本 | 扫 `frontend/` 公开文案冲突 / Legacy 泄漏 / 错地址 / 断链 / 覆盖率 | ☐ |

---

## 4 · ACTIVE 合约地址（唯一允许披露 · 来自 Registry）

| Role | Address | 展示状态 |
|------|---------|----------|
| TTG V9 | `0xD5c1Ef9ec730F93e324A1966bD414a7f5ebc41c9` | `DEPLOYED_PENDING_CUTOVER` |
| SoloTimelock | `0x99e43FaBA8dC773888223f70e1dfCd18bea37D7f` | `DEPLOYED_PENDING_CUTOVER` |
| ProjectPool | `0x7B21b421981A3B61cc08c8E22D4fd690E457Df37` | `DEPLOYED_PENDING_CUTOVER` |
| CountryFeeRouter | `0x5afD2e0C8b9fa4eecfde4bf582d3B282D28F4970` | `DEPLOYED_PENDING_CUTOVER` |
| Vault | `0xe87378e49Ead2E1a422B8cae118d3C905Ee45B6C` | `DEPLOYED_PENDING_CUTOVER` |
| Market | `0xc714E2567982ea92d5f3C5b66ab65532Cfc5f09b` | `DEPLOYED_PENDING_CUTOVER` |
| Governor | `0xA0DfC4C5C544488AfEfE696AfB8e5823911e5A9c` | `DEPLOYED_PENDING_CUTOVER` |
| RoleStake | `0xf6A1Fb4435E463117a666818611F49D03F91E7A7` | `DEPLOYED_PENDING_CUTOVER` |
| KEEP EscrowFactory | `0xEE0BE3a8a8658E06c44539deD758Fb70A7f3C1C6` | `KEEP` |
| KEEP SettlementRouter | `0xe5C3ED16741Eb195fAE11b0C1449A79DD675B372` | `KEEP` · setFeeRouter pending |
| USDC | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` | `KEEP` |

**禁止进入官网 ACTIVE：** Safe `0x96491…` · 旧 Timelock `0x50F0…` · 旧 P4Cap `0xfB906…`（仅可在 Legacy 说明）。

---

## 5 · 明确不改（本阶段）

- DL_R1 Solidity / bytecode / Phase1 链上参数  
- Production 部署 / 官网 bake / CI 顶栏冒充 GO  
- Production `/meta` · Indexer 切针  
- `TT_PRODUCTION_GO`  
- 五主路由 **结构 / 视觉 / layout lock**  
- 开放 Public Sale 购买流  

---

## 6 · Owner 决策（请回复）

请用一句或勾选回复，例如：

1. **批准全部 P0+P1**（P2 可选）→ 我开始 Local Candidate 改码 + Gate  
2. **只批准 P0** → 先做经济/地址真相，P1 下轮  
3. **修改清单** → 注明要删/缓的 ID（如 W-P0-0x）  
4. **暂停** → 本 Candidate 保持 WAITING  

**STOP（本回合）：等待 Owner 审阅。未执行官网代码修改。**
