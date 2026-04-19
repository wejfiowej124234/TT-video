// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./IERC20.sol";

/**
 * @title ReserveVault
 * @notice 81 §3.5 — Slash Reserve 准备金托管；**对外划出仅经 Timelock（或等价的单一 spender）**，禁止 EOA 日常热提。
 *      入账来自 `SlashRouter` 的 `transfer`；与 FeeRouter 路径正交。
 */
contract ReserveVault {
    IERC20 public immutable asset;
    address public immutable timelock;

    error TransferFailed();
    error ZeroTimelock();
    error InvalidRecipient();
    error InvalidAmount();
    error OnlyTimelock();

    event Withdrawn(address indexed to, uint256 amount);

    constructor(address _asset, address _timelock) {
        if (_timelock == address(0)) revert ZeroTimelock();
        asset = IERC20(_asset);
        timelock = _timelock;
    }

    modifier onlyTimelock() {
        if (msg.sender != timelock) revert OnlyTimelock();
        _;
    }

    /// @notice Timelock 执行 payload 时转出准备金（与 GovernanceTreasury.spend 同纪律）。
    function withdraw(address to, uint256 amount) external onlyTimelock {
        if (amount == 0) revert InvalidAmount();
        if (to == address(0)) revert InvalidRecipient();
        if (!asset.transfer(to, amount)) revert TransferFailed();
        emit Withdrawn(to, amount);
    }
}
