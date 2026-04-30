#!/usr/bin/env python3
"""
P-A helper: (1) docs/spec-path-dependency-migration-inventory.md §7 — no row marks
「默认可删 spec？」为单纯 **是** 与 **A** 类互斥； (2) registry YAML — every entry
classification in enum; every **A** entry target_location mentions **keep:**.

Exit 0 on success; stderr + exit 1 on contradiction.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("ERROR: PyYAML required", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
INV = ROOT / "docs" / "spec-path-dependency-migration-inventory.md"
YAML_PATH = ROOT / "registry" / "spec-path-dependencies.v1.yaml"


def parse_inv7_rows(text: str) -> list[tuple[str, str, str]]:
    out: list[tuple[str, str, str]] = []
    in_table = False
    for line in text.splitlines():
        if "| 聚合 id（= STATUS / 08 §3.1） |" in line:
            in_table = True
            continue
        if not in_table:
            continue
        if line.startswith("|---"):
            continue
        if not line.strip().startswith("|"):
            break
        parts = [p.strip() for p in line.split("|")]
        parts = [p for p in parts if p]
        if len(parts) < 5:
            continue
        raw_id = parts[0].strip("`")
        if not (raw_id.startswith("mig-3-1-") or raw_id.startswith("wf-")):
            continue
        cls = re.sub(r"[*`]", "", parts[2]).strip()
        del_cell = re.sub(r"[*`]", "", parts[3]).strip()
        out.append((raw_id, cls, del_cell))
    return out


def main() -> int:
    errs: list[str] = []
    inv_text = INV.read_text(encoding="utf-8")
    for mig_id, inv_cls, del_cell in parse_inv7_rows(inv_text):
        # A 类法定壳：默认可删列须显式含「否」（或「否（…」），禁止裸「是」
        if inv_cls == "A" and "否" not in del_cell:
            errs.append(f"§7 {mig_id}: A 类默认可删列须含「否」，实为 {del_cell!r}")
        if inv_cls == "B" and "否" not in del_cell and "仅生成物" not in del_cell:
            errs.append(f"§7 {mig_id}: B 类默认可删列异常: {del_cell!r}")

    data = yaml.safe_load(YAML_PATH.read_text(encoding="utf-8"))
    enum_cls = set(data.get("classification_enum", {}).keys())
    for i, ent in enumerate(data.get("entries", [])):
        if not isinstance(ent, dict):
            continue
        eid = ent.get("id", f"<entry {i}>")
        c = ent.get("classification")
        if c not in enum_cls:
            errs.append(f"{eid}: invalid classification {c!r}")
            continue
        if c == "A":
            tgt = str(ent.get("target_location", ""))
            if "keep:" not in tgt:
                errs.append(f"{eid}: classification A but target_location missing keep:: {tgt!r}")

    if errs:
        print("audit-inv7-vs-registry: FAIL", file=sys.stderr)
        for e in errs:
            print(e, file=sys.stderr)
        return 1
    print("audit-inv7-vs-registry: OK (§7 A/可删列 + registry A/keep:)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
