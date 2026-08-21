# TT · TTG V9 — Design Lock Local PASS

**STATUS:** `V9_DESIGN_LOCK_LOCAL_PASS` · **STOP before Sepolia**  
**Gate:** `bash scripts/dev/run-ttg-v9-design-lock-local-gate.sh` → exit 0 · 10/10 Forge  
**Forbidden:** Sepolia / Mainnet broadcast · inherit old R2_FINAL PASS · auto `TT_PRODUCTION_GO`

Parent: [Owner Design LOCK](TT-TTG-V9-OWNER-DESIGN-LOCK-LATEST.md)

---

## Delivered (① Local)

| Component | Path |
|-----------|------|
| Solo NEW Timelock | `contracts/src/ttg-v9/TtgV9SoloTimelock.sol` |
| NEW Project Pool (P4Cap-class) | `contracts/src/ttg-v9/TtgV9ProjectPool.sol` |
| Country Fee Router (45/55 · 100%) | `contracts/src/ttg-v9/TtgV9CountryFeeRouter.sol` |
| Role Stake (live supply · M/G DISABLED) | `contracts/src/ttg-v9/TtgV9RoleStakePool.sol` |
| Ops constants | `contracts/src/ttg-v9/TtgV9DesignLockConstants.sol` |
| Forge suite | `contracts/test/ttg-v9/TtgV9DesignLockLocal.t.sol` |

### Proven invariants (Forge)

- Timelock admin = Marketing · delay 48h · ≠ Safe  
- PM `usdcTreasury` = NEW Pool · Guardian = Treasury pause-only  
- Fee: Active CN payout → 45/55 · no payout → 100% pool · no `globalStakers`  
- Sale USDC → NEW Pool (not legacy P4Cap)  
- P4 spend ≤30% live reserve · to Treasury ops wallet  
- Role Stake min ∝ `totalSupply()` · Merchant/Guide revert DISABLED  
- Genesis 3/5/7 ops pins  

### Deferred (honest · next waves)

| Item | Note |
|------|------|
| KEEP EscrowFactory/SettlementRouter retarget | Fee Router has `setFeeRouterCaller` · EF/SR wire + Escrow `platformFeeBps=500` = integration wave |
| Access Fee on-chain collector | Exact to `0xF34804` · collection OPEN OK per Design Lock |
| Sepolia lifecycle · Audit Candidate · 3× AI audits | **Sepolia PASS + `V9_AUDIT_CANDIDATE_DESIGN_LOCK` FROZEN** · R2_FINAL PASS **not inherited** |

---

## Next (only after Owner says go)

```text
Sepolia full lifecycle → new Audit Candidate Freeze → 3× independent AI audits
→ C/H/M=0 · Exact Match · V8/Safe ZERO ACTIVE → Mainnet Cutover (new auth)
```

## 中文要点

- Design Lock **① LOCAL_PASS**（10/10）。  
- **停在 Local**；未进 Sepolia / Mainnet / GO。  
- Escrow 切流与链上 30万收款器 = 后续集成债。
