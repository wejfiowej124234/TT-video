#!/usr/bin/env python3
"""
Fail if Staking.sol or contracts/src/Staking appears as an unqualified (current-path) reference.

Scans: docs/spec, docs, crates, contracts (text sources only).
Allowed on the same line: deprecation / legacy markers (已移除, legacy, 旧…, etc.).
"""
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(
    subprocess.check_output(["git", "rev-parse", "--show-toplevel"], text=True).strip()
)

SCAN_DIRS = ("docs/spec", "docs", "crates", "contracts")

TEXT_SUFFIXES = frozenset(
    {
        ".md",
        ".rs",
        ".sol",
        ".toml",
        ".yml",
        ".yaml",
        ".sh",
        ".ps1",
        ".json",
    }
)

# If any of these match the full line, the hit is treated as historical / non-SSOT.
ALLOW_LINE = re.compile(
    r"已移除|已删除|已下线|已从仓库|已从树|removed\s+from|no\s+longer|"
    r"legacy|obsolete|deprecated|historical|审计时点|不得|仅作历史|历史兼容|"
    r"旧单文件|旧版|旧\s*`|`\s*旧|向后兼容|compatible|该文件已移除|叙述下线|"
    r"与历史|静默.*旧|旧.*Staking\.sol|Staking\.sol.*已移除|"
    r"contracts/src/Staking.*已移除|已移除.*contracts/src/Staking",
    re.IGNORECASE | re.UNICODE,
)

# Avoid matching *Staking.sol legacy filenames (e.g. StubStaking.sol).
HIT_PATTERNS = (
    re.compile(r"(?<![A-Za-z0-9_])Staking\.sol"),
    re.compile(r"contracts/src/Staking"),
)


def skip_path(path: Path) -> bool:
    parts = path.parts
    s = str(path).replace("\\", "/")
    if "node_modules" in parts:
        return True
    if "/target/" in s or s.endswith("/target"):
        return True
    if ".git" in parts:
        return True
    # Vendored Solidity deps under contracts/
    if "/contracts/lib/" in s or s.startswith("contracts/lib/"):
        return True
    # Foundry / compiler artifacts (local or CI), not SSOT sources
    if "/contracts/out/" in s or s.startswith("contracts/out/"):
        return True
    # Frozen verification bundles; paths may mention Staking in JSON keys
    if "verification-evidence" in parts:
        return True
    return False


def main() -> int:
    violations: list[tuple[Path, int, str]] = []

    for rel in SCAN_DIRS:
        base = ROOT / rel
        if not base.exists():
            continue
        for path in base.rglob("*"):
            if not path.is_file():
                continue
            if path.suffix.lower() not in TEXT_SUFFIXES:
                continue
            if skip_path(path.relative_to(ROOT)):
                continue
            try:
                text = path.read_text(encoding="utf-8", errors="replace")
            except OSError:
                continue
            for lineno, line in enumerate(text.splitlines(), 1):
                if not any(p.search(line) for p in HIT_PATTERNS):
                    continue
                if ALLOW_LINE.search(line):
                    continue
                violations.append((path.relative_to(ROOT), lineno, line.rstrip()[:400]))

    if not violations:
        print("check_no_legacy_staking_path_as_ssot: OK (no unqualified Staking.sol / contracts/src/Staking references)")
        return 0

    print(
        "ERROR: legacy staking path used without deprecation markers on the same line.\n"
        "Fix: cite IdentityStakingPool / Guide+Provider pools as SSOT, or add same-line markers "
        "(e.g. removed/legacy/已移除/旧…).\n",
        file=sys.stderr,
    )
    for p, lineno, line in violations:
        print(f"  {p}:{lineno}: {line}", file=sys.stderr)
    print(
        f"\nTotal: {len(violations)} violation(s).",
        file=sys.stderr,
    )
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
