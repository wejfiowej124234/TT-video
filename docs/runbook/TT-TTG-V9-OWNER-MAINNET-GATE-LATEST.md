# TT · TTG V9 — Owner Mainnet Gate (Internal threshold · Firm optional)


> **STATUS (Documentation Truth Convergence · 2026-08-21):** **SUPERSEDED as Official ACTIVE V9 path** · DO_NOT_USE for living V9 Design Lock / DL_R1 / Mainnet Phase1.  
> **Sole upstream now:** [`TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST`](TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST.md) · status `DEPLOYED_PENDING_CUTOVER` / `TIMELOCK_CUTOVER_PENDING` · **≠** `MAINNET_FULLY_ACTIVE` · **≠** `TT_PRODUCTION_GO`.  
> Historical evidence below is retained · R2_FINAL / Remint / Safe-Timelock / P4Cap-as-sale-sink / globalStakers ACTIVE claims are **LEGACY**.

**STATUS:** `SUPERSEDED_AS_ACTIVE_AUDIT_BASELINE` · living Official V9 = `V9_AUDIT_CANDIDATE_DESIGN_LOCK` · **DO_NOT_USE** R2_FINAL / KEEP Safe-Timelock for Design Lock cutover

> **Historical note (frozen body below):** previously `OWNER_GATE_ACTIVE` on R2_FINAL. R2 PASS does **not** inherit. Next = Design Lock 3× AI audits → new Mainnet Cutover Review. · Candidate **`V9_AUDIT_CANDIDATE_R2_FINAL` FROZEN**  
**Internal threshold:** AI ladder + Topology + **`V9_PRE_MAINNET_SECURITY_PASS`**  
**Honest:** Internal / AI security PASS **≠** third-party firm attestation  
**Forbidden:** edit R2_FINAL · auto Mainnet broadcast · auto `TT_PRODUCTION_GO`

---

## Frozen baseline

| Field | Value |
|-------|--------|
| Candidate | **`V9_AUDIT_CANDIDATE_R2_FINAL`** |
| Manifest | `evidence/GO_ttg_v9_audit/V9_AUDIT_CANDIDATE_R2_FINAL_MANIFEST.json` |
| Manifest SHA-256 | `sha256:59c81dbe55beeaeddae8bbd16b1a7e4f63549fa3b30d012e0387abd06887f92b` |
| R1_FINAL | **VOID** |

---

## Release hard gates (binding)

External firm is **not** a hard gate.

```text
R2_FINAL frozen
  + Reg #2 PASS
  + Full Topology PASS
  + OPEN_C/H = 0 (AI ladder)
  + V9_PRE_MAINNET_SECURITY_PASS (final attacker + config Exact Match)
  → Owner Mainnet Cutover final review
  → Independent Owner written auth
  → Mainnet deploy
  → TT_PRODUCTION_GO = separate Owner decision (never auto)
```

Optional firm may still run on the locked pack for comfort — **must not** be described as required for V9 Mainnet, and internal PASS must **not** be marketed as “等同于第三方审计”.

---

## Owner Mainnet Cutover final review

| # | Check | Gate |
|---|--------|------|
| 1 | Workspace vs R2_FINAL manifest Exact Match | FAIL ⇒ stop |
| 2 | Deploy **`TtgV9AtomicDeployerMainnet` only** | |
| 3 | Mainnet USDC · KEEP Timelock · KEEP P4Cap · Norm Guardian/ops | |
| 4 | Governor windows ≥ MAINNET floors | factory-enforced |
| 5 | Cast KEEP `delay() == 172800` | |
| 6 | Timelock allow-list · `bindMarket` · `seedBatchesFromNorm` · `setGovernor` | no Mock bootstrap |
| 7 | On-chain MAX_SUPPLY · 50/35/3/5/7 · admin/timelock/sink · proxy impl | |
| 8 | V8 LEGACY on Official surfaces | |
| 9 | Independent Owner written Mainnet auth | **required** |
| 10 | `TT_PRODUCTION_GO` | **independent** · not auto |

---

## Closed stamps

| Stamp | Path |
|-------|------|
| Reg #2 | `evidence/GO_ttg_v9_audit/V9_SEPOLIA_REGRESSION2_PASS.json` |
| Topology | `evidence/GO_ttg_v9_audit/V9_OFFICIAL_FULL_CONTRACT_TOPOLOGY_AUDIT_PASS.json` |
| Mainnet Ready STOP | `evidence/GO_ttg_v9_audit/V9_MAINNET_READY_STOP.json` |
| Pre-Mainnet Security | `evidence/GO_ttg_v9_audit/V9_PRE_MAINNET_SECURITY_PASS.json` (**permanently frozen**) |
| **Cutover Auth Ready STOP** | `evidence/GO_ttg_v9_audit/V9_MAINNET_CUTOVER_AUTH_READY_STOP.json` · review [Cutover Final Review](TT-TTG-V9-OWNER-MAINNET-CUTOVER-FINAL-REVIEW-LATEST.md) |
| Optional firm pack | `evidence/GO_ttg_v9_audit/V9_EXTERNAL_FIRM_AUDIT_PACK_R2_FINAL.json` (**not** hard gate) |

**Current stop (override):** `MAINNET_BROADCAST_PAUSED` · [Governance Root Replacement](TT-TTG-V9-GOVERNANCE-ROOT-REPLACEMENT-LATEST.md) ACTIVE · [Pre-Audit Alignment](TT-TTG-V9-PRE-AUDIT-ALIGNMENT-REGISTER-LATEST.md) · **old Cutover PASS (KEEP Safe-Timelock) SUPERSEDED for Official ACTIVE path** · no 3× audit until Owner Option I/II + Guardian pin.

**Previous stop:** `V9_MAINNET_CUTOVER_AUTH_READY_STOP` — **held**. Do not mutate frozen stamps/candidate. Do not broadcast.

**Await instrument:** independent Owner written **`MAINNET DEPLOY AUTHORIZATION`** (Cutover STOP ≠ deploy auth). Procedure: [Mainnet Deploy Authorization Await](TT-TTG-V9-MAINNET-DEPLOY-AUTHORIZATION-AWAIT-LATEST.md).

After auth only: frozen deploy order · per-tx chain/address/receipt/bytecode/wiring · mismatch ⇒ STOP · success = **V9 Web3 Mainnet Deployment** only · **never** auto-flip `TT_PRODUCTION_GO`.

Companions: [Deploy Auth Await](TT-TTG-V9-MAINNET-DEPLOY-AUTHORIZATION-AWAIT-LATEST.md) · [Cutover Final Review](TT-TTG-V9-OWNER-MAINNET-CUTOVER-FINAL-REVIEW-LATEST.md) · [Final Security Audit](TT-TTG-V9-PRE-MAINNET-FINAL-SECURITY-AUDIT-LATEST.md) · [Ladder](TT-TTG-V9-SECURITY-AUDIT-LADDER-LATEST.md) · [Firm pack (optional)](TT-TTG-V9-EXTERNAL-FIRM-AUDIT-PACK-LATEST.md)

---

## 中文要点

- **硬门槛** = 内部 AI 安全审计达到 Mainnet 部署门槛后，**由 Owner 决定**是否部署。  
- **不等于**第三方事务所审计；外审可选，非发布硬门槛。  
- **R2_FINAL** + **`V9_PRE_MAINNET_SECURITY_PASS`** + **`V9_MAINNET_CUTOVER_AUTH_READY_STOP` 保持冻结/持有**。  
- 仅 Owner 独立签发 **`MAINNET DEPLOY AUTHORIZATION`** 后才 Mainnet 广播；逐笔核验不一致即 STOP；部署完成 ≠ 自动 `TT_PRODUCTION_GO`。  
- 禁止改冻结内容、禁止无授权广播、禁止自动 GO。
