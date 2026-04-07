// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/// @title TravelTrustGovernor
/// @notice **B-089 Completion**：提案 / 投票 / **quorum** / **threshold** / **快照 `getPastVotes`**；**Succeeded → queue（Timelock）→ delay → execute**。
interface IGovernanceVotes {
    function getPastVotes(address account, uint256 blockNumber) external view returns (uint256);

    function getPastTotalSupply(uint256 blockNumber) external view returns (uint256);
}

interface IGovernanceTimelockForGov {
    function scheduleByGovernor(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 salt
    ) external returns (bytes32);

    function execute(bytes32 id) external;

    function operations(bytes32)
        external
        view
        returns (uint256 readyAt, bool done, address target, uint256 value, bytes memory data);
}

enum ProposalState {
    Pending,
    Active,
    Canceled,
    Defeated,
    Succeeded,
    Queued,
    Executed
}

contract TravelTrustGovernor {
    IGovernanceVotes public immutable token;
    IGovernanceTimelockForGov public immutable timelock;
    uint256 public immutable votingDelayBlocks;
    uint256 public immutable votingPeriodBlocks;
    uint256 public immutable proposalThresholdVotes;
    /// @notice **quorum**：**`(for+abstain) >= supply@snapshot * quorumNumeratorBps / 10000`**
    uint256 public immutable quorumNumeratorBps;

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
    mapping(uint256 => address[]) internal _targets;
    mapping(uint256 => uint256[]) internal _values;
    mapping(uint256 => bytes[]) internal _calldatas;
    mapping(uint256 => string) public proposalDescriptions;

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

    constructor(
        IGovernanceVotes token_,
        IGovernanceTimelockForGov timelock_,
        uint256 votingDelayBlocks_,
        uint256 votingPeriodBlocks_,
        uint256 proposalThresholdVotes_,
        uint256 quorumNumeratorBps_
    ) {
        token = token_;
        timelock = timelock_;
        votingDelayBlocks = votingDelayBlocks_;
        votingPeriodBlocks = votingPeriodBlocks_;
        proposalThresholdVotes = proposalThresholdVotes_;
        quorumNumeratorBps = quorumNumeratorBps_;
    }

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) external returns (uint256 proposalId) {
        if (targets.length != values.length || values.length != calldatas.length) revert GovWrongLength();
        require(targets.length >= 1, "empty proposal");
        uint256 power = token.getPastVotes(msg.sender, block.number - 1);
        if (power < proposalThresholdVotes) revert GovThreshold();

        proposalId = ++proposalCount;
        uint256 snapshot = block.number - 1;
        uint256 start = block.number + votingDelayBlocks;
        uint256 end = start + votingPeriodBlocks;

        ProposalCore storage p = proposals[proposalId];
        p.proposer = msg.sender;
        p.snapshot = snapshot;
        p.voteStart = start;
        p.voteEnd = end;

        _targets[proposalId] = targets;
        _values[proposalId] = values;
        _calldatas[proposalId] = calldatas;
        proposalDescriptions[proposalId] = description;

        emit ProposalCreated(proposalId, msg.sender, snapshot, start, end, description);
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

        weight = token.getPastVotes(voter, p.snapshot);
        if (weight == 0) revert GovBadState();

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

    function state(uint256 proposalId) public view returns (ProposalState) {
        ProposalCore storage p = proposals[proposalId];
        if (p.proposer == address(0)) revert GovUnknownProposal();
        if (p.canceled) return ProposalState.Canceled;
        if (p.executed) return ProposalState.Executed;
        if (block.number <= p.voteStart) return ProposalState.Pending;
        if (block.number <= p.voteEnd) return ProposalState.Active;
        if (p.forVotes <= p.againstVotes || !quorumReached(proposalId)) return ProposalState.Defeated;
        if (p.queuedOpId == bytes32(0)) return ProposalState.Succeeded;
        (, bool done,,,) = timelock.operations(p.queuedOpId);
        if (done) return ProposalState.Executed;
        return ProposalState.Queued;
    }

    /// @dev **MVP**：每提案 **单条** timelock 操作（`targets.length == 1`）。
    function queue(uint256 proposalId) external returns (bytes32 opId) {
        if (state(proposalId) != ProposalState.Succeeded) revert GovBadState();
        address[] storage ts = _targets[proposalId];
        if (ts.length != 1) revert GovSingleOpOnly();
        bytes32 salt = keccak256(abi.encode(proposalId, uint256(0)));
        opId = timelock.scheduleByGovernor(ts[0], _values[proposalId][0], _calldatas[proposalId][0], salt);
        proposals[proposalId].queuedOpId = opId;
        emit ProposalQueued(proposalId, opId);
    }

    function execute(uint256 proposalId) external {
        if (state(proposalId) != ProposalState.Queued) revert GovBadState();
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
}
