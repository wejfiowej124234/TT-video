# GO_96_bundle_20260428

**UTC scope note:** Engineering iteration focused on **96-18** HTTP/DB **Partial** (local + testnet evidence paths). **Not** a full production PSP / mainnet / Tier C closure.

**SSOT:** [96-01 §0.3](../docs/spec/96-01-总则与95边界和执行顺序.md) 一束表。

| 束 | 分册 | 状态 | 说明 |
|----|------|------|------|
| 经济 · 准入费 / TTG | **96-18** | **Partial** | **G1/G2/G3** 已定稿或 Partial；**G4/G5/G6/G15** Partial（`cargo test -p traveltrust-api onboarding`、`matrix_93_*`、`e2e/me-onboarding-96-18-shell.spec.ts`、`onboarding.http.test.ts`）；**P0**（生产 PSP、mTLS、OFAC API）仍 **Target**；见 [96-18-未完成清单](../docs/spec/96-18-未完成清单与多维检查.md)。 |
| 深度多维 | **96-15** | **N/A（本轮）** | 未承诺 **Tier C**；机读编排见仓库 CI / `scripts/release/run_96_15_orchestration.py`。 |
| 链上终验 | **96-07** | **N/A（本轮）** | 主网 / go-live **另闸**；**OnboardingFeeReceiver** 为合约 **MVP** 与索引旁路，非生产终验闭。 |

其余 **96-02～96-17** 各行：发版前由 Owner 按 **96-01** 表替换为 **☑** 或 **N/A** 一句；本目录不冒充全束已签。
