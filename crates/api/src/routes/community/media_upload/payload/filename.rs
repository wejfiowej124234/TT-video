/// 与 **`GET …/uploads/community-posts/:name`** 路径段校验同源（防 `..` 与非安全字符）。
pub(crate) fn community_post_media_upload_filename_allowed(name: &str) -> bool {
    !name.contains("..")
        && name
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '.' || c == '-')
}

#[cfg(test)]
mod community_post_media_filename_tests {
    use super::community_post_media_upload_filename_allowed;

    #[test]
    fn allows_uuid_like_names_with_suffix() {
        assert!(community_post_media_upload_filename_allowed(
            "550e8400-e29b-41d4-a716-446655440000.jpg"
        ));
        assert!(community_post_media_upload_filename_allowed("abc-123.mp4"));
    }

    #[test]
    fn rejects_dotdot_and_slashes_spaces() {
        assert!(!community_post_media_upload_filename_allowed(
            "../etc/passwd"
        ));
        assert!(!community_post_media_upload_filename_allowed("a/b.png"));
        assert!(!community_post_media_upload_filename_allowed("a\\b.png"));
        assert!(!community_post_media_upload_filename_allowed("a b.png"));
    }
}
