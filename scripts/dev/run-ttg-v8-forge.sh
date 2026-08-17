#!/usr/bin/env bash
# ① Local compile/test for TTG V8 (Solidity 0.8.26). Not broadcast. Not Official live.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SOLC="${SOLC_0_8_26:-}"

if [[ -z "${SOLC}" ]]; then
  if [[ -x "${HOME}/.solcx/solc-v0.8.26/solc.exe" ]]; then
    SOLC="${HOME}/.solcx/solc-v0.8.26/solc.exe"
  elif [[ -x "${HOME}/.solcx/solc-v0.8.26/solc" ]]; then
    SOLC="${HOME}/.solcx/solc-v0.8.26/solc"
  elif [[ -n "${APPDATA:-}" && -x "${APPDATA}/svm/0.8.26/solc-0.8.26" ]]; then
    SOLC="${APPDATA}/svm/0.8.26/solc-0.8.26"
  else
    echo "TTG V8 needs solc 0.8.26 (Etherscan 0.8.19 CVE banner)." >&2
    echo "Install: python -c \"import solcx; solcx.install_solc('0.8.26')\"" >&2
    exit 1
  fi
fi

cd "${ROOT}/contracts"
FOUNDRY_PROFILE=ttg_v8 exec forge test --use "${SOLC}" --skip script --match-contract TtgMemeDenom "$@"
