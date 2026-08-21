# TT · TTG V9 — Safe Deprecation Full Privilege Reaudit


> **STATUS (Documentation Truth Convergence · 2026-08-21):** **SUPERSEDED as Official ACTIVE V9 path** · DO_NOT_USE for living V9 Design Lock / DL_R1 / Mainnet Phase1.  
> **Sole upstream now:** [`TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST`](TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST.md) · status `DEPLOYED_PENDING_CUTOVER` / `TIMELOCK_CUTOVER_PENDING` · **≠** `MAINNET_FULLY_ACTIVE` · **≠** `TT_PRODUCTION_GO`.  
> Historical evidence below is retained · R2_FINAL / Remint / Safe-Timelock / P4Cap-as-sale-sink / globalStakers ACTIVE claims are **LEGACY**.

**STATUS:** `SUPERSEDED_AS_DECISION_INPUT` · successor [Governance Root Replacement](TT-TTG-V9-GOVERNANCE-ROOT-REPLACEMENT-LATEST.md) · still `MAINNET_BROADCAST_PAUSED` · stamp `V9_SAFE_DEPRECATION_FULL_PRIVILEGE_REAUDIT`  
**Trigger:** Owner formally deprecates Safe `0x96491aa894658ff7946506318c49F3c76b8f40e7`  
**Target ops (Owner):** Marketing EOA `0xe1e732…CdD4` = **deploy-only** · Treasury EOA `0xF34804…2736` = **pause-only Guardian**  
**Forbidden until exit:** any Ethereum Mainnet V9 broadcast · mutate R2_FINAL · flip `TT_PRODUCTION_GO`  
**Method:** Mainnet `chain_id=1` cast (read-only) + R2_FINAL source privilege map · **no** live writes

Evidence: `evidence/GO_ttg_v9_audit/V9_SAFE_DEPRECATION_FULL_PRIVILEGE_REAUDIT.json`

---

## 0 · Broadcast pause (binding)

```text
Owner Safe deprecation
  → IMMEDIATE pause V9 Mainnet broadcast
  → Full privilege reaudit (this doc)
  → New privilege topology design
  → Forge + Sepolia regression
  → Cutover recheck
  → NEW Owner Mainnet auth
  → only then broadcast
TT_PRODUCTION_GO = unchanged / never auto
```

Prior `OWNER MAINNET DEPLOY AUTHORIZATION` is **paused** (`PAUSED_SAFE_DEPRECATION_REAUDIT`) — not a live deploy ticket while Safe remains on the Timelock admin slot.

---

## 1 · Target privilege state (Owner intent)

| Actor | Target role | Must NOT hold |
|-------|-------------|----------------|
| Marketing `0xe1e732…CdD4` | Deployer EOA only | Timelock admin · Guardian · scheduler · upgrader |
| Treasury `0xF34804…2736` | PM **pause-only** Guardian | unpause · upgrade · burn · seed/params · Timelock admin |
| Safe `0x9649…40e7` | **DEPRECATED** — exit all Official V9 **ACTIVE** privilege chains | any admin/schedule/upgrade path |
| Team `0x010365…6828` | Genesis 3% holder (unchanged) | governance admin |

---

## 2 · Final ruling — live GovernanceTimelock Safe-admin

| Question | Verdict |
|----------|---------|
| Can Safe-admin be **removed** on live Timelock? | **NO** |
| Can Safe-admin be **replaced** with Marketing/Treasury EOA on live Timelock? | **NO** |
| Why | `GovernanceTimelock.admin` set **only in constructor** · **no** `setAdmin` / `pendingAdmin` / `transferAdmin` in source or live bytecode |
| Cast | `admin() = 0x9649…40e7` · `delay() = 172800` · `governor() = 0xD581…787F` |
| Safe reality | threshold **1/1** · sole owner = Marketing EOA — admin address is still the Safe contract |

### Component stamp

| Component | Stamp |
|-----------|--------|
| **KEEP `GovernanceTimelock` `0x50f0…22f7`** | **`REDEPLOY_REQUIRED`** to achieve Safe-exit Official topology |
| Stay on this Timelock while deprecating Safe | **IMPOSSIBLE** without calling Timelock **through** Safe (`msg.sender` must be Safe) |

**Owner forks (choose later — not this broadcast wave):**

1. KEEP Timelock + continue Safe as 1/1 shell — contradicts Safe-exit.  
2. **`REDEPLOY_REQUIRED` Timelock** + Money Path ownership migration — only Safe-exit path.  
3. Do not deploy Official V9 onto current KEEP Timelock until (2) is designed and regressed.

---

## 3 · KEEP Mainnet privilege matrix (cast · read-only)

| Contract | Address | Role field | On-chain value | Safe in chain? |
|----------|---------|------------|----------------|----------------|
| GovernanceTimelock | `0x50f0…22f7` | admin | **Safe `0x9649…`** | **YES — ACTIVE** |
| GovernanceTimelock | | governor | V8 Governor `0xD581…` | via Safe setGovernor |
| GovernanceTimelock | | execute | anyone after delay | no |
| Safe | `0x9649…` | owners | Marketing · 1/1 | self |
| P4Cap | `0xfB90…` | owner/admin | Timelock | via Timelock.admin=Safe |
| SettlementRouter | `0xe5C3…` | owner | Timelock | via Safe |
| FeeRouter | `0x2aF4…` | owner | Timelock | via Safe |
| EscrowFactoryV2Wired | `0xEE0B…` | guardian | Timelock | via Safe |
| TravelTrustGovernor (V8) | `0xD581…` | timelock | Timelock | via Safe |
| V8 TTG / V8 PM | LEGACY | — | not Official V9 buy | PM allow-list false |

**Conclusion:** Safe has **not** exited the ACTIVE privilege chain on KEEP.

---

## 4 · NEW V9 (R2_FINAL · not Mainnet) privilege map

| Contract | Role | Who (design) | Safe required on current KEEP? |
|----------|------|--------------|--------------------------------|
| TokenV9 | mint after genesis | none | no |
| TokenV9 | protocolBurn | Vault ∥ Timelock | Timelock path → Safe |
| PublicSaleVault | admin / UUPS / bind / rescue / burn | Timelock | **YES** |
| BatchPrimaryMarket | timelock / UUPS / seed / unpause / rescue | Timelock | **YES** |
| BatchPrimaryMarket | pause | Guardian ∥ Timelock | Treasury Guardian OK without Safe |
| GovernorV9 | scheduleByGovernor | Governor → Timelock | allow-list + setGovernor need Safe |
| AtomicDeployerMainnet | deploy | Marketing EOA | deploy OK · post-wiring needs Safe |

Target Guardian = Treasury is **code-compatible**. Target Deployer = Marketing is **deploy-compatible**. Neither removes Safe from Timelock.admin.

---

## 5 · REDEPLOY_REQUIRED summary

| Component | Stamp |
|-----------|--------|
| KEEP GovernanceTimelock (live) | **REDEPLOY_REQUIRED** |
| KEEP Money Path owners (P4Cap/SR/FR/EF) | **MIGRATE_WITH_NEW_TIMELOCK** if Timelock redeployed |
| V8 Governor/Token/PM | LEGACY_KEEP_OR_SUPERSEDE |
| V9 R2_FINAL sources | CODE_OK_FOR_TARGET_GUARDIAN · Official wiring to **current** KEEP Timelock **BLOCKED** under Safe-exit |
| Registry “multisig” narrative | UPDATE_REQUIRED after topology choice |

---

## 6 · Gates before any Mainnet broadcast

1. Owner topology choice (§2 forks)  
2. If Safe-exit: new Timelock + Money Path migration design  
3. Privilege topology SSOT update  
4. Forge regression  
5. Sepolia regression  
6. Cutover Final Review re-run  
7. New independent `MAINNET DEPLOY AUTHORIZATION`  
8. Never auto `TT_PRODUCTION_GO`

---

## 7 · Non-actions this wave

- No Mainnet broadcast  
- No R2_FINAL mutation for this pause alone  
- No Timelock admin hack  
- No `TT_PRODUCTION_GO` change  

---

## 中文要点

- **Mainnet 广播已暂停。**
- 现网 Timelock **admin=Safe 且不可改** → Safe 退出 Official ACTIVE 权限链 = **Timelock `REDEPLOY_REQUIRED`**（并需 Money Path 所有权迁移设计）。
- Marketing EOA 只适合 **部署钱包**；Treasury EOA 可作 **pause-only Guardian**；二者都不能替代当前 Timelock.admin。
- 新权限拓扑 + Forge/Sepolia 回归 + Cutover 复核 + 新授权之前，**禁止** Mainnet 广播；`TT_PRODUCTION_GO` 不动。
