// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

/**
 * @title TtgV9StewardLifecycle
 * @notice Minimal steward proposal type tags for GovernorV9 (English NatSpec only).
 */
library TtgV9StewardLifecycle {
    bytes32 internal constant REMOVE_COUNTRY_STEWARD = keccak256("REMOVE_COUNTRY_STEWARD");

    function isRemoveProposalType(bytes32 tag) internal pure returns (bool) {
        return tag == REMOVE_COUNTRY_STEWARD;
    }
}
