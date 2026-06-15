#!/usr/bin/env bash
# Copy 55-S13 byte-identical subset: contracts/abi -> frontend/dapp/abis
set -euo pipefail
root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
abi_dir="$root_dir/contracts/abi"
fe_dir="$root_dir/frontend/dapp/abis"
files=(
  GuideIdentityStakingPool.json
  ProviderIdentityStakingPool.json
  Registry.json
  EscrowFactory.json
  FeeRouter.json
  RegionVault.json
  Escrow.json
  InvestorDistributionClaim.json
)
[[ -d "$abi_dir" ]] || { echo "sync-55-s13-frontend-abis: missing contracts/abi" >&2; exit 1; }
[[ -d "$fe_dir" ]] || { echo "sync-55-s13-frontend-abis: missing frontend/dapp/abis" >&2; exit 1; }
for f in "${files[@]}"; do
  [[ -f "$abi_dir/$f" ]] || { echo "sync-55-s13-frontend-abis: missing contracts/abi/$f" >&2; exit 1; }
  cp "$abi_dir/$f" "$fe_dir/$f"
done
echo "sync-55-s13-frontend-abis: copied ${#files[@]} files to frontend/dapp/abis"
