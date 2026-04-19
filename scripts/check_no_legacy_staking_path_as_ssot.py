#!/usr/bin/env python3
"""
Legacy path → SSOT regression gate (config-driven).

Default rules: config/ci/legacy_path_ssot_rules.v1.json
Override: LEGACY_PATH_SSOT_RULES=/path/to/rules.json (absolute or relative to repo root).

CI / local: python3 scripts/check_no_legacy_staking_path_as_ssot.py
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable


ROOT = Path(
    subprocess.check_output(["git", "rev-parse", "--show-toplevel"], text=True).strip()
)
DEFAULT_RULES_PATH = ROOT / "config" / "ci" / "legacy_path_ssot_rules.v1.json"


@dataclass(frozen=True)
class GateRule:
    rule_id: str
    description: str
    hit_patterns: tuple[re.Pattern[str], ...]
    allow_structured: tuple[re.Pattern[str], ...]
    allow_line_fallback: re.Pattern[str] | None
    suggestion: str


@dataclass(frozen=True)
class GateConfig:
    scan_roots: tuple[str, ...]
    text_suffixes: frozenset[str]
    skip_path_contains: tuple[str, ...]
    rules: tuple[GateRule, ...]


@dataclass(frozen=True)
class Violation:
    path: Path
    lineno: int
    line: str
    rule_id: str
    suggestion: str


def _compile_list(patterns: Iterable[str], flags: int) -> tuple[re.Pattern[str], ...]:
    out: list[re.Pattern[str]] = []
    for i, p in enumerate(patterns):
        try:
            out.append(re.compile(p, flags))
        except re.error as e:
            raise ValueError(f"Invalid regex #{i} {p!r}: {e}") from e
    return tuple(out)


def _load_json(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def default_gate_config() -> GateConfig:
    """Embedded defaults if JSON is missing (sparse checkouts / bootstrap)."""
    raw: dict[str, Any] = {
        "scan_roots": ["docs/spec", "docs", "crates", "contracts"],
        "text_suffixes": [
            ".md",
            ".rs",
            ".sol",
            ".toml",
            ".yml",
            ".yaml",
            ".sh",
            ".ps1",
            ".json",
        ],
        "skip_path_contains": [
            "node_modules",
            "/target/",
            "\\target\\",
            "/.git/",
            "\\.git\\",
            ".git/",
            "/contracts/lib/",
            "\\contracts\\lib\\",
            "contracts/lib/",
            "/contracts/out/",
            "\\contracts\\out\\",
            "contracts/out/",
            "verification-evidence",
        ],
        "rules": [
            {
                "id": "monolithic_staking_removed",
                "enabled": True,
                "description": "Legacy single-file staking removed.",
                "hit_regexes": [
                    r"(?<![A-Za-z0-9_])Staking\.sol",
                    r"contracts/src/Staking",
                ],
                "allow_structured_regexes": [
                    r"Staking\.sol.*(已移除|legacy|旧|removed|obsolete|deprecated)",
                    r"(已移除|legacy|旧|removed|obsolete|deprecated).*Staking\.sol",
                    r"contracts/src/Staking.*(已移除|legacy|旧|removed|obsolete|deprecated)",
                    r"(已移除|legacy|旧|removed|obsolete|deprecated).*contracts/src/Staking",
                    r"Staking\.sol\s*（[^）]{0,64}已移除[^）]{0,64}）",
                    r"（[^）]{0,64}已移除[^）]{0,64}）\s*Staking\.sol",
                ],
                "allow_line_fallback_regex": (
                    r"已移除|已删除|已下线|已从仓库|已从树|removed\s+from|no\s+longer|"
                    r"legacy|obsolete|deprecated|historical|审计时点|不得|仅作历史|历史兼容|"
                    r"旧单文件|旧版|旧\s*`|`\s*旧|向后兼容|compatible|该文件已移除|叙述下线|"
                    r"与历史|静默.*旧|旧.*Staking\.sol|Staking\.sol.*已移除|"
                    r"contracts/src/Staking.*已移除|已移除.*contracts/src/Staking"
                ),
                "suggestion": (
                    "SSOT: contracts/src/IdentityStakingPool.sol + "
                    "GuideIdentityStakingPool.sol / ProviderIdentityStakingPool.sol; "
                    "same-line markers: removed/legacy/已移除/旧 (see config/ci/legacy_path_ssot_rules.v1.json)."
                ),
            }
        ],
    }
    return load_gate_config_from_raw(raw)


def load_gate_config_from_raw(raw: dict[str, Any]) -> GateConfig:
    """Build GateConfig from a rules dict (same shape as JSON file)."""
    rules_out: list[GateRule] = []
    for r in raw.get("rules", []):
        if not r.get("enabled", True):
            continue
        rid = str(r["id"])
        desc = str(r.get("description", ""))
        hits = _compile_list(r["hit_regexes"], re.UNICODE)
        allow_s = _compile_list(
            r.get("allow_structured_regexes", []),
            re.IGNORECASE | re.UNICODE,
        )
        fb_raw = r.get("allow_line_fallback_regex")
        fb: re.Pattern[str] | None
        if fb_raw:
            fb = re.compile(str(fb_raw), re.IGNORECASE | re.UNICODE)
        else:
            fb = None
        sug = str(r.get("suggestion", "")).strip() or (
            "Remove or qualify the legacy path on this line (see project SSOT docs)."
        )
        rules_out.append(
            GateRule(
                rule_id=rid,
                description=desc,
                hit_patterns=hits,
                allow_structured=allow_s,
                allow_line_fallback=fb,
                suggestion=sug,
            )
        )
    if not rules_out:
        raise ValueError("No enabled rules in config")
    roots = tuple(str(x) for x in raw["scan_roots"])
    suffixes = frozenset(str(x).lower() for x in raw["text_suffixes"])
    skips = tuple(str(x) for x in raw.get("skip_path_contains", ()))
    return GateConfig(
        scan_roots=roots,
        text_suffixes=suffixes,
        skip_path_contains=skips,
        rules=tuple(rules_out),
    )


def load_gate_config(path: Path) -> GateConfig:
    return load_gate_config_from_raw(_load_json(path))


def resolve_config_path() -> Path:
    env = os.environ.get("LEGACY_PATH_SSOT_RULES", "").strip()
    if env:
        p = Path(env)
        if not p.is_absolute():
            p = ROOT / p
        return p
    return DEFAULT_RULES_PATH


def skip_path(rel: Path, skips: tuple[str, ...]) -> bool:
    parts = rel.parts
    if ".git" in parts:
        return True
    s = str(rel).replace("\\", "/")
    for frag in skips:
        if frag in s or frag in str(rel):
            return True
    return False


def line_allowed(rule: GateRule, line: str) -> bool:
    if any(p.search(line) for p in rule.allow_structured):
        return True
    if rule.allow_line_fallback and rule.allow_line_fallback.search(line):
        return True
    return False


def violations_for_file(path: Path, text: str, cfg: GateConfig) -> list[Violation]:
    out: list[Violation] = []
    rel = path.relative_to(ROOT)
    if skip_path(rel, cfg.skip_path_contains):
        return out
    if path.suffix.lower() not in cfg.text_suffixes:
        return out
    for lineno, line in enumerate(text.splitlines(), 1):
        for rule in cfg.rules:
            hit = False
            for hp in rule.hit_patterns:
                if hp.search(line):
                    hit = True
                    break
            if not hit:
                continue
            if line_allowed(rule, line):
                continue
            out.append(
                Violation(
                    path=rel,
                    lineno=lineno,
                    line=line.rstrip()[:400],
                    rule_id=rule.rule_id,
                    suggestion=rule.suggestion,
                )
            )
            break
    return out


def scan(cfg: GateConfig) -> list[Violation]:
    all_v: list[Violation] = []
    for rel in cfg.scan_roots:
        base = ROOT / rel
        if not base.exists():
            continue
        for path in base.rglob("*"):
            if not path.is_file():
                continue
            try:
                text = path.read_text(encoding="utf-8", errors="replace")
            except OSError:
                continue
            all_v.extend(violations_for_file(path, text, cfg))
    return all_v


def main() -> int:
    cfg_path = resolve_config_path()
    try:
        cfg = load_gate_config(cfg_path) if cfg_path.is_file() else default_gate_config()
        src = str(cfg_path) if cfg_path.is_file() else "<embedded defaults>"
    except (OSError, ValueError, json.JSONDecodeError, KeyError) as e:
        print(f"ERROR: cannot load gate config: {e}", file=sys.stderr)
        return 2

    viol = scan(cfg)
    if not viol:
        print(
            f"legacy_path_ssot_gates: OK ({len(cfg.rules)} rule(s), "
            f"roots={','.join(cfg.scan_roots)}, config={src})"
        )
        return 0

    print(
        "ERROR: legacy path cited without same-line deprecation / structured allow pattern.\n",
        file=sys.stderr,
    )
    for v in viol:
        print(f"[ERROR] {v.path}:{v.lineno}  rule={v.rule_id}", file=sys.stderr)
        print(f"  line: {v.line}", file=sys.stderr)
        print(f"  suggestion: {v.suggestion}", file=sys.stderr)
        print("", file=sys.stderr)
    print(f"Total: {len(viol)} violation(s). Config: {src}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
