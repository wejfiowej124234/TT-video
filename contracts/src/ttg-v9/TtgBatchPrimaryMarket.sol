// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {TtgV9Constants} from "./TtgV9Constants.sol";
import {ITtgV9Erc20} from "./ITtgV9Tokens.sol";
import {TtgPublicSaleVault} from "./TtgPublicSaleVault.sol";
import {TtgV9UUPSUpgradeable} from "./TtgV9UUPSUpgradeable.sol";

/**
 * @title TtgBatchPrimaryMarket
 * @notice V9 five-batch public sale: absolute amountCaps, micro-USDC prices, current-batch-only.
 * @dev UUPS under Timelock-only upgrade. Pricing: ttgOut = usdcAmount * 1e18 / usdcRawPerWholeTtg (floor).
 *      Batch close ALWAYS returns unsold to PublicSaleVault. No closeBatchBurn.
 *      Protocol inventory burn is GOVERNANCE_ONLY (Governor → Timelock execute → Vault.burnProtocolInventory).
 *      `setUsdcTreasury` is Timelock-only (Governor→SoloTimelock 48h on Mainnet) — no new storage slots.
 *      English NatSpec only. solc >= 0.8.36.
 */
contract TtgBatchPrimaryMarket is TtgV9UUPSUpgradeable {
    struct Batch {
        uint64 start;
        uint64 end;
        uint256 amountCap;
        uint32 usdcRawPerWholeTtg;
        uint256 sold;
        uint256 allocated;
        bool armed;
        bool closed;
        bool frozen;
    }

    ITtgV9Erc20 public usdc;
    ITtgV9Erc20 public ttg;
    address public usdcTreasury;
    TtgPublicSaleVault public vault;

    address public timelock;
    address public guardian;
    bool public paused;

    mapping(uint256 => Batch) public batches;
    mapping(address => uint256) public walletPurchasedTtg;
    uint256 public seededBatchCount;

    /// @dev Storage gap for future PM layout (upgrade compatibility).
    uint256[40] private __gap;

    error InvalidAddress();
    error OnlyTimelock();
    error OnlyGuardianOrTimelock();
    error Paused();
    error NotPaused();
    error InvalidBatch();
    error BatchNotSeeded();
    error BatchAlreadyArmed();
    error BatchAlreadyClosed();
    error BatchNotOpen();
    error NotCurrentBatch();
    error BelowMinPurchase();
    error CapExceeded();
    error NotArmed();
    error TooEarlyToClose();
    error TransferFailed();
    error AlreadySeeded();
    error BatchFrozenOrOpen();
    error CannotRescueTtg();

    event TimelockUpdated(address indexed previous, address indexed next);
    event GuardianUpdated(address indexed previous, address indexed next);
    event UsdcTreasuryUpdated(address indexed previous, address indexed next);
    event PausedSet(bool paused);
    event BatchesSeededFromNorm(uint256 count);
    event BatchArmed(uint256 indexed batchId, uint256 allocated);
    event BatchParamsUpdated(
        uint256 indexed batchId, uint64 start, uint64 end, uint256 amountCap, uint32 usdcRawPerWholeTtg
    );
    event Purchased(
        address indexed buyer, uint256 indexed batchId, uint256 usdcPaid, uint256 ttgOut, uint256 walletTotalTtg
    );
    event BatchClosedReturn(uint256 indexed batchId, uint256 unsoldReturned, address closer);
    event BatchCancelledUnarmed(uint256 indexed batchId, address closer);
    event ForeignTokenRescued(address indexed token, address indexed to, uint256 amount);

    modifier onlyTimelock() {
        if (msg.sender != timelock) revert OnlyTimelock();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert Paused();
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address usdc_,
        address ttg_,
        address usdcTreasury_,
        address vault_,
        address timelock_,
        address guardian_
    ) external initializer {
        if (
            usdc_ == address(0) || ttg_ == address(0) || usdcTreasury_ == address(0) || vault_ == address(0)
                || timelock_ == address(0) || guardian_ == address(0)
        ) revert InvalidAddress();
        usdc = ITtgV9Erc20(usdc_);
        ttg = ITtgV9Erc20(ttg_);
        usdcTreasury = usdcTreasury_;
        vault = TtgPublicSaleVault(vault_);
        timelock = timelock_;
        guardian = guardian_;
        emit TimelockUpdated(address(0), timelock_);
        emit GuardianUpdated(address(0), guardian_);
    }

    function setTimelock(address next) external onlyTimelock {
        if (next == address(0)) revert InvalidAddress();
        emit TimelockUpdated(timelock, next);
        timelock = next;
    }

    function setGuardian(address next) external onlyTimelock {
        if (next == address(0)) revert InvalidAddress();
        emit GuardianUpdated(guardian, next);
        guardian = next;
    }

    /// @notice Governor→SoloTimelock→execute only. Retargets public-sale USDC sink; no other state change.
    function setUsdcTreasury(address next) external onlyTimelock {
        if (next == address(0)) revert InvalidAddress();
        emit UsdcTreasuryUpdated(usdcTreasury, next);
        usdcTreasury = next;
    }

    function pause() external {
        if (msg.sender != guardian && msg.sender != timelock) revert OnlyGuardianOrTimelock();
        paused = true;
        emit PausedSet(true);
    }

    function unpause() external onlyTimelock {
        if (!paused) revert NotPaused();
        paused = false;
        emit PausedSet(false);
    }

    function seedBatchesFromNorm() external onlyTimelock {
        if (seededBatchCount != 0) revert AlreadySeeded();
        for (uint256 id = 1; id <= TtgV9Constants.BATCH_COUNT; id++) {
            uint256 start = TtgV9Constants.batchStartTimestamp(id);
            uint256 end = id < TtgV9Constants.BATCH_COUNT
                ? TtgV9Constants.batchStartTimestamp(id + 1)
                : start + TtgV9Constants.BATCH5_DURATION_SECONDS;
            batches[id] = Batch({
                start: uint64(start),
                end: uint64(end),
                amountCap: TtgV9Constants.batchAmountCapWei(id),
                usdcRawPerWholeTtg: uint32(TtgV9Constants.usdcRawPerWholeTtg(id)),
                sold: 0,
                allocated: 0,
                armed: false,
                closed: false,
                frozen: false
            });
        }
        seededBatchCount = TtgV9Constants.BATCH_COUNT;
        emit BatchesSeededFromNorm(TtgV9Constants.BATCH_COUNT);
    }

    /// @notice Sepolia/local rehearsal only: same absolute caps/prices, custom short windows.
    function seedBatchesRehearsal(uint64 firstStart, uint64 windowSeconds) external onlyTimelock {
        if (seededBatchCount != 0) revert AlreadySeeded();
        if (windowSeconds < 30) revert InvalidBatch();
        for (uint256 id = 1; id <= TtgV9Constants.BATCH_COUNT; id++) {
            uint64 start = firstStart + uint64(uint256(id - 1) * uint256(windowSeconds));
            uint64 end = start + windowSeconds;
            batches[id] = Batch({
                start: start,
                end: end,
                amountCap: TtgV9Constants.batchAmountCapWei(id),
                usdcRawPerWholeTtg: uint32(TtgV9Constants.usdcRawPerWholeTtg(id)),
                sold: 0,
                allocated: 0,
                armed: false,
                closed: false,
                frozen: false
            });
        }
        seededBatchCount = TtgV9Constants.BATCH_COUNT;
        emit BatchesSeededFromNorm(TtgV9Constants.BATCH_COUNT);
    }

    /// @notice Timelock may edit unopened batches (not armed/frozen/closed, before start).
    function setUnopenedBatchParams(
        uint256 batchId,
        uint64 start,
        uint64 end,
        uint256 amountCap,
        uint32 usdcRawPerWholeTtg_
    ) external onlyTimelock {
        Batch storage b = batches[batchId];
        if (batchId == 0 || batchId > seededBatchCount) revert InvalidBatch();
        if (b.armed || b.frozen || b.closed) revert BatchFrozenOrOpen();
        if (block.timestamp >= b.start) revert BatchFrozenOrOpen();
        if (end <= start || amountCap == 0 || usdcRawPerWholeTtg_ == 0) revert InvalidBatch();
        b.start = start;
        b.end = end;
        b.amountCap = amountCap;
        b.usdcRawPerWholeTtg = usdcRawPerWholeTtg_;
        emit BatchParamsUpdated(batchId, start, end, amountCap, usdcRawPerWholeTtg_);
    }

    function currentBatchId(uint256 nowTs) public view returns (uint256) {
        if (seededBatchCount == 0) return 0;
        for (uint256 id = 1; id <= seededBatchCount; id++) {
            Batch storage b = batches[id];
            if (nowTs >= b.start && nowTs < b.end && !b.closed) return id;
        }
        return 0;
    }

    /// @notice True if market still holds armed batch inventory (blocks governance burn until RETURN).
    function hasOpenOrArmedUnclosedBatch() external view returns (bool) {
        for (uint256 id = 1; id <= seededBatchCount; id++) {
            Batch storage b = batches[id];
            if (b.armed && !b.closed) return true;
        }
        return false;
    }

    function quoteTtg(uint256 batchId, uint256 usdcAmount) public view returns (uint256) {
        Batch storage b = batches[batchId];
        if (b.amountCap == 0 || b.usdcRawPerWholeTtg == 0) revert InvalidBatch();
        return (usdcAmount * 1 ether) / uint256(b.usdcRawPerWholeTtg);
    }

    function armBatch(uint256 batchId) external whenNotPaused {
        Batch storage b = batches[batchId];
        if (b.amountCap == 0) revert BatchNotSeeded();
        if (b.closed) revert BatchAlreadyClosed();
        if (b.armed) revert BatchAlreadyArmed();
        if (block.timestamp < b.start) revert BatchNotOpen();
        uint256 need = uint256(b.amountCap) - uint256(b.sold);
        b.armed = true;
        b.frozen = true;
        b.allocated = need;
        vault.pull(need);
        emit BatchArmed(batchId, need);
    }

    function buy(uint256 batchId, uint256 usdcAmount) external whenNotPaused {
        Batch storage b = batches[batchId];
        if (b.amountCap == 0) revert BatchNotSeeded();
        if (b.closed) revert BatchAlreadyClosed();
        if (block.timestamp < b.start || block.timestamp >= b.end) revert BatchNotOpen();
        if (currentBatchId(block.timestamp) != batchId) revert NotCurrentBatch();
        if (usdcAmount < TtgV9Constants.PUBLIC_SALE_MIN_PURCHASE_USDC) revert BelowMinPurchase();

        if (!b.armed) {
            uint256 need = uint256(b.amountCap) - uint256(b.sold);
            b.armed = true;
            b.frozen = true;
            b.allocated = need;
            vault.pull(need);
            emit BatchArmed(batchId, need);
        } else {
            b.frozen = true;
        }

        uint256 ttgOut = quoteTtg(batchId, usdcAmount);
        if (ttgOut == 0) revert BelowMinPurchase();
        uint256 soldNext = uint256(b.sold) + ttgOut;
        if (soldNext > uint256(b.amountCap)) revert CapExceeded();

        // Effects before interactions (CEI) — USDC/TTG have no callbacks on Official path, still harden.
        b.sold = soldNext;
        walletPurchasedTtg[msg.sender] += ttgOut;

        if (!usdc.transferFrom(msg.sender, usdcTreasury, usdcAmount)) revert TransferFailed();
        if (!ttg.transfer(msg.sender, ttgOut)) revert TransferFailed();

        emit Purchased(msg.sender, batchId, usdcAmount, ttgOut, walletPurchasedTtg[msg.sender]);
    }

    /// @notice After batch end: RETURN unsold to Vault, or CANCELLED if never armed.
    /// @dev Allowed while paused so Guardian pause cannot permanently trap unsold inventory.
    function closeBatchReturn(uint256 batchId) external {
        Batch storage b = batches[batchId];
        if (b.amountCap == 0) revert BatchNotSeeded();
        if (b.closed) revert BatchAlreadyClosed();
        if (block.timestamp < b.end) revert TooEarlyToClose();

        if (!b.armed && b.sold == 0) {
            b.closed = true;
            b.frozen = true;
            emit BatchCancelledUnarmed(batchId, msg.sender);
            return;
        }
        if (!b.armed) revert NotArmed();

        uint256 unsold = uint256(b.allocated) > uint256(b.sold) ? uint256(b.allocated) - uint256(b.sold) : 0;
        b.closed = true;
        b.frozen = true;

        if (unsold > 0) {
            if (!ttg.approve(address(vault), unsold)) revert TransferFailed();
            vault.returnInventory(unsold);
        }
        emit BatchClosedReturn(batchId, unsold, msg.sender);
    }

    /// @notice Timelock may rescue non-TTG tokens only — TTG inventory uses RETURN or governance burn.
    function rescueForeignERC20(address token, address to, uint256 amount) external onlyTimelock {
        if (token == address(0) || to == address(0)) revert InvalidAddress();
        if (token == address(ttg)) revert CannotRescueTtg();
        if (!ITtgV9Erc20(token).transfer(to, amount)) revert TransferFailed();
        emit ForeignTokenRescued(token, to, amount);
    }

    function minPurchaseUsdc() external pure returns (uint256) {
        return TtgV9Constants.PUBLIC_SALE_MIN_PURCHASE_USDC;
    }

    function _authorizeUpgrade(address) internal view override onlyTimelock {}

    function version() external pure virtual returns (string memory) {
        return "ttg_batch_primary_market_v9_uups_treasury_governed";
    }
}
