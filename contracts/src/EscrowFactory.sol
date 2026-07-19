// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./Escrow.sol";

/**
 * TravelTrust EscrowFactory（与 01 §4、19 一致）
 * 每单部署新 Escrow 实例；orderId -> escrow 一对一
 * @dev 母表 **B-091**：**`factoryPaused`** 时 **禁止** **`createEscrow`**（**新单**阻断）；**已部署 Escrow** 实例 **不**受影响（与 **03** 在途订单继续履约一致）。
 */
contract EscrowFactory {
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
    error InvalidSettlementRouter();

    constructor(address guardian_) {
        if (guardian_ == address(0)) revert InvalidGuardian();
        implementation = address(new Escrow(address(0))); // 占位，createEscrow 每单 new Escrow(this)
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
        Escrow escrow = new Escrow(address(this));
        escrow.init(params);
        escrowOf[params.orderId] = address(escrow);
        emit EscrowCreated(params.orderId, address(escrow));
        return address(escrow);
    }

    /// @notice L5-A · create Escrow and wire fee leg to SettlementRouter (TARGET path)
    function createEscrowWired(Escrow.EscrowParams calldata params, address settlementRouter)
        external
        returns (address)
    {
        if (factoryPaused) revert FactoryPaused();
        if (escrowOf[params.orderId] != address(0)) revert OrderAlreadyHasEscrow();
        if (settlementRouter == address(0)) revert InvalidSettlementRouter();
        Escrow escrow = new Escrow(address(this));
        escrow.init(params);
        escrow.setSettlementRouter(settlementRouter);
        escrowOf[params.orderId] = address(escrow);
        emit EscrowCreated(params.orderId, address(escrow));
        return address(escrow);
    }
}
