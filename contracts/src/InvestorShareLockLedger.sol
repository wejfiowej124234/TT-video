// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * TravelTrust — 份额锁仓账簿（MVP）
 *
 * 与 **B-088 Completion · 112** 一致：**`Locked` / `Unlocked`** 事件 topic 与
 * `crates/api` **`LOCKED_TOPIC0` / `UNLOCKED_TOPIC0`** 对齐；**不**托管 ERC20，仅记账 **`lockedOf`**。
 */
contract InvestorShareLockLedger {
    mapping(address => uint256) public lockedOf;

    event Locked(address indexed user, uint256 amount);
    event Unlocked(address indexed user, uint256 amount);

    error InsufficientLocked();

    function lock(uint256 amount) external {
        if (amount == 0) return;
        uint256 next = lockedOf[msg.sender] + amount;
        lockedOf[msg.sender] = next;
        emit Locked(msg.sender, amount);
    }

    function unlock(uint256 amount) external {
        if (amount == 0) return;
        if (lockedOf[msg.sender] < amount) revert InsufficientLocked();
        lockedOf[msg.sender] -= amount;
        emit Unlocked(msg.sender, amount);
    }
}
