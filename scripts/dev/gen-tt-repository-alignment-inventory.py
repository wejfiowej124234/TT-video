#!/usr/bin/env python3
"""TT_REPOSITORY_ALIGNMENT_CLEANUP — GovFreeze V2 baseline · ACTIVE / LEGACY / DELETE_CANDIDATE inventory."""
from __future__ import annotations

import json
import os
import re
import subprocess
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

SKIP_DIR_NAMES = {
    ".git",
    ".next",
    "node_modules",
    "target",
    "target-r003-evidence",
    ".cargo-home-mig-evidence",
    "dist",
    "build",
    "__pycache__",
}

SCAN_EXTENSIONS = {
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".mjs",
    ".rs",
    ".py",
    ".sh",
    ".md",
    ".yaml",
    ".yml",
    ".json",
    ".env",
    ".local",
    ".toml",
}

GOV_FRONTEND_ROUTES_ACTIVE = [
    "/governance",
    "/governance/params",
    "/governance/proposals",
    "/governance/proposals/new",
    "/governance/proposals/[id]",
    "/governance/delegate",
    "/governance/distribution-accruals",
    "/governance/distribution-claim",
    "/governance/fee-routes",
    "/governance/vault-forwards",
    "/governance/steward-region-workbench",  # alias · redirect → /governance?view=region
    "/me/identities",
    "/admin",
]

GOV_API_GET_ACTIVE = [
    "/api/v1/governance/protocol-reference",
    "/api/v1/governance/params",
    "/api/v1/governance/fee-routes",
    "/api/v1/governance/proposals",
    "/api/v1/governance/country-ledger/:jurisdiction",
    "/api/v1/governance/investor-distribution-accruals",
]

EVIDENCE_LATEST_KEYS = [
    ("GO_hat_r1_sepolia", "latest-stamp.txt"),
    ("GO_tt_country_pool_revenue_enterprise_hat", "latest-stamp.txt"),
    ("GO_ai_pre_human_uat", "latest-stamp.txt"),
    ("GO_ttg_cert", "latest-stamp.txt"),
    ("GO_govfreeze_v2_human_screen_acceptance", "latest-stamp.txt"),
]

STAMP_DIR_RE = re.compile(r"^\d{8}T\d{6}Z$")

FORBIDDEN_DOC_NARRATIVE = [
    ("auto_dividend_primary", re.compile(r"自动分红")),
    (
        "HolderDividendVault_active",
        re.compile(r"HolderDividendVault(?![^\n]{0,80}(?:废止|SUPERSEDED|禁止|非现行|READ-ONLY))", re.I),
    ),
]

ADDRESS_DRIFT_SKIP_PREFIXES = (
    "evidence/",
    "contracts/broadcast/",
)

LEGACY_CONTEXT_RE = re.compile(
    r"\bLEGACY\b|\blegacy\b|cutover|archive|superseded|read-only|GovFreeze V2",
    re.I,
)

ROUTE_DRIFT_PATTERNS = [
    (
        "ROUTE-DRIFT-01",
        "/governance/proposals/create",
        "/governance/proposals/new",
        "capture-hat-r1 / browser-acceptance 仍引用 create；App SSOT 为 new",
    ),
]

SUPERSEDED_DOC_MARKER = re.compile(
    r"SUPERSEDED\s*·\s*READ-ONLY\s*·\s*replaced by MTM\s*146",
    re.I,
)

SUPERSEDED_DOC_PATHS = [
    (
        "docs/spec/governance-token/TTG-GOVERNANCE-FULL-COVERAGE-MATRIX.md",
        "834 行覆盖率矩阵 · MTM 146 取代",
    ),
    (
        "scripts/dev/gen-ttg-governance-full-coverage-matrix.py",
        "旧矩阵 generator · MTM generator 为执行真源",
    ),
    (
        "docs/spec/governance-token/TTG-GOVERNANCE-HUMAN-CERTIFICATION-COVERAGE-REPORT.md",
        "77 行 Human 覆盖表 · MTM Cert 列取代",
    ),
]

DEAD_COMPONENT_CANDIDATES = [
    (
        "frontend/app/governance/params/GovernanceParamsDualTrackCards.tsx",
        "GovernanceParamsDualTrackCards",
        "未导入 params 页 · contract test 显式排除",
    ),
]


@dataclass
class Item:
    tier: str  # ACTIVE | LEGACY | DELETE_CANDIDATE
    category: str
    item_id: str
    path: str
    summary: str
    action: str = "—"
    risk: str = "—"

    def to_dict(self) -> dict:
        return {
            "tier": self.tier,
            "category": self.category,
            "id": self.item_id,
            "path": self.path,
            "summary": self.summary,
            "action": self.action,
            "risk": self.risk,
        }


@dataclass
class Inventory:
    items: list[Item] = field(default_factory=list)

    def add(self, item: Item) -> None:
        self.items.append(item)

    def counts(self) -> dict[str, int]:
        out = {"ACTIVE": 0, "LEGACY": 0, "DELETE_CANDIDATE": 0}
        for i in self.items:
            out[i.tier] = out.get(i.tier, 0) + 1
        return out


def load_baseline_env() -> tuple[dict[str, str], dict[str, str]]:
    env_path = ROOT / "scripts/dev/.env.phase2-chain-deploy.local"
    active: dict[str, str] = {}
    legacy: dict[str, str] = {}
    if not env_path.exists():
        return active, legacy
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.split("#", 1)[0].strip()
        if not line or "=" not in line:
            continue
        k, v = line.split("=", 1)
        k, v = k.strip(), v.strip()
        if not v.startswith("0x"):
            continue
        if k.startswith("LEGACY_") or k == "CP_NET_PROFIT_LEDGER_OWNER_TIMELOCK":
            legacy[k] = v.lower()
        elif any(
            x in k
            for x in (
                "GOV_FREEZE_V2",
                "GOVERNANCE_",
                "GOVERNOR_",
                "TIMELOCK_ADDRESS",
                "COUNTRY_POOL_NET_PROFIT",
                "COUNTRY_POOL_STEWARD",
                "COUNTRY_POOL_UNALLOCATED",
                "PRIMARY_MARKET",
                "SEAT_REGISTRY",
                "STAKE_POOL",
            )
        ):
            active[k] = v.lower()
    return active, legacy


def iter_files(base: Path):
    for dirpath, dirnames, filenames in os.walk(base):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIR_NAMES]
        for name in filenames:
            p = Path(dirpath) / name
            if p.suffix.lower() in SCAN_EXTENSIONS or name.endswith(".env.local"):
                yield p


def rel(p: Path) -> str:
    try:
        return str(p.relative_to(ROOT)).replace("\\", "/")
    except ValueError:
        return str(p)


def scan_baseline_ssot(inv: Inventory, active: dict[str, str], legacy: dict[str, str]) -> None:
    inv.add(
        Item(
            "ACTIVE",
            "baseline",
            "SSOT-BASELINE-FREEZE",
            "docs/spec/governance-token/GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md",
            "GovFreeze V2 Clean Baseline 唯一经济真源",
            "只读引用",
            "P0",
        )
    )
    inv.add(
        Item(
            "ACTIVE",
            "baseline",
            "SSOT-MTM-146",
            "docs/spec/governance-token/TTG-GOVERNANCE-MASTER-TRACEABILITY-MATRIX.md",
            "146 行执行真源 · Cert #1→#12",
            "维护 Tier · 禁止新矩阵",
            "P0",
        )
    )
    for k, addr in sorted(active.items()):
        inv.add(
            Item(
                "ACTIVE",
                "contract_address",
                f"ADDR-ACTIVE-{k}",
                f"scripts/dev/.env.phase2-chain-deploy.local",
                f"{k}={addr}",
                "禁止替换为 LEGACY",
                "P0",
            )
        )
    for k, addr in sorted(legacy.items()):
        inv.add(
            Item(
                "LEGACY",
                "contract_address",
                f"ADDR-LEGACY-{k}",
                "scripts/dev/.env.phase2-chain-deploy.local",
                f"{k}={addr} · cutover/只读归档",
                "保留 · 禁止作活跃读口",
                "P1",
            )
        )


def scan_address_misuse(inv: Inventory, active: dict[str, str], legacy: dict[str, str]) -> None:
    legacy_addrs = set(legacy.values())
    active_addrs = set(active.values())
    # Legacy timelock used in cutover scripts is LEGACY not misuse
    cutover_ok = legacy.get("CP_NET_PROFIT_LEDGER_OWNER_TIMELOCK", "")
    for p in iter_files(ROOT):
        r = rel(p)
        if any(r.startswith(prefix) for prefix in ADDRESS_DRIFT_SKIP_PREFIXES):
            continue
        if r.startswith("evidence/") and p.suffix == ".json":
            continue
        try:
            text = p.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        lower = text.lower()
        for addr in legacy_addrs:
            if addr not in lower or addr in active_addrs:
                continue
            if LEGACY_CONTEXT_RE.search(text) or "legacy" in r or "archive" in r:
                continue
            if addr == cutover_ok and ("cutover" in r or "cp-revenue" in r or "phase2-sepolia-cp" in r):
                continue
            inv.add(
                Item(
                    "DELETE_CANDIDATE" if "frontend/" in r else "LEGACY",
                    "address_drift",
                    f"ADDR-REF-LEGACY-{addr[:10]}",
                    r,
                    f"引用 legacy 地址 {addr} 无 LEGACY/cutover 上下文",
                    "改为 ACTIVE 或显式 LEGACY 注释",
                    "P1",
                )
            )
            break


def scan_archive_paths(inv: Inventory) -> None:
    for path in [
        ROOT / "frontend/archive/ui-v1",
        ROOT / "docs/spec/governance-token/archive",
        ROOT / "docs/spec/archive",
    ]:
        if path.exists():
            inv.add(
                Item(
                    "LEGACY",
                    "archive_tree",
                    f"ARCH-{path.name.upper()}",
                    rel(path),
                    f"归档树 {sum(1 for _ in path.rglob('*') if _.is_file())} files",
                    "保留只读 · 禁止回流 runtime",
                    "P2",
                )
            )


def scan_route_api_drift(inv: Inventory) -> None:
    skip_files = {
        "scripts/dev/gen-tt-repository-alignment-inventory.py",
        "scripts/dev/gen-tt-full-system-alignment-stability-inventory.py",
        "docs/runbook/TT-REPOSITORY-ALIGNMENT-CLEANUP-PROGRAM.md",
        "docs/runbook/TT-FULL-SYSTEM-ALIGNMENT-STABILITY-PROGRAM.md",
    }
    for item_id, wrong, right, note in ROUTE_DRIFT_PATTERNS:
        hits = []
        for p in iter_files(ROOT / "scripts"):
            r = rel(p)
            if r in skip_files:
                continue
            try:
                if wrong in p.read_text(encoding="utf-8", errors="ignore"):
                    hits.append(r)
            except OSError:
                pass
        for p in iter_files(ROOT / "docs"):
            r = rel(p)
            if r in skip_files:
                continue
            try:
                if wrong in p.read_text(encoding="utf-8", errors="ignore"):
                    hits.append(r)
            except OSError:
                pass
        if hits:
            inv.add(
                Item(
                    "DELETE_CANDIDATE",
                    "route_drift",
                    item_id,
                    hits[0],
                    note + f" · hits={len(hits)}",
                    f"统一为 {right}",
                    "P0",
                )
            )
    inv.add(
        Item(
            "ACTIVE",
            "frontend_routes",
            "FE-GOV-ROUTES",
            "frontend/app/governance/**",
            f"治理前端 SSOT 路由 {len(GOV_FRONTEND_ROUTES_ACTIVE)} 条",
            "冻结 UI · 仅数据链",
            "—",
        )
    )
    inv.add(
        Item(
            "ACTIVE",
            "api_routes",
            "BE-GOV-GET",
            "crates/api/src/routes/governance/**",
            f"治理 GET 契约 {len(GOV_API_GET_ACTIVE)} 条 · read_contract guard",
            "与 MTM API 列对拍",
            "—",
        )
    )


def scan_dead_components(inv: Inventory) -> None:
    for path_str, symbol, reason in DEAD_COMPONENT_CANDIDATES:
        p = ROOT / path_str
        if not p.exists():
            continue
        if "/archive/" in path_str.replace("\\", "/"):
            continue
        importers = 0
        for f in iter_files(ROOT / "frontend"):
            if f == p:
                continue
            try:
                t = f.read_text(encoding="utf-8", errors="ignore")
            except OSError:
                continue
            if symbol in t and "import" in t:
                importers += 1
        if importers == 0:
            inv.add(
                Item(
                    "DELETE_CANDIDATE",
                    "dead_code",
                    f"DEAD-{symbol}",
                    path_str,
                    reason,
                    "删除或移入 archive · 更新 contract test",
                    "P2",
                )
            )


def scan_doc_narrative(inv: Inventory) -> None:
    skip_docs = {
        "docs/runbook/TT-REPOSITORY-ALIGNMENT-CLEANUP-PROGRAM.md",
        "scripts/dev/gen-tt-repository-alignment-inventory.py",
    }
    for p in iter_files(ROOT / "docs"):
        r = rel(p)
        if r in skip_docs or "archive" in r or "TTG-TOKENOMICS-FREEZE" in r:
            continue
        try:
            text = p.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        for label, pat in FORBIDDEN_DOC_NARRATIVE:
            if pat.search(text):
                inv.add(
                    Item(
                        "DELETE_CANDIDATE",
                        "doc_narrative",
                        f"DOC-NARR-{label}",
                        r,
                        f"旧分红/废止叙事残留 · {label}",
                        "修订或移 LEGACY · 禁止 ACTIVE 引用",
                        "P1",
                    )
                )
                break


def scan_superseded_audit_docs(inv: Inventory) -> None:
    for path, note in SUPERSEDED_DOC_PATHS:
        p = ROOT / path
        if not p.exists():
            continue
        try:
            text = p.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            text = ""
        marked = bool(SUPERSEDED_DOC_MARKER.search(text[:4000]))
        inv.add(
            Item(
                "LEGACY" if marked else "DELETE_CANDIDATE",
                "superseded_doc",
                f"DOC-LEG-{Path(path).stem[:24]}",
                path,
                note if not marked else f"{note} · 已标 SUPERSEDED · MTM 146",
                "—" if marked else "添加 SUPERSEDED · READ-ONLY · replaced by MTM 146",
                "P2",
            )
        )


def scan_evidence(inv: Inventory) -> None:
    archive_index_path = ROOT / "evidence" / "archive-evidence" / "ARCHIVE-EVIDENCE-INDEX.v1.json"
    archived_originals: set[str] = set()
    if archive_index_path.exists():
        try:
            idx = json.loads(archive_index_path.read_text(encoding="utf-8"))
            archived_originals = {e.get("original_path", "") for e in idx.get("entries", [])}
        except json.JSONDecodeError:
            archived_originals = set()

    inv.add(
        Item(
            "ACTIVE",
            "evidence",
            "EVID-ARCHIVE-INDEX",
            "evidence/archive-evidence/ARCHIVE-EVIDENCE-INDEX.v1.json",
            f"P3 归档索引 · entries={len(archived_originals)}",
            "只读 · 禁止删最终证据",
            "P3",
        )
    )

    for sub, marker in EVIDENCE_LATEST_KEYS:
        base = ROOT / "evidence" / sub
        if not base.exists():
            continue
        latest_file = base / marker
        latest = latest_file.read_text(encoding="utf-8").strip() if latest_file.exists() else ""
        inv.add(
            Item(
                "ACTIVE",
                "evidence",
                f"EVID-LATEST-{sub}",
                f"evidence/{sub}/{marker}",
                f"latest={latest or 'MISSING'}",
                "保留 latest + baseline 锚 · 旧 stamp 归档 archive-evidence",
                "P3",
            )
        )
        if not latest:
            continue
        stale = 0
        for child in base.iterdir():
            if not child.is_dir() or child.name == latest:
                continue
            if not STAMP_DIR_RE.match(child.name):
                continue
            if rel(child) in archived_originals:
                continue
            stale += 1
        if stale > 3:
            inv.add(
                Item(
                    "DELETE_CANDIDATE",
                    "evidence",
                    f"EVID-STALE-{sub}",
                    f"evidence/{sub}/",
                    f"{stale} 未归档旧 stamp · latest={latest}",
                    "运行 archive-tt-repo-alignment-stale-evidence.py --apply",
                    "P3",
                )
            )


def scan_governance_logic_reaudit_block(inv: Inventory) -> None:
    block_scripts = [
        "scripts/dev/run-tt-governance-enterprise-hat-audit.sh",
        "scripts/dev/gen-ttg-governance-full-coverage-matrix.py",
        "scripts/dev/run-g24-clean-baseline-01-root-cause-audit.sh",
    ]
    for s in block_scripts:
        p = ROOT / s
        if p.exists():
            inv.add(
                Item(
                    "LEGACY",
                    "audit_script",
                    f"NO-RERUN-{Path(s).stem[:20]}",
                    s,
                    "治理逻辑已 PASS · 本程序禁止重复评估",
                    "仅一致性扫描时只读引用",
                    "—",
                )
            )


def scan_permission_hints(inv: Inventory) -> None:
    inv.add(
        Item(
            "ACTIVE",
            "multi_identity",
            "ID-IA-HUB",
            "frontend/app/me/identities/**",
            "多重身份 Hub · ME-IDENTITIES-UI-FREEZE",
            "与治理数据链隔离验收",
            "—",
        )
    )
    inv.add(
        Item(
            "ACTIVE",
            "admin_boundary",
            "ADM-READONLY",
            "frontend/app/admin/**",
            "Admin 只读/门闸 · 无 Treasury 直转",
            "Cert #3 walkthrough",
            "P0",
        )
    )


def render_markdown(
    inv: Inventory,
    stamp: str,
    baseline_active: int,
    baseline_legacy: int,
    p0_route: int = 0,
    p1_doc: int = 0,
    p1_addr: int = 0,
    p2_dead: int = 0,
    p2_superseded: int = 0,
    p3_evidence: int = 0,
) -> str:
    c = inv.counts()
    lines = [
        "# Repository Alignment & Cleanup Execution Checklist",
        "",
        f"**Program:** `TT_REPOSITORY_ALIGNMENT_CLEANUP_PROGRAM`",
        f"**Stamp:** `{stamp}`",
        f"**Baseline SSOT:** GovFreeze V2 Clean Baseline",
        f"**Generated:** {datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')}",
        "",
        "**纪律：** 一致性 · 追溯性 · 仓库清洁度 · **禁止**重复评估已通过治理逻辑",
        "",
        f"**Inventory:** ACTIVE={c['ACTIVE']} · LEGACY={c['LEGACY']} · DELETE_CANDIDATE={c['DELETE_CANDIDATE']}",
        f"**P0 route drift open={p0_route}** · **P1 doc narrative open={p1_doc}** · **P1 address drift open={p1_addr}**",
        f"**P2 dead-code open={p2_dead}** · **P2 superseded-doc drift open={p2_superseded}**",
        f"**P3 evidence stale open={p3_evidence}** · **DELETE_CANDIDATE total={c['DELETE_CANDIDATE']}**",
        f"**Baseline addresses:** active={baseline_active} · legacy={baseline_legacy}",
        "",
        "---",
        "",
    ]
    for tier in ("ACTIVE", "LEGACY", "DELETE_CANDIDATE"):
        subset = [i for i in inv.items if i.tier == tier]
        lines.append(f"## {tier} ({len(subset)})")
        lines.append("")
        lines.append("| ID | Category | Path | Summary | Action | Risk |")
        lines.append("|----|----------|------|---------|--------|------|")
        for i in subset[:80]:
            sm = i.summary.replace("|", "\\|")[:100]
            lines.append(f"| {i.item_id} | {i.category} | `{i.path}` | {sm} | {i.action} | {i.risk} |")
        if len(subset) > 80:
            lines.append(f"| … | … | … | *+{len(subset)-80} rows in JSON* | … | … |")
        lines.append("")

    lines += [
        "## Execution queue（写死顺序）",
        "",
        "1. **P0** — 修复 ACTIVE 地址误引用 / 路由 drift（`proposals/create`→`new`）",
        "2. **P1** — 文档旧叙事 · legacy 地址无注释引用",
        "3. **P2** — 死代码 · superseded 矩阵/doc 标 LEGACY",
        "4. **P3** — evidence 旧 stamp 压缩（保留 latest + baseline freeze 锚）",
        "5. **禁止** — 删 `GOV-FREEZE-V2` env · 删 MTM · 重跑 enterprise hat audit",
        "",
        f"**Machine key:** `TT_REPO_ALIGN: ACTIVE={c['ACTIVE']} LEGACY={c['LEGACY']} DEL={c['DELETE_CANDIDATE']} P0_ROUTE_DRIFT={p0_route} BASELINE=V2`",
    ]
    return "\n".join(lines)


def main() -> None:
    import argparse

    ap = argparse.ArgumentParser()
    ap.add_argument("--out-dir", required=True)
    ap.add_argument("--stamp", default="")
    args = ap.parse_args()

    out = Path(args.out_dir)
    out.mkdir(parents=True, exist_ok=True)
    stamp = args.stamp or out.name or datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")

    active, legacy = load_baseline_env()
    inv = Inventory()

    scan_baseline_ssot(inv, active, legacy)
    scan_address_misuse(inv, active, legacy)
    scan_archive_paths(inv)
    scan_route_api_drift(inv)
    scan_dead_components(inv)
    scan_doc_narrative(inv)
    scan_superseded_audit_docs(inv)
    scan_evidence(inv)
    scan_governance_logic_reaudit_block(inv)
    scan_permission_hints(inv)

    c = inv.counts()
    p0_route = sum(
        1 for i in inv.items if i.tier == "DELETE_CANDIDATE" and i.category == "route_drift"
    )
    p1_doc = sum(
        1 for i in inv.items if i.tier == "DELETE_CANDIDATE" and i.category == "doc_narrative"
    )
    p1_addr = sum(
        1
        for i in inv.items
        if i.category == "address_drift"
        and i.risk == "P1"
        and (i.path.startswith("docs/") or i.path.startswith("scripts/"))
    )
    p2_dead = sum(
        1 for i in inv.items if i.tier == "DELETE_CANDIDATE" and i.category == "dead_code"
    )
    p2_superseded = sum(
        1 for i in inv.items if i.tier == "DELETE_CANDIDATE" and i.category == "superseded_doc"
    )
    p3_evidence = sum(
        1 for i in inv.items if i.tier == "DELETE_CANDIDATE" and i.category == "evidence"
    )

    payload = {
        "schema": "traveltrust.repository-alignment-inventory.v1",
        "program_id": "TT_REPOSITORY_ALIGNMENT_CLEANUP_PROGRAM",
        "stamp_utc": stamp,
        "baseline": "GovFreeze V2 Clean Baseline",
        "counts": inv.counts(),
        "p0_route_drift_open": p0_route,
        "p1_doc_narrative_open": p1_doc,
        "p1_address_drift_open": p1_addr,
        "p2_dead_code_open": p2_dead,
        "p2_superseded_doc_drift_open": p2_superseded,
        "p3_evidence_stale_open": p3_evidence,
        "baseline_addresses": {"active": len(active), "legacy": len(legacy)},
        "items": [i.to_dict() for i in inv.items],
        "honest_boundary": "inventory ≠ delete approval · Owner signoff per DELETE_CANDIDATE",
    }
    json_path = out / "REPOSITORY-ALIGNMENT-INVENTORY.v1.json"
    json_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")

    md = render_markdown(
        inv,
        stamp,
        len(active),
        len(legacy),
        p0_route,
        p1_doc,
        p1_addr,
        p2_dead,
        p2_superseded,
        p3_evidence,
    )
    md_path = out / "REPOSITORY-ALIGNMENT-EXECUTION-CHECKLIST.md"
    md_path.write_text(md, encoding="utf-8")

    program_stub = out / "PROGRAM-RUN-SUMMARY.txt"
    c = inv.counts()
    program_stub.write_text(
        f"TT_REPO_ALIGN: ACTIVE={c['ACTIVE']} LEGACY={c['LEGACY']} DELETE_CANDIDATE={c['DELETE_CANDIDATE']} "
        f"P0_ROUTE_DRIFT={p0_route} P1_DOC_NARRATIVE={p1_doc} P1_ADDRESS_DRIFT={p1_addr} "
        f"P2_DEAD_CODE={p2_dead} P2_SUPERSEDED_DOC={p2_superseded} P3_EVIDENCE_STALE={p3_evidence} stamp={stamp}\n",
        encoding="utf-8",
    )
    print(program_stub.read_text(encoding="utf-8").strip())


if __name__ == "__main__":
    main()
