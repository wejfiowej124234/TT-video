// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {TtgPublicSaleVault} from "../TtgPublicSaleVault.sol";

/**
 * @title TtgPublicSaleVaultV2Harness
 * @notice Local upgrade harness: appends one storage field after V1 gap (English NatSpec only).
 */
contract TtgPublicSaleVaultV2Harness is TtgPublicSaleVault {
    uint256 public upgradeMarker;

    function setUpgradeMarker(uint256 v) external onlyAdmin {
        upgradeMarker = v;
    }

    function version() external pure override returns (string memory) {
        return "ttg_public_sale_vault_v9_uups_v2";
    }
}
