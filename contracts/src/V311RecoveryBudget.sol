// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * @title V311RecoveryBudget
 * @notice V3.1.1 ch.13 · Recovery Budget guard · Gap S-03 / C-01 / C-02
 * @dev Mirrors registry/v311-recovery-budget.v1.yaml — payout forbidden until budget configured.
 */
library V311RecoveryBudget {
    error BudgetNotConfigured();
    error ExceedsBudget();

    struct Budget {
        bool configured;
        uint256 remainingUsdcOrUnits;
    }

    /// Non-payout path always allowed (register into Recovered Inventory).
    function canRegisterInventory(Budget memory) internal pure returns (bool) {
        return true;
    }

    function canExecutePayout(Budget memory b, uint256 amount) internal pure returns (bool) {
        if (!b.configured) return false;
        return amount <= b.remainingUsdcOrUnits;
    }

    function requirePayout(Budget memory b, uint256 amount) internal pure {
        if (!b.configured) revert BudgetNotConfigured();
        if (amount > b.remainingUsdcOrUnits) revert ExceedsBudget();
    }
}
