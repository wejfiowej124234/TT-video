# TT · TTG V9 Security Audit Ladder + Internal Audit Wave

**STATUS:** `②.5_INTERNAL_AUDIT_WAVE_ACTIVE` → remediation R1 applied · **NOT** external firm report · **NOT** Mainnet · **NOT** Production GO  
**Candidate:** [`V9_AUDIT_CANDIDATE_MANIFEST.json`](../../evidence/GO_ttg_v9_audit/V9_AUDIT_CANDIDATE_MANIFEST.json)  
**Sepolia parent:** `V9_REMINT_SEPOLIA_PASS_STOP`  
**Language:** Findings English

---

## Ladder (binding)

```text
① Local PASS
  → ② Sepolia PASS
  → ②.5 Security Audit / Mainnet Readiness   ← YOU ARE HERE
  → Remediation (Critical=0 · High=0 · Medium remediated|Owner-accepted)
  → Sepolia Regression PASS
  → ③ Mainnet (Owner written auth only)
```

**Hard gate before Mainnet:** `OPEN_CRITICAL=0` · `OPEN_HIGH=0` · Sepolia Regression PASS · Owner auth.  
**Do not** auto-broadcast Mainnet after audit.

---

## Audit package (Token Launch)

| Surface | Focus |
|---------|--------|
| TTG V9 Token | 25T · NO_MINT · Votes · protocolBurn · no hidden mint/seize |
| PublicSaleVault | 12.5T custody · pull · rescue≠TTG · UUPS · Timelock admin |
| Batch PM | caps · USDC 6dp math · windows · RETURN · overflow/rounding/reentrancy · pause |
| Governor V9 | threshold · quorum · snapshot · vote manipulation |
| Burn | Governor → Vote → Timelock → burn only; DAO 35% path |
| UUPS | takeover · initializer · storage · authorize |
| Privilege map | Owner/Guardian/Governor/Timelock/Vault/PM |
| Economic | sniping · whale · boundary · flash-loan voting · concentration |
| Deploy / Cutover | params · order · V8 LEGACY · Official pin same-day |
| Compiler / SBOM | solc 0.8.36 · via-IR · deps · reproducibility |
| Explorer | verify · proxy impl · Exact Match (Mainnet pack) |

**Methods required:** static + line-by-line + invariants/fuzz + privilege + economic + governance + deploy/cutover.  
**Not sufficient alone:** Slither-only.

---

## Freeze discipline

1. Freeze **V9_AUDIT_CANDIDATE** (sources + bytecode hashes + Sepolia stamp pointer).  
2. Internal Audit Wave against that candidate.  
3. Remediate → re-hash **R1** (or later Rn).  
4. External firm (optional next) must receive the **same** manifest bytes as deployed intent.  
5. **No core edits** after external kickoff without new candidate id.

Freeze tooling: `python scripts/dev/freeze-ttg-v9-audit-candidate.py`

---

## Internal Wave verdict (see FINDINGS)

| Severity | Open after R1 |
|----------|----------------|
| Critical / P0 | **0** |
| High / P1 | **0** |
| Medium | remediated or Owner-accept listed |
| Low / Info | backlog / Owner-accept |

Next: **Sepolia Regression** on R1 bytecode → then external firm optional → Mainnet auth.
