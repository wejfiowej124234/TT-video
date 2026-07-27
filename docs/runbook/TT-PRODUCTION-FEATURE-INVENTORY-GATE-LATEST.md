# TT · Production Feature Inventory Gate

**Machine key:** `TT_FEATURE_INVENTORY_GATE`  
**Gate script:** `scripts/gates/check-production-feature-inventory-gate.sh`  
**Evidence:** [`FEATURE-INVENTORY-GATE-LATEST.json`](../../evidence/PSG-REALITY-CLOSURE/FEATURE-INVENTORY-GATE-LATEST.json)  
**Matrix:** [`TT-PRODUCTION-FEATURE-INVENTORY-LATEST.json`](./TT-PRODUCTION-FEATURE-INVENTORY-LATEST.json)

## Current

| 项 | 值 |
|----|-----|
| Status | **`FEATURE_INVENTORY_PASS`** |
| Unique RC tip | `ea71c577ce6f99696df33f9394cf96746edc843b` |
| Pin | `PSG-REL-20260720-WEB3-CAND-V2` |
| W7 pack | `evidence/PSG-REALITY-CLOSURE/W7-DELTA-RECERTIFY-LATEST.json` |
| PCR | `PCR-20260722-FEATURE-INVENTORY-W7-ARM` |

## 规则（写死）

1. `FEATURE_INVENTORY_MATRIX_OK` ≠ PASS（九域未齐或未武装）  
2. `ALL_DOMAINS_READY_PENDING_W7_ARM` = 九域 READY、待 W7 武装  
3. **`FEATURE_INVENTORY_PASS`** = W7 Delta Recertify 验证齐 + `docs_only:false` 证据包  
4. PASS ≠ Reality Closure PASS ≠ Staging-grade GO ≠ Production GO  

## 禁止

docs-only PASS · 改 tip/pin/六锚 · 产品代码 Delta 冒充闸 · 提前宣称 GO

## Track B · Studio media limits note (`20260727T081945Z` · Local)

| Surface | Limit SSOT | Note |
|---------|------------|------|
| FE Studio promo video | `MARKET_STUDIO_PROMO_VIDEO_MAX_BYTES` = **32 MiB** (`frontend/lib/marketStudioMediaLimits.ts`) | i18n + community `max_video_bytes` aligned in unit table |
| HU-007-B Cancel→Draft | DiscardConfirm + localStorage draft hydrate | Merchant / Acquisition Studio |
| DiscardConfirm z-index | `marketStudioDiscardConfirmPortalRootClass` **`z-[410]`** | over Studio modal stack |
| Publish gate block | assertive `role=alert` | not disabled+tooltip only |
| Platform cover | `cover_media_asset_id` + dual-read helper | Local eng slice |
| Batch-9 `ADMIN_HOME_CARDS` | **FORBIDDEN refill** | unchanged |

**≠** Feature Inventory re-PASS · **≠** Matrix Recalc · **≠** Living score uplift · **≠** B-MEDIA CLOSED · **≠** Production GO.  
PCR: `PCR-20260727-TRACK-B-STAGING-REALITY-SIX-FIX` (OPEN · Staging Reality PENDING).
