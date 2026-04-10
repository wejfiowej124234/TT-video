// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./IERC20.sol";

/**
 * @title CountryPoolLedgerV0
 * @notice P5-1-A：单一试点辖区 **J*** 的 **Country Pool 运营账本**（与 **B-115/B-116** 已封口域正交）。
 * @dev **credit** 仅 **owner**；**jurisdiction** 必须等于 **immutable pilotJurisdiction**。**不**承接 FeeRouter/RegionVault 自动入账。
 */
contract CountryPoolLedgerV0 {
    address public owner;

    bytes2 public immutable pilotJurisdiction;

    mapping(bytes2 => mapping(address => uint256)) private _totalCredited;

    error OnlyOwner();
    error TransferFailed();
    error InvalidJurisdiction();
    error InvalidAmount();
    error InvalidAddress();

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event CountryLedgerCredited(bytes2 indexed jurisdiction, address indexed token, uint256 amount, bytes32 ref);

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    constructor(address owner_, bytes2 pilotJurisdiction_) {
        if (owner_ == address(0)) revert InvalidAddress();
        if (uint16(pilotJurisdiction_) == 0) revert InvalidJurisdiction();
        owner = owner_;
        pilotJurisdiction = pilotJurisdiction_;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /**
     * @notice 试点入账：从 **owner**（`msg.sender`）拉取 **ERC20** 入本合约。
     * @param jurisdiction 须 **== pilotJurisdiction**（如 **DE** = `bytes2("DE")`）
     */
    function credit(bytes2 jurisdiction, IERC20 token, uint256 amount, bytes32 ref) external onlyOwner {
        if (jurisdiction != pilotJurisdiction) revert InvalidJurisdiction();
        if (address(token) == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (!token.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
        _totalCredited[jurisdiction][address(token)] += amount;
        emit CountryLedgerCredited(jurisdiction, address(token), amount, ref);
    }

    /// @notice 本合约持有 **token** 的余额（只读）
    function balance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    /// @notice 累计 **credit** 量（只读；与 `balance` 在仅入账场景下一致）
    function totalCredited(bytes2 jurisdiction, address token) external view returns (uint256) {
        return _totalCredited[jurisdiction][token];
    }

    function version() external pure returns (string memory) {
        return "country_ledger_ssot_v0";
    }
}
