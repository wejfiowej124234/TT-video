pub(super) fn is_allowed_compliance_request_status(s: &str) -> bool {
    matches!(
        s,
        "open" | "in_progress" | "completed" | "rejected" | "cancelled"
    )
}

pub(super) fn is_allowed_compliance_request_type(s: &str) -> bool {
    matches!(s, "export" | "erasure")
}
