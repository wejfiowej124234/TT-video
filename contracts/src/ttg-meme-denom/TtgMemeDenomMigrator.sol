// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "./TtgMemeDenomConstants.sol";

interface ITtgMemeDenomErc20 {
    function totalSupply() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function transfer(address to, uint256 amount) external returns (bool);

    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/**
 * @title TtgMemeDenomMigrator
 * @notice DESIGN_ONLY optional goodwill converter · live 10M TTG → V8 25T at 1:2_500_000.
 * @dev Optimal Official path is a fresh 25T genesis to Team/DAO/Public. Do not pre-fund
 *      this contract with the whole 25T pie — that would consume Public+DAO inventory.
 *      Conservation check: old.totalSupply() * MERGE_RATIO == 25T. Inventory can be a
 *      later Timelock slice. Old tokens are locked, not burned.
 */
contract TtgMemeDenomMigrator {
    ITtgMemeDenomErc20 public immutable oldTtg;
    ITtgMemeDenomErc20 public immutable newTtg;
    address public owner;

    uint256 public oldLocked;
    mapping(address => uint256) public oldMigratedOf;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event Migrated(address indexed account, uint256 oldAmount, uint256 newAmount);
    event UnmigratedNewRecovered(address indexed to, uint256 amount);

    error OnlyOwner();
    error InvalidAddress();
    error InvalidAmount();
    error TransferFailed();
    error ConservationBroken();
    error InsufficientNewInventory();

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    constructor(address owner_, address oldTtg_, address newTtg_) {
        if (owner_ == address(0) || oldTtg_ == address(0) || newTtg_ == address(0)) {
            revert InvalidAddress();
        }
        if (oldTtg_ == newTtg_) revert InvalidAddress();
        uint256 oldSupply = ITtgMemeDenomErc20(oldTtg_).totalSupply();
        if (oldSupply != TtgMemeDenomConstants.LIVE_SHARE_UNITS) revert ConservationBroken();
        if (oldSupply * TtgMemeDenomConstants.MERGE_RATIO != TtgMemeDenomConstants.TTG_TOTAL_SUPPLY_UNITS) {
            revert ConservationBroken();
        }
        owner = owner_;
        oldTtg = ITtgMemeDenomErc20(oldTtg_);
        newTtg = ITtgMemeDenomErc20(newTtg_);
    }

    function mergeRatio() external pure returns (uint256) {
        return TtgMemeDenomConstants.MERGE_RATIO;
    }

    function quoteNew(uint256 oldAmount) public pure returns (uint256) {
        return oldAmount * TtgMemeDenomConstants.MERGE_RATIO;
    }

    function coverageBps() public view returns (uint256) {
        uint256 supply = oldTtg.totalSupply();
        if (supply == 0) return 0;
        return (oldLocked * 10_000) / supply;
    }

    function unmigratedOld() external view returns (uint256) {
        return oldTtg.totalSupply() - oldLocked;
    }

    function migrate(uint256 oldAmount) public {
        if (oldAmount == 0) revert InvalidAmount();
        uint256 out = quoteNew(oldAmount);
        if (newTtg.balanceOf(address(this)) < out) revert InsufficientNewInventory();
        if (!oldTtg.transferFrom(msg.sender, address(this), oldAmount)) revert TransferFailed();
        oldLocked += oldAmount;
        oldMigratedOf[msg.sender] += oldAmount;
        if (!newTtg.transfer(msg.sender, out)) revert TransferFailed();
        emit Migrated(msg.sender, oldAmount, out);
    }

    function migrateAll() external {
        migrate(oldTtg.balanceOf(msg.sender));
    }

    /// @notice Owner rescue of *new* TTG that was never claimed. Cannot unlock old TTG.
    function recoverUnmigratedNew(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (!newTtg.transfer(to, amount)) revert TransferFailed();
        emit UnmigratedNewRecovered(to, amount);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
