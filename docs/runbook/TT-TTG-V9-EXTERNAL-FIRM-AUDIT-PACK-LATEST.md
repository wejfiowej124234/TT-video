# TT · TTG V9 External Firm Audit Pack (R2_FINAL · **SUPERSEDED**)


> **STATUS (Documentation Truth Convergence · 2026-08-21):** **SUPERSEDED as Official ACTIVE V9 path** · DO_NOT_USE for living V9 Design Lock / DL_R1 / Mainnet Phase1.  
> **Sole upstream now:** [`TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST`](TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST.md) · status `DEPLOYED_PENDING_CUTOVER` / `TIMELOCK_CUTOVER_PENDING` · **≠** `MAINNET_FULLY_ACTIVE` · **≠** `TT_PRODUCTION_GO`.  
> Historical evidence below is retained · R2_FINAL / Remint / Safe-Timelock / P4Cap-as-sale-sink / globalStakers ACTIVE claims are **LEGACY**.

**STATUS:** `SUPERSEDED_AS_ACTIVE_FIRM_PACK` · firm pack MUST target `V9_AUDIT_CANDIDATE_DESIGN_LOCK` only · R2 pack = DO_NOT_USE for Official Mainnet claim

# Historical title: External Firm Audit Pack (R2_FINAL · LOCKED)

**STATUS:** `OPTIONAL_PACK_LOCKED` · **not** a V9 Mainnet hard gate  
**Honest:** Using or completing this pack does **not** make AI/internal PASS “等同于第三方审计”. Owner may deploy after internal threshold without firm.

---

## Pins (must appear in firm report cover)

| Pin | Value |
|-----|--------|
| Candidate ID | `V9_AUDIT_CANDIDATE_R2_FINAL` |
| Manifest | `evidence/GO_ttg_v9_audit/V9_AUDIT_CANDIDATE_R2_FINAL_MANIFEST.json` |
| Manifest SHA-256 | `sha256:59c81dbe55beeaeddae8bbd16b1a7e4f63549fa3b30d012e0387abd06887f92b` |
| Pack content lock | see `package_content_lock_sha256` in lock JSON |
| Compiler | solc **0.8.36** · `FOUNDRY_PROFILE=ttg_v9` · via-IR · optimizer 200 · paris |

**Integrity:** pack generator asserts **Exact Match** of on-disk sources + forge bytecode vs R2_FINAL manifest before lock.

---

## What to send the firm

1. Lock JSON + R2_FINAL manifest  
2. Exact Source tree under `contracts/src/ttg-v9/` (hashes in manifest; **exclude** relying on mocks as Mainnet bytecode)  
3. Exact Bytecode artifacts under `contracts/out-ttg-v9/` (hashes in manifest)  
4. AI stamps: Reg #2 · Full Topology PASS · Mainnet Ready STOP  
5. Findings: Audit #1 / #2 / #3 + Topology + Monetary Invariant + G1–G7 Norm + Owner Gate  

**Scope (binding):**

| Class | In scope |
|-------|----------|
| **NEW** deep | Token · Governor · Vault · Batch PM · UUPS · Proxy · Topology · AtomicDeployer · AtomicDeployerMainnet |
| **KEEP** Reality + Integration + Privilege | Timelock · P4Cap · EscrowFactory · Settlement · FeeRouter · Safe/Guardian |
| Call-chains | USDC→PM→P4Cap · Vault→PM→TTG · Gov→Timelock→Burn · Timelock→UUPS · Escrow→Settlement→Fee |
| V8 | **Isolation only** (not full V8 re-audit) |
| USDC | Interface / decimals / transfer assumptions — **not** USDC source |

---

## Sequence (optional firm only)

```text
[Optional] Firm on locked pack
  → does NOT gate Owner Mainnet if Owner accepts internal threshold
Internal: V9_PRE_MAINNET_SECURITY_PASS
  → Owner Cutover final review
  → Independent Owner written auth
  → Mainnet deploy
  → TT_PRODUCTION_GO independent
```

| Event | Effect |
|-------|--------|
| Firm finds Critical/High · core fix needed | **Stop** · new candidate · diff audit · regression · **new** firm pack — R2_FINAL + this pack **void** for Mainnet claim |
| Firm PASS | **Does not** authorize Mainnet or Production GO |
| Owner Cutover FAIL | **No** broadcast |
| No Owner written auth | **No** broadcast · **no** GO |

---

## 中文要点

- 本包**可选**；**不是** V9 Mainnet 硬门槛。  
- 内部 AI PASS **不等于**第三方事务所审计。  
- 部署门槛：`V9_PRE_MAINNET_SECURITY_PASS` → Owner Cutover → Owner 独立书面授权；Production GO 仍独立。  
- 未经 Owner 独立书面授权：禁止 Mainnet 广播、禁止 Production GO。
