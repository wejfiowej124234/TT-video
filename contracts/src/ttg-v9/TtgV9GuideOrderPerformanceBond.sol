// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {ITtgV9Erc20} from "./ITtgV9Tokens.sol";
import {TtgV9UUPSUpgradeable} from "./TtgV9UUPSUpgradeable.sol";
import {ITtgV9GuideOrderBondLifecycle} from "./ITtgV9GuideOrderBondLifecycle.sol";

/**
 * @title TtgV9GuideOrderPerformanceBond
 * @notice Guide per-order USDC Performance Bond — NEW_ORDER_BOND_MODULE (Design Lock).
 * @dev One bond per `orderId`. Lock after dual confirm / before fulfill (via lifecycle adapter).
 *      Completed/Cancelled → full refund to original guide only.
 *      Slash only by slashOperator whitelist (Escrow/Dispute/SlashRouter/Timelock paths).
 *      Orthogonal: Escrow principal · TTG RoleStake · Steward Seat · Access Fee · FeeRouter.
 *      Merchant NOT supported. UUPS · Timelock owner. English NatSpec only.
 *      Build: solc 0.8.36 + via_IR. Local Candidate — no Phase1 mutate · no Mainnet broadcast.
 */
contract TtgV9GuideOrderPerformanceBond is TtgV9UUPSUpgradeable {
    enum Status {
        None,
        Locked,
        Disputed,
        Completed,
        Cancelled,
        Closed
    }

    struct Bond {
        address guide;
        uint128 amount;
        uint128 slashed;
        Status status;
        uint64 lockedAt;
    }

    ITtgV9Erc20 public usdc;
    address public owner;
    ITtgV9GuideOrderBondLifecycle public lifecycle;
    address public slashTreasury;
    bool public paused;

    mapping(bytes32 => Bond) public bonds;
    mapping(address => bool) public slashOperator;
    mapping(address => bool) public lifecycleCaller;

    uint256 private _entered;

    error OnlyOwner();
    error OnlyLifecycle();
    error OnlySlashOperator();
    error InvalidAddress();
    error InvalidAmount();
    error InvalidOrderId();
    error Paused();
    error BondExists();
    error BondMissing();
    error BadStatus();
    error LockNotAllowed();
    error SlashExceedsRemaining();
    error NothingToRefund();
    error TransferFailed();
    error CannotRescueUsdc();
    error Reentrancy();
    error ZeroSlashTreasury();

    event OwnershipTransferred(address indexed previous, address indexed next);
    event LifecycleSet(address indexed lifecycle);
    event LifecycleCallerSet(address indexed caller, bool allowed);
    event SlashOperatorSet(address indexed operator, bool allowed);
    event SlashTreasurySet(address indexed treasury);
    event PausedSet(bool paused);
    event BondLocked(bytes32 indexed orderId, address indexed guide, uint256 amount);
    event BondDisputed(bytes32 indexed orderId);
    event BondCompleted(bytes32 indexed orderId, address indexed guide, uint256 refunded);
    event BondCancelled(bytes32 indexed orderId, address indexed guide, uint256 refunded);
    event BondSlashed(bytes32 indexed orderId, address indexed operator, uint256 amount, uint256 remaining);
    event BondSettledAfterDispute(bytes32 indexed orderId, address indexed guide, uint256 refunded, uint256 totalSlashed);
    event NonUsdcRescued(address indexed token, address indexed to, uint256 amount);

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    modifier onlyLifecycle() {
        if (msg.sender != address(lifecycle) && !lifecycleCaller[msg.sender]) revert OnlyLifecycle();
        _;
    }

    modifier onlySlashOperator() {
        if (!slashOperator[msg.sender] && msg.sender != owner) revert OnlySlashOperator();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert Paused();
        _;
    }

    modifier nonReentrant() {
        if (_entered != 0) revert Reentrancy();
        _entered = 1;
        _;
        _entered = 0;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address owner_,
        address usdc_,
        address lifecycle_,
        address slashTreasury_
    ) external initializer {
        if (owner_ == address(0) || usdc_ == address(0) || slashTreasury_ == address(0)) {
            revert InvalidAddress();
        }
        owner = owner_;
        usdc = ITtgV9Erc20(usdc_);
        slashTreasury = slashTreasury_;
        if (lifecycle_ != address(0)) {
            lifecycle = ITtgV9GuideOrderBondLifecycle(lifecycle_);
            lifecycleCaller[lifecycle_] = true;
        }
        // Owner (Timelock) is always a slash operator for Governor→Timelock path.
        slashOperator[owner_] = true;
        emit OwnershipTransferred(address(0), owner_);
        emit SlashTreasurySet(slashTreasury_);
        emit SlashOperatorSet(owner_, true);
        if (lifecycle_ != address(0)) {
            emit LifecycleSet(lifecycle_);
            emit LifecycleCallerSet(lifecycle_, true);
        }
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        address prev = owner;
        owner = newOwner;
        slashOperator[prev] = false;
        slashOperator[newOwner] = true;
        emit OwnershipTransferred(prev, newOwner);
        emit SlashOperatorSet(prev, false);
        emit SlashOperatorSet(newOwner, true);
    }

    function setLifecycle(address lifecycle_) external onlyOwner {
        lifecycle = ITtgV9GuideOrderBondLifecycle(lifecycle_);
        emit LifecycleSet(lifecycle_);
    }

    function setLifecycleCaller(address caller, bool allowed) external onlyOwner {
        if (caller == address(0)) revert InvalidAddress();
        lifecycleCaller[caller] = allowed;
        emit LifecycleCallerSet(caller, allowed);
    }

    function setSlashOperator(address operator, bool allowed) external onlyOwner {
        if (operator == address(0)) revert InvalidAddress();
        slashOperator[operator] = allowed;
        emit SlashOperatorSet(operator, allowed);
    }

    function setSlashTreasury(address treasury) external onlyOwner {
        if (treasury == address(0)) revert ZeroSlashTreasury();
        slashTreasury = treasury;
        emit SlashTreasurySet(treasury);
    }

    function setPaused(bool paused_) external onlyOwner {
        paused = paused_;
        emit PausedSet(paused_);
    }

    /// @notice Guide locks USDC for `orderId` after dual confirm / before fulfill.
    function lockBond(bytes32 orderId, uint256 amount) external nonReentrant whenNotPaused {
        if (orderId == bytes32(0)) revert InvalidOrderId();
        if (amount == 0 || amount > type(uint128).max) revert InvalidAmount();
        Bond storage b = bonds[orderId];
        if (b.status != Status.None) revert BondExists();
        if (address(lifecycle) == address(0) || !lifecycle.canLockBond(orderId, msg.sender)) {
            revert LockNotAllowed();
        }
        if (!usdc.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
        b.guide = msg.sender;
        b.amount = uint128(amount);
        b.slashed = 0;
        b.status = Status.Locked;
        b.lockedAt = uint64(block.timestamp);
        emit BondLocked(orderId, msg.sender, amount);
    }

    /// @notice Lifecycle opens dispute — blocks complete/cancel refund until settle.
    function markDisputed(bytes32 orderId) external onlyLifecycle {
        Bond storage b = bonds[orderId];
        if (b.status != Status.Locked) revert BadStatus();
        b.status = Status.Disputed;
        emit BondDisputed(orderId);
    }

    /// @notice Normal completion — full remaining bond to original guide.
    function completeAndRefund(bytes32 orderId) external nonReentrant onlyLifecycle {
        Bond storage b = bonds[orderId];
        if (b.status != Status.Locked) revert BadStatus();
        uint256 refund = uint256(b.amount) - uint256(b.slashed);
        if (refund == 0) revert NothingToRefund();
        address guide = b.guide;
        b.status = Status.Completed;
        if (!usdc.transfer(guide, refund)) revert TransferFailed();
        emit BondCompleted(orderId, guide, refund);
    }

    /// @notice Order cancelled before fulfill — full remaining to original guide.
    function cancelAndRefund(bytes32 orderId) external nonReentrant onlyLifecycle {
        Bond storage b = bonds[orderId];
        if (b.status != Status.Locked) revert BadStatus();
        uint256 refund = uint256(b.amount) - uint256(b.slashed);
        address guide = b.guide;
        b.status = Status.Cancelled;
        if (refund > 0) {
            if (!usdc.transfer(guide, refund)) revert TransferFailed();
        }
        emit BondCancelled(orderId, guide, refund);
    }

    /// @notice Partial or full slash — only slashOperator / Timelock owner. Not Admin EOA unless Timelock.
    function slash(bytes32 orderId, uint256 amount) external nonReentrant onlySlashOperator {
        if (amount == 0) revert InvalidAmount();
        Bond storage b = bonds[orderId];
        if (b.status != Status.Locked && b.status != Status.Disputed) revert BadStatus();
        uint256 remaining = uint256(b.amount) - uint256(b.slashed);
        if (amount > remaining) revert SlashExceedsRemaining();
        b.slashed = uint128(uint256(b.slashed) + amount);
        remaining -= amount;
        if (!usdc.transfer(slashTreasury, amount)) revert TransferFailed();
        emit BondSlashed(orderId, msg.sender, amount, remaining);
        if (remaining == 0 && b.status == Status.Disputed) {
            b.status = Status.Closed;
        }
    }

    /// @notice After dispute resolution — refund any unsashed remainder to original guide.
    function settleAfterDispute(bytes32 orderId) external nonReentrant onlyLifecycle {
        Bond storage b = bonds[orderId];
        if (b.status != Status.Disputed && b.status != Status.Closed) revert BadStatus();
        if (b.status == Status.Closed) {
            // Fully slashed already — idempotent settle.
            emit BondSettledAfterDispute(orderId, b.guide, 0, b.slashed);
            return;
        }
        uint256 refund = uint256(b.amount) - uint256(b.slashed);
        address guide = b.guide;
        uint256 totalSlashed = b.slashed;
        b.status = Status.Closed;
        if (refund > 0) {
            if (!usdc.transfer(guide, refund)) revert TransferFailed();
        }
        emit BondSettledAfterDispute(orderId, guide, refund, totalSlashed);
    }

    function remainingBond(bytes32 orderId) external view returns (uint256) {
        Bond storage b = bonds[orderId];
        if (b.status == Status.None) return 0;
        return uint256(b.amount) - uint256(b.slashed);
    }

    /// @notice Rescue non-USDC tokens only (fat-finger / airdrop). Never rescues USDC bond asset.
    function rescueERC20(address token, address to, uint256 amount) external onlyOwner nonReentrant {
        if (token == address(usdc)) revert CannotRescueUsdc();
        if (to == address(0) || token == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (!ITtgV9Erc20(token).transfer(to, amount)) revert TransferFailed();
        emit NonUsdcRescued(token, to, amount);
    }

    function _authorizeUpgrade(address) internal view override onlyOwner {}

    function version() external pure returns (string memory) {
        return "ttg_v9_guide_order_performance_bond_v1";
    }
}
