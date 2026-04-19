# TT-B320 · NEXT_PUBLIC 与 `frontend/.env.example` 机读 diff 规格（审计登记）

**卡号**：`TT-B320-NEXT-PUBLIC-ENV-DIFF-SPEC-001` · **母表** `B-320`  
**日期**：2026-04-15  
**范围**：仅 **文档 / 台账 / 索引**；**先审计后登记**；**不改** `frontend/**` 业务实现、`crates/**`、CI workflow。

**真值边界**

- **浏览器构建注入键（NEXT_PUBLIC_*）** 的 **示例与说明 SSOT**：**`frontend/.env.example`**（Next.js 应用目录）。
- **仓库根** **`.env.example`** 仅含 **API / 链** 等后端变量；其中对 **`NEXT_PUBLIC_*`** 的提及为 **互指注释**（非前端键表；与 **53 BB2**、根文件头说明一致）。
- **代码引用**：以 `frontend/` 下 **`process.env.NEXT_PUBLIC_*`**（及测试中的同名 stub）为「实现侧已使用键」证据。

---

## 1. 机读 diff 规格（供人工或后续脚本复用）

**输入 A — 示例文件键集**：自 **`frontend/.env.example`** 提取所有形如 **`NEXT_PUBLIC_[A-Z0-9_]+`** 的键名：

- 匹配 **赋值行** `KEY=…` 与 **注释示范行** `# KEY=…`（去掉前导 `#` 与空格后再判）。
- **忽略**：纯说明句中出现的键名若无数值行/注释示范，可不纳入「声明键集」（本批以 **赋值/注释示范** 为准）。

**输入 B — 实现侧键集**：自 **`frontend/`**（建议限定 `*.ts` / `*.tsx` / `*.mjs`，排除 `locales/*.ts` 中**仅文案**提及）提取 **`process.env.NEXT_PUBLIC_[A-Z0-9_]+`** 与测试里 **`NEXT_PUBLIC_*`** 字符串字面量。

**比较规则**

1. **排序**：对 A、B 的键名分别 **字典序** 排序后比较。
2. **集合差分**：
   - **`B \\ A`**：代码已用但 **`.env.example` 未声明（无对应赋值或注释示范行）** → **登记缺口**（见 §3）。
   - **`A \\ B`**：示例已声明但 **实现侧未引用** → 多为 **预留/文档化**；登记为 **可选或待接入**，**不**自动判错。
3. **根目录 `.env.example`**：**不**与 A 做键级合一；仅在审计中记录其为 **后端视角互指**（见 §4）。

---

## 2. 审计快照（2026-04-15 · 登记）

### 2.1 `frontend/.env.example` 中出现的 `NEXT_PUBLIC_*` 键名（赋值或 `# …=` 示范）

| 键名 | 备注 |
|------|------|
| `NEXT_PUBLIC_API_BASE_URL` | 默认一行赋值 |
| `NEXT_PUBLIC_SITE_URL` | 注释示范 |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | 空值示范 |
| `NEXT_PUBLIC_CHAIN_ID` | 注释示范 |
| `NEXT_PUBLIC_RPC_URL` | 注释示范 |
| `NEXT_PUBLIC_FEE_ROUTER_ADDRESS` | 注释示范 |
| `NEXT_PUBLIC_INVESTOR_DISTRIBUTION_CLAIM_ADDRESS` | 注释示范 |
| `NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS` | 注释示范 |
| `NEXT_PUBLIC_SETTLEMENT_TOKEN_ADDRESS` | 注释示范 |
| `NEXT_PUBLIC_ARBITRATOR_ADDRESS` | 注释示范 |
| `NEXT_PUBLIC_DISPUTE_WINDOW_SECONDS` | 注释示范 |
| `NEXT_PUBLIC_SKIP_ME_FETCH` | 注释示范 |
| `NEXT_PUBLIC_DEV_USER_ID` | 注释示范 |
| `NEXT_PUBLIC_GUIDE_STAKING_ADDRESS` | 注释示范 |
| `NEXT_PUBLIC_STAKING_PROVIDER_ADDRESS` | 注释示范 |
| `NEXT_PUBLIC_REGISTRY_ADDRESS` | 注释示范 |
| `NEXT_PUBLIC_TRAVELTRUST_VIDEO_MP4` | 注释示范 |
| `NEXT_PUBLIC_TRAVELTRUST_VIDEO_WEBM` | 注释示范 |
| `NEXT_PUBLIC_TRAVELTRUST_VIDEO_POSTER` | 注释示范 |

### 2.2 实现侧已引用（`process.env` / 构建期）的 `NEXT_PUBLIC_*`（证据路径摘要）

| 键名 | 代表路径 |
|------|----------|
| `NEXT_PUBLIC_API_BASE_URL` | `frontend/lib/api.ts`、`frontend/next.config.js` |
| `NEXT_PUBLIC_SITE_URL` | `frontend/lib/siteMetadataBase.ts` |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | `frontend/components/Providers.tsx` |
| `NEXT_PUBLIC_CHAIN_ID` / `NEXT_PUBLIC_RPC_URL` | `frontend/lib/chainEnv.ts` |
| `NEXT_PUBLIC_FEE_ROUTER_ADDRESS` | `frontend/lib/feeRouterEnv.ts`、`platformFeeRecipient.ts` |
| `NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS` | `frontend/lib/escrowFactoryEnv.ts`、`dapp/hooks/useEscrowFactoryCreate.ts` |
| `NEXT_PUBLIC_SETTLEMENT_TOKEN_ADDRESS` | `frontend/lib/settlementTokenEnv.ts` |
| `NEXT_PUBLIC_ARBITRATOR_ADDRESS` | `frontend/lib/arbitratorEnv.ts` |
| `NEXT_PUBLIC_DISPUTE_WINDOW_SECONDS` | `frontend/lib/disputeWindowEnv.ts` |
| `NEXT_PUBLIC_INVESTOR_DISTRIBUTION_CLAIM_ADDRESS` | `frontend/lib/investorDistributionClaimEnv.ts` |
| `NEXT_PUBLIC_GUIDE_STAKING_ADDRESS` / `NEXT_PUBLIC_STAKING_PROVIDER_ADDRESS` / `NEXT_PUBLIC_REGISTRY_ADDRESS` | `frontend/lib/stakingEnv.ts`、`registryEnv.ts` |
| `NEXT_PUBLIC_DEV_USER_ID` | `frontend/lib/apiClient/core.ts` |
| `NEXT_PUBLIC_SKIP_ME_FETCH` | `frontend/lib/apiClient/me.ts` |
| `NEXT_PUBLIC_TRAVELTRUST_VIDEO_*` | `frontend/components/traveltrust/TravelTrustVideoBlock.tsx` |
| `NEXT_PUBLIC_DISABLE_IDLE_PREFETCH` | `frontend/components/navigation/RoutePrefetcher.tsx` |

**说明**：`frontend/locales/en.ts`、`zh.ts` 等多处 **用户可见文案** 含键名说明；**不**计入 §2.2「运行时读取」集合，但与 **53 / Runbook §7.1** 叙事一致。

---

## 3. 差分结论（B \\ A 登记）

| 键名 | 结论 |
|------|------|
| **`NEXT_PUBLIC_DISABLE_IDLE_PREFETCH`** | **实现侧已读**（`RoutePrefetcher`），**`frontend/.env.example` 未出现**。本卡 **不改** `.env.example`；**建议后续** 单 TT 或文档同批 **补一行注释示范**（`=1` 关闭 idle prefetch），以免运维只读示例时漏知。 |

**A \\ B**：当前示例中列出的键均在代码或链上流程中有对应 **`process.env`** / 业务依赖或 i18n 叙事；无孤立「仅占位无引用」项需本卡删除。

---

## 4. 根目录 `.env.example` 与前端键（互指，非合一）

根文件在 **BB2**、**FeeRouter**、**可选前端镜像** 等段落以 **注释** 形式出现 `NEXT_PUBLIC_API_BASE_URL`、`NEXT_PUBLIC_CHAIN_ID`、`NEXT_PUBLIC_RPC_URL`、`NEXT_PUBLIC_REGISTRY_ADDRESS`、`NEXT_PUBLIC_GUIDE_STAKING_ADDRESS`、`NEXT_PUBLIC_STAKING_PROVIDER_ADDRESS`、`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` 等，**用途**是提醒 **与 `frontend/.env.example`、GET /meta、链配置** 对齐；**机读 diff 的 A 集仍以 `frontend/.env.example` 为准**。

---

## 5. 验收（本卡 · docs-only）

- 本 Runbook 已给出 **机读 diff 规则** + **2026-04-15 审计快照** + **`NEXT_PUBLIC_DISABLE_IDLE_PREFETCH` 缺口登记**。
- **未**修改任何 `*.ts` / `*.tsx` 实现逻辑；**未**新增 CI 脚本门禁（后续可选 **`scripts/`** 机读子集另开 TT）。

---

## 6. 互证

- **母表**：[`docs/任务母表.md`](../任务母表.md) **B-320**
- **执行索引**：[`docs/AI任务卡索引.from-stash.md`](../AI任务卡索引.from-stash.md) 一览 **330** · **`### TT-B320-NEXT-PUBLIC-ENV-DIFF-SPEC-001`**
