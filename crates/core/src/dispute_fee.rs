//! 争议仲裁费递增（03 §3.2）：第 n 次开争议时链下最小应付 `arb_base_fee × 2^(n-1)`（n 从 1 计）。
//! 与 `crates/api` `order_open_dispute_impl` 校验一致，避免多处硬编码公式漂移。

/// 链下校验用：当 `arb_base_fee > 0` 时，开争议序号 `dispute_sequence`（≥1，首轮为 1）对应的最小应付费用。
/// `dispute_sequence == 0` 时按 1 处理，避免误传导致指数异常。
pub fn required_arbitration_fee(arb_base_fee: f64, dispute_sequence: u32) -> f64 {
    let n = dispute_sequence.max(1);
    arb_base_fee * 2f64.powi(n as i32 - 1)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn first_dispute_equals_base() {
        assert!((required_arbitration_fee(100.0, 1) - 100.0).abs() < 1e-9);
    }

    #[test]
    fn second_dispute_doubles() {
        assert!((required_arbitration_fee(100.0, 2) - 200.0).abs() < 1e-9);
    }

    #[test]
    fn third_dispute_quadruples_base_ten() {
        assert!((required_arbitration_fee(10.0, 3) - 40.0).abs() < 1e-9);
    }

    #[test]
    fn zero_sequence_treated_as_one() {
        assert!((required_arbitration_fee(50.0, 0) - 50.0).abs() < 1e-9);
    }
}
