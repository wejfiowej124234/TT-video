// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * @title V311DaoProposalThresholds
 * @notice V3.1.1 ch.5 · ordinary/important/core snapshot thresholds（Phase A · Gap D-03/GOV-01）
 * @dev Mirrors registry/v311-dao-proposal-thresholds.v1.yaml
 */
library V311DaoProposalThresholds {
    uint8 internal constant TIER_ORDINARY = 0;
    uint8 internal constant TIER_IMPORTANT = 1;
    uint8 internal constant TIER_CORE = 2;

    error InvalidTier();

    /// @return required votes at snapshot supply（含 min/max 钳制）
    function requiredVotes(uint8 tier, uint256 supply) internal pure returns (uint256) {
        uint256 bps;
        uint256 minVotes;
        uint256 maxVotes;
        if (tier == TIER_ORDINARY) {
            bps = 50; // 0.5%
            minVotes = 5_000 ether;
            maxVotes = 50_000 ether;
        } else if (tier == TIER_IMPORTANT) {
            bps = 100; // 1%
            minVotes = 0;
            maxVotes = 100_000 ether;
        } else if (tier == TIER_CORE) {
            bps = 200; // 2%
            minVotes = 0;
            maxVotes = 200_000 ether;
        } else {
            revert InvalidTier();
        }
        uint256 raw = (supply * bps) / 10_000;
        if (minVotes != 0 && raw < minVotes) raw = minVotes;
        if (maxVotes != 0 && raw > maxVotes) raw = maxVotes;
        return raw;
    }
}
