# Cert #4 Safe Walkthrough · Owner Recording Checklist

**Program:** `TT_GOVERNANCE_CERT_04_SAFE_WALKTHROUGH`
**Baseline:** GovFreeze V2 · GORP-06 · RB-G-09
**Session:** `evidence/GO_ttg_cert/20260616T100918Z`

## 三角色（Safe / Treasury / Finance · ② only）

| # | 角色 | POL | GORP | 验证 |
|---|------|-----|------|------|
| 1 | **Safe Signer** | POL-03 | S-04 | multisig_n_of_m, no_solo_schedule |
| 2 | **Treasury Operator** | POL-01 | S-01, S-02, S-05 | dual_tl_matrix, schedule_execute_chain |
| 3 | **Finance Operator** | POL-02 | S-02, S-03, T-01 | no_timelock_key, no_admin_post_spend |

## Signoff

```bash
bash scripts/dev/record-cert4-safe-walkthrough-signoff.sh \
  --stamp 20260616T100918Z --signer "Sebastian Ward"

bash scripts/dev/complete-ttg-cert-step.sh --cert 4 --stamp 20260616T100918Z --signer "Sebastian Ward"
```
