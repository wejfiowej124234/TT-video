#!/usr/bin/env python3
"""Site10 REAL FAIL · r22b vs r21 三层归因（屏障扩散 / 真回归 / 覆盖增强）。"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts" / "dev"))
import importlib.util

spec = importlib.util.spec_from_file_location("parse_site10", ROOT / "scripts" / "dev" / "parse-site10-failures.py")
parse_mod = importlib.util.module_from_spec(spec)
assert spec.loader
spec.loader.exec_module(parse_mod)

EVID = ROOT / "frontend/evidence/GO_local_phase1"
OUT = EVID / "site10-r22b-vs-r21-tier-attribution.txt"

# 本轮新增或扩面 spec（r21 矩阵期不存在或不在 REAL FAIL 集）→ 覆盖增强
COVERAGE_ENHANCEMENT_PREFIXES: tuple[str, ...] = (
    "e2e/ai-pre-human-uat-governance.spec.ts",
    "e2e/release-flow.spec.ts",
    "e2e/community-subroutes-data.spec.ts",
    "e2e/community-subroutes-l5-markers.spec.ts",
    "e2e/community-me-l5-a-parity-closeout.spec.ts",
    "e2e/community-phase1-narrow-flows.spec.ts",
    "e2e/me-settings-l5-hub.spec.ts",
    "e2e/g-s1-referral-minimum-loop.spec.ts",
    "e2e/e2e-a-01-cold-start-campaign-consumer.spec.ts",
    "e2e/pes-wave4-validation.spec.ts",
    "e2e/real-user-exception-matrix-sprint.spec.ts",
    "e2e/market-subsite-studios.body.ts",
)

# 断言/产品文案漂移（两轮均红 · 非屏障引入）→ 真回归子类
STALE_ASSERTION_PREFIXES: tuple[str, ...] = (
    "e2e/smoke.spec.ts",
    "e2e/smoke-governance.spec.ts",
    "e2e/governance-params-full-l5.spec.ts",
)


def extract_keys(log_path: Path) -> dict[str, str]:
    text = parse_mod.strip_ansi(log_path.read_text(encoding="utf-8", errors="replace"))
    refused = text.find("ERR_CONNECTION_REFUSED")
    pre = text[:refused] if refused > 0 else text
    blocks = re.split(r"\n\s*\d+\) \[chromium\] › ", pre)
    out: dict[str, str] = {}
    for block in blocks[1:]:
        m = re.match(r"(e2e[^\n]+)", block)
        if not m:
            continue
        title = m.group(1).strip()
        key = title.split(" › ", 1)[0].replace("\\", "/")
        out[key] = parse_mod.bucket_for_spec(key)
    return out


def extract_keys_from_parse_summary(parse_path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    for line in parse_path.read_text(encoding="utf-8").splitlines():
        if not line.startswith("=== e2e"):
            continue
        head = line.split(" (")[0].replace("=== ", "").strip().replace("\\", "/")
        bucket = line.split(" · ")[-1].strip().rstrip("=") if " · " in line else parse_mod.bucket_for_spec(head)
        out[head] = bucket
    return out


def tier_for_key(key: str, *, is_new: bool, is_original: bool) -> str:
    if any(key.startswith(p) for p in COVERAGE_ENHANCEMENT_PREFIXES):
        return "覆盖增强"
    if is_original:
        if any(key.startswith(p) for p in STALE_ASSERTION_PREFIXES):
            return "真回归"
        return "真回归"
    if is_new:
        return "屏障扩散"
    return "真回归"


def summarize(keys: list[str], bucket_map: dict[str, str]) -> dict[str, list[str]]:
    by_bucket: dict[str, list[str]] = {}
    for k in keys:
        b = bucket_map.get(k) or parse_mod.bucket_for_spec(k)
        by_bucket.setdefault(b, []).append(k)
    return by_bucket


def main() -> int:
    r21_log = EVID / "site10-rerun21-orchestrator.log"
    r21_parse = EVID / "site10-rerun21-parse.txt"
    r22b_log = EVID / "site10.acceptance.latest.log"

    r21_map = extract_keys(r21_log) if r21_log.is_file() else {}
    if len(r21_map) < 20 and r21_parse.is_file():
        r21_map = extract_keys_from_parse_summary(r21_parse)
    r22b_map = extract_keys(r22b_log)
    r21_keys = set(r21_map.keys())
    r22b_keys = set(r22b_map.keys())

    new_keys = sorted(r22b_keys - r21_keys)
    orig_keys = sorted(r22b_keys & r21_keys)
    cleared_keys = sorted(r21_keys - r22b_keys)

    tiers: dict[str, list[str]] = {"屏障扩散": [], "真回归": [], "覆盖增强": []}
    for k in new_keys:
        tiers[tier_for_key(k, is_new=True, is_original=False)].append(k)
    for k in orig_keys:
        tiers[tier_for_key(k, is_new=False, is_original=True)].append(k)

    lines: list[str] = []
    lines.append("Site10 REAL FAIL · r22b vs r21 · 三层归因（① 本地）")
    lines.append(f"r21 REAL FAIL keys: {len(r21_keys)} · r22b REAL FAIL keys: {len(r22b_keys)}")
    lines.append(f"net delta: +{len(r22b_keys) - len(r21_keys)} · cleared={len(cleared_keys)}")
    lines.append("")
    lines.append("口径：")
    lines.append("  · 屏障扩散 — r22b 新增 FAIL；PLAYWRIGHT_ROUTE_EXECUTION_BARRIER=1 全量 marker goto 引入")
    lines.append("  · 真回归   — r21∩r22b 仍红，或 smoke/governance 断言与现行页壳/文案漂移")
    lines.append("  · 覆盖增强 — 新 spec/扩面用例首次入矩阵（非屏障主因）")
    lines.append("")
    lines.append("诚实边界：① 降噪窄矩阵 / 断言收敛 ≠ 846 全绿 ≠ G2/G3 正式 OK ≠ ②③ GO")
    lines.append("")

    for tier in ("屏障扩散", "真回归", "覆盖增强"):
        keys = sorted(tiers[tier])
        lines.append(f"=== {tier}: {len(keys)} ===")
        for b, items in sorted(summarize(keys, r22b_map).items(), key=lambda x: -len(x[1])):
            lines.append(f"  [{b}] {len(items)}")
            for k in items:
                lines.append(f"    - {k}")
        lines.append("")

    lines.append(f"=== CLEARED (r21 only): {len(cleared_keys)} ===")
    for k in cleared_keys:
        b = r21_map.get(k, "?")
        lines.append(f"    - [{b}] {k}")

    lines.append("")
    lines.append("收敛动作（本轮）：")
    lines.append("  1. routeExecutionBarrier — marker 仅 opt-in；默认 goto auth-lite + hydration")
    lines.append("  2. smoke/governance — data-tt 页壳 + 现行 pay/params/traveltrust 文案")
    lines.append("  3. governance-params-full-l5 — 对齐 RulesAtAGlance / fee-split track 探针")
    lines.append("  4. bash scripts/dev/run-site10-r22b-denoised-regression-matrix.sh run")
    lines.append("")

    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(OUT.read_text(encoding="utf-8"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
