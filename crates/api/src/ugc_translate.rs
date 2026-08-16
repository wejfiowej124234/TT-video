//! UGC 用户内容翻译内核。**禁止**复用 Admin Catalog `catalog_translation_entries`。
//! 表已按 `source_hash × target_locale` 建好多语言；v1 白名单仅 `zh` | `en`。
//! ① 默认 `TRANSLATION_PROVIDER=mock`；②/③ `deepl` | `google` + API 进程密钥（失败关闭）。

use sha2::{Digest, Sha256};

#[path = "ugc_translate_http.rs"]
mod ugc_translate_http;

pub const TARGET_LOCALES: [&str; 2] = ["zh", "en"];
pub const MAX_SOURCE_CHARS: usize = 5000;

pub const CONTENT_CLASS_COMMUNITY_POST: &str = "community_post";
pub const CONTENT_CLASS_COMMUNITY_COMMENT: &str = "community_comment";
pub const CONTENT_CLASS_GUIDE: &str = "guide";
pub const CONTENT_CLASS_MERCHANT_LISTING: &str = "merchant_listing";
pub const CONTENT_CLASS_ACQUISITION_LISTING: &str = "acquisition_listing";
pub const CONTENT_CLASS_ITINERARY: &str = "itinerary";
pub const CONTENT_CLASS_DM_MESSAGE: &str = "dm_message";

pub const PROVIDER_MOCK: &str = "mock";
pub const PROVIDER_DEEPL: &str = "deepl";
pub const PROVIDER_GOOGLE: &str = "google";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ProviderKind {
    Mock,
    Deepl,
    Google,
}

impl ProviderKind {
    pub fn as_str(self) -> &'static str {
        match self {
            ProviderKind::Mock => PROVIDER_MOCK,
            ProviderKind::Deepl => PROVIDER_DEEPL,
            ProviderKind::Google => PROVIDER_GOOGLE,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CacheStatus {
    Hit,
    Miss,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CachedRow {
    pub source_hash: String,
    pub source_locale: String,
    pub translated_text: String,
    pub provider: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ResolvedTranslation {
    pub cache: CacheStatus,
    pub source_hash: String,
    pub translated_text: String,
    pub provider: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TranslateError {
    InvalidTargetLocale,
    InvalidContentClass,
    InvalidField,
    DmNotThisSlice,
    EmptySource,
    ProviderUnconfigured,
    UpstreamFailed,
    SourceTooLong,
}

pub trait TranslationEngine {
    fn provider_id(&self) -> &'static str {
        PROVIDER_MOCK
    }
    fn translate(&mut self, source: &str, target_locale: &str) -> Result<String, TranslateError>;
}

#[derive(Debug, Default)]
pub struct MockEngine {
    pub calls: u32,
}

impl TranslationEngine for MockEngine {
    fn translate(&mut self, source: &str, target_locale: &str) -> Result<String, TranslateError> {
        self.calls += 1;
        Ok(mock_translated_text(source, target_locale))
    }
}

pub fn mock_translated_text(source: &str, target_locale: &str) -> String {
    format!("[mock:{target_locale}] {source}")
}

pub fn source_hash(text: &str) -> String {
    hex::encode(Sha256::digest(text.as_bytes()))
}

pub fn parse_target_locale(raw: &str) -> Result<String, TranslateError> {
    let t = raw.trim().to_ascii_lowercase();
    if TARGET_LOCALES.contains(&t.as_str()) {
        Ok(t)
    } else {
        Err(TranslateError::InvalidTargetLocale)
    }
}

pub fn parse_source_locale(raw: Option<&str>) -> String {
    let t = raw.unwrap_or("").trim().to_ascii_lowercase();
    if t.is_empty() {
        return "und".to_string();
    }
    if t.len() >= 2 && t.len() <= 16 && t.chars().all(|c| c.is_ascii_alphanumeric() || c == '-') {
        t
    } else {
        "und".to_string()
    }
}

pub fn validate_content_class_and_field(
    content_class: &str,
    field: &str,
) -> Result<(), TranslateError> {
    let class = content_class.trim();
    let field = field.trim();
    if class == CONTENT_CLASS_DM_MESSAGE {
        return Err(TranslateError::DmNotThisSlice);
    }
    let ok = match class {
        CONTENT_CLASS_COMMUNITY_POST | CONTENT_CLASS_COMMUNITY_COMMENT => field == "body",
        CONTENT_CLASS_GUIDE => field == "bio" || field == "public_title",
        CONTENT_CLASS_MERCHANT_LISTING | CONTENT_CLASS_ACQUISITION_LISTING => {
            matches!(field, "title" | "description" | "body" | "bio" | "summary" | "subtitle")
        }
        CONTENT_CLASS_ITINERARY => field == "days_json" || field == "teaser",
        _ => return Err(TranslateError::InvalidContentClass),
    };
    if ok {
        Ok(())
    } else {
        Err(TranslateError::InvalidField)
    }
}

pub fn require_non_empty_source(source: &str) -> Result<&str, TranslateError> {
    let t = source.trim();
    if t.is_empty() {
        Err(TranslateError::EmptySource)
    } else {
        Ok(t)
    }
}

/// 命中：同 `source_hash` 不调用引擎。未命中：调引擎。原文变更 → hash 变 → 旧译文不会被返回。
pub fn resolve_translation<E: TranslationEngine>(
    source_text: &str,
    target_locale: &str,
    cached_for_hash: Option<&CachedRow>,
    engine: &mut E,
) -> Result<ResolvedTranslation, TranslateError> {
    let source = require_non_empty_source(source_text)?;
    let hash = source_hash(source);
    if let Some(row) = cached_for_hash {
        if row.source_hash == hash {
            return Ok(ResolvedTranslation {
                cache: CacheStatus::Hit,
                source_hash: hash,
                translated_text: row.translated_text.clone(),
                provider: row.provider.clone(),
            });
        }
    }
    let translated = engine.translate(source, target_locale)?;
    Ok(ResolvedTranslation {
        cache: CacheStatus::Miss,
        source_hash: hash,
        translated_text: translated,
        provider: engine.provider_id().to_string(),
    })
}

/// 读 `TRANSLATION_PROVIDER`。缺省 / `mock` → Mock。`deepl`/`google` 须有对应密钥，否则失败关闭。
pub fn provider_kind_from_env() -> Result<ProviderKind, TranslateError> {
    let raw = std::env::var("TRANSLATION_PROVIDER")
        .unwrap_or_else(|_| PROVIDER_MOCK.to_string())
        .trim()
        .to_ascii_lowercase();
    match raw.as_str() {
        "" | PROVIDER_MOCK => Ok(ProviderKind::Mock),
        PROVIDER_DEEPL => {
            let key = std::env::var("DEEPL_AUTH_KEY").unwrap_or_default();
            if key.trim().is_empty() {
                Err(TranslateError::ProviderUnconfigured)
            } else {
                Ok(ProviderKind::Deepl)
            }
        }
        PROVIDER_GOOGLE => {
            let key = std::env::var("GOOGLE_TRANSLATE_API_KEY").unwrap_or_default();
            if key.trim().is_empty() {
                Err(TranslateError::ProviderUnconfigured)
            } else {
                Ok(ProviderKind::Google)
            }
        }
        _ => Err(TranslateError::ProviderUnconfigured),
    }
}

/// 缓存未命中时调引擎。Mock 同步；DeepL/Google 出网（密钥只在本进程）。
pub async fn translate_on_miss(
    kind: ProviderKind,
    source: &str,
    target_locale: &str,
) -> Result<(String, &'static str), TranslateError> {
    if source.chars().count() > MAX_SOURCE_CHARS {
        return Err(TranslateError::SourceTooLong);
    }
    match kind {
        ProviderKind::Mock => {
            let mut engine = MockEngine::default();
            let text = engine.translate(source, target_locale)?;
            Ok((text, PROVIDER_MOCK))
        }
        ProviderKind::Deepl | ProviderKind::Google => {
            let text = ugc_translate_http::translate_upstream(kind, source, target_locale).await?;
            Ok((text, kind.as_str()))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn source_hash_is_stable_for_same_text() {
        let a = source_hash("故宫讲解，含午门与珍宝馆。");
        let b = source_hash("故宫讲解，含午门与珍宝馆。");
        assert_eq!(a, b);
        assert_eq!(a.len(), 64);
    }

    #[test]
    fn source_hash_changes_when_source_changes() {
        let a = source_hash("故宫讲解");
        let b = source_hash("故宫讲解。含茶歇。");
        assert_ne!(a, b);
    }

    #[test]
    fn same_hash_does_not_call_engine_twice() {
        let source = "向导简介原文";
        let mut engine = MockEngine::default();
        let first = resolve_translation(source, "en", None, &mut engine).expect("miss");
        assert_eq!(first.cache, CacheStatus::Miss);
        assert_eq!(engine.calls, 1);

        let cached = CachedRow {
            source_hash: first.source_hash.clone(),
            source_locale: "zh".into(),
            translated_text: first.translated_text.clone(),
            provider: first.provider.clone(),
        };
        let second = resolve_translation(source, "en", Some(&cached), &mut engine).expect("hit");
        assert_eq!(second.cache, CacheStatus::Hit);
        assert_eq!(second.translated_text, first.translated_text);
        assert_eq!(engine.calls, 1);
    }

    #[test]
    fn changed_source_invalidates_old_translation() {
        let mut engine = MockEngine::default();
        let original = "旧正文";
        let first = resolve_translation(original, "en", None, &mut engine).expect("first");
        assert_eq!(engine.calls, 1);

        let stale = CachedRow {
            source_hash: first.source_hash.clone(),
            source_locale: "zh".into(),
            translated_text: first.translated_text.clone(),
            provider: first.provider.clone(),
        };
        let updated = "新正文，已改";
        // Caller looks up by *new* hash → miss. Passing the stale row still must not return it:
        let second = resolve_translation(updated, "en", Some(&stale), &mut engine).expect("miss");
        assert_eq!(second.cache, CacheStatus::Miss);
        assert_ne!(second.source_hash, first.source_hash);
        assert_ne!(second.translated_text, first.translated_text);
        assert_eq!(engine.calls, 2);
        assert!(second.translated_text.contains("新正文"));
        assert!(!second.translated_text.contains("旧正文"));
    }

    #[test]
    fn target_locale_whitelist_zh_en_only() {
        assert_eq!(parse_target_locale("en").unwrap(), "en");
        assert_eq!(parse_target_locale("ZH").unwrap(), "zh");
        assert_eq!(
            parse_target_locale("ja"),
            Err(TranslateError::InvalidTargetLocale)
        );
        assert_eq!(
            parse_target_locale("fr"),
            Err(TranslateError::InvalidTargetLocale)
        );
    }

    #[test]
    fn dm_message_is_deferred() {
        assert_eq!(
            validate_content_class_and_field("dm_message", "body"),
            Err(TranslateError::DmNotThisSlice)
        );
    }

    #[test]
    fn community_post_body_is_allowed() {
        assert_eq!(
            validate_content_class_and_field("community_post", "body"),
            Ok(())
        );
        assert_eq!(
            validate_content_class_and_field("community_post", "title"),
            Err(TranslateError::InvalidField)
        );
        assert_eq!(
            validate_content_class_and_field("catalog_poi", "title"),
            Err(TranslateError::InvalidContentClass)
        );
    }

    #[test]
    fn itinerary_teaser_is_allowed() {
        assert_eq!(
            validate_content_class_and_field("itinerary", "teaser"),
            Ok(())
        );
        assert_eq!(
            validate_content_class_and_field("itinerary", "days_json"),
            Ok(())
        );
        assert_eq!(
            validate_content_class_and_field("itinerary", "title"),
            Err(TranslateError::InvalidField)
        );
    }

    #[test]
    fn provider_defaults_to_mock() {
        let _g = crate::test_env_serial::lock();
        let prev_p = std::env::var("TRANSLATION_PROVIDER").ok();
        std::env::remove_var("TRANSLATION_PROVIDER");
        assert_eq!(provider_kind_from_env().unwrap(), ProviderKind::Mock);
        match prev_p {
            Some(v) => std::env::set_var("TRANSLATION_PROVIDER", v),
            None => std::env::remove_var("TRANSLATION_PROVIDER"),
        }
    }

    #[test]
    fn deepl_without_key_is_fail_closed() {
        let _g = crate::test_env_serial::lock();
        let prev_p = std::env::var("TRANSLATION_PROVIDER").ok();
        let prev_k = std::env::var("DEEPL_AUTH_KEY").ok();
        std::env::set_var("TRANSLATION_PROVIDER", "deepl");
        std::env::remove_var("DEEPL_AUTH_KEY");
        assert_eq!(
            provider_kind_from_env(),
            Err(TranslateError::ProviderUnconfigured)
        );
        match prev_p {
            Some(v) => std::env::set_var("TRANSLATION_PROVIDER", v),
            None => std::env::remove_var("TRANSLATION_PROVIDER"),
        }
        match prev_k {
            Some(v) => std::env::set_var("DEEPL_AUTH_KEY", v),
            None => std::env::remove_var("DEEPL_AUTH_KEY"),
        }
    }

    #[test]
    fn unknown_provider_is_fail_closed() {
        let _g = crate::test_env_serial::lock();
        let prev_p = std::env::var("TRANSLATION_PROVIDER").ok();
        std::env::set_var("TRANSLATION_PROVIDER", "aws");
        assert_eq!(
            provider_kind_from_env(),
            Err(TranslateError::ProviderUnconfigured)
        );
        match prev_p {
            Some(v) => std::env::set_var("TRANSLATION_PROVIDER", v),
            None => std::env::remove_var("TRANSLATION_PROVIDER"),
        }
    }
}
