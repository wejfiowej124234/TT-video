// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * @title V311EconomicConstants
 * @notice Offline / deploy-time mirrors of Economic Constitution V3.1.1 (LOCKED)
 * @dev Not a substitute for live Timelock Bundle (T-04/T-05). Constitution SSOT remains the markdown.
 */
library V311EconomicConstants {
    /// Platform Service Fee default 5%
    uint16 internal constant PLATFORM_SERVICE_FEE_DEFAULT_BPS = 500;
    /// Hard range 0–10%; >10% requires core governance proposal (off-chain/DAO), not Escrow init
    uint16 internal constant PLATFORM_SERVICE_FEE_MAX_BPS = 1000;

    /// Distributable split when ACTIVE steward exists
    uint16 internal constant STEWARD_SHARE_BPS = 4500;
    uint16 internal constant PROJECT_REVENUE_POOL_BPS = 5500;
    /// No ACTIVE steward → 100% Project Revenue Pool
    uint16 internal constant PROJECT_REVENUE_POOL_BPS_NO_STEWARD = 10000;

    uint256 internal constant PLATFORM_ACCESS_FEE_USDC = 300_000e6;
}
