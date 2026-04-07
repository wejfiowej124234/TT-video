// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract StubShareToken {
    function balanceOf(address) external pure returns (uint256) {
        return 777 * 1_000_000;
    }
}
