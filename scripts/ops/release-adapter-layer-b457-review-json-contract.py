#!/usr/bin/env python3
"""B-457: execution adapter layer after B-456 — Feature Flag / deploy dispatch / ChatOps (Slack incoming).

Default `--dry-run`: writes `execution_receipt.json` only (auditable plan, no network).

`--execute`: perform HTTP calls when required env vars are set; otherwise each invocation is
`skipped_missing_env` (still archived for audit).

Secrets: never read from disk in-repo; only `os.environ[ name ]` where `name` comes from config.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def _root() -> Path:
    return Path(__file__).resolve().parent.parent.parent


def _load_json(p: Path) -> dict[str, Any]:
    return json.loads(p.read_text(encoding="utf-8"))


def _template(s: str, ctx: dict[str, str]) -> str:
    out = s
    for k, v in ctx.items():
        out = out.replace("{{" + k + "}}", v)
    return out


def _http_json(
    url: str,
    method: str,
    body: dict[str, Any] | None,
    headers: dict[str, str],
    timeout_s: float = 30.0,
) -> tuple[int, str]:
    data = json.dumps(body, ensure_ascii=False).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, method=method.upper(), headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout_s) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            return resp.getcode(), raw[:4096]
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace") if e.fp else ""
        return e.code, raw[:4096]
    except OSError as e:
        return -1, str(e)


def _invoke_slack(defn: dict[str, Any], ctx: dict[str, str], execute: bool) -> dict[str, Any]:
    envn = defn.get("env_webhook_url")
    text = _template(defn.get("text_template", ""), ctx)
    if not envn:
        return {"status": "error", "detail": "missing env_webhook_url in adapter def"}
    url = os.environ.get(envn)
    if not url:
        return {
            "status": "skipped_missing_env" if execute else "dry_run",
            "env": envn,
            "would_post": {"text": text},
        }
    if not execute:
        return {"status": "dry_run", "env": envn, "would_post": {"text": text}}
    code, body = _http_json(
        url,
        "POST",
        {"text": text},
        {"Content-Type": "application/json"},
    )
    return {"status": "http_done", "http_status": code, "response_excerpt": body}


def _invoke_admin_http(defn: dict[str, Any], ctx: dict[str, str], execute: bool) -> dict[str, Any]:
    base = defn.get("env_base_url")
    if not base:
        return {"status": "error", "detail": "missing env_base_url"}
    base_url = os.environ.get(base)
    path = str(defn.get("path", "/"))
    body = defn.get("body")
    if isinstance(body, dict):
        body = json.loads(_template(json.dumps(body), ctx))
    url = (base_url or "").rstrip("/") + path
    headers: dict[str, str] = {"Content-Type": "application/json"}
    bearer = os.environ.get("TRAVELTRUST_ADMIN_API_BEARER")
    if bearer:
        headers["Authorization"] = f"Bearer {bearer}"
    henv = defn.get("headers_env_json")
    if henv and os.environ.get(henv):
        try:
            extra = json.loads(os.environ[henv])
            if isinstance(extra, dict):
                for k, v in extra.items():
                    if isinstance(v, str):
                        headers[k] = v
        except json.JSONDecodeError:
            pass
    if not base_url:
        return {
            "status": "skipped_missing_env" if execute else "dry_run",
            "env": base,
            "would_request": {"method": defn.get("method", "POST"), "url": url, "body": body},
        }
    if not execute:
        return {"status": "dry_run", "would_request": {"method": defn.get("method", "POST"), "url": url, "body": body}}
    code, resp = _http_json(url, str(defn.get("method", "POST")), body, headers)
    return {"status": "http_done", "http_status": code, "response_excerpt": resp}


def _invoke_dispatch(defn: dict[str, Any], ctx: dict[str, str], execute: bool) -> dict[str, Any]:
    envu = defn.get("env_url")
    url = os.environ.get(envu or "", "") if envu else ""
    body = defn.get("body")
    if isinstance(body, dict):
        body = json.loads(_template(json.dumps(body), ctx))
    headers = {"Content-Type": "application/json"}
    henv = defn.get("headers_env_json")
    if henv and os.environ.get(henv):
        try:
            extra = json.loads(os.environ[henv])
            if isinstance(extra, dict):
                for k, v in extra.items():
                    if isinstance(v, str):
                        headers[k] = v
        except json.JSONDecodeError:
            pass
    if not url:
        return {
            "status": "skipped_missing_env" if execute else "dry_run",
            "env": envu,
            "would_request": {"method": defn.get("method", "POST"), "body": body},
        }
    if not execute:
        return {"status": "dry_run", "would_request": {"method": defn.get("method", "POST"), "url": url, "body": body}}
    code, resp = _http_json(url, str(defn.get("method", "POST")), body, headers)
    return {"status": "http_done", "http_status": code, "response_excerpt": resp}


def _run_one(
    aid: str,
    defn: dict[str, Any],
    ctx: dict[str, str],
    execute: bool,
) -> dict[str, Any]:
    kind = defn.get("kind")
    base = {"adapter_id": aid, "category": defn.get("category"), "kind": kind}
    if kind == "slack_incoming_webhook":
        base.update(_invoke_slack(defn, ctx, execute))
    elif kind == "admin_http_json":
        base.update(_invoke_admin_http(defn, ctx, execute))
    elif kind == "dispatch_webhook":
        base.update(_invoke_dispatch(defn, ctx, execute))
    else:
        base["status"] = "error"
        base["detail"] = f"unknown kind {kind!r}"
    return base


def main() -> int:
    r = _root()
    ap = argparse.ArgumentParser(description="B-457 release adapter layer (audit receipts)")
    ap.add_argument("--verdict", required=True, choices=("GREEN", "YELLOW", "RED"))
    ap.add_argument(
        "--config",
        type=Path,
        default=r / "config" / "b457_review_json_contract_release_adapters.json",
    )
    ap.add_argument(
        "--evidence-dir",
        type=Path,
        required=True,
        help="Directory for execution_receipt.json (e.g. evidence/b457_release_controller_executions/run_*)",
    )
    ap.add_argument(
        "--execute",
        action="store_true",
        help="Perform HTTP when env vars are present; otherwise record skipped_missing_env",
    )
    args = ap.parse_args()

    try:
        cfg = _load_json(args.config)
    except (OSError, json.JSONDecodeError) as e:
        print(f"release-adapter-b457: {e}", file=sys.stderr)
        return 3
    if cfg.get("adapters_schema") != "b457_review_json_contract_release_adapters_v1":
        print("release-adapter-b457: adapters_schema mismatch", file=sys.stderr)
        return 3

    routes = cfg.get("verdict_routes") or {}
    catalog = cfg.get("adapters") or {}
    ids = routes.get(args.verdict) or []
    ctx = {
        "verdict": args.verdict,
        "run_id": os.environ.get("GITHUB_RUN_ID", "local"),
        "run_attempt": os.environ.get("GITHUB_RUN_ATTEMPT", "1"),
        "sha": os.environ.get("GITHUB_SHA", ""),
        "workflow": os.environ.get("GITHUB_WORKFLOW", ""),
    }
    invocations: list[dict[str, Any]] = []
    for aid in ids:
        defn = catalog.get(aid)
        if not defn:
            invocations.append({"adapter_id": aid, "status": "error", "detail": "undefined in adapters catalog"})
            continue
        invocations.append(_run_one(aid, defn, ctx, args.execute))

    receipt = {
        "receipt_schema": "b457_execution_receipt_v1",
        "verdict": args.verdict,
        "execute_mode": bool(args.execute),
        "generated_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "context": ctx,
        "invocations": invocations,
    }
    args.evidence_dir.mkdir(parents=True, exist_ok=True)
    out_path = args.evidence_dir / "execution_receipt.json"
    out_path.write_text(json.dumps(receipt, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(receipt, ensure_ascii=False, indent=2, sort_keys=True))
    try:
        disp = str(out_path.relative_to(r))
    except ValueError:
        disp = str(out_path)
    print(f"release-adapter-b457: wrote {disp}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
