# Cert #2 Multi Identity · Owner Recording Checklist

**Program:** `TT_GOVERNANCE_CERT_02_MULTI_IDENTITY_WALKTHROUGH`
**MTM SSOT:** 146 rows · Cert #2 IDs=11
**Session:** `evidence/GO_ttg_cert/20260616T100918Z`

## 六角色录屏（须 Owner 真人 · ② only）

| # | 角色 | UAT | 路由 | 截图 | MTM |
|---|------|-----|------|------|-----|
| 1 | **Traveler** | B1 | `/me/identities`, `/community` | `screenshots/role-traveler-hub.png` | CHK-ID-01, CHK-CORE-02 |
| 2 | **Investor** | B4 | `/governance/distribution-accruals`, `/governance/distribution-claim` | `screenshots/role-investor-governance-read.png` | CHK-ID-02, CHK-CORE-23 |
| 3 | **Steward / Region** | B2 | `/governance?view=region`, `/me/identities/region-steward/settings` | `screenshots/role-steward-region-workbench.png` | CHK-ID-03, CHK-FE-12 |
| 4 | **Guide** | B3 | `/me/identities/guide/settings`, `/guide` | `screenshots/role-guide-settings.png` | CHK-ID-04, CHK-FE-15 |
| 5 | **Merchant** | B3 | `/me/identities/merchant/settings`, `/provider` | `screenshots/role-merchant-settings.png` | CHK-ID-05, CHK-FE-15 |
| 6 | **Admin** | B4 | `/admin`, `/admin/users` | `screenshots/role-admin-governance-readonly.png` | CHK-ID-06, CHK-ID-07 |

## 录屏落盘

- `walkthrough/multi-identity/recordings/B1-hub-traveler.mp4`（示例名）
- `walkthrough/multi-identity/recordings/B2-steward-region.mp4`
- `walkthrough/multi-identity/recordings/B3-guide-merchant-isolation.mp4`
- `walkthrough/multi-identity/recordings/B4-investor-admin-boundaries.mp4`

## Signoff（录屏完成后）

```bash
bash scripts/dev/record-cert2-multi-identity-walkthrough-signoff.sh \
  --stamp 20260616T100918Z --signer "Sebastian Ward"

bash scripts/dev/complete-ttg-cert-step.sh --cert 2 --stamp 20260616T100918Z --signer "Sebastian Ward"
```

**禁止：** 新增功能 · GovFreeze 复审计 · 扩展 docs/spec
