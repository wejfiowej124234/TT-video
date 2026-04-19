// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Script.sol";
import "../src/TravelTrustGovernor.sol";

/**
 * @notice Sepolia：发起 **GovernanceTreasury.spend** 或 **spendETH** 的治理提案（单 target = `TREASURY_ADDRESS`）。
 * @dev 与 **TT-TREASURY-SPEND-MINI-EVIDENCE-001**、**B-417** 证据包路径配套；**vote → queue → execute** 仍用既有 **`b417-sepolia-propose-vote-succeeded.sh`** / **`b417-run-onchain-evidence.sh`**。
 *
 * **环境变量（须）**
 * - **PRIVATE_KEY**：proposer（须满足 `proposalThresholdVotes` 的 `getPastVotes`）
 * - **GOVERNOR_ADDRESS**
 * - **TREASURY_ADDRESS**
 * - **TREASURY_SPEND_TO**
 * - **TREASURY_SPEND_AMOUNT**（wei 或 token 最小单位；**`spend`/`spendETH` 均拒绝 0**）
 *
 * **模式**
 * - **TREASURY_SPEND_MODE** = **`ERC20`**（默认）或 **`ETH`**
 * - **ERC20**：另须 **GOVERNANCE_TOKEN_ADDRESS** = 拟划出的 **ERC20 合约地址**（即 `spend(token,…)` 的第一个参数；常为 TTG，亦可是金库内持有的其它 ERC20）
 * - **ETH**：**不**读 **GOVERNANCE_TOKEN_ADDRESS**；calldata 为 **`spendETH(to,amount)`**（金库须已有足够 **ETH** 余额）
 *
 * **RPC**：由 **`forge script … --rpc-url $CHAIN_RPC_URL`** 传入（脚本内不读 **CHAIN_RPC_URL**）。
 *
 * 例：
 * ```bash
 * cd contracts
 * export PRIVATE_KEY=… GOVERNOR_ADDRESS=… TREASURY_ADDRESS=… \
 *   GOVERNANCE_TOKEN_ADDRESS=… TREASURY_SPEND_TO=… TREASURY_SPEND_AMOUNT=1000000000000000 \
 *   CHAIN_RPC_URL=https://ethereum-sepolia.publicnode.com
 * forge script script/SepoliaProposeTreasurySpend.s.sol:SepoliaProposeTreasurySpend \
 *   --rpc-url "$CHAIN_RPC_URL" --broadcast -vvv
 * ```
 */
contract SepoliaProposeTreasurySpend is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address govAddr = vm.envAddress("GOVERNOR_ADDRESS");
        address treasury = vm.envAddress("TREASURY_ADDRESS");
        address spendTo = vm.envAddress("TREASURY_SPEND_TO");
        uint256 spendAmt = vm.envUint("TREASURY_SPEND_AMOUNT");

        if (spendTo == address(0)) revert("TREASURY_SPEND_TO=0");
        if (spendAmt == 0) revert("TREASURY_SPEND_AMOUNT=0");

        string memory mode = vm.envOr("TREASURY_SPEND_MODE", string("ERC20"));
        bool isEth = keccak256(bytes(mode)) == keccak256(bytes("ETH"));

        bytes memory data;
        if (isEth) {
            data = abi.encodeWithSignature("spendETH(address,uint256)", spendTo, spendAmt);
        } else {
            address token = vm.envAddress("GOVERNANCE_TOKEN_ADDRESS");
            data = abi.encodeWithSignature("spend(address,address,uint256)", token, spendTo, spendAmt);
        }

        vm.startBroadcast(pk);

        address[] memory t = new address[](1);
        uint256[] memory vals = new uint256[](1);
        bytes[] memory cds = new bytes[](1);
        t[0] = treasury;
        vals[0] = 0;
        cds[0] = data;

        string memory desc = isEth
            ? "TT-TREASURY-SPEND-MINI: spendETH"
            : "TT-TREASURY-SPEND-MINI: Treasury.spend ERC20";

        uint256 pid = TravelTrustGovernor(govAddr).propose(t, vals, cds, desc);
        console.log("proposalId", pid);

        vm.stopBroadcast();
    }
}
