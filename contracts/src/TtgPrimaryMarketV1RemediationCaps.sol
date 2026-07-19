// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./IERC20.sol";
import "./TtgGovFreezeConstants.sol";

/**
 * @title TtgPrimaryMarketV1RemediationCaps
 * @notice OWNER-TIMELOCK-REMEDIATION-BUNDLE-U-PM · Sepolia in-place upgrade impl
 * @dev Storage layout MUST match `TtgPrimaryMarketV1` through `walletPurchasedTtg`, then append-only.
 *      - U-PM-SINK: ctor `usdcTreasury_` = P4Cap
 *      - U-PM-CAPS: one-shot `remediationSetRoundCaps` (legacy 0.5/0.5/1.0M → Genesis 800k/1.2M/3M)
 *      Not a Tokenomics SSOT change. Broadcast only with Owner auth env.
 */
contract TtgPrimaryMarketV1RemediationCaps {
    IERC20 public immutable usdc;
    IERC20 public immutable ttg;
    address public immutable usdcTreasury;
    uint256 public immutable ttgPerUsdcUnit;

    uint256[3] public roundCapTtg;
    uint256[3] public roundSoldTtg;
    mapping(address => uint256) public walletPurchasedTtg;

    /// @dev Append-only · must not reorder above fields
    bool public remediationCapsDone;

    error InvalidRound();
    error BelowMinPurchase();
    error PerWalletCapExceeded();
    error RoundCapExceeded();
    error TransferFailed();
    error InvalidAddress();
    error ProxyStorageAlreadyInitialized();
    error RemediationUnauthorized();
    error RemediationAlreadyDone();
    error RemediationCapsNotLegacy();
    error RemediationCapsMismatch();

    event ProxyStorageInitialized();
    event RemediationRoundCapsSet(uint256 cap0, uint256 cap1, uint256 cap2);
    event Purchased(
        address indexed buyer,
        uint8 indexed roundIndex,
        uint256 usdcPaid,
        uint256 ttgOut,
        uint256 walletTotalTtg
    );

    uint256 internal constant LEGACY_CAP_0 = 500_000 ether;
    uint256 internal constant LEGACY_CAP_1 = 500_000 ether;
    uint256 internal constant LEGACY_CAP_2 = 1_000_000 ether;

    /// @dev ACTIVE Timelock (gov_freeze_v2_clean_baseline) · hard-gated caller for remediation
    address internal constant REMEDIATION_TIMELOCK = 0x904a6C4c6Aab698AfBF08EC6151D317c393520cC;

    constructor(address usdc_, address ttg_, address usdcTreasury_, uint256 ttgPerUsdcUnit_) {
        if (usdc_ == address(0) || ttg_ == address(0) || usdcTreasury_ == address(0)) revert InvalidAddress();
        if (ttgPerUsdcUnit_ == 0) revert InvalidAddress();
        usdc = IERC20(usdc_);
        ttg = IERC20(ttg_);
        usdcTreasury = usdcTreasury_;
        ttgPerUsdcUnit = ttgPerUsdcUnit_;
        roundCapTtg[0] = TtgGovFreezeConstants.PUBLIC_ROUND_1_CAP_TTG;
        roundCapTtg[1] = TtgGovFreezeConstants.PUBLIC_ROUND_2_CAP_TTG;
        roundCapTtg[2] = TtgGovFreezeConstants.PUBLIC_ROUND_3_CAP_TTG;
    }

    function initializeProxyStorage() external {
        if (roundCapTtg[0] != 0) revert ProxyStorageAlreadyInitialized();
        roundCapTtg[0] = TtgGovFreezeConstants.PUBLIC_ROUND_1_CAP_TTG;
        roundCapTtg[1] = TtgGovFreezeConstants.PUBLIC_ROUND_2_CAP_TTG;
        roundCapTtg[2] = TtgGovFreezeConstants.PUBLIC_ROUND_3_CAP_TTG;
        emit ProxyStorageInitialized();
    }

    /**
     * @notice One-shot · intended only via Timelock → proxy.upgradeToAndCall
     * @dev msg.sender must be Timelock (admin calling upgradeToAndCall).
     */
    function remediationSetRoundCaps(uint256 cap0, uint256 cap1, uint256 cap2) external {
        if (msg.sender != REMEDIATION_TIMELOCK) revert RemediationUnauthorized();
        if (remediationCapsDone) revert RemediationAlreadyDone();
        if (roundCapTtg[0] != LEGACY_CAP_0 || roundCapTtg[1] != LEGACY_CAP_1 || roundCapTtg[2] != LEGACY_CAP_2) {
            revert RemediationCapsNotLegacy();
        }
        if (
            cap0 != TtgGovFreezeConstants.PUBLIC_ROUND_1_CAP_TTG
                || cap1 != TtgGovFreezeConstants.PUBLIC_ROUND_2_CAP_TTG
                || cap2 != TtgGovFreezeConstants.PUBLIC_ROUND_3_CAP_TTG
        ) {
            revert RemediationCapsMismatch();
        }
        roundCapTtg[0] = cap0;
        roundCapTtg[1] = cap1;
        roundCapTtg[2] = cap2;
        remediationCapsDone = true;
        emit RemediationRoundCapsSet(cap0, cap1, cap2);
    }

    function purchase(uint8 roundIndex, uint256 usdcAmount) external {
        if (roundIndex > 2) revert InvalidRound();
        if (usdcAmount < TtgGovFreezeConstants.PUBLIC_SALE_MIN_PURCHASE_USDC) revert BelowMinPurchase();

        uint256 ttgOut = (usdcAmount * ttgPerUsdcUnit) / 1e6;
        if (ttgOut == 0) revert BelowMinPurchase();

        uint256 walletNext = walletPurchasedTtg[msg.sender] + ttgOut;
        if (walletNext > TtgGovFreezeConstants.PUBLIC_SALE_PER_WALLET_CAP_TTG) revert PerWalletCapExceeded();

        uint256 roundNext = roundSoldTtg[roundIndex] + ttgOut;
        if (roundNext > roundCapTtg[roundIndex]) revert RoundCapExceeded();

        if (!usdc.transferFrom(msg.sender, usdcTreasury, usdcAmount)) revert TransferFailed();
        if (!ttg.transfer(msg.sender, ttgOut)) revert TransferFailed();

        walletPurchasedTtg[msg.sender] = walletNext;
        roundSoldTtg[roundIndex] = roundNext;
        emit Purchased(msg.sender, roundIndex, usdcAmount, ttgOut, walletNext);
    }

    function perWalletCapTtg() external pure returns (uint256) {
        return TtgGovFreezeConstants.PUBLIC_SALE_PER_WALLET_CAP_TTG;
    }

    function minPurchaseUsdc() external pure returns (uint256) {
        return TtgGovFreezeConstants.PUBLIC_SALE_MIN_PURCHASE_USDC;
    }

    function version() external pure returns (string memory) {
        return "ttg_primary_market_v1_remediation_caps";
    }
}
