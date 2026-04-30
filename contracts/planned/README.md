# contracts/planned（未纳入 Foundry `src/` 的占位）

本目录 **不** 被 **`foundry.toml`** 的 **`src = "src"`** 编译；用于 **96-18 / 14 §1.1.0c** 链上叙事与 **API/DB 已 Partial** 时的 **合约面对齐草稿**，避免与 **`contracts/src/*.sol`** 真实现混淆。

| 文件 | 说明 |
|------|------|
| **`OnboardingFeeReceiver.placeholder.sol`** | **M1 链上收款** **叙事旁注**（**96-18 §5.2 B / §6**）；**ABI 真值** 见 **`contracts/src/OnboardingFeeReceiver.sol`** + **`contracts/abi/OnboardingFeeReceiver.json`** ↔ **`frontend/dapp/abis`**（**55-S13·2b**）；本占位文件 **不** 参与 **`forge build`**。 |
| **`ONBOARDING_WEBHOOK_ASYNC_JOBS_MIGRATION_NOTES.md`** | **250 / 96-09**：**`onboarding_webhook_*` → `async_jobs`** **Target** **工程笔记**（**未** **实现**）；与 **[250 §3.1](../../docs&#47;spec/250-阶段Job-Queue-异步任务系统.md)** **96-09** **表行**、**[96-18-未完成 §2 P2](../../docs&#47;spec/96-18-未完成清单与多维检查.md)** 对读。 |

**SSOT**：**[96-18](../../docs&#47;spec/96-18-商家与主理人准入费用与治理币兑换设计.md)**、**[14](../../docs&#47;spec/14-合约-API-ABI-前后端对齐.md)**、**[96-07](../../docs&#47;spec/96-07-链上资金与合约终验.md)**、**[go-live-checklist](../../docs/go-live-checklist.md)**。
