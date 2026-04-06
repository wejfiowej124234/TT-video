// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./IERC20.sol";

/**
 * @title FeeRouter
 * @notice 可分配平台手续费的路由（Target · MVP）：相对单笔 `amount` 按 [83] §3、[84] §一 做第一层 45/55，
 *         并对 Global（55%）做二层 65/20/15。四方收款地址与 BPS **可由 `owner` 更新**（宜 **Timelock** 为 owner），
 *         默认值与历史 **immutable/constant** 一致（B-089 Completion：`setRoutingConfig` + Timelock `execute` 验收）。
 * @dev 与 Escrow 衔接：可将本合约设为 `platformFeeRecipient`，由 `owner`（宜多签）对入账代币调用 `distribute`。
 *      **不得**将仲裁费、`Staking.slash` 罚没等并入本拆分（正交关系见 84 §1.1.1、Runbook §7.1）。
 *      RegionVault / 按国再分、Snapshot/Claim 仍属协议 Target，不在本合约实现。
 *      母表 **B-091**：**`distributePaused`** 时 **`distribute`** **revert**（**新费路由**阻断）；**已入账**代币留在本合约直至恢复。
 */
contract FeeRouter {
    address public owner;

    bool public distributePaused;

    address public countryBucket;
    address public globalStakers;
    address public globalReserve;
    address public globalOps;

    uint256 private _bpsCountry;
    uint256 private _bpsGlobalStakers;
    uint256 private _bpsGlobalReserve;
    uint256 private _bpsGlobalOps;

    error OnlyOwner();
    error TransferFailed();
    error InvalidAmount();
    error DistributePaused();
    error InvalidAddress();
    error InvalidBps();

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event DistributePausedSet(bool paused);
    event RoutingConfigSet(
        address countryBucket,
        address globalStakers,
        address globalReserve,
        address globalOps,
        uint256 bpsCountry,
        uint256 bpsGlobalStakers,
        uint256 bpsGlobalReserve,
        uint256 bpsGlobalOps
    );
    event PlatformFeeRouted(
        address indexed token,
        uint256 amount,
        uint256 toCountry,
        uint256 toStakers,
        uint256 toReserve,
        uint256 toOps
    );

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    constructor(
        address owner_,
        address countryBucket_,
        address globalStakers_,
        address globalReserve_,
        address globalOps_
    ) {
        if (
            countryBucket_ == address(0) || globalStakers_ == address(0) || globalReserve_ == address(0)
                || globalOps_ == address(0)
        ) revert InvalidAddress();
        owner = owner_;
        countryBucket = countryBucket_;
        globalStakers = globalStakers_;
        globalReserve = globalReserve_;
        globalOps = globalOps_;
        _bpsCountry = 4500;
        _bpsGlobalStakers = 3575;
        _bpsGlobalReserve = 1100;
        _bpsGlobalOps = 825;
    }

    /// @notice 与历史 **constant** 口径一致的只读接口（ABI 名不变）。
    function BPS_COUNTRY() external view returns (uint256) {
        return _bpsCountry;
    }

    function BPS_GLOBAL_STAKERS() external view returns (uint256) {
        return _bpsGlobalStakers;
    }

    function BPS_GLOBAL_RESERVE() external view returns (uint256) {
        return _bpsGlobalReserve;
    }

    function BPS_GLOBAL_OPS() external view returns (uint256) {
        return _bpsGlobalOps;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setDistributePaused(bool paused) external onlyOwner {
        distributePaused = paused;
        emit DistributePausedSet(paused);
    }

    /**
     * @notice **B-089**：原子更新四方地址与四路 BPS（须 **和 = 10000**）。**`owner`** 宜为 **GovernanceTimelock**。
     * @dev 更新后 **`distribute`** 立即按新配置拆分；Escrow **仍须**将 **`platformFeeRecipient`** 指回本 Router 地址（迁址 Router 时运维换址，见 Runbook §7.1）。
     */
    function setRoutingConfig(
        address countryBucket_,
        address globalStakers_,
        address globalReserve_,
        address globalOps_,
        uint256 bpsCountry_,
        uint256 bpsGlobalStakers_,
        uint256 bpsGlobalReserve_,
        uint256 bpsGlobalOps_
    ) external onlyOwner {
        if (
            countryBucket_ == address(0) || globalStakers_ == address(0) || globalReserve_ == address(0)
                || globalOps_ == address(0)
        ) revert InvalidAddress();
        uint256 sum = bpsCountry_ + bpsGlobalStakers_ + bpsGlobalReserve_ + bpsGlobalOps_;
        if (sum != 10000) revert InvalidBps();

        countryBucket = countryBucket_;
        globalStakers = globalStakers_;
        globalReserve = globalReserve_;
        globalOps = globalOps_;
        _bpsCountry = bpsCountry_;
        _bpsGlobalStakers = bpsGlobalStakers_;
        _bpsGlobalReserve = bpsGlobalReserve_;
        _bpsGlobalOps = bpsGlobalOps_;

        emit RoutingConfigSet(
            countryBucket_, globalStakers_, globalReserve_, globalOps_, bpsCountry_, bpsGlobalStakers_,
            bpsGlobalReserve_, bpsGlobalOps_
        );
    }

    /**
     * @notice 拆分本合约已持有的 ERC20。
     * @param token 代币合约
     * @param amount 本次拆分数量（须 ≤ 本合约 `balanceOf`）
     */
    function distribute(IERC20 token, uint256 amount) external onlyOwner {
        if (distributePaused) revert DistributePaused();
        if (amount == 0) revert InvalidAmount();
        if (token.balanceOf(address(this)) < amount) revert InvalidAmount();

        uint256 toCountry = (amount * _bpsCountry) / 10000;
        uint256 toStakers = (amount * _bpsGlobalStakers) / 10000;
        uint256 toReserve = (amount * _bpsGlobalReserve) / 10000;
        uint256 toOps = amount - toCountry - toStakers - toReserve;

        if (!token.transfer(countryBucket, toCountry)) revert TransferFailed();
        if (!token.transfer(globalStakers, toStakers)) revert TransferFailed();
        if (!token.transfer(globalReserve, toReserve)) revert TransferFailed();
        if (!token.transfer(globalOps, toOps)) revert TransferFailed();

        emit PlatformFeeRouted(address(token), amount, toCountry, toStakers, toReserve, toOps);
    }
}
