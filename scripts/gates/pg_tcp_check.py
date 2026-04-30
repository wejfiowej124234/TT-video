#!/usr/bin/env python3
"""Exit 0 if DATABASE_URL host:port accepts TCP; else 1."""
from __future__ import annotations

import os
import socket
import sys
from urllib.parse import urlparse


def main() -> None:
    u = urlparse(os.environ.get("DATABASE_URL", ""))
    if not u.hostname:
        sys.exit(1)
    host, port = u.hostname, u.port or 5432
    s = socket.socket()
    s.settimeout(2.0)
    try:
        s.connect((host, port))
    except OSError:
        sys.exit(1)
    else:
        sys.exit(0)
    finally:
        try:
            s.close()
        except OSError:
            pass


if __name__ == "__main__":
    main()
