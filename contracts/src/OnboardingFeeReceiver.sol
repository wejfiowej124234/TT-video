// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./IERC20.sol";

/// @title 商家 / 主理人 M1 准入费链上收款（Partial · MVP）
/// @notice Pull 模式 ERC20；与 Escrow 订单托管资金流隔离。原生币路径未开：`token == address(0)` 拒收。
/// @dev 对齐 **96-18**、**14 §1.1.0c** 叙事面；Timelock / 多签归属与运维见 **96-07**（本版仅 `owner`）。
interface IOnboardingFeeReceiver {
    event OnboardingFeePaid(
        bytes32 indexed idempotencyKey,
        address indexed payer,
        uint8 indexed roleTarget,
        address token,
        uint256 amount,
        bytes32 feeScheduleVersion
    );

    function pay(
        address token,
        uint256 amount,
        bytes32 idempotencyKey,
        uint8 roleTarget,
        bytes32 feeScheduleVersion
    ) external payable;

    function pause() external;

    function paused() external view returns (bool);
}

contract OnboardingFeeReceiver is IOnboardingFeeReceiver {
    address public owner;
    bool public paused;
    mapping(bytes32 => bool) private _idempotencyConsumed;

    error OnlyOwner();
    error Paused();
    error IdempotencyReplay();
    error InvalidAddress();
    error InvalidToken();
    error InvalidAmount();
    error TransferFailed();
    error UnexpectedNativeValue();

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert Paused();
        _;
    }

    constructor(address owner_) {
        owner = owner_;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        owner = newOwner;
    }

    /// @notice 恢复收款（仅 `owner`；不在 `IOnboardingFeeReceiver` 最小面，供运维 / 多签流程使用）。
    function unpause() external onlyOwner {
        paused = false;
    }

    /// @inheritdoc IOnboardingFeeReceiver
    function pause() external onlyOwner {
        paused = true;
    }

    /// @inheritdoc IOnboardingFeeReceiver
    function pay(
        address token,
        uint256 amount,
        bytes32 idempotencyKey,
        uint8 roleTarget,
        bytes32 feeScheduleVersion
    ) external payable whenNotPaused {
        if (msg.value != 0) revert UnexpectedNativeValue();
        if (token == address(0)) revert InvalidToken();
        if (amount == 0) revert InvalidAmount();
        if (_idempotencyConsumed[idempotencyKey]) revert IdempotencyReplay();

        _idempotencyConsumed[idempotencyKey] = true;
        if (!IERC20(token).transferFrom(msg.sender, address(this), amount)) {
            _idempotencyConsumed[idempotencyKey] = false;
            revert TransferFailed();
        }

        emit OnboardingFeePaid(idempotencyKey, msg.sender, roleTarget, token, amount, feeScheduleVersion);
    }
}
