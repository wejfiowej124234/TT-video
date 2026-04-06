//! chain_off 订单状态流转：order_accept、order_cancel、order_mock_pay、order_confirm_completion、order_open_dispute（48 §5.5 C5 拆分子块）
//! 档期：80 §4.15 — 接单前 has_overlapping_lock；deposit 后 lock_slot；取消/完成 release_slot。

mod accept_cancel_pay_complete;
mod dispute_bilateral_rating;

pub use accept_cancel_pay_complete::{
    order_accept_impl, order_cancel_impl, order_confirm_completion_impl, order_mock_pay_impl,
};
pub use dispute_bilateral_rating::{
    order_confirm_bilateral_impl, order_confirm_rating_impl, order_open_dispute_impl,
};
