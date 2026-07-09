// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./EscrowV2.sol";

/**
 * @title EscrowFactoryV2
 * @notice Mainnet path — deploys EscrowV2 (bilateral service completion before release).
 * @dev V1 EscrowFactory remains Sepolia/testnet legacy only.
 */
contract EscrowFactoryV2 {
    address public implementation;
    address public guardian;
    bool public factoryPaused;
    mapping(bytes32 => address) public escrowOf;

    event EscrowCreated(bytes32 indexed orderId, address indexed escrow);
    event FactoryPauseSet(bool paused);
    event GuardianshipTransferred(address indexed previousGuardian, address indexed newGuardian);

    error OrderAlreadyHasEscrow();
    error FactoryPaused();
    error OnlyGuardian();
    error InvalidGuardian();

    constructor(address guardian_) {
        if (guardian_ == address(0)) revert InvalidGuardian();
        implementation = address(new EscrowV2(address(0)));
        guardian = guardian_;
    }

    modifier onlyGuardian() {
        if (msg.sender != guardian) revert OnlyGuardian();
        _;
    }

    function transferGuardian(address newGuardian) external onlyGuardian {
        if (newGuardian == address(0)) revert InvalidGuardian();
        emit GuardianshipTransferred(guardian, newGuardian);
        guardian = newGuardian;
    }

    function setFactoryPaused(bool paused) external onlyGuardian {
        factoryPaused = paused;
        emit FactoryPauseSet(paused);
    }

    function createEscrow(Escrow.EscrowParams calldata params) external returns (address) {
        if (factoryPaused) revert FactoryPaused();
        if (escrowOf[params.orderId] != address(0)) revert OrderAlreadyHasEscrow();
        EscrowV2 escrow = new EscrowV2(address(this));
        escrow.init(params);
        escrowOf[params.orderId] = address(escrow);
        emit EscrowCreated(params.orderId, address(escrow));
        return address(escrow);
    }
}
