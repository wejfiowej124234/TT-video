# TT · TTG V9 Security Audit Ladder


> **ACTIVE V9 documentation pointer:** [`TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST`](TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST.md) · Design Lock **DL_R1** · Mainnet `DEPLOYED_PENDING_CUTOVER`.  
> Any R2_FINAL / Remint / sale→P4Cap / globalStakers / Safe-as-V9-admin narrative below = **LEGACY / SUPERSEDED / DO_NOT_USE_AS_ACTIVE_TRUTH** (historical contrast only).

**STATUS:** `AUDIT_LADDER_BINDING` · **ACTIVE candidate = `V9_AUDIT_CANDIDATE_DESIGN_LOCK`** · R2_FINAL / Remint ladder position = **SUPERSEDED historical**

> Freeze tooling (ACTIVE): `python scripts/dev/freeze-ttg-v9-audit-candidate-design-lock.py` · old `freeze-ttg-v9-audit-candidate.py` = LEGACY refuse unless override.  
**Scope stamp (target):** `V9_OFFICIAL_FULL_CONTRACT_TOPOLOGY_AUDIT_PASS`  
**Not:** Production GO · auto Mainnet broadcast · USDC source audit · full V8 re-audit  

**Freeze tooling:** `python scripts/dev/freeze-ttg-v9-audit-candidate.py`  
**Language:** English findings

---

## Binding ladder

```text
① Local PASS
  → Audit #1  Smart Contract Auditor (NEW deep + topology wiring draft)
  → ② Sepolia PASS
  → Regression #1
  → Audit #2  Red Team / Economic Attacker (NEW + KEEP call-chains)
  → Fix if Critical/High/Medium blocking → re-freeze if core changed
  → Freeze V9_AUDIT_CANDIDATE_R*_FINAL (Exact Source + Bytecode + Config)
  → Audit #3  Mainnet Release Auditor (Exact Match + FULL TOPOLOGY checklist)
  → If core security semantics change → **new freeze** (e.g. R2_FINAL) — prior FINAL void
  → Regression #2  Final Sepolia on **current FINAL** Exact bytes
  → Full Topology Audit (KEEP Reality + Money Path + V8 isolation + call-chains)
  → V9_OFFICIAL_FULL_CONTRACT_TOPOLOGY_AUDIT_PASS
  → [optional] External firm on SAME frozen FINAL manifest
  → If firm findings → remediate → DIFF AUDIT → Regression → re-freeze
  → V9_MAINNET_READY_STOP
  → ③ Mainnet ONLY with Owner written auth (no auto GO)
```

**Hard stops:** no Mainnet broadcast from this ladder · no `TT_PRODUCTION_GO` flip · **core Freeze after last audit**.

---

## Freeze discipline (harder than “audit count”)

| Rule | Binding |
|------|---------|
| After Audit #3 (and after any external firm report) | Core Token / Governor / Vault / PM / UUPS / AtomicDeployer / DeployTopology **FROZEN** |
| Any change to **security semantics** of those cores | **Invalidate** prior “三审 / firm report” claims → **diff audit** + **Sepolia regression** + **new candidate id** |
| Cosmetic / docs / rehearsal scripts only | May proceed without new deep audit **if** manifest source hashes for core unchanged |
| External firm package | **Must** receive the **same** `V9_AUDIT_CANDIDATE_*_MANIFEST` bytes intended for Mainnet |

Paying a firm to find low-severity bugs on an unstable tree is forbidden process — AI #1–#3 + regressions first.

---

## Three AI roles (do not merge checklists)

| # | Role | Question |
|---|------|----------|
| **#1** | Smart Contract Auditor | Solidity / OZ / UUPS / CEI / access / storage / overflow / rounding / init on **NEW** |
| **#2** | Red Team / Economic Attacker | Steal Vault? Bypass burn? Tamper batches? UUPS rug? Reenter? Flash-vote? Skip Timelock? **Wrong KEEP sink / privilege?** |
| **#3** | Mainnet Release Auditor | Exact Source=Bytecode? 25T no-mint? Genesis? Proxy admin? **Full Official topology wiring?** Deploy takeover? **V8 isolation?** |

Each wave → **different** findings file.

---

## Official Full Contract Topology (what “V9 audit” means)

**Not** “only the four new contracts.”  
**Yes** = NEW deep audit **+** KEEP Reality / Integration / Privilege **+** Money Path integration **+** V8 Legacy isolation.

| System | V9 handling | Final audit mode |
|--------|-------------|------------------|
| TTG V9 Token | **NEW** | ✅ Source deep audit |
| Governor V9 | **NEW** | ✅ Source deep audit |
| PublicSaleVault V9 | **NEW** / UUPS | ✅ Source deep audit |
| Batch Primary Market V9 | **NEW** / UUPS | ✅ Source deep audit |
| Governance Timelock | **KEEP** deployed | ✅ Reality + Integration + Privilege re-review |
| P4Cap / USDC Treasury | **KEEP** deployed | ✅ Reality + Integration + Privilege re-review |
| EscrowFactoryV2Wired | **KEEP** deployed | ✅ Integration / privilege re-review |
| SettlementRouter | **KEEP** deployed | ✅ Integration / privilege re-review |
| FeeRouter | **KEEP** deployed | ✅ Integration / privilege re-review |
| Safe / Guardian | **KEEP** | ✅ Privilege topology |
| USDC | External standard | ⚪ **Not** USDC source — audit interface / decimals / transfer assumptions |
| V8 TTG + OLD PM | **LEGACY** | ⚪ No full V8 re-audit — **must** audit **isolation completeness** |

### NEW vs KEEP (do not confuse)

| Class | Method |
|-------|--------|
| **NEW** | Line-by-line / invariant / fuzz / CEI / UUPS / economic |
| **KEEP** | On-chain Reality + wiring correctness + privilege map + “would wrong address / role brick or rug V9?” — **not** “already deployed ⇒ skip” |

Example: Timelock bytecode may be fine; **GovernorV9 → Timelock → Vault/PM** mis-wire is still Critical. P4Cap may be fine; **Batch PM `usdcTreasury` ≠ KEEP P4Cap** is still a release incident.

---

## Mandatory call-chains (Audit #2 and #3)

```text
User USDC → Batch PM → P4Cap (KEEP sink)
PublicSaleVault → Batch PM → User TTG
TTG → GovernorV9 → Vote → Timelock (KEEP) → DAO / Public governance burn
Timelock (KEEP) → UUPS Proxy → Implementation upgrade
Escrow → Settlement → FeeRouter → Existing Money Path (KEEP · must remain coherent / non-conflicting with V9 sale)
```

Plus **V8 Isolation Audit**:

- V8 TTG / OLD PM = LEGACY only  
- Official www · `/meta` · Indexer · Governor · Primary Market · wallet metadata **must not** accidentally keep V8 addresses on Official V9 paths  

---

## Optional external firm (not a hard gate)

```text
Internal threshold (R2_FINAL + Reg#2 + Topology + Pre-Mainnet Security PASS)
  → Owner decides Mainnet
  → [optional] firm on locked pack — never required; never “等同于第三方审计”
```

Firm PASS ≠ Owner auth ≠ Production GO. Internal PASS ≠ firm attestation.

---

## Stamps

| Stamp | Meaning |
|-------|---------|
| `V9_REMINT_LOCAL_PASS` | ① |
| `V9_REMINT_SEPOLIA_PASS_STOP` | ② |
| `V9_AUDIT_CANDIDATE` / `Rn` | AI freeze + remediation |
| `V9_SEPOLIA_REGRESSION_PASS` | Regression #1 |
| `V9_AUDIT_CANDIDATE_R*_FINAL` | Freeze for Audit #3 / firm |
| `V9_SEPOLIA_REGRESSION2_PASS` | Regression #2 |
| `V9_OFFICIAL_FULL_CONTRACT_TOPOLOGY_AUDIT_PASS` | NEW deep + KEEP re-review + privilege + call-chains + Money Path + V8 isolation + Mainnet config gates |
| `V9_MAINNET_READY_STOP` | AI (+ optional firm) closed · Mainnet still Owner-gated |
| External firm report id | Optional · must cite frozen manifest SHA |

---

## Current position

| Step | Status |
|------|--------|
| AI ladder + Reg #2 + Topology | ✅ R2_FINAL |
| `V9_PRE_MAINNET_SECURITY_PASS` | ✅ OPEN_C/H/M=0 · Exact Match |
| External firm | ⚪ **Optional** · **not** hard gate · ≠ internal PASS |
| Next | **Owner** Mainnet Cutover final review → independent written auth |
| Mainnet / Production GO | **FORBIDDEN** without Owner auth · GO independent |

**Dev stop / Owner gate:** [Owner Mainnet Gate](TT-TTG-V9-OWNER-MAINNET-GATE-LATEST.md) · [Pre-Mainnet Final Security](TT-TTG-V9-PRE-MAINNET-FINAL-SECURITY-AUDIT-LATEST.md)  
**Binding:** `V9_AUDIT_CANDIDATE_R2_FINAL` · SHA `sha256:59c81dbe55beeaeddae8bbd16b1a7e4f63549fa3b30d012e0387abd06887f92b`


## Current position (Design Lock · ACTIVE)

| Item | Status |
|------|--------|
| Canonical baseline clean | ✅ `V9_CANONICAL_BASELINE_CLEAN_PASS` · `OLD_V9_ACTIVE_REFERENCES=0` |
| Active candidate | ✅ `V9_AUDIT_CANDIDATE_DESIGN_LOCK` · **DL_R1** |
| AI Audit #1 / #2 / #3 | ✅ triad PASS · OPEN_C/H/M=0 |
| R2_FINAL / Remint | **SUPERSEDED** · DO_NOT_USE |
| Next | Sepolia **DL_R1** regression → **new** Mainnet Cutover Review · **no** auto GO · **no** Mainnet broadcast |


