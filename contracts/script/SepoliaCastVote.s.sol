// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Script.sol";
import "../src/TravelTrustGovernor.sol";

/**
 * @notice Sepolia · castVote(For) for an existing proposal.
 * @dev Env: PRIVATE_KEY, GOVERNOR_ADDRESS, PROPOSAL_ID
 */
contract SepoliaCastVote is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address govAddr = vm.envAddress("GOVERNOR_ADDRESS");
        uint256 pid = vm.envUint("PROPOSAL_ID");

        vm.startBroadcast(pk);
        TravelTrustGovernor(govAddr).castVote(pid, 1);
        vm.stopBroadcast();
    }
}
