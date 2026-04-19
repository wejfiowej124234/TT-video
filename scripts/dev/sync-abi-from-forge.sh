#!/usr/bin/env bash
# 从 Foundry 编译产物导出 ABI 到 contracts/abi（canonical 单源）。
# 前置：contracts/lib 已 forge install；本机已安装 forge（https://book.getfoundry.sh）。
# 用法：项目根 ./scripts/sync-abi-from-forge.sh
# 后续：cp contracts/abi/{GuideIdentityStakingPool,ProviderIdentityStakingPool,Registry,...}.json frontend/dapp/abis/
#       再执行 ./scripts/check-55-s13.sh（Escrow 前端可为精简 ABI，须含 openDispute）。

set -euo pipefail
root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$root_dir/contracts"

command -v forge >/dev/null 2>&1 || {
  echo "sync-abi-from-forge: forge not in PATH. Install Foundry, then: cd contracts && forge install" >&2
  exit 1
}

forge build

fmt_json() {
  if command -v jq >/dev/null 2>&1; then
    jq .
  else
    python3 -c 'import sys, json; print(json.dumps(json.load(sys.stdin), indent=2))'
  fi
}

write_abi() {
  local name="$1"
  local dest="$root_dir/contracts/abi/${name}.json"
  local artifact="$root_dir/contracts/out/${name}.sol/${name}.json"
  if [[ -f "$artifact" ]]; then
    jq .abi "$artifact" | fmt_json >"$dest"
  else
    local raw
    raw="$(forge inspect "$name" abi 2>/dev/null)" || {
      echo "sync-abi-from-forge: no artifact and forge inspect $name abi failed" >&2
      return 1
    }
    printf '%s\n' "$raw" | fmt_json >"$dest"
  fi
  echo "sync-abi-from-forge: wrote $dest"
}

# 主合约（须成功）
# **GovernanceVotesToken** / **TravelTrustGovernor**：canonical 入 **`contracts/abi/`**；**`check-55-s13`** **不**要求复制到 **`frontend/dapp/abis`**（治理 UI 以 **GET /meta** + API **eth_call** 为主；Explorer/cast 工具可直接读 canonical JSON）。
for c in Escrow EscrowFactory GuideIdentityStakingPool ProviderIdentityStakingPool Registry FeeRouter RegionVault ReserveVault SlashRouter InvestorDistributionClaim GovernanceTimelock GovernanceTreasury GovernanceVotesToken TravelTrustGovernor; do
  write_abi "$c"
done

# 接口与测试代币（失败则跳过，不阻断）
for c in IERC20 MockERC20; do
  write_abi "$c" || echo "sync-abi-from-forge: skip $c (optional)"
done

cd "$root_dir"
bash scripts/run-verify-abi-forge.sh

echo ""
echo "Next:"
echo "  cp contracts/abi/GuideIdentityStakingPool.json contracts/abi/ProviderIdentityStakingPool.json contracts/abi/Registry.json contracts/abi/FeeRouter.json contracts/abi/RegionVault.json frontend/dapp/abis/"
echo "  # SlashRouter.json / ReserveVault.json：canonical 仅 contracts/abi/（verify-abi-forge 校验）；DApp 未直连前勿复制到 dapp/abis，以免 55-S13 扩展子集"
echo "  # GovernanceVotesToken.json / TravelTrustGovernor.json：保留于 contracts/abi/（前端 55-S13 不要求双目录）"
echo "  # Escrow：若需与 canonical 完全一致可复制全量 ABI；否则保留前端精简版但须含 openDispute"
echo "  ./scripts/check-55-s13.sh"
