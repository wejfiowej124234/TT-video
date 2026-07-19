// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./IERC20.sol";

/**
 * @title ProjectRevenuePoolV311
 * @notice V3.1.1 Project Revenue Pool rail (55%/100% Distributable sink) · Phase A offline skeleton
 * @dev Isolation rail · funds held until DAO/ops withdraw policy. Not Timelock Bundle.
 */
contract ProjectRevenuePoolV311 {
    address public owner;
    IERC20 public immutable usdc;

    error NotOwner();
    error InvalidAddress();
    error TransferFailed();

    event OwnershipTransferred(address indexed prev, address indexed next);
    event UsdcReceived(address indexed from, uint256 amount);
    event UsdcWithdrawn(address indexed to, uint256 amount);

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

    function transferOwnership(address next) external onlyOwner {
        if (next == address(0)) revert InvalidAddress();
        emit OwnershipTransferred(owner, next);
        owner = next;
    }

    /// @notice Pull USDC from payer (Escrow/FeeRouter path) into this isolated rail
    function depositFrom(address from, uint256 amount) external {
        if (!usdc.transferFrom(from, address(this), amount)) revert TransferFailed();
        emit UsdcReceived(from, amount);
    }

    function withdraw(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert InvalidAddress();
        if (!usdc.transfer(to, amount)) revert TransferFailed();
        emit UsdcWithdrawn(to, amount);
    }

    function version() external pure returns (string memory) {
        return "v311_project_revenue_pool";
    }
}
