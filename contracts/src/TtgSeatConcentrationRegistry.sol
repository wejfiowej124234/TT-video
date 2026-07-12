// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./TtgGovFreezeConstants.sol";

/**
 * @title TtgSeatConcentrationRegistry
 * @notice **GOV-03** · 同一控制主体 ≤1 Active Seat · 聚合质押 ≤4% 供应（Seat 路径）
 * @dev `controllingEntityOf` 由 owner 绑定（② KYC/合规 oracle · 未绑定则 address 即 entity）
 *      仅 `stakePool` 可调 `onStake` / `onReleaseComplete`
 */
contract TtgSeatConcentrationRegistry {
    address public owner;
    address public stakePool;

    mapping(address => bytes32) public controllingEntityOf;
    mapping(bytes32 => uint256) public activeSeatCountByEntity;
    mapping(bytes32 => uint256) public aggregateStakeByEntity;
    mapping(bytes32 => mapping(bytes2 => bool)) public entityHasActiveJurisdiction;

    error OnlyOwner();
    error OnlyStakePool();
    error InvalidAddress();
    error EntitySeatLimitExceeded();
    error EntityStakeLimitExceeded();
    error ProxyStorageAlreadyInitialized();

    event ProxyStorageInitialized(address owner, address stakePool);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event StakePoolUpdated(address indexed previousPool, address indexed pool);
    event ControllingEntityBound(address indexed account, bytes32 indexed entityId);
    event EntityStakeRecorded(bytes32 indexed entityId, bytes2 jurisdiction, uint256 amount, uint256 aggregate);

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    modifier onlyStakePool() {
        if (msg.sender != stakePool) revert OnlyStakePool();
        _;
    }

    constructor(address owner_, address stakePool_) {
        if (owner_ == address(0)) revert InvalidAddress();
        owner = owner_;
        stakePool = stakePool_;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setStakePool(address pool) external onlyOwner {
        emit StakePoolUpdated(stakePool, pool);
        stakePool = pool;
    }

    function bindControllingEntity(address account, bytes32 entityId) external onlyOwner {
        if (account == address(0) || entityId == bytes32(0)) revert InvalidAddress();
        controllingEntityOf[account] = entityId;
        emit ControllingEntityBound(account, entityId);
    }

    function _entityId(address account) internal view returns (bytes32) {
        bytes32 bound = controllingEntityOf[account];
        if (bound != bytes32(0)) return bound;
        return bytes32(uint256(uint160(account)));
    }

    function maxAggregateStakePerEntity() public pure returns (uint256) {
        return (TtgGovFreezeConstants.TTG_TOTAL_SUPPLY_UNITS
            * TtgGovFreezeConstants.MAX_AGGREGATE_SEAT_STAKE_PER_ENTITY_BPS) / 10_000;
    }

    /// @notice Stake 前校验 · 由 RegionStewardStakePool 调用
    function assertStakeAllowed(address staker, bytes2 jurisdiction, uint256 amount) external view {
        bytes32 entity = _entityId(staker);
        if (!entityHasActiveJurisdiction[entity][jurisdiction]) {
            if (activeSeatCountByEntity[entity]
                >= TtgGovFreezeConstants.MAX_ACTIVE_SEATS_PER_CONTROLLING_ENTITY) {
                revert EntitySeatLimitExceeded();
            }
        }
        if (aggregateStakeByEntity[entity] + amount > maxAggregateStakePerEntity()) {
            revert EntityStakeLimitExceeded();
        }
    }

    function onStake(address staker, bytes2 jurisdiction, uint256 amount) external onlyStakePool {
        bytes32 entity = _entityId(staker);
        if (!entityHasActiveJurisdiction[entity][jurisdiction]) {
            entityHasActiveJurisdiction[entity][jurisdiction] = true;
            activeSeatCountByEntity[entity] += 1;
        }
        aggregateStakeByEntity[entity] += amount;
        emit EntityStakeRecorded(entity, jurisdiction, amount, aggregateStakeByEntity[entity]);
    }

    function onReleaseComplete(address staker, bytes2 jurisdiction, uint256 amount) external onlyStakePool {
        bytes32 entity = _entityId(staker);
        if (aggregateStakeByEntity[entity] >= amount) {
            aggregateStakeByEntity[entity] -= amount;
        } else {
            aggregateStakeByEntity[entity] = 0;
        }
        if (entityHasActiveJurisdiction[entity][jurisdiction]) {
            entityHasActiveJurisdiction[entity][jurisdiction] = false;
            if (activeSeatCountByEntity[entity] > 0) {
                activeSeatCountByEntity[entity] -= 1;
            }
        }
    }

    function version() external pure returns (string memory) {
        return "ttg_seat_concentration_registry_v1";
    }

    function initializeProxyStorage(address owner_, address stakePool_) external {
        if (owner != address(0)) revert ProxyStorageAlreadyInitialized();
        if (owner_ == address(0)) revert InvalidAddress();
        owner = owner_;
        stakePool = stakePool_;
        emit ProxyStorageInitialized(owner_, stakePool_);
    }
}
