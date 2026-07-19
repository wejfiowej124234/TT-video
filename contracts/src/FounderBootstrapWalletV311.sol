// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./IERC20.sol";
import "./V311EconomicConstants.sol";

/**
 * @title FounderBootstrapWalletV311
 * @notice V3.1.1 Founder Bootstrap rail · Platform Access Fee 300k USDC entry
 * @dev Collects Access Fee; refund-on-audit-fail is orchestrated off-chain/backend (BE-03/S-02).
 */
contract FounderBootstrapWalletV311 {
    address public owner;
    IERC20 public immutable usdc;

    error NotOwner();
    error InvalidAddress();
    error TransferFailed();
    error InvalidAmount();

    event OwnershipTransferred(address indexed prev, address indexed next);
    event AccessFeeReceived(address indexed payer, uint256 amount);
    event AccessFeeRefunded(address indexed to, uint256 amount);

    constructor(address usdc_, address owner_) {
        if (usdc_ == address(0) || owner_ == address(0)) revert InvalidAddress();
        usdc = IERC20(usdc_);
        owner = owner_;
        emit OwnershipTransferred(address(0), owner_);
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    function accessFeeAmountUsdc() external pure returns (uint256) {
        return V311EconomicConstants.PLATFORM_ACCESS_FEE_USDC;
    }

    function transferOwnership(address next) external onlyOwner {
        if (next == address(0)) revert InvalidAddress();
        emit OwnershipTransferred(owner, next);
        owner = next;
    }

    function collectAccessFee(address payer, uint256 amount) external {
        if (amount != V311EconomicConstants.PLATFORM_ACCESS_FEE_USDC) revert InvalidAmount();
        if (!usdc.transferFrom(payer, address(this), amount)) revert TransferFailed();
        emit AccessFeeReceived(payer, amount);
    }

    /// @notice Audit-fail 100% refund path (caller = owner/ops; policy enforced off-chain)
    function refundAccessFee(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert InvalidAddress();
        if (!usdc.transfer(to, amount)) revert TransferFailed();
        emit AccessFeeRefunded(to, amount);
    }

    function version() external pure returns (string memory) {
        return "v311_founder_bootstrap_wallet";
    }
}
