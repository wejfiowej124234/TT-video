//! 评分权重：仅完成订单可评，权重 = f(金额, 历史, 账户年龄)

use crate::OrderState;
use serde::{Deserialize, Serialize};

/// 评价权重计算（防刷单：高价值订单权重大）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReviewWeight {
    pub order_amount: f64,
    pub guide_historical_score: f64,
    pub account_age_days: u64,
}

impl ReviewWeight {
    /// 简单权重：金额归一化 + 账户年龄加成
    pub fn weight(&self) -> f64 {
        let amount_factor = (self.order_amount / 1000.0).clamp(0.1, 10.0);
        let age_factor = (self.account_age_days as f64 / 365.0).clamp(0.5, 3.0);
        amount_factor * age_factor
    }

    /// 可解释分解（90 §6 / 04：`GET /me` trust.reputation、`POST .../reviews` weight_breakdown）
    pub fn breakdown(&self) -> ReviewWeightBreakdown {
        let amount_factor = (self.order_amount / 1000.0).clamp(0.1, 10.0);
        let age_factor = (self.account_age_days as f64 / 365.0).clamp(0.5, 3.0);
        let weight = amount_factor * age_factor;
        ReviewWeightBreakdown {
            rule_version: "review_weight_v1",
            order_amount: self.order_amount,
            account_age_days: self.account_age_days,
            amount_factor,
            age_factor,
            weight,
            guide_historical_score_reserved: self.guide_historical_score,
        }
    }
}

/// 单次评价权重分解（API JSON 同源字段）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReviewWeightBreakdown {
    pub rule_version: &'static str,
    pub order_amount: f64,
    pub account_age_days: u64,
    pub amount_factor: f64,
    pub age_factor: f64,
    pub weight: f64,
    /// 字段预留；当前 `weight()` 未使用，供前端/审计知悉
    pub guide_historical_score_reserved: f64,
}

/// 仅当订单为资金终态（completed/refunded/partially_refunded/slashed）时允许评价（01 §4、04 §2.2）
pub fn can_submit_review(state: OrderState) -> bool {
    state.is_final_financial_state()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::OrderState;

    #[test]
    fn can_submit_review_only_final_financial_states() {
        assert!(can_submit_review(OrderState::Completed));
        assert!(can_submit_review(OrderState::Refunded));
        assert!(can_submit_review(OrderState::PartiallyRefunded));
        assert!(can_submit_review(OrderState::Slashed));
        assert!(!can_submit_review(OrderState::Draft));
        assert!(!can_submit_review(OrderState::Created));
        assert!(!can_submit_review(OrderState::Accepted));
        assert!(!can_submit_review(OrderState::Escrowed));
        assert!(!can_submit_review(OrderState::Disputed));
        assert!(!can_submit_review(OrderState::Cancelled));
    }

    #[test]
    fn review_weight_amount_and_age_factor() {
        let w = ReviewWeight {
            order_amount: 500.0,
            guide_historical_score: 0.0,
            account_age_days: 365,
        };
        let x = w.weight();
        assert!((0.1..=30.0).contains(&x));
        let w_high = ReviewWeight {
            order_amount: 5000.0,
            guide_historical_score: 0.0,
            account_age_days: 730,
        };
        assert!(w_high.weight() >= w.weight());
    }

    #[test]
    fn review_weight_bounds() {
        let w_zero = ReviewWeight {
            order_amount: 0.0,
            guide_historical_score: 0.0,
            account_age_days: 0,
        };
        // 金额下限因子 0.1 × 账龄下限因子 0.5
        assert!(w_zero.weight() >= 0.05 - 1e-9);
        let w_huge = ReviewWeight {
            order_amount: 1_000_000.0,
            guide_historical_score: 0.0,
            account_age_days: 9999,
        };
        assert!(w_huge.weight() <= 30.0 + 1e-6);
    }

    #[test]
    fn breakdown_matches_weight() {
        let w = ReviewWeight {
            order_amount: 800.0,
            guide_historical_score: 0.0,
            account_age_days: 730,
        };
        let b = w.breakdown();
        assert!((b.weight - w.weight()).abs() < 1e-9);
        assert_eq!(b.rule_version, "review_weight_v1");
        assert_eq!(b.account_age_days, 730);
    }
}
