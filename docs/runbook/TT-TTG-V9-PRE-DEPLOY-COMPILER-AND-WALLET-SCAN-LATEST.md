# TT · TTG V9 — Pre-Deploy Scanner / Compiler Banner Checklist

**STATUS:** `ACTIVE` · run **before every** Sepolia/Mainnet verify or wallet scan  
**Rule:** Prefer **toolchain + disclosure**; do **not** rewrite Design Lock tokenomics to silence scanners  
**English NatSpec only** on V9 sources

Parents: [Design Lock](TT-TTG-V9-OWNER-DESIGN-LOCK-LATEST.md) · [Local PASS](TT-TTG-V9-DESIGN-LOCK-LOCAL-PASS-LATEST.md)

---

## Screenshot map (3 banners)

| Banner | What it is | Avoid **without** changing business code? |
|--------|------------|-------------------------------------------|
| **1–2 · Compiler specific version warnings** (UnsoundSpill… / LostStorage… / Verbatim… / FullInliner… / MissingSideEffects…) | Explorer lists **known solc bugs** for the compiler version used to verify | **Yes — pin patched solc + via_IR**; most are **N/A** to our patterns |
| **3 · Bitget “Insider holding 50%”** | Wallet heuristic: any address holding ≥15% tagged “insider / rug risk” | **Cannot silence without changing 50% Public vault** — it is **Design Lock genesis**. Disclose: holder = **PublicSaleVault**, not team EOA |

---

## A · Compiler banners — how to avoid (no contract logic change)

### Pin (already Design Lock / V9)

```toml
# contracts/foundry.toml profile.ttg_v9
solc_version = "0.8.36"
via_ir = true
optimizer = true
optimizer_runs = 200
evm_version = "paris"
```

| Bug (explorer name) | Severity | Fixed / note | Our exposure |
|---------------------|----------|--------------|--------------|
| UnsoundSpillInMutualRecursion | medium | Fixed in **0.8.36** | **None** if build = 0.8.36+ · we do **not** use mutual recursion + IR spill patterns |
| LostStorageArrayWriteOnSlotOverflow | low | Fixed in **0.8.32** | **None** · no storage arrays at 2^256 boundary |
| VerbatimInvalidDeduplication | low | Fixed ≤0.8.23 · **Solidity sources unaffected** (Yul `verbatim` only) | **None** |
| FullInlinerNonExpressionSplitArgumentEvaluationOrder | low | Optimizer edge case · rare | **Low** · no reliance on arg eval order across inlined calls |
| MissingSideEffectsOnSelectorAccess | low | Selector-access quirk | **None** · we do not use side-effecting `.selector` expressions |

### Pre-deploy commands (no code edit)

```bash
cd contracts
FOUNDRY_PROFILE=ttg_v9 forge --version
FOUNDRY_PROFILE=ttg_v9 forge config | rg "solc_version|via_ir|optimizer"
# Expect solc_version = 0.8.36 · via_ir = true
FOUNDRY_PROFILE=ttg_v9 forge build
```

### Verify on explorer

- Upload **exact** metadata / standard JSON from `out-ttg-v9` for that commit  
- Compiler = **0.8.36** · Optimization **Yes** · via IR **Yes** · runs **200** · EVM **paris**  
- If banner still appears: many explorers show **historical bug lists for the version line**; treat as **informational** when table above says None — keep a note in the release evidence pack (do not “fix” by downgrading solc)

### Do **not**

- Downgrade to 0.8.19 for V9 (reopens older surfaces; wrong profile)  
- Disable `via_ir` just to change the banner (V9 profile requires via_ir)  
- Rewrite Token logic to chase explorer UI

---

## B · Bitget / wallet “Insider 50%” — how to handle (no tokenomics change)

### Why it fires

V9 genesis: **PublicSaleVault holds 50% (12.5T)** until sold. Scanners count that as “insider ratio 50% > 15%”.

### This is **not** a rug mint / honeypot

Same scan already passes when open-source / no honeypot / no balance rewrite / no mint — align with our Token:

- **No further mint** after genesis  
- **No** owner `setBalance`  
- Transfers are normal ERC20  
- 50% is **protocol vault custody** for the public sale, **not** Marketing/Team EOA

### Avoid “warning” without changing the 50% rule?

| Action | Effect |
|--------|--------|
| Change 50% allocation | **Forbidden** — Design Lock / Monetary Invariant |
| Move 50% to many EOAs | **Worse** · looks like wash distribution · still not “sold” |
| Publish English disclosure + label vault on explorer | **Correct** · scanners may still warn until inventory sells down |
| After public sale distributes | Ratio of vault falls · warning often clears naturally |

**Ops disclosure (copy for Bitget / community):**

> TravelTrust TTG V9: A 50% holding at genesis is the **PublicSaleVault** (protocol custody for the five-batch public sale), not a team insider wallet. Team 3% / Marketing 5% / Treasury 7% are separate genesis pins. There is **no post-genesis mint**. Open-source · no honeypot · no arbitrary balance edit.

---

## C · English NatSpec requirement

V9 Design Lock sources: **English NatSpec only** · state explicitly:

- Compiler pin rationale (0.8.36 + via_IR)  
- No additional mint / no honeypot  
- Public 50% = vault custody (scanner false-positive context)

See headers on `TravelTrustGovernanceTokenV9.sol` · `TtgV9DesignLockConstants.sol`.

---

## D · Every-deploy checklist (tick)

- [ ] `FOUNDRY_PROFILE=ttg_v9` · solc **0.8.36** · via_ir **true**  
- [ ] `forge build` clean · Design Lock local gate PASS if Design Lock surfaces touched  
- [ ] Verify with **matching** solc metadata  
- [ ] Record compiler banner screenshot + “N/A table” in evidence  
- [ ] Record wallet scan screenshot + **PublicSaleVault 50% disclosure**  
- [ ] Confirm open-source verify · no mint · no honeypot still green  

---

## 中文要点

- **编译器黄条：** 不改业务代码 → 固定 **solc 0.8.36 + via_IR**；多数 bug 已修或不适用；浏览器可能仍提示，按证据表记 N/A。  
- **Bitget 50%：** 是 **公售金库 50%** 设计，不是老鼠仓；**不能靠改合约比例消掉**；用英文披露 + 开源/无增发已绿项证明。  
- 合约注释 **只用英文**，写明无额外 mint / 无蜜罐 / 50%=Vault。
