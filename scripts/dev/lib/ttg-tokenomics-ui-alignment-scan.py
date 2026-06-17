#!/usr/bin/env python3
"""TTG Tokenomics UI Alignment — §6 forbidden narrative scan (locales + governance pages)."""
from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(os.environ.get("TTG_UI_AUDIT_ROOT", ".")).resolve()
EVID = Path(os.environ["TTG_UI_AUDIT_EVID"])

FORBIDDEN_PATTERNS: list[tuple[str, str]] = [
    (r"HolderDividendVault", "§6 · HolderDividendVault"),
    (r"按持有比例分给", "§6 · 按持有比例分给"),
    (r"按\s*TTG\s*持仓\s*自动\s*发现金", "§6 · 自动按 TTG 持仓发现金"),
    (r"刚性\s*USDC\s*兑付", "§6 · 刚性 USDC 兑付"),
    (r"GlobalPoolDistributionSection", "已删组件 · GlobalPoolDistributionSection"),
    (r"(?<![\w—-])pro-rata to all TTG holders", "§6 · pro-rata to all TTG holders"),
    (r"goes to other TTG holders", "§6 · goes to other TTG holders (cash narrative)"),
]

ALLOWED_NEGATION = [
    "does not automatically",
    "no automatic",
    "not automatic",
    "not pro-rata",
    "—not",
    "— not",
    "不等同",
    "非自动",
    "禁止自动",
    "【已废止】",
    "[Deprecated]",
    "replaces legacy pro-rata",
    "已取代旧 pro-rata",
    "Remove pro-rata",
    "清除 pro-rata",
]

DEPRECATED_KEY_MARKERS = [
    "deprecated",
    "_deprecated_",
    "global_pool_formula_deprecated",
    "global_pool_holder_note",
    "global_pool_table_heading",
]


def is_deprecated_context(line: str, key_hint: str = "") -> bool:
    blob = f"{line} {key_hint}"
    return any(m in blob for m in DEPRECATED_KEY_MARKERS)


def scan() -> list[dict]:
    targets = [
        ROOT / "frontend/locales/zh.ts",
        ROOT / "frontend/locales/en.ts",
        ROOT / "frontend/app/governance",
        ROOT / "frontend/components/governance",
    ]
    findings: list[dict] = []
    for pat, reason in FORBIDDEN_PATTERNS:
        rx = re.compile(pat, re.IGNORECASE)
        for base in targets:
            files = [base] if base.is_file() else list(base.rglob("*"))
            for fp in files:
                if not fp.is_file() or fp.suffix not in {".ts", ".tsx"}:
                    continue
                try:
                    lines = fp.read_text(encoding="utf-8", errors="replace").splitlines()
                except OSError:
                    continue
                for i, line in enumerate(lines, 1):
                    if not rx.search(line):
                        continue
                    if any(neg in line for neg in ALLOWED_NEGATION):
                        continue
                    if is_deprecated_context(line):
                        continue
                    findings.append(
                        {
                            "pattern": pat,
                            "reason": reason,
                            "file": str(fp.relative_to(ROOT)).replace("\\", "/"),
                            "line": i,
                            "excerpt": line.strip()[:200],
                            "status": "FAIL",
                        }
                    )
    return findings


def main() -> int:
    EVID.mkdir(parents=True, exist_ok=True)
    findings = scan()
    out = {"hits": findings, "hit_count": len(findings), "verdict": "PASS" if not findings else "FAIL"}
    (EVID / "forbidden-narrative-scan.json").write_text(json.dumps(out, indent=2), encoding="utf-8")
    print(json.dumps(out, indent=2))
    if findings:
        print(f"FORBIDDEN_NARRATIVE_HITS: {len(findings)}", file=sys.stderr)
        return 1
    print("FORBIDDEN_NARRATIVE_SCAN: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
