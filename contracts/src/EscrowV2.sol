// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./Escrow.sol";

/**
 * @title EscrowV2
 * @notice Compatibility alias — L3 Security Hardened folded bilateral confirm + release guard into Escrow.
 * @dev FactoryV2 may still deploy EscrowV2; behavior matches hardened Escrow.
 */
contract EscrowV2 is Escrow {
    constructor(address _factory) Escrow(_factory) {}
}
