// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./IdentityStakingPool.sol";

/// @title GuideIdentityStakingPool
/// @notice 81 §2.1 / §8 — 向导身份与向导侧订单风险池。
/// @dev **必须**与 `ProviderIdentityStakingPool` **分合约、分地址**部署；禁止用单池 + `role` 字段模拟双池（参数/风险模型会串）。
contract GuideIdentityStakingPool is IdentityStakingPool {
    constructor(address _token, address _slasher, uint256 _minIdentityStake, address _slashRouter)
        IdentityStakingPool(_token, _slasher, _minIdentityStake, _slashRouter)
    {}
}
