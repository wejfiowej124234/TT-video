//! `users.role` / 请求侧存值：旅行者侧判定（**699**：与 **87** `traveler` 及存量 `tourist` 对齐）。

/// `users.role` 等应用层存值：是否属旅行者侧（`tourist` 或 `traveler`，trim + ASCII 大小写不敏感）。
pub(crate) fn users_role_is_traveler_side(raw: &str) -> bool {
    let r = raw.trim();
    r.eq_ignore_ascii_case("tourist") || r.eq_ignore_ascii_case("traveler")
}

#[cfg(test)]
mod tests {
    use super::users_role_is_traveler_side;

    #[test]
    fn traveler_side_matches_tourist_and_traveler() {
        assert!(users_role_is_traveler_side("tourist"));
        assert!(users_role_is_traveler_side("TRAVELER"));
        assert!(users_role_is_traveler_side(" traveler "));
    }

    #[test]
    fn non_traveler_roles_false() {
        assert!(!users_role_is_traveler_side("guide"));
        assert!(!users_role_is_traveler_side("provider"));
    }
}
