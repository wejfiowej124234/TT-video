pub(super) fn is_allowed_api_version_status(s: &str) -> bool {
    matches!(s, "planned" | "active" | "deprecated" | "sunset")
}
