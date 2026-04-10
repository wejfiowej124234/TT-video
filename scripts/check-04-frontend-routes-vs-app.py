#!/usr/bin/env python3
# B-184 compat: forwards to scripts/gates/check-04-frontend-routes-vs-app.py
import subprocess, sys
from pathlib import Path
_here = Path(__file__).resolve().parent
_target = _here / "gates" / "check-04-frontend-routes-vs-app.py"
raise SystemExit(subprocess.call([sys.executable, str(_target)] + sys.argv[1:]))
