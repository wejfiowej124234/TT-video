# TT · TTG V8 · API Runtime Decoupling · No Web Touch

> **Official Product Truth（活面）：** TravelTrust Official · **OPS-2026.08.20-v9** (`3e356617` / `2026-08-20T00:51:57Z` / `hybrid-…-v9`) · API `8df2ab21…` · historical `daa5ae87` SUPERSEDED · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)


**STATUS:** `TTG_V8_API_RUNTIME_DECOUPLING_NO_WEB_TOUCH` · `PASS_STOP`  
**Machine:** [TT-TTG-V8-API-RUNTIME-DECOUPLING-NO-WEB-TOUCH-LATEST.json](./TT-TTG-V8-API-RUNTIME-DECOUPLING-NO-WEB-TOUCH-LATEST.json)  
**Overlay:** [`registry/ttg-v8-api-runtime-contract-overlay.v1.json`](../../registry/ttg-v8-api-runtime-contract-overlay.v1.json)  
**`TT_PRODUCTION_GO`:** `NO_GO`

阶段口径：**③ Official API Runtime 已对齐 NEW V8**（仅 `tt-api-prod`）。**Frozen Web UI/UX 未漂。** **≠ FTB 已改 ≠ Production GO。**

允许说的一句：

> 链上 NEW V8 + Official API Runtime 已经对齐；Frozen Web UI/UX 保持原样。

禁止用本闸宣称 Production GO，或宣称 FTB `20260812` 已改。

## 三组验收（Owner 授权 API-only Official deploy 后 · 本轮）

| # | 清单项 | 状态 | 未完成应在哪阶 |
|---|-----|---|----|
| 1 | Official `/meta` = NEW TTG / NEW PM / NEW Governor | ✅ 完成 | — |
| 2 | V8 pricing：1 USDC = 100,000 TTG · min 1 USDC | ✅ 完成 | — |
| 3 | Official www fingerprint BEFORE == AFTER（`daa5ae87…` · `build_time` · 56 assets · CSS/JS） | ✅ 完成 · 已冻结 | — |
| 4 | FTB `20260812` 改写 | ❌ 未完成 | **禁止本闸代做** |
| 5 | Production GO | ❌ 未完成 | **③ 另闸** |

## Official `/meta`（live）

| 槽 | 地址 |
|----|------|
| NEW Governor | `0xD5819acACdA86F2C73de4a18cb5e4464ECAF787F` |
| NEW TTG | `0x0EC40c8a4ff31Fcc9e65121C1A38310df0413602` |
| NEW PM | `0x882Ad1926cCea965C189a83aB12a02dBcCB8B6D2` |
| KEEP Timelock | `0x50F0B26167EC73e327D97c54C81F1c1B9eFB22f7` |
| KEEP Official OLD FR | `0x2aF47CB6390d7e51C210920b0A62d4d3abD68A72` |
| KEEP Wired | `0xEE0BE3a8a8658E06c44539deD758Fb70A7f3C1C6` |

`build.git_sha` secret 仍可能印 `8df2ab21…`。新二进制的证明是 **NEW `/meta` 合约键**，不是 git_sha。

## V8 quote（Official API Runtime）

`GET /api/v1/governance/ttg-exchange/quote?pay_stable=USDC&pay_amount=1`

- `official_runtime.usdc_per_ttg` = `0.00001`
- `official_runtime.ttg_per_usdc_unit` = `100000000000000000000000`
- `official_runtime.min_purchase_usdc` = `1.0`
- `receive_amount` = `100000.0000`（1 USDC → 100,000 TTG）

## Official www fingerprint

**本闸观察（API-only cutover · www 未动 · 不可改写）：**  
`git_sha=daa5ae87b8c1 (stamp SUPERSEDED · living OPS-v9)af548c6beff6dd3451e5d386acf2` · `build_time=2026-08-16T15:15:49Z` · **assets=56**（1 CSS + 55 JS）· `asset_sha256=236006c266774e315a7a6a422a719883a20fd72c277f88a824cfcd38c341ebd6` · **BEFORE == AFTER**.

**Living Product Truth（后置）：** www = **OPS-2026.08.20-v9** (`3e356617` / `2026-08-20T00:51:57Z` / `hybrid-live-auth-pin-nontarget-v9-20260820`); historical `daa5ae87` SUPERSEDED as living Official.

`frontend/` 本轮增量：**0**。`tt-web-prod`：**未动**（相对本闸）。

## Deploy pin（API-only）

- app `tt-api-prod` · machine `48ed195c524378` (sin)
- image `deployment-01M09AZ25KY73638J24TRQH1NC`
- overlay `TTG_V8_API_RUNTIME_OVERLAY=1`

证据：`evidence/GO_ttg_v8_api_runtime_decoupling/`

**STOP：** 不要改 FTB · 不要宣称 Production GO · 不要 www bake。

**Successor（本轮已跑）：** [TT-TTG-V8-REGISTRY-RUNTIME-MAINNET-REALITY-CONSISTENCY-CERT-LATEST.md](./TT-TTG-V8-REGISTRY-RUNTIME-MAINNET-REALITY-CONSISTENCY-CERT-LATEST.md) · `PASS_STOP`。下一闸是 Owner **单独**决定 FTB 如何吸收 NEW V8；Bitget HOLD 继续独立，不得 unwind V8 针。
