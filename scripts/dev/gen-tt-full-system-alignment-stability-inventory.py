#!/usr/bin/env python3
"""TT_FULL_SYSTEM_ALIGNMENT_STABILITY_PROGRAM — 9-batch enterprise alignment inventory.

Forbidden: governance token design · Tokenomics · GovFreeze V2 · MTM 146 re-audit.
Allowed: consistency · traceability · repo cleanliness · BROKEN/NEEDS_FIX detection.
"""
from __future__ import annotations

import json
import os
import re
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

SKIP_DIR_NAMES = {
    ".git",
    ".next",
    "node_modules",
    "target",
    "dist",
    "build",
    "__pycache__",
}

FIVE_MAIN_ROUTES = ["/", "/traveltrust", "/market", "/did-rank", "/community"]

GOV_FE_ROUTES_EXPECTED = [
    "/governance",
    "/governance/params",
    "/governance/proposals",
    "/governance/proposals/new",
    "/governance/proposals/[id]",
    "/governance/delegate",
    "/governance/fee-routes",
    "/governance/vault-forwards",
    "/governance/distribution-accruals",
    "/governance/distribution-claim",
]

GOV_API_FE = [
    "/api/v1/governance/pool",
    "/api/v1/governance/rewards",
    "/api/v1/governance/fee-routes",
    "/api/v1/governance/vault-forwards",
    "/api/v1/governance/protocol-reference",
    "/api/v1/governance/params",
    "/api/v1/governance/proposals",
    "/api/v1/governance/proposal-status/:id",
    "/api/v1/governance/delegate",
    "/api/v1/governance/voting-power",
    "/api/v1/governance/investor-distribution-accruals",
    "/api/v1/governance/country-ledger/:jurisdiction",
    "/api/v1/governance/ttg-exchange/quote",
    "/api/v1/governance/state-machines",
]

GOV_API_BE_EXPECTED = [
    "/api/v1/governance/pool",
    "/api/v1/governance/rewards",
    "/api/v1/governance/fee-routes",
    "/api/v1/governance/vault-forwards",
    "/api/v1/governance/protocol-reference",
    "/api/v1/governance/params",
    "/api/v1/governance/proposals",
    "/api/v1/governance/proposal-status/",
    "/api/v1/governance/delegate",
    "/api/v1/governance/voting-power",
    "/api/v1/governance/investor-distribution-accruals",
    "/api/v1/governance/country-ledger/",
    "/api/v1/governance/ttg-exchange/quote",
    "/api/v1/governance/state-machines",
]

GOV_DB_TABLES = [
    "governance_pool",
    "governance_reward_records",
    "governance_proposals_projection",
    "governance_mvp_proposals",
    "governance_mvp_votes",
    "governance_mvp_delegations",
    "investor_distribution_accruals",
    "investor_distribution_accrual_lines",
    "p5_country_ledger_lines",
    "fee_router_routed_events",
    "region_vault_forwarded_events",
]

FLOW_CHAINS: list[tuple[str, list[str], str]] = [
    ("FLOW-AUTH", ["/auth/login", "/auth/register", "/me"], "注册/登录 → 个人中心"),
    ("FLOW-IDENTITIES", ["/me/identities"], "多重身份 Hub"),
    ("FLOW-PROVIDER", ["/provider/register", "/auth/register"], "商家入驻"),
    ("FLOW-MARKET", ["/market", "/market/acquisition"], "自由市场 · 收购"),
    ("FLOW-GOV-PROPOSAL", ["/governance/proposals", "/governance/proposals/new"], "治理提案"),
    ("FLOW-GOV-CLAIM", ["/governance/distribution-accruals", "/governance/distribution-claim"], "收益 · Claim 边界"),
    ("FLOW-ESCROW", ["/escrow/[id]"], "订单托管页"),
    ("FLOW-HOME", ["/"], "首页"),
]

FORBIDDEN_RERUN = [
    "run-tt-governance-enterprise-hat-audit.sh",
    "gen-ttg-governance-full-coverage-matrix.py",
    "run-g24-clean-baseline-01-root-cause-audit.sh",
    "assert-gov-freeze-v2-active-baseline-only.sh",
]


@dataclass
class Item:
    tier: str
    batch: int
    category: str
    item_id: str
    path: str
    summary: str
    action: str = "—"
    priority: str = "—"

    def to_dict(self) -> dict:
        return {
            "tier": self.tier,
            "batch": self.batch,
            "category": self.category,
            "id": self.item_id,
            "path": self.path,
            "summary": self.summary,
            "action": self.action,
            "priority": self.priority,
        }


@dataclass
class Inventory:
    items: list[Item] = field(default_factory=list)

    def add(self, item: Item) -> None:
        self.items.append(item)

    def counts(self) -> dict[str, int]:
        tiers = ["ACTIVE", "LEGACY", "DELETE_CANDIDATE", "BROKEN", "NEEDS_FIX"]
        return {t: sum(1 for i in self.items if i.tier == t) for t in tiers}

    def fix_queue(self) -> dict[str, list[dict]]:
        out: dict[str, list[dict]] = {"P0": [], "P1": [], "P2": []}
        for i in self.items:
            if i.priority in out and i.tier in ("BROKEN", "NEEDS_FIX", "DELETE_CANDIDATE"):
                out[i.priority].append(i.to_dict())
        return out


def rel(p: Path) -> str:
    try:
        return str(p.relative_to(ROOT)).replace("\\", "/")
    except ValueError:
        return str(p)


def discover_fe_routes() -> set[str]:
    routes: set[str] = set()
    app = ROOT / "frontend" / "app"
    for page in app.rglob("page.tsx"):
        parts = page.relative_to(app).parts
        if parts[-1] != "page.tsx":
            continue
        segs = list(parts[:-1])
        if segs == ["(home)"]:
            routes.add("/")
        elif segs and segs[0].startswith("("):
            route = "/" + "/".join(segs[1:]) if len(segs) > 1 else "/"
            routes.add(route.rstrip("/") or "/")
        else:
            route = "/" + "/".join(segs) if segs else "/"
            routes.add(route)
    return routes


def extract_fe_api_paths() -> set[str]:
    routes_ts = ROOT / "frontend" / "lib" / "api" / "routes.ts"
    if not routes_ts.exists():
        return set()
    text = routes_ts.read_text(encoding="utf-8", errors="ignore")
    paths = set(re.findall(r'"(/(?:api/v1|auth)/[^"]+)"', text))
    paths |= set(re.findall(r"'(/(?:api/v1|auth)/[^']+)'", text))
    return paths


def extract_be_routes() -> set[str]:
    routes_dir = ROOT / "crates" / "api" / "src" / "routes"
    found: set[str] = set()
    pat = re.compile(r'"(?P<path>/api/v1/[^"]+|/auth/[^"]+)"')
    for p in routes_dir.rglob("*.rs"):
        try:
            text = p.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        for m in pat.finditer(text):
            found.add(m.group("path"))
    return found


def migration_tables() -> set[str]:
    mig = ROOT / "crates" / "api" / "migrations"
    tables: set[str] = set()
    pat = re.compile(r"CREATE TABLE(?: IF NOT EXISTS)?\s+([a-z_][a-z0-9_]*)", re.I)
    for f in mig.glob("*.sql"):
        try:
            text = f.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        tables.update(pat.findall(text))
    return tables


def handler_table_refs() -> set[str]:
    gov = ROOT / "crates" / "api" / "src" / "routes" / "governance"
    refs: set[str] = set()
    pat = re.compile(r'"(?:FROM|INTO|UPDATE|JOIN)\s+([a-z_][a-z0-9_]*)"', re.I)
    for p in gov.rglob("*.rs"):
        try:
            text = p.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        refs.update(pat.findall(text))
    return refs


def load_baseline_addresses() -> tuple[dict[str, str], dict[str, str]]:
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


def scan_batch1(inv: Inventory, fe_routes: set[str]) -> None:
    inv.add(
        Item(
            "ACTIVE",
            1,
            "frontend_routes",
            "FE-PAGES-DISCOVERED",
            "frontend/app/**/page.tsx",
            f"发现 {len(fe_routes)} 条 App Router 页面",
            "SSOT 页面树",
            "—",
        )
    )
    for r in FIVE_MAIN_ROUTES:
        ok = r in fe_routes or (r == "/" and "/" in fe_routes)
        inv.add(
            Item(
                "ACTIVE" if ok else "BROKEN",
                1,
                "five_main",
                f"FE-FIVE-{r.replace('/', '_') or 'HOME'}",
                f"frontend/app{r if r != '/' else '/(home)'}",
                f"五主路由 {r}",
                "恢复 page.tsx" if not ok else "FIVE-MAIN 冻结",
                "P0" if not ok else "—",
            )
        )
    for r in GOV_FE_ROUTES_EXPECTED:
        ok = r in fe_routes
        inv.add(
            Item(
                "ACTIVE" if ok else "BROKEN",
                1,
                "governance_routes",
                f"FE-GOV-{r.replace('/', '-').strip('-')}",
                f"frontend/app{r.replace('[id]', '[id]')}",
                f"治理页 {r}",
                "补 page.tsx" if not ok else "—",
                "P0" if not ok else "—",
            )
        )
    # Script alias vs real route — SSOT `/governance?view=region` · redirect in next.config.js
    alias = "/governance/steward-region-workbench"
    real = "/governance?view=region"
    next_cfg = ""
    next_path = ROOT / "frontend" / "next.config.js"
    if next_path.exists():
        next_cfg = next_path.read_text(encoding="utf-8", errors="ignore")
    has_redirect = alias in next_cfg and "/governance?view=region" in next_cfg
    if alias not in fe_routes:
        if has_redirect:
            inv.add(
                Item(
                    "ACTIVE",
                    1,
                    "route_alias_redirect",
                    "FE-GOV-STEWARD-REDIRECT",
                    "frontend/next.config.js",
                    f"alias {alias} → {real} · Next redirect 已配置",
                    "—",
                    "—",
                )
            )
        else:
            inv.add(
                Item(
                    "NEEDS_FIX",
                    1,
                    "route_alias_drift",
                    "FE-GOV-STEWARD-ALIAS",
                    "scripts/dev/capture-hat-r1-screenshots.mjs",
                    f"脚本/e2e 引用 {alias} · 真入口 {real}（StewardRegionWorkbenchMain）",
                    f"统一 redirect 或改脚本为 {real}",
                    "P1",
                )
            )
    drift_hits: list[str] = []
    wrong = "/governance/proposals/create"
    for base in [ROOT / "scripts", ROOT / "docs"]:
        for p in base.rglob("*"):
            if p.suffix not in {".sh", ".md", ".mjs", ".ts", ".py"}:
                continue
            if "gen-tt-full-system" in p.name or "gen-tt-repository" in p.name:
                continue
            try:
                if wrong in p.read_text(encoding="utf-8", errors="ignore"):
                    drift_hits.append(rel(p))
            except OSError:
                pass
    if drift_hits:
        inv.add(
            Item(
                "DELETE_CANDIDATE",
                1,
                "route_drift",
                "FE-ROUTE-DRIFT-CREATE",
                drift_hits[0],
                f"旧路由 {wrong} · hits={len(drift_hits)}",
                "统一为 /governance/proposals/new",
                "P0",
            )
        )
    else:
        inv.add(
            Item(
                "ACTIVE",
                1,
                "route_drift",
                "FE-ROUTE-PROPOSALS-NEW",
                "frontend/app/governance/proposals/new/page.tsx",
                "提案创建 SSOT = /governance/proposals/new",
                "—",
                "—",
            )
        )


def scan_batch2(inv: Inventory, fe_api: set[str], be_routes: set[str]) -> None:
    inv.add(
        Item(
            "ACTIVE",
            2,
            "api_inventory",
            "FE-API-PATHS",
            "frontend/lib/api/routes.ts",
            f"FE 路径常量 {len(fe_api)} 条",
            "与 04 §三对拍",
            "—",
        )
    )
    inv.add(
        Item(
            "ACTIVE",
            2,
            "api_inventory",
            "BE-ROUTES-RS",
            "crates/api/src/routes/**",
            f"BE 路由字面量 {len(be_routes)} 条",
            "—",
            "—",
        )
    )
    fe_aliases = {
        "/api/v1/governance/params": ["/api/v1/governance/protocol-reference"],
        "/api/v1/governance/proposal-status/:id": ["/api/v1/governance/proposal-status/"],
        "/api/v1/governance/country-ledger/:jurisdiction": [
            "/api/v1/governance/protocol-reference",
            "/api/v1/country-ledger/",
        ],
    }
    for path in GOV_API_FE:
        norm = path.replace(":id", ":proposal_id").replace(":jurisdiction", ":jurisdiction")
        fe_ok = any(
            path.split("?")[0] in p
            or norm.split("?")[0] in p
            or any(alias in p for alias in fe_aliases.get(path, []))
            for p in fe_api
        ) or any(
            fn in (ROOT / "frontend/lib/api/routes.ts").read_text(encoding="utf-8", errors="ignore")
            for fn in ("governanceProposalStatus", "governanceProtocolReference")
            if "proposal-status" in path or "params" in path
        )
        be_ok = any(prefix in b for prefix in [
            path.replace(":id", ":proposal_id"),
            path.replace(":proposal_id", ":id"),
            path.split("?")[0],
        ] for b in be_routes) or any(
            exp in b for b in be_routes for exp in GOV_API_BE_EXPECTED if exp in path
        )
        tier = "ACTIVE" if (fe_ok and be_ok) else ("BROKEN" if not be_ok else "NEEDS_FIX")
        note = ""
        if path == "/api/v1/governance/params" and fe_ok and tier == "ACTIVE":
            note = " · FE 经 protocol-reference 镜像"
        if path == "/api/v1/governance/country-ledger/:jurisdiction" and fe_ok:
            note = " · FE 经 params/protocol-reference 或 country-ledger"
        inv.add(
            Item(
                tier,
                2,
                "governance_api_parity",
                f"API-PARITY-{path.split('/')[-1][:20]}",
                path,
                f"FE={'Y' if fe_ok else 'N'} BE={'Y' if be_ok else 'N'} · {path}{note}",
                "补 BE handler 或 FE routes.ts" if tier != "ACTIVE" else "—",
                "P0" if tier == "BROKEN" else ("P1" if tier == "NEEDS_FIX" else "—"),
            )
        )


def scan_batch3(inv: Inventory) -> None:
    tables = migration_tables()
    refs = handler_table_refs()
    inv.add(
        Item(
            "ACTIVE",
            3,
            "database",
            "DB-MIGRATIONS",
            "crates/api/migrations/",
            f"SQLx migrations · {len(list((ROOT / 'crates/api/migrations').glob('*.sql')))} files · {len(tables)} tables",
            "—",
            "—",
        )
    )
    for t in GOV_DB_TABLES:
        exists = t in tables
        inv.add(
            Item(
                "ACTIVE" if exists else "BROKEN",
                3,
                "governance_table",
                f"DB-TBL-{t}",
                f"crates/api/migrations/*",
                f"治理表 {t} {'存在' if exists else '缺失'}",
                "补 migration" if not exists else "—",
                "P0" if not exists else "—",
            )
        )
    orphan_refs = sorted(refs - tables - {"users", "sessions", "orders"})
    for t in orphan_refs[:5]:
        inv.add(
            Item(
                "NEEDS_FIX",
                3,
                "handler_table_ref",
                f"DB-REF-ORPHAN-{t}",
                "crates/api/src/routes/governance/",
                f"handler 引用 {t} · migration 未找到 CREATE TABLE",
                "补 migration 或修正 SQL",
                "P1",
            )
        )


def scan_batch4(inv: Inventory) -> None:
    active, legacy = load_baseline_addresses()
    inv.add(
        Item(
            "ACTIVE",
            4,
            "baseline_env",
            "ENV-GOVFREEZE-V2",
            "scripts/dev/.env.phase2-chain-deploy.local",
            f"ACTIVE 地址 {len(active)} · LEGACY {len(legacy)}",
            "禁止替换 LEGACY 为 ACTIVE",
            "—",
        )
    )
    abi_dir = ROOT / "frontend" / "lib" / "governance"
    abi_files = list(abi_dir.glob("*Abi*.ts")) + list(abi_dir.glob("*abi*.ts"))
    inv.add(
        Item(
            "ACTIVE" if abi_files else "NEEDS_FIX",
            4,
            "abi",
            "FE-GOV-ABI",
            "frontend/lib/governance/",
            f"治理 ABI 模块 {len(abi_files)} 个",
            "—",
            "P2" if not abi_files else "—",
        )
    )
    reg = ROOT / "registry" / "protocol-convergence-deployments.v1.yaml"
    if reg.exists():
        text = reg.read_text(encoding="utf-8", errors="ignore")
        for addr in legacy.values():
            if addr.lower() in text.lower() and "legacy" not in text.lower()[:2000]:
                inv.add(
                    Item(
                        "NEEDS_FIX",
                        4,
                        "registry_drift",
                        "REG-LEGACY-NO-COMMENT",
                        rel(reg),
                        f"registry 含 legacy 地址 {addr[:10]}… 无 LEGACY 注释",
                        "添加 # LEGACY cutover 旁证",
                        "P1",
                    )
                )
                break
        else:
            inv.add(
                Item(
                    "ACTIVE",
                    4,
                    "registry",
                    "REG-PROTOCOL-CONVERGENCE",
                    rel(reg),
                    "protocol-convergence-deployments.v1.yaml",
                    "—",
                    "—",
                )
            )


def scan_batch5(inv: Inventory, fe_routes: set[str]) -> None:
    admin_pages = [r for r in fe_routes if r.startswith("/admin")]
    inv.add(
        Item(
            "ACTIVE",
            5,
            "admin",
            "ADM-PAGES",
            "frontend/app/admin/**",
            f"Admin 页面 {len(admin_pages)} 条",
            "Cert #3 walkthrough",
            "—",
        )
    )
    rbac_files = list((ROOT / "crates/api/src/routes/admin").glob("*rbac*"))
    inv.add(
        Item(
            "ACTIVE" if rbac_files else "BROKEN",
            5,
            "admin_rbac",
            "ADM-RBAC-API",
            "crates/api/src/routes/admin/admin_rbac.rs",
            "Admin RBAC route-matrix / capabilities",
            "—",
            "P0" if not rbac_files else "—",
        )
    )
    id_ok = "/me/identities" in fe_routes
    inv.add(
        Item(
            "ACTIVE" if id_ok else "BROKEN",
            5,
            "multi_identity",
            "ID-HUB-PAGE",
            "frontend/app/me/identities/page.tsx",
            "多重身份 Hub · ME-IDENTITIES-UI-FREEZE",
            "—",
            "P0" if not id_ok else "—",
        )
    )


def scan_batch6(inv: Inventory, fe_routes: set[str]) -> None:
    for fid, chain, label in FLOW_CHAINS:
        missing = [r for r in chain if r not in fe_routes]
        tier = "ACTIVE" if not missing else "BROKEN"
        inv.add(
            Item(
                tier,
                6,
                "business_flow",
                fid,
                " · ".join(chain),
                f"{label} · missing={missing or 'none'}",
                "补路由/链路" if missing else "真人 UAT 待 Cert",
                "P0" if missing else "—",
            )
        )
    real = "/governance?view=region"
    next_path = ROOT / "frontend" / "next.config.js"
    has_redirect = False
    if next_path.exists():
        nc = next_path.read_text(encoding="utf-8", errors="ignore")
        has_redirect = "/governance/steward-region-workbench" in nc and "/governance?view=region" in nc
    if not has_redirect:
        inv.add(
            Item(
                "NEEDS_FIX",
                6,
                "business_flow",
                "FLOW-STEWARD-WORKBENCH",
                real,
                "质押/Seat 工作台真入口 · 脚本 alias 漂移",
                "redirect 或更新 capture/e2e",
                "P1",
            )
        )
    else:
        inv.add(
            Item(
                "ACTIVE",
                6,
                "business_flow",
                "FLOW-STEWARD-WORKBENCH",
                real,
                "质押/Seat 工作台 · alias redirect → ?view=region",
                "—",
                "—",
            )
        )


def scan_batch7(inv: Inventory, fe_routes: set[str]) -> None:
    fin_routes = [
        ("/governance/params", "Treasury/45-55 参数页"),
        ("/governance/distribution-accruals", "Accruals 只读"),
        ("/governance/distribution-claim", "Claim 边界"),
        ("/governance/fee-routes", "FeeRouter 正交"),
    ]
    for r, note in fin_routes:
        ok = r in fe_routes
        inv.add(
            Item(
                "ACTIVE" if ok else "BROKEN",
                7,
                "finance_ui",
                f"FIN-UI-{r.split('/')[-1]}",
                f"frontend/app{r.lstrip('/')}",
                note,
                "—",
                "P0" if not ok else "—",
            )
        )
    fl = ROOT / "evidence/GO_tt_country_pool_revenue_enterprise_hat/latest-stamp.txt"
    if fl.exists():
        stamp = fl.read_text(encoding="utf-8").strip()
        reconcile = ROOT / "evidence/GO_tt_country_pool_revenue_enterprise_hat" / stamp / "four-ledger-reconcile.json"
        inv.add(
            Item(
                "ACTIVE" if reconcile.exists() else "NEEDS_FIX",
                7,
                "four_ledger",
                "EVID-FOUR-LEDGER",
                rel(reconcile) if reconcile.exists() else rel(fl),
                f"四账 reconcile · latest={stamp} · 只读引用不重跑",
                "—",
                "P1" if not reconcile.exists() else "—",
            )
        )


def scan_batch8(inv: Inventory) -> None:
    for name in FORBIDDEN_RERUN:
        p = ROOT / "scripts/dev" / name
        if p.exists():
            inv.add(
                Item(
                    "LEGACY",
                    8,
                    "no_rerun_script",
                    f"LEGACY-{name[:24]}",
                    f"scripts/dev/{name}",
                    "已通过治理逻辑 · 禁止本程序重审计",
                    "只读引用",
                    "—",
                )
            )
    archive = ROOT / "frontend/archive/ui-v1"
    if archive.exists():
        inv.add(
            Item(
                "LEGACY",
                8,
                "archive_tree",
                "ARCH-UI-V1",
                rel(archive),
                f"归档 UI v1 · {sum(1 for _ in archive.rglob('*') if _.is_file())} files",
                "禁止回流 runtime",
                "—",
            )
        )
    superseded = ROOT / "docs/spec/governance-token/TTG-GOVERNANCE-FULL-COVERAGE-MATRIX.md"
    if superseded.exists():
        head = superseded.read_text(encoding="utf-8", errors="ignore")[:3000]
        marked = "SUPERSEDED" in head and "MTM 146" in head
        inv.add(
            Item(
                "LEGACY" if marked else "NEEDS_FIX",
                8,
                "superseded_doc",
                "DOC-FULL-COVERAGE-MATRIX",
                rel(superseded),
                "834 行矩阵 · MTM 146 取代",
                "—" if marked else "加 SUPERSEDED 头",
                "P2" if not marked else "—",
            )
        )


def scan_batch9(inv: Inventory, out_dir: Path) -> dict:
    probes: dict = {"local_api": {}, "ai_probe": {}, "chain_read": {}}
    api_base = os.environ.get("TRAVELTRUST_API_BASE", "http://127.0.0.1:8080")
    for path in ["/health", "/meta", "/api/v1/governance/protocol-reference"]:
        url = f"{api_base.rstrip('/')}{path}"
        try:
            with urllib.request.urlopen(url, timeout=3) as resp:
                probes["local_api"][path] = {"status": resp.status, "ok": resp.status == 200}
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            probes["local_api"][path] = {"ok": False, "error": str(e)[:120]}
    ai_script = ROOT / "scripts/dev/ai-pre-human-uat-probe.py"
    ai_pass = ROOT / "evidence/GO_ai_pre_human_uat/latest-stamp.txt"
    if ai_pass.exists():
        stamp = ai_pass.read_text(encoding="utf-8").strip()
        pj = ROOT / "evidence/GO_ai_pre_human_uat" / stamp / "api-chain-probe.json"
        if pj.exists():
            probes["ai_probe"] = json.loads(pj.read_text(encoding="utf-8"))
    if ai_script.exists():
        inv.add(
            Item(
                "ACTIVE",
                9,
                "stability_probe",
                "PROBE-AI-PRE-UAT",
                rel(ai_pass) if ai_pass.exists() else rel(ai_script),
                "复用 AI 预验收 probe · 不重跑 GovFreeze assert",
                "—",
                "—",
            )
        )
    any_api = any(v.get("ok") for v in probes["local_api"].values())
    inv.add(
        Item(
            "ACTIVE" if any_api else "NEEDS_FIX",
            9,
            "stability_probe",
            "PROBE-LOCAL-API",
            api_base,
            f"本地 API 探针 · reachable={any_api}",
            "启动 API 后重扫 Batch 9" if not any_api else "—",
            "P2" if not any_api else "—",
        )
    )
    (out_dir / "batch9-stability-probes.json").write_text(
        json.dumps(probes, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    return probes


def render_checklist(inv: Inventory, stamp: str, fix_q: dict) -> str:
    c = inv.counts()
    lines = [
        "# Full System Alignment & Stability — Execution Checklist",
        "",
        f"**Program:** `TT_FULL_SYSTEM_ALIGNMENT_STABILITY_PROGRAM`",
        f"**Stamp:** `{stamp}`",
        f"**Baseline:** GovFreeze V2 Clean Baseline（只读 · 禁止重审计）",
        f"**Generated:** {datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')}",
        "",
        "**纪律：** 一致性 · 追溯性 · 稳定性 · **禁止** Tokenomics/GovFreeze/MTM146 重复审计",
        "",
        f"**Inventory:** ACTIVE={c['ACTIVE']} · LEGACY={c['LEGACY']} · DELETE_CANDIDATE={c['DELETE_CANDIDATE']} · BROKEN={c['BROKEN']} · NEEDS_FIX={c['NEEDS_FIX']}",
        f"**Fix queue:** P0={len(fix_q['P0'])} · P1={len(fix_q['P1'])} · P2={len(fix_q['P2'])}",
        "",
        "---",
        "",
    ]
    for batch in range(1, 10):
        subset = [i for i in inv.items if i.batch == batch]
        lines.append(f"## Batch {batch} ({len(subset)} items)")
        lines.append("")
        for tier in ("BROKEN", "NEEDS_FIX", "DELETE_CANDIDATE", "ACTIVE", "LEGACY"):
            tier_items = [i for i in subset if i.tier == tier]
            if not tier_items:
                continue
            lines.append(f"### {tier} ({len(tier_items)})")
            lines.append("")
            lines.append("| ID | Path | Summary | Priority | Action |")
            lines.append("|----|------|---------|----------|--------|")
            for i in tier_items[:40]:
                sm = i.summary.replace("|", "\\|")[:90]
                lines.append(f"| {i.item_id} | `{i.path[:60]}` | {sm} | {i.priority} | {i.action} |")
            lines.append("")
    lines += [
        "## Fix queue",
        "",
        "### P0",
        "",
    ]
    for i in fix_q["P0"][:30]:
        lines.append(f"- **{i['id']}** · `{i['path']}` · {i['summary'][:80]}")
    lines += ["", "### P1", ""]
    for i in fix_q["P1"][:30]:
        lines.append(f"- **{i['id']}** · `{i['path']}` · {i['summary'][:80]}")
    lines += ["", "### P2", ""]
    for i in fix_q["P2"][:30]:
        lines.append(f"- **{i['id']}** · `{i['path']}` · {i['summary'][:80]}")
    lines.append("")
    lines.append(
        f"**Machine key:** `TT_FULL_SYS_ALIGN: ACTIVE={c['ACTIVE']} LEGACY={c['LEGACY']} "
        f"DEL={c['DELETE_CANDIDATE']} BROKEN={c['BROKEN']} FIX={c['NEEDS_FIX']} "
        f"P0={len(fix_q['P0'])} P1={len(fix_q['P1'])} P2={len(fix_q['P2'])}`"
    )
    return "\n".join(lines)


def main() -> None:
    import argparse

    ap = argparse.ArgumentParser()
    ap.add_argument("--out-dir", required=True)
    ap.add_argument("--stamp", default="")
    args = ap.parse_args()

    out = Path(args.out_dir)
    out.mkdir(parents=True, exist_ok=True)
    stamp = args.stamp or out.name

    inv = Inventory()
    fe_routes = discover_fe_routes()
    fe_api = extract_fe_api_paths()
    be_routes = extract_be_routes()

    scan_batch1(inv, fe_routes)
    scan_batch2(inv, fe_api, be_routes)
    scan_batch3(inv)
    scan_batch4(inv)
    scan_batch5(inv, fe_routes)
    scan_batch6(inv, fe_routes)
    scan_batch7(inv, fe_routes)
    scan_batch8(inv)
    probes = scan_batch9(inv, out)

    fix_q = inv.fix_queue()
    counts = inv.counts()

    payload = {
        "schema": "traveltrust.full-system-alignment-inventory.v1",
        "program_id": "TT_FULL_SYSTEM_ALIGNMENT_STABILITY_PROGRAM",
        "stamp_utc": stamp,
        "baseline": "GovFreeze V2 Clean Baseline",
        "forbidden_rerun": ["Tokenomics design", "GovFreeze V2 assert", "MTM 146 logic audit", "Enterprise HAT re-audit"],
        "counts": counts,
        "fix_queue_counts": {k: len(v) for k, v in fix_q.items()},
        "fix_queue": fix_q,
        "batch9_probes": probes,
        "fe_route_count": len(fe_routes),
        "items": [i.to_dict() for i in inv.items],
        "honest_boundary": "② alignment inventory ≠ ③ Production GO · BROKEN/NEEDS_FIX ≠ auto-fix",
    }
    json_path = out / "FULL-SYSTEM-ALIGNMENT-INVENTORY.v1.json"
    json_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")

    md = render_checklist(inv, stamp, fix_q)
    (out / "FULL-SYSTEM-ALIGNMENT-EXECUTION-CHECKLIST.md").write_text(md, encoding="utf-8")

    summary = (
        f"TT_FULL_SYS_ALIGN: ACTIVE={counts['ACTIVE']} LEGACY={counts['LEGACY']} "
        f"DELETE_CANDIDATE={counts['DELETE_CANDIDATE']} BROKEN={counts['BROKEN']} "
        f"NEEDS_FIX={counts['NEEDS_FIX']} P0={len(fix_q['P0'])} P1={len(fix_q['P1'])} "
        f"P2={len(fix_q['P2'])} stamp={stamp}\n"
    )
    (out / "PROGRAM-RUN-SUMMARY.txt").write_text(summary, encoding="utf-8")
    print(summary.strip())


if __name__ == "__main__":
    main()
