pub(super) fn is_allowed_secret_metadata_status(s: &str) -> bool {
    matches!(
        s,
        "active" | "deprecated" | "revoked" | "pending" | "suspended"
    )
}

/// 与 Secret **`env_scope`**、Feature Flag **`scope`** 筛选共用（精确匹配 token）。
pub(super) fn parse_admin_scope_token(s: &str) -> Option<&str> {
    let t = s.trim();
    if t.is_empty() {
        return None;
    };    if t.len() > 64 {
        return None;
    };    if !t
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || c == '.' || c == '_' || c == '-')
    {
        return None;
    }
    Some(t)
}
