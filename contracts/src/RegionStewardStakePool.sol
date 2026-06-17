// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./IERC20.sol";

interface ITtgSeatConcentrationRegistry {
    function assertStakeAllowed(address staker, bytes2 jurisdiction, uint256 amount) external view;

    function onStake(address staker, bytes2 jurisdiction, uint256 amount) external;

    function onReleaseComplete(address staker, bytes2 jurisdiction, uint256 amount) external;
}

/**
 * @title RegionStewardStakePool
 * @notice Protocol Convergence P2 — TTG 主理人 Seat 质押池（R1 · fund-flow-ssot §3）。
 * @dev 与 IdentityStakingPool **分合约**；按 `jurisdiction` 锁定；释放延迟 + 线性 vest 见 constructor 参数。
 *      SSOT：[protocol-ssot.v1.md](../docs/spec/governance-token/protocol-ssot.v1.md) · state-machine `steward_application`.
 */
contract RegionStewardStakePool {
    IERC20 public immutable ttg;
    uint256 public immutable ttgTotalSupplyUnits;
    uint256 public immutable releaseDelaySeconds;
    uint256 public immutable releaseVestSeconds;

    address public owner;
    ITtgSeatConcentrationRegistry public seatConcentrationRegistry;

    struct StakePosition {
        uint256 amount;
        bytes32 applicationId;
        uint64 stakedAt;
        uint64 releaseRequestedAt;
        uint256 releasedAmount;
        bool active;
    }

    /// @notice jurisdiction → stake bps of total supply (e.g. CN = 400)
    mapping(bytes2 => uint256) public stewardStakeBps;

    mapping(address => mapping(bytes2 => StakePosition)) public stakes;
    mapping(address => mapping(bytes2 => bool)) public hasJurisdictionStake;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event SeatConcentrationRegistryUpdated(address indexed previousRegistry, address indexed registry);
    event JurisdictionConfigured(bytes2 indexed jurisdiction, uint256 stewardStakeBps);
    event StewardStaked(
        address indexed user, bytes2 indexed jurisdiction, uint256 amount, bytes32 applicationId
    );
    event StewardReleaseRequested(address indexed user, bytes2 indexed jurisdiction, uint64 at);
    event StewardReleased(address indexed user, bytes2 indexed jurisdiction, uint256 amount);

    error OnlyOwner();
    error InvalidJurisdiction();
    error InvalidAmount();
    error InvalidAddress();
    error TransferFailed();
    error JurisdictionAlreadyStaked();
    error NoActiveStake();
    error BelowMinStake();
    error ReleaseNotRequested();
    error ReleaseDelayPending();
    error NothingToRelease();
    error ProxyStorageAlreadyInitialized();
    error JurisdictionsAlreadyBootstrapped();

    event ProxyStorageInitialized(address owner);
    event ProtocolSsotJurisdictionsBootstrapped();

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    constructor(
        address owner_,
        address ttgToken_,
        uint256 ttgTotalSupplyUnits_,
        uint256 releaseDelaySeconds_,
        uint256 releaseVestSeconds_
    ) {
        if (owner_ == address(0) || ttgToken_ == address(0)) revert InvalidAddress();
        if (ttgTotalSupplyUnits_ == 0) revert InvalidAmount();
        owner = owner_;
        ttg = IERC20(ttgToken_);
        ttgTotalSupplyUnits = ttgTotalSupplyUnits_;
        releaseDelaySeconds = releaseDelaySeconds_;
        releaseVestSeconds = releaseVestSeconds_;
        _bootstrapProtocolSsotJurisdictions();
    }

    /// @dev protocol-ssot.v1.yaml jurisdictions[].steward_stake_bps (Phase 1 · 10 国)
    function _bootstrapProtocolSsotJurisdictions() internal {
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

    function setSeatConcentrationRegistry(address registry) external onlyOwner {
        emit SeatConcentrationRegistryUpdated(address(seatConcentrationRegistry), registry);
        seatConcentrationRegistry = ITtgSeatConcentrationRegistry(registry);
    }

    function configureJurisdiction(bytes2 jurisdiction, uint256 stakeBps) external onlyOwner {
        if (uint16(jurisdiction) == 0 || stakeBps == 0) revert InvalidJurisdiction();
        stewardStakeBps[jurisdiction] = stakeBps;
        emit JurisdictionConfigured(jurisdiction, stakeBps);
    }

    function minStakeAmount(bytes2 jurisdiction) public view returns (uint256) {
        uint256 bps = stewardStakeBps[jurisdiction];
        if (bps == 0) return 0;
        return (ttgTotalSupplyUnits * bps) / 10_000;
    }

    /// @notice Phase 1 · 10 国是否已从 protocol-ssot 写入 storage（Proxy 路径须显式 bootstrap）
    function jurisdictionsBootstrapped() public view returns (bool) {
        return stewardStakeBps[bytes2("CN")] != 0;
    }

    /// @notice Owner（GovFreeze = Timelock）一次性写入 10 国 steward_stake_bps · 已写入则 revert
    function bootstrapProtocolSsotJurisdictionsOnce() external onlyOwner {
        if (jurisdictionsBootstrapped()) revert JurisdictionsAlreadyBootstrapped();
        _bootstrapProtocolSsotJurisdictions();
        emit ProtocolSsotJurisdictionsBootstrapped();
    }

    function stake(bytes2 jurisdiction, uint256 amount, bytes32 applicationId) external {
        if (uint16(jurisdiction) == 0) revert InvalidJurisdiction();
        if (amount == 0) revert InvalidAmount();
        if (hasJurisdictionStake[msg.sender][jurisdiction]) revert JurisdictionAlreadyStaked();
        uint256 minAmt = minStakeAmount(jurisdiction);
        if (minAmt == 0 || amount < minAmt) revert BelowMinStake();
        if (address(seatConcentrationRegistry) != address(0)) {
            seatConcentrationRegistry.assertStakeAllowed(msg.sender, jurisdiction, amount);
        }
        if (!ttg.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();

        stakes[msg.sender][jurisdiction] = StakePosition({
            amount: amount,
            applicationId: applicationId,
            stakedAt: uint64(block.timestamp),
            releaseRequestedAt: 0,
            releasedAmount: 0,
            active: true
        });
        hasJurisdictionStake[msg.sender][jurisdiction] = true;
        if (address(seatConcentrationRegistry) != address(0)) {
            seatConcentrationRegistry.onStake(msg.sender, jurisdiction, amount);
        }
        emit StewardStaked(msg.sender, jurisdiction, amount, applicationId);
    }

    function requestRelease(bytes2 jurisdiction) external {
        StakePosition storage p = stakes[msg.sender][jurisdiction];
        if (!p.active || p.amount == 0) revert NoActiveStake();
        if (p.releaseRequestedAt != 0) return;
        p.releaseRequestedAt = uint64(block.timestamp);
        emit StewardReleaseRequested(msg.sender, jurisdiction, p.releaseRequestedAt);
    }

    /// @notice 延迟满后按线性 vest 领取可释 TTG（非本金保证轨 · SSOT lock_tiers）
    function claimReleased(bytes2 jurisdiction) external {
        StakePosition storage p = stakes[msg.sender][jurisdiction];
        if (!p.active || p.amount == 0) revert NoActiveStake();
        if (p.releaseRequestedAt == 0) revert ReleaseNotRequested();
        uint256 releasable = _releasableAmount(p);
        if (releasable == 0) revert NothingToRelease();
        p.releasedAmount += releasable;
        if (p.releasedAmount >= p.amount) {
            p.active = false;
            hasJurisdictionStake[msg.sender][jurisdiction] = false;
            if (address(seatConcentrationRegistry) != address(0)) {
                seatConcentrationRegistry.onReleaseComplete(msg.sender, jurisdiction, p.amount);
            }
        }
        if (!ttg.transfer(msg.sender, releasable)) revert TransferFailed();
        emit StewardReleased(msg.sender, jurisdiction, releasable);
    }

    function releasableAmount(address user, bytes2 jurisdiction) external view returns (uint256) {
        StakePosition storage p = stakes[user][jurisdiction];
        if (!p.active || p.releaseRequestedAt == 0) return 0;
        if (block.timestamp < uint256(p.releaseRequestedAt) + releaseDelaySeconds) return 0;
        uint256 remaining = p.amount - p.releasedAmount;
        if (remaining == 0) return 0;
        uint256 elapsed = block.timestamp - (uint256(p.releaseRequestedAt) + releaseDelaySeconds);
        if (releaseVestSeconds == 0) return remaining;
        uint256 vestedTotal = (p.amount * elapsed) / releaseVestSeconds;
        if (vestedTotal > p.amount) vestedTotal = p.amount;
        if (vestedTotal <= p.releasedAmount) return 0;
        return vestedTotal - p.releasedAmount;
    }

    function _releasableAmount(StakePosition storage p) internal view returns (uint256) {
        if (p.releaseRequestedAt == 0) return 0;
        if (block.timestamp < uint256(p.releaseRequestedAt) + releaseDelaySeconds) {
            revert ReleaseDelayPending();
        }
        uint256 remaining = p.amount - p.releasedAmount;
        if (remaining == 0) return 0;
        uint256 elapsed = block.timestamp - (uint256(p.releaseRequestedAt) + releaseDelaySeconds);
        if (releaseVestSeconds == 0) return remaining;
        uint256 vestedTotal = (p.amount * elapsed) / releaseVestSeconds;
        if (vestedTotal > p.amount) vestedTotal = p.amount;
        if (vestedTotal <= p.releasedAmount) return 0;
        return vestedTotal - p.releasedAmount;
    }

    function version() external pure returns (string memory) {
        return "region_steward_stake_pool_v1";
    }

    /// @notice G24-P-UPGRADE-01 · Proxy storage bootstrap（immutable ttg/supply 来自 Implementation constructor）
    function initializeProxyStorage(address owner_) external {
        if (owner != address(0)) revert ProxyStorageAlreadyInitialized();
        if (owner_ == address(0)) revert InvalidAddress();
        owner = owner_;
        _bootstrapProtocolSsotJurisdictions();
        emit ProxyStorageInitialized(owner_);
        emit ProtocolSsotJurisdictionsBootstrapped();
    }
}
