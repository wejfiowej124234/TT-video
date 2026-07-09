// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./Phase2ControlPlane.sol";
import "../src/EscrowFactoryV2.sol";

/**
 * @title DeployEscrowFactoryV2
 * @notice PG-P0-ESC Layer B — bilateral settlement factory (mainnet path · Sepolia preflight).
 * @dev Guardian = Timelock via Phase2ControlPlane (same as V1 fund stack).
 *
 * Env: PRIVATE_KEY · TIMELOCK_ADDRESS · CHAIN_RPC_URL
 * Log: `EscrowFactoryV2` address for registry `escrow_factory_v2_address`
 */
contract DeployEscrowFactoryV2 is Phase2ControlPlane {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        require(pk != 0, "DeployEscrowFactoryV2: PRIVATE_KEY required");

        address timelockAddr = vm.envAddress("TIMELOCK_ADDRESS");
        require(timelockAddr != address(0), "DeployEscrowFactoryV2: TIMELOCK_ADDRESS required");

        address deployer = vm.addr(pk);
        address guardian = resolveEscrowFactoryGuardian(deployer, timelockAddr);

        vm.startBroadcast(pk);
        EscrowFactoryV2 factory = new EscrowFactoryV2(guardian);
        vm.stopBroadcast();

        require(factory.guardian() == timelockAddr, "EscrowFactoryV2: guardian!=Timelock");

        console.log("--- DeployEscrowFactoryV2 (PG-P0-ESC) ---");
        console.log("deployer", deployer);
        console.log("TIMELOCK", timelockAddr);
        console.log("EscrowFactoryV2", address(factory));
        console.log("BINDING factory.guardian", factory.guardian());
        console.log("ESCROW_FACTORY_V2_BINDING_CHECK: OK");
    }
}
