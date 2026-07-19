// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./V311EconomicConstants.sol";

/**
 * @title V311DistributableSplit
 * @notice V3.1.1 Distributable Platform Service Fee split · Gap F-05 / F-06 / RT-01
 * @dev ACTIVE steward → 45% steward / 55% Project Revenue Pool; else 100% Pool.
 */
library V311DistributableSplit {
    error BadBpsSum();

    function split(uint256 distributableFee, bool stewardActive)
        internal
        pure
        returns (uint256 stewardShare, uint256 poolShare)
    {
        if (distributableFee == 0) return (0, 0);
        if (stewardActive) {
            stewardShare = (distributableFee * uint256(V311EconomicConstants.STEWARD_SHARE_BPS)) / 10_000;
            poolShare = distributableFee - stewardShare;
            if (
                V311EconomicConstants.STEWARD_SHARE_BPS + V311EconomicConstants.PROJECT_REVENUE_POOL_BPS
                    != 10_000
            ) revert BadBpsSum();
            return (stewardShare, poolShare);
        }
        return (0, distributableFee);
    }
}
