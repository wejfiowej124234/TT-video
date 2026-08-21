#!/usr/bin/env python3
"""V9 GitHub Official Repository Alignment gate.

Requires:
  GITHUB_ACTIVE_TRUTH_CONFLICTS == 0
  LEGACY_ACTIVE_LEAKS == 0
  SECRET_EXPOSURES == 0
  DOC_LINK_ERRORS == 0
  V9_PUBLIC_DOC_COVERAGE == 100%

Does not push/publicize. Does not mutate DL_R1 / Phase1 / TT_PRODUCTION_GO.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
HUB = ROOT / "docs/github-official"
SCAN = ROOT / "evidence/GO_ttg_v9_audit/V9_GITHUB_OFFICIAL_ALIGNMENT_SCAN.json"
PASS = ROOT / "evidence/GO_ttg_v9_audit/V9_GITHUB_OFFICIAL_REPOSITORY_ALIGNMENT_PASS.json"
MATRIX = ROOT / "registry/ttg-v9-github-official-alignment.v1.yaml"

REQUIRED = [
    "docs/github-official/README.md",
    "docs/github-official/PUBLIC-README.md",
    "docs/github-official/LICENSE.md",
    "docs/github-official/CONTRIBUTING.md",
    "docs/github-official/SECURITY.md",
    "SECURITY.md",
    "docs/github-official/en/README.md",
    "docs/github-official/zh/README.md",
]
TOPICS = [
    "Architecture",
    "TTG-V9",
    "Tokenomics",
    "Governance",
    "Primary-Market",
    "ProjectPool",
    "CountryFeeRouter",
    "Role-Stake",
    "Security",
    "Mainnet-Deployments",
    "Contract-Registry",
    "Verification",
    "Legacy-Policy",
    "Whitepaper",
]
for t in TOPICS:
    REQUIRED.append(f"docs/github-official/en/{t}.md")
    REQUIRED.append(f"docs/github-official/zh/{t}.md")

ACTIVE_MUST = [
    "0xD5c1Ef9ec730F93e324A1966bD414a7f5ebc41c9",
    "0x99e43FaBA8dC773888223f70e1dfCd18bea37D7f",
    "0x7B21b421981A3B61cc08c8E22D4fd690E457Df37",
    "0x5afD2e0C8b9fa4eecfde4bf582d3B282D28F4970",
    "0xEE0BE3a8a8658E06c44539deD758Fb70A7f3C1C6",
]
ACTIVE_EXCLUDE = [
    "0x96491aa894658ff7946506318c49F3c76b8f40e7",
    "0xfB906ae34521E0BC884AB1a8D0dcf986aBD59BbF",
    "0x50F0B26167EC73e327D97c54C81F1c1B9eFB22f7",
]

# Known public Norm / Phase1 / USDC — not secrets
ALLOW_ADDR = set(
    a.lower()
    for a in ACTIVE_MUST
    + ACTIVE_EXCLUDE
    + [
        "0xe87378e49Ead2E1a422B8cae118d3C905Ee45B6C",
        "0xc714E2567982ea92d5f3C5b66ab65532Cfc5f09b",
        "0xA0DfC4C5C544488AfEfE696AfB8e5823911e5A9c",
        "0xf6A1Fb4435E463117a666818611F49D03F91E7A7",
        "0xe5C3ED16741Eb195fAE11b0C1449A79DD675B372",
        "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        "0xe1e732EfBf9B010a9204054467256d3d93f3CdD4",
        "0x010365F0835323826569D61D0E13E6F8d25F6828",
        "0xF34804AA66bAeE02F3aF1C540B9997C7F46b2736",
    ]
)

SECRET_PATTERNS = [
    ("pem_private_key", re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----")),
    ("hex_private_key", re.compile(r"(?i)(?:private[_ ]?key|secret[_ ]?key|DEPLOYER_KEY|PRIVATE_KEY)\s*[=:]\s*0x[a-f0-9]{64}")),
    ("raw_64_hex_key_assign", re.compile(r"(?i)(?:PRIVATE_KEY|SECRET_KEY)\s*=\s*[a-f0-9]{64}\b")),
    ("aws_secret", re.compile(r"(?i)AWS_SECRET_ACCESS_KEY\s*=\s*\S+")),
    ("stripe_live", re.compile(r"\bsk_live_[A-Za-z0-9]+")),
    ("mnemonic_phrase", re.compile(r"(?i)(mnemonic|seed phrase)\s*[=:]\s*\S+")),
    ("dotenv_credential", re.compile(r"(?i)\.env\.[a-z0-9_.-]*\.(local|secret)|TRAVELTRUST_.*_KEY\s*=\s*0x[a-f0-9]{64}")),
    ("internal_evidence_dump", re.compile(r"(?i)broadcast.*--private-key|cast wallet import")),
]


def _iter_public_files() -> list[Path]:
    files = [ROOT / "SECURITY.md"]
    for p in HUB.rglob("*"):
        if p.is_file() and p.suffix.lower() in {".md", ".yaml", ".yml", ".json"}:
            files.append(p)
    return files


def _conflicts(text: str, rel: str) -> list[dict]:
    out = []
    for m in re.finditer(r"MAINNET_FULLY_ACTIVE|ACTIVE_OFFICIAL", text):
        w = text[max(0, m.start() - 100) : m.end() + 100]
        if re.search(
            r"\bNO\b|≠|not |Not:|禁止|must not|Claiming|≠\s*Fully|flipping",
            w,
            re.I,
        ):
            continue
        out.append({"class": "fully_active_claim", "path": rel, "snippet": w.strip()[:140]})
    if re.search(r"TT_PRODUCTION_GO\s*[:=]\s*GO\b", text):
        out.append({"class": "production_go_flip", "path": rel})
    return out


def _leaks(text: str, rel: str) -> list[dict]:
    out = []
    # ACTIVE registry must not list legacy roots
    if "Contract-Registry" in rel:
        for a in ACTIVE_EXCLUDE:
            if a in text:
                out.append({"class": "legacy_in_active_registry", "path": rel, "addr": a})
    for m in re.finditer(r"globalStakers|35\.75\s*%", text):
        w = text[max(0, m.start() - 120) : m.end() + 120]
        if re.search(r"EXIT|LEGACY|DO_NOT_USE|无\s*globalStakers|No\s*globalStakers", w, re.I):
            continue
        out.append({"class": "globalStakers_active_leak", "path": rel, "snippet": w.strip()[:120]})
    for m in re.finditer(r"\bR2_FINAL\b", text):
        w = text[max(0, m.start() - 160) : m.end() + 160]
        if re.search(
            r"LEGACY|SUPERSEDED|DO_NOT_USE|must not|不覆盖|do\s+\*?\*?not\*?\*?\s+cover|not cover",
            w,
            re.I,
        ):
            continue
        out.append({"class": "r2_final_active_leak", "path": rel, "snippet": w.strip()[:120]})
    return out


def _secrets(text: str, rel: str) -> list[dict]:
    out = []
    for name, pat in SECRET_PATTERNS:
        for m in pat.finditer(text):
            out.append({"class": name, "path": rel, "snippet": text[m.start() : m.end()][:80]})
    # orphan 64-byte hex keys not in allowlist (avoid flagging contract addresses)
    for m in re.finditer(r"\b0x([a-fA-F0-9]{64})\b", text):
        full = "0x" + m.group(1)
        if full.lower() in ALLOW_ADDR:
            continue
        # 64 hex = private key length; contract addresses are 40 hex — flag only 64
        ctx = text[max(0, m.start() - 40) : m.end() + 40]
        if re.search(r"(?i)private|secret|mnemonic|key\s*=", ctx):
            out.append({"class": "suspicious_64hex_near_key", "path": rel, "snippet": ctx.strip()[:100]})
    return out


def _link_errors(path: Path, text: str) -> list[dict]:
    out = []
    for m in re.finditer(r"\[([^\]]+)\]\(([^)]+)\)", text):
        href = m.group(2).strip()
        if href.startswith(("http://", "https://", "mailto:", "#")):
            continue
        href = href.split("#", 1)[0]
        if not href:
            continue
        target = (path.parent / href).resolve()
        try:
            target.relative_to(ROOT.resolve())
        except ValueError:
            out.append({"class": "link_outside_repo", "path": path.relative_to(ROOT).as_posix(), "href": href})
            continue
        if not target.exists():
            out.append(
                {
                    "class": "broken_relative_link",
                    "path": path.relative_to(ROOT).as_posix(),
                    "href": href,
                }
            )
    return out


def scan() -> dict:
    missing = [r for r in REQUIRED if not (ROOT / r).exists()]
    present = [r for r in REQUIRED if (ROOT / r).exists()]
    coverage = 100.0 * len(present) / max(1, len(REQUIRED))

    conflicts: list[dict] = []
    leaks: list[dict] = []
    secrets: list[dict] = []
    links: list[dict] = []

    for p in _iter_public_files():
        rel = p.relative_to(ROOT).as_posix()
        try:
            text = p.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        conflicts.extend(_conflicts(text, rel))
        leaks.extend(_leaks(text, rel))
        secrets.extend(_secrets(text, rel))
        if p.suffix.lower() == ".md":
            links.extend(_link_errors(p, text))

    # ACTIVE registry must include required addresses
    for lang in ("en", "zh"):
        reg = ROOT / f"docs/github-official/{lang}/Contract-Registry.md"
        if reg.exists():
            t = reg.read_text(encoding="utf-8", errors="ignore")
            for a in ACTIVE_MUST:
                if a not in t:
                    leaks.append({"class": "active_registry_missing", "path": reg.relative_to(ROOT).as_posix(), "addr": a})

    # Status machine present in hub
    hub = (HUB / "README.md").read_text(encoding="utf-8", errors="ignore") if (HUB / "README.md").exists() else ""
    if "TIMELOCK_CUTOVER_PENDING" not in hub and "DEPLOYED_PENDING_CUTOVER" not in hub:
        conflicts.append({"class": "missing_phase1_status", "path": "docs/github-official/README.md"})

    return {
        "stamp": "V9_GITHUB_OFFICIAL_ALIGNMENT_SCAN",
        "GITHUB_ACTIVE_TRUTH_CONFLICTS": len(conflicts),
        "LEGACY_ACTIVE_LEAKS": len(leaks),
        "SECRET_EXPOSURES": len(secrets),
        "DOC_LINK_ERRORS": len(links),
        "V9_PUBLIC_DOC_COVERAGE": round(coverage, 4),
        "required_total": len(REQUIRED),
        "required_present": len(present),
        "required_missing": missing,
        "conflicts": conflicts,
        "leaks": leaks,
        "secrets": secrets,
        "links": links[:80],
        "matrix": MATRIX.relative_to(ROOT).as_posix(),
        "tt_production_go": "NO_GO",
        "mainnet_status": "DEPLOYED_PENDING_CUTOVER",
        "forbid_auto": [
            "git_push_publicize",
            "production_meta_indexer_cutover",
            "official_www_rewrite",
            "TT_PRODUCTION_GO_flip",
        ],
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--require-zero", action="store_true")
    ap.add_argument("--report-only", action="store_true")
    ap.add_argument("--stamp-pass", action="store_true")
    args = ap.parse_args()

    result = scan()
    SCAN.parent.mkdir(parents=True, exist_ok=True)
    SCAN.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    c = result["GITHUB_ACTIVE_TRUTH_CONFLICTS"]
    l = result["LEGACY_ACTIVE_LEAKS"]
    s = result["SECRET_EXPOSURES"]
    e = result["DOC_LINK_ERRORS"]
    cov = result["V9_PUBLIC_DOC_COVERAGE"]
    ok = c == 0 and l == 0 and s == 0 and e == 0 and cov >= 100.0 - 1e-9

    print(
        json.dumps(
            {
                "GITHUB_ACTIVE_TRUTH_CONFLICTS": c,
                "LEGACY_ACTIVE_LEAKS": l,
                "SECRET_EXPOSURES": s,
                "DOC_LINK_ERRORS": e,
                "V9_PUBLIC_DOC_COVERAGE": cov,
                "required_missing": result["required_missing"],
                "links_sample": result["links"][:10],
                "leaks_sample": result["leaks"][:10],
                "secrets_sample": result["secrets"][:10],
            },
            indent=2,
            ensure_ascii=False,
        )
    )

    if ok and (args.stamp_pass or args.require_zero):
        pass_doc = {
            "stamp": "V9_GITHUB_OFFICIAL_REPOSITORY_ALIGNMENT_PASS",
            "candidate": "V9_AUDIT_CANDIDATE_DESIGN_LOCK",
            "remediation_wave": "DL_R1",
            "mainnet_status": "DEPLOYED_PENDING_CUTOVER",
            "aliases": ["MAINNET_DEPLOYED_PHASE1", "TIMELOCK_CUTOVER_PENDING"],
            "GITHUB_ACTIVE_TRUTH_CONFLICTS": 0,
            "LEGACY_ACTIVE_LEAKS": 0,
            "SECRET_EXPOSURES": 0,
            "DOC_LINK_ERRORS": 0,
            "V9_PUBLIC_DOC_COVERAGE": 100.0,
            "hub": "docs/github-official/README.md",
            "tt_production_go": "NO_GO",
            "did_not": [
                "git_push",
                "publicize",
                "www_cutover",
                "meta_indexer_cutover",
                "DL_R1_mutation",
                "TT_PRODUCTION_GO_flip",
            ],
            "stop": True,
        }
        PASS.write_text(json.dumps(pass_doc, indent=2) + "\n", encoding="utf-8")
        print("V9_GITHUB_OFFICIAL_REPOSITORY_ALIGNMENT_PASS")

    if args.report_only:
        return 0
    if args.require_zero and not ok:
        print(f"STOP c={c} l={l} s={s} e={e} cov={cov}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
