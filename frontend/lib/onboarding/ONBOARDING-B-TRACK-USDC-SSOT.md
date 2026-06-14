# B 轨准入费 · USDC 官方收款 SSOT（①）

**阶段：** **① 本地**。**②** 测试网 `OnboardingFeePaid` 索引 · **③** 生产国库另闸。

**互指：** `docs/spec/artifacts/onboarding-fee-schedule.v1.md` · `app/me/onboarding/README.md` · `GUIDE-ONBOARDING-STAKING-FLOW.md`（向导无 B 轨）

---

## 1. 与身份质押分工（写死）

| | **B 轨准入费（本轨）** | **身份质押** |
|--|------------------------|--------------|
| **性质** | 平台运营收入 | 履约押金 |
| **币种** | **USDC** | **USDC** |
| **能否退** | **原则上不退**（平台费） | **可赎回**（`withdraw` · 未 slash 部分） |
| **收款** | **官方地址** `ONBOARDING_FEE_RECEIVER_ADDRESS` | `GuideIdentityStakingPool` / `ProviderIdentityStakingPool` |
| **页面** | `/me/onboarding` | `/staking` · 审核后 `/guide` Banner |
| **角色** | 商家、主理人 | 向导、商家 |

**禁止：** 用 Stripe/PSP 美元 SKU 叙事冒充 **①** 默认收款路径（遗留 Stripe 仅 **②** 可选旁路，默认关闭）。

---

## 2. 收款路径（①）

```
用户钱包 USDC --ERC20 transfer--> 官方收款地址
                              or OnboardingFeeReceiver.pay()（② 索引 OnboardingFeePaid）
```

| 环境变量（API） | `ONBOARDING_FEE_RECEIVER_ADDRESS` |
| 环境变量（前端） | `NEXT_PUBLIC_ONBOARDING_FEE_RECEIVER_ADDRESS` · `NEXT_PUBLIC_USDC_TOKEN_ADDRESS` |
| 合约 | `OnboardingFeeReceiver.sol`（**Partial · MVP**） |
| 价目 | `onboarding-fee-schedule.v1.yaml` · **`currency: USDC`** |

---

## 3. 前端支付 UI

| 组件 | 路径 |
|------|------|
| USDC 转账面板 | `components/me/onboarding/MeOnboardingUsdcFeePayment.tsx` |
| 门闸 / 金额换算 | `lib/onboarding/onboardingFeeEnv.ts` |
| 入驻写操作区 | `app/me/onboarding/MeOnboardingWritesSection.tsx` |

**流程：** 创建 payment-intent（幂等 / entitlement）→ **钱包支付 USDC 至官方地址** → 刷新资格 → role-confirm。

---

## 4. 诚实边界

① 本地 `TRAVELTRUST_ONBOARDING_LOCAL_DEV=1` 可 `amount_minor=0` + 模拟已付 · **≠** ② 链上 `OnboardingFeePaid` 已验 · **≠** ③ 生产 PSP/主网 GO。
