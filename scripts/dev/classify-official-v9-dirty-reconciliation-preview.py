#!/usr/bin/env python3
"""OFFICIAL_V9_PRODUCT_BASELINE dirty reconciliation preview (read-only classification)."""
from __future__ import annotations

import json
import re
import subprocess
from collections import Counter
from pathlib import Path

OPS = "3e356617a498b0faac42e4ae457343d36294a770"
ROOT = Path(__file__).resolve().parents[2] if False else Path(".")

HEAD = subprocess.check_output(["git", "rev-parse", "HEAD"], text=True).strip()
porcelain = subprocess.check_output(
    ["git", "-c", "core.quotepath=false", "status", "--porcelain", "-uall"],
    text=True,
    encoding="utf-8",
    errors="replace",
)
entries: list[tuple[str, str]] = []
for line in porcelain.splitlines():
    if not line.strip():
        continue
    code = line[:2]
    path = line[3:]
    if " -> " in path:
        path = path.split(" -> ", 1)[1]
    path = path.replace("\\", "/")
    if path.startswith('"') and path.endswith('"'):
        # git C-style quoted path
        raw = path[1:-1].encode("utf-8").decode("unicode_escape")
        path = raw.replace("\\", "/")
    entries.append((code, path))

V9_KEEP_PREFIXES = (
    "docs/github-official/",
    "docs/whitepaper/",
    "registry/ttg-v9-",
    "evidence/GO_ttg_v9_audit/",
    "evidence/GO_ttg_v9_mainnet_dl_r1/",
)
V9_KEEP_FILES = {
    "SECURITY.md",
    "docs/runbook/TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST.md",
    "docs/runbook/TT-TTG-V9-DOCUMENTATION-TRUTH-CONVERGENCE-RESIDUE-LATEST.md",
    "docs/runbook/TT-TTG-V9-OWNER-DESIGN-LOCK-LATEST.md",
    "docs/runbook/TT-TTG-V9-MAINNET-BROADCAST-PHASE1-STOP-LATEST.md",
    "docs/runbook/TT-TTG-V9-MAINNET-DL-R1-PHASE2-FREEZE-WAIT-LATEST.md",
    "docs/runbook/TT-TTG-V9-MAINNET-PRE-BROADCAST-FINAL-LATEST.md",
    "docs/runbook/TT-TTG-V9-OFFICIAL-WEBSITE-ALIGNMENT-CANDIDATE-OWNER-CHECKLIST-LATEST.md",
    "docs/runbook/TT-FINAL-TRUTH-BASELINE-LATEST.md",
    "docs/runbook/TT-FINAL-TRUTH-BASELINE-LATEST.json",
    "docs/fundraising/external/06-Whitepaper.md",
    "docs/fundraising/external/en/06-Whitepaper.md",
    "README.md",
}
V9_KEEP_NAME_RE = re.compile(
    r"TT-TTG-V9-|ttg-v9-documentation|ttg-v9-mainnet-edition|ttg-v9-github|"
    r"V9_DOCUMENTATION|V9_GITHUB|TTG_V9_MAINNET|DesignLock|Design-Lock|"
    r"run-ttg-v9-doc-truth|run-ttg-v9-mainnet-edition|run-ttg-v9-github|"
    r"TtgV9DesignLock|TtgV9CountryFee|TtgV9ProjectPool|TtgV9RoleStake|TtgV9SoloTimelock|"
    r"TtgV9DesignLockMainnet|TtgV9DesignLockSepolia|TtgV9DesignLockLocal|"
    r"TtgGovRootReplacement|OWNER-MAINNET-CUTOVER|OWNER-ECONOMIC|OWNER-ANSWERS|"
    r"AI-AUDIT[123]-DESIGN-LOCK|SECURITY-AUDIT-LADDER|GOVERNANCE-ROOT|"
    r"MONEY-FLOW-ECONOMIC|OFFICIAL-FULL-TOPOLOGY|PRE-DEPLOY-COMPILER|"
    r"MAINNET-DEPLOY-AUTHORIZATION|MAINNET-RELEASE-AUDIT|EXTERNAL-FIRM-AUDIT|"
    r"REMINT-FINAL-NORM|FULL-25T-REMINT|UPGRADE-DESIGN"
)
GENERATED_RE = re.compile(
    r"(^|/)(cache-ttg-|out-ttg-|broadcast/)|"
    r"\.s\.sol/\d+/run-.*\.json$|solidity-files-cache\.json$|"
    r"/build-info/"
)
LEGACY_HIST_RE = re.compile(
    r"remint|R2_FINAL|V9_REMINT|ttg-v8|GlobalStakersFeeVault|"
    r"GO_ttg_v9_remint|FUSION-3|FUSION-CANDIDATE|LIVE-LOGIC-FUSION",
    re.I,
)


def in_ops_tree(path: str) -> bool:
    r = subprocess.run(["git", "cat-file", "-e", f"{OPS}:{path}"], capture_output=True)
    return r.returncode == 0


def classify(code: str, path: str) -> tuple[str, str]:
    if GENERATED_RE.search(path) or path.startswith("contracts/cache-") or path.startswith(
        "contracts/out-"
    ):
        return "DELETE_GENERATED", "build/cache/out/broadcast artifact"
    if any(path.startswith(x) for x in V9_KEEP_PREFIXES) or path in V9_KEEP_FILES:
        return "COMMIT", "V9 Web3/Documentation Official pack (must retain)"
    if path.startswith("scripts/dev/") and (
        "ttg-v9" in path or "ttg_v9" in path or "mainnet-dl" in path or "phase2-sepolia" in path
    ):
        return "COMMIT", "V9/Mainnet scripts"
    if path.startswith("scripts/") and "ttg-v9" in path:
        return "COMMIT", "V9 scripts"
    if path.startswith("contracts/src/ttg-v9/") and "Remint" not in path:
        return "COMMIT", "V9 Design Lock / Phase1 contracts"
    if path.startswith("contracts/test/") and ("DesignLock" in path or "GovRoot" in path):
        return "COMMIT", "V9 Design Lock tests"
    if path == "contracts/foundry.toml":
        return "COMMIT", "foundry ttg_v9 profile"
    if path == "contracts/src/GlobalStakersFeeVault.sol":
        return "LEGACY_KEEP", "LEGACY GlobalStakersFeeVault — historical source"
    if LEGACY_HIST_RE.search(path):
        if path.startswith(("evidence/", "docs/", "registry/", "contracts/")):
            return "LEGACY_KEEP", "HISTORICAL remint/V8 residue retain (not ACTIVE)"
    if V9_KEEP_NAME_RE.search(path) and path.startswith(("docs/", "evidence/", "registry/")):
        if (
            re.search(r"REMINT|FULL-25T-REMINT|UPGRADE-DESIGN", path)
            and "DESIGN-LOCK" not in path
            and "DOCUMENTATION" not in path
            and "MAINNET" not in path
        ):
            return "LEGACY_KEEP", "Pre-DL remint/upgrade design HISTORICAL"
        return "COMMIT", "V9 SSOT docs/evidence/registry"
    if path.startswith("frontend/"):
        if in_ops_tree(path):
            return "RESTORE_FROM_OFFICIAL", f"OPS pin {OPS[:12]} product mother"
        if "M" in code:
            return "RESTORE_FROM_OFFICIAL", "not in OPS tree — discard local mod (checkout HEAD)"
        if code.startswith("??"):
            return "DELETE_GENERATED", "untracked frontend not in OPS — discard"
        return "UNKNOWN", f"frontend odd code={code!r}"
    if path.startswith(("crates/", "data/")):
        return "RESTORE_FROM_OFFICIAL", "discard local non-V9 backend/data mods (checkout HEAD)"
    if path.startswith("evidence/"):
        if "ttg_v9_audit" in path or "ttg_v9_mainnet" in path:
            return "COMMIT", "V9 audit/mainnet evidence"
        return "LEGACY_KEEP", "other evidence retain"
    if path.startswith("docs/") or path.startswith("registry/"):
        return "COMMIT", "docs/registry retain (V9 demotion or SSOT)"
    if path.startswith("scripts/dev/classify-official-v9-dirty-reconciliation-preview.py"):
        return "COMMIT", "this reconciliation classifier"
    if path.startswith("scripts/"):
        # Unrelated script dirty vs HEAD — discard local mods toward clean baseline
        return "RESTORE_FROM_OFFICIAL", "non-V9 scripts dirty — discard local mod (checkout HEAD)"
    if path.startswith("contracts/"):
        return "LEGACY_KEEP", "other contracts dirty — LEGACY/retain careful"
    return "UNKNOWN", f"unclassified code={code!r}"


def main() -> int:
    rows = []
    for code, path in entries:
        action, reason = classify(code, path)
        rows.append({"code": code, "path": path, "action": action, "reason": reason})

    by = Counter(r["action"] for r in rows)
    unknown = [r for r in rows if r["action"] == "UNKNOWN"]
    live = {
        "web": "https://www.web3-ttg.com",
        "git_sha": OPS,
        "build_time": "2026-08-20T00:51:57Z",
        "fly_image": "registry.fly.io/tt-web-prod:hybrid-live-auth-pin-nontarget-v9-20260820",
        "fly_image_digest_pin": "sha256:b80bccb5f5c8c0e2b6e854c49f83fbbeb2ecefad70290339a8db6105eb608b16",
        "live_observe_release_identity_matched_pin": True,
        "home_http": 200,
        "restore_script": "scripts/dev/restore-tt-web-production-product-pin.sh",
        "ops_sha_is_ancestor_of_HEAD": False,
        "HEAD": HEAD,
    }
    out = {
        "stamp": "OFFICIAL_V9_PRODUCT_BASELINE_DIRTY_RECONCILIATION_PREVIEW",
        "status": "PREVIEW_READY" if not unknown else "PREVIEW_BLOCKED_UNKNOWN",
        "UNKNOWN_COUNT": len(unknown),
        "by_action": dict(by),
        "total_dirty": len(rows),
        "official_product_pin": live,
        "unknown": unknown,
        "rows": rows,
    }
    Path("evidence/GO_ttg_v9_audit").mkdir(parents=True, exist_ok=True)
    Path(
        "evidence/GO_ttg_v9_audit/OFFICIAL_V9_PRODUCT_BASELINE_DIRTY_RECONCILIATION_PREVIEW.json"
    ).write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    md = [
        "# Dirty reconciliation preview\n",
        f"UNKNOWN={len(unknown)} total={len(rows)}\n",
        "## Counts\n",
    ]
    for k, v in sorted(by.items()):
        md.append(f"- **{k}**: {v}\n")
    md.append("\n## UNKNOWN\n")
    for r in unknown:
        md.append(f"- `{r['path']}` ({r['code']}) — {r['reason']}\n")
    md.append("\n## By action (paths)\n")
    for action in [
        "COMMIT",
        "KEEP",
        "LEGACY_KEEP",
        "RESTORE_FROM_OFFICIAL",
        "DELETE_GENERATED",
        "UNKNOWN",
    ]:
        subset = [r for r in rows if r["action"] == action]
        if not subset:
            continue
        md.append(f"\n### {action} ({len(subset)})\n")
        for r in subset[:120]:
            md.append(f"- `{r['path']}`\n")
        if len(subset) > 120:
            md.append(f"- … +{len(subset) - 120} more\n")
    Path(
        "docs/runbook/TT-OFFICIAL-V9-PRODUCT-BASELINE-DIRTY-RECONCILIATION-PREVIEW-LATEST.md"
    ).write_text("".join(md), encoding="utf-8")

    print(
        json.dumps(
            {
                "UNKNOWN": len(unknown),
                "by": dict(by),
                "total": len(rows),
                "status": out["status"],
            },
            indent=2,
        )
    )
    for r in unknown:
        print("UNKNOWN", r["path"], r["reason"])
    return 0 if not unknown else 2


if __name__ == "__main__":
    raise SystemExit(main())
