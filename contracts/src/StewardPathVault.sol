// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./IERC20.sol";

/**
 * @title StewardPathVault
 * @notice D-4555-B · 45% eligible leg receiver (per jurisdiction).
 * @dev Only the wired `CountryPoolNetProfitLedger` may deposit. Owner = Timelock (future sweep hooks).
 */
contract StewardPathVault {
    bytes2 public immutable jurisdiction;
    IERC20 public immutable token;
    address public immutable ledger;

    address public owner;

    uint256 public totalReceived;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event StewardPathDeposit(bytes2 indexed jurisdiction, address indexed token, uint256 amount, uint256 epochId);

    error OnlyOwner();
    error OnlyLedger();
    error InvalidAddress();
    error TransferFailed();

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    constructor(address owner_, bytes2 jurisdiction_, address token_, address ledger_) {
        if (owner_ == address(0) || token_ == address(0) || ledger_ == address(0)) revert InvalidAddress();
        if (uint16(jurisdiction_) == 0) revert InvalidAddress();
        owner = owner_;
        jurisdiction = jurisdiction_;
        token = IERC20(token_);
        ledger = ledger_;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function depositFromLedger(uint256 amount, uint256 epochId) external {
        if (msg.sender != ledger) revert OnlyLedger();
        if (!token.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
        totalReceived += amount;
        emit StewardPathDeposit(jurisdiction, address(token), amount, epochId);
    }

    function version() external pure returns (string memory) {
        return "steward_path_vault_v1";
    }
}
