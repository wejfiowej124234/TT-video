// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./Phase2ControlPlane.sol";
import "./Phase2SafeExec.sol";

/**
 * @title ConfigureGovernanceTimelockViaSafe
 * @notice Phase B · 治理栈 Timelock admin 配置（`TIMELOCK_ADMIN_ADDRESS` = Safe）
 * @dev 在 `DeployGovernanceStack` Phase A 广播后单独重跑 · 或 dry-run 与 Phase A 同序
 *
 * Env（必填）：
 *   TIMELOCK_ADMIN_ADDRESS — Safe
 *   TIMELOCK_ADDRESS — 已部署 GovernanceTimelock
 *   GOVERNOR_ADDRESS — TravelTrustGovernor
 *   GOVERNANCE_TOKEN_ADDRESS — GovernanceVotesToken (TTG)
 *   TIMELOCK_SAFE_OWNER_KEYS — Safe owner 私钥（1-of-1 取首段）· 或 TIMELOCK_SAFE_OWNER_KEY
 *
 * 广播私钥 = Safe owner（付 gas · 经 Safe.execTransaction · msg.sender 对 Timelock = Safe）
 */
contract ConfigureGovernanceTimelockViaSafe is Phase2ControlPlane, Phase2SafeExec {
    function run() external {
        uint256 ownerPk = resolveSafeOwnerPrivateKey();
        address owner = vm.addr(ownerPk);

        address safe = vm.envAddress("TIMELOCK_ADMIN_ADDRESS");
        address timelock = vm.envAddress("TIMELOCK_ADDRESS");
        address governor = vm.envAddress("GOVERNOR_ADDRESS");
        address token = vm.envAddress("GOVERNANCE_TOKEN_ADDRESS");

        require(timelock != address(0), "ConfigureGovernanceTimelockViaSafe: TIMELOCK_ADDRESS required");
        require(governor != address(0), "ConfigureGovernanceTimelockViaSafe: GOVERNOR_ADDRESS required");
        require(token != address(0), "ConfigureGovernanceTimelockViaSafe: GOVERNANCE_TOKEN_ADDRESS required");
        require(safe.code.length > 0, "ConfigureGovernanceTimelockViaSafe: admin must be contract (Safe)");

        vm.startBroadcast(ownerPk);

        console.log("--- ConfigureGovernanceTimelockViaSafe (Phase B) ---");
        console.log("safeAdmin", safe);
        console.log("safeOwner", owner);
        console.log("GovernanceTimelock", timelock);
        console.log("TravelTrustGovernor", governor);
        console.log("GovernanceVotesToken_TTG", token);

        configureGovernanceTimelockViaSafe(safe, timelock, governor, token, ownerPk);

        vm.stopBroadcast();
    }
}
