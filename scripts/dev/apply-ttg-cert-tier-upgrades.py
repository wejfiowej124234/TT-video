#!/usr/bin/env python3
"""Apply §14 cert tier overrides and refresh MTM / closure checklist machine keys."""
from __future__ import annotations

import importlib.util
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OVERRIDES_PATH = ROOT / "docs/spec/governance-token/artifacts/ttg-governance-tier-overrides.v1.json"
TIER_ORDER = ["DEV_DONE", "TESTNET_DONE", "HUMAN_DONE", "OPS_DONE", "DR_DONE"]

HUMAN_APPLICABLE = 58
OPS_APPLICABLE = 34
DR_APPLICABLE = 20


def load_rows() -> list[dict]:
    spec_path = ROOT / "scripts/dev/gen-ttg-governance-master-traceability-matrix.py"
    spec = importlib.util.spec_from_file_location("ttg_mtm_gen", spec_path)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.ROWS  # type: ignore[attr-defined]


def tier_rank(t: str) -> int:
    return TIER_ORDER.index(t) if t in TIER_ORDER else -1


def effective_tier(base: str, override: str | None) -> str:
    if not override:
        return base
    return override if tier_rank(override) > tier_rank(base) else base


def count_tiers(rows: list[dict], overrides: dict[str, str]) -> dict[str, int]:
    counts = {t: 0 for t in TIER_ORDER}
    for r in rows:
        t = effective_tier(r["tier"], overrides.get(r["id"]))
        counts[t] += 1
    return counts


def human_ops_dr_done(rows: list[dict], overrides: dict[str, str]) -> tuple[int, int, int]:
    human = ops = dr = 0
    for r in rows:
        t = effective_tier(r["tier"], overrides.get(r["id"]))
        if tier_rank(t) >= tier_rank("HUMAN_DONE"):
            human += 1
        if tier_rank(t) >= tier_rank("OPS_DONE"):
            ops += 1
        if t == "DR_DONE":
            dr += 1
    return human, ops, dr


def patch_file(path: Path, pattern: str, repl: str, *, count: int = 1, optional: bool = False) -> bool:
    text = path.read_text(encoding="utf-8")
    new_text, n = re.subn(pattern, repl, text, count=count)
    if n != count:
        if optional:
            return False
        print(f"apply-tier: WARN pattern not found in {path.name}", file=sys.stderr)
        return False
    path.write_text(new_text, encoding="utf-8")
    return True


TIER_TOKEN = "DEV_DONE|TESTNET_DONE|HUMAN_DONE|OPS_DONE|DR_DONE"


def sync_closure_tier_rows(path: Path, overrides: dict[str, str]) -> None:
    text = path.read_text(encoding="utf-8")
    for chk_id, tier in overrides.items():
        if chk_id == "CHK-CORE-01":
            text, n = re.subn(
                rf"(\| 1 \| 真人验收 \| CHK-CORE-01 \| )(?:{TIER_TOKEN})( \|)",
                rf"\1{tier}\2",
                text,
                count=1,
            )
        else:
            text, n = re.subn(
                rf"(\| {re.escape(chk_id)} \| [^|]+ \| )(?:{TIER_TOKEN})( \|)",
                rf"\1{tier}\2",
                text,
                count=1,
            )
            if n == 0:
                text, n = re.subn(
                    rf"(\| \d+ \| [^|]+ \| {re.escape(chk_id)} \| )(?:{TIER_TOKEN})( \|)",
                    rf"\1{tier}\2",
                    text,
                    count=1,
                )
        if n == 0:
            print(f"apply-tier: WARN tier row not found for {chk_id}", file=sys.stderr)
    path.write_text(text, encoding="utf-8")


def sync_fcc_report(
    counts: dict[str, int],
    human_n: int,
    ops_n: int,
    dr_n: int,
    ent_score: int,
    cert_queue: str,
    cert_done: list[int],
) -> None:
    fcc = ROOT / "docs/spec/governance-token/TTG-GOVERNANCE-FULL-COVERAGE-CERTIFICATION-REPORT.md"
    dev_n = counts["DEV_DONE"]
    tn_n = counts["TESTNET_DONE"]
    dev_pct = round(100 * dev_n / 146, 1)
    tn_pct = round(100 * tn_n / 146, 1)
    human_pct = 100 * human_n // HUMAN_APPLICABLE if HUMAN_APPLICABLE else 0
    active_cert = min((c for c in range(1, 13) if c not in cert_done), default=13)
    fcc_key = (
        f"TTG_GOV_FCC: GFC=146 DEV={dev_n} TN={tn_n} HUMAN={human_n} "
        f"OPS={ops_n} DR={dr_n} ENT={ent_score} CERT={cert_queue}"
    )

    text = fcc.read_text(encoding="utf-8")
    replacements = [
        (
            r"\| \*\*DEV_DONE\*\* \| \*\*\d+\*\*（[\d.]+%） \|",
            f"| **DEV_DONE** | **{dev_n}**（{dev_pct}%） |",
        ),
        (
            r"\| \*\*TESTNET_DONE\*\* \| \*\*\d+\*\*（[\d.]+%） \|",
            f"| **TESTNET_DONE** | **{tn_n}**（{tn_pct}%） |",
        ),
        (
            r"\| \*\*HUMAN_DONE\*\* \| \*\*\d+\*\*（\d+/58 适用） \|",
            f"| **HUMAN_DONE** | **{human_n}**（{human_n}/58 适用） |",
        ),
        (
            r"\| \*\*OPS_DONE\*\* \| \*\*\d+\*\*（\d+/34 适用） \|",
            f"| **OPS_DONE** | **{ops_n}**（{ops_n}/34 适用） |",
        ),
        (
            r"\| \*\*DR_DONE\*\* \| \*\*\d+\*\*（\d+/20 适用） \|",
            f"| **DR_DONE** | **{dr_n}**（{dr_n}/20 适用） |",
        ),
        (
            r"\| \*\*Enterprise Ent ☑\*\* \| \*\*\d+/146\*\* · Score \*\*\d+/100\*\* \|",
            f"| **Enterprise Ent ☑** | **0/146** · Score **{ent_score}/100** |",
        ),
        (r"\*\*机读键：\*\* `TTG_GOV_FCC: [^`]+`", f"**机读键：** `{fcc_key}`"),
        (r"### 2\.1 TESTNET_DONE（\d+ 项）", f"### 2.1 TESTNET_DONE（{tn_n} 项）"),
        (r"### 2\.2 DEV_DONE（\d+ 项）", f"### 2.2 DEV_DONE（{dev_n} 项）"),
        (
            r"\| \*\*FE\*\* \| 04,05,06,07,11,12,17,18 \|",
            "| **FE** | 04,05,06,07,11,12,17,18 |",
        ),
        (
            r"§0 CORE 其余 21 项 · §1 FE 其余 \d+ ·",
            "§0 CORE 其余 21 项 · §1 FE 其余 8 ·",
        ),
        (r"\| → \*\*HUMAN_DONE\*\* \| 58 \| \d+ ☑ \|", f"| → **HUMAN_DONE** | 58 | {human_n} ☑ |"),
        (r"\| → \*\*OPS_DONE\*\* \| 34 \| \d+ ☑ \|", f"| → **OPS_DONE** | 34 | {ops_n} ☑ |"),
        (
            r"\*\*说明：\*\* \d+ 项 \*\*TESTNET_DONE\*\*",
            f"**说明：** {tn_n} 项 **TESTNET_DONE**",
        ),
        (r"## 4 · 真人验证清单（58 适用 · \d+ ☑）", f"## 4 · 真人验证清单（58 适用 · {human_n} ☑）"),
        (r"## 5 · 运营验证清单（34 适用 · \d+ ☑）", f"## 5 · 运营验证清单（34 适用 · {ops_n} ☑）"),
        (r"\| Human 100% \| \*\*NOT\*\* · \d+/58 \|", f"| Human 100% | **NOT** · {human_n}/58 |"),
        (
            r"\| Enterprise 100% \| \*\*NOT\*\* · \d+/100 \|",
            f"| Enterprise 100% | **NOT** · {ent_score}/100 |",
        ),
        (
            r"\*\*下一动作：\*\* Cert[^\n]+",
            f"**下一动作：** Cert **{len(cert_done)}/12 ☑** · 活跃 **Cert #{active_cert}** · §14 队列",
        ),
    ]
    for pat, repl in replacements:
        text, n = re.subn(pat, repl, text, count=1)
        if n != 1:
            print(f"apply-tier: WARN FCC pattern not found: {pat[:40]}", file=sys.stderr)
    fcc.write_text(text, encoding="utf-8")

    json_path = ROOT / "docs/spec/governance-token/artifacts/ttg-governance-full-coverage-certification.v1.json"
    payload = json.loads(json_path.read_text(encoding="utf-8"))
    payload["statistics"].update(
        {
            "dev_done": dev_n,
            "testnet_done": tn_n,
            "human_done": human_n,
            "ops_done": ops_n,
            "dr_done": dr_n,
            "enterprise_ent_checked": 0,
        }
    )
    payload["machine_key"] = fcc_key
    payload["cert_queue"] = cert_queue
    json_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main() -> None:
    if not OVERRIDES_PATH.exists():
        print(f"apply-tier: missing {OVERRIDES_PATH}", file=sys.stderr)
        sys.exit(2)

    data = json.loads(OVERRIDES_PATH.read_text(encoding="utf-8"))
    overrides: dict[str, str] = data.get("overrides", {})
    cert_done: list[int] = data.get("cert_queue_completed", [])
    rows = load_rows()
    counts = count_tiers(rows, overrides)
    human_n, ops_n, dr_n = human_ops_dr_done(rows, overrides)

    # Regenerate MTM (reads overrides inside gen script)
    subprocess.run(
        [sys.executable, str(ROOT / "scripts/dev/gen-ttg-governance-master-traceability-matrix.py")],
        check=True,
        cwd=ROOT,
    )

    cert_queue = f"{len(cert_done)}/12"
    ent_score = min(
        100,
        53
        + int(45 * human_n / HUMAN_APPLICABLE)
        + int(20 * ops_n / OPS_APPLICABLE)
        + int(12 * dr_n / DR_APPLICABLE)
        + len(cert_done),
    )

    machine_key = (
        f"TTG_GOV_FINAL_CLOSURE: MODE=CERT_ONLY DEV=100 TN={counts['TESTNET_DONE']} "
        f"HUMAN={human_n} OPS={ops_n} DR={dr_n} ENT={ent_score} CERT_QUEUE={cert_queue}"
    )
    mtm_key = (
        f"TTG_GOV_MTM: ROWS=146 DEV={counts['DEV_DONE']} TN={counts['TESTNET_DONE']} "
        f"HUMAN={human_n} OPS={ops_n} DR={dr_n}"
    )

    checklist = ROOT / "docs/spec/governance-token/TTG-GOVERNANCE-FINAL-CLOSURE-CHECKLIST.md"
    patch_file(
        checklist,
        r"\*\*机读键：\*\* `TTG_GOV_FINAL_CLOSURE: MODE=CERT_ONLY[^`]+`",
        f"**机读键：** `{machine_key}`",
    )
    patch_file(
        checklist,
        r"\| \*\*Human\*\* \| \*\*\d+%[^|]+\|",
        f"| **Human** | **{100 * human_n // HUMAN_APPLICABLE if HUMAN_APPLICABLE else 0}%**（{human_n}/{HUMAN_APPLICABLE}） |",
    )
    patch_file(
        checklist,
        r"\| \*\*Operations\*\* \| \*\*\d+%[^|]+\|",
        f"| **Operations** | **{100 * ops_n // OPS_APPLICABLE if OPS_APPLICABLE else 0}%**（{ops_n}/{OPS_APPLICABLE}） |",
    )
    patch_file(
        checklist,
        r"\| \*\*Disaster Recovery\*\* \| \*\*\d+%[^|]+\|",
        f"| **Disaster Recovery** | **{100 * dr_n // DR_APPLICABLE if DR_APPLICABLE else 0}%**（{dr_n}/{DR_APPLICABLE}） |",
    )
    patch_file(
        checklist,
        r"\| Enterprise \| \*\*\d+/100\*\* \|",
        f"| Enterprise | **{ent_score}/100** |",
    )
    patch_file(
        checklist,
        r"\| Testnet Completion \| \*\*[\d.]+%\*\*（\d+/\d+ 适用项[^|]+\|",
        f"| Testnet Completion | **{100 * counts['TESTNET_DONE'] // 92 if 92 else 0}%**（{counts['TESTNET_DONE']}/92 适用项 · ② Sepolia 证据） |",
    )

    patch_file(
        checklist,
        r"\| Human Acceptance \| \*\*\d+%[^|]+\|",
        f"| Human Acceptance | **{100 * human_n // HUMAN_APPLICABLE if HUMAN_APPLICABLE else 0}%**（{human_n}/{HUMAN_APPLICABLE} 适用项） |",
    )
    patch_file(
        checklist,
        r"\| Operations Readiness \| \*\*\d+%[^|]+\|",
        f"| Operations Readiness | **{100 * ops_n // OPS_APPLICABLE if OPS_APPLICABLE else 0}%**（{ops_n}/{OPS_APPLICABLE} 适用项 · GORP 文本 **≠** OPS_DONE） |",
    )
    patch_file(
        checklist,
        r"\| Disaster Recovery Readiness \| \*\*\d+%[^|]+\|",
        f"| Disaster Recovery Readiness | **{100 * dr_n // DR_APPLICABLE if DR_APPLICABLE else 0}%**（{dr_n}/{DR_APPLICABLE} 适用项 · runbook **≠** drill） |",
    )
    patch_file(
        checklist,
        r"\| Enterprise Score \| \*\*\d+ / 100\*\*[^|]+\|",
        f"| Enterprise Score | **{ent_score} / 100**（Cert 轨动态重算 · ENT 公式同源） |",
    )

    patch_file(
        checklist,
        r"\| \*\*DEV_DONE\*\* \| \*\*\d+\*\* \|",
        f"| **DEV_DONE** | **{counts['DEV_DONE']}** |",
    )
    patch_file(
        checklist,
        r"\| \*\*TESTNET_DONE\*\* \| \*\*\d+\*\* \|",
        f"| **TESTNET_DONE** | **{counts['TESTNET_DONE']}** |",
    )
    patch_file(
        checklist,
        r"\| \*\*DR_DONE\*\* \| \*\*\d+\*\* \|",
        f"| **DR_DONE** | **{dr_n}** |",
    )

    patch_file(
        checklist,
        r"\| \*\*HUMAN_DONE\*\* \| \*\*\d+\*\* \| (?:无 `HUMAN-\*-SIGNOFF`|Cert #1 signoff · \d+ 项 ≥ HUMAN_DONE) \|",
        f"| **HUMAN_DONE** | **{human_n}** | Cert #1 signoff · {human_n} 项 ≥ HUMAN_DONE |",
    )
    patch_file(
        checklist,
        r"\| \*\*OPS_DONE\*\* \| \*\*\d+\*\* \|",
        f"| **OPS_DONE** | **{ops_n}** |",
    )
    patch_file(
        checklist,
        r"\| Testnet \| 92 \| \d+ \| \*\*[\d.]+%\*\* \|",
        f"| Testnet | 92 | {counts['TESTNET_DONE']} | **{100 * counts['TESTNET_DONE'] // 92 if 92 else 0}%** |",
    )
    patch_file(
        checklist,
        r"\| Human \| 58 \| \d+ \| \*\*[\d.]+%\*\* \|",
        f"| Human | 58 | {human_n} | **{100 * human_n // HUMAN_APPLICABLE if HUMAN_APPLICABLE else 0}%** |",
    )
    patch_file(
        checklist,
        r"\| Operations \| 34 \| \d+ \| \*\*[\d.]+%\*\* \|",
        f"| Operations | 34 | {ops_n} | **{100 * ops_n // OPS_APPLICABLE if OPS_APPLICABLE else 0}%** |",
    )
    patch_file(
        checklist,
        r"\| Disaster Recovery \| 20 \| \d+ \| \*\*[\d.]+%\*\* \|",
        f"| Disaster Recovery | 20 | {dr_n} | **{100 * dr_n // DR_APPLICABLE if DR_APPLICABLE else 0}%** |",
    )

    tn_pct_header = 100 * counts["TESTNET_DONE"] // 92 if 92 else 0
    patch_file(
        checklist,
        r"\| Testnet \| \*\*[\d.]+%\*\* \| 冻结 · \*\*不再复验\*\* \|",
        f"| Testnet | **{tn_pct_header}%** | 冻结 · **不再复验** |",
    )
    patch_file(
        checklist,
        r"4\. \d+ 项已 `TESTNET_DONE` → 逐条升 Human/Ops/DR 至 Ent ☑",
        f"4. {counts['TESTNET_DONE']} 项已 `TESTNET_DONE` → 逐条升 Human/Ops/DR 至 Ent ☑",
    )
    patch_file(
        checklist,
        r"### A · 开发已完成（DEV_DONE · \d+ 项 · 节选）",
        f"### A · 开发已完成（DEV_DONE · {counts['DEV_DONE']} 项 · 节选）",
    )
    patch_file(
        checklist,
        r"### B · 测试网已完成（TESTNET_DONE · \d+ 项 · 全表 ID）",
        f"### B · 测试网已完成（TESTNET_DONE · {counts['TESTNET_DONE']} 项 · 全表 ID）",
    )
    patch_file(
        checklist,
        r"\*\*§1：\*\* CHK-FE-04～07,11～12,17～18",
        "**§1：** CHK-FE-04～07,11～12,17～18",
        optional=True,
    )
    patch_file(
        checklist,
        r"\*\*仍缺（\d+ 项 → Ops 适用）：\*\*",
        f"**仍缺（{OPS_APPLICABLE - ops_n} 项 → Ops 适用）：**",
    )
    patch_file(
        checklist,
        r"### C · 真人验收已完成（HUMAN_DONE · \d+ 项）",
        f"### C · 真人验收已完成（HUMAN_DONE · {human_n} 项）",
    )
    patch_file(
        checklist,
        r"\*\*Cert #1(?:–#\d+)? 已完成（\d+ 项）：\*\* CORE-01",
        f"**Cert #1–#{max(cert_done) if cert_done else 1} 已完成（{human_n} 项 HUMAN + {ops_n} 项 OPS tier）：** CORE-01",
        optional=True,
    )
    patch_file(
        checklist,
        r"\*\*仍缺（\d+ 项 → Human 适用）：\*\*",
        f"**仍缺（{HUMAN_APPLICABLE - human_n} 项 → Human 适用）：**",
        optional=True,
    )
    patch_file(
        checklist,
        r"### D · 运营验收已完成（OPS_DONE · \d+ 项）",
        f"### D · 运营验收已完成（OPS_DONE · {ops_n} 项）",
    )
    patch_file(
        checklist,
        r"\| \*\*OPS_DONE\*\* \| \*\*\d+\*\* \| 无 `GORP-SIGNOFF` / POL 签字 \|",
        f"| **OPS_DONE** | **{ops_n}** | Cert #4～#6 signoff · {ops_n} 项 ≥ OPS_DONE |",
        optional=True,
    )
    patch_file(
        checklist,
        r"## §14 · Certification Execution Queue（唯一执行序 · \d+/12）",
        f"## §14 · Certification Execution Queue（唯一执行序 · {cert_queue}）",
    )
    patch_file(
        checklist,
        r"\| \*\*1\*\* \| \*\*Human UAT\*\* \| [☐☑] \|",
        "| **1** | **Human UAT** | ☑ |",
        optional=True,
    )
    if 2 in cert_done:
        patch_file(
            checklist,
            r"\| \*\*2\*\* \| \*\*Multi Identity Walkthrough\*\* \| [☐☑] \|",
            "| **2** | **Multi Identity Walkthrough** | ☑ |",
            optional=True,
        )
    if 3 in cert_done:
        patch_file(
            checklist,
            r"\| \*\*3\*\* \| \*\*Admin Walkthrough\*\* \| [☐☑] \|",
            "| **3** | **Admin Walkthrough** | ☑ |",
            optional=True,
        )
    if 4 in cert_done:
        patch_file(
            checklist,
            r"\| \*\*4\*\* \| \*\*Safe Walkthrough\*\* \| [☐☑] \|",
            "| **4** | **Safe Walkthrough** | ☑ |",
            optional=True,
        )
    if 5 in cert_done:
        patch_file(
            checklist,
            r"\| \*\*5\*\* \| \*\*Finance Walkthrough\*\* \| [☐☑] \|",
            "| **5** | **Finance Walkthrough** | ☑ |",
            optional=True,
        )
    if 6 in cert_done:
        patch_file(
            checklist,
            r"\| \*\*6\*\* \| \*\*Phase B\*\*[^|]* \| [☐☑] \|",
            "| **6** | **Phase B**（总闸 · unpause） | ☑ |",
            optional=True,
        )
    if 7 in cert_done:
        patch_file(
            checklist,
            r"\| \*\*7\*\* \| \*\*Execute\*\* \| [☐☑] \|",
            "| **7** | **Execute** | ☑ |",
            optional=True,
        )

    coverage = ROOT / "docs/spec/governance-token/TTG-GOVERNANCE-HUMAN-CERTIFICATION-COVERAGE-REPORT.md"
    if coverage.exists():
        active_cert = min((c for c in range(1, 13) if c not in cert_done), default=13)
        cert_done_label = " · ".join(f"**Cert #{c} ☑**" for c in cert_done[:6])
        patch_file(
            coverage,
            r"\*\*Mode:\*\* \*\*Certification-Only\*\* ·[^\n]+",
            f"**Mode:** **Certification-Only** · {cert_done_label} · **active Cert #{active_cert}**",
            optional=True,
        )
        patch_file(
            coverage,
            r"`TTG_GOV_HUMAN_CERT: CHK_HUMAN=\d+/58 CERT_QUEUE=\d+/12 ACTIVE=\d+",
            f"`TTG_GOV_HUMAN_CERT: CHK_HUMAN={human_n}/58 CERT_QUEUE={cert_queue} ACTIVE={active_cert if active_cert <= 12 else 12}",
            optional=True,
        )
        if 2 in cert_done:
            patch_file(
                coverage,
                r"\*\*下一动作：\*\* \*\*Cert #2 Multi Identity\*\* walkthrough[^\n]+",
                f"**下一动作：** **Cert #{active_cert}**（§14 队列下一项）· 本报告 §6 **77 HC** 仍按 P0 顺序推进",
                optional=True,
            )

    sync_closure_tier_rows(checklist, overrides)
    sync_fcc_report(counts, human_n, ops_n, dr_n, ent_score, cert_queue, cert_done)

    mtm = ROOT / "docs/spec/governance-token/TTG-GOVERNANCE-MASTER-TRACEABILITY-MATRIX.md"
    patch_file(
        mtm,
        r"\*\*总行数：146\*\* · DEV_DONE \*\*\d+\*\* · TESTNET_DONE \*\*\d+\*\* · HUMAN_DONE \*\*\d+\*\* · OPS_DONE \*\*\d+\*\* · DR_DONE \*\*\d+\*\*",
        f"**总行数：146** · DEV_DONE **{counts['DEV_DONE']}** · TESTNET_DONE **{counts['TESTNET_DONE']}** · "
        f"HUMAN_DONE **{human_n}** · OPS_DONE **{ops_n}** · DR_DONE **{dr_n}**",
    )

    print(machine_key)
    print(mtm_key)
    print(f"TTG_CERT_TIER_APPLY: OK overrides={len(overrides)} cert_queue={cert_queue}")


if __name__ == "__main__":
    main()
