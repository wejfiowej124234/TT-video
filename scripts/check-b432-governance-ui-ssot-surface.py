#!/usr/bin/env python3
# B-184 compat: forwards to scripts/gates/check-b432-governance-ui-ssot-surface.py
import subprocess
import sys
from pathlib import Path

_here = Path(__file__).resolve().parent
_target = _here / "gates" / "check-b432-governance-ui-ssot-surface.py"
raise SystemExit(subprocess.call([sys.executable, str(_target)] + sys.argv[1:]))
