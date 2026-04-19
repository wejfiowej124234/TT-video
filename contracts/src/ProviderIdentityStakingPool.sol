// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./IdentityStakingPool.sol";

/// @title ProviderIdentityStakingPool
/// @notice 81 §2.2 / §8 — 商家(provider)身份与订单风险池。
/// @dev **必须**与 `GuideIdentityStakingPool` **分合约、分地址**部署；禁止用单池 + `role` 字段模拟双池（参数/风险模型会串）。
contract ProviderIdentityStakingPool is IdentityStakingPool {
    constructor(address _token, address _slasher, uint256 _minIdentityStake, address _slashRouter)
        IdentityStakingPool(_token, _slasher, _minIdentityStake, _slashRouter)
    {}
}
