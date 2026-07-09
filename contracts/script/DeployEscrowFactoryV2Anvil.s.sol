// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Script.sol";
import "../src/EscrowFactoryV2.sol";

/**
 * @title DeployEscrowFactoryV2Anvil
 * @notice Phase ① only — deployer as guardian on Anvil (no Timelock prerequisite).
 * @dev For Sepolia/mainnet use DeployEscrowFactoryV2.s.sol + Timelock guardian.
 */
contract DeployEscrowFactoryV2Anvil is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        require(pk != 0, "DeployEscrowFactoryV2Anvil: PRIVATE_KEY required");
        address deployer = vm.addr(pk);

        vm.startBroadcast(pk);
        EscrowFactoryV2 factory = new EscrowFactoryV2(deployer);
        vm.stopBroadcast();

        console.log("--- DeployEscrowFactoryV2Anvil (Phase 1) ---");
        console.log("deployer", deployer);
        console.log("EscrowFactoryV2", address(factory));
        console.log("BINDING factory.guardian", factory.guardian());
        console.log("ESCROW_FACTORY_V2_ANVIL_BINDING_CHECK: OK");
    }
}
