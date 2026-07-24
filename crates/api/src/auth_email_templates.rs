//! Auth 出站邮件正文（纯文本 + HTML）。
//! 视觉对齐 **Product / Release Baseline · Auth L5**（暖金暗玻璃；禁止默认蓝白壳）。
//! Final Truth Baseline = cite-only；本模块属 Engineering SSOT 出站投递层。

use crate::email_transport::read_public_app_base_url;

fn escape_html(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for c in s.chars() {
        match c {
            '&' => out.push_str("&amp;"),
            '<' => out.push_str("&lt;"),
            '>' => out.push_str("&gt;"),
            '"' => out.push_str("&quot;"),
            '\'' => out.push_str("&#39;"),
            _ => out.push(c),
        }
    }
    out
}

/// 邮件内品牌标 URL（Gmail 正文头像区）。优先 `TRAVELTRUST_EMAIL_BRAND_MARK_URL`，否则 `{PUBLIC_APP_BASE}/brand/traveltrust-email-mark.png`。
pub fn read_email_brand_mark_url() -> String {
    if let Ok(v) = std::env::var("TRAVELTRUST_EMAIL_BRAND_MARK_URL") {
        let t = v.trim().to_string();
        if !t.is_empty() {
            return t;
        }
    }
    format!(
        "{}/brand/traveltrust-email-mark.png",
        read_public_app_base_url().trim_end_matches('/')
    )
}

fn brand_header_row(mark_url: &str) -> String {
    let mark_e = escape_html(mark_url);
    format!(
        r##"<tr>
<td style="padding:24px 28px 8px;background:#0c0a09;">
  <table role="presentation" cellpadding="0" cellspacing="0">
  <tr>
    <td style="vertical-align:middle;padding-right:14px;">
      <img src="{mark_e}" width="48" height="48" alt="TravelTrust" style="display:block;border-radius:12px;border:1px solid rgba(249,215,121,0.45);" />
    </td>
    <td style="vertical-align:middle;">
      <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:rgba(249,215,121,0.72);font-weight:600;">TravelTrust</div>
      <div style="margin-top:4px;font-size:15px;line-height:1.3;color:#f5f0e8;font-weight:600;">Secure account mail</div>
    </td>
  </tr>
  </table>
</td>
</tr>"##
    )
}

fn shell_html(title: &str, inner: &str) -> String {
    let title_e = escape_html(title);
    let mark_url = read_email_brand_mark_url();
    let brand = brand_header_row(&mark_url);
    format!(
        r##"<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<title>{title_e}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#cbd5e1;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#0c0a09;border-radius:14px;overflow:hidden;border:1px solid rgba(249,215,121,0.28);">
{brand}
<tr>
<td style="padding:12px 28px 6px;background:#0c0a09;">
  <div style="font-size:22px;line-height:1.35;font-weight:700;background:linear-gradient(180deg,#fde9a8 0%,#f9d779 45%,#d4a84b 100%);-webkit-background-clip:text;background-clip:text;color:#f9d779;">{title_e}</div>
</td>
</tr>
<tr>
<td style="padding:18px 28px 28px;background:#0c0a09;">
{inner}
</td>
</tr>
<tr>
<td style="padding:16px 28px 22px;border-top:1px solid rgba(249,215,121,0.12);background:#0c0a09;font-size:12px;line-height:1.55;color:#94a3b8;">
  Sent by TravelTrust. If you did not request this message, you can ignore it safely.
</td>
</tr>
</table>
</td></tr>
</table>
</body>
</html>"##
    )
}

/// 注册 6 位验证码 — 纯文本。
pub fn register_verification_code_text(code: &str) -> String {
    format!(
        "TravelTrust\n\nYour registration verification code is:\n\n{code}\n\nValid for 10 minutes.\nDo not share this code.\n\nIf you did not request this code, ignore this email.\n"
    )
}

/// 注册 6 位验证码 — HTML（Auth L5）。
pub fn register_verification_code_html(code: &str) -> String {
    let code_e = escape_html(code);
    let inner = format!(
        r##"<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:rgba(226,232,240,0.92);">Use this code to finish creating your TravelTrust account:</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;">
<tr><td align="center" style="background:rgba(249,215,121,0.07);border:1px solid rgba(249,215,121,0.28);border-radius:12px;padding:22px 16px;">
  <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(249,215,121,0.75);font-weight:600;margin-bottom:12px;">Verification code</div>
  <div style="font-size:34px;letter-spacing:0.32em;font-weight:700;color:#fde9a8;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">{code_e}</div>
</td></tr>
</table>
<p style="margin:0;font-size:14px;line-height:1.55;color:#94a3b8;">Valid for <strong style="color:#f9d779;">10 minutes</strong>. Do not share this code with anyone.</p>"##
    );
    shell_html("Registration verification", &inner)
}

/// 密码重置 / 邮箱验证链接 — 纯文本。
pub fn auth_link_text(subject: &str, url: &str) -> String {
    format!("{subject}\n\nOpen this link to continue:\n{url}\n\nIf you did not request this, ignore this email.\n")
}

/// 密码重置 / 邮箱验证链接 — HTML（Auth L5）。
pub fn auth_link_html(title: &str, url: &str, cta: &str) -> String {
    let url_e = escape_html(url);
    let cta_e = escape_html(cta);
    let inner = format!(
        r##"<p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:rgba(226,232,240,0.92);">Continue securely with the button below. This link expires according to your account security policy.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 22px;">
<tr><td align="center" style="background:linear-gradient(135deg,#fde9a8 0%,#f9d779 50%,#d4a84b 100%);border-radius:10px;border:1px solid rgba(249,215,121,0.45);">
  <a href="{url_e}" style="display:inline-block;padding:13px 24px;font-size:15px;font-weight:700;color:#1a120c;text-decoration:none;">{cta_e}</a>
</td></tr>
</table>
<p style="margin:0;font-size:12px;line-height:1.55;color:#64748b;word-break:break-all;">Or paste this URL into your browser:<br><a href="{url_e}" style="color:#f9d779;">{url_e}</a></p>"##
    );
    shell_html(title, &inner)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn register_code_html_is_auth_l5_not_blue_shell() {
        let html = register_verification_code_html("12<script>34");
        assert!(html.contains("12&lt;script&gt;34"));
        assert!(!html.contains("<script>"));
        assert!(html.contains("TravelTrust"));
        assert!(html.contains("10 minutes"));
        assert!(html.contains("#0c0a09"), "Auth L5 dark shell");
        assert!(html.contains("#f9d779") || html.contains("#fde9a8"), "Auth L5 sun/gold");
        assert!(
            !html.contains("#0ea5e9") && !html.contains("#0284c7"),
            "must not use default blue shell"
        );
        assert!(
            html.contains("traveltrust-email-mark.png") || html.contains("TRAVELTRUST"),
            "brand mark in header"
        );
    }

    #[test]
    fn auth_link_html_includes_url_and_cta() {
        let html = auth_link_html(
            "Reset your password",
            "https://example.com/reset?t=abc&x=1",
            "Reset password",
        );
        assert!(html.contains("https://example.com/reset?t=abc&amp;x=1"));
        assert!(html.contains("Reset password"));
        assert!(html.contains("TravelTrust"));
        assert!(html.contains("#0c0a09"));
    }

    #[test]
    fn plain_text_keeps_code_readable() {
        let t = register_verification_code_text("329730");
        assert!(t.contains("329730"));
        assert!(t.contains("10 minutes"));
    }

    #[test]
    fn brand_mark_url_uses_public_base_by_default() {
        std::env::remove_var("TRAVELTRUST_EMAIL_BRAND_MARK_URL");
        std::env::set_var("TRAVELTRUST_PUBLIC_APP_BASE_URL", "https://tt-web-staging.fly.dev");
        let u = read_email_brand_mark_url();
        assert_eq!(
            u,
            "https://tt-web-staging.fly.dev/brand/traveltrust-email-mark.png"
        );
        std::env::remove_var("TRAVELTRUST_PUBLIC_APP_BASE_URL");
    }
}
