#!/usr/bin/env python3
"""Generate evidence/manual-uat/dashboard/PHASE3-READINESS.md from registry + latest session.

Usage (repo root):
  python scripts/dev/generate-manual-uat-dashboard.py

Do not hand-edit PHASE3-READINESS.md — re-run this script.
"""
from __future__ import annotations

import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MUAT = ROOT / "evidence" / "manual-uat"
REGISTRY = MUAT / "summary" / "defects-registry.json"
CFG_REGISTRY = MUAT / "summary" / "config-drift-registry.json"
DASHBOARD = MUAT / "dashboard" / "PHASE3-READINESS.md"
SESSIONS = MUAT / "sessions"

SLA_HOURS = {"P0": 0, "P1": 24, "P2": None, "P3": None}  # P2/P3: session/release scoped


def git_short_sha() -> str:
    try:
        return (
            subprocess.check_output(
                ["git", "rev-parse", "--short", "HEAD"],
                cwd=ROOT,
                text=True,
            )
            .strip()
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        return "unknown"


def load_json(path: Path) -> dict:
    if not path.is_file():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def latest_session_dir() -> Path | None:
    latest = SESSIONS / "latest"
    if latest.is_symlink() or latest.exists():
        try:
            return latest.resolve()
        except OSError:
            pass
    stamps = sorted(
        (p for p in SESSIONS.iterdir() if p.is_dir() and p.name != "latest"),
        key=lambda p: p.name,
        reverse=True,
    )
    return stamps[0] if stamps else None


def parse_utc(s: str | None) -> datetime | None:
    if not s:
        return None
    try:
        if s.endswith("Z"):
            return datetime.fromisoformat(s.replace("Z", "+00:00"))
        return datetime.fromisoformat(s)
    except ValueError:
        return None


def main() -> int:
    now = datetime.now(timezone.utc)
    registry = load_json(REGISTRY)
    cfg_reg = load_json(CFG_REGISTRY)
    defects = registry.get("defects", [])
    cfg_items = cfg_reg.get("items", [])
    cfg_open = sum(1 for c in cfg_items if c.get("status") not in ("CLOSED", "VERIFIED"))
    cfg_closed = sum(1 for c in cfg_items if c.get("status") in ("CLOSED", "VERIFIED"))
    cfg_total = len(cfg_items) or 28
    zero_drift = cfg_open == 0
    cfg_frozen = cfg_reg.get("chapter_status") == "FROZEN"

    signoff = MUAT / "signoff" / "CFG-ZERO-DRIFT-GATE.md"
    gate_pass = signoff.is_file() and "TT_CFG_ZERO_DRIFT_GATE: PASS" in signoff.read_text(
        encoding="utf-8", errors="replace"
    )
    freeze_signoff = MUAT / "signoff" / "TT-CONFIGURATION-ZERO-DRIFT-FROZEN.md"
    cfg_frozen_doc = freeze_signoff.is_file() and "TT_CONFIGURATION_ZERO_DRIFT: FROZEN" in freeze_signoff.read_text(
        encoding="utf-8", errors="replace"
    )

    sess_dir = latest_session_dir()
    summary = load_json(sess_dir / "SUMMARY.json") if sess_dir else {}
    session_id = summary.get("session_id", "—")
    session_stamp = summary.get("session_stamp", sess_dir.name if sess_dir else "—")

    open_by_sev = {"P0": 0, "P1": 0, "P2": 0, "P3": 0}
    closed = 0
    overdue_p1 = 0
    overdue_p2 = 0
    reg_pending = 0
    reg_passed = 0

    for d in defects:
        sev = d.get("severity", "P3")
        status = d.get("status", "OPEN")
        if status == "CLOSED":
            closed += 1
        elif status in ("OPEN", "FIXED", "READY_FOR_RETEST", "REOPENED"):
            if sev in open_by_sev:
                open_by_sev[sev] += 1
            opened = parse_utc(d.get("opened_utc"))
            if opened and sev == "P1" and status == "OPEN":
                hours = (now - opened).total_seconds() / 3600
                if hours > 24:
                    overdue_p1 += 1
            if opened and sev == "P2" and status == "OPEN":
                # P2: overdue if older than latest session stamp start (heuristic: 7d)
                hours = (now - opened).total_seconds() / 3600
                if hours > 168:
                    overdue_p2 += 1
        if status == "READY_FOR_RETEST":
            reg_pending += 1
        if status in ("VERIFIED", "CLOSED"):
            reg_passed += 1

    reg_dir = MUAT / "regression"
    if reg_dir.is_dir():
        for f in reg_dir.glob("REG-*.md"):
            text = f.read_text(encoding="utf-8", errors="replace")
            if "QUEUED" in text or "IN_PROGRESS" in text:
                reg_pending += 0  # already counted via defect status
            if "| **Result** | PASS |" in text or "Result** | PASS" in text:
                reg_passed += 1

    manual = summary.get("manual_test", summary.get("layers", {}).get("ui", {}))
    m_pass = manual.get("pass", 0)
    m_fail = manual.get("fail", 0)
    m_blocked = manual.get("blocked", 0)
    m_total = manual.get("total", 0)

    commit = summary.get("commit") or git_short_sha()
    phase = summary.get("phase", "①-local")

    manual_cov = f"{round(100 * m_pass / m_total)}%" if m_total else "—"
    prod_blockers = open_by_sev["P0"] + open_by_sev["P1"]
    if open_by_sev["P0"] > 0:
        prod_readiness = "BLOCKED (P0)"
    elif prod_blockers > 0 or m_fail > 0:
        prod_readiness = "IN_PROGRESS"
    elif m_total and m_pass == m_total and reg_pending == 0:
        prod_readiness = "READY_FOR_REVIEW"
    else:
        prod_readiness = "IN_PROGRESS"

    lines = [
        "# Production Readiness Dashboard",
        "",
        f"**AUTO-GENERATED** · `{now.strftime('%Y-%m-%dT%H:%M:%SZ')}`",
        f"**Generator:** `python scripts/dev/generate-manual-uat-dashboard.py`",
        "",
        "> **证据口径：** 本页证明当前质量聚合态 · **非** ③ Production GO 签字。",
        "> **SSOT 结构：** [evidence/manual-uat/README.md](../README.md)（**FROZEN** · 只追加 Session）",
        "> **Active mainline:** [TT-PROJECT-MAINLINE](../../docs/runbook/TT-PROJECT-MAINLINE-PRODUCT-VERIFICATION.md) · 验产品",
        "> **Configuration:** `TT_CONFIGURATION_ZERO_DRIFT` **STATUS FROZEN 2026-06-30** · maintenance verify only",
        "",
        "## Production Readiness（主视图 · Configuration 已毕业）",
        "",
        "| 指标 | 值 |",
        "|------|-----|",
        f"| **Open P0 Business Bugs** | **{open_by_sev['P0']}** |",
        f"| **Open P1 Business Bugs** | **{open_by_sev['P1']}** |",
        f"| **Manual UAT Coverage** | {manual_cov} ({m_pass}/{m_total} PASS · {m_fail} FAIL · {m_blocked} blocked) |",
        f"| **Regression** | Pending {reg_pending} · Passed {reg_passed} |",
        f"| **Production Readiness** | **{prod_readiness}** |",
        "",
        "| 上下文 | 值 |",
        "|--------|-----|",
        f"| Phase | {phase} |",
        f"| Current Session | {session_id} (`{session_stamp}`) |",
        f"| Latest Commit | `{commit}` |",
        f"| Open P2 Business Bugs | {open_by_sev['P2']} |",
        f"| Open P3 Business Bugs | {open_by_sev['P3']} |",
        f"| Overdue P1 (>24h OPEN) | {overdue_p1} |",
        f"| Overdue P2 (>7d OPEN) | {overdue_p2} |",
        f"| Closed Bugs (累计) | {closed} |",
        "",
        "> **纪律：** 配置漂移复发 = **Regression**（DEFECT + REG）· **非** Configuration Sprint。见 [TT-CONFIGURATION-ZERO-DRIFT-FROZEN](../../docs/runbook/TT-CONFIGURATION-ZERO-DRIFT-FROZEN.md)。",
        "",
        "## 工作流（项目主线 · 验产品）",
        "",
        "```",
        "Manual UAT → Business Defect → Regression → Production Entry Review",
        "    → Testnet Sign-off → Mainnet Preparation",
        "```",
        "",
        "Configuration 章节 **FROZEN 2026-06-30** — 见 [TT-CONFIGURATION-ZERO-DRIFT-FROZEN](../../docs/runbook/TT-CONFIGURATION-ZERO-DRIFT-FROZEN.md)。",
        "",
        "## 配置漂移（已毕业 · FROZEN · 附录）",
        "",
        "| 指标 | 值 |",
        "|------|-----|",
        f"| **TT_CONFIGURATION_ZERO_DRIFT** | **{'FROZEN' if cfg_frozen and cfg_frozen_doc else 'PENDING FREEZE'}** |",
        f"| CFG 登记（封顶） | CFG-001～CFG-028 |",
        f"| CFG OPEN | {cfg_open} |",
        f"| Zero Drift Gate | **{'PASS' if zero_drift and gate_pass else 'PENDING'}** (graduated) |",
        f"| 维护验证（Regression guard） | `bash scripts/dev/verify-cfg-drift-closure.sh` — fail → **DEFECT/REG** |",
        f"| SSOT | [CFG-REGISTRY.md](../summary/CFG-REGISTRY.md) · [freeze signoff](../signoff/TT-CONFIGURATION-ZERO-DRIFT-FROZEN.md) |",
        "",
        "## Severity SLA",
        "",
        "| Severity | 目标 |",
        "|----------|------|",
        "| P0 | 当天关闭 |",
        "| P1 | 24 小时 |",
        "| P2 | 下一 Session |",
        "| P3 | 版本内（Release） |",
        "",
        "## 数据源",
        "",
        f"- [defects-registry.json](../summary/defects-registry.json)",
        f"- Latest session SUMMARY.json",
        f"- [MASTER-DEFECT-REGISTER](../summary/MASTER-DEFECT-REGISTER.md)",
        f"- [Regression queue](../regression/README.md)",
        f"- [Release index](../release/README.md)",
        "",
    ]

    DASHBOARD.parent.mkdir(parents=True, exist_ok=True)
    DASHBOARD.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {DASHBOARD.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
