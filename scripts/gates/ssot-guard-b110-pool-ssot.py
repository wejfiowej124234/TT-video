#!/usr/bin/env python3
"""
CI SSOT guard — B-110 governance/pool four-pool root chain SSOT (TT-SSOT-GUARD-B110-POOL-016).

Static checks:
  • Root **country_pool*** / **treasury_pool*** / **treasury_erc20_pool*** `m.insert("…".to_string(), …)`
    only in `crates/api/src/routes/governance/pool_chain.rs` (merge helpers) and `governance/mod.rs` (**#[cfg(test)]** 镜像断言).
  • **merge_*_chain_ssot_fields**: `*_data_source` → `json!("chain_read")`; `*_is_chain_ssot` → `json!(true)`;
    no `json!(0)` / no literal all-zero u256 in those merges (**不写 0** 占位).
  • **pool_balance** chain SSOT branch: same `json!` block contains **pool_balance** (hex), **data_source** chain_read,
    **is_chain_ssot** true (主读腿与 04 一致；**pool_balance** 不用 `*_data_source` 后缀键).
  • **build_fee_pool_aggregate_body**: Σ 体不得出现根级 **country_pool*** / **treasury_pool*** / **treasury_erc20_pool*** 键名
   （与 fee-pool-aggregates 单测/assert 一致）。
  • 三个 **assert_fee_pool_aggregates_has_no_root_*_ssot_keys** 各含 **3** 个 `v.get("…")`。

横向扩展：其它 HTTP 端点若引入 B-110 根级池键 → **新 TT** + 扩白名单或并列脚本。

Run: python3 scripts/ssot-guard-b110-pool-ssot.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
API_SRC = ROOT / "crates" / "api" / "src"
GOV_DIR = API_SRC / "routes" / "governance"
SRC_POOL_CHAIN = GOV_DIR / "pool_chain.rs"
SRC_GOV_POOL = GOV_DIR / "governance_pool.rs"
SRC_FEE_AGG = GOV_DIR / "fee_pool_aggregate.rs"
SRC_GOV_MOD = GOV_DIR / "mod.rs"

# m.insert("country_pool" | … ".to_string(), …) — multiline OK
INSERT_KEY_RE = re.compile(
    r'"((country_pool|treasury_pool|treasury_erc20_pool)(?:_(?:data_source|is_chain_ssot))?)"\.to_string\(\)'
)

AGG_FORBIDDEN = (
    '"country_pool".to_string()',
    '"country_pool_data_source"',
    '"country_pool_is_chain_ssot"',
    '"treasury_pool".to_string()',
    '"treasury_pool_data_source"',
    '"treasury_pool_is_chain_ssot"',
    '"treasury_erc20_pool".to_string()',
    '"treasury_erc20_pool_data_source"',
    '"treasury_erc20_pool_is_chain_ssot"',
)


def fail(msg: str) -> None:
    print(f"ERROR [ssot-guard-b110-pool-ssot]: {msg}", file=sys.stderr)
    sys.exit(1)


def slice_fn_rust(text: str, sig: str, where: str) -> str:
    """Slice `fn name(...) { ... }` or `async fn ...` by brace depth from first `{` after sig."""
    start = text.find(sig)
    if start < 0:
        fail(f"missing {sig!r} in {where}")
    brace_open = text.find("{", start)
    if brace_open < 0:
        fail(f"missing '{{' after {sig!r}")
    depth = 0
    i = brace_open
    while i < len(text):
        c = text[i]
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return text[start : i + 1]
        i += 1
    fail(f"unclosed braces for {sig!r}")


def must_pair(block: str, ds_key: str, flag_key: str) -> None:
    if not re.search(
        rf'"{re.escape(ds_key)}"\.to_string\(\)\s*,\s*json!\(\s*"chain_read"\s*\)',
        block,
        re.DOTALL,
    ):
        fail(f"{ds_key} must pair with json!(\"chain_read\")")
    if not re.search(
        rf'"{re.escape(flag_key)}"\.to_string\(\)\s*,\s*json!\(\s*true\s*\)',
        block,
        re.DOTALL,
    ):
        fail(f"{flag_key} must pair with json!(true)")


def main() -> None:
    for req in (SRC_POOL_CHAIN, SRC_GOV_POOL, SRC_FEE_AGG, SRC_GOV_MOD):
        if not req.is_file():
            fail(f"missing {req}")

    allowed_insert = {SRC_POOL_CHAIN.resolve(), SRC_GOV_MOD.resolve()}
    for path in sorted(API_SRC.rglob("*.rs")):
        txt = path.read_text(encoding="utf-8")
        for m in INSERT_KEY_RE.finditer(txt):
            if path.resolve() not in allowed_insert:
                rel = path.relative_to(ROOT)
                fail(
                    f"B-110 pool SSOT m.insert key {m.group(1)!r} forbidden outside "
                    f"routes/governance/pool_chain.rs or routes/governance/mod.rs (tests) (seen in {rel})"
                )

    pool_chain = SRC_POOL_CHAIN.read_text(encoding="utf-8")
    gov_pool = SRC_GOV_POOL.read_text(encoding="utf-8")
    fee_agg = SRC_FEE_AGG.read_text(encoding="utf-8")
    gov_mod = SRC_GOV_MOD.read_text(encoding="utf-8")

    cty = slice_fn_rust(
        pool_chain, "fn merge_country_pool_chain_ssot_fields", "routes/governance/pool_chain.rs"
    )
    tr = slice_fn_rust(
        pool_chain, "fn merge_treasury_pool_chain_ssot_fields", "routes/governance/pool_chain.rs"
    )
    er = slice_fn_rust(
        pool_chain,
        "fn merge_treasury_erc20_pool_chain_ssot_fields",
        "routes/governance/pool_chain.rs",
    )

    for label, block in (
        ("merge_country_pool_chain_ssot_fields", cty),
        ("merge_treasury_pool_chain_ssot_fields", tr),
        ("merge_treasury_erc20_pool_chain_ssot_fields", er),
    ):
        if "json!(0)" in block:
            fail(f"{label} must not use json!(0)")
        if "0000000000000000000000000000000000000000000000000000000000000000" in block:
            fail(f"{label} must not embed all-zero u256 literal (不写 0 占位)")

    must_pair(cty, "country_pool_data_source", "country_pool_is_chain_ssot")
    must_pair(tr, "treasury_pool_data_source", "treasury_pool_is_chain_ssot")
    must_pair(er, "treasury_erc20_pool_data_source", "treasury_erc20_pool_is_chain_ssot")

    # pool_balance 链上主读腿：与 data_source / is_chain_ssot 同块（**勿**用首次 ssot_read… 命中 — 另有并行观察腿）
    pos = gov_pool.find('"pool_balance": hex')
    if pos < 0:
        fail('governance_pool.rs must contain "pool_balance": hex (chain SSOT branch)')
    chunk = gov_pool[max(0, pos - 120) : pos + 420]
    if '"pool_balance": hex' not in chunk:
        fail("pool_balance chain branch must use pool_balance: hex")
    if '"data_source": "chain_read"' not in chunk:
        fail("pool_balance chain branch must set data_source chain_read")
    if '"is_chain_ssot": true' not in chunk:
        fail("pool_balance chain branch must set is_chain_ssot true")

    agg = slice_fn_rust(
        fee_agg, "fn build_fee_pool_aggregate_body", "routes/governance/fee_pool_aggregate.rs"
    )
    for sub in AGG_FORBIDDEN:
        if sub in agg:
            fail(f"build_fee_pool_aggregate_body must not contain {sub!r} (Σ 不得带后三池根级键)")

    def assert_three_gets(sig: str) -> None:
        body = slice_fn_rust(gov_mod, sig, "routes/governance/mod.rs (tests)")
        n = len(re.findall(r'v\.get\("[^"]+"\)', body))
        if n != 3:
            fail(f"{sig!r} must contain exactly 3 v.get(...) (got {n})")

    assert_three_gets(
        "    fn assert_fee_pool_aggregates_has_no_root_country_pool_ssot_keys(v: &serde_json::Value)"
    )
    assert_three_gets(
        "    fn assert_fee_pool_aggregates_has_no_root_treasury_pool_ssot_keys(v: &serde_json::Value)"
    )
    assert_three_gets(
        "    fn assert_fee_pool_aggregates_has_no_root_treasury_erc20_pool_ssot_keys(v: &serde_json::Value)"
    )

    print("OK: ssot-guard-b110-pool-ssot passed")


if __name__ == "__main__":
    main()
