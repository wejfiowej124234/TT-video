// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * @title StakeAccountingLib
 * @notice 81 §2.3 — 三账本是**逻辑角色**，不是三个无语义 uint 并列：
 *      - **可提取（available）**：身份准入侧余额，满足规则后可 withdraw（对应 §2.3-A 身份押金账）。
 *      - **可锁定（lockedOrder）**：订单风险侧，从 available 划入或单独入账（§2.3-B）。
 *      - **可罚没（slashable）**：不单独存第三格；罚没顺序为 **先扣 lockedOrder，再扣 available**（`allocateSlash`），与「 slashable 覆盖面」一致。
 *      - **池级 slashReserve**（§2.3-C）：罚没归集后的准备金，记在池子维度；外链 SlashRouter 见 B-406+。
 */
library StakeAccountingLib {
    struct UserLedgers {
        /// @dev 可提取余额（身份账；受最低质押等规则约束）。
        uint256 available;
        /// @dev 已锁定订单风险（不可当可用余额提取，直至释放）。
        uint256 lockedOrder;
    }

    error InsufficientAvailable();
    error InsufficientLockedOrder();

    /// @notice 罚没分配：优先从 `lockedOrder` 扣，不足再扣 `available`。返回 (fromLocked, fromAvailable)。
    function allocateSlash(UserLedgers storage u, uint256 amount)
        internal
        returns (uint256 fromLockedOrder, uint256 fromAvailable)
    {
        uint256 locked = u.lockedOrder;
        if (locked >= amount) {
            u.lockedOrder = locked - amount;
            return (amount, 0);
        }
        fromLockedOrder = locked;
        u.lockedOrder = 0;
        uint256 need = amount - fromLockedOrder;
        if (u.available < need) revert InsufficientAvailable();
        u.available -= need;
        fromAvailable = need;
    }

    /// @notice 可提取 → 可锁定（订单加锁）。
    function lockAvailableToOrder(UserLedgers storage u, uint256 amount) internal {
        if (u.available < amount) revert InsufficientAvailable();
        u.available -= amount;
        u.lockedOrder += amount;
    }

    /// @notice 可锁定 → 可提取（订单释放）。
    function releaseLockedToAvailable(UserLedgers storage u, uint256 amount) internal {
        if (u.lockedOrder < amount) revert InsufficientLockedOrder();
        u.lockedOrder -= amount;
        u.available += amount;
    }
}
