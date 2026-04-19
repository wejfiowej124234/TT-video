#!/usr/bin/env python3
"""
R-003 证据链：staging（或 local）上跑 r003_staging_full_regression.py，再跑 validate-regression-report --fail-on-no-go。

密钥通过环境变量或可选的 scripts/dev/.env.r003.local 注入（勿提交该 local 文件）。

用法：
  python scripts/dev/run_r003_staging_evidence_chain.py --from-env
  python scripts/dev/run_r003_staging_evidence_chain.py --from-env --env-file scripts/dev/.env.r003.local

CI（不会本机跑时）：GitHub Actions **workflow_dispatch** **`.github/workflows/r003-staging-evidence-chain-dispatch.yml`**，
注入 Secrets **`R003_STAGING_*`**；**`runner_type=self-hosted`** 时在 **`[self-hosted, linux]`** runner 上执行本脚本（内网 staging）。

环境变量（--from-env 时）：
  R003_API_BASE 或 R003_STAGING_API_BASE   必填，如 https://api.staging.example
  R003_ENVIRONMENT_NAME   默认 staging（local 自测时用 local）
  R003_OUT                默认 evidence/GO_20260418
  R003_EXECUTOR           默认 当前用户 USERNAME/USER
  R003_A_EMAIL            默认 tourist@test.com
  R003_A_PASSWORD         与 staging 一致；不设则退出并提示
  R003_WARN_LOCALHOST=1   传给回归脚本（staging+本机时）
  R003_SKIP_VALIDATE=1    仅跑回归，不跑机读闸
  R003_SKIP_DB_REMINDER=1 不在 stdout 打印铁律①提醒
  R003_LOCAL_CHAIN=1      本机烟测：强制 environment=local、OUT=evidence/R003_local_evidence_chain；API 默认同左，占位 URL 时回退 127.0.0.1:8080；种子密码默认同左
  R003_WAIT_HEALTH_SEC    loopback 时等 /health 的最长秒数（默认 60）

staging 路径（未设 R003_LOCAL_CHAIN）在跑回归前会自动执行
  `python scripts/dev/check_r003_staging_env_ready.py --from-os-environ`
（与占位 URL / 空口令 / 误开 LOCAL_CHAIN 等价校验）。

铁律① ENV-DB-PROOF/notes.md 仍须由具备 PG 权限的人在实跑后手工补全；本脚本不代写 DB 佐证。
"""
from __future__ import annotations

import argparse
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urlparse

LOCAL_CHAIN_OUT = "evidence/R003_local_evidence_chain"
LOCAL_DEFAULT_BASE = "http://127.0.0.1:8080"
LOCAL_DEFAULT_PASSWORD = "Test123!"


def load_env_file(path: Path) -> None:
    if not path.is_file():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[7:].strip()
        if "=" not in line:
            continue
        key, _, val = line.partition("=")
        key, val = key.strip(), val.strip()
        if not key:
            continue
        if len(val) >= 2 and val[0] == val[-1] and val[0] in "\"'":
            val = val[1:-1]
        if key not in os.environ:
            os.environ[key] = val


def _strip_empty_r003_placeholders() -> None:
    """`.env` 里 `R003_FOO=` 会变成空串；去掉空值以便 LOCAL_CHAIN 的 setdefault 生效。"""
    for k in (
        "R003_API_BASE",
        "R003_STAGING_API_BASE",
        "R003_A_PASSWORD",
        "R003_EXECUTOR",
        "R003_OUT",
        "R003_ENVIRONMENT_NAME",
    ):
        if os.environ.get(k, "").strip() == "":
            os.environ.pop(k, None)


def _truthy(raw: str | None) -> bool:
    if raw is None:
        return False
    return raw.strip().lower() in ("1", "true", "yes", "on")


def _staging_api_base_placeholder_reason(base: str) -> str | None:
    """拒绝模板占位 URL，避免误产「假 staging」证据。"""
    b = base.lower()
    needles = (
        "your-staging",
        "your_staging",
        "replace-me",
        "replace_me",
        "changeme",
        "api.staging.example",
        "staging-api.example",
    )
    for n in needles:
        if n in b:
            return (
                f"R003_API_BASE still looks like a doc placeholder (matched {n!r}). "
                "Put the real staging API origin in scripts/dev/.env.r003.local, or set R003_LOCAL_CHAIN=1 for local smoke."
            )
    return None


def _wait_api_health(base: str, timeout_sec: int = 60) -> bool:
    """Loopback API：回归前先等 /health 200，避免缺 DATABASE_URL / 未起服时一堆 FAIL。"""
    url = base.rstrip("/") + "/health"
    deadline = time.monotonic() + timeout_sec
    n = 0
    while time.monotonic() < deadline:
        n += 1
        try:
            with urllib.request.urlopen(url, timeout=3) as r:
                if r.status == 200:
                    print(f"[chain] GET /health OK ({url})", file=sys.stderr)
                    return True
        except (urllib.error.URLError, OSError):
            pass
        print(f"[chain] waiting for API {url} (attempt {n})…", file=sys.stderr)
        time.sleep(2)
    print(
        f"[chain] ERROR: no HTTP 200 from {url} within {timeout_sec}s. "
        "Start Postgres (`docker compose up -d`), then e.g. "
        "`set DATABASE_URL=postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust` "
        "`set SEED_TEST_ACCOUNTS=1` `cargo run -p traveltrust-api`, or run scripts\\start-api-with-seed.bat.",
        file=sys.stderr,
    )
    return False


def _apply_local_chain_defaults() -> None:
    """
    本机烟测：强制 environment/out，避免 .env 从示例复制后仍带 staging + GO_20260418，
    导致 localhost 与 environment-name=staging 组合被回归脚本拒绝或污染 staging 证据目录。
    """
    os.environ["R003_ENVIRONMENT_NAME"] = "local"
    os.environ["R003_OUT"] = LOCAL_CHAIN_OUT
    base = (os.environ.get("R003_API_BASE") or os.environ.get("R003_STAGING_API_BASE") or "").strip()
    if not base or _staging_api_base_placeholder_reason(base):
        os.environ["R003_API_BASE"] = LOCAL_DEFAULT_BASE
    else:
        os.environ["R003_API_BASE"] = base
    os.environ.setdefault("R003_A_PASSWORD", LOCAL_DEFAULT_PASSWORD)
    if not (os.environ.get("R003_EXECUTOR") or "").strip():
        u = os.environ.get("USERNAME") or os.environ.get("USER") or "local-chain"
        os.environ["R003_EXECUTOR"] = f"{u}@local-smoke"
    print(
        "[chain] R003_LOCAL_CHAIN=1 — using local API defaults "
        f"({LOCAL_DEFAULT_BASE}, env=local, out={LOCAL_CHAIN_OUT}). "
        "This is NOT staging delivery; for staging unset R003_LOCAL_CHAIN and set R003_API_BASE + R003_A_PASSWORD.",
        file=sys.stderr,
    )


def main() -> int:
    ap = argparse.ArgumentParser(description="R-003: regression + validate-regression-report chain")
    ap.add_argument(
        "--from-env",
        action="store_true",
        help="Read configuration from environment (and optional --env-file)",
    )
    ap.add_argument(
        "--env-file",
        type=Path,
        default=None,
        help="Optional KEY=VAL file merged into os.environ (does not override existing vars)",
    )
    ap.add_argument("--skip-validate", action="store_true", help="Skip validate-regression-report.py")
    args = ap.parse_args()

    repo_root = Path(__file__).resolve().parents[2]
    default_env = repo_root / "scripts" / "dev" / ".env.r003.local"
    env_path = args.env_file if args.env_file is not None else default_env
    load_env_file(env_path)
    _strip_empty_r003_placeholders()

    if not args.from_env:
        print(
            "Usage: python scripts/dev/run_r003_staging_evidence_chain.py --from-env\n"
            "Set R003_API_BASE (or R003_STAGING_API_BASE) and R003_A_PASSWORD; "
            f"optional vars in {env_path} (copy from scripts/dev/r003-staging-chain.env.example).",
            file=sys.stderr,
        )
        return 2

    if _truthy(os.environ.get("R003_LOCAL_CHAIN")):
        _apply_local_chain_defaults()
    else:
        check_py = repo_root / "scripts" / "dev" / "check_r003_staging_env_ready.py"
        if check_py.is_file():
            r0 = subprocess.run(
                [sys.executable, str(check_py), "--from-os-environ"],
                cwd=str(repo_root),
            )
            if r0.returncode != 0:
                return r0.returncode

    base = (os.environ.get("R003_API_BASE") or os.environ.get("R003_STAGING_API_BASE") or "").strip()
    if not base:
        print(
            "ERROR: missing R003_API_BASE (or R003_STAGING_API_BASE).\n"
            "  Staging: set both in scripts/dev/.env.r003.local (see scripts/dev/r003-staging-chain.env.example).\n"
            "  Local smoke: set R003_LOCAL_CHAIN=1 in .env.r003.local and run API on :8080 with SEED_TEST_ACCOUNTS.",
            file=sys.stderr,
        )
        return 2

    env_name = (os.environ.get("R003_ENVIRONMENT_NAME") or "staging").strip()
    out = (os.environ.get("R003_OUT") or "evidence/GO_20260418").strip()
    executor = (os.environ.get("R003_EXECUTOR") or "").strip() or (
        os.environ.get("USERNAME") or os.environ.get("USER") or "unset-executor"
    )
    a_email = (os.environ.get("R003_A_EMAIL") or "tourist@test.com").strip()
    a_password = os.environ.get("R003_A_PASSWORD")
    if a_password is None or not str(a_password).strip():
        print(
            "ERROR: missing R003_A_PASSWORD.\n"
            "  Staging: set in scripts/dev/.env.r003.local (never commit).\n"
            "  Local: use R003_LOCAL_CHAIN=1 for default seed password, or set R003_A_PASSWORD explicitly.",
            file=sys.stderr,
        )
        return 2
    a_password = str(a_password).strip()

    warn_local = os.environ.get("R003_WARN_LOCALHOST", "").strip() in ("1", "true", "yes", "on")

    host = urlparse(base).hostname or ""
    if host in ("127.0.0.1", "localhost", "::1"):
        wait_sec = int(os.environ.get("R003_WAIT_HEALTH_SEC", "60"))
        if not _wait_api_health(base, timeout_sec=wait_sec):
            return 2

    reg_py = repo_root / "scripts" / "dev" / "r003_staging_full_regression.py"
    val_py = repo_root / "scripts" / "validate-regression-report.py"
    out_path = (repo_root / out).resolve()
    report_json = out_path / "report.json"

    reg_cmd = [
        sys.executable,
        str(reg_py),
        "--environment-name",
        env_name,
        "--api-base",
        base,
        "--out",
        str(out_path),
        "--executor",
        executor,
        "--a-email",
        a_email,
        "--a-password",
        a_password,
    ]
    if warn_local:
        reg_cmd.append("--warn-localhost")

    print(f"[chain] env_file_loaded={env_path.is_file()} path={env_path}", file=sys.stderr)
    print(f"[chain] regression -> {reg_py.name}", file=sys.stderr)
    r1 = subprocess.run(reg_cmd, cwd=str(repo_root))
    if r1.returncode != 0:
        print(f"[chain] regression exit {r1.returncode}; skip validate.", file=sys.stderr)
        return r1.returncode

    if args.skip_validate or os.environ.get("R003_SKIP_VALIDATE", "").strip() in ("1", "true", "yes"):
        print("[chain] R003_SKIP_VALIDATE set; skipping validate-regression-report.py", file=sys.stderr)
        return 0

    if not val_py.is_file():
        print(f"ERROR: missing {val_py}", file=sys.stderr)
        return 2

    print(f"[chain] validate -> {report_json.relative_to(repo_root)}", file=sys.stderr)
    r2 = subprocess.run(
        [sys.executable, str(val_py), str(report_json), "--fail-on-no-go"],
        cwd=str(repo_root),
    )

    if r2.returncode == 0 and os.environ.get("R003_SKIP_DB_REMINDER", "").strip() not in ("1", "true", "yes"):
        notes = out_path / "ENV-DB-PROOF" / "notes.md"
        print(
            "\n[chain] release_gate passed validate (GO or PARTIAL_GO).\n"
            f"        Next: have a DBA fill iron rule ① in:\n          {notes}\n"
            "        Then archive evidence for release owner sign-off.\n",
            file=sys.stderr,
        )
    elif r2.returncode != 0:
        print(
            "\n[chain] validate failed or release_gate is NO_GO (exit as merge gate expects).\n"
            "        Fix staging/API or evidence; re-run this chain after regression passes.\n",
            file=sys.stderr,
        )

    return r2.returncode


if __name__ == "__main__":
    raise SystemExit(main())
