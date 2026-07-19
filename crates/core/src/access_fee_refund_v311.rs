//! V3.1.1 Platform Access Fee refund orchestration · Gap BE-03
//! Mirrors registry/v311-platform-access-fee.v1.yaml + contracts V311AccessFeeRefundRules.

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AccessFeeOutcome {
    AuditFail,
    AuditPass,
    Exit,
    DaoRemove,
    InactiveReopen,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AccessFeeRefundPlan {
    pub refund_bps: u16,
    pub refundable: bool,
}

#[must_use]
pub fn plan_access_fee_refund(outcome: AccessFeeOutcome) -> AccessFeeRefundPlan {
    match outcome {
        AccessFeeOutcome::AuditFail => AccessFeeRefundPlan {
            refund_bps: 10_000,
            refundable: true,
        },
        _ => AccessFeeRefundPlan {
            refund_bps: 0,
            refundable: false,
        },
    }
}

/// Orchestration: given fee paid (6 decimals USDC), compute refund amount.
#[must_use]
pub fn refund_amount_usdc6(fee_paid: u128, outcome: AccessFeeOutcome) -> u128 {
    let plan = plan_access_fee_refund(outcome);
    fee_paid.saturating_mul(u128::from(plan.refund_bps)) / 10_000
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn be03_audit_fail_full_refund_else_zero() {
        const FEE: u128 = 300_000_000_000; // 300k * 1e6
        assert_eq!(refund_amount_usdc6(FEE, AccessFeeOutcome::AuditFail), FEE);
        assert_eq!(refund_amount_usdc6(FEE, AccessFeeOutcome::AuditPass), 0);
        assert_eq!(refund_amount_usdc6(FEE, AccessFeeOutcome::Exit), 0);
        assert_eq!(refund_amount_usdc6(FEE, AccessFeeOutcome::DaoRemove), 0);
        assert_eq!(refund_amount_usdc6(FEE, AccessFeeOutcome::InactiveReopen), 0);
    }
}
