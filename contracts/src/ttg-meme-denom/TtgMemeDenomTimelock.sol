// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/**
 * @title TtgMemeDenomTimelock
 * @notice DESIGN_ONLY V8 · independent of live Official Timelock.
 * @dev ③ delay pin is 48h. ② Sepolia rehearsal may pass a short constructor delay.
 */
contract TtgMemeDenomTimelock {
    struct Operation {
        uint256 readyAt;
        bool done;
        address target;
        uint256 value;
        bytes data;
    }

    address public admin;
    address public governor;
    uint256 public delay;
    mapping(bytes32 => Operation) private _ops;

    error OnlyAdmin();
    error OnlyGovernor();
    error InvalidAddress();
    error UnknownOp();
    error NotReady();
    error AlreadyDone();
    error CallFailed();
    error GovernorAlreadySet();

    event GovernorSet(address indexed governor);
    event Scheduled(bytes32 indexed id, address indexed target, uint256 readyAt);
    event Executed(bytes32 indexed id);

    modifier onlyAdmin() {
        if (msg.sender != admin) revert OnlyAdmin();
        _;
    }

    constructor(address admin_, uint256 delay_) {
        if (admin_ == address(0)) revert InvalidAddress();
        admin = admin_;
        delay = delay_;
    }

    function setGovernor(address governor_) external onlyAdmin {
        if (governor_ == address(0)) revert InvalidAddress();
        if (governor != address(0)) revert GovernorAlreadySet();
        governor = governor_;
        emit GovernorSet(governor_);
    }

    function scheduleByGovernor(address target, uint256 value, bytes calldata data, bytes32 salt)
        external
        returns (bytes32 id)
    {
        if (msg.sender != governor) revert OnlyGovernor();
        if (target == address(0)) revert InvalidAddress();
        id = keccak256(abi.encode(target, value, keccak256(data), salt, address(this)));
        Operation storage op = _ops[id];
        if (op.readyAt != 0) revert AlreadyDone();
        op.readyAt = block.timestamp + delay;
        op.target = target;
        op.value = value;
        op.data = data;
        emit Scheduled(id, target, op.readyAt);
    }

    function execute(bytes32 id) external {
        Operation storage op = _ops[id];
        if (op.readyAt == 0) revert UnknownOp();
        if (op.done) revert AlreadyDone();
        if (block.timestamp < op.readyAt) revert NotReady();
        op.done = true;
        (bool ok,) = op.target.call{value: op.value}(op.data);
        if (!ok) revert CallFailed();
        emit Executed(id);
    }

    function operations(bytes32 id)
        external
        view
        returns (uint256 readyAt, bool done, address target, uint256 value, bytes memory data)
    {
        Operation storage op = _ops[id];
        return (op.readyAt, op.done, op.target, op.value, op.data);
    }
}
