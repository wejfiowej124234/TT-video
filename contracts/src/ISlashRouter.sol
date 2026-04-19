// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/// @notice 身份质押池罚没分流入口（81 §3 / B-406）。
interface ISlashRouter {
    /// @notice 调用者须为已 `approve` 本路由的质押池；将 `amount` 从 `msg.sender` 拉入并分流。
    function routeFromPool(uint256 amount) external;
}
