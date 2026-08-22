#!/usr/bin/env python3
"""Export TravelTrust-TTG-Official public documentation pack (wave 1).

Three planes (must not mix):
  - Private monorepo = implementation + internal SSOT
  - This public pack = filtered official docs only (no source code)
  - On-chain / Etherscan = deployed contract facts

Wave 1.1: dead-link gate · public markdown sanitization · glossary · no private runbook paths.
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
HUB = ROOT / "docs/github-official"
WP = ROOT / "docs/whitepaper"
BRAND = ROOT / "frontend/public/brand/token"
EVIDENCE = ROOT / "evidence/GO_ttg_v9_public_repo_export"

EN_TOPICS = [
    "Architecture",
    "TTG-V9",
    "Tokenomics",
    "Governance",
    "Primary-Market",
    "ProjectPool",
    "CountryFeeRouter",
    "Role-Stake",
    "Security",
    "Legacy-Policy",
    "Whitepaper",
    "README",
]

# Wave 1 excludes Mainnet-Deployments, Contract-Registry, Verification (mainnet/Etherscan LIVE pack).
EXCLUDE_TOPICS = {"Mainnet-Deployments", "Contract-Registry", "Verification"}

SECRET_PATTERNS = [
    re.compile(r"PRIVATE_KEY", re.I),
    re.compile(r"TRAVELTRUST_RESEND_API_KEY", re.I),
    re.compile(r"re_[a-zA-Z0-9]{20,}"),
    re.compile(r"postgres://[^\s]+", re.I),
    re.compile(r"-----BEGIN (RSA |OPENSSH )?PRIVATE KEY-----"),
]

FORBIDDEN_SUFFIXES = {
    ".sol",
    ".rs",
    ".env",
    ".pem",
    ".key",
    ".p12",
}
FORBIDDEN_PARTS = {
    "contracts",
    "crates",
    "frontend",
    "scripts",
    "evidence",
    "registry",
    ".git",
    "node_modules",
}


FORBIDDEN_LINK_PREFIXES = ("/runbook/", "/registry/", "/scripts/", "runbook/", "registry/", "scripts/")


def sanitize_public_markdown(text: str) -> str:
    """Strip private-monorepo links and internal gate lines from exported markdown."""
    text = re.sub(
        r"\[([^\]]+)\]\((?:\.\./)+runbook/[^)]+\)",
        r"\1",
        text,
    )
    text = re.sub(
        r"\[([^\]]+)\]\((?:\.\./)+registry/[^)]+\)",
        r"\1 (internal fact matrix; public summary in this repository)",
        text,
    )
    text = re.sub(
        r"\*\*Gate:\*\* `python scripts/[^\n]+",
        "**Public review:** documentation-only pack in this repository (no private CI gates).",
        text,
    )
    text = re.sub(
        r"\*\*Upstream \(sole\):\*\*[^\n]+\n",
        "**Public edition:** derived from Design Lock DL_R1 documentation baseline (private monorepo not published).\n",
        text,
        count=2,
    )
    text = re.sub(
        r"\*\*Fact matrix:\*\*[^\n]+\n",
        "",
        text,
    )
    text = re.sub(
        r"Also mirrored at repository root \[`SECURITY\.md`\]\([^)]+\)\.\n?",
        "",
        text,
    )
    text = text.replace(
        "see [TT-OFFICIAL-CONTACT-EMAIL-POLICY-LATEST](../runbook/TT-OFFICIAL-CONTACT-EMAIL-POLICY-LATEST.md)",
        "see [CONTACT.md](CONTACT.md)",
    )
    return text


def find_dead_links(out: Path) -> list[str]:
    dead: list[str] = []
    for md in out.rglob("*.md"):
        try:
            text = md.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        for raw in re.findall(r"\[[^\]]*\]\(([^)]+)\)", text):
            link = raw.strip().split()[0]
            if link.startswith(("http://", "https://", "mailto:", "#")):
                continue
            target = (md.parent / link).resolve()
            try:
                target.relative_to(out.resolve())
            except ValueError:
                dead.append(f"{md.relative_to(out)} -> {link} (escapes export root)")
                continue
            if not target.exists():
                dead.append(f"{md.relative_to(out)} -> {link}")
    return dead


def glossary_md() -> str:
    return """# Glossary (public documentation)

| Term | Meaning in this repository |
|------|----------------------------|
| **DL_R1** | Design Lock for TTG V9 periphery / economics — target semantics |
| **V9_TARGET** | Design-frozen target; **not** a claim of Mainnet fully live |
| **TESTNET** | Sepolia rehearsal (`docs/deployments/sepolia.md`) — **≠** Official Mainnet |
| **MAINNET_DEPLOYED_PHASE1** | Historical Phase1 deploy facts in whitepaper §0 — **≠** `MAINNET_FULLY_ACTIVE` |
| **TIMELOCK_CUTOVER_PENDING** | Solo timed operations / KEEP wiring not finished |
| **TT_PRODUCTION_GO** | Owner Production GO verdict — currently **NO_GO** |
| **LEGACY / SUPERSEDED** | Old stacks (V8, Remint, R2_FINAL, Safe-as-V9-admin) — not ACTIVE truth |
| **NO-MINT** | No TTG mint after 25T genesis |
| **Norm wallets** | Disclosed operational addresses in Tokenomics / whitepaper |

**“Mainnet Edition” whitepaper** names the protocol edition — **not** “everything is live on Mainnet today.”
"""


def github_about_md() -> str:
    return """# GitHub repository About (owner setup)

Set on https://github.com/wejfiowej124234/TravelTrust-TTG-Official → **About** → **Edit**:

| Field | Value |
|-------|-------|
| **Description** | Official TravelTrust / TTG documentation — governance, tokenomics, whitepaper and verified deployment references. |
| **Website** | https://www.web3-ttg.com |
| **Topics** | `traveltrust` `ttg` `ethereum` `web3` `governance` `tokenomics` `travel` `documentation` |

This file documents the intended About metadata; GitHub UI must be updated by the repository owner if not already set.
"""


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def sepolia_md() -> str:
    return """# Sepolia · V9 Periphery Governance Upgrade (TESTNET)

**STATUS:** `TESTNET` · `V9_TARGET` · **≠** Mainnet LIVE  
**Chain:** Sepolia `11155111`  
**Sepolia Reality:** `IN_PROGRESS` (single 12h Timelock certification)  
**AUDIT_1_CANDIDATE_SHA:** `b19b85810c22677d243a82d06ebec8ebcb4d4b47`  
**`TT_PRODUCTION_GO`:** NO_GO  

> **Honesty rule:** This page describes **testnet rehearsal** addresses only.  
> **Do not** treat Sepolia deploy as Mainnet production GO or Official www Web3 SSOT.  
> Mainnet deployment pack (`docs/deployments/mainnet.md`) is published **after** V9 Mainnet Reality closes.

## Key contracts (Sepolia · 29/29 deploy)

| Role | Address |
|------|---------|
| Timelock (12h) | `0x81D480D0f94359ac8e6ed4a92f1a08aa75374a5a` |
| Governor | `0x8E20f2892772e02e36aed9c86c4250493ffC7EF2` |
| FeeRouterV2 | `0xd31AD3e01aC3346414d75011a4544ff0654102f0` |
| ProjectPoolV2 | `0xb93F096C95eC23e5Dc3571afD874A1769DA01Cea` |
| Primary Market | `0x93d718CAc198a5CAf2B8b0DF8545E88310145800` |
| Vault | `0xf769e3634bd4E8c168EDb3C81F68BAeeC9825123` |
| TTG | `0xADBf44AaC18016bD662D4DA5957Cf2a018001903` |
| USDC (mock) | `0xF61EC8EAd1f1A362F4Ac97cC0f5002F4FE17B6BD` |
| FeeIngressV2 | `0x340461F7558D9f8172AA9c0Ec5f8bd730c003e07` |
| RoleStake | `0x87b84a59Ed894B51F693aD259075F07ab556bEE6` |

## Explorers

- Sepolia Etherscan: use each address above on `https://sepolia.etherscan.io`  
- **Verified source for production Mainnet** is published on Etherscan after Mainnet cutover — **not** mirrored in this docs-only repository.

## Official surfaces

| Surface | URL / contact |
|---------|----------------|
| Website | https://www.web3-ttg.com |
| Contact | traveltrust.ir@gmail.com |
| This repo | Documentation only — no Solidity source |

---

*Exported from private monorepo · wave 1 · TESTNET disclosure only.*
"""


def readme_md() -> str:
    return """# TravelTrust · TTG V9 — Official Public Documentation

**Repository type:** documentation-only · **no smart contract source code**  
**Design Lock:** DL_R1 · Candidate `V9_AUDIT_CANDIDATE_DESIGN_LOCK`  
**`TT_PRODUCTION_GO`:** NO_GO  

## Three truth planes (do not mix)

```text
Private monorepo     → implementation & internal SSOT (not public)
This GitHub repo     → filtered official docs for investors / reviewers
Etherscan / chain    → verified bytecode & deployed contract facts
```

Smart contract **source will be verified on Etherscan** for finalized Mainnet deployments — it is **not** published in this repository until that cutover is complete.

## TravelTrust in one paragraph

TravelTrust is a decentralized travel-commerce protocol: marketplace matching, on-chain Escrow for user principal (USDC), and V9 governance / fee / sale / stake modules under Design Lock **DL_R1**.

**TTG** is the governance token (25T genesis · **NO-MINT** after). It is **not** the default settlement asset for travel orders.

> **“Mainnet Edition” whitepaper** names the target protocol edition — **not** a claim that V9 is fully live on Mainnet today. See [GLOSSARY.md](GLOSSARY.md).

## Documentation map

| | |
|--|--|
| English hub | [docs/en/README.md](docs/en/README.md) |
| 中文入口 | [docs/zh/README.md](docs/zh/README.md) |
| Whitepaper (EN) | [docs/whitepaper/TT-TTG-V9-MAINNET-EDITION-WHITEPAPER-EN-LATEST.md](docs/whitepaper/TT-TTG-V9-MAINNET-EDITION-WHITEPAPER-EN-LATEST.md) |
| 白皮书（中文） | [docs/whitepaper/TT-TTG-V9-MAINNET-EDITION-WHITEPAPER-LATEST.md](docs/whitepaper/TT-TTG-V9-MAINNET-EDITION-WHITEPAPER-LATEST.md) |
| Governance | [docs/governance/](docs/governance/) |
| Tokenomics | [docs/tokenomics/](docs/tokenomics/) |
| Sepolia (TESTNET) | [docs/deployments/sepolia.md](docs/deployments/sepolia.md) |
| Contact | [CONTACT.md](CONTACT.md) |
| Security | [SECURITY.md](SECURITY.md) |
| Glossary | [GLOSSARY.md](GLOSSARY.md) |

## Deployment status (public)

| Network | Status in this repo |
|---------|---------------------|
| **Sepolia** | [TESTNET / V9_TARGET](docs/deployments/sepolia.md) — rehearsal in progress |
| **Mainnet** | **Wave 2** — `docs/deployments/mainnet.md` after V9 Mainnet Reality |

## Official links

| | |
|--|--|
| Website | https://www.web3-ttg.com |
| Contact | traveltrust.ir@gmail.com |
| System mail (OTP only) | noreply@web3-ttg.com — not for human support |

## Disclaimer

Not investment advice. Smart contracts involve risk of loss. Historical V8 / Remint / R2_FINAL paths are **LEGACY** — see [docs/en/Legacy-Policy.md](docs/en/Legacy-Policy.md).

---

*Wave 1.1 public export · documentation only · does not replace on-chain truth.*
"""


def contact_md() -> str:
    return """# Contact

**Official human contact (Etherscan · partnerships · media):**

**traveltrust.ir@gmail.com**

| Channel | Address | Use |
|---------|---------|-----|
| Human / project | `traveltrust.ir@gmail.com` | Etherscan follow-up, investors, press |
| System automated | `noreply@web3-ttg.com` | Registration codes only — **do not** reply |

**Website:** https://www.web3-ttg.com

Security vulnerabilities: see [SECURITY.md](SECURITY.md).
"""


def changelog_md() -> str:
    today = utc_now()[:10]
    return f"""# Public changelog (documentation pack)

## {today} — wave 1.1 quality pass

- Fixed all internal navigation dead links (removed Wave 2-only pages from hubs)
- Sanitized private `runbook/` / `registry/` / `scripts/` links from exported markdown
- Added [GLOSSARY.md](GLOSSARY.md) · GitHub About metadata doc
- SECURITY.md points to CONTACT.md only
- Governance: explicit **48h Mainnet** vs **12h Sepolia** timelock note
- Export gate: `DEAD_LINKS=0` required

## 2026-08-22 — wave 1 initial export

- Documentation-only public repository created
- English / Chinese doc hubs, governance, tokenomics, whitepapers
- Sepolia TESTNET address disclosure (`docs/deployments/sepolia.md`)
- Logo assets under `assets/logo/`
- **Excluded:** Solidity source, API, frontend, scripts, internal evidence
- **Deferred:** `docs/deployments/mainnet.md`, Etherscan verified links pack, final Mainnet registry (after V9 Mainnet Reality)
"""


def contributing_public() -> str:
    return (HUB / "CONTRIBUTING.md").read_text(encoding="utf-8").replace(
        "Private monorepo contributors: also follow root [`CONTRIBUTING.md`](../../CONTRIBUTING.md).",
        "Implementation changes happen in the private monorepo — not in this public docs repository.",
    )


def scan_export_tree(out: Path) -> dict[str, int]:
    secret_hits: list[str] = []
    forbidden_files: list[str] = []
    for p in out.rglob("*"):
        if p.is_dir():
            if p.name in FORBIDDEN_PARTS:
                forbidden_files.append(str(p.relative_to(out)))
            continue
        rel = str(p.relative_to(out)).replace("\\", "/")
        parts = rel.split("/")
        if any(part in FORBIDDEN_PARTS for part in parts):
            forbidden_files.append(rel)
        if p.suffix.lower() in FORBIDDEN_SUFFIXES:
            forbidden_files.append(rel)
        try:
            text = p.read_text(encoding="utf-8", errors="replace")
        except (OSError, UnicodeDecodeError):
            continue
        for pat in SECRET_PATTERNS:
            if pat.search(text):
                secret_hits.append(rel)
    mainnet_leak = 0
    if (out / "docs/deployments/mainnet.md").exists():
        mainnet_leak += 1
    return {
        "SECRET_EXPOSURES": len(secret_hits),
        "FORBIDDEN_PATHS": len(forbidden_files),
        "MAINNET_PACK_LEAK": mainnet_leak,
        "secret_samples": secret_hits[:10],
        "forbidden_samples": forbidden_files[:10],
    }


def export_pack(out: Path) -> None:
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)

    (out / "README.md").write_text(readme_md(), encoding="utf-8")
    (out / "CONTACT.md").write_text(contact_md(), encoding="utf-8")
    (out / "CHANGELOG-PUBLIC.md").write_text(changelog_md(), encoding="utf-8")
    (out / "CONTRIBUTING.md").write_text(contributing_public(), encoding="utf-8")
    shutil.copy2(ROOT / "LICENSE", out / "LICENSE")
    shutil.copy2(HUB / "SECURITY.md", out / "SECURITY.md")

    for lang in ("en", "zh"):
        dest = out / "docs" / lang
        dest.mkdir(parents=True, exist_ok=True)
        for topic in EN_TOPICS:
            if topic in EXCLUDE_TOPICS:
                continue
            src = HUB / lang / f"{topic}.md"
            if src.is_file():
                shutil.copy2(src, dest / f"{topic}.md")

    gov = out / "docs/governance"
    tok = out / "docs/tokenomics"
    gov.mkdir(parents=True, exist_ok=True)
    tok.mkdir(parents=True, exist_ok=True)
    shutil.copy2(HUB / "en/Governance.md", gov / "Governance-en.md")
    shutil.copy2(HUB / "zh/Governance.md", gov / "Governance-zh.md")
    shutil.copy2(HUB / "en/Tokenomics.md", tok / "Tokenomics-en.md")
    shutil.copy2(HUB / "zh/Tokenomics.md", tok / "Tokenomics-zh.md")

    wp_out = out / "docs/whitepaper"
    wp_out.mkdir(parents=True, exist_ok=True)
    for name in (
        "TT-TTG-V9-MAINNET-EDITION-WHITEPAPER-EN-LATEST.md",
        "TT-TTG-V9-MAINNET-EDITION-WHITEPAPER-LATEST.md",
    ):
        shutil.copy2(WP / name, wp_out / name)

    dep = out / "docs/deployments"
    dep.mkdir(parents=True, exist_ok=True)
    (dep / "sepolia.md").write_text(sepolia_md(), encoding="utf-8")

    logo = out / "assets/logo"
    logo.mkdir(parents=True, exist_ok=True)
    for name in (
        "ttg-logo-32.svg",
        "ttg-logo-64.png",
        "ttg-logo-64.svg",
        "ttg-avatar-32.svg",
        "ttg-avatar-256.png",
        "ttg-avatar.png",
    ):
        src = BRAND / name
        if src.is_file():
            shutil.copy2(src, logo / name)

    # .gitignore for export dir hygiene
    (out / ".gitignore").write_text(".DS_Store\nThumbs.db\n", encoding="utf-8")
    (out / "GLOSSARY.md").write_text(glossary_md(), encoding="utf-8")
    (out / "GITHUB-ABOUT.md").write_text(github_about_md(), encoding="utf-8")

    for md in out.rglob("*.md"):
        md.write_text(sanitize_public_markdown(md.read_text(encoding="utf-8")), encoding="utf-8")

    # docs/governance/* is one level deeper — fix deployment links copied from docs/{lang}/Governance.md
    for gov_copy in (out / "docs/governance").glob("*.md"):
        text = gov_copy.read_text(encoding="utf-8")
        text = text.replace("../../deployments/", "../deployments/")
        gov_copy.write_text(text, encoding="utf-8")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--out",
        type=Path,
        default=ROOT.parent / "TravelTrust-TTG-Official",
        help="Output directory (clone target)",
    )
    ap.add_argument("--require-pass", action="store_true")
    args = ap.parse_args()

    export_pack(args.out)
    scan = scan_export_tree(args.out)
    dead_links = find_dead_links(args.out)
    file_count = sum(1 for p in args.out.rglob("*") if p.is_file())

    report = {
        "stamp": "TRAVELTRUST_TTG_OFFICIAL_PUBLIC_EXPORT_WAVE1_1",
        "recorded_utc": utc_now(),
        "output_dir": str(args.out),
        "file_count": file_count,
        "github_remote": "https://github.com/wejfiowej124234/TravelTrust-TTG-Official",
        "wave": "1.1",
        "excluded": sorted(EXCLUDE_TOPICS) + ["mainnet.md", "source_code"],
        "metrics": {
            "SECRET_EXPOSURES": scan["SECRET_EXPOSURES"],
            "FORBIDDEN_PATHS": scan["FORBIDDEN_PATHS"],
            "MAINNET_PACK_LEAK": scan["MAINNET_PACK_LEAK"],
            "DEAD_LINKS": len(dead_links),
        },
        "dead_link_samples": dead_links[:20],
        "pass": scan["SECRET_EXPOSURES"] == 0
        and scan["FORBIDDEN_PATHS"] == 0
        and scan["MAINNET_PACK_LEAK"] == 0
        and len(dead_links) == 0,
    }
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    write_path = EVIDENCE / "TRAVELTRUST_TTG_OFFICIAL_PUBLIC_EXPORT_WAVE1_1_LATEST.json"
    write_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    print(json.dumps(report["metrics"], indent=2))
    print(f"PASS={report['pass']} files={file_count} out={args.out}")
    if args.require_pass and not report["pass"]:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
