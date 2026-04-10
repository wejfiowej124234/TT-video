#!/usr/bin/env python3
# B-184 compat: forwards to scripts/dev/verify-abi-forge.py
import subprocess, sys
from pathlib import Path
_here = Path(__file__).resolve().parent
_target = _here / "dev" / "verify-abi-forge.py"
raise SystemExit(subprocess.call([sys.executable, str(_target)] + sys.argv[1:]))
