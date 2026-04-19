// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./IERC20.sol";
import "./ISlashRouter.sol";
import "./StakeAccountingLib.sol";

/**
 * @title IdentityStakingPool
 * @notice 81 v2.1 — **Guide / Provider 各一合约实例（两地址 = 两池）**；禁止「单池 + role」冒充双池。
 * @dev 仓库内 **已移除** 旧 `Staking.sol`；部署与 ABI 以本合约为准。身份侧三账本语义见 `StakeAccountingLib`。
 *      与索引/B-088/B-092 对齐：`Staked`/`Withdrawn`/`Slashed` 事件签名与历史 `Staking.sol` **相同**（topic0 不变）。
 */
abstract contract IdentityStakingPool {
    using StakeAccountingLib for StakeAccountingLib.UserLedgers;

    IERC20 public immutable token;
    address public immutable slasher;

    /// @notice B-406：非零时罚没代币经 `SlashRouter` 分流；为零时保留池内 `slashReserve` 累计（测试/过渡）。
    address public immutable slashRouter;

    uint256 public immutable minIdentityStake;

    mapping(address => StakeAccountingLib.UserLedgers) internal _ledgers;

    /// @notice 累计被罚没金额（与旧 `Staking.slashedOf` 语义对齐；含从 available/lockedOrder 扣减部分）。
    mapping(address => uint256) public slashedOf;

    /// @notice §2.3-C — 罚没已归集至池内准备金（链外分流前代币仍在本合约）
    uint256 public slashReserve;

    uint256 public totalAvailable;
    uint256 public totalLockedOrder;

    /// @dev 与旧 `Staking.sol` 相同签名，供 `eth_getLogs` / B-088 topic0 不变。
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event Slashed(address indexed user, uint256 amount);

    event OrderRiskDeposited(address indexed user, uint256 amount);
    event OrderRiskReleased(address indexed user, uint256 amount);
    event OrderRiskMovedFromIdentity(address indexed user, uint256 amount);

    error TransferFailed();
    error BelowMinIdentityAfterWithdraw();
    error ZeroSlasher();
    error StakeBelowMinimum();

    constructor(address _token, address _slasher, uint256 _minIdentityStake, address _slashRouter) {
        if (_slasher == address(0)) revert ZeroSlasher();
        token = IERC20(_token);
        slasher = _slasher;
        slashRouter = _slashRouter;
        minIdentityStake = _minIdentityStake;
        if (_slashRouter != address(0)) {
            (bool ok) = IERC20(_token).approve(_slashRouter, type(uint256).max);
            if (!ok) revert TransferFailed();
        }
    }

    /// @notice 与旧 `Staking.MIN_STAKE` 读接口一致（ABI 兼容）。
    function MIN_STAKE() external view returns (uint256) {
        return minIdentityStake;
    }

    /// @notice 总头寸（可提取 + 订单锁定），与旧 `stakeOf` 对齐供快照/eth_call。
    function stakeOf(address user) external view returns (uint256) {
        StakeAccountingLib.UserLedgers storage L = _ledgers[user];
        return L.available + L.lockedOrder;
    }

    /// @notice 两用户账 + 罚没顺序与 `allocateSlash` 一致：`slashableTotal = lockedOrder + available`。
    function ledgers(address user)
        external
        view
        returns (uint256 availableStake, uint256 lockedOrderStake, uint256 slashableTotal)
    {
        StakeAccountingLib.UserLedgers storage L = _ledgers[user];
        availableStake = L.available;
        lockedOrderStake = L.lockedOrder;
        slashableTotal = L.available + L.lockedOrder;
    }

    /// @notice 旧接口别名 → `depositIdentity`。
    function stake(uint256 amount) external {
        _depositIdentity(amount);
    }

    /// @notice 追加身份侧可提取余额（入账至 `available`）。
    function depositIdentity(uint256 amount) external {
        _depositIdentity(amount);
    }

    function _depositIdentity(uint256 amount) internal {
        if (amount == 0) return;
        _pullToken(amount);
        StakeAccountingLib.UserLedgers storage L = _ledgers[msg.sender];
        L.available += amount;
        totalAvailable += amount;
        if (L.available < minIdentityStake) revert StakeBelowMinimum();
        emit Staked(msg.sender, amount);
    }

    /// @notice 旧接口别名 → `withdrawIdentity`。
    function withdraw(uint256 amount) external {
        _withdrawIdentity(amount);
    }

    /// @notice 从可提取余额提取；若仍非零则须 ≥ min。
    function withdrawIdentity(uint256 amount) external {
        _withdrawIdentity(amount);
    }

    function _withdrawIdentity(uint256 amount) internal {
        StakeAccountingLib.UserLedgers storage L = _ledgers[msg.sender];
        if (L.available < amount) revert StakeAccountingLib.InsufficientAvailable();
        L.available -= amount;
        totalAvailable -= amount;
        if (L.available != 0 && L.available < minIdentityStake) revert BelowMinIdentityAfterWithdraw();
        _pushToken(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    /// @notice 直接增加订单风险锁定（入账至 `lockedOrder`）。
    function depositOrderRisk(uint256 amount) external {
        if (amount == 0) return;
        _pullToken(amount);
        StakeAccountingLib.UserLedgers storage L = _ledgers[msg.sender];
        L.lockedOrder += amount;
        totalLockedOrder += amount;
        emit OrderRiskDeposited(msg.sender, amount);
    }

    /// @notice 可提取 → 可锁定（订单加锁）。
    function lockOrderRiskFromIdentity(uint256 amount) external {
        StakeAccountingLib.UserLedgers storage L = _ledgers[msg.sender];
        L.lockAvailableToOrder(amount);
        totalAvailable -= amount;
        totalLockedOrder += amount;
        emit OrderRiskMovedFromIdentity(msg.sender, amount);
    }

    /// @notice 可锁定 → 可提取（订单释放）。
    function releaseOrderRiskToIdentity(uint256 amount) external {
        StakeAccountingLib.UserLedgers storage L = _ledgers[msg.sender];
        L.releaseLockedToAvailable(amount);
        totalLockedOrder -= amount;
        totalAvailable += amount;
        emit OrderRiskReleased(msg.sender, amount);
    }

    /// @notice 与旧 `Staking.slash` 同名；罚没记入 `slashReserve` + `slashedOf`（事件 `Slashed` topic 与旧一致）。
    function slash(address user, uint256 amount) external {
        _slashToReserve(user, amount);
    }

    /// @notice Slasher：按罚没顺序从用户账扣减，等额记入池级 `slashReserve`。
    function slashToReserve(address user, uint256 amount) external {
        _slashToReserve(user, amount);
    }

    function _slashToReserve(address user, uint256 amount) internal {
        if (msg.sender != slasher) revert NotSlasher();
        StakeAccountingLib.UserLedgers storage L = _ledgers[user];
        (uint256 fromLockedOrder, uint256 fromAvailable) = L.allocateSlash(amount);
        if (fromLockedOrder > 0) totalLockedOrder -= fromLockedOrder;
        if (fromAvailable > 0) totalAvailable -= fromAvailable;
        slashedOf[user] += amount;
        emit Slashed(user, amount);

        if (slashRouter == address(0)) {
            slashReserve += amount;
            return;
        }
        ISlashRouter(slashRouter).routeFromPool(amount);
    }

    error NotSlasher();

    function _pullToken(uint256 amount) internal {
        bool ok = token.transferFrom(msg.sender, address(this), amount);
        if (!ok) revert TransferFailed();
    }

    function _pushToken(address to, uint256 amount) internal {
        bool ok = token.transfer(to, amount);
        if (!ok) revert TransferFailed();
    }
}
