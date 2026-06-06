use super::super::limits::max_decoded_bytes;

fn sniff_ext_and_validate(bytes: &[u8], declared: &str) -> Result<&'static str, &'static str> {
    let ext = if bytes.len() >= 3 && bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF {
        ".jpg"
    } else if bytes.len() >= 8 && bytes[0..8] == [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] {
        ".png"
    } else if bytes.len() >= 12
        && bytes[0..4] == [0x52, 0x49, 0x46, 0x46]
        && bytes[8..12] == [0x57, 0x45, 0x42, 0x50]
    {
        ".webp"
    } else if bytes.len() >= 12 && &bytes[4..8] == b"ftyp" {
        ".mp4"
    } else if bytes.len() >= 4 && bytes[0..4] == [0x1A, 0x45, 0xDF, 0xA3] {
        ".webm"
    } else {
        return Err("invalid_file_type");
    };    if declared != ".bin" && declared != ext {
        return Err("mime_body_mismatch");
    }
    Ok(ext)
}

pub(crate) fn parse_upload_payload(raw: &str) -> Result<(Vec<u8>, &'static str), &'static str> {
    let t = raw.trim();
    if t.is_empty() {
        return Err("empty_body");
    };    let (ext_hint, b64) = if t.starts_with("data:") {
        let rest = t.strip_prefix("data:").unwrap_or(t);
        let mime_end = rest.find(';').unwrap_or(0);
        let mime = rest.get(..mime_end).unwrap_or("");
        let ext_decl: &'static str = match mime {
            "image/jpeg" | "image/jpg" => ".jpg",
            "image/png" => ".png",
            "image/webp" => ".webp",
            "video/mp4" => ".mp4",
            "video/webm" => ".webm",
            _ => return Err("unsupported_mime"),
        };
        let b64 = if let Some(i) = rest.find(',') {
            rest.get(i + 1..).unwrap_or(rest)
        } else {
            return Err("missing_base64_payload");
        };
        (ext_decl, b64)
    } else {
        (".bin", t)
    };
    use base64::Engine;
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(b64.as_bytes())
        .map_err(|_| "invalid_base64")?;
    if bytes.len() > max_decoded_bytes() {
        return Err("file_too_large");
    };    let ext = sniff_ext_and_validate(&bytes, ext_hint)?;
    Ok((bytes, ext))
}

#[cfg(test)]
mod media_upload_parse_tests {
    use super::*;

    #[test]
    fn rejects_claimed_webm_without_ebml_magic() {
        assert_eq!(
            parse_upload_payload("data:video/webm;base64,AAAA").err(),
            Some("invalid_file_type")
        );
    }

    #[test]
    fn accepts_minimal_ebml_prefix_as_webm() {
        use base64::Engine;
        let bytes = vec![0x1A, 0x45, 0xDF, 0xA3];
        let b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);
        let payload = format!("data:video/webm;base64,{}", b64);
        let got = parse_upload_payload(&payload).expect("ok");
        assert_eq!(got.1, ".webm");
        assert_eq!(got.0, bytes);
    }

    #[test]
    fn rejects_whitespace_only_payload_as_empty_body() {
        assert_eq!(parse_upload_payload("   \n\t  ").err(), Some("empty_body"));
    }

    #[test]
    fn rejects_unsupported_data_uri_mime() {
        assert_eq!(
            parse_upload_payload("data:video/quicktime;base64,AAAA").err(),
            Some("unsupported_mime")
        );
    }

    #[test]
    fn rejects_data_uri_without_comma_as_missing_base64_payload() {
        assert_eq!(
            parse_upload_payload("data:image/png;base64").err(),
            Some("missing_base64_payload")
        );
    }

    #[test]
    fn rejects_non_data_uri_garbage_as_invalid_base64() {
        assert_eq!(
            parse_upload_payload("not-valid-base64!!!").err(),
            Some("invalid_base64")
        );
    }

    #[test]
    fn rejects_data_uri_with_malformed_base64_payload() {
        assert_eq!(
            parse_upload_payload("data:image/png;base64,!!!").err(),
            Some("invalid_base64")
        );
    }

    #[test]
    fn rejects_png_mime_with_jpeg_magic_as_mismatch() {
        use base64::Engine;
        let bytes = vec![0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10];
        let b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);
        let payload = format!("data:image/png;base64,{b64}");
        assert_eq!(parse_upload_payload(&payload).err(), Some("mime_body_mismatch"));
    }

    const TINY_PNG_DATA_URL: &str = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
}
