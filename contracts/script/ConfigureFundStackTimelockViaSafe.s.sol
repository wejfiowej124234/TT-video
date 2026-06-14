// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./Phase2ControlPlane.sol";
import "./Phase2SafeExec.sol";

/**
 * @title ConfigureFundStackTimelockViaSafe
 * @notice Phase B · FundStack Timelock allowlist（`TIMELOCK_ADMIN_ADDRESS` = Safe）
 * @dev 在 `DeployFundStackUnderTimelock` Phase A 广播后单独重跑
 *
 * Env（必填）：
 *   TIMELOCK_ADMIN_ADDRESS — Safe
 *   TIMELOCK_ADDRESS — 已部署 GovernanceTimelock
 *   FEE_ROUTER_ADDRESS · TREASURY_ADDRESS · RESERVE_VAULT_ADDRESS · REGION_VAULT_ADDRESS
 *   TIMELOCK_SAFE_OWNER_KEYS — Safe owner 私钥
 */
contract ConfigureFundStackTimelockViaSafe is Phase2ControlPlane, Phase2SafeExec {
    function run() external {
        uint256 ownerPk = resolveSafeOwnerPrivateKey();
        address owner = vm.addr(ownerPk);

        address safe = vm.envAddress("TIMELOCK_ADMIN_ADDRESS");
        address timelock = vm.envAddress("TIMELOCK_ADDRESS");
        address feeRouter = vm.envAddress("FEE_ROUTER_ADDRESS");
        address treasury = vm.envAddress("TREASURY_ADDRESS");
        address reserveVault = vm.envAddress("RESERVE_VAULT_ADDRESS");
        address regionVault = vm.envAddress("REGION_VAULT_ADDRESS");

        require(timelock != address(0), "ConfigureFundStackTimelockViaSafe: TIMELOCK_ADDRESS required");
        require(safe.code.length > 0, "ConfigureFundStackTimelockViaSafe: admin must be contract (Safe)");

        vm.startBroadcast(ownerPk);

        console.log("--- ConfigureFundStackTimelockViaSafe (Phase B) ---");
        console.log("safeAdmin", safe);
        console.log("safeOwner", owner);
        console.log("GovernanceTimelock", timelock);
        console.log("FeeRouter", feeRouter);
        console.log("GovernanceTreasury", treasury);
        console.log("ReserveVault", reserveVault);
        console.log("RegionVault", regionVault);

        configureFundStackTimelockViaSafe(
            safe, timelock, feeRouter, treasury, reserveVault, regionVault, ownerPk
        );

        vm.stopBroadcast();
    }
}
