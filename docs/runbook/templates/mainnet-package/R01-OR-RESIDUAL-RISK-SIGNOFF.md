# R-01 Third-Party Audit **or** Owner Residual-Risk Signoff
#
# Gate axis AXIS-08 accepts **either** evidence JSON under:
#   evidence/GO_production_readiness/mainnet-cutover-hard-gate/
#
#   A) R01-THIRD-PARTY-AUDIT-PASS.json
#   B) OWNER-RESIDUAL-RISK-SIGNOFF.json
#
# This Markdown is the human template. Machine gate reads **JSON only**.

---

## Path A — Third-party audit PASS

Create `R01-THIRD-PARTY-AUDIT-PASS.json`:

```json
{
  "schema": "traveltrust.r01_third_party_audit.v1",
  "verdict": "PASS",
  "auditor": "FIRM_NAME",
  "report_id": "…",
  "report_uri_or_path": "evidence/…",
  "scope": ["EscrowV2", "EscrowFactoryV2", "FeeRouter", "Timelock", "Governor"],
  "p0_findings_open": 0,
  "signed_utc": "YYYY-MM-DDTHH:MM:SSZ",
  "chain_target": 1
}
```

---

## Path B — Owner residual-risk formal accept

Use only when audit is deferred and Owner accepts residual risk **in writing**.  
Create `OWNER-RESIDUAL-RISK-SIGNOFF.json`:

```json
{
  "schema": "traveltrust.owner_residual_risk_signoff.v1",
  "verdict": "OWNER_RESIDUAL_ACCEPTED",
  "owner_signed": true,
  "owner_name": "Sebastian Ward",
  "signed_utc": "YYYY-MM-DDTHH:MM:SSZ",
  "chain_target": 1,
  "residual_risks": [
    {
      "id": "RR-001",
      "title": "…",
      "severity": "Non-blocking",
      "mitigation": "…",
      "accept": true
    }
  ],
  "blocking_risks_accepted": false,
  "note": "Blocking Risk must be FIX — must not appear here as accept"
}
```

**Hard rule:** Blocking Risk (fund loss / auth bypass) **cannot** be accepted via Path B — must FIX.

---

## Related

- `registry/mainnet-cutover-hard-gate.v1.yaml` AXIS-08  
- `docs/runbook/TT-MAINNET-CUTOVER-HARD-GATE-LATEST.md`  
- Alignment policy: Blocking Risk = FIX · Expected Difference = CONFIRM_DESIGN
