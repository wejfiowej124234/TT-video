// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../src/InvestorShareLockLedger.sol";

contract InvestorShareLockLedgerTest is Test {
    InvestorShareLockLedger internal ledger;

    function setUp() public {
        ledger = new InvestorShareLockLedger();
    }

    function test_COMP_B088_lock_unlock_updates_lockedOf() public {
        ledger.lock(10);
        assertEq(ledger.lockedOf(address(this)), 10);
        ledger.unlock(4);
        assertEq(ledger.lockedOf(address(this)), 6);
    }

    function test_COMP_B088_unlock_reverts_when_insufficient() public {
        ledger.lock(1);
        vm.expectRevert(InvestorShareLockLedger.InsufficientLocked.selector);
        ledger.unlock(2);
    }
}
