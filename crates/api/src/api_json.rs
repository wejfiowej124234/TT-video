//! JSON 错误体：`error` 与 `message` 同为机器键（04 §3.4，与前端 `parseResponse` / admin 分类一致）。

use serde_json::{json, Value};

#[inline]
pub(crate) fn err_key(key: &str) -> Value {
    json!({ "error": key, "message": key })
}

/// `error`/`message` 同机器键，人读说明放在 `detail`（04 §3.4）。
#[inline]
pub(crate) fn err_key_detail(key: &str, detail: impl Into<String>) -> Value {
    json!({
        "error": key,
        "message": key,
        "detail": detail.into(),
    })
}

#[cfg(test)]
mod tests {
    use super::{err_key, err_key_detail};

    #[test]
    fn err_key_aligns_error_and_message() {
        let v = err_key("user_not_found");
        assert_eq!(v["error"], "user_not_found");
        assert_eq!(v["message"], "user_not_found");
    }

    #[test]
    fn err_key_detail_keeps_machine_message() {
        let v = err_key_detail("invalid_email", "human hint");
        assert_eq!(v["error"], "invalid_email");
        assert_eq!(v["message"], "invalid_email");
        assert_eq!(v["detail"], "human hint");
    }
}
