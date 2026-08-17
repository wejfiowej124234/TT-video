// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "./TtgMemeDenomConstants.sol";

interface ITtgMemeDenomSaleToken {
    function transfer(address to, uint256 amount) external returns (bool);

    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/**
 * @title TtgMemeDenomPrimaryMarket
 * @notice Fusion of live `TtgPrimaryMarketV1AcquisitionPrice25Usdc` onto 25T quote.
 * @dev State machine KEEP: per-wallet cap NONE · 3 rounds · purchase ledger.
 *      Expected Difference: `ttgPerUsdcUnit` 100_000 ether · round caps × MERGE_RATIO · min 1 USDC.
 */
contract TtgMemeDenomPrimaryMarket {
    ITtgMemeDenomSaleToken public immutable usdc;
    ITtgMemeDenomSaleToken public immutable ttg;
    address public immutable usdcTreasury;
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
        if (ttgPerUsdcUnit_ != TtgMemeDenomConstants.TTG_PER_USDC_UNIT) revert InvalidAddress();
        usdc = ITtgMemeDenomSaleToken(usdc_);
        ttg = ITtgMemeDenomSaleToken(ttg_);
        usdcTreasury = usdcTreasury_;
        ttgPerUsdcUnit = ttgPerUsdcUnit_;
        roundCapTtg[0] = TtgMemeDenomConstants.PUBLIC_ROUND_1_CAP_TTG;
        roundCapTtg[1] = TtgMemeDenomConstants.PUBLIC_ROUND_2_CAP_TTG;
        roundCapTtg[2] = TtgMemeDenomConstants.PUBLIC_ROUND_3_CAP_TTG;
    }

    function initializeProxyStorage() external {
        if (roundCapTtg[0] != 0) revert ProxyStorageAlreadyInitialized();
        roundCapTtg[0] = TtgMemeDenomConstants.PUBLIC_ROUND_1_CAP_TTG;
        roundCapTtg[1] = TtgMemeDenomConstants.PUBLIC_ROUND_2_CAP_TTG;
        roundCapTtg[2] = TtgMemeDenomConstants.PUBLIC_ROUND_3_CAP_TTG;
        emit ProxyStorageInitialized();
    }

    function quoteTtg(uint256 usdcAmount) public view returns (uint256) {
        return (usdcAmount * ttgPerUsdcUnit) / 1e6;
    }

    function purchase(uint8 roundIndex, uint256 usdcAmount) external {
        if (roundIndex > 2) revert InvalidRound();
        if (usdcAmount < TtgMemeDenomConstants.PUBLIC_SALE_MIN_PURCHASE_USDC) revert BelowMinPurchase();

        uint256 ttgOut = (usdcAmount * ttgPerUsdcUnit) / 1e6;
        if (ttgOut == 0) revert BelowMinPurchase();

        uint256 walletNext = walletPurchasedTtg[msg.sender] + ttgOut;

        uint256 roundNext = roundSoldTtg[roundIndex] + ttgOut;
        if (roundNext > roundCapTtg[roundIndex]) revert RoundCapExceeded();

        if (!usdc.transferFrom(msg.sender, usdcTreasury, usdcAmount)) revert TransferFailed();
        if (!ttg.transfer(msg.sender, ttgOut)) revert TransferFailed();

        walletPurchasedTtg[msg.sender] = walletNext;
        roundSoldTtg[roundIndex] = roundNext;
        emit Purchased(msg.sender, roundIndex, usdcAmount, ttgOut, walletNext);
    }

    function perWalletCapTtg() external pure returns (uint256) {
        return TtgMemeDenomConstants.PUBLIC_SALE_PER_WALLET_CAP_TTG;
    }

    function minPurchaseUsdc() external pure returns (uint256) {
        return TtgMemeDenomConstants.PUBLIC_SALE_MIN_PURCHASE_USDC;
    }

    function version() external pure returns (string memory) {
        return "ttg_primary_25t_live_logic_fusion_v8";
    }
}
