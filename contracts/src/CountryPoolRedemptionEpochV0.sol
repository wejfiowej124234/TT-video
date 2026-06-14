// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./IERC20.sol";

/**
 * @title CountryPoolRedemptionEpochV0
 * @notice P2 · R2 NAV 赎回窗口（fund-flow-ssot §4 · state-machine `country_pool_redemption`）。
 * @dev 单 jurisdiction 试点；单窗赎回 ≤ maxNavPctBps × NAV；超额 pro-rata。
 */
contract CountryPoolRedemptionEpochV0 {
    IERC20 public immutable asset;
    bytes2 public immutable jurisdiction;
    uint256 public immutable maxNavPctBps;
    uint256 public immutable windowSeconds;

    address public owner;

    uint256 public epochId;
    uint256 public epochNav;
    uint256 public epochOpenAt;
    uint256 public epochCloseAt;
    uint256 public epochSettledAmount;
    bool public epochSettled;

    struct RedemptionRequest {
        address user;
        uint256 shares;
        uint256 requestedAt;
        bool cancelled;
        bool settled;
        uint256 payout;
    }

    RedemptionRequest[] public requests;
    mapping(address => uint256[]) public userRequestIds;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event RedemptionRequested(uint256 indexed requestId, address indexed user, uint256 shares);
    event EpochOpened(uint256 indexed epochId, uint256 nav, uint256 openAt, uint256 closeAt);
    event EpochSettled(uint256 indexed epochId, uint256 totalPayout, uint256 requestCount);
    event RedemptionClaimed(uint256 indexed requestId, address indexed user, uint256 amount);

    error OnlyOwner();
    error InvalidJurisdiction();
    error InvalidAmount();
    error InvalidAddress();
    error TransferFailed();
    error EpochNotOpen();
    error EpochAlreadySettled();
    error EpochStillOpen();
    error RequestNotSettled();
    error NothingToClaim();
    error RequestCancelled();

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    constructor(
        address owner_,
        bytes2 jurisdiction_,
        address asset_,
        uint256 maxNavPctBps_,
        uint256 windowSeconds_
    ) {
        if (owner_ == address(0) || asset_ == address(0)) revert InvalidAddress();
        if (uint16(jurisdiction_) == 0 || maxNavPctBps_ == 0) revert InvalidJurisdiction();
        owner = owner_;
        jurisdiction = jurisdiction_;
        asset = IERC20(asset_);
        maxNavPctBps = maxNavPctBps_;
        windowSeconds = windowSeconds_;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function requestRedemption(uint256 shares) external {
        if (shares == 0) revert InvalidAmount();
        uint256 id = requests.length;
        requests.push(
            RedemptionRequest({
                user: msg.sender,
                shares: shares,
                requestedAt: block.timestamp,
                cancelled: false,
                settled: false,
                payout: 0
            })
        );
        userRequestIds[msg.sender].push(id);
        emit RedemptionRequested(id, msg.sender, shares);
    }

    function cancelRedemption(uint256 requestId) external {
        RedemptionRequest storage r = requests[requestId];
        if (r.cancelled) revert RequestCancelled();
        if (r.user != msg.sender) revert OnlyOwner();
        if (r.settled) revert EpochAlreadySettled();
        if (epochOpenAt != 0 && block.timestamp >= epochOpenAt) revert EpochNotOpen();
        r.cancelled = true;
    }

    function openEpoch(uint256 nav) external onlyOwner {
        if (nav == 0) revert InvalidAmount();
        epochId += 1;
        epochNav = nav;
        epochOpenAt = block.timestamp;
        epochCloseAt = block.timestamp + windowSeconds;
        epochSettled = false;
        epochSettledAmount = 0;
        emit EpochOpened(epochId, nav, epochOpenAt, epochCloseAt);
    }

    function settleEpoch() external onlyOwner {
        if (epochOpenAt == 0) revert EpochNotOpen();
        if (block.timestamp < epochCloseAt) revert EpochStillOpen();
        if (epochSettled) revert EpochAlreadySettled();

        uint256 cap = (epochNav * maxNavPctBps) / 10_000;
        uint256 totalShares;
        uint256 count;
        for (uint256 i = 0; i < requests.length; i++) {
            RedemptionRequest storage r = requests[i];
            if (r.cancelled || r.settled || r.requestedAt > epochCloseAt) continue;
            totalShares += r.shares;
            count += 1;
        }
        if (totalShares == 0 || cap == 0) {
            epochSettled = true;
            emit EpochSettled(epochId, 0, count);
            return;
        }
        uint256 payoutTotal = cap;
        if (payoutTotal > asset.balanceOf(address(this))) {
            payoutTotal = asset.balanceOf(address(this));
        }
        for (uint256 i = 0; i < requests.length; i++) {
            RedemptionRequest storage r = requests[i];
            if (r.cancelled || r.settled || r.requestedAt > epochCloseAt) continue;
            r.settled = true;
            r.payout = (payoutTotal * r.shares) / totalShares;
            epochSettledAmount += r.payout;
        }
        epochSettled = true;
        emit EpochSettled(epochId, epochSettledAmount, count);
    }

    function claim(uint256 requestId) external {
        RedemptionRequest storage r = requests[requestId];
        if (r.user != msg.sender) revert OnlyOwner();
        if (r.cancelled) revert RequestCancelled();
        if (!r.settled || r.payout == 0) revert RequestNotSettled();
        uint256 amt = r.payout;
        r.payout = 0;
        if (!asset.transfer(msg.sender, amt)) revert TransferFailed();
        emit RedemptionClaimed(requestId, msg.sender, amt);
    }

    function fundRedemptionVault(uint256 amount) external {
        if (amount == 0) revert InvalidAmount();
        if (!asset.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
    }

    function version() external pure returns (string memory) {
        return "country_pool_redemption_epoch_v0";
    }
}
