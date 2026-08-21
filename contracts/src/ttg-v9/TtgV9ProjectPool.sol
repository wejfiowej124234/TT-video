// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {ITtgV9Erc20} from "./ITtgV9Tokens.sol";
import {TtgV9DesignLockConstants} from "./TtgV9DesignLockConstants.sol";

/**
 * @title TtgV9ProjectPool
 * @notice NEW Official Project Pool (P4Cap-class) — Design Lock. USDC sale + fee sink.
 * @dev owner + spender = Solo Timelock. spendP4Reserve: pre-transfer reserve × 30% cap / 90d window.
 *      English NatSpec only. Old Mainnet P4Cap = LEGACY (not this contract).
 *      Build: solc 0.8.36 + via_IR. No mint of TTG · USDC custody only under Timelock spend.
 */
contract TtgV9ProjectPool {
    ITtgV9Erc20 public immutable reserveToken;

    address public owner;
    address public spender;
    uint256 public earmarkedP1P3;
    uint256 public p4PeriodStartedAt;
    uint256 public p4SpentInPeriod;

    error OnlyOwner();
    error OnlySpender();
    error P4CapExceeded();
    error InvalidAddress();
    error InvalidAmount();
    error TransferFailed();

    event OwnershipTransferred(address indexed previous, address indexed next);
    event SpenderUpdated(address indexed previous, address indexed next);
    event EarmarkedP1P3Updated(uint256 previous, uint256 current);
    event P4PeriodRolled(uint256 indexed periodId, uint256 startedAt);
    event P4ReserveSpent(address indexed token, address indexed to, uint256 amount, uint256 spentInPeriod, uint256 cap);
    event TreasurySpent(address indexed token, address indexed to, uint256 amount);

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    modifier onlySpender() {
        if (msg.sender != spender) revert OnlySpender();
        _;
    }

    constructor(address owner_, address spender_, address reserveToken_) {
        if (owner_ == address(0) || spender_ == address(0) || reserveToken_ == address(0)) {
            revert InvalidAddress();
        }
        owner = owner_;
        spender = spender_;
        reserveToken = ITtgV9Erc20(reserveToken_);
        p4PeriodStartedAt = block.timestamp;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setSpender(address newSpender) external onlyOwner {
        if (newSpender == address(0)) revert InvalidAddress();
        emit SpenderUpdated(spender, newSpender);
        spender = newSpender;
    }

    function setEarmarkedP1P3(uint256 amount) external onlyOwner {
        emit EarmarkedP1P3Updated(earmarkedP1P3, amount);
        earmarkedP1P3 = amount;
    }

    function treasuryReserveBalance() public view returns (uint256) {
        uint256 bal = reserveToken.balanceOf(address(this));
        return bal > earmarkedP1P3 ? bal - earmarkedP1P3 : 0;
    }

    /// @notice Cap = current pre-spend reserve × 30% (no period-start snapshot).
    function p4DeployCap() public view returns (uint256) {
        return (treasuryReserveBalance() * TtgV9DesignLockConstants.P4_DEPLOY_CAP_BPS) / 10_000;
    }

    function p4RemainingInPeriod() public view returns (uint256) {
        uint256 cap = p4DeployCap();
        return p4SpentInPeriod >= cap ? 0 : cap - p4SpentInPeriod;
    }

    function _rollP4PeriodIfNeeded() internal {
        if (block.timestamp < p4PeriodStartedAt + TtgV9DesignLockConstants.P4_PERIOD_SECONDS) {
            return;
        }
        p4PeriodStartedAt = block.timestamp;
        p4SpentInPeriod = 0;
        emit P4PeriodRolled(block.timestamp / TtgV9DesignLockConstants.P4_PERIOD_SECONDS, p4PeriodStartedAt);
    }

    /// @dev Design Lock DL1-M01: P4 spend is USDC-only (`reserveToken`); arbitrary token rejected.
    function spendP4Reserve(address token, address to, uint256 amount) external onlySpender {
        if (token != address(reserveToken)) revert InvalidAddress();
        _rollP4PeriodIfNeeded();
        uint256 cap = p4DeployCap();
        if (p4SpentInPeriod + amount > cap) revert P4CapExceeded();
        if (amount == 0) revert InvalidAmount();
        if (to == address(0)) revert InvalidAddress();
        p4SpentInPeriod += amount;
        if (!reserveToken.transfer(to, amount)) revert TransferFailed();
        emit TreasurySpent(token, to, amount);
        emit P4ReserveSpent(token, to, amount, p4SpentInPeriod, cap);
    }
}
