#!/usr/bin/env python3
# B-184 compat: forwards to scripts/gates/check-13-1-routes-covered-by-04-frontend-table.py
import subprocess, sys
from pathlib import Path
_here = Path(__file__).resolve().parent
_target = _here / "gates" / "check-13-1-routes-covered-by-04-frontend-table.py"
raise SystemExit(subprocess.call([sys.executable, str(_target)] + sys.argv[1:]))
