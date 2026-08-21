# V9 Staging Full Reality Regression · Local Unblock → Ready for Deploy Auth

**Wave:** `V9_STAGING_FULL_REALITY_REGRESSION`  
**Local media blocker:** **CLEARED** · `deploy-tt-web-staging.sh --check-only` **exit 0**  
**Staging deploy / Reality PASS:** **NOT STARTED**（须 Owner 再授权受控 deploy）  
**`TT_PRODUCTION_GO`:** NO_GO

## Release Artifact（唯一）

- Local PASS: `V9_PRE_PRODUCTION_LOCAL_FULL_CLEAN_PASS`
- Allowlist: `04f970580ed85727a547d66ff53bc650be8d4a86`
- Fingerprint pack: `V9_PRE_PRODUCTION_LOCAL_FINGERPRINT_PACK.json`
- Media SSOT converge: `V9_ROLE_PROMO_MEDIA_CHECKSUM_SSOT_CONVERGED`（独立原子 commit）
- Historical 37: **RECONCILIATION_ONLY** · 见 `HISTORICAL_37_FRONTEND_DIFF_RECONCILIATION_ONLY.json`

## Frontend mother truth（写死）

- OPS `3e356617…` real tree diff · shared-path `byte_diff=0`
- HEAD-only 14 · permanent `EXCLUDED_FROM_RELEASE`
- V9 P0+P1 · atomic allowlist manifest only
- **禁止**追溯/凑齐「37」

## Pre-state

`evidence/GO_ttg_v9_audit/V9_STAGING_FULL_REALITY_PRESTATE.json`

## Cleared blocker

Registry `traveltrust-role-promo-media-assets.v1.yaml` sha256/bytes 已与 `PROMO-MANIFEST.json` + 磁盘/LFS smudged MP4 三方对齐。

## Next

Owner 授权受控 `deploy-tt-web-staging.sh`（非 `--check-only`）→ 1:1 Reality Regression → 仅全 PASS 后盖 `V9_STAGING_FULL_REALITY_PASS`。

## Forbidden

Staging hotfix/SFTP/overlay · Production deploy · OPS/V9 UI·UX 母版改动 · Mainnet Phase2 · Production `/meta`/Indexer 切针 · `TT_PRODUCTION_GO` flip
