# `/staking` · Phase ① 收口（2026-06-03）

**阶段：① 本地** — 向导 / 商家 **IdentityStakingPool** 读面板 + stake/withdraw + Registry；**不**表示 ② 测试网全链、③ 主网 Production GO。

**代码真源：** `frontend/app/staking/page.tsx` · `frontend/components/staking/*` · **81** / **14** / **04 §3.4**

---

## 收口结论（ACTIVE）

| 维度 | 状态 |
|------|------|
| **视觉族** | **13 资金/信任区** — `bg-bg-main` · `bg-bg-console` 卡片 · **无** 霓虹 / 玻璃 Hero |
| **结构** | 说明区 → `/guide/register` CTA → guide 池三面板 → provider 池三面板 → Registry → 免责声明 · `ProductCrossNav` |
| **链上写** | `StakingStakePanel` / `StakingWithdrawPanel`（wagmi · 须 env 与 API `/meta.chain.contracts` 对拍） |
| **UI 冻结** | **维护期锁** — 禁止改回 market 摄影底 / cyan 协议台 / 单池合并丢失 provider 轨 |

---

## 维护期边界

| 允许 | 禁止 |
|------|------|
| 合约地址 env · ABI 对拍 · i18n · 错误态 | 删除双池（guide + provider）或 Registry 面板 |
| `GET /meta` 合约字段诚实化文案 | 无钱包连接时伪造链上余额 |
| 跳转 `/guide/register` 主 CTA | 冒充 ② 测试网 stake 全矩阵已 GO |

---

## 机读（① · 结构对拍）

当前 **无** 独立 `stakingL5.contract.test.ts`；变更须：

1. 保持 **Console 壳** 与 **双池** 结构（上表）。  
2. 推送前跑 **`run-orders-l5-green.sh`** + **`run-web3-itinerary-l5-green.sh`**（共享 wagmi / 订单走廊无回归）。  
3. ② 阶段补 **`stakingPage.contract.test.ts`** 与烟测（**PHASE2-START-CHECKLIST**）。

---

## 诚实边界

| 可宣称（①） | 禁止冒充 |
|-------------|----------|
| 页面结构 · 双池 · Registry 只读已收口 | ② staging 真 stake GO |
| 本地 chain_off / dev RPC 可读 | ③ 主网 slashing 已验 |
