# TT-LEGACY-PATH-SSOT-GATE-REGRESSION-OBSERVATION-001

**Date**: 2026-04-19  
**Scope**: One regression pass after introducing the config-driven legacy path SSOT gate (`scripts/check_no_legacy_staking_path_as_ssot.py` + `config/ci/legacy_path_ssot_rules.v1.json`).  
**Policy this round**: **Do not change rules** in `legacy_path_ssot_rules.v1.json`. Add a **second** `rules[]` entry only when a **second real retired path** is agreed (duplicate `_template_add_more_legacy_path_rules`, set `enabled: true`, fill `hit_regexes` / `allow_*` / `suggestion`).

---

## 1. Gate execution (submission signal)

| Item | Value |
|------|--------|
| Command | `python3 scripts/check_no_legacy_staking_path_as_ssot.py` (local: `py -3` on Windows if `python3` is the Store stub) |
| Working tree | Clean for **gate-relevant** inputs; config at `config/ci/legacy_path_ssot_rules.v1.json` |
| Exit code | **0** |
| Stdout (abridged) | `legacy_path_ssot_gates: OK (1 rule(s), roots=docs/spec,docs,crates,contracts, config=…/legacy_path_ssot_rules.v1.json)` |

**Conclusion**: No merge-blocking failure from the gate on this pass.

---

## 2. Full-tree audit (same semantics as the gate; not a separate product)

Repro: load the gate module from `scripts/check_no_legacy_staking_path_as_ssot.py`, apply `scan_roots` / suffix filters / `skip_path_contains`, then for each line:

- If any `hit_regexes` for an **enabled** rule matches → count as a **hit**.
- If any `allow_structured_regexes` or `allow_line_fallback_regex` matches → **allowed**; else **violation**.

| Metric | Value |
|--------|--------|
| Enabled rules | **1** (`monolithic_staking_removed`; template rule remains `enabled: false`) |
| Total hit lines (after skips) | **34** |
| Allowed via **structured** patterns | **33** |
| Allowed via **line_fallback** only | **1** |
| Violations | **0** (matches `scan()` result) |

### 2.1 Sample: single line allowed only by `line_fallback`

| File | Line | Note |
|------|------|------|
| `contracts/src/IdentityStakingPool.sol` | 12 | Natspec references historical `Staking.sol` for **event signature / topic0** parity; matched **fallback** (e.g. `与历史`-class wording in the same line), not the narrow `Staking.sol.*(已移除|…)` structured branch. |

**Observation**: Fallback is doing real work on **non-markdown** Solidity comments; keep fallback regex maintained when tightening structured allows.

### 2.2 Structured vs fallback split

- Almost all doc hits use **`旧 … Staking.sol` / `Staking.sol … 已移除`**-shaped lines → **structured[0]** or **[1]** (ordering depends on which sub-pattern matches first in the audit script).
- No false **failures** observed in this pass.

---

## 3. False positive (FP) / false negative (FN) register — this round

| Class | Count | Evidence / notes |
|-------|-------|-------------------|
| **FP** (legitimate line failed gate) | **0** | Gate exit 0; audit violations 0. |
| **FN** (legacy path as live SSOT but undetected) | **0 observed** | No manual spot-check beyond automated scan. |

**Residual FN risk (theory only — not observed)**:

- **Case / spelling**: `hit_regexes` use **case-sensitive** `Staking.sol` / `contracts/src/Staking`; an all-lower `staking.sol` path string would not hit (may be desirable).
- **Line split**: Deprecation in **previous** line, bare path on next line → would **fail** (by design: same-line policy).
- **Alias path**: Different string than `contracts/src/Staking` (e.g. `src/Staking.sol` only) → would not hit second pattern; first pattern still catches `Staking.sol` with word-boundary.

**Residual FP risk (theory only — not observed)**:

- Very long prose that accidentally contains `contracts/src/Staking` as a **substring** of another token (unlikely); current patterns are literal-oriented.

---

## 4. Second rule — explicit deferral

- **No second retired repo path** was identified in this pass that requires its own `rules[]` block.
- **Action**: Keep **`_template_add_more_legacy_path_rules`** disabled; when Product/Architecture agrees on another removed file/path (e.g. a retired ABI name, old script path), **copy the template**, set `"enabled": true`, and add dedicated `hit_regexes` + `allow_structured_regexes` (+ optional `allow_line_fallback_regex`) + `suggestion`.

---

## 5. Re-run checklist (for humans / CI)

```bash
python3 scripts/check_no_legacy_staking_path_as_ssot.py
# Optional override:
# LEGACY_PATH_SSOT_RULES=config/ci/custom_rules.json python3 scripts/check_no_legacy_staking_path_as_ssot.py
```

CI already invokes this script from **Governance doc linkage gate**, **Broadcast batch blockers**, and **Build** (see `.github/workflows/*.yml`).
