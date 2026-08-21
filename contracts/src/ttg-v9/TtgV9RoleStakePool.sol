// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {ITtgV9Erc20} from "./ITtgV9Tokens.sol";
import {TtgV9UUPSUpgradeable} from "./TtgV9UUPSUpgradeable.sol";

interface ITtgV9SupplyToken is ITtgV9Erc20 {
    function totalSupply() external view returns (uint256);
}

/**
 * @title TtgV9RoleStakePool
 * @notice Design Lock Role Stake — Region Steward ACTIVE; Merchant/Guide DISABLED until governance enables.
 * @dev minStake = live ttg.totalSupply() × stewardStakeBps / 10000 (tracks burns).
 *      UUPS · Timelock-only upgrade. English NatSpec only. Orthogonal to FeeRouter.
 *      Build: solc 0.8.36 + via_IR. No FeeRouter globalStakers semantics.
 */
contract TtgV9RoleStakePool is TtgV9UUPSUpgradeable {
    enum RoleId {
        RegionSteward,
        Merchant,
        Guide
    }

    ITtgV9SupplyToken public ttg;
    address public owner;
    uint256 public releaseDelaySeconds;
    uint256 public releaseVestSeconds;

    mapping(bytes2 => uint256) public stewardStakeBps;
    mapping(RoleId => bool) public roleEnabled;

    struct StakePosition {
        uint256 amount;
        bytes32 applicationId;
        uint64 stakedAt;
        uint64 releaseRequestedAt;
        uint256 releasedAmount;
        bool active;
    }

    mapping(address => mapping(bytes2 => StakePosition)) public stewardStakes;
    mapping(address => mapping(bytes2 => bool)) public hasJurisdictionStake;

    error OnlyOwner();
    error InvalidAddress();
    error InvalidAmount();
    error InvalidJurisdiction();
    error RoleDisabled();
    error BelowMinStake();
    error AlreadyStaked();
    error NoActiveStake();
    error ReleaseNotRequested();
    error ReleaseDelayPending();
    error NothingToRelease();
    error TransferFailed();

    event OwnershipTransferred(address indexed previous, address indexed next);
    event RoleEnabledSet(RoleId indexed role, bool enabled);
    event JurisdictionConfigured(bytes2 indexed jurisdiction, uint256 stewardStakeBps);
    event StewardStaked(address indexed user, bytes2 indexed jurisdiction, uint256 amount, bytes32 applicationId);
    event StewardReleaseRequested(address indexed user, bytes2 indexed jurisdiction, uint64 atTime);
    event StewardReleased(address indexed user, bytes2 indexed jurisdiction, uint256 amount);

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address owner_,
        address ttgToken_,
        uint256 releaseDelaySeconds_,
        uint256 releaseVestSeconds_
    ) external initializer {
        if (owner_ == address(0) || ttgToken_ == address(0)) revert InvalidAddress();
        owner = owner_;
        ttg = ITtgV9SupplyToken(ttgToken_);
        releaseDelaySeconds = releaseDelaySeconds_;
        releaseVestSeconds = releaseVestSeconds_;
        roleEnabled[RoleId.RegionSteward] = true;
        roleEnabled[RoleId.Merchant] = false;
        roleEnabled[RoleId.Guide] = false;
        _bootstrapTenCountryBps();
    }

    function _bootstrapTenCountryBps() internal {
        stewardStakeBps[bytes2("CN")] = 400;
        stewardStakeBps[bytes2("US")] = 400;
        stewardStakeBps[bytes2("FR")] = 450;
        stewardStakeBps[bytes2("ES")] = 450;
        stewardStakeBps[bytes2("JP")] = 250;
        stewardStakeBps[bytes2("TH")] = 250;
        stewardStakeBps[bytes2("SG")] = 200;
        stewardStakeBps[bytes2("KR")] = 200;
        stewardStakeBps[bytes2("AU")] = 150;
        stewardStakeBps[bytes2("AE")] = 150;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setRoleEnabled(RoleId role, bool enabled) external onlyOwner {
        roleEnabled[role] = enabled;
        emit RoleEnabledSet(role, enabled);
    }

    function configureJurisdiction(bytes2 jurisdiction, uint256 stakeBps) external onlyOwner {
        if (uint16(jurisdiction) == 0 || stakeBps == 0) revert InvalidJurisdiction();
        stewardStakeBps[jurisdiction] = stakeBps;
        emit JurisdictionConfigured(jurisdiction, stakeBps);
    }

    /// @notice Design Lock: live totalSupply() × bps (falls when protocol burns).
    function minStakeAmount(bytes2 jurisdiction) public view returns (uint256) {
        uint256 bps = stewardStakeBps[jurisdiction];
        if (bps == 0) return 0;
        return (ttg.totalSupply() * bps) / 10_000;
    }

    function stakeAsRegionSteward(bytes2 jurisdiction, uint256 amount, bytes32 applicationId) external {
        if (!roleEnabled[RoleId.RegionSteward]) revert RoleDisabled();
        if (uint16(jurisdiction) == 0) revert InvalidJurisdiction();
        if (amount == 0) revert InvalidAmount();
        if (hasJurisdictionStake[msg.sender][jurisdiction]) revert AlreadyStaked();
        uint256 minAmt = minStakeAmount(jurisdiction);
        if (minAmt == 0 || amount < minAmt) revert BelowMinStake();
        if (!ttg.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
        stewardStakes[msg.sender][jurisdiction] = StakePosition({
            amount: amount,
            applicationId: applicationId,
            stakedAt: uint64(block.timestamp),
            releaseRequestedAt: 0,
            releasedAmount: 0,
            active: true
        });
        hasJurisdictionStake[msg.sender][jurisdiction] = true;
        emit StewardStaked(msg.sender, jurisdiction, amount, applicationId);
    }

    function stakeAsMerchant(uint256) external pure {
        revert RoleDisabled();
    }

    function stakeAsGuide(uint256) external pure {
        revert RoleDisabled();
    }

    function requestRelease(bytes2 jurisdiction) external {
        StakePosition storage p = stewardStakes[msg.sender][jurisdiction];
        if (!p.active || p.amount == 0) revert NoActiveStake();
        if (p.releaseRequestedAt != 0) return;
        p.releaseRequestedAt = uint64(block.timestamp);
        emit StewardReleaseRequested(msg.sender, jurisdiction, p.releaseRequestedAt);
    }

    function claimReleased(bytes2 jurisdiction) external {
        StakePosition storage p = stewardStakes[msg.sender][jurisdiction];
        if (!p.active || p.amount == 0) revert NoActiveStake();
        if (p.releaseRequestedAt == 0) revert ReleaseNotRequested();
        if (block.timestamp < uint256(p.releaseRequestedAt) + releaseDelaySeconds) {
            revert ReleaseDelayPending();
        }
        uint256 remaining = p.amount - p.releasedAmount;
        if (remaining == 0) revert NothingToRelease();
        uint256 releasable = remaining;
        if (releaseVestSeconds != 0) {
            uint256 elapsed = block.timestamp - (uint256(p.releaseRequestedAt) + releaseDelaySeconds);
            uint256 vestedTotal = (p.amount * elapsed) / releaseVestSeconds;
            if (vestedTotal > p.amount) vestedTotal = p.amount;
            if (vestedTotal <= p.releasedAmount) revert NothingToRelease();
            releasable = vestedTotal - p.releasedAmount;
        }
        p.releasedAmount += releasable;
        if (p.releasedAmount >= p.amount) {
            p.active = false;
            hasJurisdictionStake[msg.sender][jurisdiction] = false;
        }
        if (!ttg.transfer(msg.sender, releasable)) revert TransferFailed();
        emit StewardReleased(msg.sender, jurisdiction, releasable);
    }

    function _authorizeUpgrade(address) internal view override onlyOwner {}
}
