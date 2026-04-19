// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * @title GovernanceTimelock
 * @notice 母表 **B-089 Partial**：**`admin`** **`schedule`** **`target.call{value}(data)`**，经过固定 **`delay`** 后 **任意调用方**可 **`execute`**。
 * @dev 验收路径：**schedule → 时间推进 → execute**，链上效果与 **payload** 一致（示例：**`FeeRouter.transferOwnership`**）。
 *      **B-407**：**`schedule` / `scheduleByGovernor`** 仅当 **`allowedExecutionTarget[target]`** 为 **true**（**`admin`** **`setAllowedExecutionTarget`**），与 **02 §4.6～§4.7** **FeeRouter 分轨** vs **`GovernanceTreasury` / 募资** 的工程隔离一致：**Timelock** **不**对任意合约开放 **`execute`** 面。
 */
contract GovernanceTimelock {
    struct Operation {
        uint256 readyAt;
        bool done;
        address target;
        uint256 value;
        bytes data;
    }

    address public admin;
    uint256 public immutable delay;

    mapping(bytes32 => Operation) public operations;

    error OnlyAdmin();
    error OnlyGovernor();
    error OperationExists();
    error UnknownOperation();
    error TooEarly();
    error AlreadyExecuted();
    error CallFailed();
    error TargetNotAllowed();

    /// @notice **B-089 Completion**：Governor 合约地址；**`scheduleByGovernor`** 仅此地址可调用（与 **`onlyAdmin`** 的 **`schedule`** 并存）。
    address public governor;

    /// @notice **B-407**：**`true`** 时 **`target`** 方可进入 **`operations`**（Governor→Timelock 与 **admin** **`schedule`** 同源）。
    mapping(address => bool) public allowedExecutionTarget;

    event AllowedExecutionTargetSet(address indexed target, bool allowed);

    event OperationScheduled(
        bytes32 indexed id,
        address indexed target,
        uint256 value,
        bytes data,
        uint256 executeAfter
    );
    event OperationExecuted(bytes32 indexed id);

    modifier onlyAdmin() {
        if (msg.sender != admin) revert OnlyAdmin();
        _;
    }

    modifier onlyGovernor() {
        if (msg.sender != governor) revert OnlyGovernor();
        _;
    }

    constructor(address admin_, uint256 delay_) {
        admin = admin_;
        delay = delay_;
    }

    receive() external payable {}

    function hashOperation(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 salt
    ) public pure returns (bytes32) {
        return keccak256(abi.encode(target, value, keccak256(data), salt));
    }

    function setGovernor(address g) external onlyAdmin {
        governor = g;
    }

    /// @notice **B-407**：上线前由 **`admin`** 为 **FeeRouter / GovernanceTreasury / ReserveVault / RegionVault / TravelTrustGovernor** 等登记 **`true`**。
    function setAllowedExecutionTarget(address target, bool allowed) external onlyAdmin {
        allowedExecutionTarget[target] = allowed;
        emit AllowedExecutionTargetSet(target, allowed);
    }

    function _requireAllowedTarget(address target) internal view {
        if (!allowedExecutionTarget[target]) revert TargetNotAllowed();
    }

    /// @notice Governor **queue** 路径：**与 `schedule` 同源** 写入 **`operations`**，仅调用方约束不同。
    function scheduleByGovernor(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 salt
    ) external onlyGovernor returns (bytes32 id) {
        _requireAllowedTarget(target);
        id = hashOperation(target, value, data, salt);
        if (operations[id].readyAt != 0) revert OperationExists();
        uint256 eta = block.timestamp + delay;
        operations[id] = Operation({
            readyAt: eta,
            done: false,
            target: target,
            value: value,
            data: data
        });
        emit OperationScheduled(id, target, value, data, eta);
    }

    function schedule(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 salt
    ) external onlyAdmin returns (bytes32 id) {
        _requireAllowedTarget(target);
        id = hashOperation(target, value, data, salt);
        if (operations[id].readyAt != 0) revert OperationExists();
        uint256 eta = block.timestamp + delay;
        operations[id] = Operation({
            readyAt: eta,
            done: false,
            target: target,
            value: value,
            data: data
        });
        emit OperationScheduled(id, target, value, data, eta);
    }

    function execute(bytes32 id) external {
        Operation storage op = operations[id];
        if (op.readyAt == 0) revert UnknownOperation();
        if (op.done) revert AlreadyExecuted();
        if (block.timestamp < op.readyAt) revert TooEarly();
        op.done = true;
        (bool ok, ) = op.target.call{value: op.value}(op.data);
        if (!ok) revert CallFailed();
        emit OperationExecuted(id);
    }
}
