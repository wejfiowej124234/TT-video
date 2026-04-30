#!/usr/bin/env python3
"""Print a single KEY=value from repo-root .env (first match). No shell heredocs."""
from __future__ import annotations

import re
import sys
from pathlib import Path


def main() -> None:
    if len(sys.argv) != 3:
        print("usage: read_dotenv_value.py <path-to-.env> <KEY>", file=sys.stderr)
        sys.exit(2)
    path = Path(sys.argv[1])
    key = sys.argv[2]
    if not path.is_file():
        sys.exit(0)
    text = path.read_text(encoding="utf-8", errors="replace")
    pat = re.compile(rf"^{re.escape(key)}=(.*)$", flags=re.MULTILINE)
    m = pat.search(text)
    if not m:
        sys.exit(0)
    val = m.group(1).strip().strip('"').strip("'").strip()
    print(val, end="")


if __name__ == "__main__":
    main()
