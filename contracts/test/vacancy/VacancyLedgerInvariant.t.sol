// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "forge-std/StdInvariant.sol";
import "../../src/vacancy/VacancyTypes.sol";
import "../../src/vacancy/VacancyErrors.sol";
import "./VacancyTestParams.sol";
import "./fixtures/VacancyInvariantFixture.sol";
import {VacancyInvariantChecks} from "./fixtures/VacancyInvariantFixture.sol";
import "../../src/vacancy/UnallocatedStewardPathVault.sol";
import "./handlers/VacancyLedgerHandler.sol";

/// @title VacancyLedgerInvariant
/// @notice Sprint 2 · G22-D-05 · prove VL-01～VL-05 under arbitrary sequences (no Ledger/Settlement/API).
contract VacancyLedgerInvariant is Test, VacancyInvariantFixture {
    VacancyLedgerHandler internal handler;

    function setUp() public {
        handler = new VacancyLedgerHandler();
        targetContract(address(handler));
    }

    function invariant_VL01_ledgerIdentity() public view {
        VacancyInvariantChecks.checkVL01(_handlerLedger());
    }

    function invariant_VL02_nonNegative() public view {
        VacancyInvariantChecks.checkVL02(_handlerLedger());
    }

    function invariant_VL03_sweepCap() public view {
        VacancyInvariantChecks.checkVL03(_handlerLedger(), _handlerParams());
    }

    function invariant_VL04_reserveFloor() public view {
        VacancyInvariantChecks.checkVL04(_handlerLedger(), _handlerParams(), handler.getVault().sweepEnabled());
    }

    function invariant_VL05_disburseOnlyGov() public view {
        VacancyInvariantChecks.checkVL05(_handlerLedger(), handler.ghostDisbursed());
    }

    function invariant_SM03_noAutoReenableAfterDisable() public view {
        if (!handler.sweepDisabledObserved()) return;
        if (!handler.getVault().sweepEnabled()) {
            VacancyTypes.SweepPlan memory plan = handler.getVault().evaluateVacancySweep(handler.epochCounter());
            assertEq(plan.sweepAmount, 0);
        }
    }

    function test_boundary_zeroDepositReverts() public {
        _deployVaultDefaults();
        vm.prank(depositor);
        usdc.approve(address(vault), type(uint256).max);
        vm.prank(depositor);
        vm.expectRevert(VacancyErrors.InvalidAmount.selector);
        vault.depositToReserve(0, 1);
    }

    function test_boundary_zeroDisburseReverts() public {
        _deployVaultDefaults();
        _allowDefaultDisburseRecipient();
        vm.prank(depositor);
        usdc.approve(address(vault), type(uint256).max);
        vm.prank(depositor);
        vault.depositToReserve(1_000e6, 1);
        vm.prank(owner);
        vm.expectRevert(VacancyErrors.InvalidAmount.selector);
        vault.disburseJurisdictionReserve(0, recipient, bytes32("x"));
    }

    function test_boundary_insufficientReserveDisburseReverts() public {
        _deployVaultDefaults();
        _allowDefaultDisburseRecipient();
        vm.prank(depositor);
        usdc.approve(address(vault), type(uint256).max);
        vm.prank(depositor);
        vault.depositToReserve(1_000e6, 1);
        vm.prank(owner);
        vm.expectRevert(VacancyErrors.InsufficientReserve.selector);
        vault.disburseJurisdictionReserve(1_001e6, recipient, bytes32("x"));
    }

    function test_boundary_invalidParams_rateOverBps() public {
        _deployVaultDefaults();
        VacancyTypes.VacancyParams memory bad = VacancyTestParams.ssotV1Defaults();
        bad.vacancySweepRateBps = 10_001;
        vm.prank(owner);
        vm.expectRevert(VacancyErrors.InvalidGovernanceParameter.selector);
        vault.setVacancyParams(bad);
    }

    function test_boundary_invalidParams_capPlusReserveOverBps() public {
        _deployVaultDefaults();
        VacancyTypes.VacancyParams memory bad = VacancyTypes.VacancyParams({
            vacancySweepRateBps: 1000,
            vacancySweepCapBps: 8000,
            jurisdictionReserveBps: 3000,
            vacancyGraceDays: 180,
            vacancySweepAutoReenable: false
        });
        vm.prank(owner);
        vm.expectRevert(VacancyErrors.InvalidGovernanceParameter.selector);
        vault.setVacancyParams(bad);
    }

    function test_boundary_invalidParams_zeroGraceDays() public {
        _deployVaultDefaults();
        VacancyTypes.VacancyParams memory bad = VacancyTestParams.ssotV1Defaults();
        bad.vacancyGraceDays = 0;
        vm.prank(owner);
        vm.expectRevert(VacancyErrors.InvalidGovernanceParameter.selector);
        vault.setVacancyParams(bad);
    }

    function test_boundary_disburseZeroRecipientReverts() public {
        _deployVaultDefaults();
        vm.prank(depositor);
        usdc.approve(address(vault), type(uint256).max);
        vm.prank(depositor);
        vault.depositToReserve(1_000e6, 1);
        vm.prank(owner);
        vm.expectRevert(VacancyErrors.InvalidAddress.selector);
        vault.disburseJurisdictionReserve(100e6, address(0), bytes32("x"));
    }

    function test_boundary_nonOwnerDisburseReverts() public {
        _deployVaultDefaults();
        vm.prank(depositor);
        usdc.approve(address(vault), type(uint256).max);
        vm.prank(depositor);
        vault.depositToReserve(1_000e6, 1);
        vm.prank(depositor);
        vm.expectRevert(VacancyErrors.OnlyOwner.selector);
        vault.disburseJurisdictionReserve(1, recipient, bytes32("x"));
    }

    function test_boundary_invalidParams_incompatibleAfterSweepReverts() public {
        _deployVaultDefaults();
        vm.prank(depositor);
        usdc.approve(address(vault), type(uint256).max);
        vm.prank(depositor);
        vault.depositToReserve(1_000_000e6, 1);

        vm.startPrank(owner);
        for (uint256 i = 0; i < 3; i++) {
            VacancyTypes.SweepPlan memory plan = vault.evaluateVacancySweep(i);
            vault.executeSweep(i, plan);
        }

        VacancyTypes.VacancyParams memory bad = VacancyTypes.VacancyParams({
            vacancySweepRateBps: 1000,
            vacancySweepCapBps: 1000,
            jurisdictionReserveBps: 500,
            vacancyGraceDays: 90,
            vacancySweepAutoReenable: false
        });
        vm.expectRevert(VacancyErrors.InvalidGovernanceParameter.selector);
        vault.setVacancyParams(bad);
        vm.stopPrank();
    }

    function test_U08_noSweepBelowFloor() public {
        _deployVaultDefaults();
        vm.prank(depositor);
        usdc.approve(address(vault), type(uint256).max);
        vm.prank(depositor);
        vault.depositToReserve(1_000_000e6, 1);

        vm.startPrank(owner);
        for (uint256 i = 0; i < 4; i++) {
            VacancyTypes.SweepPlan memory plan = vault.evaluateVacancySweep(i);
            vault.executeSweep(i, plan);
            VacancyTypes.VacancyLedger memory snap = _ledger();
            VacancyInvariantChecks.checkVL01(snap);
            VacancyInvariantChecks.checkVL03(snap, _params());
            VacancyInvariantChecks.checkVL04(snap, _params(), vault.sweepEnabled());
        }
        vm.stopPrank();

        VacancyTypes.VacancyLedger memory ledger = _ledger();
        assertEq(ledger.swept, _capLimit(ledger, _params()));
        assertFalse(vault.sweepEnabled());
    }

    function test_SM03_sweepDisabledUntilExplicitReenable() public {
        _deployVaultDefaults();
        vm.prank(depositor);
        usdc.approve(address(vault), type(uint256).max);
        vm.prank(depositor);
        vault.depositToReserve(1_000_000e6, 1);

        vm.startPrank(owner);
        for (uint256 i = 0; i < 3; i++) {
            VacancyTypes.SweepPlan memory plan = vault.evaluateVacancySweep(i);
            vault.executeSweep(i, plan);
        }
        vm.stopPrank();
        assertFalse(vault.sweepEnabled());

        vm.prank(depositor);
        vault.depositToReserve(500_000e6, 2);
        assertFalse(vault.sweepEnabled());

        VacancyTypes.SweepPlan memory planAfterDeposit = vault.evaluateVacancySweep(99);
        assertEq(planAfterDeposit.sweepAmount, 0);

        vm.prank(owner);
        vault.setVacancySweepEnabled(true);
        assertTrue(vault.sweepEnabled());

        VacancyTypes.SweepPlan memory planAfterReenable = vault.evaluateVacancySweep(100);
        assertGt(planAfterReenable.sweepAmount, 0);
    }

    function test_repeatedDepositSweepDisburse_preservesVL01() public {
        _deployVaultDefaults();
        _allowDefaultDisburseRecipient();
        vm.prank(depositor);
        usdc.approve(address(vault), type(uint256).max);
        uint256 ghostDisbursed;

        for (uint256 round = 0; round < 8; round++) {
            vm.prank(depositor);
            vault.depositToReserve(uint256(100_000e6 + round * 50_000e6), round);

            if (vault.sweepEnabled()) {
                vm.startPrank(owner);
                VacancyTypes.SweepPlan memory plan = vault.evaluateVacancySweep(round);
                vault.executeSweep(round, plan);
                vm.stopPrank();
            }

            VacancyTypes.VacancyLedger memory ledger = _ledger();
            if (ledger.reserve > 0) {
                uint256 amt = ledger.reserve / (2 + round % 3);
                if (amt > 0) {
                    vm.prank(owner);
                    vault.disburseJurisdictionReserve(amt, recipient, bytes32(uint256(round)));
                    ghostDisbursed += amt;
                }
            }

            VacancyInvariantChecks.checkVL01(_ledger());
            VacancyInvariantChecks.checkVL02(_ledger());
            VacancyInvariantChecks.checkVL03(_ledger(), _params());
            VacancyInvariantChecks.checkVL04(_ledger(), _params(), vault.sweepEnabled());
            VacancyInvariantChecks.checkVL05(_ledger(), ghostDisbursed);
        }
    }

    function _handlerLedger() internal view returns (VacancyTypes.VacancyLedger memory) {
        return handler.getVault().vacancyLedger();
    }

    function _handlerParams() internal view returns (VacancyTypes.VacancyParams memory p) {
        UnallocatedStewardPathVault v = handler.getVault();
        (
            p.vacancySweepRateBps,
            p.vacancySweepCapBps,
            p.jurisdictionReserveBps,
            p.vacancyGraceDays,
            p.vacancySweepAutoReenable
        ) = v.vacancyParams();
    }

    function _allowDefaultDisburseRecipient() internal {
        vm.prank(owner);
        vault.setDisburseRecipientAllowed(recipient, true);
    }
}
