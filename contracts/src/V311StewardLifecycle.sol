// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * @title V311StewardLifecycle
 * @notice V3.1.1 ch.11 · ACTIVE / Inactive / REMOVE · Gap S-04 / D-04 / GOV-02
 */
library V311StewardLifecycle {
    uint256 internal constant INACTIVE_DAYS = 180;
    bytes32 internal constant REMOVE_COUNTRY_STEWARD =
        keccak256("REMOVE_COUNTRY_STEWARD");

    enum State {
        ACTIVE,
        INACTIVE,
        REMOVED
    }

    error InvalidTransition(State from, State to);

    function isRemoveProposalType(bytes32 tag) internal pure returns (bool) {
        return tag == REMOVE_COUNTRY_STEWARD;
    }

    function canTransition(State from, State to) internal pure returns (bool) {
        if (from == State.ACTIVE && to == State.INACTIVE) return true;
        if (from == State.ACTIVE && to == State.REMOVED) return true;
        if (from == State.INACTIVE && to == State.REMOVED) return true;
        if (from == State.INACTIVE && to == State.ACTIVE) return true; // reopen after new applicant path (off-chain gate)
        return false;
    }

    function requireTransition(State from, State to) internal pure {
        if (!canTransition(from, to)) revert InvalidTransition(from, to);
    }
}
