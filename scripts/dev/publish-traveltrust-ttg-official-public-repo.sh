#!/usr/bin/env bash
# Wave 1 export → local pack → optional push to TravelTrust-TTG-Official
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
OUT="${TRAVELTRUST_TTG_OFFICIAL_OUT:-$ROOT/../TravelTrust-TTG-Official}"
REMOTE="${TRAVELTRUST_TTG_OFFICIAL_REMOTE:-https://github.com/wejfiowej124234/TravelTrust-TTG-Official.git}"

python scripts/dev/export-traveltrust-ttg-official-public-repo.py --out "$OUT" --require-pass

if [[ "${1:-}" == "--push" ]]; then
  if [[ ! -d "$OUT/.git" ]]; then
    git clone "$REMOTE" "$OUT.tmpclone"
    rsync -a --delete --exclude .git "$OUT/" "$OUT.tmpclone/"
    mv "$OUT.tmpclone" "$OUT"
  fi
  cd "$OUT"
  git add -A
  if git diff --cached --quiet; then
    echo "TTG_OFFICIAL_EXPORT: no changes to push"
    exit 0
  fi
  git commit -m "$(cat <<'EOF'
docs: wave 1 official public pack (no source code)

Documentation-only export: en/zh hubs, whitepapers, governance, tokenomics,
Sepolia TESTNET deployment disclosure, logos. Mainnet pack deferred until V9
Mainnet Reality.
EOF
)"
  git push origin HEAD
fi
