"""B-478：基线 JSON 内容 SHA-256（排除 content_sha256 字段，UTF-8 canonical）。"""
from __future__ import annotations

import hashlib
import json
from typing import Any


def b478_canonical_sha256(data: dict[str, Any]) -> str:
    body = {k: v for k, v in data.items() if k != "content_sha256"}
    s = json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(s.encode("utf-8")).hexdigest()
