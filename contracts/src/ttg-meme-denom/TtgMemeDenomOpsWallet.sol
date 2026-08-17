// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/**
 * @title TtgMemeDenomOpsWallet
 * @notice DESIGN_ONLY V8 · Team / DAO genesis holders so 15% and 35% are not collapsed onto the deployer.
 */
contract TtgMemeDenomOpsWallet {
    address public owner;

    error OnlyOwner();
    error InvalidAddress();
    error CallFailed();

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address owner_) {
        if (owner_ == address(0)) revert InvalidAddress();
        owner = owner_;
    }

    function transferOwnership(address newOwner) external {
        if (msg.sender != owner) revert OnlyOwner();
        if (newOwner == address(0)) revert InvalidAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function exec(address target, uint256 value, bytes calldata data) external returns (bytes memory ret) {
        if (msg.sender != owner) revert OnlyOwner();
        (bool ok, bytes memory out) = target.call{value: value}(data);
        if (!ok) revert CallFailed();
        return out;
    }

    receive() external payable {}
}
