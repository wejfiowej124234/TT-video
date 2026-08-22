// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {ITtgV9Erc20} from "./ITtgV9Tokens.sol";
import {TtgV9DesignLockConstants} from "./TtgV9DesignLockConstants.sol";
import {TtgV9UUPSUpgradeable} from "./TtgV9UUPSUpgradeable.sol";

/**
 * @title TtgV9ProjectPoolV2
 * @notice Official Project Pool V2 — governance-configurable P4 spend cap (0–100%).
 * @dev Replaces Phase1 non-upgradeable `TtgV9ProjectPool` (Mainnet `0x7B21…` = LEGACY).
 *      - 90-day accounting window: FROZEN constant (`P4_PERIOD_SECONDS`)
 *      - `capBps` default 3000 (30%); Owner (= SoloTimelock) may `setCapBps` in [0, 10000]
 *      - Cap change does NOT reset `p4PeriodStartedAt` or `p4SpentInPeriod`
 *      - EOA/Guardian cannot set cap (only Timelock owner path)
 *      - UUPS: Timelock-only upgrade. USDC custody only under Timelock spender.
 *      Orthogonal: TTG 25T/no-mint · five-batch PM · Fee 45/55 · RoleStake · Guide Bond.
 *      Build: solc 0.8.36 + via_IR. Local Candidate — no Mainnet broadcast this wave.
 */
contract TtgV9ProjectPoolV2 is TtgV9UUPSUpgradeable {
    uint256 public constant MAX_CAP_BPS = 10_000;
    uint256 public constant DEFAULT_CAP_BPS = 3_000;

    ITtgV9Erc20 public reserveToken;

    address public owner;
    address public spender;
    uint256 public earmarkedP1P3;
    uint256 public p4PeriodStartedAt;
    uint256 public p4SpentInPeriod;
    /// @notice Live spend-cap BPS of current reserve (0 = freeze further spend; 10000 = 100%).
    uint256 public capBps;

    error OnlyOwner();
    error OnlySpender();
    error P4CapExceeded();
    error InvalidAddress();
    error InvalidAmount();
    error InvalidCapBps();
    error TransferFailed();

    event OwnershipTransferred(address indexed previous, address indexed next);
    event SpenderUpdated(address indexed previous, address indexed next);
    event EarmarkedP1P3Updated(uint256 previous, uint256 current);
    event CapBpsUpdated(uint256 previous, uint256 current);
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

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address owner_,
        address spender_,
        address reserveToken_,
        uint256 initialCapBps_
    ) external initializer {
        if (owner_ == address(0) || spender_ == address(0) || reserveToken_ == address(0)) {
            revert InvalidAddress();
        }
        if (initialCapBps_ > MAX_CAP_BPS) revert InvalidCapBps();
        owner = owner_;
        spender = spender_;
        reserveToken = ITtgV9Erc20(reserveToken_);
        capBps = initialCapBps_;
        p4PeriodStartedAt = block.timestamp;
        emit OwnershipTransferred(address(0), owner_);
        emit SpenderUpdated(address(0), spender_);
        emit CapBpsUpdated(0, initialCapBps_);
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

    /// @notice Governor→SoloTimelock→execute only. Does not roll period or clear spent.
    function setCapBps(uint256 newCapBps) external onlyOwner {
        if (newCapBps > MAX_CAP_BPS) revert InvalidCapBps();
        uint256 prev = capBps;
        capBps = newCapBps;
        emit CapBpsUpdated(prev, newCapBps);
    }

    function treasuryReserveBalance() public view returns (uint256) {
        uint256 bal = reserveToken.balanceOf(address(this));
        return bal > earmarkedP1P3 ? bal - earmarkedP1P3 : 0;
    }

    /// @notice Cap = current pre-spend reserve × capBps (no period-start snapshot).
    function p4DeployCap() public view returns (uint256) {
        return (treasuryReserveBalance() * capBps) / 10_000;
    }

    function p4RemainingInPeriod() public view returns (uint256) {
        uint256 cap = p4DeployCap();
        return p4SpentInPeriod >= cap ? 0 : cap - p4SpentInPeriod;
    }

    function periodSeconds() external pure returns (uint256) {
        return TtgV9DesignLockConstants.P4_PERIOD_SECONDS;
    }

    function _rollP4PeriodIfNeeded() internal {
        if (block.timestamp < p4PeriodStartedAt + TtgV9DesignLockConstants.P4_PERIOD_SECONDS) {
            return;
        }
        p4PeriodStartedAt = block.timestamp;
        p4SpentInPeriod = 0;
        emit P4PeriodRolled(block.timestamp / TtgV9DesignLockConstants.P4_PERIOD_SECONDS, p4PeriodStartedAt);
    }

    /// @dev P4 spend is USDC-only (`reserveToken`); arbitrary token rejected.
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

    function _authorizeUpgrade(address) internal view override onlyOwner {}

    function version() external pure returns (string memory) {
        return "ttg_v9_project_pool_v2_governance_cap";
    }
}
