# V9 · WAITING_ETA Repository & Documentation Deep Clean

**STATUS:** `ACTIVE` (ETA window only — **preempted** when Timelock `EXECUTABLE`)  
**Program:** `V9_WAITING_ETA_REPOSITORY_AND_DOCUMENTATION_DEEP_CLEAN`  
**`TT_PRODUCTION_GO`:** NO_GO  
**AUDIT_1_CANDIDATE_SHA:** `b19b85810c22677d243a82d06ebec8ebcb4d4b47` (Solidity binding unchanged; deploy runner excluded from diff gate)  
**Official PRODUCT pin:** OPS-v9 `3e356617…`  

---

## TravelTrust Truth (dual plane — hard split)

```text
A. PRODUCT / WEBSITE / CMS / ADMIN / UX / BUSINESS
   → Official Production OPS-v9 = sole Living PRODUCT SSOT
   → Git / Local / Staging mirror only — never reverse-master

B. WEB3 / CONTRACT / TOKEN / GOVERNANCE / MONEY PATH
   → Final Truth Baseline + V9 Freeze + Candidate b19b85810… + chain evidence
   → Official www Web3 may be old display = LEGACY / PENDING_UPDATE only
   → must NOT overwrite Candidate

C. After V9 Mainnet Reality
   → Mainnet becomes chain fact → then update Official www Web3
```

Constitution: [TT-TRAVELTRUST-DUAL-TRUTH-PLANES-LATEST](TT-TRAVELTRUST-DUAL-TRUTH-PLANES-LATEST.md) · `registry/traveltrust-dual-truth-planes.v1.yaml`

---

## Priority

| P | When | Action |
|---|------|--------|
| **P0** | `timelock_operation_state=EXECUTABLE` | **STOP** deep clean → `run-ttg-v9-periphery-governance-sepolia-reality.sh resume` |
| **P1** | `WAITING_ETA` | This program (inventory → safe delete → doc matrix) |

Probe: `bash scripts/dev/probe-ttg-v9-sepolia-timelock-reality-status.sh`  
Waiting runbook: [TT-TTG-V9-PERIPHERY-GOVERNANCE-SEPOLIA-REALITY-WAITING-ETA-LATEST](TT-TTG-V9-PERIPHERY-GOVERNANCE-SEPOLIA-REALITY-WAITING-ETA-LATEST.md)

---

## Phases C0–C12

| Phase | Content | Rule |
|-------|---------|------|
| **C0** | Safety freeze — HEAD, Candidate, Audit #1, Sepolia addresses, Timelock, READY_AT, worktrees | No delete Active Web3 assets |
| **C1** | Git branches — merged/superseded local only | Keep `main`, release branches, V9 active, tags |
| **C2** | Worktrees — abandoned only | Keep Official release worktree + active candidate |
| **C3** | Build junk — `target/`, `.next/`, coverage, Playwright tmp | Regenerable only |
| **C4** | Evidence scratch — `evidence/.tmp-*`, unreferenced failed probes | Never PASS_STOP / Owner auth / tx / Audit |
| **C5** | Local dirs — inventory before delete | No blind `rm -rf` |
| **C6** | Git hygiene — `.gitignore`, prune, `gc` last | Skip aggressive `gc` near ETA |
| **C7–C11** | Registry/SSOT, tech docs, whitepapers, github-official, link audit | PRODUCT=OPS-v9; WEB3=FTB+Candidate |
| **C12** | Clean freeze — atomic commit, STOP | `git status --porcelain=0` |

---

## Entry

```bash
# Inventory + doc matrix only (no deletes)
python scripts/dev/run-v9-waiting-eta-repository-documentation-deep-clean.py

# Apply safe deletes (evidence/.tmp-*)
bash scripts/dev/v9-waiting-eta-repository-documentation-deep-clean.sh --apply-safe-clean

# Also remove regenerable build caches (optional; slow)
bash scripts/dev/v9-waiting-eta-repository-documentation-deep-clean.sh --apply-safe-clean --apply-build-clean
```

---

## Pass metrics (target)

| Metric | Target |
|--------|--------|
| `REPOSITORY_HYGIENE` | PASS |
| `STALE_BRANCHES_WORKTREES` | 0 |
| `UNREFERENCED_SCRATCH` | 0 |
| `DOCUMENTATION_TRUTH_CONFLICTS` | 0 |
| `ACTIVE_POINTER_CONFLICTS` | 0 |
| `CANDIDATE_SOLIDITY_DIFF` | 0 |
| `WORKTREE` | CLEAN |
| `git status --porcelain` | 0 |

---

## Evidence outputs

| Artifact | Path |
|----------|------|
| C0 freeze | `evidence/GO_v9_waiting_eta_deep_clean/C0_SAFETY_FREEZE_LATEST.json` |
| Inventory | `evidence/GO_v9_waiting_eta_deep_clean/REPOSITORY_INVENTORY_LATEST.json` |
| Hygiene report | `evidence/GO_v9_waiting_eta_deep_clean/REPOSITORY_HYGIENE_REPORT_LATEST.json` |
| Documentation Truth Matrix | `evidence/GO_v9_waiting_eta_deep_clean/DOCUMENTATION_TRUTH_MATRIX_LATEST.json` |
| Residual report | `evidence/GO_v9_waiting_eta_deep_clean/RESIDUAL_REPORT_LATEST.json` |
| PASS_STOP | `evidence/GO_v9_waiting_eta_deep_clean/V9_WAITING_ETA_DEEP_CLEAN_PASS_STOP_LATEST.json` |

Machine registry: `registry/v9-waiting-eta-deep-clean.v1.yaml`

---

## Forbidden this program

- Production modify / deploy  
- Candidate Solidity modify (voids Audit #1)  
- Exact-Match / Mainnet broadcast  
- `TT_PRODUCTION_GO` flip  
- Delete PASS_STOP, Owner authorization, Audit/Reality chain evidence  
- Write Sepolia Candidate as Mainnet LIVE in whitepapers  

---

## Whitepaper labeling

| Label | Meaning |
|-------|---------|
| **LIVE** | Mainnet / Official chain fact today |
| **V9_TARGET** | Frozen design + Sepolia path — not Mainnet LIVE |
| **LEGACY** | Old stack / old www display |
| **SUPERSEDED** | Replaced by named successor |
| **HISTORICAL** | Archive reference only |

Sepolia deploy **≠** Mainnet 12h Timelock / FeeRouterV2 LIVE on mainnet.
