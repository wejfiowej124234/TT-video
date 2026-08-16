//! DeepL / Google Cloud Translation v2 — **仅 API 进程持有密钥**。浏览器禁止带厂商 key。
//! ① 默认不走本模块（`TRANSLATION_PROVIDER=mock`）。② Staging / ③ Official 才配真密钥。

use serde::Deserialize;
use serde_json::json;

use crate::ugc_translate::{
    ProviderKind, TranslateError, MAX_SOURCE_CHARS, PROVIDER_DEEPL, PROVIDER_GOOGLE,
};

const HTTP_TIMEOUT_SECS: u64 = 8;

#[derive(Debug, Deserialize)]
struct DeeplResponse {
    translations: Vec<DeeplTranslation>,
}

#[derive(Debug, Deserialize)]
struct DeeplTranslation {
    text: String,
}

#[derive(Debug, Deserialize)]
struct GoogleResponse {
    data: GoogleData,
}

#[derive(Debug, Deserialize)]
struct GoogleData {
    translations: Vec<GoogleTranslation>,
}

#[derive(Debug, Deserialize)]
struct GoogleTranslation {
    #[serde(rename = "translatedText")]
    translated_text: String,
}

pub fn deepl_target_lang(target_locale: &str) -> &'static str {
    match target_locale {
        "zh" => "ZH",
        _ => "EN",
    }
}

pub fn google_target_lang(target_locale: &str) -> &'static str {
    match target_locale {
        "zh" => "zh",
        _ => "en",
    }
}

/// DeepL Free keys 以 `:fx` 结尾 → `api-free.deepl.com`；否则 Pro。
pub fn deepl_api_url(auth_key: &str, override_url: Option<&str>) -> String {
    if let Some(u) = override_url.map(str::trim).filter(|s| !s.is_empty()) {
        return u.trim_end_matches('/').to_string();
    }
    if auth_key.trim().ends_with(":fx") {
        "https://api-free.deepl.com/v2/translate".to_string()
    } else {
        "https://api.deepl.com/v2/translate".to_string()
    }
}

pub fn parse_deepl_translated_text(body: &str) -> Result<String, TranslateError> {
    let parsed: DeeplResponse = serde_json::from_str(body).map_err(|_| TranslateError::UpstreamFailed)?;
    let text = parsed
        .translations
        .first()
        .map(|t| t.text.trim())
        .filter(|s| !s.is_empty())
        .ok_or(TranslateError::UpstreamFailed)?;
    Ok(text.to_string())
}

pub fn parse_google_translated_text(body: &str) -> Result<String, TranslateError> {
    let parsed: GoogleResponse = serde_json::from_str(body).map_err(|_| TranslateError::UpstreamFailed)?;
    let text = parsed
        .data
        .translations
        .first()
        .map(|t| t.translated_text.trim())
        .filter(|s| !s.is_empty())
        .ok_or(TranslateError::UpstreamFailed)?;
    Ok(text.to_string())
}

fn require_source_len(source: &str) -> Result<(), TranslateError> {
    if source.chars().count() > MAX_SOURCE_CHARS {
        Err(TranslateError::SourceTooLong)
    } else {
        Ok(())
    }
}

fn http_client() -> Result<reqwest::Client, TranslateError> {
    reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(HTTP_TIMEOUT_SECS))
        .build()
        .map_err(|_| TranslateError::UpstreamFailed)
}

pub async fn translate_upstream(
    kind: ProviderKind,
    source: &str,
    target_locale: &str,
) -> Result<String, TranslateError> {
    require_source_len(source)?;
    match kind {
        ProviderKind::Mock => unreachable!("mock does not call upstream"),
        ProviderKind::Deepl => translate_deepl(source, target_locale).await,
        ProviderKind::Google => translate_google(source, target_locale).await,
    }
}

async fn translate_deepl(source: &str, target_locale: &str) -> Result<String, TranslateError> {
    let key = std::env::var("DEEPL_AUTH_KEY")
        .unwrap_or_default()
        .trim()
        .to_string();
    if key.is_empty() {
        return Err(TranslateError::ProviderUnconfigured);
    }
    let override_url = std::env::var("DEEPL_API_URL").ok();
    let url = deepl_api_url(&key, override_url.as_deref());
    let client = http_client()?;
    let res = client
        .post(url)
        .header("Authorization", format!("DeepL-Auth-Key {key}"))
        .json(&json!({
            "text": [source],
            "target_lang": deepl_target_lang(target_locale),
        }))
        .send()
        .await
        .map_err(|_| TranslateError::UpstreamFailed)?;
    if !res.status().is_success() {
        eprintln!(
            "[ugc_translate] upstream HTTP error provider={PROVIDER_DEEPL} status={}",
            res.status().as_u16()
        );
        return Err(TranslateError::UpstreamFailed);
    }
    let body = res.text().await.map_err(|_| TranslateError::UpstreamFailed)?;
    parse_deepl_translated_text(&body)
}

async fn translate_google(source: &str, target_locale: &str) -> Result<String, TranslateError> {
    let key = std::env::var("GOOGLE_TRANSLATE_API_KEY")
        .unwrap_or_default()
        .trim()
        .to_string();
    if key.is_empty() {
        return Err(TranslateError::ProviderUnconfigured);
    }
    let url = std::env::var("GOOGLE_TRANSLATE_API_URL")
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "https://translation.googleapis.com/language/translate/v2".to_string());
    let client = http_client()?;
    let res = client
        .post(url)
        .query(&[("key", key.as_str())])
        .json(&json!({
            "q": source,
            "target": google_target_lang(target_locale),
            "format": "text",
        }))
        .send()
        .await
        .map_err(|_| TranslateError::UpstreamFailed)?;
    if !res.status().is_success() {
        eprintln!(
            "[ugc_translate] upstream HTTP error provider={PROVIDER_GOOGLE} status={}",
            res.status().as_u16()
        );
        return Err(TranslateError::UpstreamFailed);
    }
    let body = res.text().await.map_err(|_| TranslateError::UpstreamFailed)?;
    parse_google_translated_text(&body)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn deepl_maps_zh_en() {
        assert_eq!(deepl_target_lang("zh"), "ZH");
        assert_eq!(deepl_target_lang("en"), "EN");
    }

    #[test]
    fn deepl_free_key_uses_api_free_host() {
        let url = deepl_api_url("xxxxxxxx:fx", None);
        assert!(url.contains("api-free.deepl.com"), "{url}");
        let pro = deepl_api_url("xxxxxxxx", None);
        assert!(pro.contains("api.deepl.com"), "{pro}");
        assert!(!pro.contains("api-free"), "{pro}");
    }

    #[test]
    fn parse_deepl_json() {
        let body = r#"{"translations":[{"detected_source_language":"ZH","text":"Osaka Castle"}]}"#;
        assert_eq!(parse_deepl_translated_text(body).unwrap(), "Osaka Castle");
    }

    #[test]
    fn parse_google_json() {
        let body = r#"{"data":{"translations":[{"translatedText":"Osaka Castle","detectedSourceLanguage":"zh"}]}}"#;
        assert_eq!(parse_google_translated_text(body).unwrap(), "Osaka Castle");
    }

    #[test]
    fn empty_upstream_json_is_fail_closed() {
        assert_eq!(
            parse_deepl_translated_text(r#"{"translations":[]}"#),
            Err(TranslateError::UpstreamFailed)
        );
    }
}
