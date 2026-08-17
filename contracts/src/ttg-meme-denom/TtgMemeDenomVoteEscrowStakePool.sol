// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "./TtgMemeDenomGovernanceToken.sol";
import "./TtgMemeDenomSeatConcentrationRegistry.sol";
import "./TtgMemeDenomStewardMinimums.sol";

/**
 * @title TtgMemeDenomVoteEscrowStakePool
 * @notice NOT_IN_TTG_PM_GOV_CUTOVER leftover. Live stake pool transfers TTG in.
 * @dev Fusion removed token lockModule. This file must not re-introduce Drift into ③.
 */
contract TtgMemeDenomVoteEscrowStakePool {
    TtgMemeDenomGovernanceToken public immutable ttg;
    TtgMemeDenomSeatConcentrationRegistry public immutable registry;

    mapping(address => mapping(bytes2 => uint256)) public stakedOf;

    error InvalidAddress();
    error UnknownJurisdiction();
    error BelowMinStake();
    error InvalidAmount();

    event Staked(address indexed staker, bytes2 indexed jurisdiction, uint256 amount, uint256 total);
    event Unstaked(address indexed staker, bytes2 indexed jurisdiction, uint256 amount, uint256 total);

    constructor(address ttg_, address registry_) {
        if (ttg_ == address(0) || registry_ == address(0)) revert InvalidAddress();
        ttg = TtgMemeDenomGovernanceToken(ttg_);
        registry = TtgMemeDenomSeatConcentrationRegistry(registry_);
    }

    function stake(bytes2 jurisdiction, uint256 amount) external {
        if (amount == 0) revert InvalidAmount();
        uint256 need = TtgMemeDenomStewardMinimums.minStake(jurisdiction);
        if (need == 0) revert UnknownJurisdiction();
        uint256 next = stakedOf[msg.sender][jurisdiction] + amount;
        if (next < need) revert BelowMinStake();
        registry.assertStakeAllowed(msg.sender, jurisdiction, amount);
        stakedOf[msg.sender][jurisdiction] = next;
        registry.onStake(msg.sender, jurisdiction, amount);
        emit Staked(msg.sender, jurisdiction, amount, next);
    }

    function unstake(bytes2 jurisdiction, uint256 amount) external {
        uint256 cur = stakedOf[msg.sender][jurisdiction];
        if (amount == 0 || amount != cur) revert InvalidAmount();
        stakedOf[msg.sender][jurisdiction] = 0;
        registry.onReleaseComplete(msg.sender, jurisdiction, amount);
        emit Unstaked(msg.sender, jurisdiction, amount, 0);
    }

    function version() external pure returns (string memory) {
        return "ttg_primary_25t_vote_escrow_stake_pool_v8";
    }
}
