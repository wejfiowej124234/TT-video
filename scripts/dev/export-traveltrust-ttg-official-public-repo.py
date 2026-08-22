#!/usr/bin/env python3
"""Export TravelTrust-TTG-Official public documentation pack (wave 1).

Three planes (must not mix):
  - Private monorepo = implementation + internal SSOT
  - This public pack = filtered official docs only (no source code)
  - On-chain / Etherscan = deployed contract facts

Wave 1: NO mainnet.md · Sepolia TESTNET only · NO contracts/API/scripts/evidence.
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

## Deployment status (public)

| Network | Status in this repo |
|---------|---------------------|
| **Sepolia** | [TESTNET / V9_TARGET](docs/deployments/sepolia.md) — rehearsal in progress |
| **Mainnet** | **Not published in wave 1** — `docs/deployments/mainnet.md` after V9 Mainnet Reality |

## Official links

| | |
|--|--|
| Website | https://www.web3-ttg.com |
| Contact | traveltrust.ir@gmail.com |
| System mail (OTP only) | noreply@web3-ttg.com — not for human support |

## Disclaimer

Not investment advice. Smart contracts involve risk of loss. Historical V8 / Remint / R2_FINAL paths are **LEGACY** — see [docs/en/Legacy-Policy.md](docs/en/Legacy-Policy.md).

---

*Wave 1 public export · documentation only · does not replace on-chain truth.*
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
    return f"""# Public changelog (documentation pack)

## {utc_now()[:10]} — wave 1 initial export

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
        "ttg-logo-64.png",
        "ttg-logo-64.svg",
        "ttg-avatar-256.png",
        "ttg-avatar.png",
    ):
        src = BRAND / name
        if src.is_file():
            shutil.copy2(src, logo / name)

    # .gitignore for export dir hygiene
    (out / ".gitignore").write_text(".DS_Store\nThumbs.db\n", encoding="utf-8")


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
    file_count = sum(1 for p in args.out.rglob("*") if p.is_file())

    report = {
        "stamp": "TRAVELTRUST_TTG_OFFICIAL_PUBLIC_EXPORT_WAVE1",
        "recorded_utc": utc_now(),
        "output_dir": str(args.out),
        "file_count": file_count,
        "github_remote": "https://github.com/wejfiowej124234/TravelTrust-TTG-Official",
        "wave": 1,
        "excluded": sorted(EXCLUDE_TOPICS) + ["mainnet.md", "source_code"],
        "metrics": {
            "SECRET_EXPOSURES": scan["SECRET_EXPOSURES"],
            "FORBIDDEN_PATHS": scan["FORBIDDEN_PATHS"],
            "MAINNET_PACK_LEAK": scan["MAINNET_PACK_LEAK"],
        },
        "pass": scan["SECRET_EXPOSURES"] == 0
        and scan["FORBIDDEN_PATHS"] == 0
        and scan["MAINNET_PACK_LEAK"] == 0,
    }
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    write_path = EVIDENCE / "TRAVELTRUST_TTG_OFFICIAL_PUBLIC_EXPORT_WAVE1_LATEST.json"
    write_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    print(json.dumps(report["metrics"], indent=2))
    print(f"PASS={report['pass']} files={file_count} out={args.out}")
    if args.require_pass and not report["pass"]:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
