// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

/**
 * @title TtgV9DaoProposalThresholds
 * @notice V9 propose thresholds for 25T MAX_SUPPLY (English NatSpec only).
 * @dev G4 pin: bps of getPastTotalSupply(snapshot). NO absolute maxVotes (V311 50k caps SUPERSEDED).
 */
library TtgV9DaoProposalThresholds {
    uint8 internal constant TIER_ORDINARY = 0;
    uint8 internal constant TIER_IMPORTANT = 1;
    uint8 internal constant TIER_CORE = 2;

    error InvalidTier();

    /// @return required votes at snapshot supply (bps only; uncapped absolute)
    function requiredVotes(uint8 tier, uint256 supply) internal pure returns (uint256) {
        uint256 bps;
        if (tier == TIER_ORDINARY) {
            bps = 50; // 0.5%
        } else if (tier == TIER_IMPORTANT) {
            bps = 100; // 1%
        } else if (tier == TIER_CORE) {
            bps = 200; // 2%
        } else {
            revert InvalidTier();
        }
        return (supply * bps) / 10_000;
    }
}
