#!/usr/bin/env python3
"""Shared helpers for OED / CDA deep audit probes."""
from __future__ import annotations

import json
import os
import subprocess
import urllib.error
import urllib.request
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[3]


def git_sha() -> str:
    try:
        return (
            subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True, stderr=subprocess.DEVNULL)
            .strip()
        )
    except Exception:
        return "unknown"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class ProbeResult:
    probe_id: str
    role: str
    step: str
    method: str
    path: str
    http: int
    expected: str
    status: str
    notes: str = ""
    section: str = "probes"
    extra: dict[str, Any] = field(default_factory=dict)

    def as_row(self) -> dict[str, Any]:
        row = {
            "probe_id": self.probe_id,
            "role": self.role,
            "step": self.step,
            "method": self.method,
            "path": self.path,
            "http": self.http,
            "expected": self.expected,
            "status": self.status,
            "notes": self.notes,
            "section": self.section,
        }
        row.update(self.extra)
        return row


class HttpClient:
    def __init__(self, base: str, password: str = "Test123!"):
        self.base = base.rstrip("/")
        self.password = password
        self.tokens: dict[str, str] = {}

    def request(
        self,
        method: str,
        path: str,
        *,
        body: dict | None = None,
        token: str | None = None,
        timeout: int = 45,
        idempotency_key: str | None = None,
    ) -> tuple[int, Any]:
        url = path if path.startswith("http") else f"{self.base}{path}"
        data = None
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        if idempotency_key:
            headers["Idempotency-Key"] = idempotency_key
        if body is not None:
            data = json.dumps(body).encode()
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                raw = resp.read().decode("utf-8", errors="replace")
                return resp.status, json.loads(raw) if raw.strip() else {}
        except urllib.error.HTTPError as e:
            raw = e.read().decode("utf-8", errors="replace")
            try:
                payload = json.loads(raw) if raw.strip() else {}
            except json.JSONDecodeError:
                payload = {"raw": raw[:500]}
            return e.code, payload
        except Exception as exc:  # noqa: BLE001
            return 0, {"error": str(exc)}

    def login_or_register(self, email: str, nickname: str, role_hint: str | None = None) -> tuple[str, dict]:
        code, payload = self.request(
            "POST",
            "/auth/register",
            body={"email": email, "password": self.password, "nickname": nickname},
        )
        if code in (200, 201):
            tok = payload.get("token") or ""
            return tok, payload
        if code == 409 or (isinstance(payload, dict) and payload.get("error") == "email_already_registered"):
            code2, payload2 = self.request("POST", "/auth/login", body={"email": email, "password": self.password})
            if code2 != 200:
                raise RuntimeError(f"login {email} HTTP {code2}: {payload2}")
            return payload2.get("token") or "", payload2
        raise RuntimeError(f"register {email} HTTP {code}: {payload}")

    def seed(self) -> None:
        code, payload = self.request("POST", "/auth/seed-test-accounts", body={})
        if code not in (200, 201, 409):
            raise RuntimeError(f"seed HTTP {code}: {payload}")

    def nested(self, obj: Any, key: str) -> Any:
        cur = obj
        for part in key.split("."):
            if not isinstance(cur, dict):
                return None
            cur = cur.get(part)
        return cur

    def record(
        self,
        results: list[ProbeResult],
        *,
        probe_id: str,
        role: str,
        step: str,
        method: str,
        path: str,
        http: int,
        expected: str,
        ok: bool,
        notes: str = "",
        section: str = "probes",
        **extra: Any,
    ) -> None:
        results.append(
            ProbeResult(
                probe_id=probe_id,
                role=role,
                step=step,
                method=method,
                path=path,
                http=http,
                expected=expected,
                status="PASS" if ok else "FAIL",
                notes=notes,
                section=section,
                extra=extra,
            )
        )

    def write_findings(
        self,
        out_dir: Path,
        *,
        audit_name: str,
        results: list[ProbeResult],
        trace: dict[str, Any],
        api_base: str,
    ) -> dict[str, Any]:
        fails = [r for r in results if r.status != "PASS"]
        p0 = sum(1 for r in fails if r.extra.get("severity") == "P0")
        p1 = sum(1 for r in fails if r.extra.get("severity") == "P1")
        p2 = len(fails) - p0 - p1
        findings = {
            "audit": audit_name,
            "verdict": "PASS" if not fails else "FAIL",
            "recorded_at": now_iso(),
            "api_base": api_base,
            "git_sha": git_sha(),
            "p0": p0,
            "p1": p1,
            "p2": p2 if fails else 0,
            "summary": {
                "total": len(results),
                "pass": len(results) - len(fails),
                "fail": len(fails),
            },
            "probes": [r.as_row() for r in results],
            "issues": [
                {
                    "probe_id": r.probe_id,
                    "severity": r.extra.get("severity", "P0" if r.section == "probes" else "P1"),
                    "detail": r.notes or f"HTTP {r.http} expected {r.expected}",
                }
                for r in fails
            ],
        }
        out_dir.mkdir(parents=True, exist_ok=True)
        (out_dir / f"{audit_name.split('_')[0]}-trace.json").write_text(json.dumps(trace, indent=2), encoding="utf-8")
        partial = out_dir / f"{audit_name.split('_')[0]}-findings-partial.json"
        partial.write_text(json.dumps(findings, indent=2), encoding="utf-8")
        return findings


def load_env_database_url() -> str | None:
    url = os.environ.get("DATABASE_URL")
    if url:
        return url
    env_file = ROOT / ".env"
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            line = line.split("#", 1)[0].strip()
            if line.startswith("DATABASE_URL="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    return None


def psql_query(sql: str) -> str | None:
    db = load_env_database_url()
    if not db:
        return None
    try:
        out = subprocess.check_output(
            ["psql", db, "-tA", "-v", "ON_ERROR_STOP=1", "-c", sql],
            text=True,
            stderr=subprocess.DEVNULL,
            timeout=30,
        )
        return out.strip()
    except Exception:
        return None


def new_email(prefix: str) -> str:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    return f"{prefix}-{stamp}-{uuid.uuid4().hex[:6]}@example.com"
