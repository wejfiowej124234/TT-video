# TT · Final Truth Baseline · V8 Cycle `20260818`（Amendment · Active Truth 指针）

**STATUS:** `AMENDMENT_POINTER` · **不是**第二份地址 SSOT  
**Living Active Truth:** [`TT-FINAL-TRUTH-BASELINE-LATEST`](./TT-FINAL-TRUTH-BASELINE-LATEST.md) · `ACTIVE_UNIQUE_SSOT` · stamp `20260818T031500Z`  
**Immutable parent:** [`TT-FINAL-TRUTH-BASELINE-20260812`](./TT-FINAL-TRUTH-BASELINE-20260812.md) · `IMMUTABLE_HISTORICAL_PARENT`  
**Evidence cited (do not recast L7):** [`TT-TTG-V8-REGISTRY-RUNTIME-MAINNET-REALITY-CONSISTENCY-CERT-LATEST`](./TT-TTG-V8-REGISTRY-RUNTIME-MAINNET-REALITY-CONSISTENCY-CERT-LATEST.md) · `PASS_STOP` · `issued_at_utc=2026-08-18T03:00:00Z`  
**`TT_PRODUCTION_GO`:** `NO_GO`

Owner 本轮选择：**另立 NEW FTB Cycle 吸收 V8，不覆盖 FTB `20260812`。**

梯子（禁止跳阶 / 禁止把本 Amendment 写成 Production GO）：

```text
FTB 20260812（历史事实，immutable）
→ V8 Mainnet Reality Certification          ← PASS_STOP（引用，不重证）
→ NEW FTB Cycle / Amendment（本文件 · Active Truth）
→ Final Reality / Release Certification     ← PASS · blocking_p0_p1=0
→ Production GO 重评                        ← STOP · **FROZEN unique Final Closure entry** · required_before_go=8 · hard_gate=REFUSED
→ TT_PRODUCTION_GO_FINAL_CLOSURE_BATCH      ← 八项窄闭环（冻结之后）
→ Owner Production GO 裁决                  ← 未开
```

## ACTIVE（本 Cycle）

| 角色 | Address |
|------|---------|
| NEW TTG | `0x0EC40c8a4ff31Fcc9e65121C1A38310df0413602` |
| NEW Governor | `0xD5819acACdA86F2C73de4a18cb5e4464ECAF787F` |
| NEW PM | `0x882Ad1926cCea965C189a83aB12a02dBcCB8B6D2` |

NEW PM 是 **新实例**。禁止把 OLD proxy 的 live impl `0xDf9e…`（min=100）抄到 NEW。Quote 以 consistency cert 为准：`usdc_per_ttg=0.00001` · `ttg_per_usdc_unit=1e23` · `min_purchase_usdc=1.0` · `receive_amount=100000.0000` · class `TTG_V8_OFFICIAL_RUNTIME_QUOTE`。

## KEEP（同一身份 · 与 20260812 相同）

| 角色 | Address |
|------|---------|
| Timelock | `0x50F0B26167EC73e327D97c54C81F1c1B9eFB22f7` |
| EscrowFactoryV2Wired | `0xEE0BE3a8a8658E06c44539deD758Fb70A7f3C1C6` |
| SettlementRouter Official live | `0xe5C3ED16741Eb195fAE11b0C1449A79DD675B372` |
| Official OLD FeeRouter | `0x2aF47CB6390d7e51C210920b0A62d4d3abD68A72` |
| P4Cap | `0xfB906ae34521E0BC884AB1a8D0dcf986aBD59BbF` |
| USDC | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` |
| Timelock admin Safe | `0x96491aa894658ff7946506318c49F3c76b8f40e7` |
| SR-FT | `0xD1DAE665eDc16FCEc7b7530Ead3504A846457147` · DEPLOYED_UNWIRED · ≠ Official hop |

## LEGACY / SUPERSEDED（仅本 Cycle；20260812 父本仍保留原身份）

| 角色 | Address |
|------|---------|
| OLD TTG | `0x3cB1b328E7a4ea01006b0697813aFEEdafe8512A` |
| OLD Governor | `0x46Ce671b04d21760e496646bb370ADEbC374ea4d` |
| OLD PM | `0xf7B7BBa2a5f21b91Fbb016d6B8853DEFa34F56ce` |
| OLD PM live impl | `0xDf9eF9278aF4E49449e87c54D45Fb975F8204346` |
| GOV-04 pending impl on OLD proxy | `0xB3bCBc8F90b66E88961C2E8F178924F3200D6aA1` · LEGACY for Official TTG sale |

## 产品面分裂（Expected Difference · 禁止修成假一致）

| 面 | 真源 |
|----|------|
| Official API `/meta` + quote | **必须**对齐本 Cycle ACTIVE 地址 |
| Official www | 冻结 OLD bake `daa5ae87` / `2026-08-16T15:15:49Z` · **不是 Drift** · 禁止 bake |

## Bitget HOLD

完全独立轨。`must_not_unwind_v8_pin: true`。以后即使仍有钱包标签问题，也 **不得**自动把已真实完成的 V8 主网切针回滚，也 **不得**把 living FTB 退回 20260812 地址表。

## 禁止

- 覆盖 / 改写 [`TT-FINAL-TRUTH-BASELINE-20260812`](./TT-FINAL-TRUTH-BASELINE-20260812.md) 字节  
- 把本 Amendment 或 Final Reality cert PASS 写成 Production GO  
- 重跑已闭合的 L7 / `/meta` / Registry consistency 来“再证明一遍”  
- 用 Bitget HOLD unwind V8  
- Official www bake · 再发 `setGovernor` · CI-02 hop B · Money Path 再部署 · 重复 1 USDC 真金
