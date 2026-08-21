// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./IERC20.sol";

/**
 * @title GlobalStakersFeeVault
 * @notice Optional FeeRouter `globalStakers` sink for **Money Flow Option II** (83 Target-shaped) only.
 * @dev Not required for Option I (country+stakers → P4Cap interim). Receives FeeRouter ERC20; forward via Timelock owner.
 *      Not a personal EOA. Not RegionStewardStakePool (seat-stake TTG ≠ FeeRouter USDC legs).
 *      Snapshot/Claim remains protocol Target — this vault is interim custody if Option II is chosen.
 */
contract GlobalStakersFeeVault {
    address public owner;

    error OnlyOwner();
    error TransferFailed();
    error InvalidAmount();
    error InvalidAddress();

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event GlobalStakersFeeForwarded(address indexed token, address indexed to, uint256 amount);

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    constructor(address owner_) {
        if (owner_ == address(0)) revert InvalidAddress();
        owner = owner_;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function forward(IERC20 token, address to, uint256 amount) external onlyOwner {
        if (address(token) == address(0) || to == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (token.balanceOf(address(this)) < amount) revert InvalidAmount();
        if (!token.transfer(to, amount)) revert TransferFailed();
        emit GlobalStakersFeeForwarded(address(token), to, amount);
    }
}
