// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "./TtgMemeDenomConstants.sol";

/**
 * @title TtgMemeDenomProposalThresholds
 * @notice Live V311DaoProposalThresholds semantics. Absolute clamps × MERGE_RATIO.
 * @dev 0.5% / 1% / 2% of snapshot supply, then min/max. On 25T the ordinary raw 0.5%
 *      equals the scaled max (125B), same shape as live 10M where 0.5% equals 50k max.
 */
library TtgMemeDenomProposalThresholds {
    uint8 internal constant TIER_ORDINARY = 0;
    uint8 internal constant TIER_IMPORTANT = 1;
    uint8 internal constant TIER_CORE = 2;

    error InvalidTier();

    function requiredVotes(uint8 tier, uint256 supply) internal pure returns (uint256) {
        uint256 bps;
        uint256 minVotes;
        uint256 maxVotes;
        if (tier == TIER_ORDINARY) {
            bps = TtgMemeDenomConstants.PROPOSAL_TIER_ORDINARY_BPS;
            minVotes = TtgMemeDenomConstants.PROPOSAL_ORDINARY_MIN_TTG;
            maxVotes = TtgMemeDenomConstants.PROPOSAL_ORDINARY_MAX_TTG;
        } else if (tier == TIER_IMPORTANT) {
            bps = TtgMemeDenomConstants.PROPOSAL_TIER_IMPORTANT_BPS;
            minVotes = 0;
            maxVotes = TtgMemeDenomConstants.PROPOSAL_IMPORTANT_MAX_TTG;
        } else if (tier == TIER_CORE) {
            bps = TtgMemeDenomConstants.PROPOSAL_TIER_CORE_BPS;
            minVotes = 0;
            maxVotes = TtgMemeDenomConstants.PROPOSAL_CORE_MAX_TTG;
        } else {
            revert InvalidTier();
        }
        uint256 raw = (supply * bps) / 10_000;
        if (minVotes != 0 && raw < minVotes) raw = minVotes;
        if (maxVotes != 0 && raw > maxVotes) raw = maxVotes;
        return raw;
    }

    function requiredBps(uint8 tier) internal pure returns (uint256) {
        if (tier == TIER_ORDINARY) return TtgMemeDenomConstants.PROPOSAL_TIER_ORDINARY_BPS;
        if (tier == TIER_IMPORTANT) return TtgMemeDenomConstants.PROPOSAL_TIER_IMPORTANT_BPS;
        if (tier == TIER_CORE) return TtgMemeDenomConstants.PROPOSAL_TIER_CORE_BPS;
        revert InvalidTier();
    }
}
