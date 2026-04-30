#!/usr/bin/env python3
"""
Machine-runnable Tier B/C gates for 96-15 orchestration (replaces MANUAL_REQUIRED when enabled).

Each gate returns PASS | FAIL with captured stdout/stderr. No spec writes — read-only checks
against repo paths + one optional subprocess (04 routes gate).

CLI (repo root):
  python scripts/release/tier_bc_machine_gates.py --repo-root . --evidence-out evidence/GO_x/deep_evidence
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

_p = Path(__file__).resolve().parent
if str(_p) not in sys.path:
    sys.path.insert(0, str(_p))
from win_bash import bash_exe  # noqa: E402


@dataclass
class GateResult:
    status: str  # PASS | FAIL
    stdout: str
    stderr: str
    exit_code: int
    commands: list[str]


def _lines(msg: str) -> str:
    return msg.strip() + "\n" if msg.strip() else ""


def gate_b4(repo_root: Path) -> GateResult:
    """66 / 51 / 53 spec anchors present (read-only)."""
    _s = Path("docs") / "spec"
    rels = [
        (_s / "66-深度检查-缺口与遗留问题.md").as_posix(),
        (_s / "51-阶段开发技术文档.md").as_posix(),
        (_s / "53-阶段开发技术文档.md").as_posix(),
    ]
    missing: list[str] = []
    for r in rels:
        p = repo_root / r
        if not p.is_file():
            missing.append(r)
    cmd = ["python", "scripts/release/tier_bc_machine_gates.py", "--gate", "b4"]
    if missing:
        return GateResult(
            "FAIL",
            _lines("missing:\n" + "\n".join(missing)),
            "",
            1,
            cmd,
        )
    return GateResult("PASS", _lines("ok: " + ", ".join(rels)), "", 0, cmd)


def gate_b5(repo_root: Path) -> GateResult:
    """27-P0 checklist present and non-trivial size."""
    rel = (Path("docs") / "spec" / "27-P0至P50开发流程勾选清单.md").as_posix()
    p = repo_root / rel
    cmd = ["python", "scripts/release/tier_bc_machine_gates.py", "--gate", "b5"]
    if not p.is_file():
        return GateResult("FAIL", _lines(f"missing: {rel}"), "", 1, cmd)
    sz = p.stat().st_size
    if sz < 4000:
        return GateResult(
            "FAIL",
            _lines(f"too_small: {rel} bytes={sz} (min 4000)"),
            "",
            1,
            cmd,
        )
    return GateResult("PASS", _lines(f"ok: {rel} bytes={sz}"), "", 0, cmd)


def gate_c6(repo_root: Path) -> GateResult:
    """Frontend route entrypoints exist (smoke)."""
    pat = "frontend/app/**/page.tsx"
    pages = list((repo_root / "frontend/app").rglob("page.tsx"))
    cmd = ["python", "scripts/release/tier_bc_machine_gates.py", "--gate", "c6"]
    n = len(pages)
    if n < 5:
        return GateResult(
            "FAIL",
            _lines(f"page.tsx count={n} under frontend/app (min 5); pattern {pat}"),
            "",
            1,
            cmd,
        )
    return GateResult("PASS", _lines(f"ok: page.tsx count={n}"), "", 0, cmd)


def gate_c7(repo_root: Path) -> GateResult:
    """04 vs app routes gate (real command)."""
    bx = bash_exe()
    cmd = [bx, str(repo_root / "scripts/run-check-04-routes.sh")]
    try:
        proc = subprocess.run(
            cmd,
            cwd=repo_root,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=900,
        )
    except Exception as e:
        return GateResult("FAIL", "", str(e), 1, cmd)
    ok = proc.returncode == 0
    st = "PASS" if ok else "FAIL"
    return GateResult(
        st,
        proc.stdout or "",
        proc.stderr or "",
        proc.returncode,
        cmd,
    )


GATES = {"b4": gate_b4, "b5": gate_b5, "c6": gate_c6, "c7": gate_c7}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo-root", type=Path, default=Path("."))
    ap.add_argument("--evidence-out", type=Path, default=None, help="Write tier_bc_gate.log")
    ap.add_argument("--gate", choices=sorted(GATES.keys()))
    args = ap.parse_args()
    root = args.repo_root.resolve()
    fn = GATES[args.gate]
    r = fn(root)
    if args.evidence_out:
        args.evidence_out.parent.mkdir(parents=True, exist_ok=True)
        log = (
            f"status={r.status}\nexit_code={r.exit_code}\ncommands={r.commands!r}\n"
            f"=== stdout ===\n{r.stdout}\n=== stderr ===\n{r.stderr}\n"
        )
        args.evidence_out.write_text(log, encoding="utf-8")
    print(r.stdout, end="")
    if r.stderr:
        print(r.stderr, end="", file=sys.stderr)
    return 0 if r.status == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
