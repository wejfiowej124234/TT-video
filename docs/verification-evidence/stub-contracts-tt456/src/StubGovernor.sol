// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// Minimal governor stub for B-089 live evidence: `state(uint256)` only.
contract StubGovernor {
    function state(uint256) external pure returns (uint256) {
        return 0; // Pending
    }
}
