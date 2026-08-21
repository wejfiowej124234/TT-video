// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {TtgV9DaoProposalThresholds} from "./TtgV9DaoProposalThresholds.sol";
import {TtgV9StewardLifecycle} from "./TtgV9StewardLifecycle.sol";

interface ITtgV9GovernanceVotes {
    function getPastVotes(address account, uint256 blockNumber) external view returns (uint256);

    function getPastTotalSupply(uint256 blockNumber) external view returns (uint256);
}

interface ITtgV9GovernanceTimelock {
    function scheduleByGovernor(address target, uint256 value, bytes calldata data, bytes32 salt)
        external
        returns (bytes32);

    function execute(bytes32 id) external;

    function operations(bytes32)
        external
        view
        returns (uint256 readyAt, bool done, address target, uint256 value, bytes memory data);
}

enum TtgV9ProposalState {
    Pending,
    Active,
    Canceled,
    Defeated,
    Succeeded,
    Queued,
    Executed
}

/**
 * @title TravelTrustGovernorV9
 * @notice Governor bound to TTG V9 votes token; queues through existing Timelock.
 * @dev Non-proxy. English NatSpec only. KEEP Timelock address on Mainnet; redeploy this Governor only.
 */
contract TravelTrustGovernorV9 {
    ITtgV9GovernanceVotes public immutable token;
    ITtgV9GovernanceTimelock public immutable timelock;
    uint256 public immutable votingDelayBlocks;
    uint256 public immutable votingPeriodBlocks;
    uint256 public immutable proposalThresholdVotes;
    uint256 public immutable quorumNumeratorBps;
    uint256 public immutable maxVotingPowerPerAddressBps;

    uint256 public orderRatingReviewWindowDays;
    uint256 public proposalCount;

    struct ProposalCore {
        address proposer;
        uint256 snapshot;
        uint256 voteStart;
        uint256 voteEnd;
        bool canceled;
        bool executed;
        bytes32 queuedOpId;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
    }

    mapping(uint256 => ProposalCore) public proposals;
    mapping(uint256 => uint8) public proposalTier;
    mapping(uint256 => bytes32) public proposalTypeTags;
    mapping(uint256 => address[]) internal _targets;
    mapping(uint256 => uint256[]) internal _values;
    mapping(uint256 => bytes[]) internal _calldatas;
    mapping(uint256 => string) public proposalDescriptions;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        uint256 snapshotBlock,
        uint256 voteStart,
        uint256 voteEnd,
        string description
    );
    event VoteCast(address indexed voter, uint256 indexed proposalId, uint8 support, uint256 weight);
    event ProposalQueued(uint256 indexed proposalId, bytes32 indexed operationId);
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCanceled(uint256 indexed proposalId);

    error GovUnknownProposal();
    error GovNotProposer();
    error GovWrongLength();
    error GovThreshold();
    error GovBadState();
    error GovSingleOpOnly();
    error GovInvalidReviewWindowDays();
    error GovOnlyTimelock();
    error GovAlreadyVoted();

    constructor(
        ITtgV9GovernanceVotes token_,
        ITtgV9GovernanceTimelock timelock_,
        uint256 votingDelayBlocks_,
        uint256 votingPeriodBlocks_,
        uint256 proposalThresholdVotes_,
        uint256 quorumNumeratorBps_,
        uint256 maxVotingPowerPerAddressBps_,
        uint256 orderRatingReviewWindowDays_
    ) {
        token = token_;
        timelock = timelock_;
        votingDelayBlocks = votingDelayBlocks_;
        votingPeriodBlocks = votingPeriodBlocks_;
        proposalThresholdVotes = proposalThresholdVotes_;
        quorumNumeratorBps = quorumNumeratorBps_;
        maxVotingPowerPerAddressBps = maxVotingPowerPerAddressBps_;
        if (orderRatingReviewWindowDays_ == 0 || orderRatingReviewWindowDays_ > 3660) {
            revert GovInvalidReviewWindowDays();
        }
        orderRatingReviewWindowDays = orderRatingReviewWindowDays_;
    }

    function votingPowerCapDisabled() external view returns (bool) {
        return maxVotingPowerPerAddressBps == 0;
    }

    function setOrderRatingReviewWindowDays(uint256 days_) external {
        if (msg.sender != address(timelock)) revert GovOnlyTimelock();
        if (days_ == 0 || days_ > 3660) revert GovInvalidReviewWindowDays();
        orderRatingReviewWindowDays = days_;
    }

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) external returns (uint256 proposalId) {
        return propose(targets, values, calldatas, description, TtgV9DaoProposalThresholds.TIER_ORDINARY);
    }

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description,
        uint8 tier
    ) public returns (uint256 proposalId) {
        if (targets.length != values.length || values.length != calldatas.length) revert GovWrongLength();
        if (targets.length != 1) revert GovSingleOpOnly();
        uint256 snapshot = block.number - 1;
        uint256 supply = token.getPastTotalSupply(snapshot);
        uint256 need = TtgV9DaoProposalThresholds.requiredVotes(tier, supply);
        if (need < proposalThresholdVotes) need = proposalThresholdVotes;
        uint256 power = token.getPastVotes(msg.sender, snapshot);
        if (power < need) revert GovThreshold();

        proposalId = ++proposalCount;
        uint256 start = block.number + votingDelayBlocks;
        uint256 end = start + votingPeriodBlocks;

        ProposalCore storage p = proposals[proposalId];
        p.proposer = msg.sender;
        p.snapshot = snapshot;
        p.voteStart = start;
        p.voteEnd = end;
        proposalTier[proposalId] = tier;

        _targets[proposalId] = targets;
        _values[proposalId] = values;
        _calldatas[proposalId] = calldatas;
        proposalDescriptions[proposalId] = description;

        emit ProposalCreated(proposalId, msg.sender, snapshot, start, end, description);
    }

    function proposeRemoveCountrySteward(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) external returns (uint256 proposalId) {
        proposalId = propose(targets, values, calldatas, description, TtgV9DaoProposalThresholds.TIER_CORE);
        proposalTypeTags[proposalId] = TtgV9StewardLifecycle.REMOVE_COUNTRY_STEWARD;
    }

    function isRemoveCountryStewardProposal(uint256 proposalId) external view returns (bool) {
        return TtgV9StewardLifecycle.isRemoveProposalType(proposalTypeTags[proposalId]);
    }

    function proposalThresholdForTier(uint8 tier) external view returns (uint256) {
        uint256 supply = token.getPastTotalSupply(block.number - 1);
        uint256 need = TtgV9DaoProposalThresholds.requiredVotes(tier, supply);
        if (need < proposalThresholdVotes) need = proposalThresholdVotes;
        return need;
    }

    function castVote(uint256 proposalId, uint8 support) external returns (uint256 weight) {
        return _castVote(msg.sender, proposalId, support);
    }

    function _castVote(address voter, uint256 proposalId, uint8 support) internal returns (uint256 weight) {
        ProposalCore storage p = proposals[proposalId];
        if (p.proposer == address(0)) revert GovUnknownProposal();
        if (p.canceled || p.executed) revert GovBadState();
        if (block.number < p.voteStart || block.number > p.voteEnd) revert GovBadState();
        if (support > 2) revert GovBadState();
        if (hasVoted[proposalId][voter]) revert GovAlreadyVoted();

        weight = token.getPastVotes(voter, p.snapshot);
        if (weight == 0) revert GovBadState();
        if (maxVotingPowerPerAddressBps > 0) {
            uint256 supply = token.getPastTotalSupply(p.snapshot);
            uint256 maxWeight = (supply * maxVotingPowerPerAddressBps) / 10_000;
            if (weight > maxWeight) weight = maxWeight;
        }

        hasVoted[proposalId][voter] = true;
        if (support == 1) p.forVotes += weight;
        else if (support == 0) p.againstVotes += weight;
        else p.abstainVotes += weight;

        emit VoteCast(voter, proposalId, support, weight);
    }

    function cancel(uint256 proposalId) external {
        ProposalCore storage p = proposals[proposalId];
        if (p.proposer == address(0)) revert GovUnknownProposal();
        if (msg.sender != p.proposer) revert GovNotProposer();
        if (block.number > p.voteEnd) revert GovBadState();
        p.canceled = true;
        emit ProposalCanceled(proposalId);
    }

    function quorumReached(uint256 proposalId) public view returns (bool) {
        ProposalCore storage p = proposals[proposalId];
        uint256 supply = token.getPastTotalSupply(p.snapshot);
        if (supply == 0) return false;
        uint256 need = (supply * quorumNumeratorBps) / 10000;
        return p.forVotes + p.abstainVotes >= need;
    }

    function state(uint256 proposalId) public view returns (TtgV9ProposalState) {
        ProposalCore storage p = proposals[proposalId];
        if (p.proposer == address(0)) revert GovUnknownProposal();
        if (p.canceled) return TtgV9ProposalState.Canceled;
        if (p.executed) return TtgV9ProposalState.Executed;
        if (block.number < p.voteStart) return TtgV9ProposalState.Pending;
        if (block.number <= p.voteEnd) return TtgV9ProposalState.Active;
        if (p.forVotes <= p.againstVotes || !quorumReached(proposalId)) return TtgV9ProposalState.Defeated;
        if (p.queuedOpId == bytes32(0)) return TtgV9ProposalState.Succeeded;
        (, bool done,,,) = timelock.operations(p.queuedOpId);
        if (done) return TtgV9ProposalState.Executed;
        return TtgV9ProposalState.Queued;
    }

    function queue(uint256 proposalId) external returns (bytes32 opId) {
        if (state(proposalId) != TtgV9ProposalState.Succeeded) revert GovBadState();
        address[] storage ts = _targets[proposalId];
        if (ts.length != 1) revert GovSingleOpOnly();
        bytes32 salt = keccak256(abi.encode(proposalId, uint256(0)));
        opId = timelock.scheduleByGovernor(ts[0], _values[proposalId][0], _calldatas[proposalId][0], salt);
        proposals[proposalId].queuedOpId = opId;
        emit ProposalQueued(proposalId, opId);
    }

    function execute(uint256 proposalId) external {
        if (state(proposalId) != TtgV9ProposalState.Queued) revert GovBadState();
        ProposalCore storage p = proposals[proposalId];
        timelock.execute(p.queuedOpId);
        p.executed = true;
        emit ProposalExecuted(proposalId);
    }

    function getProposalActions(uint256 proposalId)
        external
        view
        returns (address[] memory targets, uint256[] memory values, bytes[] memory calldatas)
    {
        targets = _targets[proposalId];
        values = _values[proposalId];
        calldatas = _calldatas[proposalId];
    }

    function version() external pure returns (string memory) {
        return "traveltrust_governor_v9_local";
    }
}
