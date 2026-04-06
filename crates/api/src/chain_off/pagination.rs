//! `GET /api/v1/orders`、`GET /api/v1/discover/orders` 可选 limit+cursor（55 / 04：默认全量兼容，传 limit 时分页）

use uuid::Uuid;

/// 单页上限（与 04 §3.4「后续分页」一致）
pub const ORDER_LIST_MAX_LIMIT: u32 = 100;

#[derive(Clone, Debug, Default)]
pub struct OrderListPage {
    /// `None`：保持历史行为，返回全量（不分页）
    pub limit: Option<usize>,
    pub cursor: Option<Uuid>,
}

/// 解析查询参数：`limit` 缺省且带 `cursor` 时默认每页 50。
pub fn parse_order_list_page(
    limit_q: Option<u32>,
    cursor_q: Option<String>,
) -> Result<OrderListPage, &'static str> {
    let cursor = match cursor_q {
        None => None,
        Some(ref s) if s.trim().is_empty() => None,
        Some(s) => Some(Uuid::parse_str(s.trim()).map_err(|_| "invalid_cursor")?),
    };
    let limit = match limit_q {
        None => {
            if cursor.is_some() {
                Some(50usize)
            } else {
                None
            }
        }
        Some(0) => return Err("invalid_limit"),
        Some(n) => Some((n.min(ORDER_LIST_MAX_LIMIT).max(1)) as usize),
    };
    Ok(OrderListPage { limit, cursor })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn no_params_unlimited() {
        let p = parse_order_list_page(None, None).unwrap();
        assert!(p.limit.is_none());
        assert!(p.cursor.is_none());
    }

    #[test]
    fn limit_clamped() {
        let p = parse_order_list_page(Some(200), None).unwrap();
        assert_eq!(p.limit, Some(100));
    }

    #[test]
    fn cursor_without_limit_defaults_50() {
        let id = Uuid::nil();
        let p = parse_order_list_page(None, Some(id.to_string())).unwrap();
        assert_eq!(p.limit, Some(50));
        assert_eq!(p.cursor, Some(id));
    }

    #[test]
    fn invalid_cursor_rejected() {
        assert!(parse_order_list_page(Some(10), Some("not-a-uuid".into())).is_err());
    }
}
