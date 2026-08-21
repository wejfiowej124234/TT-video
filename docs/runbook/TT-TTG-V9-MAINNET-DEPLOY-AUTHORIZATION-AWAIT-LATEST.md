# TT · TTG V9 — Mainnet Deploy Authorization Await


> **STATUS (Documentation Truth Convergence · 2026-08-21):** **SUPERSEDED as Official ACTIVE V9 path** · DO_NOT_USE for living V9 Design Lock / DL_R1 / Mainnet Phase1.  
> **Sole upstream now:** [`TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST`](TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST.md) · status `DEPLOYED_PENDING_CUTOVER` / `TIMELOCK_CUTOVER_PENDING` · **≠** `MAINNET_FULLY_ACTIVE` · **≠** `TT_PRODUCTION_GO`.  
> Historical evidence below is retained · R2_FINAL / Remint / Safe-Timelock / P4Cap-as-sale-sink / globalStakers ACTIVE claims are **LEGACY**.

**STATUS:** `MAINNET_BROADCAST_PAUSED` · **Governance Root Replacement ACTIVE** · **no broadcast**  
**Held stop:** **`V9_MAINNET_CUTOVER_AUTH_READY_STOP`** (do not mutate)  
**STATUS:** `SUPERSEDED_AS_ACTIVE_AUTH_TEMPLATE` · living auth must name `V9_AUDIT_CANDIDATE_DESIGN_LOCK` + NEW Solo Timelock / NEW Project Pool (no Safe admin)

**Historical frozen (do not edit):** `V9_AUDIT_CANDIDATE_R2_FINAL` · `V9_PRE_MAINNET_SECURITY_PASS` · Cutover STOP stamp  
**This turn:** **no** Ethereum Mainnet broadcast · **no** `TT_PRODUCTION_GO` flip

---

## Binding rule

```text
V9_MAINNET_CUTOVER_AUTH_READY_STOP
  → ONLY after Owner issues independent written
       MAINNET DEPLOY AUTHORIZATION
  → execute audited frozen deploy order on Ethereum Mainnet (chain_id=1)
  → per-tx verify: chain · address · receipt · bytecode · wiring
       any mismatch ⇒ IMMEDIATE STOP
  → success = V9 Web3 Mainnet Deployment complete ONLY
  → TT_PRODUCTION_GO remains independent Owner decision (never auto)
```

Cutover STOP / security PASS / R2_FINAL **are not** deploy authorization. Agent must not infer auth from this await doc, chat history, or prior stamps.

---

## Required authorization instrument

Owner written **`MAINNET DEPLOY AUTHORIZATION`** must be **independent** of Cutover review and must explicitly name at least:

| Field | Required |
|-------|----------|
| Instrument title | `MAINNET DEPLOY AUTHORIZATION` |
| Candidate | `V9_AUDIT_CANDIDATE_R2_FINAL` + manifest SHA `sha256:59c81dbe55beeaeddae8bbd16b1a7e4f63549fa3b30d012e0387abd06887f92b` |
| Network | Ethereum Mainnet `chain_id=1` only |
| Entry | `TtgV9AtomicDeployerMainnet` only (LOCAL AtomicDeployer forbidden) |
| Scope | V9 Web3 Mainnet Deployment (Token / Vault / PM / Governor wiring to KEEP Timelock · P4Cap · USDC · Norm ops) |
| Explicit non-scope | Does **not** authorize `TT_PRODUCTION_GO` |

Until that instrument exists in-session as Owner written text (or Owner-designated evidence path), **broadcast remains FORBIDDEN**.

---

## Post-auth execution (frozen order only)

Use Norm G7 / Cutover review deploy order. Do not invent alternate topology.

1. Re-confirm Exact Match vs R2_FINAL manifest (sources + bytecode). Drift ⇒ **STOP** (no broadcast).  
2. Broadcast Official factory / topology txs with constructor args = Mainnet USDC · KEEP Timelock · KEEP P4Cap · Norm Team/Marketing/Treasury · Owner-bound Guardian · Governor floors ≥ MAINNET.  
3. After each tx: verify **chain_id=1** · expected **addresses** · **receipt status=1** · **deployed bytecode** Exact Match to audited artifact · **wiring** (Vault admin / PM timelock / USDC sink / token genesis buckets). Mismatch ⇒ **STOP** (no continue).  
4. Timelock schedule/execute: allow-list · `bindMarket` · `seedBatchesFromNorm` · `setGovernor` — same per-step verify / STOP.  
5. On full success: stamp **V9 Web3 Mainnet Deployment** evidence only.  
6. **Do not** set or imply `TT_PRODUCTION_GO`.

---

## Honest completion boundary

| Claim | Allowed after successful auth-bound deploy? |
|-------|-----------------------------------------------|
| V9 Web3 Mainnet Deployment complete | Yes (with evidence) |
| Official V9 buy live / Production GO | **No** unless separate Owner GO |
| Auto `TT_PRODUCTION_GO` | **Forbidden** |

Companions: [Owner Gate](TT-TTG-V9-OWNER-MAINNET-GATE-LATEST.md) · [Cutover Final Review](TT-TTG-V9-OWNER-MAINNET-CUTOVER-FINAL-REVIEW-LATEST.md) · [Norm G1–G7](TT-TTG-V9-REMINT-FINAL-NORM-G1-G7-LATEST.md)

---

## 中文要点

- **保持** `V9_MAINNET_CUTOVER_AUTH_READY_STOP`；**不改**任何冻结内容。  
- **仅当** Owner 明确签发独立 **`MAINNET DEPLOY AUTHORIZATION`** 后，才按已审计冻结顺序在 Ethereum Mainnet 广播。  
- **逐笔**核验 chain / address / receipt / bytecode / wiring；任一步不一致 **立即 STOP**。  
- 部署完成 = **V9 Web3 Mainnet Deployment** 完成；**不得**自动翻转 `TT_PRODUCTION_GO`。


---

## Execution halt (this session)

Owner **MAINNET DEPLOY AUTHORIZATION** is recorded at  
`evidence/GO_ttg_v9_audit/V9_OWNER_MAINNET_DEPLOY_AUTHORIZATION_RECORDED.json`.

**STOP before broadcast:** Norm Team / Marketing / Treasury are frozen; **Guardian** is auth-time bind and was **not** named in the authorization text and is **not** in local deploy env. Inventing Guardian would violate “禁止临场改参数”.

**Resume condition:** Owner writes one line, e.g.  
`TTG_V9_GUARDIAN=<0x…>` (non-zero · must not equal KEEP Timelock if ops prefer separation; Safe-as-Guardian allowed only if Owner explicitly pins it).

Then Agent may broadcast Exact-Match `TtgV9AtomicDeployerMainnet` on `chain_id=1` and proceed Timelock wiring payloads — still **no** `TT_PRODUCTION_GO`.


---

## Safe deprecation pause

Owner deprecated Safe `0x9649…40e7`. See [Safe Deprecation Full Privilege Reaudit](TT-TTG-V9-SAFE-DEPRECATION-FULL-PRIVILEGE-REAUDIT-LATEST.md).

- Prior Mainnet deploy authorization = **paused**
- KEEP Timelock Safe-admin = **immutable** → Timelock **`REDEPLOY_REQUIRED`** for Safe-exit Official topology
- Target: Marketing = deploy-only · Treasury = pause-only Guardian
- Gates before any broadcast: new topology · Forge · Sepolia · Cutover recheck · new Owner auth
- `TT_PRODUCTION_GO` unchanged


---

## Governance Root Replacement (Owner)

See [Governance Root Replacement](TT-TTG-V9-GOVERNANCE-ROOT-REPLACEMENT-LATEST.md).

- New Timelock (no Safe) · Marketing = Solo Owner/deploy · Treasury = pause-only Guardian
- KEEP Money Path: **KEEP_AND_REWIRE** (P4Cap / EF / SR / FeeRouter); old Timelock **REDEPLOY_REQUIRED→LEGACY**
- FeeRouter Safe buckets need Owner pin before Mainnet rewire
- Ladder: Forge → Sepolia → topology final → new Cutover → **new** Mainnet auth
