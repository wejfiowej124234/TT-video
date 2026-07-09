#!/usr/bin/env python3
"""
R-003：阶段 0（环境自证）→ 阶段 1（仅 A 域）→ 门禁 → 阶段 2（B 域 §2.0 五连）。
产出 evidence/GO_YYYYMMDD/ 下 report.json + 单条 request-response.redacted.json（脱敏）。

用法（staging 首轮）：
  python scripts/dev/r003_staging_full_regression.py ^
    --environment-name staging ^
    --api-base https://your-staging-api.example ^
    --out evidence/GO_20260418 ^
    --executor qa@example.com ^
    --a-email tourist@test.com --a-password '***' ^
    [--chain-mode chain_off] [--auth-mode bearer] [--database-url for ENV-DB-PROOF]

门禁：任一 A 域 FAIL/BLOCKED → 不写 B 域为 PASS，release_gate=NO_GO 并退出码 3。
B-MSG-002 若 501 → BLOCKED，可按 93 §7.1 记 PARTIAL_GO（若 A 全绿且其余 B 绿）。

环境名：staging 首轮须 --environment-name staging（勿用 localhost/::1 冒充 staging；
自定义域名若 DNS 仅解析到回环地址也会被拒绝，除非加 --warn-localhost）。
"""
from __future__ import annotations

import argparse
import ipaddress
import json
import os
import socket
import subprocess
import sys
import time
import uuid
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def http_json(
    method: str,
    url: str,
    headers: dict[str, str] | None = None,
    body: bytes | None = None,
) -> tuple[int, object]:
    merged: dict[str, str] = dict(headers or {})
    # localtunnel (*.loca.lt) may RST Python urllib without reminder header.
    if ".loca.lt" in url:
        merged.setdefault("Bypass-Tunnel-Reminder", "true")
        merged.setdefault("User-Agent", "TravelTrust-R003/1")
    merged.setdefault("User-Agent", "TravelTrust-R003/1")
    if method.upper() in ("POST", "PUT", "PATCH", "DELETE"):
        merged.setdefault("Idempotency-Key", str(uuid.uuid4()))

    def _parse_response(status: int, raw: str) -> tuple[int, object]:
        try:
            parsed: object = json.loads(raw) if raw.strip() else {}
        except json.JSONDecodeError:
            parsed = raw
        return status, parsed

    def _http_json_curl() -> tuple[int, object]:
        cmd = [
            "curl",
            "-sS",
            "--max-time",
            "120",
            "-w",
            "\n__HTTP_CODE__:%{http_code}",
            "-X",
            method,
        ]
        for k, v in merged.items():
            cmd.extend(["-H", f"{k}: {v}"])
        if body is not None:
            cmd.extend(["--data-binary", "@-"])
        cmd.append(url)
        last_err: BaseException | None = None
        for attempt in range(5):
            try:
                proc = subprocess.run(
                    cmd,
                    input=body,
                    capture_output=True,
                    timeout=130,
                    check=False,
                )
                out = proc.stdout.decode("utf-8", errors="replace")
                marker = "\n__HTTP_CODE__:"
                if marker in out:
                    raw, _, code_tail = out.rpartition(marker)
                    status = int(code_tail.strip() or "0")
                else:
                    raw = out
                    status = proc.returncode if proc.returncode else 0
                if status == 0 and proc.returncode != 0 and not raw.strip():
                    raise RuntimeError(f"curl exit {proc.returncode}: {proc.stderr.decode()[:200]}")
                return _parse_response(status, raw)
            except (subprocess.SubprocessError, TimeoutError, OSError, ValueError) as e:
                last_err = e
                if attempt < 4:
                    time.sleep(1.5 * (attempt + 1))
                    continue
                raise
        if last_err is not None:
            raise last_err
        raise RuntimeError("http_json_curl: unreachable")

    try:
        import requests  # type: ignore
    except ImportError:
        requests = None  # type: ignore

    if requests is not None:
        last_err: BaseException | None = None
        for attempt in range(5):
            try:
                resp = requests.request(
                    method,
                    url,
                    headers=merged,
                    data=body,
                    timeout=120,
                )
                return _parse_response(resp.status_code, resp.text)
            except requests.RequestException as e:
                last_err = e
                if attempt < 4:
                    time.sleep(1.5 * (attempt + 1))
                    continue
                # Windows → fly.dev long chains: curl is more stable than urllib3/ssl
                try:
                    return _http_json_curl()
                except Exception:
                    raise last_err
        if last_err is not None:
            try:
                return _http_json_curl()
            except Exception:
                raise last_err

    last_err = None
    for attempt in range(5):
        req = urllib.request.Request(url, data=body, method=method)
        for k, v in merged.items():
            req.add_header(k, v)
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                raw = r.read().decode("utf-8", errors="replace")
                return _parse_response(r.status, raw)
        except urllib.error.HTTPError as e:
            raw = e.read().decode("utf-8", errors="replace")
            return _parse_response(e.code, raw)
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            last_err = e
            if attempt < 4:
                time.sleep(1.5 * (attempt + 1))
                continue
            raise
    if last_err is not None:
        raise last_err
    raise RuntimeError("http_json: unreachable")


def write_json(path: Path, obj: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_or_merge_env_db_notes(out: Path, base: str) -> None:
    """
    首轮骨架写入 notes.md；若执行人已补长文（铁律① / 勾选表），禁止整文件覆盖，仅追加本次 api_base 锚点。
    """
    path = out / "ENV-DB-PROOF" / "notes.md"
    skeleton = (
        "## R-003 · 铁律① DB 持久化佐证（须人工补全）\n\n"
        "本目录机读片段见 `phase0_notes.autofill.json`。**首轮 staging 合格交付**要求：至少一条写路径在 **PostgreSQL** 上可二次验证（"
        "`sessions` / `orders` / `order_messages` / `users` 等与响应对齐）。\n\n"
        "**执行人请追加**（脱敏）：\n\n"
        "- 使用的查询或审计路径；\n"
        "- 与 `phase2/b_domain_chain.redacted.json` 中 `order_id`（若存在）对齐的结论。\n\n"
        f"- **api_base（本脚本）**：`{base}`\n"
    )
    if path.is_file():
        existing = path.read_text(encoding="utf-8")
        if "执行人勾选" in existing or len(existing) > 900:
            anchor = f"\n---\n\n## 机读追加（最后一次跑回归 · {utc_now_iso()}）\n\n- **api_base**：`{base}`\n"
            if f"`{base}`" not in existing:
                path.write_text(existing.rstrip() + anchor + "\n", encoding="utf-8")
            return
    path.write_text(skeleton, encoding="utf-8")


def write_r002_section4_backfill(out: Path, report: dict[str, Any], ev_root: str) -> None:
    """供 R-002 §4 / §4.1 引用：与 report.json cases[] 同源，勿手改结构（每次回归覆盖）。"""
    lines: list[str] = [
        "# R-003 → R-002 §4 机读回填（自动生成）\n\n",
        f"- **run_id**：`{report.get('run_id', '')}`\n",
        f"- **release_gate**：`{report.get('release_gate', '')}`\n",
        f"- **同源**：本仓库 `{ev_root}/report.json` 的 `cases[]`\n\n",
        "## 用例行（粘贴进 [R-002 §4](docs/spec/R-002-回归执行闭环与发布准入.md) 主表或作指针）\n\n",
        "| 93 用例 ID | 覆盖类型 | 仓库锚点（本轮证据） |\n",
        "|------------|----------|----------------------|\n",
    ]
    env = report.get("environment") if isinstance(report.get("environment"), dict) else {}
    envn = str(env.get("name", "unknown"))
    for c in report.get("cases") or []:
        cid = str(c.get("id", ""))
        st = str(c.get("status", ""))
        evp = str(c.get("evidence_path", ""))
        notes = str(c.get("notes", "")).replace("|", "\\|").replace("\n", " ")[:200]
        lines.append(f"| **{cid}** | **{envn} HTTP** `{st}` | `{evp}` · {notes} |\n")
    lines.append("\n")
    (out / "r002_section4_backfill.md").write_text("".join(lines), encoding="utf-8")


def redacted_bearer() -> dict[str, str]:
    return {"Authorization": "Bearer tts_[REDACTED]"}


def dns_only_loopback(hostname: str) -> bool | None:
    """
    True if every resolved IP for hostname is loopback.
    None if resolution fails or yields no parseable IPs (caller may continue; HTTP will still fail on typos).
    """
    if not hostname:
        return None
    try:
        infos = socket.getaddrinfo(hostname, None)
    except OSError:
        return None
    ips: list[ipaddress.IPv4Address | ipaddress.IPv6Address] = []
    for _fam, _type, _proto, _canon, sockaddr in infos:
        if not sockaddr:
            continue
        ip_str = sockaddr[0]
        try:
            ips.append(ipaddress.ip_address(ip_str))
        except ValueError:
            continue
    if not ips:
        return None
    return all(ip.is_loopback for ip in ips)


def meta_build_one_liner(meta_body: object) -> str:
    if not isinstance(meta_body, dict):
        return "(no /meta JSON)"
    b = meta_body.get("build")
    if not isinstance(b, dict):
        return "(no /meta.build)"
    parts: list[str] = []
    for k in ("git_sha", "compile_sha", "deployed_at", "rule"):
        v = b.get(k)
        if v is not None and str(v).strip():
            parts.append(f"{k}={v!r}")
    return ", ".join(parts) if parts else json.dumps(b, ensure_ascii=False)[:240]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--environment-name", required=True, choices=("local", "staging", "prod"))
    ap.add_argument("--api-base", required=True, help="e.g. https://api.staging.example (no trailing slash)")
    ap.add_argument("--out", type=Path, required=True, help="e.g. evidence/GO_20260418")
    ap.add_argument("--executor", default=os.environ.get("R003_EXECUTOR", "unset-executor"))
    ap.add_argument("--reviewer", default="")
    ap.add_argument("--chain-mode", choices=("chain_off", "testnet", "mainnet"), default=None)
    ap.add_argument("--auth-mode", choices=("cookie", "bearer", "mixed"), default="bearer")
    ap.add_argument("--a-email", default="tourist@test.com", help="A 域种子/测试账号")
    ap.add_argument("--a-password", default="Test123!")
    ap.add_argument(
        "--warn-localhost",
        action="store_true",
        help=(
            "Allow api-base that looks like local dev with environment-name=staging: "
            "hostname is localhost/127.0.0.1 OR DNS resolves only to loopback (e.g. *.localhost, "
            "mis-set hosts). Not valid for R-003 staging delivery."
        ),
    )
    ap.add_argument(
        "--skip-validate",
        action="store_true",
        help="Do not run scripts/validate-regression-report.py",
    )
    args = ap.parse_args()

    base = args.api_base.rstrip("/")
    parsed = urllib.parse.urlparse(base)
    host = parsed.hostname or ""
    if args.environment_name == "staging" and host in ("localhost", "127.0.0.1", "::1") and not args.warn_localhost:
        print(
            "ERROR: environment-name=staging with localhost/127.0.0.1/::1 — use --warn-localhost if intentional (not R-003 staging delivery).",
            file=sys.stderr,
        )
        return 2
    if args.environment_name == "staging" and host and not args.warn_localhost:
        loop_only = dns_only_loopback(host)
        if loop_only is True:
            print(
                f"ERROR: environment-name=staging but host {host!r} resolves only to loopback addresses "
                "(often a tunnel or hosts-file alias to local). Use real staging DNS or --warn-localhost for intentional local runs.",
                file=sys.stderr,
            )
            return 2

    print(
        "\n".join(
            [
                "======== R-003 regression target ========",
                f"  environment_name: {args.environment_name}",
                f"  api_base:         {base}",
                f"  host:             {host or '(empty)'}",
                "Heuristic: if A+B finish suspiciously fast and all green, re-check you are not hitting local/tunnel.",
                "==========================================\n",
            ]
        ),
        file=sys.stderr,
    )

    repo_root = Path(__file__).resolve().parents[2]
    out = args.out.resolve()
    out.mkdir(parents=True, exist_ok=True)
    (out / "ENV-DB-PROOF").mkdir(exist_ok=True)

    try:
        ev_root = str(out.relative_to(repo_root)).replace("\\", "/")
    except ValueError:
        ev_root = str(out).replace("\\", "/")

    def ev_path(folder: str) -> str:
        return f"{ev_root}/{folder}".replace("//", "/")

    started = utc_now_iso()
    cases: list[dict[str, Any]] = []
    a_failed = False

    def mark_a_fail() -> None:
        nonlocal a_failed
        a_failed = True

    def add_case(cid: str, status: str, folder: str, notes: str, blocker: bool | None = None) -> None:
        row: dict[str, Any] = {
            "id": cid,
            "status": status,
            "evidence_path": ev_path(folder),
            "notes": notes,
        }
        if blocker:
            row["blocker"] = True
        cases.append(row)

    # --- Phase 0
    h_code, h_body = http_json("GET", f"{base}/health")
    m_code, m_body = http_json("GET", f"{base}/meta")
    phase0_ok = h_code == 200 and m_code == 200
    write_json(
        out / "phase0" / "environment_snapshot.redacted.json",
        {
            "GET /health": {"http_status": h_code, "body": h_body},
            "GET /meta": {"http_status": m_code, "body": m_body},
        },
    )
    meta_has_build = isinstance(m_body, dict) and ("build" in m_body or "chain" in m_body)
    print(f"[r003] GET /meta fingerprint: {meta_build_one_liner(m_body)}", file=sys.stderr)
    a_env_pass = phase0_ok and meta_has_build
    add_case(
        "A-ENV-001",
        "PASS" if a_env_pass else "FAIL",
        "phase0",
        "阶段0：GET /health 200；GET /meta 200 且含 build/chain 等键",
    )
    if not a_env_pass:
        mark_a_fail()

    chain_mode = args.chain_mode
    if chain_mode is None and isinstance(m_body, dict):
        ch = m_body.get("chain")
        if isinstance(ch, dict) and ch.get("p3_chain_off") is True:
            chain_mode = "chain_off"
        elif isinstance(ch, dict) and ch.get("chain_id_configured"):
            chain_mode = "testnet"
    if chain_mode is None:
        chain_mode = "chain_off"

    db_proof = {
        "phase": "0",
        "note": "铁律①：须由执行人在 staging PG 完成至少一次写后读；可将脱敏 SQL 结论粘贴到 ENV-DB-PROOF/notes.md",
        "api_base": base,
        "hint": "可与主链订单 id / user id 对齐 SELECT（orders/users/order_messages/sessions）",
    }
    write_json(out / "ENV-DB-PROOF" / "phase0_notes.autofill.json", db_proof)
    write_or_merge_env_db_notes(out, base)

    # --- Phase 1: A domain (order matters; ends with logout)
    ae, apw = args.a_email, args.a_password

    # A-NEG-002
    c_me0, j_me0 = http_json("GET", f"{base}/api/v1/me")
    neg2_ok = c_me0 == 401
    write_json(
        out / "A-NEG-002" / "request-response.redacted.json",
        {
            "request": {"method": "GET", "url": f"{base}/api/v1/me"},
            "response": {"http_status": c_me0, "body": j_me0},
        },
    )
    add_case(
        "A-NEG-002",
        "PASS" if neg2_ok else "FAIL",
        "A-NEG-002",
        "无会话 GET /api/v1/me → 401",
    )
    if not neg2_ok:
        mark_a_fail()

    # A-NEG-001
    c_neg, j_neg = http_json(
        "POST",
        f"{base}/auth/login",
        {"Content-Type": "application/json"},
        json.dumps({"email": ae, "password": "WrongPassword999!"}).encode(),
    )
    neg1_ok = c_neg == 401
    write_json(
        out / "A-NEG-001" / "request-response.redacted.json",
        {
            "request": {
                "method": "POST",
                "url": f"{base}/auth/login",
                "body": {"email": ae, "password": "[REDACTED]"},
            },
            "response": {"http_status": c_neg, "body": j_neg},
        },
    )
    add_case(
        "A-NEG-001",
        "PASS" if neg1_ok else "FAIL",
        "A-NEG-001",
        "错误密码 → 401 invalid_credentials",
    )
    if not neg1_ok:
        mark_a_fail()

    # A-LOG-001 + token
    c_li, j_li = http_json(
        "POST",
        f"{base}/auth/login",
        {"Content-Type": "application/json"},
        json.dumps({"email": ae, "password": apw}).encode(),
    )
    token = ""
    if isinstance(j_li, dict):
        token = str(j_li.get("token") or "")
    log1_ok = c_li == 200 and bool(token)
    auth_h = {"Authorization": f"Bearer {token}"}

    c_me1, j_me1 = http_json("GET", f"{base}/api/v1/me", auth_h)
    write_json(
        out / "A-LOG-001" / "request-response.redacted.json",
        {
            "request_chain": [
                {
                    "method": "POST",
                    "url": f"{base}/auth/login",
                    "body": {"email": ae, "password": "[REDACTED]"},
                },
                {
                    "method": "GET",
                    "url": f"{base}/api/v1/me",
                    "headers": redacted_bearer(),
                },
            ],
            "response": {"login_http": c_li, "me_http": c_me1, "me_body": j_me1},
        },
    )
    add_case(
        "A-LOG-001",
        "PASS" if log1_ok and c_me1 == 200 else "FAIL",
        "A-LOG-001",
        "登录成功且 GET /api/v1/me 200",
    )
    if not (log1_ok and c_me1 == 200):
        mark_a_fail()

    # A-ME-001
    me_ok = c_me1 == 200 and isinstance(j_me1, dict)
    if me_ok:
        u = j_me1.get("user") if isinstance(j_me1.get("user"), dict) else {}
        me_ok = u.get("email") == ae
    write_json(
        out / "A-ME-001" / "request-response.redacted.json",
        {
            "request": {
                "method": "GET",
                "url": f"{base}/api/v1/me",
                "headers": redacted_bearer(),
            },
            "response": {"http_status": c_me1, "body": j_me1},
        },
    )
    add_case(
        "A-ME-001",
        "PASS" if me_ok else "FAIL",
        "A-ME-001",
        "GET /api/v1/me 字段与账号一致",
    )
    if not me_ok:
        mark_a_fail()

    # A-LOG-002
    c_me2, j_me2 = http_json("GET", f"{base}/api/v1/me", auth_h)
    log2_ok = c_me2 == 200
    write_json(
        out / "A-LOG-002" / "request-response.redacted.json",
        {
            "request_chain": [
                {"note": "同一会话第二次 GET /me", "headers": redacted_bearer()},
            ],
            "response": {"http_status": c_me2, "body": j_me2},
        },
    )
    add_case(
        "A-LOG-002",
        "PASS" if log2_ok else "FAIL",
        "A-LOG-002",
        "连续 GET /api/v1/me 200",
    )
    if not log2_ok:
        mark_a_fail()

    # A-LOG-003
    c_lo, j_lo = http_json(
        "POST",
        f"{base}/auth/logout",
        {**auth_h, "Content-Type": "application/json"},
        b"{}",
    )
    c_me3, j_me3 = http_json("GET", f"{base}/api/v1/me", auth_h)
    log3_ok = c_lo == 200 and c_me3 == 401
    log3_notes = "登出后原 token GET /me → 401（依赖服务端 delete_session）"
    if not log3_ok:
        if c_lo == 200 and c_me3 == 200:
            log3_notes += (
                " — FAIL：logout 200 但 token 仍有效。常见原因：监听端口上的 **旧二进制**（无会话删除逻辑）。"
                "处理：停止占用端口的 API → `cargo build -p traveltrust-api` → 用新二进制重启 → 重跑本脚本。"
            )
            print(
                "[r003] A-LOG-003: logout returned 200 but /api/v1/me still 200 — "
                "likely stale traveltrust-api binary; rebuild and restart before re-running.",
                file=sys.stderr,
            )
        elif c_lo != 200:
            log3_notes += f" — FAIL：POST /auth/logout HTTP {c_lo}（预期 200）。"
        else:
            log3_notes += f" — FAIL：登出后 GET /me HTTP {c_me3}（预期 401）。"
    write_json(
        out / "A-LOG-003" / "request-response.redacted.json",
        {
            "request_chain": [
                {
                    "method": "POST",
                    "url": f"{base}/auth/logout",
                    "headers": {**redacted_bearer(), "Content-Type": "application/json"},
                    "body": {},
                },
                {"method": "GET", "url": f"{base}/api/v1/me", "headers": redacted_bearer()},
            ],
            "response": {
                "logout_http": c_lo,
                "logout_body": j_lo,
                "me_after_http": c_me3,
                "me_after_body": j_me3,
            },
        },
    )
    add_case(
        "A-LOG-003",
        "PASS" if log3_ok else "FAIL",
        "A-LOG-003",
        log3_notes,
    )
    if not log3_ok:
        mark_a_fail()

    # --- Gate
    gate_path = out / "GATE_A_TO_B.md"
    gate_path.write_text(
        "## A→B 门禁\n\n"
        + ("- **通过**：计划内 A 域无 FAIL/BLOCKED，可进入阶段 2。\n" if not a_failed else "- **未通过**：存在 A 域 FAIL — 按 R-003 须停止，不将 B 记为 PASS。\n"),
        encoding="utf-8",
    )

    b_skipped = a_failed

    # --- Phase 2: B §2.0 五连（新用户主链，与 smoke-ab-core-chain 同序）
    if not a_failed:
        stamp = int(time.time())
        email_b = f"r003.go.{stamp}.{uuid.uuid4().hex[:8]}@example.com"
        password_b = os.environ.get("R003_B_PASSWORD", "R003StagingPass9!")

        reg_b = json.dumps(
            {"email": email_b, "password": password_b, "role": "traveler"}
        ).encode()
        c_reg, j_reg = http_json(
            "POST",
            f"{base}/auth/register",
            {"Content-Type": "application/json"},
            reg_b,
        )
        tok_b = ""
        if isinstance(j_reg, dict):
            tok_b = str(j_reg.get("token") or "")
        if c_reg != 200 or not tok_b:
            # try login path
            c_reg2, j_reg2 = http_json(
                "POST",
                f"{base}/auth/login",
                {"Content-Type": "application/json"},
                reg_b,
            )
            if c_reg2 == 200 and isinstance(j_reg2, dict):
                tok_b = str(j_reg2.get("token") or "")
        auth_b = {"Authorization": f"Bearer {tok_b}"}

        # B-MKT-001
        c_mk, j_mk = http_json("GET", f"{base}/api/v1/discover/orders", auth_b)
        b_mkt_ok = c_mk == 200
        write_json(
            out / "B-MKT-001" / "request-response.redacted.json",
            {"response": {"http_status": c_mk, "body": j_mk}},
        )
        add_case(
            "B-MKT-001",
            "PASS" if b_mkt_ok else "FAIL",
            "B-MKT-001",
            "GET /api/v1/discover/orders 200",
        )

        # B-GDE-001
        city_q = urllib.parse.quote("杭州")
        c_gl, j_gl = http_json("GET", f"{base}/api/v1/guides?city={city_q}")
        guide_id = ""
        if isinstance(j_gl, dict):
            items = j_gl.get("items") or []
            if items and isinstance(items[0], dict):
                guide_id = str(items[0].get("id") or "")
        c_gd, j_gd = (
            http_json("GET", f"{base}/api/v1/guides/{guide_id}", auth_b)
            if guide_id
            else (0, {})
        )
        b_gde_ok = bool(guide_id) and c_gd == 200
        write_json(
            out / "B-GDE-001" / "request-response.redacted.json",
            {
                "list": {"http_status": c_gl, "body": j_gl},
                "detail": {"http_status": c_gd, "body": j_gd},
            },
        )
        add_case(
            "B-GDE-001",
            "PASS" if b_gde_ok else "BLOCKED",
            "B-GDE-001",
            "GET guides 列表取 id + GET guides/:id 200（无 active 向导时 BLOCKED：需 SEED 或数据）",
            blocker=not b_gde_ok,
        )

        # B-ORD-001 + B-ORD-003
        oid = ""
        b_ord_ok = False
        b_ord3_ok = False
        if guide_id:
            c_ord, j_ord = http_json(
                "POST",
                f"{base}/api/v1/orders",
                {**auth_b, "Content-Type": "application/json"},
                json.dumps(
                    {"guide_id": guide_id, "amount": "100", "currency": "USD"}
                ).encode(),
            )
            if isinstance(j_ord, dict) and j_ord.get("order"):
                oid = str((j_ord.get("order") or {}).get("id") or "")
            b_ord_ok = c_ord == 200 and bool(oid)
            c_og, j_og = (
                http_json("GET", f"{base}/api/v1/orders/{oid}", auth_b)
                if oid
                else (0, {})
            )
            b_ord3_ok = b_ord_ok and c_og == 200
            write_json(
                out / "B-ORD-001" / "request-response.redacted.json",
                {"http_status": c_ord, "body": j_ord},
            )
            write_json(
                out / "B-ORD-003" / "request-response.redacted.json",
                {"http_status": c_og, "body": j_og},
            )
        else:
            write_json(
                out / "B-ORD-001" / "request-response.redacted.json",
                {"error": "skipped_no_guide"},
            )
            write_json(
                out / "B-ORD-003" / "request-response.redacted.json",
                {"error": "skipped_no_guide"},
            )

        add_case(
            "B-ORD-001",
            "PASS" if b_ord_ok else "BLOCKED",
            "B-ORD-001",
            "POST /orders 200 且返回 order.id",
            blocker=not b_ord_ok,
        )
        add_case(
            "B-ORD-003",
            "PASS" if b_ord3_ok else "BLOCKED",
            "B-ORD-003",
            "GET /orders/:id 200",
            blocker=not b_ord3_ok,
        )

        # B-MSG-002
        b_msg_ok = False
        b_msg_blocked = False
        if oid:
            c_msgp, j_msgp = http_json(
                "POST",
                f"{base}/api/v1/orders/{oid}/messages",
                {**auth_b, "Content-Type": "application/json"},
                json.dumps({"content": "r003 staging message"}).encode(),
            )
            c_msgg, j_msgg = http_json(
                "GET", f"{base}/api/v1/orders/{oid}/messages", auth_b
            )
            b_msg_ok = c_msgp == 200 and c_msgg == 200
            if c_msgp == 501 or c_msgg == 501:
                b_msg_ok = False
                b_msg_blocked = True
            write_json(
                out / "B-MSG-002" / "request-response.redacted.json",
                {
                    "post": {"http_status": c_msgp, "body": j_msgp},
                    "get": {"http_status": c_msgg, "body": j_msgg},
                },
            )
        else:
            write_json(
                out / "B-MSG-002" / "request-response.redacted.json",
                {"error": "skipped_no_order"},
            )
            b_msg_blocked = True

        add_case(
            "B-MSG-002",
            "PASS" if b_msg_ok else ("BLOCKED" if b_msg_blocked else "FAIL"),
            "B-MSG-002",
            "POST+GET 订单消息；501→BLOCKED（可走 PARTIAL_GO）",
            blocker=b_msg_blocked,
        )

        # main chain evidence index
        write_json(
            out / "phase2" / "b_domain_chain.redacted.json",
            {
                "register_email": email_b,
                "order_id": oid or None,
                "guide_id": guide_id or None,
            },
        )

    finished = utc_now_iso()

    # Summary counts
    summary = {"PASS": 0, "FAIL": 0, "BLOCKED": 0, "N_A": 0, "NOT_RUN": 0}
    for c in cases:
        st = c.get("status", "")
        if st in summary:
            summary[st] += 1

    # release_gate
    if b_skipped:
        rg = "NO_GO"
        rg_reason = "A 域未全绿，按 R-003 铁律②未进入 B 域；已跳过阶段 2。"
    else:
        any_fail = any(c["status"] == "FAIL" for c in cases)
        any_blocked = any(c["status"] == "BLOCKED" for c in cases)
        a_all_pass = all(
            c["status"] == "PASS" for c in cases if c["id"].startswith("A-")
        )
        if any_fail:
            rg = "NO_GO"
            rg_reason = "存在 FAIL；含 A+B 主链或单条验收未过（见 cases notes）。"
        elif any_blocked and not a_all_pass:
            rg = "NO_GO"
            rg_reason = "存在 BLOCKED 且 A 域未全 PASS。"
        elif any_blocked:
            rg = "PARTIAL_GO"
            rg_reason = (
                "93 §7.1：A 域全绿；B 域存在 BLOCKED（常见：无向导/消息 501）。"
                " 主链三条须由执行人复核 ENV-DB-PROOF 与 phase2 订单 id。"
            )
        else:
            rg = "GO"
            rg_reason = (
                "R-003 阶段 0→1→门禁→2：计划内 A+B 最低集 PASS；"
                "须 Release Owner 复核铁律① DB 写后读（ENV-DB-PROOF/notes.md）与会签。"
            )

    if out.name.startswith("GO_"):
        run_id = f"{out.name}_R003_STAGING"
    else:
        run_id = f"GO_{datetime.now(timezone.utc).strftime('%Y%m%d')}_R003_STAGING"
    report = {
        "schema_version": "1",
        "run_id": run_id,
        "title": "R-003 staging first full regression (A + B §2.0)",
        "executor": args.executor,
        "reviewer": args.reviewer,
        "started_at": started,
        "finished_at": finished,
        "environment": {
            "name": args.environment_name,
            "database": "enabled",
            "chain_mode": chain_mode,
            "auth_mode": args.auth_mode,
        },
        "release_gate": rg,
        "release_gate_reason": rg_reason,
        "summary": summary,
    }
    clean_cases: list[dict[str, Any]] = []
    for c in cases:
        cc = dict(c)
        if not cc.get("blocker"):
            cc.pop("blocker", None)
        clean_cases.append(cc)
    report["cases"] = clean_cases

    write_json(out / "report.json", report)
    write_r002_section4_backfill(out, report, ev_root)

    # summary.md
    summary_md = (
        f"# R-003 摘要\n\n"
        f"- **release_gate**: {rg}\n"
        f"- **reason**: {rg_reason}\n"
        f"- **api_base**: {base}\n"
        f"- **summary**: {summary}\n"
    )
    (out / "summary.md").write_text(summary_md, encoding="utf-8")

    # validate（NO_GO 时 --fail-on-no-go 会 exit 1，故此处只做结构校验）
    validate_py = repo_root / "scripts" / "validate-regression-report.py"
    if not args.skip_validate and validate_py.is_file():
        r = subprocess.run(
            [sys.executable, str(validate_py), str(out / "report.json")],
            cwd=str(repo_root),
        )
        if r.returncode != 0:
            print("validate-regression-report failed (schema)", file=sys.stderr)
            return r.returncode

    print(f"Wrote {out / 'report.json'} release_gate={rg}")
    print(
        "Merge gate: run  python scripts/validate-regression-report.py "
        f"{ev_root}/report.json --fail-on-no-go  (expect exit 0 only for GO/PARTIAL_GO)",
        file=sys.stderr,
    )
    return 0 if rg != "NO_GO" else 1


if __name__ == "__main__":
    raise SystemExit(main())
