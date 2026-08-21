// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {TtgV9DeployTopology} from "./TtgV9DeployTopology.sol";
import {TtgV9GovernanceParams} from "./TtgV9GovernanceParams.sol";

/**
 * @title TtgV9AtomicDeployerMainnet
 * @notice Official Mainnet V9 factory — topology in one tx with **production** Governor windows.
 * @dev Closes A3-OPEN-01 (LOCAL 1/10 must not be Official Mainnet Governor).
 *      Enforces floors: delay >= MAINNET · period >= MAINNET.
 *      Pass KEEP Timelock / P4Cap / real USDC / Norm ops. English NatSpec only.
 */
contract TtgV9AtomicDeployerMainnet {
    TtgV9DeployTopology.Bundle public bundle;

    error InvalidAddress();
    error GovernorParamsBelowMainnetFloor();

    constructor(
        address usdc,
        address usdcTreasuryP4Cap,
        address timelock,
        address guardian,
        address team,
        address marketing,
        address treasury,
        uint256 votingDelayBlocks,
        uint256 votingPeriodBlocks
    ) {
        if (
            usdc == address(0) || usdcTreasuryP4Cap == address(0) || timelock == address(0)
                || guardian == address(0) || team == address(0) || marketing == address(0) || treasury == address(0)
        ) {
            revert InvalidAddress();
        }
        if (
            votingDelayBlocks < TtgV9GovernanceParams.VOTING_DELAY_BLOCKS_MAINNET
                || votingPeriodBlocks < TtgV9GovernanceParams.VOTING_PERIOD_BLOCKS_MAINNET
        ) {
            revert GovernorParamsBelowMainnetFloor();
        }
        bundle = TtgV9DeployTopology.deployWithGovernorParams(
            usdc,
            usdcTreasuryP4Cap,
            timelock,
            guardian,
            team,
            marketing,
            treasury,
            votingDelayBlocks,
            votingPeriodBlocks
        );
    }

    function token() external view returns (address) {
        return address(bundle.token);
    }

    function vault() external view returns (address) {
        return address(bundle.vault);
    }

    function market() external view returns (address) {
        return address(bundle.market);
    }

    function governor() external view returns (address) {
        return address(bundle.governor);
    }

    function vaultImpl() external view returns (address) {
        return bundle.vaultImpl;
    }

    function marketImpl() external view returns (address) {
        return bundle.marketImpl;
    }
}
