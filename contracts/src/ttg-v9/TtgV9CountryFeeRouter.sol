// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {ITtgV9Erc20} from "./ITtgV9Tokens.sol";
import {TtgV9DesignLockConstants} from "./TtgV9DesignLockConstants.sol";

/**
 * @title TtgV9CountryFeeRouter
 * @notice Design Lock country-aware platform-fee router. NO globalStakers ACTIVE economics.
 * @dev Splits already-collected platform fee USDC:
 *      Active steward payout[j] → 45% steward / 55% projectPool
 *      Else → 100% projectPool
 *      Escrow should charge PLATFORM_FEE_BPS (5%); this contract does not take the 5% cut itself.
 *      setStewardPayout only via owner (NEW Timelock). English NatSpec only.
 *      Build: solc 0.8.36 + via_IR. No honeypot · no mint · no balance rewrite.
 */
contract TtgV9CountryFeeRouter {
    address public owner;
    address public projectPool;
    bool public distributePaused;

    /// @notice ISO 3166-1 alpha-2 → Active Region Steward payout wallet (address(0) = none).
    mapping(bytes2 => address) public stewardPayout;

    /// @notice Optional allowlist for who may call routePlatformFee (Escrow / Settlement). Empty = owner only.
    mapping(address => bool) public feeRouterCaller;

    error OnlyOwner();
    error InvalidAddress();
    error InvalidAmount();
    error InvalidJurisdiction();
    error DistributePaused();
    error TransferFailed();
    error NotAuthorizedCaller();

    event OwnershipTransferred(address indexed previous, address indexed next);
    event ProjectPoolUpdated(address indexed previous, address indexed next);
    event DistributePausedSet(bool paused);
    event FeeRouterCallerSet(address indexed caller, bool allowed);
    event StewardPayoutSet(bytes2 indexed jurisdiction, address indexed payout);
    event PlatformFeeRouted(
        address indexed token,
        bytes2 indexed jurisdiction,
        uint256 amount,
        uint256 toSteward,
        uint256 toProjectPool,
        address steward
    );

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    constructor(address owner_, address projectPool_) {
        if (owner_ == address(0) || projectPool_ == address(0)) revert InvalidAddress();
        owner = owner_;
        projectPool = projectPool_;
    }

    function platformFeeBps() external pure returns (uint256) {
        return TtgV9DesignLockConstants.PLATFORM_FEE_BPS;
    }

    function stewardShareBps() external pure returns (uint256) {
        return TtgV9DesignLockConstants.STEWARD_SHARE_BPS;
    }

    function projectShareBps() external pure returns (uint256) {
        return TtgV9DesignLockConstants.PROJECT_SHARE_BPS;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setProjectPool(address pool) external onlyOwner {
        if (pool == address(0)) revert InvalidAddress();
        emit ProjectPoolUpdated(projectPool, pool);
        projectPool = pool;
    }

    function setDistributePaused(bool paused) external onlyOwner {
        distributePaused = paused;
        emit DistributePausedSet(paused);
    }

    function setFeeRouterCaller(address caller, bool allowed) external onlyOwner {
        feeRouterCaller[caller] = allowed;
        emit FeeRouterCallerSet(caller, allowed);
    }

    /// @notice Timelock path after Admin review of Region Steward application payout address.
    function setStewardPayout(bytes2 jurisdiction, address payout) external onlyOwner {
        if (uint16(jurisdiction) == 0) revert InvalidJurisdiction();
        stewardPayout[jurisdiction] = payout;
        emit StewardPayoutSet(jurisdiction, payout);
    }

    function clearStewardPayout(bytes2 jurisdiction) external onlyOwner {
        if (uint16(jurisdiction) == 0) revert InvalidJurisdiction();
        stewardPayout[jurisdiction] = address(0);
        emit StewardPayoutSet(jurisdiction, address(0));
    }

    /**
     * @notice Route platform fee already held by this contract (or pull via transferFrom first off-path).
     * @dev Prefer: Escrow transfers fee USDC here then owner/authorized caller invokes this.
     */
    function routePlatformFee(address token, uint256 amount, bytes2 jurisdiction) external {
        if (distributePaused) revert DistributePaused();
        if (msg.sender != owner && !feeRouterCaller[msg.sender]) revert NotAuthorizedCaller();
        if (amount == 0) revert InvalidAmount();
        if (token == address(0)) revert InvalidAddress();
        if (uint16(jurisdiction) == 0) revert InvalidJurisdiction();
        if (ITtgV9Erc20(token).balanceOf(address(this)) < amount) revert InvalidAmount();

        address steward = stewardPayout[jurisdiction];
        uint256 toSteward;
        uint256 toPool;
        if (steward != address(0)) {
            toSteward = (amount * TtgV9DesignLockConstants.STEWARD_SHARE_BPS) / 10_000;
            toPool = amount - toSteward;
            if (!ITtgV9Erc20(token).transfer(steward, toSteward)) revert TransferFailed();
            if (!ITtgV9Erc20(token).transfer(projectPool, toPool)) revert TransferFailed();
        } else {
            toPool = amount;
            if (!ITtgV9Erc20(token).transfer(projectPool, toPool)) revert TransferFailed();
        }
        emit PlatformFeeRouted(token, jurisdiction, amount, toSteward, toPool, steward);
    }
}
