// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {ITtgV9Erc20, ITtgV9ProtocolBurnable, ITtgV9BatchMarketBurnGate} from "./ITtgV9Tokens.sol";
import {TtgV9UUPSUpgradeable} from "./TtgV9UUPSUpgradeable.sol";

/**
 * @title TtgPublicSaleVault
 * @notice Holds unsold public-sale TTG inventory for the V9 batch primary market.
 * @dev UUPS · Timelock admin. Protocol burn: executeGovernanceBurn after Governor PASS (executor only).
 *      Reverts if any batch is open or armed-unclosed. No dead-address fallback. English NatSpec only.
 */
contract TtgPublicSaleVault is TtgV9UUPSUpgradeable {
    ITtgV9Erc20 public ttg;
    address public admin;
    address public market;

    uint256[45] private __gap;

    error InvalidAddress();
    error OnlyAdmin();
    error OnlyMarket();
    error InsufficientInventory();
    error TransferFailed();
    error CannotRescueTtg();
    error BurnFailed();
    error InvalidAmount();
    error BurnWhileBatchActiveOrArmed();
    error MarketNotBound();

    event AdminUpdated(address indexed previousAdmin, address indexed newAdmin);
    event MarketBound(address indexed previousMarket, address indexed newMarket);
    event InventoryPulled(address indexed market, uint256 amount, uint256 vaultRemaining);
    event InventoryReturned(address indexed market, uint256 amount, uint256 vaultRemaining);
    event ForeignTokenRescued(address indexed token, address indexed to, uint256 amount);
    event GovernanceBurnExecuted(uint256 amount, uint256 vaultRemaining, address indexed executor);

    modifier onlyAdmin() {
        if (msg.sender != admin) revert OnlyAdmin();
        _;
    }

    modifier onlyMarket() {
        if (msg.sender != market) revert OnlyMarket();
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address ttg_, address admin_) external initializer {
        if (ttg_ == address(0) || admin_ == address(0)) revert InvalidAddress();
        ttg = ITtgV9Erc20(ttg_);
        admin = admin_;
        emit AdminUpdated(address(0), admin_);
    }

    function setAdmin(address newAdmin) external onlyAdmin {
        if (newAdmin == address(0)) revert InvalidAddress();
        emit AdminUpdated(admin, newAdmin);
        admin = newAdmin;
    }

    function bindMarket(address market_) external onlyAdmin {
        if (market_ == address(0)) revert InvalidAddress();
        emit MarketBound(market, market_);
        market = market_;
    }

    function inventory() public view returns (uint256) {
        return ttg.balanceOf(address(this));
    }

    function pull(uint256 amount) external onlyMarket {
        if (amount == 0) revert InsufficientInventory();
        uint256 bal = inventory();
        if (amount > bal) revert InsufficientInventory();
        if (!ttg.transfer(market, amount)) revert TransferFailed();
        emit InventoryPulled(market, amount, inventory());
    }

    function returnInventory(uint256 amount) external onlyMarket {
        if (amount == 0) return;
        if (!ttg.transferFrom(market, address(this), amount)) revert TransferFailed();
        emit InventoryReturned(market, amount, inventory());
    }

    function rescueForeignERC20(address token, address to, uint256 amount) external onlyAdmin {
        if (token == address(0) || to == address(0)) revert InvalidAddress();
        if (token == address(ttg)) revert CannotRescueTtg();
        if (!ITtgV9Erc20(token).transfer(to, amount)) revert TransferFailed();
        emit ForeignTokenRescued(token, to, amount);
    }

    /**
     * @notice Governance execution surface: destroy vault-held TTG (true protocolBurn).
     * @dev Caller = Timelock after Governor PASS → queue → delay. No in-window / armed-batch burn.
     */
    function executeGovernanceBurn(uint256 amount) external onlyAdmin {
        if (amount == 0) revert InvalidAmount();
        if (market == address(0)) revert MarketNotBound();
        if (ITtgV9BatchMarketBurnGate(market).hasOpenOrArmedUnclosedBatch()) {
            revert BurnWhileBatchActiveOrArmed();
        }
        uint256 bal = inventory();
        if (amount > bal) revert InsufficientInventory();
        ITtgV9ProtocolBurnable(address(ttg)).protocolBurn(amount);
        emit GovernanceBurnExecuted(amount, inventory(), msg.sender);
    }

    function _authorizeUpgrade(address) internal view override onlyAdmin {}

    function version() external pure virtual returns (string memory) {
        return "ttg_public_sale_vault_v9_uups";
    }
}
