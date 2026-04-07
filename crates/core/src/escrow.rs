//! 订单托管状态机（与 01 §1、02/03、17 ① 一致）：draft → created → accepted → escrowed → completed | disputed → refunded/partially_refunded/slashed
//!
//! Draft 为 P15/17 区域① 行程生成层占位；合法迁移与终态定义以 01 §1 订单状态机表为准；单元可测（P1 验收）。

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "snake_case")]
pub enum OrderState {
    Draft, // P15/17 ①：行程草稿，待确认后转 Created
    #[default]
    Created, // 游客已下单，待向导接单
    Accepted, // 向导已接单，待游客支付进 escrow
    Escrowed, // 代币已打入托管，行程进行中
    Completed, // 已放款给向导（链上 Released），可评价
    Disputed, // 争议中，待仲裁与链上执行
    Refunded, // 全额退款（资金终态）
    PartiallyRefunded, // 部分退款（资金终态）
    Slashed, // 扣罚已执行（资金终态）
    Cancelled, // 已取消/超时取消，未进 escrow
}

impl OrderState {
    /// 是否为资金终态（01：仅终态可提交评价）
    pub fn is_final_financial_state(self) -> bool {
        matches!(
            self,
            OrderState::Completed
                | OrderState::Refunded
                | OrderState::PartiallyRefunded
                | OrderState::Slashed
        )
    }

    /// 是否为终态（含 Cancelled）
    pub fn is_terminal(self) -> bool {
        self.is_final_financial_state() || self == OrderState::Cancelled
    }

    /// 01 §1 合法下一状态；终态无合法迁移。Draft 为 P15/17 ① 扩展。
    pub fn allowed_next_states(self) -> &'static [OrderState] {
        use OrderState::*;
        match self {
            Draft => &[Created, Cancelled],
            Created => &[Accepted, Cancelled],
            Accepted => &[Escrowed, Cancelled],
            Escrowed => &[Completed, Disputed, PartiallyRefunded, Slashed],
            Disputed => &[Completed, Refunded, PartiallyRefunded, Slashed],
            Completed | Refunded | PartiallyRefunded | Slashed | Cancelled => &[],
        }
    }

    /// 是否允许从当前状态迁移到 next（与 02/03 一致）
    pub fn can_transition_to(self, next: OrderState) -> bool {
        if self == next {
            return false;
        }
        self.allowed_next_states().contains(&next)
    }
}

/// 将链上 **`executeResolution(guideAmount, travelerRefund, platformFee)`** 三腿（与 `contracts` 中 Escrow 合约守恒一致）映射为订单域终态，供执行器 / 投影在 **能拿到 calldata 或 outbox 侧车** 时使用（**B-094**）。
///
/// **前置**：`guide_amount + traveler_refund + platform_fee == total_amount`（与合约 `InvalidState` 守恒一致），否则返回 `None`。
#[must_use]
pub fn terminal_order_state_from_resolution_amounts(
    guide_amount: u128,
    traveler_refund: u128,
    platform_fee: u128,
    total_amount: u128,
) -> Option<OrderState> {
    let sum = guide_amount
        .checked_add(traveler_refund)?
        .checked_add(platform_fee)?;
    if sum != total_amount {
        return None;
    }
    // 与 03 / 80 附录争议终态语义对齐的钉死规则（Foundry `test_B094_*` 三模板）
    if guide_amount == 0 && platform_fee == 0 && traveler_refund == total_amount {
        return Some(OrderState::Refunded);
    }
    if guide_amount > 0 && traveler_refund > 0 {
        return Some(OrderState::PartiallyRefunded);
    }
    if guide_amount == 0 && traveler_refund < total_amount {
        return Some(OrderState::Slashed);
    }
    if traveler_refund == 0 && guide_amount > 0 {
        return Some(OrderState::Completed);
    }
    None
}

/// 托管层抽象（链下或链上）
pub trait EscrowState: Send + Sync {
    /// 是否允许对该订单进行评价（仅资金终态：completed / refunded / partially_refunded / slashed）
    fn can_review(state: OrderState) -> bool {
        state.is_final_financial_state()
    }

    /// 是否允许发起争议（仅 escrowed）
    fn can_dispute(state: OrderState) -> bool {
        state == OrderState::Escrowed
    }
}

pub struct DefaultEscrow;
impl EscrowState for DefaultEscrow {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn draft_may_transition_to_created_or_cancelled() {
        assert!(OrderState::Draft.can_transition_to(OrderState::Created));
        assert!(OrderState::Draft.can_transition_to(OrderState::Cancelled));
        assert!(!OrderState::Draft.can_transition_to(OrderState::Accepted));
    }

    #[test]
    fn created_may_transition_to_accepted_or_cancelled() {
        assert!(OrderState::Created.can_transition_to(OrderState::Accepted));
        assert!(OrderState::Created.can_transition_to(OrderState::Cancelled));
        assert!(!OrderState::Created.can_transition_to(OrderState::Escrowed));
        assert!(!OrderState::Created.can_transition_to(OrderState::Created));
    }

    #[test]
    fn accepted_may_transition_to_escrowed_or_cancelled() {
        assert!(OrderState::Accepted.can_transition_to(OrderState::Escrowed));
        assert!(OrderState::Accepted.can_transition_to(OrderState::Cancelled));
        assert!(!OrderState::Accepted.can_transition_to(OrderState::Completed));
    }

    #[test]
    fn escrowed_may_transition_to_completed_or_disputed() {
        assert!(OrderState::Escrowed.can_transition_to(OrderState::Completed));
        assert!(OrderState::Escrowed.can_transition_to(OrderState::Disputed));
        assert!(OrderState::Escrowed.can_transition_to(OrderState::PartiallyRefunded));
        assert!(OrderState::Escrowed.can_transition_to(OrderState::Slashed));
        assert!(!OrderState::Escrowed.can_transition_to(OrderState::Refunded));
    }

    #[test]
    fn disputed_may_transition_to_four_financial_finals() {
        assert!(OrderState::Disputed.can_transition_to(OrderState::Completed));
        assert!(OrderState::Disputed.can_transition_to(OrderState::Refunded));
        assert!(OrderState::Disputed.can_transition_to(OrderState::PartiallyRefunded));
        assert!(OrderState::Disputed.can_transition_to(OrderState::Slashed));
        assert!(!OrderState::Disputed.can_transition_to(OrderState::Cancelled));
    }

    #[test]
    fn terminal_states_have_no_allowed_next() {
        assert!(OrderState::Completed.allowed_next_states().is_empty());
        assert!(OrderState::Refunded.allowed_next_states().is_empty());
        assert!(OrderState::PartiallyRefunded
            .allowed_next_states()
            .is_empty());
        assert!(OrderState::Slashed.allowed_next_states().is_empty());
        assert!(OrderState::Cancelled.allowed_next_states().is_empty());
    }

    #[test]
    fn only_escrowed_can_dispute() {
        assert!(DefaultEscrow::can_dispute(OrderState::Escrowed));
        assert!(!DefaultEscrow::can_dispute(OrderState::Created));
        assert!(!DefaultEscrow::can_dispute(OrderState::Completed));
    }

    #[test]
    fn only_final_financial_states_can_review() {
        assert!(DefaultEscrow::can_review(OrderState::Completed));
        assert!(DefaultEscrow::can_review(OrderState::Refunded));
        assert!(DefaultEscrow::can_review(OrderState::PartiallyRefunded));
        assert!(DefaultEscrow::can_review(OrderState::Slashed));
        assert!(!DefaultEscrow::can_review(OrderState::Escrowed));
        assert!(!DefaultEscrow::can_review(OrderState::Cancelled));
    }

    #[test]
    fn b094_resolution_amounts_match_escrow_templates() {
        let total = 1000u128;
        assert_eq!(
            super::terminal_order_state_from_resolution_amounts(0, total, 0, total),
            Some(OrderState::Refunded)
        );
        assert_eq!(
            super::terminal_order_state_from_resolution_amounts(300, 650, 50, total),
            Some(OrderState::PartiallyRefunded)
        );
        assert_eq!(
            super::terminal_order_state_from_resolution_amounts(0, 800, 200, total),
            Some(OrderState::Slashed)
        );
        assert_eq!(
            super::terminal_order_state_from_resolution_amounts(950, 0, 50, total),
            Some(OrderState::Completed)
        );
        assert_eq!(
            super::terminal_order_state_from_resolution_amounts(0, total, 1, total),
            None
        );
    }
}
