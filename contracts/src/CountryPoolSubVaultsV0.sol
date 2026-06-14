// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * @title CountryPoolSubVaultsV0
 * @notice P2 · R2 子账地址登记（fund-flow-ssot §2 Target）。
 * @dev 本合约 **不** 托管资产；仅登记 Reserve / Operations / Claim / Redemption 四地址 per jurisdiction。
 */
contract CountryPoolSubVaultsV0 {
    struct SubVaultSet {
        address reserve;
        address operations;
        address claim;
        address redemption;
    }

    address public owner;
    mapping(bytes2 => SubVaultSet) public vaults;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event SubVaultsConfigured(
        bytes2 indexed jurisdiction,
        address reserve,
        address operations,
        address claim,
        address redemption
    );

    error OnlyOwner();
    error InvalidJurisdiction();
    error InvalidAddress();

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

    function configureSubVaults(
        bytes2 jurisdiction,
        address reserve,
        address operations,
        address claim,
        address redemption
    ) external onlyOwner {
        if (uint16(jurisdiction) == 0) revert InvalidJurisdiction();
        vaults[jurisdiction] = SubVaultSet({
            reserve: reserve,
            operations: operations,
            claim: claim,
            redemption: redemption
        });
        emit SubVaultsConfigured(jurisdiction, reserve, operations, claim, redemption);
    }

    function version() external pure returns (string memory) {
        return "country_pool_sub_vaults_v0";
    }
}
