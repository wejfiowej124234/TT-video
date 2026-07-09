// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../../src/vacancy/UnallocatedStewardPathVault.sol";
import "../../src/vacancy/VacancyTypes.sol";
import "../../src/vacancy/VacancyErrors.sol";
import "../../src/vacancy/VacancyLedgerLib.sol";
import "../../src/MockERC20.sol";
import "./VacancyTestParams.sol";

/// Sprint 1 · VacancyLedger Core · PCM v1.2 Exit Criteria V-01
contract VacancyLedgerCoreTest is Test {
    bytes2 internal constant J = bytes2("DE");

    address internal owner = makeAddr("owner");
    address internal treasury = makeAddr("treasury");
    address internal ledgerAddr = makeAddr("ledger");
    address internal stewardVault = makeAddr("stewardVault");
    address internal depositor = makeAddr("depositor");
    address internal recipient = makeAddr("recipient");

    MockERC20 internal usdc;
    UnallocatedStewardPathVault internal vault;

    function setUp() public {
        usdc = new MockERC20();
        vault = new UnallocatedStewardPathVault(
            owner,
            J,
            address(usdc),
            ledgerAddr,
            stewardVault,
            treasury,
            VacancyTestParams.ssotV1Defaults()
        );
        vm.prank(owner);
        vault.setDisburseRecipientAllowed(recipient, true);
        usdc.mint(depositor, 10_000_000e6);
        vm.prank(depositor);
        usdc.approve(address(vault), type(uint256).max);
    }

    function test_invariant_VL01_ledgerIdentity_afterDeposit() public {
        vm.prank(depositor);
        vault.depositToReserve(1_000_000e6, 1);
        _assertVL01();
    }

    function test_invariant_VL01_ledgerIdentity_afterDepositSweepDisburse() public {
        vm.prank(depositor);
        vault.depositToReserve(1_000_000e6, 1);

        vm.startPrank(owner);
        VacancyTypes.SweepPlan memory plan = vault.evaluateVacancySweep(1);
        vault.executeSweep(1, plan);
        vault.disburseJurisdictionReserve(100_000e6, recipient, bytes32("prop1"));
        vm.stopPrank();

        _assertVL01();
    }

    function test_depositToReserve_updatesLedgerAndPrincipal() public {
        vm.prank(depositor);
        vault.depositToReserve(500_000e6, 42);

        VacancyTypes.VacancyLedger memory ledger = vault.vacancyLedger();
        assertEq(ledger.principal, 500_000e6);
        assertEq(ledger.reserve, 500_000e6);
        assertEq(ledger.swept, 0);
        assertEq(ledger.disbursed, 0);
        assertEq(vault.totalReceived(), 500_000e6);
        _assertVL01();
    }

    function test_evaluateVacancySweep_pureLinearQuarter() public {
        vm.prank(depositor);
        vault.depositToReserve(1_000_000e6, 1);

        VacancyTypes.SweepPlan memory plan = vault.evaluateVacancySweep(1);
        assertEq(plan.sweepAmount, 250_000e6);
        assertFalse(plan.reserveReached);
        assertFalse(plan.disableSweep);
    }

    function test_executeSweep_transfersToTreasuryAndUpdatesLedger() public {
        vm.prank(depositor);
        vault.depositToReserve(1_000_000e6, 1);

        vm.startPrank(owner);
        VacancyTypes.SweepPlan memory plan = vault.evaluateVacancySweep(1);
        vault.executeSweep(1, plan);
        vm.stopPrank();

        VacancyTypes.VacancyLedger memory ledger = vault.vacancyLedger();
        assertEq(ledger.swept, 250_000e6);
        assertEq(ledger.reserve, 750_000e6);
        assertEq(usdc.balanceOf(treasury), 250_000e6);
        _assertVL01();
    }

    function test_executeSweep_threeQuartersThenReserveReached() public {
        vm.prank(depositor);
        vault.depositToReserve(1_000_000e6, 1);

        vm.startPrank(owner);
        for (uint256 epoch = 1; epoch <= 3; epoch++) {
            VacancyTypes.SweepPlan memory plan = vault.evaluateVacancySweep(epoch);
            vault.executeSweep(epoch, plan);
        }
        vm.stopPrank();

        VacancyTypes.VacancyLedger memory ledger = vault.vacancyLedger();
        assertEq(ledger.swept, 750_000e6);
        assertEq(ledger.reserve, 250_000e6);
        assertFalse(vault.sweepEnabled());
        _assertVL01();
    }

    function test_executeSweep_rejectsTamperedPlan() public {
        vm.prank(depositor);
        vault.depositToReserve(1_000_000e6, 1);

        VacancyTypes.SweepPlan memory bad;
        bad.sweepAmount = 1;

        vm.prank(owner);
        vm.expectRevert(VacancyErrors.InvalidSweepPlan.selector);
        vault.executeSweep(1, bad);
    }

    function test_disburseJurisdictionReserve_onlyOwnerAndVL05() public {
        vm.prank(depositor);
        vault.depositToReserve(1_000_000e6, 1);

        vm.startPrank(owner);
        vault.disburseJurisdictionReserve(200_000e6, recipient, bytes32("dao-prop"));
        vm.stopPrank();

        VacancyTypes.VacancyLedger memory ledger = vault.vacancyLedger();
        assertEq(ledger.disbursed, 200_000e6);
        assertEq(ledger.reserve, 800_000e6);
        assertEq(ledger.principal, 1_000_000e6);
        assertEq(usdc.balanceOf(recipient), 200_000e6);
        _assertVL01();
    }

    function test_disburseJurisdictionReserve_revertsForNonOwner() public {
        vm.prank(depositor);
        vault.depositToReserve(100e6, 1);

        vm.prank(depositor);
        vm.expectRevert(VacancyErrors.OnlyOwner.selector);
        vault.disburseJurisdictionReserve(1, depositor, bytes32("x"));
    }

    function test_depositAfterSweepDisabledStillCreditsReserve() public {
        vm.prank(depositor);
        vault.depositToReserve(1_000_000e6, 1);

        vm.startPrank(owner);
        for (uint256 epoch = 1; epoch <= 3; epoch++) {
            VacancyTypes.SweepPlan memory plan = vault.evaluateVacancySweep(epoch);
            vault.executeSweep(epoch, plan);
        }
        vm.stopPrank();
        assertFalse(vault.sweepEnabled());

        vm.prank(depositor);
        vault.depositToReserve(100_000e6, 99);

        VacancyTypes.VacancyLedger memory ledger = vault.vacancyLedger();
        assertEq(ledger.principal, 1_100_000e6);
        assertEq(ledger.reserve, 350_000e6);
        assertFalse(vault.sweepEnabled());
        _assertVL01();
    }

    function test_setVacancyParams_readsFromStorageNotLiterals() public {
        VacancyTypes.VacancyParams memory custom = VacancyTypes.VacancyParams({
            vacancySweepRateBps: 1000,
            vacancySweepCapBps: 5000,
            jurisdictionReserveBps: 3000,
            vacancyGraceDays: 90,
            vacancySweepAutoReenable: false
        });

        vm.prank(owner);
        vault.setVacancyParams(custom);

        vm.prank(depositor);
        vault.depositToReserve(1_000_000e6, 1);

        VacancyTypes.SweepPlan memory plan = vault.evaluateVacancySweep(1);
        assertEq(plan.sweepAmount, 100_000e6);
    }

    function _assertVL01() internal view {
        VacancyTypes.VacancyLedger memory ledger = vault.vacancyLedger();
        VacancyLedgerLib.assertLedgerIdentity(ledger);
        assertEq(ledger.principal, ledger.swept + ledger.reserve + ledger.disbursed);
    }
}
