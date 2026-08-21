// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

/**
 * @title TtgV9GovernanceParams
 * @notice G4 pinned Governor constructor defaults for V9 remint (English NatSpec only).
 */
library TtgV9GovernanceParams {
    /// @dev Quorum = (for + abstain) >= supply@snapshot * QUORUM_NUMERATOR_BPS / 10000
    uint256 internal constant QUORUM_NUMERATOR_BPS = 100; // 1%
    uint256 internal constant PROPOSAL_THRESHOLD_VOTES_FLOOR = 0;
    uint256 internal constant MAX_VOTING_POWER_PER_ADDRESS_BPS = 0; // disabled
    uint256 internal constant VOTING_DELAY_BLOCKS_LOCAL = 1;
    uint256 internal constant VOTING_PERIOD_BLOCKS_LOCAL = 10;
    uint256 internal constant ORDER_RATING_REVIEW_WINDOW_DAYS = 14;
}
