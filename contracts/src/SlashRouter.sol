// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./IERC20.sol";
import "./ISlashRouter.sol";

/**
 * @title SlashRouter
 * @notice 81 §3 — 罚没稳定币按 bps 分流至 ReserveVault / Protocol Treasury / sink；与 FeeRouter 45/55 **正交**。
 * @dev **部署硬约束**：`slashToReserveBps > 0`（81 §3.4～§3.5）；三组 bps 之和 = 10000。
 *      `routeFromPool`：质押池须事先 `approve` 本合约；`msg.sender` 为池地址。
 */
contract SlashRouter is ISlashRouter {
    IERC20 public immutable token;
    address public immutable reserveVault;
    address public immutable protocolTreasury;
    address public immutable sink;

    uint16 public immutable slashToReserveBps;
    uint16 public immutable slashToTreasuryBps;
    uint16 public immutable slashToSinkBps;

    event SlashRouted(
        address indexed pool,
        uint256 amount,
        uint256 toReserve,
        uint256 toTreasury,
        uint256 toSink
    );

    error SlashRouter_InvalidAddress();
    error SlashRouter_InvalidBpsSum();
    error SlashRouter_ReserveBpsZero();
    error SlashRouter_SinkUnset();
    error SlashRouter_TransferFailed();

    constructor(
        address _token,
        address _reserveVault,
        address _protocolTreasury,
        address _sink,
        uint16 _slashToReserveBps,
        uint16 _slashToTreasuryBps,
        uint16 _slashToSinkBps
    ) {
        if (_token == address(0) || _reserveVault == address(0) || _protocolTreasury == address(0)) {
            revert SlashRouter_InvalidAddress();
        }
        if (_slashToReserveBps == 0) revert SlashRouter_ReserveBpsZero();
        if (_slashToSinkBps > 0 && _sink == address(0)) revert SlashRouter_SinkUnset();

        uint256 sum = uint256(_slashToReserveBps) + uint256(_slashToTreasuryBps) + uint256(_slashToSinkBps);
        if (sum != 10000) revert SlashRouter_InvalidBpsSum();

        token = IERC20(_token);
        reserveVault = _reserveVault;
        protocolTreasury = _protocolTreasury;
        sink = _sink;
        slashToReserveBps = _slashToReserveBps;
        slashToTreasuryBps = _slashToTreasuryBps;
        slashToSinkBps = _slashToSinkBps;
    }

    /// @inheritdoc ISlashRouter
    function routeFromPool(uint256 amount) external override {
        if (amount == 0) return;
        if (!token.transferFrom(msg.sender, address(this), amount)) revert SlashRouter_TransferFailed();

        uint256 toRes = (amount * uint256(slashToReserveBps)) / 10000;
        uint256 toTreas = (amount * uint256(slashToTreasuryBps)) / 10000;
        uint256 toSk = amount - toRes - toTreas;

        if (toRes > 0) {
            if (!token.transfer(reserveVault, toRes)) revert SlashRouter_TransferFailed();
        }
        if (toTreas > 0) {
            if (!token.transfer(protocolTreasury, toTreas)) revert SlashRouter_TransferFailed();
        }
        if (toSk > 0) {
            if (sink == address(0)) revert SlashRouter_SinkUnset();
            if (!token.transfer(sink, toSk)) revert SlashRouter_TransferFailed();
        }

        emit SlashRouted(msg.sender, amount, toRes, toTreas, toSk);
    }
}
