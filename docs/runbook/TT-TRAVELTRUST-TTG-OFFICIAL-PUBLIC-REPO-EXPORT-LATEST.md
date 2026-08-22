# TravelTrust · TTG Official Public Repository Export

**STATUS:** `ACTIVE` · **Wave 1**  
**Public remote:** https://github.com/wejfiowej124234/TravelTrust-TTG-Official  
**Private implementation:** this monorepo — **not** mirrored publicly  

---

## Three planes (must not mix)

| Plane | Role |
|-------|------|
| **Private monorepo** | Implementation, evidence, gates, Candidate Solidity |
| **Public GitHub** | Filtered official docs for investors / Etherscan reviewers |
| **Chain / Etherscan** | Deployed contract facts + verified source |

---

## Wave 1 contents (allowed now)

- `README.md` · `SECURITY.md` · `CONTACT.md` · `LICENSE` · `CONTRIBUTING.md` · `CHANGELOG-PUBLIC.md`
- `docs/en/` · `docs/zh/` (excludes Mainnet-Deployments, Contract-Registry, Verification)
- `docs/whitepaper/` · `docs/governance/` · `docs/tokenomics/`
- `docs/deployments/sepolia.md` — **TESTNET / V9_TARGET only**
- `assets/logo/`

**Excluded:** `contracts/`, API, frontend, scripts, evidence, keys, **`docs/deployments/mainnet.md`**

---

## Export + gate

```bash
python scripts/dev/export-traveltrust-ttg-official-public-repo.py --require-pass
```

Metrics must be zero: `SECRET_EXPOSURES`, `FORBIDDEN_PATHS`, `MAINNET_PACK_LEAK`, **`DEAD_LINKS`**.

Evidence: `evidence/GO_ttg_v9_public_repo_export/TRAVELTRUST_TTG_OFFICIAL_PUBLIC_EXPORT_WAVE1_1_LATEST.json` (wave **1.1** · dead-link gate)

---

## Publish (Owner credentials)

```bash
export TRAVELTRUST_TTG_OFFICIAL_OUT="../TravelTrust-TTG-Official"
git clone https://github.com/wejfiowej124234/TravelTrust-TTG-Official.git "$OUT"
python scripts/dev/export-traveltrust-ttg-official-public-repo.py --out "$OUT" --require-pass
cd "$OUT" && git add -A && git commit -m "docs: wave N public pack" && git push
```

Use GitHub account **`wejfiowej124234`** (not alternate local credentials).

---

## Wave 2 (after V9 Mainnet Reality)

- `docs/deployments/mainnet.md`
- Etherscan verified contract links
- Final governance topology + Mainnet address registry
- Token Info / metadata links

**Do not** publish wave 2 while Sepolia Reality is in progress unless Owner explicitly scopes a doc-only delta.

---

## Contact email (public)

**traveltrust.ir@gmail.com** — [TT-OFFICIAL-CONTACT-EMAIL-POLICY-LATEST](TT-OFFICIAL-CONTACT-EMAIL-POLICY-LATEST.md)
