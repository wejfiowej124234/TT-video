# V311 · Post-Execute Ladder Dry Run（Execute → Governance CLOSED）

**Machine:** `TT_V311_POST_EXECUTE_LADDER_DRY_RUN`  
**Recorded:** `2026-07-19T09:06:45Z`  
**Verdict:** **`DRY_RUN_FAIL`**  
**ETA:** `2026-07-20T11:37:37Z`  
**Discipline:** FROZEN_WAITING_EXECUTE · no protocol/ACTIVE/Runtime/Registry/Package mutate · no broadcast in dry-run

## Continuous playbook (ETA 后照抄 · 禁止现场决策)

- 1. After 2026-07-20T11:37:37Z: python scripts/dev/stamp-v311-f02-execute-monitor-heartbeat.py → execute_allowed_now=true
- 2. S1: TRAVELTRUST_V311_FUNCTION_CERT_BROADCAST_OK=1 bash scripts/dev/run-v311-function-cert-tier-c-item.sh F-02-gov-timelock → state=7
- 3. S2: bash scripts/dev/run-v311-web3-full-function-cert.sh → 54/0/0
- 4. S4: WC + activate Sepolia → L5 + Playwright → stamp-v311-ui-ux-full-cert-aggregate.py → PASS → restore Anvil
- 5. S3: stamp-v311-product-cert-aggregate.py → PASS (consumes Function+UI final evidence; UI PASS required)
- 6. S5: stamp-v311-governance-rc-close.py → CLOSED + DEFERRED Money-Path
- 7. AFTER S5 only (LOCK-B): Money-Path OPT-A → Re-Audit → Constitution → 六域汇聚 → Freeze → Sign-off → Production GO

## Decision table

| Situation | Action |
|-----------|--------|
| `before_eta` | Monitor only · refuse Execute |
| `eta_reached_state_5` | Owner sets BROADCAST_OK=1 · run F-02 tier-c · expect state 7 |
| `execute_pass` | Immediately S2 Function full cert — no waiting for redesign |
| `function_not_54` | STOP · no Product PASS claim |
| `product_fail` | STOP · no UI Full claim as Governance close gate |
| `ui_partial` | STOP · no Governance CLOSED |
| `all_pass` | Stamp Governance CLOSED with DEFERRED money-path · then Money-Path RC only |
| **never** | skip to Money-Path while Governance OPEN; claim TT_WEB3_FULL_CONSTITUTION_CONSISTENCY=PASS; mutate ACTIVE/Registry/Package during ladder; treat Expired(state=6) as Executed |

## Steps (spec)

### S0_PREFLIGHT · Preflight (now · frozen)

**Live commands:**
```bash
python scripts/dev/stamp-v311-f02-execute-monitor-heartbeat.py
python scripts/dev/run-v311-full-system-drift-audit.py
python scripts/dev/run-psg-v311-production-gap-audit.py
```

- **Evidence:** evidence/GO_v311_constitution_production_alignment_audit/F02-EXECUTE-MONITOR-HEARTBEAT-LATEST.json, evidence/GO_phase2_v311_final_release/FULL-SYSTEM-DRIFT-AUDIT-LATEST.json
- **Gate update:** none (monitor only)
- **PASS:** proposal_1.state==5 Queued · before_eta · drift PASS
- **On fail:** `"STOP · do not Execute · re-run heartbeat"`
- **Rollback:** —
- **Rollback state:** `—`

### S1_EXECUTE · F-02 Execute Proposal #1

**Live commands:**
```bash
# ONLY after ETA 2026-07-20T11:37:37Z and Owner authorization
export TRAVELTRUST_V311_FUNCTION_CERT_BROADCAST_OK=1
bash scripts/dev/run-v311-function-cert-tier-c-item.sh F-02-gov-timelock
```

**Execute 后立即检查:**

- `cast call $GOVERNOR 'state(uint256)(uint8)' 1  → expect 7 Executed`
- `jq -r '.status,.phase,.final_state_int,.execute_tx' tier_c_state/F-02-gov-timelock.json`
- `python scripts/dev/stamp-v311-f02-execute-monitor-heartbeat.py  → execute_done=true`

- **Evidence:** evidence/GO_phase2_v311_web3_full_function_cert/tier_c_state/F-02-gov-timelock.json, evidence/GO_v311_constitution_production_alignment_audit/F02-EXECUTE-MONITOR-HEARTBEAT-LATEST.json
- **Gate update:** GOV-02 → CLOSED when state==7 Executed · execute_tx present
- **PASS:** status=PASS · phase=executed · final_state_int=7 (OZ: Executed≠6 Expired)
- **On fail:** `{"state_still_5": "Re-check ETA/clock · retry execute once · do not re-propose", "state_6_expired": "FAIL · open new Governance path · STOP ladder", "broadcast_refused": "Set TRAVELTRUST_V311_FUNCTION_CERT_BROADCAST_OK=1 (Owner)", "tx_revert": "Capture cast receipt · STOP · do not advance Function claim"}`
- **Rollback:** Remain Queued(5) or record FAIL · do not start S2
- **Rollback state:** `FROZEN_WAITING_EXECUTE or POST_EXECUTE_FAILED`

### S2_FUNCTION · Function Cert → 54/0/0

**Live commands:**
```bash
export TRAVELTRUST_V311_FUNCTION_CERT_BROADCAST_OK=1  # only if residual Tier C still need txs
bash scripts/dev/run-v311-web3-full-function-cert.sh
bash scripts/gates/check-v311-web3-full-function-cert.sh
```

**Execute 后立即检查:**

- `jq '.verdict,.counts' evidence/GO_phase2_v311_web3_full_function_cert/VERDICT-LATEST.json`
- `bash scripts/gates/check-v311-web3-full-function-cert.sh  → exit 0`

- **Evidence:** evidence/GO_phase2_v311_web3_full_function_cert/VERDICT-LATEST.json, evidence/GO_phase2_v311_web3_full_function_cert/tier_c_state/*.json
- **Gate update:** TT_V311_WEB3_FULL_FUNCTION_CERT → PASS · G-RC-02 · CERT-01 CLOSED
- **PASS:** verdict PASS ∧ counts PASS=54 FAIL=0 OWNER_REQUIRED=0
- **On fail:** `"STOP · do not start S4/S3 PASS · fix OWNER_REQUIRED via tier-c-item.sh one-by-one"`
- **Rollback:** Stay at POST_EXECUTE_FUNCTION_IN_PROGRESS · keep F-02 PASS
- **Rollback state:** `S1_DONE · S2_IN_PROGRESS`

### S4_UI_FULL · UI Full Cert · BEFORE Product PASS (LOCK-1)

**Live commands:**
```bash
python scripts/dev/prepare-gap-pr02-sepolia-frontend-env.py
bash scripts/dev/set-walletconnect-project-id.sh '<32-hex>'  # if KEY_ABSENT
node scripts/dev/probe-walletconnect-project-id.cjs
bash scripts/dev/activate-frontend-sepolia-env.sh
bash scripts/gates/five-main-routes-ui-antiregression-gate.sh
bash scripts/dev/run-web3-itinerary-l5-green.sh
bash scripts/dev/smoke-wallet-connection-l5-local.sh
# Owner: Playwright real wallet + real Sepolia tx
python scripts/dev/stamp-v311-ui-ux-full-cert-aggregate.py
bash scripts/dev/restore-frontend-anvil-env.sh
```

**Execute 后立即检查:**

- `node scripts/dev/probe-walletconnect-project-id.cjs  → KEY_PRESENT`
- `jq '.status,.gates' evidence/GO_phase2_v311_final_release/P5-UI-UX-CERT-LATEST.json`

- **Evidence:** evidence/GO_phase2_v311_final_release/P5-UI-UX-CERT-LATEST.json, evidence/GO_psg_v311_production_gap_audit/GAP-PR02-SEPOLIA-FRONTEND-ENV-LATEST.json, evidence/GO_phase2_staging_reality/OA-01/WC-PROJECT-ID-PROBE-LATEST.json
- **Gate update:** TT_V311_WEB3_UI_UX_FULL_CERT → PASS · playwright=PASS · CERT-03 / G-RC-04
- **PASS:** status=PASS · all hard gates PASS including playwright
- **On fail:** `{"l5_fail": "restore Anvil · fix · re-activate Sepolia · re-run greens", "wc_absent": "Inject WC · probe KEY_PRESENT · do not claim UI Full", "playwright_fail": "Keep L5 PASS · leave PARTIAL · FORBID S3 PASS · FORBID S5"}`
- **Rollback:** bash scripts/dev/restore-frontend-anvil-env.sh
- **Rollback state:** `S2_DONE · S4_PARTIAL · S3_PASS_FORBIDDEN`

### S3_PRODUCT · Product Full Cert · AFTER UI Full PASS (LOCK-1)

**Live commands:**
```bash
python scripts/dev/run-v311-owner-config-env-and-package-preflight.py
python scripts/dev/stamp-v311-product-cert-aggregate.py
```

**Execute 后立即检查:**

- `jq '.status' evidence/GO_phase2_v311_final_release/P5-UI-UX-CERT-LATEST.json  → PASS`
- `jq '.status,.aggregate' evidence/GO_phase2_v311_final_release/P6-PRODUCT-CERT-LATEST.json`

- **Evidence:** evidence/GO_phase2_v311_final_release/P6-PRODUCT-CERT-LATEST.json, evidence/GO_phase2_v311_final_release/P2.5-DATA-CERT-LATEST.json, evidence/GO_phase2_v311_final_release/P5-UI-UX-CERT-LATEST.json
- **Gate update:** TT_V311_WEB3_FULL_PRODUCT_CERT → PASS · G-RC-03 · CERT-02 CLOSED
- **PASS:** status=PASS · function_54_0_0 · ui_ux_cert PASS · data_cert PASS
- **On fail:** `"STOP · UI not PASS → refuse Product PASS · return S4 · do not S5"`
- **Rollback:** Keep Function+UI work · re-aggregate Product only after UI PASS
- **Rollback state:** `S4_DONE_REQUIRED · S3_OPEN`

### S5_GOVERNANCE_CLOSED · Governance RC CLOSED

**Live commands:**
```bash
python scripts/dev/stamp-v311-ui-ux-full-cert-aggregate.py  # confirm PASS
python scripts/dev/stamp-v311-product-cert-aggregate.py  # confirm PASS
python scripts/dev/stamp-v311-governance-rc-close.py
python scripts/dev/run-web3-full-constitution-consistency-matrix.py
python scripts/dev/run-psg-v311-production-gap-audit.py
```

**Execute 后立即检查:**

- `jq '.mode,.deferred_to_money_path_rc' DUAL-RC-TRACK-BOARD-LATEST.json  → GOVERNANCE_RC_CLOSED`
- `jq '.status' GOVERNANCE-RC-CLOSE-LATEST.json  → CLOSED`

- **Evidence:** evidence/GO_v311_constitution_production_alignment_audit/GOVERNANCE-RC-CLOSE-LATEST.json, evidence/GO_v311_constitution_production_alignment_audit/DUAL-RC-TRACK-BOARD-LATEST.json
- **Gate update:** mode → GOVERNANCE_RC_CLOSED · G-RC-05 · DEFERRED=[TRE-02,REG-01,REG-04]
- **PASS:** Function 54/0/0 ∧ UI Full PASS ∧ Product PASS ∧ money-path NOT falsely CLOSED
- **On fail:** `"script exits 3 REFUSE · do not start Money-Path · do not claim consistency PASS"`
- **Rollback:** Remain FROZEN_WAITING_EXECUTE or POST_EXECUTE_IN_PROGRESS
- **Rollback state:** `prior failed step (see close script rollback_to)`

## This dry-run rehearsal

| Step | Result |
|------|--------|
| S0_PREFLIGHT | `FAIL` |
| S1_EXECUTE | `PASS_GUARD` |
| S2_FUNCTION | `EXPECTED_NOT_PASS_YET` |
| S4_UI_FULL | `ENV_PREPARED_PARTIAL_EXPECTED` |
| S3_PRODUCT | `PASS_AGGREGATE_OPEN_EXPECTED` |
| S5_GOVERNANCE_CLOSED | `PASS_REFUSE_EXPECTED` |

**GAP-PR-02:** `PREPARED_AWAITING_OWNER_WC_INJECT`  
**P0.5:** `PASS_OWNER_ACTIONS_FOR_UI_FULL`  
**Broadcast refuse guard:** `True`  

Evidence: `evidence/GO_psg_v311_production_gap_audit/POST-EXECUTE-LADDER-DRY-RUN-LATEST.json`
