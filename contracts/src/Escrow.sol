// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./IERC20.sol";

/**
 * TravelTrust Escrow 实例（与 01 §4、19 一致）
 * 资金流：Created -> Funded -> Completed | Refunded | (Disputed -> Resolved)
 * 无 admin 后门、无 emergency withdraw（contracts/README）
 */
contract Escrow {
    enum Status {
        None,
        Created,
        Funded,
        Completed,
        Refunded,
        Disputed,
        Resolved
    }

    struct EscrowParams {
        uint256 chainId;
        bytes32 orderId;
        bytes32 snapshotHash;
        uint16 schemaVersion;
        address traveler;
        address guide;
        address platformFeeRecipient;
        address token;
        uint256 totalAmount;
        uint16 platformFeeBps;
        uint64 serviceStart;
        uint64 serviceEnd;
        uint32 disputeWindowSeconds;
        address arbitrator;
    }

    bytes32 public orderId;
    address public traveler;
    address public guide;
    address public platformFeeRecipient;
    address public token;
    uint256 public totalAmount;
    uint16 public platformFeeBps;
    Status public status;
    address public factory;

    event EscrowCreated(
        bytes32 indexed orderId,
        address indexed escrow,
        address traveler,
        address guide,
        address token,
        uint256 totalAmount,
        uint16 platformFeeBps,
        bytes32 snapshotHash,
        uint16 schemaVersion
    );
    event Deposited(bytes32 indexed orderId, address indexed escrow, address from, uint256 amount);
    event Released(bytes32 indexed orderId, address indexed escrow, uint256 guideAmount, uint256 platformFeeAmount);
    event Refunded(bytes32 indexed orderId, address indexed escrow, uint256 travelerAmount);
    event DisputeOpened(bytes32 indexed orderId, address indexed escrow, address opener, bytes32 reasonHash);
    event ResolutionExecuted(bytes32 indexed orderId, address indexed escrow, bytes32 resolutionId, bytes32 decisionHash);

    error AlreadyInitialized();
    error InvalidState();
    error OnlyFactory();
    error OnlyTraveler();
    error OnlyArbitrator();
    error TransferFailed();

    modifier onlyFactory() {
        if (msg.sender != factory) revert OnlyFactory();
        _;
    }

    constructor(address _factory) {
        factory = _factory;
    }

    function init(EscrowParams calldata params) external onlyFactory {
        if (status != Status.None) revert AlreadyInitialized();
        if (params.platformFeeBps > 10000) revert InvalidState();
        orderId = params.orderId;
        traveler = params.traveler;
        guide = params.guide;
        platformFeeRecipient = params.platformFeeRecipient;
        token = params.token;
        totalAmount = params.totalAmount;
        platformFeeBps = params.platformFeeBps;
        status = Status.Created;
        emit EscrowCreated(
            params.orderId,
            address(this),
            params.traveler,
            params.guide,
            params.token,
            params.totalAmount,
            params.platformFeeBps,
            params.snapshotHash,
            params.schemaVersion
        );
    }

    function deposit(uint256 amount) external {
        if (status != Status.Created) revert InvalidState();
        if (msg.sender != traveler) revert OnlyTraveler();
        if (amount != totalAmount) revert InvalidState();
        if (!IERC20(token).transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
        status = Status.Funded;
        emit Deposited(orderId, address(this), msg.sender, amount);
    }

    /// @notice Completed 路径放款分账（01 §10 / 80 附录 §2 · Completed 收平台费）。
    /// @dev 向导到账 = floor(totalAmount * (10000 - platformFeeBps) / 10000)；
    ///      平台费 = totalAmount - guideAmount（BPS 乘除余数归平台费腿，与 01「dust 归平台」一致）。
    function release() external {
        if (status != Status.Funded) revert InvalidState();
        uint256 guideAmount = (totalAmount * (uint256(10000) - uint256(platformFeeBps))) / 10000;
        uint256 fee = totalAmount - guideAmount;
        if (!IERC20(token).transfer(guide, guideAmount)) revert TransferFailed();
        if (fee > 0 && !IERC20(token).transfer(platformFeeRecipient, fee)) revert TransferFailed();
        status = Status.Completed;
        emit Released(orderId, address(this), guideAmount, fee);
    }

    function refund() external {
        if (status != Status.Funded) revert InvalidState();
        if (msg.sender != traveler) revert OnlyTraveler();
        if (!IERC20(token).transfer(traveler, totalAmount)) revert TransferFailed();
        status = Status.Refunded;
        emit Refunded(orderId, address(this), totalAmount);
    }

    function openDispute(bytes32 reasonHash) external {
        if (status != Status.Funded) revert InvalidState();
        status = Status.Disputed;
        emit DisputeOpened(orderId, address(this), msg.sender, reasonHash);
    }

    /// @param resolutionId keccak256(chainId, orderId, resolutionSeq, decisionHash) per 01 §7
    /// 资金守恒：guideAmount + travelerRefund + platformFee == totalAmount
    function executeResolution(
        bytes32 resolutionId,
        bytes32 decisionHash,
        uint256 guideAmount,
        uint256 travelerRefund,
        uint256 platformFee
    ) external {
        if (status != Status.Disputed) revert InvalidState();
        if (guideAmount + travelerRefund + platformFee != totalAmount) revert InvalidState();
        if (guideAmount > 0 && !IERC20(token).transfer(guide, guideAmount)) revert TransferFailed();
        if (travelerRefund > 0 && !IERC20(token).transfer(traveler, travelerRefund)) revert TransferFailed();
        if (platformFee > 0 && !IERC20(token).transfer(platformFeeRecipient, platformFee)) revert TransferFailed();
        status = Status.Resolved;
        emit ResolutionExecuted(orderId, address(this), resolutionId, decisionHash);
    }
}
