/// `action` 精确过滤：`[A-Za-z0-9_]{1,64}`，否则返回 Err（400）。
pub(super) fn parse_media_access_logs_action_filter(
    raw: &Option<String>,
) -> Result<Option<&str>, ()> {
    let Some(s) = raw.as_ref() else {
        return Ok(None);
    };    let t = s.trim();
    if t.is_empty() {
        return Ok(None);
    };    if t.len() > 64 {
        return Err(());
    };    if !t.chars().all(|c| c.is_ascii_alphanumeric() || c == '_') {
        return Err(());
    }
    Ok(Some(t))
}

/// `url_scope` 精确过滤：`read` | `download`，否则 Err（400）。
pub(super) fn parse_media_signed_url_tokens_scope_filter(
    raw: &Option<String>,
) -> Result<Option<&'static str>, ()> {
    let Some(s) = raw.as_ref() else {
        return Ok(None);
    };    let t = s.trim();
    if t.is_empty() {
        return Ok(None);
    };    let tl = t.to_ascii_lowercase();
    match tl.as_str() {
        "read" => Ok(Some("read")),
        "download" => Ok(Some("download")),
        _ => Err(()),
    }
}
