// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../../src/CountryPoolNetProfitLedger.sol";
import "../../src/StewardPathVault.sol";
import "../../src/vacancy/UnallocatedStewardPathVault.sol";
import "../../src/vacancy/VacancyTypes.sol";
import "../../src/vacancy/VacancyErrors.sol";
import "../../src/vacancy/VacancyEvents.sol";
import "../../src/vacancy/VacancyLedgerLib.sol";
import "../../src/RegionStewardStakePool.sol";
import "../../src/GovernanceVotesToken.sol";
import "../../src/GovernanceTimelock.sol";
import "../../src/CountryPoolNetProfitGovernancePayload.sol";
import "../../src/MockERC20.sol";
import "./VacancyTestParams.sol";

/// Sprint 3c · Jurisdiction Reserve DAO Disbursement (G-04 · VL-05 · no Indexer/Dashboard/API).
contract CountryPoolNetProfitVacancyS3cTest is Test, VacancyEvents {
    bytes32 internal constant ACCT_R100 = bytes32("R-100");
    bytes2 internal constant J = bytes2("DE");

    address internal owner = makeAddr("owner");
    address internal treasury = makeAddr("treasury");
    address internal funding = makeAddr("funding");
    address internal steward = makeAddr("steward");
    address internal restrictedTreasury = makeAddr("restrictedTreasury");

    MockERC20 internal usdc;
    RegionStewardStakePool internal stakePool;
    StewardPathVault internal stewardVault;
    UnallocatedStewardPathVault internal unallocVault;
    CountryPoolNetProfitLedger internal ledger;
    GovernanceTimelock internal tl;

    uint32 internal constant TEST_GRACE_DAYS = 7;

    function setUp() public {
        usdc = new MockERC20();
        GovernanceVotesToken ttg = new GovernanceVotesToken(1_000_000_000e18, address(0));
        stakePool = new RegionStewardStakePool(owner, address(ttg), 1_000_000_000e18, 7 days, 14 days);
        vm.prank(owner);
        stakePool.configureJurisdiction(J, 400);

        ttg.transfer(steward, stakePool.minStakeAmount(J));
        vm.startPrank(steward);
        ttg.approve(address(stakePool), type(uint256).max);
        stakePool.stake(J, stakePool.minStakeAmount(J), bytes32("app1"));
        vm.stopPrank();

        uint256 n = vm.getNonce(address(this));
        address predictedLedger = vm.computeCreateAddress(address(this), n + 2);

        stewardVault = new StewardPathVault(owner, J, address(usdc), predictedLedger);
        unallocVault = new UnallocatedStewardPathVault(
            owner, J, address(usdc), predictedLedger, address(stewardVault), treasury, _shortGraceParams()
        );
        ledger = new CountryPoolNetProfitLedger(
            owner,
            J,
            address(usdc),
            address(stewardVault),
            address(unallocVault),
            treasury,
            address(stakePool),
            15 days,
            4500,
            5500
        );
        assertEq(address(ledger), predictedLedger);

        tl = new GovernanceTimelock(owner, 1 days);

        vm.startPrank(owner);
        ledger.setFundingSource(funding);
        ledger.setSettlementParams(1, 4500, 5500, treasury, funding);
        unallocVault.transferOwnership(address(tl));
        tl.setAllowedExecutionTarget(address(unallocVault), true);
        vm.stopPrank();

        _allowRecipientViaTimelock(restrictedTreasury);
    }

    function test_only_governance_can_disburse() public {
        _splitIneligible(1, 1_500_000e6);
        uint256 amount = 200_000e6;
        VacancyTypes.VacancyLedger memory before = unallocVault.vacancyLedger();
        assertGe(before.reserve, amount);

        vm.prank(steward);
        vm.expectRevert(VacancyErrors.OnlyOwner.selector);
        unallocVault.disburseJurisdictionReserve(amount, restrictedTreasury, bytes32("direct"));

        _disburseViaTimelock(amount, restrictedTreasury, bytes32("govDisburse"));

        assertEq(usdc.balanceOf(restrictedTreasury), amount);
        VacancyLedgerLib.assertLedgerIdentity(unallocVault.vacancyLedger());
    }

    function test_disburse_preserves_principal() public {
        _splitIneligible(1, 1_200_000e6);
        VacancyTypes.VacancyLedger memory before = unallocVault.vacancyLedger();
        uint256 amount = 150_000e6;

        _disburseViaTimelock(amount, restrictedTreasury, bytes32("preservePrincipal"));

        VacancyTypes.VacancyLedger memory afterDisburse = unallocVault.vacancyLedger();
        assertEq(afterDisburse.principal, before.principal);
        assertEq(afterDisburse.swept, before.swept);
        VacancyLedgerLib.assertLedgerIdentity(afterDisburse);
    }

    function test_disburse_updates_reserve() public {
        _splitIneligible(1, 1_000_000e6);
        VacancyTypes.VacancyLedger memory before = unallocVault.vacancyLedger();
        uint256 amount = 100_000e6;

        _disburseViaTimelock(amount, restrictedTreasury, bytes32("updateReserve"));

        VacancyTypes.VacancyLedger memory afterDisburse = unallocVault.vacancyLedger();
        assertEq(afterDisburse.reserve, before.reserve - amount);
        assertEq(afterDisburse.disbursed, before.disbursed + amount);
        VacancyLedgerLib.assertLedgerIdentity(afterDisburse);
    }

    function test_disburse_emits_event() public {
        _splitIneligible(1, 800_000e6);
        uint256 amount = 50_000e6;
        VacancyTypes.VacancyLedger memory before = unallocVault.vacancyLedger();

        bytes memory data =
            CountryPoolNetProfitGovernancePayload.encodeDisburseJurisdictionReserve(
                amount, restrictedTreasury, bytes32("emitEvt")
            );
        vm.prank(owner);
        bytes32 opId = tl.schedule(address(unallocVault), 0, data, bytes32("emitEvt"));
        vm.warp(block.timestamp + 1 days);

        vm.expectEmit(true, true, false, true);
        emit JurisdictionReserveDisbursed(
            1,
            J,
            amount,
            restrictedTreasury,
            bytes32("emitEvt"),
            before.principal,
            before.reserve - amount,
            before.swept,
            before.disbursed + amount
        );
        tl.execute(opId);
    }

    function test_steward_cannot_claim_reserve() public {
        _splitIneligible(1, 900_000e6);
        uint256 amount = unallocVault.vacancyLedger().reserve;

        vm.prank(steward);
        vm.expectRevert(VacancyErrors.OnlyOwner.selector);
        unallocVault.disburseJurisdictionReserve(amount, steward, bytes32("steal"));

        vm.prank(address(tl));
        vm.expectRevert(VacancyErrors.ProhibitedDisburseRecipient.selector);
        unallocVault.disburseJurisdictionReserve(amount, address(stewardVault), bytes32("toStewardVault"));

        assertEq(usdc.balanceOf(address(stewardVault)), 0);
        VacancyLedgerLib.assertLedgerIdentity(unallocVault.vacancyLedger());
    }

    function test_disburse_revertsForNonAllowlistedRecipient() public {
        _splitIneligible(1, 500_000e6);
        address outsider = makeAddr("outsider");

        vm.prank(address(tl));
        vm.expectRevert(VacancyErrors.RecipientNotAllowed.selector);
        unallocVault.disburseJurisdictionReserve(10_000e6, outsider, bytes32("noAllow"));
    }

    function _shortGraceParams() internal pure returns (VacancyTypes.VacancyParams memory) {
        VacancyTypes.VacancyParams memory p = VacancyTestParams.ssotV1Defaults();
        p.vacancyGraceDays = TEST_GRACE_DAYS;
        return p;
    }

    function _allowRecipientViaTimelock(address recipient) internal {
        bytes memory data = CountryPoolNetProfitGovernancePayload.encodeSetDisburseRecipientAllowed(recipient, true);
        vm.prank(owner);
        bytes32 opId = tl.schedule(address(unallocVault), 0, data, keccak256(abi.encodePacked("allow", recipient)));
        vm.warp(block.timestamp + 1 days);
        tl.execute(opId);
        assertTrue(unallocVault.disburseRecipientAllowed(recipient));
    }

    function _disburseViaTimelock(uint256 amount, address recipient, bytes32 proposalRef) internal {
        bytes memory data =
            CountryPoolNetProfitGovernancePayload.encodeDisburseJurisdictionReserve(amount, recipient, proposalRef);
        vm.prank(owner);
        bytes32 opId = tl.schedule(address(unallocVault), 0, data, proposalRef);
        vm.warp(block.timestamp + 1 days);
        tl.execute(opId);
    }

    function _splitIneligible(uint256 epochId, uint256 profit) internal {
        vm.startPrank(owner);
        ledger.openEpoch(
            epochId, uint64(block.timestamp), uint64(block.timestamp + 1 days)
        );
        ledger.recordAccrual(epochId, ACCT_R100, int256(profit), bytes32(uint256(epochId)));
        vm.stopPrank();

        vm.warp(block.timestamp + 1 days + 2);

        vm.prank(owner);
        ledger.closeEpoch(epochId);

        usdc.mint(funding, profit);
        vm.startPrank(funding);
        usdc.approve(address(ledger), profit);
        vm.stopPrank();

        vm.startPrank(owner);
        ledger.fundLedgerForSplit(epochId);
        ledger.splitNetProfit(epochId);
        vm.stopPrank();
    }
}
