// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

/**
 * @title TtgV9SoloTimelock
 * @notice Official Design Lock Solo Timelock — admin schedules; Governor queues; delay then execute.
 * @dev No Safe. Admin immutable at construct. No bootstrap shortcuts (use schedule+warp in tests).
 *      English NatSpec only. Owner Design LOCK: admin = Marketing deployer EOA.
 *      Build: solc 0.8.36 + via_IR. No mutual recursion; explorer compiler banners N/A for this source.
 */
contract TtgV9SoloTimelock {
    struct Operation {
        uint256 readyAt;
        bool done;
        address target;
        uint256 value;
        bytes data;
    }

    address public immutable admin;
    uint256 public immutable delay;
    address public governor;
    mapping(bytes32 => Operation) public operations;
    mapping(address => bool) public allowedExecutionTarget;

    error OnlyAdmin();
    error OnlyGovernor();
    error OperationExists();
    error UnknownOperation();
    error TooEarly();
    error AlreadyExecuted();
    error CallFailed();
    error TargetNotAllowed();
    error InvalidAddress();

    event AllowedExecutionTargetSet(address indexed target, bool allowed);
    event GovernorSet(address indexed governor);
    event OperationScheduled(
        bytes32 indexed id, address indexed target, uint256 value, bytes data, uint256 executeAfter
    );
    event OperationExecuted(bytes32 indexed id);

    constructor(address admin_, uint256 delay_) {
        if (admin_ == address(0) || delay_ == 0) revert InvalidAddress();
        admin = admin_;
        delay = delay_;
    }

    receive() external payable {}

    function setGovernor(address g) external {
        if (msg.sender != admin) revert OnlyAdmin();
        if (g == address(0)) revert InvalidAddress();
        governor = g;
        emit GovernorSet(g);
    }

    function setAllowedExecutionTarget(address target, bool allowed) external {
        if (msg.sender != admin) revert OnlyAdmin();
        allowedExecutionTarget[target] = allowed;
        emit AllowedExecutionTargetSet(target, allowed);
    }

    function hashOperation(address target, uint256 value, bytes calldata data, bytes32 salt)
        public
        pure
        returns (bytes32)
    {
        return keccak256(abi.encode(target, value, keccak256(data), salt));
    }

    function scheduleByGovernor(address target, uint256 value, bytes calldata data, bytes32 salt)
        external
        returns (bytes32 id)
    {
        if (msg.sender != governor) revert OnlyGovernor();
        if (!allowedExecutionTarget[target]) revert TargetNotAllowed();
        id = hashOperation(target, value, data, salt);
        if (operations[id].readyAt != 0) revert OperationExists();
        uint256 eta = block.timestamp + delay;
        operations[id] =
            Operation({readyAt: eta, done: false, target: target, value: value, data: data});
        emit OperationScheduled(id, target, value, data, eta);
    }

    function schedule(address target, uint256 value, bytes calldata data, bytes32 salt)
        external
        returns (bytes32 id)
    {
        if (msg.sender != admin) revert OnlyAdmin();
        if (!allowedExecutionTarget[target]) revert TargetNotAllowed();
        id = hashOperation(target, value, data, salt);
        if (operations[id].readyAt != 0) revert OperationExists();
        uint256 eta = block.timestamp + delay;
        operations[id] =
            Operation({readyAt: eta, done: false, target: target, value: value, data: data});
        emit OperationScheduled(id, target, value, data, eta);
    }

    function execute(bytes32 id) external {
        Operation storage op = operations[id];
        if (op.readyAt == 0) revert UnknownOperation();
        if (op.done) revert AlreadyExecuted();
        if (block.timestamp < op.readyAt) revert TooEarly();
        op.done = true;
        (bool ok,) = op.target.call{value: op.value}(op.data);
        if (!ok) revert CallFailed();
        emit OperationExecuted(id);
    }
}
