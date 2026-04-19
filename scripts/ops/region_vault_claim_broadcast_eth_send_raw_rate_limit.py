#!/usr/bin/env python3
# B-302: optional min spacing between eth_sendRawTransaction attempts (QPS cap via env or CLI).
from __future__ import annotations

import argparse
import os
import sys
import time
from dataclasses import dataclass, field
from typing import Any

B302_ANCHOR = "14-REGIONVAULT-CLAIM-BROADCAST-ETH-SEND-RAW-RATE-LIMIT-V1"
B302_RULE_VERSION = "region_vault_claim_broadcast_eth_send_raw_rate_limit_v1"
IMPLEMENTATION_TT = "TT-B302-ETH-SEND-RAW-RATE-LIMIT-001"
MOTHER_TABLE = "B-302"

MAX_QPS_ENV = "TRAVELTRUST_B302_ETH_SEND_RAW_MAX_QPS"
MIN_INTERVAL_MS_ENV = "TRAVELTRUST_B302_ETH_SEND_RAW_MIN_INTERVAL_MS"


@dataclass
class EthSendRawRateLimiter:
    """Single-process spacing before each eth_sendRawTransaction RPC (including retries after errors)."""

    min_interval_s: float
    _last_mono: float = 0.0
    wait_seconds_observed: list[float] = field(default_factory=list)

    def wait_before_send(self) -> None:
        if self.min_interval_s <= 0:
            return
        now = time.monotonic()
        if self._last_mono > 0:
            gap = now - self._last_mono
            if gap < self.min_interval_s:
                need = self.min_interval_s - gap
                time.sleep(need)
                self.wait_seconds_observed.append(need)
        # _last_mono updated in mark_after_send_attempt

    def mark_after_send_attempt(self) -> None:
        self._last_mono = time.monotonic()

    def evidence_tail(self) -> dict[str, Any]:
        waits = self.wait_seconds_observed
        return {
            "min_interval_ms_configured": round(self.min_interval_s * 1000.0, 3),
            "send_attempts_after_first": len(waits),
            "total_sleep_s": round(sum(waits), 6),
        }


def _parse_positive_float(raw: str, *, label: str) -> float:
    s = raw.strip()
    if not s:
        raise ValueError(f"{label}: empty")
    v = float(s)
    if v <= 0:
        raise ValueError(f"{label}: must be > 0 (got {v})")
    return v


def build_eth_send_raw_rate_limit(
    *,
    cli_min_interval_ms: float | None = None,
) -> tuple[EthSendRawRateLimiter, dict[str, Any]]:
    """
    Effective min interval = max(env interval, 1000/max_qps, cli override).
    Disabled when all sources unset or zero after merge.
    """
    sources: dict[str, Any] = {}
    candidates_ms: list[float] = []

    if cli_min_interval_ms is not None:
        if cli_min_interval_ms <= 0:
            raise ValueError("cli_min_interval_ms must be > 0 when set")
        candidates_ms.append(float(cli_min_interval_ms))
        sources["cli_min_interval_ms"] = float(cli_min_interval_ms)

    env_ms = os.environ.get(MIN_INTERVAL_MS_ENV, "").strip()
    if env_ms:
        v = _parse_positive_float(env_ms, label=MIN_INTERVAL_MS_ENV)
        candidates_ms.append(v)
        sources[MIN_INTERVAL_MS_ENV] = v

    env_qps = os.environ.get(MAX_QPS_ENV, "").strip()
    if env_qps:
        qps = _parse_positive_float(env_qps, label=MAX_QPS_ENV)
        from_qps = 1000.0 / qps
        candidates_ms.append(from_qps)
        sources[MAX_QPS_ENV] = qps
        sources["derived_min_interval_ms_from_max_qps"] = round(from_qps, 6)

    eff_ms = max(candidates_ms) if candidates_ms else 0.0
    eff_s = eff_ms / 1000.0

    enabled = eff_s > 0
    lim = EthSendRawRateLimiter(min_interval_s=eff_s)
    meta: dict[str, Any] = {
        "anchor": B302_ANCHOR,
        "rule_version": B302_RULE_VERSION,
        "mother_table": MOTHER_TABLE,
        "implementation_tt": IMPLEMENTATION_TT,
        "enabled": enabled,
        "sources": sources,
        "effective_min_interval_ms": round(eff_ms, 6) if enabled else 0.0,
        "notes": (
            "B-302: wait_before_send() spaces consecutive eth_sendRawTransaction attempts in one process; "
            "does not cap global multi-operator concurrency."
        ),
    }
    return lim, meta


def _cmd_self_test(_: argparse.Namespace) -> int:
    lim, meta = build_eth_send_raw_rate_limit(cli_min_interval_ms=150.0)
    assert meta.get("enabled") is True
    assert abs(float(meta.get("effective_min_interval_ms") or 0) - 150.0) < 0.01

    t0 = time.monotonic()
    lim.wait_before_send()
    lim.mark_after_send_attempt()
    lim.wait_before_send()
    lim.mark_after_send_attempt()
    elapsed = time.monotonic() - t0
    assert elapsed >= 0.14, f"expected ~150ms spacing, got {elapsed}"

    lim2, meta2 = build_eth_send_raw_rate_limit(cli_min_interval_ms=None)
    # no env: disabled unless we set env in test
    assert meta2.get("enabled") is False
    lim2.wait_before_send()
    lim2.mark_after_send_attempt()
    lim2.wait_before_send()
    lim2.mark_after_send_attempt()

    print(f"region_vault_claim_broadcast_eth_send_raw_rate_limit self-test OK ({IMPLEMENTATION_TT})", file=sys.stderr)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=f"{MOTHER_TABLE}: eth_sendRawTransaction spacing ({IMPLEMENTATION_TT}).")
    sub = ap.add_subparsers(dest="cmd", required=True)
    st = sub.add_parser("self-test", help="spacing smoke")
    st.set_defaults(func=_cmd_self_test)
    args = ap.parse_args()
    try:
        return int(args.func(args))
    except (ValueError, AssertionError) as e:
        print(f"eth_send_raw_rate_limit: FAIL: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
