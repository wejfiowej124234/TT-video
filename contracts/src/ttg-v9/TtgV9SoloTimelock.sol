// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {TtgV9DesignLockConstants} from "./TtgV9DesignLockConstants.sol";

/**
 * @title TtgV9SoloTimelock
 * @notice Official Solo Timelock — admin schedules; Governor queues; delay then execute.
 * @dev No Safe. Admin immutable at construct. Delay is storage (NEW root default 12h) and may be
 *      updated only via self-call (Governor→schedule→execute updateDelay) within [12h, 7d].
 *      English NatSpec only. Build: solc 0.8.36 + via_IR.
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
    uint256 public delay;
    address public governor;
    mapping(bytes32 => Operation) public operations;
    mapping(address => bool) public allowedExecutionTarget;

    error OnlyAdmin();
    error OnlyGovernor();
    error OnlySelf();
    error OperationExists();
    error UnknownOperation();
    error TooEarly();
    error AlreadyExecuted();
    error CallFailed();
    error TargetNotAllowed();
    error InvalidAddress();
    error InvalidDelay();

    event AllowedExecutionTargetSet(address indexed target, bool allowed);
    event GovernorSet(address indexed governor);
    event DelayUpdated(uint256 previous, uint256 next);
    event OperationScheduled(
        bytes32 indexed id, address indexed target, uint256 value, bytes data, uint256 executeAfter
    );
    event OperationExecuted(bytes32 indexed id);

    constructor(address admin_, uint256 delay_) {
        if (admin_ == address(0)) revert InvalidAddress();
        if (
            delay_ < TtgV9DesignLockConstants.TIMELOCK_MIN_DELAY_SECONDS
                || delay_ > TtgV9DesignLockConstants.TIMELOCK_MAX_DELAY_SECONDS
        ) {
            revert InvalidDelay();
        }
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

    /// @notice Governor→Timelock self-execute only. Bounds: [12h, 7d].
    function updateDelay(uint256 newDelay) external {
        if (msg.sender != address(this)) revert OnlySelf();
        if (
            newDelay < TtgV9DesignLockConstants.TIMELOCK_MIN_DELAY_SECONDS
                || newDelay > TtgV9DesignLockConstants.TIMELOCK_MAX_DELAY_SECONDS
        ) {
            revert InvalidDelay();
        }
        uint256 prev = delay;
        delay = newDelay;
        emit DelayUpdated(prev, newDelay);
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
