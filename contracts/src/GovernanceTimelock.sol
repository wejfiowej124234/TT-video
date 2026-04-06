// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * @title GovernanceTimelock
 * @notice 母表 **B-089 Partial**：**`admin`** **`schedule`** 任意 **`target.call{value}(data)`**，经过固定 **`delay`** 后 **任意调用方**可 **`execute`**。
 * @dev 验收路径：**schedule → 时间推进 → execute**，链上效果与 **payload** 一致（示例：**`FeeRouter.transferOwnership`**）。
 *      当前 **`FeeRouter`** 的 **四方 immutable 地址** 与 **BPS 常量** **不可**由单笔 `call` 改写；**费率 / 池路由 / 分层比例** 的 **无迁址热更新** 须 **可配置 Router** 或 **新部署 + 运维迁址**（**Target**，见 **14** / **83**）。
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
    error OperationExists();
    error UnknownOperation();
    error TooEarly();
    error AlreadyExecuted();
    error CallFailed();

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

    function schedule(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 salt
    ) external onlyAdmin returns (bytes32 id) {
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
