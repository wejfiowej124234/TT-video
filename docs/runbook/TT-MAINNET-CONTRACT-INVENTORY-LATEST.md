# TT · Mainnet Contract Inventory（LATEST）

**Machine:** `evidence/GO_mainnet_money_path/MAINNET-CONTRACT-INVENTORY-LATEST.json`  
**Stamp:** `2026-08-09T23:30:14.600Z` · **historical inventory · 不是 2026-08-18 Official 活面**  
**Verdict:** `RECOVER_AND_BIND`  
**Read-only:** yes · **Broadcast:** no · **TT_PRODUCTION_GO:** NO_GO

> **2026-08-18 Official 活 overlay（不要改本 08-09 表体）：** Official `/meta` Governor / TTG / PM = NEW `0xD581…` / `0x0EC4…` / `0x882Ad…` · SR-FT `0xD1DAE665…` · OLD TTG/Gov/PM + Track1 SR = **LEGACY / SUPERSEDED**。www Product Truth = `OPS-2026.08.20-v9` (`3e356617`) · bake **FORBIDDEN**。Living SSOT：[FTB LATEST](./TT-FINAL-TRUTH-BASELINE-LATEST.md) · [mainnet-address-registry](../../registry/mainnet-address-registry.v1.yaml)。

## FTB core slots

| Role | Address | code |
|------|---------|------|
| factory_v2 | `0x052052f06bfc15cbd63606252db68b4b445aa4f7` | yes |
| timelock | `0x50f0b26167ec73e327d97c54c81f1c1b9efb22f7` | yes |
| timelock_admin_safe | `0x96491aa894658ff7946506318c49F3c76b8f40e7` | yes |
| governor | `0x46Ce671b04d21760e496646bb370ADEbC374ea4d` | yes |
| governance_token | `0x3cB1b328E7a4ea01006b0697813aFEEdafe8512A` | yes |
| treasury_p4cap | `0xfB906ae34521E0BC884AB1a8D0dcf986aBD59BbF` | yes |
| primary_market | `0xf7B7BBa2a5f21b91Fbb016d6B8853DEFa34f56ce` | yes |
| usdc | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` | yes |

## Money path

| Role | Address | Status |
|------|---------|--------|
| SettlementRouter | `0xe5C3ED16741Eb195fAE11b0C1449A79DD675B372` | ON_CHAIN_CODE_YES |
| FeeRouter | `0x2aF47CB6390d7e51C210920b0A62d4d3abD68A72` | ON_CHAIN_CODE_YES |

## Next

Bind verified Settlement/Fee into registry + env; proceed Reality Funds Test

Re-run: `node scripts/dev/run-mainnet-contract-inventory.cjs`
