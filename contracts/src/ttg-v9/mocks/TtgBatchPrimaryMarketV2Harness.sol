// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {TtgBatchPrimaryMarket} from "../TtgBatchPrimaryMarket.sol";

/**
 * @title TtgBatchPrimaryMarketV2Harness
 * @notice Local upgrade harness: appends one storage field after V1 gap (English NatSpec only).
 */
contract TtgBatchPrimaryMarketV2Harness is TtgBatchPrimaryMarket {
    uint256 public upgradeMarker;

    function setUpgradeMarker(uint256 v) external onlyTimelock {
        upgradeMarker = v;
    }

    function version() external pure override returns (string memory) {
        return "ttg_batch_primary_market_v9_uups_v2";
    }
}
