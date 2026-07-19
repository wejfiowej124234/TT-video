// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../src/GovernanceVotesToken.sol";
import "../src/GovernanceTimelock.sol";
import "../src/TravelTrustGovernor.sol";
import "../src/V311DaoProposalThresholds.sol";

/**
 * @title D03Gov01DaoThresholdsV311Test
 * @notice Phase A · Gap D-03 / GOV-01 · Local Verify（①）
 */
contract D03Gov01DaoThresholdsV311Test is Test {
    GovernanceVotesToken internal token;
    GovernanceTimelock internal tl;
    TravelTrustGovernor internal gov;
    address internal voter = address(0xA11CE);

    function setUp() public {
        // 10M supply · ordinary need = min(max(0.5%=50k, 5k), 50k) = 50k
        token = new GovernanceVotesToken(10_000_000 ether, address(0));
        tl = new GovernanceTimelock(address(this), 100);
        gov = new TravelTrustGovernor(
            IGovernanceVotes(address(token)),
            IGovernanceTimelockForGov(address(tl)),
            1,
            5,
            1 ether, // immutable floor (below V3.1.1 ordinary)
            1000,
            0,
            14
        );
        tl.setGovernor(address(gov));
        token.transfer(voter, 60_000 ether);
        vm.roll(block.number + 3);
    }

    function test_D03_ordinary_threshold_matches_v311() public view {
        assertEq(
            gov.proposalThresholdForTier(V311DaoProposalThresholds.TIER_ORDINARY),
            50_000 ether
        );
        assertEq(
            gov.proposalThresholdForTier(V311DaoProposalThresholds.TIER_IMPORTANT),
            100_000 ether
        );
        assertEq(gov.proposalThresholdForTier(V311DaoProposalThresholds.TIER_CORE), 200_000 ether);
    }

    function test_GOV01_propose_ordinary_ok_important_reverts() public {
        address[] memory targets = new address[](1);
        targets[0] = address(tl);
        uint256[] memory values = new uint256[](1);
        values[0] = 0;
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = hex"00";

        vm.prank(voter);
        uint256 pid = gov.propose(
            targets,
            values,
            calldatas,
            "ordinary",
            V311DaoProposalThresholds.TIER_ORDINARY
        );
        assertEq(pid, 1);
        assertEq(gov.proposalTier(pid), V311DaoProposalThresholds.TIER_ORDINARY);

        vm.prank(voter);
        vm.expectRevert(TravelTrustGovernor.GovThreshold.selector);
        gov.propose(
            targets,
            values,
            calldatas,
            "important",
            V311DaoProposalThresholds.TIER_IMPORTANT
        );
    }
}
