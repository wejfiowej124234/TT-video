// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../src/GovernanceVotesToken.sol";
import "../src/GovernanceTimelock.sol";
import "../src/TravelTrustGovernor.sol";
import "../src/FeeRouter.sol";

/// **TT-COMP-B089-GOVERNOR-CHAIN-VOTING-001**：Governor 全生命周期 + **`getPastVotes` 快照** + Timelock **`scheduleByGovernor` / execute**（**`FeeRouter`** **`owner` = Timelock** 与生产一致）。
contract TravelTrustGovernorTest is Test {
    address internal deployer = address(this);
    address internal voter = address(0xA11CE);
    GovernanceVotesToken internal token;
    GovernanceTimelock internal tl;
    TravelTrustGovernor internal gov;
    FeeRouter internal router;

    function setUp() public {
        token = new GovernanceVotesToken(10_000_000e18, address(0));
        tl = new GovernanceTimelock(deployer, 100);
        gov = new TravelTrustGovernor(
            IGovernanceVotes(address(token)),
            IGovernanceTimelockForGov(address(tl)),
            1, // votingDelayBlocks
            5, // votingPeriodBlocks
            1e18, // proposalThresholdVotes
            1000, // quorum 10%
            0, // maxVotingPowerPerAddressBps · 0 = legacy tests uncapped
            14 // orderRatingReviewWindowDays (TT-B110)
        );
        tl.setGovernor(address(gov));

        token.transfer(voter, 5_000_000e18);
        vm.roll(block.number + 3);

        address c0 = makeAddr("c0");
        address s0 = makeAddr("s0");
        address r0 = makeAddr("r0");
        address o0 = makeAddr("o0");
        router = new FeeRouter(deployer, c0, s0, r0, o0);
        router.transferOwnership(address(tl));
        tl.setAllowedExecutionTarget(address(router), true);
        tl.setAllowedExecutionTarget(address(gov), true);
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

    /// **TT-B089-GOVERNOR-SET-ROUTING-CONFIG-PAYLOAD-001**：**Succeeded → `queue`（`scheduleByGovernor`）→ delay → `execute`** 后 **`FeeRouter`** 读数与提案 **calldata** 一致（补 Governor 链上 **热改路由** 一层；Timelock 直连见 **`GovernanceTimelock.t.sol`**）。
    function test_TT_B089_governor_execute_set_routing_config_matches_payload() public {
        address c1 = makeAddr("bucket1");
        address s1 = makeAddr("stakers1");
        address r1 = makeAddr("reserve1");
        address o1 = makeAddr("ops1");
        uint256 b0 = 4000;
        uint256 b1 = 3000;
        uint256 b2 = 2000;
        uint256 b3 = 1000;

        bytes memory data = abi.encodeWithSelector(
            FeeRouter.setRoutingConfig.selector, c1, s1, r1, o1, b0, b1, b2, b3
        );

        address[] memory targets = new address[](1);
        targets[0] = address(router);
        uint256[] memory values = new uint256[](1);
        values[0] = 0;
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = data;

        vm.prank(voter);
        uint256 pid = gov.propose(targets, values, calldatas, "TT-B089 setRoutingConfig");

        vm.roll(block.number + 1);
        vm.prank(voter);
        gov.castVote(pid, 1);
        vm.roll(block.number + 6);
        assertEq(uint256(gov.state(pid)), uint256(ProposalState.Succeeded));

        gov.queue(pid);
        vm.warp(block.timestamp + 100);
        gov.execute(pid);

        assertEq(router.countryBucket(), c1);
        assertEq(router.globalStakers(), s1);
        assertEq(router.globalReserve(), r1);
        assertEq(router.globalOps(), o1);
        assertEq(router.BPS_COUNTRY(), b0);
        assertEq(router.BPS_GLOBAL_STAKERS(), b1);
        assertEq(router.BPS_GLOBAL_RESERVE(), b2);
        assertEq(router.BPS_GLOBAL_OPS(), b3);
    }

    /// **TT-B431-GOV-EXECUTE-CHAIN-READ-PAYLOAD-ALIGN-001**：`queue`→`execute` 后 **`getProposalActions`**、**`GovernanceTimelock.operations(queuedOpId)`** 与提案 **calldata** 字段级一致，且 **FeeRouter** 读数与 **payload** 解码一致（Foundry SSOT；**不**新增 ABI；**不**替代 **B-417** 测试网封口）。
    function test_B431_governor_execute_chain_reads_match_payload_and_timelock_operation() public {
        (uint256 pid, bytes32 queuedOpId, B431SetRoutingExpect memory exp) = _b431_propose_vote_queue();
        _b431_execute_and_assert_alignment(pid, queuedOpId, exp);
    }

    struct B431SetRoutingExpect {
        address c1;
        address s1;
        address r1;
        address o1;
        uint256 b0;
        uint256 b1;
        uint256 b2;
        uint256 b3;
    }

    function _b431_propose_vote_queue()
        internal
        returns (uint256 pid, bytes32 queuedOpId, B431SetRoutingExpect memory exp)
    {
        exp = B431SetRoutingExpect({
            c1: makeAddr("b431_bucket"),
            s1: makeAddr("b431_stakers"),
            r1: makeAddr("b431_reserve"),
            o1: makeAddr("b431_ops"),
            b0: 4000,
            b1: 3000,
            b2: 2000,
            b3: 1000
        });

        bytes memory data = abi.encodeWithSelector(
            FeeRouter.setRoutingConfig.selector,
            exp.c1,
            exp.s1,
            exp.r1,
            exp.o1,
            exp.b0,
            exp.b1,
            exp.b2,
            exp.b3
        );

        address[] memory targets = new address[](1);
        targets[0] = address(router);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = data;

        vm.prank(voter);
        pid = gov.propose(targets, values, calldatas, "TT-B431 payload align");

        vm.roll(block.number + 1);
        vm.prank(voter);
        gov.castVote(pid, 1);
        vm.roll(block.number + 6);
        assertEq(uint256(gov.state(pid)), uint256(ProposalState.Succeeded));

        gov.queue(pid);
        assertEq(uint256(gov.state(pid)), uint256(ProposalState.Queued));

        (,,,,,, queuedOpId,,,) = gov.proposals(pid);
        assertTrue(queuedOpId != bytes32(0));
    }

    function _b431_execute_and_assert_alignment(uint256 pid, bytes32 queuedOpId, B431SetRoutingExpect memory exp)
        internal
    {
        (, bool doneBefore,,,) = tl.operations(queuedOpId);
        assertFalse(doneBefore);

        vm.warp(block.timestamp + 100);
        gov.execute(pid);
        assertEq(uint256(gov.state(pid)), uint256(ProposalState.Executed));

        (, bool doneAfter,,,) = tl.operations(queuedOpId);
        assertTrue(doneAfter);

        (address[] memory gaT, uint256[] memory gaV, bytes[] memory gaC) = gov.getProposalActions(pid);
        assertEq(gaT.length, 1);
        assertEq(gaT[0], address(router));
        assertEq(gaV[0], 0);
        (, , address opTarget, uint256 opValue, bytes memory opData) = tl.operations(queuedOpId);
        assertEq(opTarget, gaT[0]);
        assertEq(opValue, gaV[0]);
        assertEq(keccak256(opData), keccak256(gaC[0]));

        assertEq(router.countryBucket(), exp.c1);
        assertEq(router.globalStakers(), exp.s1);
        assertEq(router.globalReserve(), exp.r1);
        assertEq(router.globalOps(), exp.o1);
        assertEq(router.BPS_COUNTRY(), exp.b0);
        assertEq(router.BPS_GLOBAL_STAKERS(), exp.b1);
        assertEq(router.BPS_GLOBAL_RESERVE(), exp.b2);
        assertEq(router.BPS_GLOBAL_OPS(), exp.b3);
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

    /// **TT-B110-SEQ2-ORDERS-DEADLINE-GOVERNANCE-CHAIN-READ-001**：Governor **`orderRatingReviewWindowDays`** 链上只读与后端 **`eth_call`** 同源。
    function test_TT_B110_order_rating_review_window_days_initial() public {
        assertEq(gov.orderRatingReviewWindowDays(), 14);
    }
}
