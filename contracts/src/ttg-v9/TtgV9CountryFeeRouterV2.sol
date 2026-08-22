// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {ITtgV9Erc20} from "./ITtgV9Tokens.sol";
import {TtgV9DesignLockConstants} from "./TtgV9DesignLockConstants.sol";

/**
 * @title TtgV9CountryFeeRouterV2
 * @notice Periphery governance FeeRouter — platform fee bps + Active Steward split are Timelock-governable.
 * @dev Routes already-collected platform-fee USDC only (not order principal):
 *      - Active steward payout[j] != 0 → split by stewardShareBps/projectShareBps (sum MUST be 10000)
 *      - Else → independent branch: 100% → projectPool (NOT read from governable split)
 *      Default platformFeeBps=500; default Active split 4500/5500. No commercial caps auto-inserted.
 *      No Safe. English NatSpec only. solc 0.8.36 + via_IR.
 */
contract TtgV9CountryFeeRouterV2 {
    address public owner;
    address public projectPool;
    bool public distributePaused;

    /// @notice Escrow/Settlement reference rate (informational for integrators); Timelock may update.
    uint256 public platformFeeBps;
    /// @notice Active-steward share of the platform-fee bucket only.
    uint256 public stewardShareBps;
    /// @notice ProjectPool share of the platform-fee bucket when Active steward exists.
    uint256 public projectShareBps;

    mapping(bytes2 => address) public stewardPayout;
    mapping(address => bool) public feeRouterCaller;

    error OnlyOwner();
    error InvalidAddress();
    error InvalidAmount();
    error InvalidJurisdiction();
    error InvalidFeeBps();
    error InvalidSplitSum();
    error DistributePaused();
    error TransferFailed();
    error NotAuthorizedCaller();

    event OwnershipTransferred(address indexed previous, address indexed next);
    event ProjectPoolUpdated(address indexed previous, address indexed next);
    event DistributePausedSet(bool paused);
    event FeeRouterCallerSet(address indexed caller, bool allowed);
    event StewardPayoutSet(bytes2 indexed jurisdiction, address indexed payout);
    event PlatformFeeBpsUpdated(uint256 previous, uint256 next);
    event FeeSplitUpdated(uint256 stewardShareBps, uint256 projectShareBps);
    event PlatformFeeRouted(
        address indexed token,
        bytes2 indexed jurisdiction,
        uint256 amount,
        uint256 toSteward,
        uint256 toProjectPool,
        address steward
    );

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    constructor(address owner_, address projectPool_) {
        if (owner_ == address(0) || projectPool_ == address(0)) revert InvalidAddress();
        owner = owner_;
        projectPool = projectPool_;
        platformFeeBps = TtgV9DesignLockConstants.PLATFORM_FEE_BPS;
        stewardShareBps = TtgV9DesignLockConstants.STEWARD_SHARE_BPS;
        projectShareBps = TtgV9DesignLockConstants.PROJECT_SHARE_BPS;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setProjectPool(address pool) external onlyOwner {
        if (pool == address(0)) revert InvalidAddress();
        emit ProjectPoolUpdated(projectPool, pool);
        projectPool = pool;
    }

    function setDistributePaused(bool paused) external onlyOwner {
        distributePaused = paused;
        emit DistributePausedSet(paused);
    }

    function setFeeRouterCaller(address caller, bool allowed) external onlyOwner {
        feeRouterCaller[caller] = allowed;
        emit FeeRouterCallerSet(caller, allowed);
    }

    function setStewardPayout(bytes2 jurisdiction, address payout) external onlyOwner {
        if (uint16(jurisdiction) == 0) revert InvalidJurisdiction();
        stewardPayout[jurisdiction] = payout;
        emit StewardPayoutSet(jurisdiction, payout);
    }

    function clearStewardPayout(bytes2 jurisdiction) external onlyOwner {
        if (uint16(jurisdiction) == 0) revert InvalidJurisdiction();
        stewardPayout[jurisdiction] = address(0);
        emit StewardPayoutSet(jurisdiction, address(0));
    }

    /// @notice Governor→Timelock only. Hard bound: <= 10000. No other commercial caps.
    function setPlatformFeeBps(uint256 newBps) external onlyOwner {
        if (newBps > 10_000) revert InvalidFeeBps();
        uint256 prev = platformFeeBps;
        platformFeeBps = newBps;
        emit PlatformFeeBpsUpdated(prev, newBps);
    }

    /// @notice Governor→Timelock only. Hard bound: steward + project == 10000. No auto commercial caps.
    function setFeeSplit(uint256 stewardBps_, uint256 projectBps_) external onlyOwner {
        if (stewardBps_ + projectBps_ != 10_000) revert InvalidSplitSum();
        stewardShareBps = stewardBps_;
        projectShareBps = projectBps_;
        emit FeeSplitUpdated(stewardBps_, projectBps_);
    }

    /**
     * @notice Route platform-fee USDC already held by this contract.
     * @dev No-steward path is an independent 100%→projectPool branch (does not use split storage).
     */
    function routePlatformFee(address token, uint256 amount, bytes2 jurisdiction) external {
        if (distributePaused) revert DistributePaused();
        if (msg.sender != owner && !feeRouterCaller[msg.sender]) revert NotAuthorizedCaller();
        if (amount == 0) revert InvalidAmount();
        if (token == address(0)) revert InvalidAddress();
        if (uint16(jurisdiction) == 0) revert InvalidJurisdiction();
        if (ITtgV9Erc20(token).balanceOf(address(this)) < amount) revert InvalidAmount();

        address steward = stewardPayout[jurisdiction];
        uint256 toSteward;
        uint256 toPool;
        if (steward != address(0)) {
            // Active Steward branch — uses governable split (sum enforced at setFeeSplit).
            toSteward = (amount * stewardShareBps) / 10_000;
            toPool = amount - toSteward;
            if (!ITtgV9Erc20(token).transfer(steward, toSteward)) revert TransferFailed();
            if (!ITtgV9Erc20(token).transfer(projectPool, toPool)) revert TransferFailed();
        } else {
            // Independent fixed branch — ignore stewardShareBps/projectShareBps.
            toPool = amount;
            if (!ITtgV9Erc20(token).transfer(projectPool, toPool)) revert TransferFailed();
        }
        emit PlatformFeeRouted(token, jurisdiction, amount, toSteward, toPool, steward);
    }
}
