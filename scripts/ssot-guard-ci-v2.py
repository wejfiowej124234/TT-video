#!/usr/bin/env python3
# B-184 compat: forwards to scripts/gates/ssot-guard-ci-v2.py
import subprocess, sys
from pathlib import Path
_here = Path(__file__).resolve().parent
_target = _here / "gates" / "ssot-guard-ci-v2.py"
raise SystemExit(subprocess.call([sys.executable, str(_target)] + sys.argv[1:]))
