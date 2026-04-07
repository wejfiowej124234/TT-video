// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../src/GovernanceVotesToken.sol";
import "../src/GovernanceTimelock.sol";
import "../src/TravelTrustGovernor.sol";
import "../src/FeeRouter.sol";

/// **TT-COMP-B089-GOVERNOR-CHAIN-VOTING-001**：Governor 全生命周期 + **`getPastVotes` 快照** + Timelock **queue/execute**。
contract TravelTrustGovernorTest is Test {
    address internal deployer = address(this);
    address internal voter = address(0xA11CE);
    GovernanceVotesToken internal token;
    GovernanceTimelock internal tl;
    TravelTrustGovernor internal gov;
    FeeRouter internal router;

    function setUp() public {
        token = new GovernanceVotesToken(10_000_000e18);
        tl = new GovernanceTimelock(deployer, 100);
        gov = new TravelTrustGovernor(
            IGovernanceVotes(address(token)),
            IGovernanceTimelockForGov(address(tl)),
            1, // votingDelayBlocks
            5, // votingPeriodBlocks
            1e18, // proposalThresholdVotes
            1000 // quorum 10%
        );
        tl.setGovernor(address(gov));

        token.transfer(voter, 5_000_000e18);
        vm.roll(block.number + 3);

        address c0 = makeAddr("c0");
        address s0 = makeAddr("s0");
        address r0 = makeAddr("r0");
        address o0 = makeAddr("o0");
        router = new FeeRouter(deployer, c0, s0, r0, o0);
    }

    function test_COMP_B089_governor_full_cycle_propose_vote_queue_execute() public {
        address newOwner = makeAddr("newOwner");
        bytes memory data = abi.encodeWithSelector(FeeRouter.transferOwnership.selector, newOwner);

        address[] memory targets = new address[](1);
        targets[0] = address(router);
        uint256[] memory values = new uint256[](1);
        values[0] = 0;
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = data;

        vm.prank(voter);
        uint256 pid = gov.propose(targets, values, calldatas, "TT-COMP-B089 transferOwnership");

        assertEq(pid, 1);
        assertEq(uint256(gov.state(pid)), uint256(ProposalState.Pending));

        vm.roll(block.number + 1);
        assertEq(uint256(gov.state(pid)), uint256(ProposalState.Active));

        vm.prank(voter);
        gov.castVote(pid, 1);
        (uint256 fv, uint256 av, uint256 ab) = _votes(pid);
        assertEq(fv, 5_000_000e18);
        assertEq(av, 0);
        assertEq(ab, 0);

        vm.roll(block.number + 6);
        assertEq(uint256(gov.state(pid)), uint256(ProposalState.Succeeded));

        gov.queue(pid);
        assertEq(uint256(gov.state(pid)), uint256(ProposalState.Queued));

        vm.warp(block.timestamp + 100);
        gov.execute(pid);
        assertEq(uint256(gov.state(pid)), uint256(ProposalState.Executed));
        assertEq(router.owner(), newOwner);
    }

    function test_COMP_B089_getPastVotes_matches_cast_weight() public {
        address[] memory targets = new address[](1);
        targets[0] = address(router);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = hex"";

        vm.prank(voter);
        uint256 pid = gov.propose(targets, values, calldatas, "empty op");

        vm.roll(block.number + 1);
        (, uint256 snap, ,,,,,,,) = gov.proposals(pid);
        assertEq(token.getPastVotes(voter, snap), 5_000_000e18);

        vm.prank(voter);
        uint256 w = gov.castVote(pid, 1);
        assertEq(w, 5_000_000e18);
    }

    function test_scheduleByGovernor_reverts_non_governor() public {
        vm.prank(address(0xB0B));
        vm.expectRevert(GovernanceTimelock.OnlyGovernor.selector);
        tl.scheduleByGovernor(address(1), 0, hex"", bytes32(0));
    }

    function _votes(uint256 pid) internal view returns (uint256, uint256, uint256) {
        (,,,,,,, uint256 fv, uint256 av, uint256 ab) = gov.proposals(pid);
        return (fv, av, ab);
    }
}
