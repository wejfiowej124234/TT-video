// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../src/V311RecoveryBudget.sol";
import "../src/V311StewardLifecycle.sol";
import "../src/GovernanceVotesToken.sol";
import "../src/GovernanceTimelock.sol";
import "../src/TravelTrustGovernor.sol";

contract S03C01C02RecoveryBudgetV311Test is Test {
    function test_S03_payout_blocked_without_budget() public {
        V311RecoveryBudget.Budget memory b;
        assertTrue(V311RecoveryBudget.canRegisterInventory(b));
        assertFalse(V311RecoveryBudget.canExecutePayout(b, 1));
        vm.expectRevert(V311RecoveryBudget.BudgetNotConfigured.selector);
        this._requirePayout(b, 1);
    }

    function test_C01_configured_budget_allows_within_limit() public pure {
        V311RecoveryBudget.Budget memory b =
            V311RecoveryBudget.Budget({configured: true, remainingUsdcOrUnits: 1000e6});
        assertTrue(V311RecoveryBudget.canExecutePayout(b, 500e6));
        assertFalse(V311RecoveryBudget.canExecutePayout(b, 1001e6));
    }

    function _requirePayout(V311RecoveryBudget.Budget memory b, uint256 amount) external pure {
        V311RecoveryBudget.requirePayout(b, amount);
    }
}

contract S04D04Gov02StewardLifecycleV311Test is Test {
    function test_S04_inactive_180_and_transitions() public pure {
        assertEq(V311StewardLifecycle.INACTIVE_DAYS, 180);
        assertTrue(
            V311StewardLifecycle.canTransition(
                V311StewardLifecycle.State.ACTIVE, V311StewardLifecycle.State.INACTIVE
            )
        );
        assertTrue(
            V311StewardLifecycle.canTransition(
                V311StewardLifecycle.State.ACTIVE, V311StewardLifecycle.State.REMOVED
            )
        );
        assertFalse(
            V311StewardLifecycle.canTransition(
                V311StewardLifecycle.State.REMOVED, V311StewardLifecycle.State.ACTIVE
            )
        );
    }

    function test_D04_GOV02_remove_proposal_type_tag() public pure {
        assertTrue(V311StewardLifecycle.isRemoveProposalType(keccak256("REMOVE_COUNTRY_STEWARD")));
        assertFalse(V311StewardLifecycle.isRemoveProposalType(keccak256("OTHER")));
    }
}

contract D04Gov02RemoveProposeV311Test is Test {
    GovernanceVotesToken internal token;
    GovernanceTimelock internal tl;
    TravelTrustGovernor internal gov;
    address internal voter = address(0xB0B);

    function setUp() public {
        token = new GovernanceVotesToken(10_000_000 ether, address(0));
        tl = new GovernanceTimelock(address(this), 100);
        gov = new TravelTrustGovernor(
            IGovernanceVotes(address(token)),
            IGovernanceTimelockForGov(address(tl)),
            1,
            5,
            1 ether,
            1000,
            0,
            14
        );
        tl.setGovernor(address(gov));
        token.transfer(voter, 250_000 ether);
        vm.roll(block.number + 3);
    }

    function test_GOV02_proposeRemoveCountrySteward_tags() public {
        address[] memory targets = new address[](1);
        targets[0] = address(tl);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = hex"00";
        vm.prank(voter);
        uint256 pid = gov.proposeRemoveCountrySteward(targets, values, calldatas, "remove JP steward");
        assertTrue(gov.isRemoveCountryStewardProposal(pid));
        assertEq(gov.proposalTier(pid), 2);
    }
}
