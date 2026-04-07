// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// Returns a fixed stake above `MIN_STAKE` (1000e6) for B-092 `stakeOf` eth_call evidence.
contract StubStaking {
    function stakeOf(address) external pure returns (uint256) {
        return 2000 * 1_000_000;
    }
}
