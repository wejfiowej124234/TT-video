// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {TtgV9DeployTopology} from "./TtgV9DeployTopology.sol";

/**
 * @title TtgV9AtomicDeployer
 * @notice ①/② V9 stack factory — entire topology in **one** constructor transaction (LOCAL Governor windows).
 * @dev Closes Red-Team RT2-OPEN-01. For Official Mainnet use `TtgV9AtomicDeployerMainnet` (A3-OPEN-01).
 *      Do not deploy Vault proxy with empty initData in a separate transaction.
 *      English NatSpec only.
 */
contract TtgV9AtomicDeployer {
    TtgV9DeployTopology.Bundle public bundle;

    error InvalidAddress();

    constructor(
        address usdc,
        address usdcTreasuryP4Cap,
        address timelock,
        address guardian,
        address team,
        address marketing,
        address treasury
    ) {
        if (
            usdc == address(0) || usdcTreasuryP4Cap == address(0) || timelock == address(0)
                || guardian == address(0) || team == address(0) || marketing == address(0) || treasury == address(0)
        ) {
            revert InvalidAddress();
        }
        bundle = TtgV9DeployTopology.deploy(
            usdc, usdcTreasuryP4Cap, timelock, guardian, team, marketing, treasury
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
