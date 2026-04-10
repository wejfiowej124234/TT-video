//! 订单 **53-S12** deadline 计算的统一时钟抽象（**TT-B110-SEQ2-ORDERS-DEADLINE-CLOCK-INJECT-001**）。
//! 生产默认 **`SystemOrderDeadlineClock`**（`Utc::now()`）；单测可换 **`FixedOrderDeadlineClock`**。

use chrono::{DateTime, Utc};
use std::sync::{Arc, Mutex};

/// 与 **`ApiMetaState.order_deadline_clock`** 同源注入点。
pub trait OrderDeadlineClock: Send + Sync {
    fn now_utc(&self) -> DateTime<Utc>;
}

/// 生产默认：系统 UTC 时钟。
#[derive(Clone, Copy, Debug, Default)]
pub struct SystemOrderDeadlineClock;

impl OrderDeadlineClock for SystemOrderDeadlineClock {
    fn now_utc(&self) -> DateTime<Utc> {
        Utc::now()
    }
}

/// 固定时钟（测试 / 确定性回放）。
#[derive(Clone)]
pub struct FixedOrderDeadlineClock {
    t: Arc<Mutex<DateTime<Utc>>>,
}

impl FixedOrderDeadlineClock {
    pub fn new(t: DateTime<Utc>) -> Self {
        Self {
            t: Arc::new(Mutex::new(t)),
        }
    }

    pub fn set(&self, t: DateTime<Utc>) {
        *self.t.lock().expect("fixed clock mutex") = t;
    }
}

impl OrderDeadlineClock for FixedOrderDeadlineClock {
    fn now_utc(&self) -> DateTime<Utc> {
        *self.t.lock().expect("fixed clock mutex")
    }
}
