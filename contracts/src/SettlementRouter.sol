// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./IERC20.sol";
import "./ISettlementRouter.sol";
import "./IEscrowServiceFeeSync.sol";
import "./V311DistributableSplit.sol";

/**
 * @title SettlementRouter
 * @notice Protocol v2 · Escrow fee-leg → SettlementReady → Distributable → 45/55 (+ FeeRouter pool sink)
 * @dev Does not mutate ACTIVE address matrix. L5-A wire via receiveFeeLegFromEscrow + escrow allowlist.
 */
contract SettlementRouter is ISettlementRouter {
    address public owner;
    address public feeRouter; // optional four-track sink for poolShare

    mapping(bytes32 => OrderSettlementState) private _state;
    mapping(bytes32 => uint256) private _feeLeg;
    mapping(bytes32 => address) private _token;
    mapping(bytes32 => address) private _escrow;
    mapping(address => bool) public isEscrow;

    error NotOwner();
    error NotEscrow();
    error InvalidAddress();
    error InvalidAmount();
    error InvalidState();
    error TransferFailed();

    event OwnershipTransferred(address indexed prev, address indexed next);
    event FeeRouterSet(address indexed feeRouter);
    event EscrowAllowlisted(address indexed escrow, bool allowed);

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address owner_, address feeRouter_) {
        if (owner_ == address(0)) revert InvalidAddress();
        owner = owner_;
        feeRouter = feeRouter_;
        emit OwnershipTransferred(address(0), owner_);
        emit FeeRouterSet(feeRouter_);
    }

    function transferOwnership(address next) external onlyOwner {
        if (next == address(0)) revert InvalidAddress();
        emit OwnershipTransferred(owner, next);
        owner = next;
    }

    function setFeeRouter(address feeRouter_) external onlyOwner {
        feeRouter = feeRouter_;
        emit FeeRouterSet(feeRouter_);
    }

    function setEscrow(address escrow, bool allowed) external onlyOwner {
        if (escrow == address(0)) revert InvalidAddress();
        isEscrow[escrow] = allowed;
        emit EscrowAllowlisted(escrow, allowed);
    }

    function settlementState(bytes32 orderId) external view returns (OrderSettlementState) {
        return _state[orderId];
    }

    function feeLegAmount(bytes32 orderId) external view returns (uint256) {
        return _feeLeg[orderId];
    }

    function escrowOf(bytes32 orderId) external view returns (address) {
        return _escrow[orderId];
    }

    function receiveFeeLeg(bytes32 orderId, address token, uint256 amount, address from) external onlyOwner {
        _ingestFeeLeg(orderId, token, amount, from, address(0));
    }

    function receiveFeeLegFromEscrow(bytes32 orderId, address token, uint256 amount) external {
        if (!isEscrow[msg.sender]) revert NotEscrow();
        _ingestFeeLeg(orderId, token, amount, msg.sender, msg.sender);
    }

    function _ingestFeeLeg(
        bytes32 orderId,
        address token,
        uint256 amount,
        address from,
        address escrow
    ) internal {
        if (token == address(0) || from == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (_state[orderId] != OrderSettlementState.None) revert InvalidState();
        if (!IERC20(token).transferFrom(from, address(this), amount)) revert TransferFailed();
        _token[orderId] = token;
        _feeLeg[orderId] = amount;
        if (escrow != address(0)) {
            _escrow[orderId] = escrow;
        }
        _state[orderId] = OrderSettlementState.FeeLegReceived;
        emit FeeLegReceived(orderId, token, amount, from);
    }

    function markSettlementReady(bytes32 orderId) external onlyOwner {
        if (_state[orderId] != OrderSettlementState.FeeLegReceived) revert InvalidState();
        _state[orderId] = OrderSettlementState.SettlementReady;
        emit SettlementReadyMarked(orderId);
    }

    function markDistributable(bytes32 orderId) external onlyOwner {
        if (_state[orderId] != OrderSettlementState.SettlementReady) revert InvalidState();
        _state[orderId] = OrderSettlementState.Distributable;
        emit DistributableMarked(orderId, _feeLeg[orderId]);
        address e = _escrow[orderId];
        if (e != address(0)) {
            IEscrowServiceFeeSync(e).notifySettlementDistributable();
        }
    }

    function distribute(
        bytes32 orderId,
        bool stewardActive,
        address stewardRecipient,
        address projectRevenuePool
    ) external onlyOwner {
        if (_state[orderId] != OrderSettlementState.Distributable) revert InvalidState();
        if (projectRevenuePool == address(0)) revert InvalidAddress();
        if (stewardActive && stewardRecipient == address(0)) revert InvalidAddress();

        uint256 amount = _feeLeg[orderId];
        address token = _token[orderId];
        (uint256 stewardShare, uint256 poolShare) = V311DistributableSplit.split(amount, stewardActive);

        if (stewardShare > 0) {
            if (!IERC20(token).transfer(stewardRecipient, stewardShare)) revert TransferFailed();
        }
        if (poolShare > 0) {
            // Four-track live path: poolShare → FeeRouter (when configured as sink)
            // Steward/Treasury path: poolShare → ProjectRevenuePool when that address is passed
            if (!IERC20(token).transfer(projectRevenuePool, poolShare)) revert TransferFailed();
        }

        _state[orderId] = OrderSettlementState.Distributed;
        emit Distributed(orderId, stewardShare, poolShare, stewardRecipient, projectRevenuePool);

        address e = _escrow[orderId];
        if (e != address(0)) {
            IEscrowServiceFeeSync(e).notifySettlementDistributed();
        }
    }
}
