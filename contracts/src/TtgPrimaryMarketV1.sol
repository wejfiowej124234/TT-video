// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./IERC20.sol";
import "./TtgGovFreezeConstants.sol";

/**
 * @title TtgPrimaryMarketV1
 * @notice **GOV-04** · 公众三轮 USDC→TTG · 单钱包 cap · 轮次硬顶
 * @dev 定价：`ttgPerUsdcUnit` = 每 1 USDC 最小单位可兑 TTG wei（部署时冻结 · 修订须 GOV-02）
 */
contract TtgPrimaryMarketV1 {
    IERC20 public immutable usdc;
    IERC20 public immutable ttg;
    address public immutable usdcTreasury;

    /// @dev 1 USDC (1e6) → ttgPerUsdcUnit TTG wei
    uint256 public immutable ttgPerUsdcUnit;

    uint256[3] public roundCapTtg;
    uint256[3] public roundSoldTtg;
    mapping(address => uint256) public walletPurchasedTtg;

    error InvalidRound();
    error BelowMinPurchase();
    error PerWalletCapExceeded();
    error RoundCapExceeded();
    error TransferFailed();
    error InvalidAddress();
    error ProxyStorageAlreadyInitialized();

    event ProxyStorageInitialized();

    event Purchased(
        address indexed buyer,
        uint8 indexed roundIndex,
        uint256 usdcPaid,
        uint256 ttgOut,
        uint256 walletTotalTtg
    );

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

    /// @notice G24-P-UPGRADE-01 · Proxy delegatecall 后初始化轮次 cap（Implementation constructor 不写入 Proxy 存储）
    function initializeProxyStorage() external {
        if (roundCapTtg[0] != 0) revert ProxyStorageAlreadyInitialized();
        roundCapTtg[0] = TtgGovFreezeConstants.PUBLIC_ROUND_1_CAP_TTG;
        roundCapTtg[1] = TtgGovFreezeConstants.PUBLIC_ROUND_2_CAP_TTG;
        roundCapTtg[2] = TtgGovFreezeConstants.PUBLIC_ROUND_3_CAP_TTG;
        emit ProxyStorageInitialized();
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
        return "ttg_primary_market_v1";
    }
}
