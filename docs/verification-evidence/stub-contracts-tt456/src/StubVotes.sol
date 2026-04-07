// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract StubVotes {
    function getPastVotes(address, uint256) external pure returns (uint256) {
        return 100;
    }
}
