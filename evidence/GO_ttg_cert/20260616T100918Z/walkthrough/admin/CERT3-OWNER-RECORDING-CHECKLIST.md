# Cert #3 Admin Walkthrough · Owner Recording Checklist

**Program:** `TT_GOVERNANCE_CERT_03_ADMIN_WALKTHROUGH`
**RBAC baseline:** RBAC-GAP-LIST=0 · `20260616T142200Z`
**Session:** `evidence/GO_ttg_cert/20260616T100918Z`

## 五控制台角色（C1/C2 · ② only）

| # | 角色 | UAT | 路由 | 验证 |
|---|------|-----|------|------|
| 1 | **Admin (SuperAdmin)** | C1 | `/admin`, `/admin/approvals` | page_visibility, approvals_allow |
| 2 | **Finance** | C1 | `/admin/finance`, `/admin/fee-router` | finance_read_allow, approvals_deny |
| 3 | **Risk** | C2 | `/admin/community/reports`, `/admin/community/moderation/cases` | community_governance_allow, finance_deny |
| 4 | **Ops** | C1 | `/admin/onboarding`, `/admin/users` | onboarding_allow, approvals_deny |
| 5 | **Auditor** | C2 | `/admin/audit`, `/admin/audit/operations` | audit_readonly, community_moderate_deny |

## Signoff

```bash
bash scripts/dev/record-cert3-admin-walkthrough-signoff.sh \
  --stamp 20260616T100918Z --signer "Sebastian Ward"

bash scripts/dev/complete-ttg-cert-step.sh --cert 3 --stamp 20260616T100918Z --signer "Sebastian Ward"
```
