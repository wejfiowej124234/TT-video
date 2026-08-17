// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "./TtgMemeDenomPrimaryMarket.sol";
import "./TtgMemeDenomStewardMinimums.sol";

/**
 * @title TtgMemeDenomGenesisSeatGate
 * @notice NOT_IN_TTG_PM_GOV_CUTOVER leftover. Live Official has no O1 type machine.
 * @dev Fusion: KYC / O1 / DAO_SPONSORED = Drift. Do not wire this into ③ TTG/PM/Governor.
 */
contract TtgMemeDenomGenesisSeatGate {
    bytes32 public constant KIND_GENESIS = keccak256("GENESIS_SEAT");
    bytes32 public constant KIND_DAO_SPONSORED = keccak256("DAO_SPONSORED_SEAT");

    TtgMemeDenomPrimaryMarket public immutable primaryMarket;
    address public timelock;

    mapping(address => bytes32) public seatKind;
    mapping(address => bytes2) public seatJurisdiction;

    error InvalidAddress();
    error OnlyTimelock();
    error GenesisPurchaseMissing();
    error UnknownJurisdiction();

    event TimelockUpdated(address indexed previousTimelock, address indexed timelock);
    event GenesisSeatAdmitted(address indexed account, bytes2 jurisdiction, uint256 primaryPurchased);
    event DaoSponsoredSeatAdmitted(address indexed account, bytes2 jurisdiction);

    modifier onlyTimelock() {
        if (msg.sender != timelock) revert OnlyTimelock();
        _;
    }

    constructor(address primaryMarket_, address timelock_) {
        if (primaryMarket_ == address(0) || timelock_ == address(0)) revert InvalidAddress();
        primaryMarket = TtgMemeDenomPrimaryMarket(primaryMarket_);
        timelock = timelock_;
    }

    function setTimelock(address next) external onlyTimelock {
        if (next == address(0)) revert InvalidAddress();
        emit TimelockUpdated(timelock, next);
        timelock = next;
    }

    function genesisQualified(address account, bytes2 jurisdiction) public view returns (bool) {
        uint256 need = TtgMemeDenomStewardMinimums.minStake(jurisdiction);
        if (need == 0) return false;
        return primaryMarket.walletPurchasedTtg(account) >= need;
    }

    function admitGenesis(address account, bytes2 jurisdiction) external {
        if (account == address(0)) revert InvalidAddress();
        uint256 need = TtgMemeDenomStewardMinimums.minStake(jurisdiction);
        if (need == 0) revert UnknownJurisdiction();
        uint256 purchased = primaryMarket.walletPurchasedTtg(account);
        if (purchased < need) revert GenesisPurchaseMissing();
        seatKind[account] = KIND_GENESIS;
        seatJurisdiction[account] = jurisdiction;
        emit GenesisSeatAdmitted(account, jurisdiction, purchased);
    }

    function admitDaoSponsored(address account, bytes2 jurisdiction) external onlyTimelock {
        if (account == address(0)) revert InvalidAddress();
        if (TtgMemeDenomStewardMinimums.minStake(jurisdiction) == 0) revert UnknownJurisdiction();
        seatKind[account] = KIND_DAO_SPONSORED;
        seatJurisdiction[account] = jurisdiction;
        emit DaoSponsoredSeatAdmitted(account, jurisdiction);
    }
}
