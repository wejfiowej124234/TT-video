#!/usr/bin/env python3
"""重算 config/b482_financial_correctness_gate.v1.json 的 content_sha256。"""
from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

_gate_dir = Path(__file__).resolve().parent
_spec = importlib.util.spec_from_file_location("b478_baseline_hash", _gate_dir / "_b478_baseline_hash.py")
_mod = importlib.util.module_from_spec(_spec)
assert _spec.loader is not None
_spec.loader.exec_module(_mod)
b478_canonical_sha256 = _mod.b478_canonical_sha256


def main() -> int:
    root = Path(__file__).resolve().parent.parent.parent
    path = root / "config" / "b482_financial_correctness_gate.v1.json"
    if not path.is_file():
        print(f"missing {path}", file=sys.stderr)
        return 1
    data = json.loads(path.read_text(encoding="utf-8"))
    data["content_sha256"] = b478_canonical_sha256(data)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(data["content_sha256"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
