// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Script.sol";
import "../src/TravelTrustGovernor.sol";

/**
 * @notice Sepolia：对 **GovernanceVotesToken**（链上 **`symbol()` = TTG**）发起 **transfer(部署者, 1 wei)** 的最小治理提案（与 `TravelTrustGovernor.t.sol` 同构思路）。
 * @dev 须 **env**：**PRIVATE_KEY**（0x 前缀）、**GOVERNOR_ADDRESS**、治理票（**TTG**）合约地址 **二选一**：
 *      **`GOVERNANCE_TOKEN_ADDRESS`**（与 API **`ChainConfig`** / **`.env.example`** 同源，**推荐**）
 *      或 **`GOVERNANCE_VOTES_TOKEN_ADDRESS`**（历史别名，与旧文档一致）。
 *      **queue→execute** 时调用方为 **Timelock**，该 **transfer** 从 **Timelock 余额** 扣款；编排脚本 **`b417-sepolia-propose-vote-succeeded.sh`** 会在 **propose** 前向 **Timelock** 转入少量代币，避免 **`GovernanceTimelock.CallFailed`**。
 */
contract SepoliaProposeMinimal is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        address govAddr = vm.envAddress("GOVERNOR_ADDRESS");
        address tokenAddr = vm.envOr("GOVERNANCE_TOKEN_ADDRESS", address(0));
        if (tokenAddr == address(0)) {
            tokenAddr = vm.envAddress("GOVERNANCE_VOTES_TOKEN_ADDRESS");
        }

        vm.startBroadcast(pk);

        address[] memory t = new address[](1);
        uint256[] memory vals = new uint256[](1);
        bytes[] memory cds = new bytes[](1);
        t[0] = tokenAddr;
        vals[0] = 0;
        cds[0] = abi.encodeWithSignature("transfer(address,uint256)", deployer, 1);

        uint256 pid = TravelTrustGovernor(govAddr).propose(t, vals, cds, "TT-B417 Sepolia minimal: transfer 1 wei");
        console.log("proposalId", pid);

        vm.stopBroadcast();
    }
}
