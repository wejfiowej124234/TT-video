// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./IERC20.sol";

/**
 * @title UnallocatedStewardPathVault
 * @notice D-4555-B · Q-F01 45% protocol custody (per jurisdiction).
 * @dev Deposits only from Ledger; release to StewardPathVault only via Timelock owner.
 */
contract UnallocatedStewardPathVault {
    bytes2 public immutable jurisdiction;
    IERC20 public immutable token;
    address public immutable ledger;
    address public immutable stewardPathVault;

    address public owner;

    uint256 public totalReceived;
    uint256 public totalReleased;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event UnallocatedStewardDeposit(bytes2 indexed jurisdiction, address indexed token, uint256 amount, uint256 epochId);
    event UnallocatedStewardReleased(
        bytes2 indexed jurisdiction, address indexed token, uint256 amount, bytes32 proposalRef
    );

    error OnlyOwner();
    error OnlyLedger();
    error InvalidAddress();
    error InvalidAmount();
    error TransferFailed();

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    constructor(
        address owner_,
        bytes2 jurisdiction_,
        address token_,
        address ledger_,
        address stewardPathVault_
    ) {
        if (owner_ == address(0) || token_ == address(0) || ledger_ == address(0)) {
            revert InvalidAddress();
        }
        if (stewardPathVault_ == address(0) || uint16(jurisdiction_) == 0) revert InvalidAddress();
        owner = owner_;
        jurisdiction = jurisdiction_;
        token = IERC20(token_);
        ledger = ledger_;
        stewardPathVault = stewardPathVault_;
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
        emit UnallocatedStewardDeposit(jurisdiction, address(token), amount, epochId);
    }

    function releaseToStewardPath(uint256 amount, bytes32 proposalRef) external onlyOwner {
        if (amount == 0) revert InvalidAmount();
        if (token.balanceOf(address(this)) < amount) revert InvalidAmount();
        if (!token.transfer(stewardPathVault, amount)) revert TransferFailed();
        totalReleased += amount;
        emit UnallocatedStewardReleased(jurisdiction, address(token), amount, proposalRef);
    }

    function version() external pure returns (string memory) {
        return "unallocated_steward_path_vault_v1";
    }
}
