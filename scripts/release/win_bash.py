"""Resolve a usable bash.exe on Windows (avoid WSL shims that break non-interactive runs)."""

from __future__ import annotations

import os
import shutil
from pathlib import Path


def bash_exe() -> str:
    env = os.environ.get("GIT_BASH") or os.environ.get("BASH_EXE")
    if env:
        p = Path(env)
        if p.is_file():
            return str(p)
    pf = os.environ.get("ProgramFiles")
    if pf:
        for sub in ("Git/bin/bash.exe", "Git/usr/bin/bash.exe"):
            p = Path(pf) / sub
            if p.is_file():
                return str(p)
    for fixed in (
        r"C:\Program Files\Git\bin\bash.exe",
        r"C:\Program Files (x86)\Git\bin\bash.exe",
    ):
        p = Path(fixed)
        if p.is_file():
            return str(p)
    w = shutil.which("bash")
    return w or "bash"
