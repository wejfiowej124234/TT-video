// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./IERC20.sol";

/**
 * TravelTrust Staking — 身份质押（与 01 §4、contracts/README 一致）
 * MVP：仅要求累计 stake >= MIN_STAKE（示例 1000 USDC）；无按订单金额的 bps/Cap。
 * 多档 tier、订单比例质押见 docs/spec/08-3 stakeTierThresholds 与 81 — 链上待扩展。
 * `slash` 仅 `slasher` 可调（部署时多为多签/执行器；见 01/02 权限矩阵）。
 */
contract Staking {
    address public token;
    address public immutable slasher;
    mapping(address => uint256) public stakeOf;
    mapping(address => uint256) public slashedOf;
    uint256 public constant MIN_STAKE = 1000e6; // 示例：1000 USDC (6 decimals)

    event Staked(address indexed user, uint256 amount);
    event Slashed(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    error InsufficientStake();
    error TransferFailed();
    error StakeBelowMinimum();
    error NotSlasher();
    error ZeroSlasher();

    constructor(address _token, address _slasher) {
        if (_slasher == address(0)) revert ZeroSlasher();
        token = _token;
        slasher = _slasher;
    }

    function stake(uint256 amount) external {
        if (amount == 0) return;
        uint256 next = stakeOf[msg.sender] + amount;
        if (next < MIN_STAKE) revert StakeBelowMinimum();
        (bool ok) = IERC20(token).transferFrom(msg.sender, address(this), amount);
        if (!ok) revert TransferFailed();
        stakeOf[msg.sender] = next;
        emit Staked(msg.sender, amount);
    }

    function slash(address user, uint256 amount) external {
        if (msg.sender != slasher) revert NotSlasher();
        if (stakeOf[user] < amount) revert InsufficientStake();
        stakeOf[user] -= amount;
        slashedOf[user] += amount;
        emit Slashed(user, amount);
    }

    function withdraw(uint256 amount) external {
        if (stakeOf[msg.sender] < amount) revert InsufficientStake();
        stakeOf[msg.sender] -= amount;
        (bool ok) = IERC20(token).transfer(msg.sender, amount);
        if (!ok) revert TransferFailed();
        emit Withdrawn(msg.sender, amount);
    }
}
