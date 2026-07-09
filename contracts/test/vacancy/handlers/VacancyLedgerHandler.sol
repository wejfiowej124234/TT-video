// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import {VacancyTypes} from "../../../src/vacancy/VacancyTypes.sol";
import {UnallocatedStewardPathVault} from "../../../src/vacancy/UnallocatedStewardPathVault.sol";
import "../fixtures/VacancyInvariantFixture.sol";

/// @dev Foundry invariant handler — deposit / sweep / disburse only (S2 · G22-D-05).
contract VacancyLedgerHandler is Test, VacancyInvariantFixture {
    uint256 public epochCounter;
    uint256 public ghostDisbursed;
    uint256 public ghostSweepCount;
    uint256 public ghostDepositCount;
    uint256 public ghostDisburseCount;
    bool public sweepDisabledObserved;

    constructor() {
        _deployVaultDefaults();
        vm.prank(owner);
        vault.setDisburseRecipientAllowed(recipient, true);
        vm.prank(depositor);
        usdc.approve(address(vault), type(uint256).max);
    }

    function deposit(uint256 amount) external {
        amount = bound(amount, 1, MAX_DEPOSIT);
        vm.prank(depositor);
        vault.depositToReserve(amount, 1);
        ghostDepositCount++;
    }

    function sweepQuarter() external {
        if (!vault.sweepEnabled()) return;

        VacancyTypes.SweepPlan memory plan = vault.evaluateVacancySweep(epochCounter);
        vm.startPrank(owner);
        vault.executeSweep(epochCounter, plan);
        vm.stopPrank();

        epochCounter++;
        if (plan.sweepAmount > 0) ghostSweepCount++;

        if (!vault.sweepEnabled()) sweepDisabledObserved = true;
    }

    function disburse(uint256 amount) external {
        VacancyTypes.VacancyLedger memory ledger = _ledger();
        if (ledger.reserve == 0) return;

        amount = bound(amount, 1, ledger.reserve);

        vm.startPrank(owner);
        vault.disburseJurisdictionReserve(amount, recipient, bytes32("fuzz-disburse"));
        vm.stopPrank();

        ghostDisbursed += amount;
        ghostDisburseCount++;
    }

    function reenableSweep() external {
        vm.prank(owner);
        vault.setVacancySweepEnabled(true);
    }

    function depositAfterSweepDisabled(uint256 amount) external {
        if (!sweepDisabledObserved) return;
        amount = bound(amount, 1, MAX_DEPOSIT);
        vm.prank(depositor);
        vault.depositToReserve(amount, 1);
        ghostDepositCount++;
    }

    function getVault() external view returns (UnallocatedStewardPathVault) {
        return vault;
    }
}
