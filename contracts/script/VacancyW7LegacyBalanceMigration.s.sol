// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./Phase2SafeExec.sol";
import "./Phase2ControlPlane.sol";
import "../src/GovernanceTimelock.sol";
import "../src/IERC20.sol";

/// @notice Q-F01 legacy unallocated — releaseToStewardPath(uint256,bytes32) only.
interface ILegacyUnallocatedQF01 {
    function releaseToStewardPath(uint256 amount, bytes32 proposalRef) external;
}

/**
 * @title VacancyW7LegacyBalanceMigration
 * @notice W7 Case B · Sepolia only · two-leg migration:
 *   Leg A: Legacy Timelock → releaseToStewardPath (zeros legacy unalloc · steward holds residual)
 *   Leg B: Funding EOA → ERC20.transfer → new Vacancy V1 Unallocated
 * @dev Env: W7_MIGRATION_MODE = schedule | execute | fund
 */
contract VacancyW7LegacyBalanceMigration is Phase2ControlPlane, Phase2SafeExec {
    bytes32 internal constant MIGRATION_SALT = keccak256("W7-VACANCY-CASE-B-RELEASE");
    bytes32 internal constant PROPOSAL_REF = keccak256("W7-VACANCY-RUNTIME-ACTIVATION-CASE-B");

    function _releaseCalldata(uint256 amount) internal pure returns (bytes memory) {
        return abi.encodeWithSelector(ILegacyUnallocatedQF01.releaseToStewardPath.selector, amount, PROPOSAL_REF);
    }

    function _ensureUnallocAllowed(
        address safe,
        address legacyTimelock,
        address legacyUnalloc,
        uint256 ownerPk
    ) internal {
        safeExecCall(
            safe,
            legacyTimelock,
            abi.encodeCall(GovernanceTimelock.setAllowedExecutionTarget, (legacyUnalloc, true)),
            ownerPk
        );
        console.log("W7_MIGRATION allowed legacy unalloc on timelock");
    }

    function _scheduleRelease(
        address safe,
        address legacyTimelock,
        address legacyUnalloc,
        uint256 amount,
        uint256 ownerPk
    ) internal returns (bytes32 id) {
        bytes memory data = _releaseCalldata(amount);
        id = GovernanceTimelock(payable(legacyTimelock)).hashOperation(legacyUnalloc, 0, data, MIGRATION_SALT);
        safeExecCall(
            safe,
            legacyTimelock,
            abi.encodeCall(GovernanceTimelock.schedule, (legacyUnalloc, 0, data, MIGRATION_SALT)),
            ownerPk
        );
        console.log("W7_MIGRATION_SCHEDULED id");
        console.logBytes32(id);
    }

    function run() external {
        string memory mode = vm.envOr("W7_MIGRATION_MODE", string("schedule"));
        address legacyTimelock = vm.envAddress("CP_NET_PROFIT_LEDGER_OWNER_TIMELOCK");
        address legacyUnalloc = vm.envAddress("LEGACY_UNALLOCATED_VAULT");
        address newUnalloc = vm.envAddress("NEW_UNALLOCATED_VAULT");
        address token = vm.envAddress("SETTLEMENT_TOKEN_ADDRESS");
        address safe = vm.envAddress("TIMELOCK_ADMIN_ADDRESS");
        uint256 amount = vm.envOr("MIGRATION_AMOUNT_RAW", uint256(495_000));
        uint256 ownerPk = resolveSafeOwnerPrivateKey();
        uint256 broadcastPk = vm.envOr("PRIVATE_KEY", uint256(0));
        if (broadcastPk == 0) revert("PRIVATE_KEY required");

        bytes memory releaseData = _releaseCalldata(amount);

        if (_eq(mode, "schedule")) {
            vm.startBroadcast(ownerPk);
            _ensureUnallocAllowed(safe, legacyTimelock, legacyUnalloc, ownerPk);
            _scheduleRelease(safe, legacyTimelock, legacyUnalloc, amount, ownerPk);
            vm.stopBroadcast();
            console.log("W7_MIGRATION leg_a_schedule OK amount=", amount);
            return;
        }

        if (_eq(mode, "execute")) {
            bytes32 opId =
                GovernanceTimelock(payable(legacyTimelock)).hashOperation(legacyUnalloc, 0, releaseData, MIGRATION_SALT);
            vm.startBroadcast(broadcastPk);
            GovernanceTimelock(payable(legacyTimelock)).execute(opId);
            vm.stopBroadcast();
            console.log("W7_MIGRATION leg_a_execute OK");
            return;
        }

        if (_eq(mode, "fund")) {
            vm.startBroadcast(broadcastPk);
            require(IERC20(token).transfer(newUnalloc, amount), "W7_MIGRATION fund transfer failed");
            vm.stopBroadcast();
            console.log("W7_MIGRATION leg_b_fund OK newUnalloc=", newUnalloc);
            return;
        }

        revert("W7_MIGRATION_MODE must be schedule|execute|fund");
    }

    function _eq(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(bytes(a)) == keccak256(bytes(b));
    }
}
