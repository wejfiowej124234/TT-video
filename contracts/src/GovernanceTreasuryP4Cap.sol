// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./GovernanceTreasury.sol";
import "./IERC20.sol";
import "./TtgGovFreezeConstants.sol";

/**
 * @title GovernanceTreasuryP4Cap
 * @notice **GOV-01** · P4 Reserve 单周期 deploy ≤ min(P4Surplus, TreasuryReserve × 30%)
 * @dev `TreasuryReserveBalance` = `reserveToken` 余额 − `earmarkedP1P3`（不含 P1～P3 已承诺预算）
 *      仅 `spender`（Timelock）可 `spendP4Reserve` · 须治理 queue→execute 路径
 */
contract GovernanceTreasuryP4Cap is GovernanceTreasury {
    IERC20 public immutable reserveToken;

    uint256 public earmarkedP1P3;
    uint256 public p4PeriodStartedAt;
    uint256 public p4SpentInPeriod;

    error P4CapExceeded();
    error InvalidReserveToken();
    error ProxyStorageAlreadyInitialized();

    event ProxyStorageInitialized(address owner, address spender);

    event EarmarkedP1P3Updated(uint256 previous, uint256 current);
    event P4PeriodRolled(uint256 indexed periodId, uint256 startedAt);
    event P4ReserveSpent(address indexed token, address indexed to, uint256 amount, uint256 spentInPeriod, uint256 cap);

    constructor(address owner_, address spender_, address reserveToken_) GovernanceTreasury(owner_, spender_) {
        if (reserveToken_ == address(0)) revert InvalidReserveToken();
        reserveToken = IERC20(reserveToken_);
        p4PeriodStartedAt = block.timestamp;
    }

    function setEarmarkedP1P3(uint256 amount) external onlyOwner {
        emit EarmarkedP1P3Updated(earmarkedP1P3, amount);
        earmarkedP1P3 = amount;
    }

    function treasuryReserveBalance() public view returns (uint256) {
        uint256 bal = reserveToken.balanceOf(address(this));
        return bal > earmarkedP1P3 ? bal - earmarkedP1P3 : 0;
    }

    /// @notice GOV-01 · deployCap = min(P4Surplus, TreasuryReserveBalance × treasury_p4_deploy_cap_bps / 10000)
    function p4DeployCap() public view returns (uint256) {
        uint256 reserve = treasuryReserveBalance();
        return (reserve * TtgGovFreezeConstants.TREASURY_P4_DEPLOY_CAP_BPS) / 10_000;
    }

    function p4RemainingInPeriod() public view returns (uint256) {
        uint256 cap = p4DeployCap();
        return p4SpentInPeriod >= cap ? 0 : cap - p4SpentInPeriod;
    }

    function _rollP4PeriodIfNeeded() internal {
        if (block.timestamp < p4PeriodStartedAt + TtgGovFreezeConstants.P4_ACCOUNTING_PERIOD_SECONDS) {
            return;
        }
        p4PeriodStartedAt = block.timestamp;
        p4SpentInPeriod = 0;
        emit P4PeriodRolled(block.timestamp / TtgGovFreezeConstants.P4_ACCOUNTING_PERIOD_SECONDS, p4PeriodStartedAt);
    }

    /// @notice P4 动用 · 受 GOV-01 cap 约束 · 仍须 Timelock `spender`
    function spendP4Reserve(address token, address to, uint256 amount) external onlySpender {
        _rollP4PeriodIfNeeded();
        uint256 cap = p4DeployCap();
        if (p4SpentInPeriod + amount > cap) revert P4CapExceeded();
        p4SpentInPeriod += amount;
        if (amount == 0) revert InvalidAmount();
        if (to == address(0)) revert InvalidRecipient();
        if (erc20SpendAllowlistEnabled && !erc20SpendAllowed[token]) revert Erc20SpendNotAllowed();
        if (!IERC20(token).transfer(to, amount)) revert TransferFailed();
        emit TreasurySpent(token, to, amount);
        emit P4ReserveSpent(token, to, amount, p4SpentInPeriod, cap);
    }

    function treasuryP4DeployCapBps() external pure returns (uint256) {
        return TtgGovFreezeConstants.TREASURY_P4_DEPLOY_CAP_BPS;
    }

    function version() external pure returns (string memory) {
        return "governance_treasury_p4_cap_v1";
    }

    /// @notice G24-P-UPGRADE-01 · Proxy delegatecall 后初始化 storage（Implementation constructor 不写入 Proxy 存储）
    function initializeProxyStorage(address owner_, address spender_) external {
        if (owner != address(0) || spender != address(0)) revert ProxyStorageAlreadyInitialized();
        if (owner_ == address(0) || spender_ == address(0)) revert InvalidRecipient();
        owner = owner_;
        spender = spender_;
        p4PeriodStartedAt = block.timestamp;
        emit ProxyStorageInitialized(owner_, spender_);
    }
}
