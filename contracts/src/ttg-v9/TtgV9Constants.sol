// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

/**
 * @title TtgV9Constants
 * @notice DESIGN_ONLY V9 economics + pinned five-batch caps. English NatSpec only.
 * @dev Percent copy uses total supply 25T as denominator. Pin absolute amountCaps — do not derive via bps.
 */
library TtgV9Constants {
    uint256 internal constant TTG_TOTAL_SUPPLY_UNITS = 25_000_000_000_000 ether;

    uint256 internal constant PUBLIC_SALE_BPS = 5000;
    uint256 internal constant DAO_TREASURY_BPS = 3500;
    uint256 internal constant TEAM_BPS = 300;
    uint256 internal constant MARKETING_BPS = 500;
    uint256 internal constant TREASURY_OPS_BPS = 700;

    uint256 internal constant PUBLIC_SALE_MIN_PURCHASE_USDC = 1e6;
    uint256 internal constant BATCH_COUNT = 5;
    uint256 internal constant BATCH5_DURATION_SECONDS = 60 days;

    /// @dev Absolute whole-TTG caps (wei = amount * 1e18).
    function batchAmountCapWei(uint256 batchId) internal pure returns (uint256) {
        if (batchId == 1) return 1_250_000_000 ether;
        if (batchId == 2) return 3_750_000_000 ether;
        if (batchId == 3) return 18_750_000_000 ether;
        if (batchId == 4) return 168_750_000_000 ether;
        if (batchId == 5) return 2_025_000_000_000 ether;
        return 0;
    }

    /// @dev USDC raw (6 decimals) charged per 1 whole TTG.
    function usdcRawPerWholeTtg(uint256 batchId) internal pure returns (uint256) {
        if (batchId == 1) return 1;
        if (batchId == 2) return 3;
        if (batchId == 3) return 5;
        if (batchId == 4) return 7;
        if (batchId == 5) return 9;
        return 0;
    }

    function batch1StartTimestamp() internal pure returns (uint256) {
        return 1792054800; // 2026-10-15T09:00:00Z
    }

    function batchStartTimestamp(uint256 batchId) internal pure returns (uint256) {
        if (batchId == 1) return 1792054800;
        if (batchId == 2) return 1797325200;
        if (batchId == 3) return 1802682000;
        if (batchId == 4) return 1807779600;
        if (batchId == 5) return 1813050000;
        return 0;
    }
}
