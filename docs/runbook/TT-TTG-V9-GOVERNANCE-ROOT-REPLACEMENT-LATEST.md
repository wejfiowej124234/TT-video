# TT · TTG V9 — Governance Root Replacement


> **ACTIVE V9 documentation pointer:** [`TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST`](TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST.md) · Design Lock **DL_R1** · Mainnet `DEPLOYED_PENDING_CUTOVER`.  
> Any R2_FINAL / Remint / sale→P4Cap / globalStakers / Safe-as-V9-admin narrative below = **LEGACY / SUPERSEDED / DO_NOT_USE_AS_ACTIVE_TRUTH** (historical contrast only).

**STATUS:** `①_LOCAL_PASS` · waiting [Money Flow Reconciliation](TT-TTG-V9-MONEY-FLOW-ECONOMIC-TRUTH-RECONCILIATION-LATEST.md) Owner Option I/II · stamp `V9_GOV_ROOT_LOCAL_PASS_STOP` · Sepolia/Mainnet still **FORBIDDEN**  
**Owner decision:** Abandon Safe `0x96491aa894658ff7946506318c49F3c76b8f40e7` **and** old GovernanceTimelock `0x50f0b26167ec73e327d97c54c81f1c1b9efb22f7` as Official **ACTIVE** roots  
**Invariant preserved:** TTG V9 **25T Monetary Invariant** · five-batch primary market · Governance Burn · Money Path **economic rules** (BPS / paths) — **unchanged**  
**Ops target:** Solo Owner / deploy EOA `0xe1e732EfBf9B010a9204054467256d3d93f3CdD4` · pause-only Guardian `0xF34804AA66bAeE02F3aF1C540B9997C7F46b2736`  
**Forbidden:** early Mainnet broadcast · auto `TT_PRODUCTION_GO` · inventing bucket destinations without Owner pin

Parent: [Safe Deprecation Privilege Reaudit](TT-TTG-V9-SAFE-DEPRECATION-FULL-PRIVILEGE-REAUDIT-LATEST.md) · Monetary [Invariant](TT-TTG-V9-MONETARY-INVARIANT-LATEST.md)

Evidence: `evidence/GO_ttg_v9_audit/V9_GOVERNANCE_ROOT_REPLACEMENT_ACTIVE.json`

---

## 0 · Binding ladder

```text
Owner Root Replacement decision (this doc)
  → Local Forge (new Timelock EOA-admin + KEEP rewire drills)
  → Sepolia full lifecycle + privilege migration rehearsal
  → NEW+KEEP full topology security final audit
  → New Cutover Final Review
  → NEW Mainnet deploy authorization (separate)
  → Mainnet broadcast only then
Old Safe + old Timelock → LEGACY (after migration window)
TT_PRODUCTION_GO = never auto
```

R2_FINAL V9 **business** bytecode remains the economics baseline; **governance root pin** changes from KEEP-old-Timelock to **new Timelock**. Any core security-semantic change to V9 sale/burn still requires a **new freeze** — Root Replacement itself is Timelock/Money Path privilege migration, not a remint of 25T rules.

---

## 1 · New ACTIVE governance root (target)

| Role | Address / rule |
|------|----------------|
| **NEW GovernanceTimelock** | Redeploy `GovernanceTimelock.sol` · `admin = Marketing EOA 0xe1e732…` · `delay = 172800` (48h keep) · **no Safe** |
| Deployer / Solo Owner EOA | `0xe1e732…CdD4` — deploys Timelock + V9 AtomicDeployerMainnet; Timelock.admin for schedule/setGovernor/allow-list |
| pause-only Guardian | `0xF34804…2736` — V9 Batch PM `pause` only |
| NEW GovernorV9 | Binds **new** Timelock + V9 Token (immutable constructor) |
| Old Safe `0x9649…` | **LEGACY** after cutover (may be used **once** as LEGACY_CUTOVER_WINDOW to schedule rewires from old Timelock) |
| Old Timelock `0x50f0…` | **REDEPLOY_REQUIRED** as ACTIVE root → then **LEGACY** |

---

## 2 · KEEP Money Path — rewire vs redeploy (cast + source)

Cast (`chain_id=1`, read-only):

| Contract | Address | Privilege fields (today) | Migratable? | Stamp |
|----------|---------|--------------------------|-------------|--------|
| **GovernanceTimelock (old)** | `0x50f0…22f7` | `admin=Safe` immutable | **No** admin change | **REDEPLOY_REQUIRED** → LEGACY after cutover |
| **Safe** | `0x9649…40e7` | Timelock.admin · FeeRouter buckets | Exit ACTIVE | **LEGACY** (post-window) |
| **P4Cap** | `0xfB90…BbF` | `owner=Timelock` · `spender=Timelock` · EIP-1967 admin slot=Timelock | `transferOwnership` + `setSpender` | **KEEP_AND_REWIRE** |
| **EscrowFactoryV2Wired** | `0xEE0B…C1C6` | `guardian=Timelock` | `transferGuardian(newTimelock)` | **KEEP_AND_REWIRE** |
| **SettlementRouter** | `0xe5C3…B372` | `owner=Timelock` | `transferOwnership(newTimelock)` | **KEEP_AND_REWIRE** |
| **FeeRouter** | `0x2aF4…8A72` | `owner=Timelock` · **countryBucket=Safe** · **globalStakers=Safe** · reserve/ops=P4Cap | `transferOwnership` + **`setRoutingConfig`** | **KEEP_AND_REWIRE** (+ **bucket pin required**) |
| V8 Governor | `0xD581…` | `timelock=old` | immutable bind | **LEGACY / SUPERSEDE** by GovernorV9 |
| V8 TTG / V8 PM | LEGACY sale | — | no Official V9 buy | **LEGACY** |

### FeeRouter Safe buckets (critical)

On-chain today:

- `countryBucket = Safe 0x9649…`
- `globalStakers = Safe 0x9649…`
- `globalReserve / globalOps = P4Cap`

Safe-exit **requires** Owner-written replacement addresses for country + stakers buckets **before** Mainnet rewire execute (BPS may stay same). Until Owner pins those two addresses, FeeRouter Mainnet rewire is **BLOCKED** (Sepolia may use test sinks).

### LEGACY_CUTOVER_WINDOW (honest)

Old Timelock admin is **still Safe**. The **only** way to call `transferOwnership` / `transferGuardian` / `setSpender` / `setRoutingConfig` as Timelock is:

`Marketing EOA → Safe.execTransaction → old Timelock.schedule → wait 48h → execute`

That window is **one-time migration**, then Safe + old Timelock are marked **LEGACY**.

---

## 3 · V9 NEW stack (unchanged economics)

| Item | Rule |
|------|------|
| MAX_SUPPLY 25T · 50/35/3/5/7 | **Unchanged** |
| Five-batch caps / 1/3/5/7/9 µUSDC · RETURN close | **Unchanged** |
| Governance Burn | GovernorV9 → **new** Timelock → Vault |
| USDC → P4Cap | **KEEP** P4Cap address after rewire |
| Official factory | `TtgV9AtomicDeployerMainnet` with **new** Timelock + Guardian=Treasury + Norm ops wallets |
| R2_FINAL freeze | Do **not** mutate for root replacement unless a security-semantic V9 change appears |

---

## 4 · ① → ② exit criteria (before any Mainnet auth)

| Gate | Exit |
|------|------|
| Local Forge | New Timelock(admin=EOA) · simulated KEEP rewire · V9 topology binds new Timelock · green tests |
| Sepolia | Full lifecycle + privilege migration drill |
| Topology security final | NEW+KEEP matrix · Safe absent from ACTIVE |
| Cutover Final Review | New 12/12 against **new** Timelock pins |
| Mainnet auth | **New** instrument only |

---

## 5 · Non-actions now

- No Mainnet broadcast  
- No auto `TT_PRODUCTION_GO`  
- No silent FeeRouter bucket rewrite without Owner pin  
- No claiming old Timelock admin was replaced in-place  

---

## 中文要点

- Owner 已启动 **Governance Root Replacement**：弃旧 Safe + 旧 Timelock ACTIVE 根，**重部署无 Safe 的 Timelock**（admin=Marketing EOA），Guardian=Treasury pause-only。  
- P4Cap / EscrowFactory / SettlementRouter / FeeRouter = **KEEP_AND_REWIRE**；旧 Timelock = **REDEPLOY_REQUIRED→LEGACY**。  
- FeeRouter 链上 **country/stakers 仍指向 Safe**，须 Owner 另钉落点后再迁。  
- 阶梯：Forge → Sepolia → 全拓扑终审 → 新 Cutover → 新 Mainnet 授权；**禁止**提前广播与自动 GO。


---

## ① Local PASS (closed this wave)

See [Gov Root Local PASS + Bucket Audit](TT-TTG-V9-GOV-ROOT-LOCAL-PASS-AND-BUCKET-AUDIT-LATEST.md).

- Forge `TtgGovRootReplacementLocalTest` **3/3 PASS**
- FeeRouter buckets: **Owner Option I** (country+stakers→P4Cap) or **Option II** (83 vaults) — see [Money Flow Reconciliation](TT-TTG-V9-MONEY-FLOW-ECONOMIC-TRUTH-RECONCILIATION-LATEST.md); reserve/ops = P4Cap Exact
- Personal EOAs forbidden as FeeRouter sinks
- Pre-audit register: [Pre-Audit Alignment](TT-TTG-V9-PRE-AUDIT-ALIGNMENT-REGISTER-LATEST.md) — **no 3× audit until P0 clear**
