//! Auth 出站邮件正文（纯文本 + HTML）。
//! 视觉对齐 **Product / Release Baseline · Auth L5**（暖金暗玻璃；禁止默认蓝白壳）。
//! 品牌标 SSOT = `frontend/public/brand/bimi-logo.svg`（TT 方标）→ 邮件用同构图 PNG。
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

/// 邮件内品牌标 URL。优先 `TRAVELTRUST_EMAIL_BRAND_MARK_URL`，否则 `{PUBLIC_APP_BASE}/brand/traveltrust-email-mark.png`（与 BIMI TT 同源）。
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

fn preheader_row(text: &str) -> String {
    let t = escape_html(text);
    // Hidden preheader · improves inbox preview · email-client compatible
    format!(
        r##"<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">{t}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>"##
    )
}

fn brand_header_row(mark_url: &str) -> String {
    let mark_e = escape_html(mark_url);
    // L5 头图：固定 56×56 金框。alt 仅用「TT」（禁止长 alt 在屏蔽图时折成 TravelTr/ust）。
    // 无图时单元格内可见 TT 字标，有图时覆盖为 PNG（与 bimi-logo TT 同源）。
    format!(
        r##"<tr>
<td style="padding:28px 28px 16px;background:#0c0a09;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
  <tr>
    <td style="vertical-align:middle;width:56px;max-width:56px;">
      <table role="presentation" width="56" height="56" cellpadding="0" cellspacing="0" style="width:56px;height:56px;border-collapse:collapse;border:2px solid #f9d779;border-radius:14px;background:#0c0a09;">
      <tr>
        <td width="56" height="56" align="center" valign="middle" style="width:56px;height:56px;text-align:center;vertical-align:middle;font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;line-height:56px;color:#fde9a8;letter-spacing:0.06em;">
          <img src="{mark_e}" width="52" height="52" alt="TT" style="display:block;margin:0 auto;width:52px;height:52px;border:0;outline:none;text-decoration:none;border-radius:12px;" />
        </td>
      </tr>
      </table>
    </td>
    <td style="vertical-align:middle;padding-left:16px;">
      <div style="font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#f9d779;font-weight:700;line-height:1.25;white-space:nowrap;">TRAVELTRUST</div>
      <div style="margin-top:6px;font-size:13px;line-height:1.45;color:#cbd5e1;font-weight:500;">账户安全邮件 · Secure mail</div>
    </td>
  </tr>
  </table>
</td>
</tr>"##
    )
}

fn shell_html(title: &str, preheader: &str, inner: &str) -> String {
    let title_e = escape_html(title);
    let mark_url = read_email_brand_mark_url();
    let brand = brand_header_row(&mark_url);
    let pre = preheader_row(preheader);
    format!(
        r##"<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark light">
<meta name="supported-color-schemes" content="dark light">
<title>{title_e}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,'PingFang SC','Microsoft YaHei',sans-serif;color:#e2e8f0;">
{pre}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:28px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#0c0a09;border-radius:16px;overflow:hidden;border:1px solid rgba(249,215,121,0.32);">
{brand}
<tr>
<td style="padding:8px 28px 4px;background:#0c0a09;">
  <div style="height:1px;line-height:1px;background:linear-gradient(90deg,transparent,rgba(249,215,121,0.45),transparent);">&nbsp;</div>
</td>
</tr>
<tr>
<td style="padding:18px 28px 8px;background:#0c0a09;">
  <div style="font-size:22px;line-height:1.35;font-weight:700;color:#f9d779;">{title_e}</div>
</td>
</tr>
<tr>
<td style="padding:12px 28px 28px;background:#0c0a09;">
{inner}
</td>
</tr>
<tr>
<td style="padding:18px 28px 24px;border-top:1px solid rgba(249,215,121,0.14);background:#0c0a09;font-size:12px;line-height:1.6;color:#94a3b8;">
  TravelTrust · web3-ttg.com<br>
  若非本人操作，可忽略本邮件。If you did not request this, ignore it safely.
</td>
</tr>
</table>
</td></tr>
</table>
</body>
</html>"##
    )
}

/// 注册 6 位验证码 — 纯文本（投递/反垃圾友好）。
pub fn register_verification_code_text(code: &str) -> String {
    format!(
        "TravelTrust\n\n您的注册验证码 / Registration code:\n\n{code}\n\n有效期 10 分钟 / Valid for 10 minutes.\n请勿转发本验证码。Do not share this code.\n\n若非本人操作请忽略。If you did not request this, ignore this email.\n\nTravelTrust · web3-ttg.com\n"
    )
}

/// 注册 6 位验证码 — HTML（Auth L5 · TT 品牌标）。
pub fn register_verification_code_html(code: &str) -> String {
    // 字距：用 &nbsp; 分隔，避免部分客户端忽略 letter-spacing。
    let code_spaced: String = code
        .chars()
        .filter(|c| !c.is_whitespace())
        .map(|c| escape_html(&c.to_string()))
        .collect::<Vec<_>>()
        .join("&nbsp;");
    let inner = format!(
        r##"<p style="margin:0 0 6px;font-size:15px;line-height:1.65;color:#e2e8f0;">使用以下验证码完成 TravelTrust 注册：</p>
<p style="margin:0 0 22px;font-size:13px;line-height:1.55;color:#94a3b8;">Use this code to finish creating your account.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;border-collapse:separate;">
<tr><td align="center" style="background:#14100d;border:1px solid rgba(249,215,121,0.40);border-radius:14px;padding:26px 18px;">
  <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(249,215,121,0.88);font-weight:700;margin-bottom:16px;">验证码 · Verification</div>
  <div style="font-size:34px;line-height:1.2;font-weight:700;color:#fde9a8;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Courier New',monospace;">{code_spaced}</div>
</td></tr>
</table>
<p style="margin:0;font-size:14px;line-height:1.65;color:#94a3b8;">有效期 <strong style="color:#f9d779;">10 分钟</strong>。请勿与他人分享。<br>Valid for <strong style="color:#f9d779;">10 minutes</strong>. Do not share this code.</p>"##
    );
    shell_html(
        "注册验证码 · Registration code",
        &format!("TravelTrust 注册验证码 {code}（10 分钟内有效）"),
        &inner,
    )
}

/// 密码重置 / 邮箱验证链接 — 纯文本。
pub fn auth_link_text(subject: &str, url: &str) -> String {
    format!("{subject}\n\nOpen this link to continue:\n{url}\n\nIf you did not request this, ignore this email.\n\nTravelTrust · web3-ttg.com\n")
}

/// 密码重置 / 邮箱验证链接 — HTML（Auth L5）。
pub fn auth_link_html(title: &str, url: &str, cta: &str) -> String {
    let url_e = escape_html(url);
    let cta_e = escape_html(cta);
    let title_plain = title;
    let inner = format!(
        r##"<p style="margin:0 0 22px;font-size:15px;line-height:1.65;color:#e2e8f0;">点击下方按钮继续。链接将按账户安全策略过期。<br><span style="font-size:13px;color:#94a3b8;">Continue with the button below. This link expires per your account security policy.</span></p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 22px;">
<tr><td align="center" bgcolor="#f9d779" style="background:#f9d779;border-radius:10px;border:1px solid #d4a84b;">
  <a href="{url_e}" style="display:inline-block;padding:14px 26px;font-size:15px;font-weight:700;color:#1a120c;text-decoration:none;">{cta_e}</a>
</td></tr>
</table>
<p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;word-break:break-all;">或复制链接 / Or paste URL:<br><a href="{url_e}" style="color:#f9d779;">{url_e}</a></p>"##
    );
    shell_html(
        title_plain,
        &format!("{title_plain} — TravelTrust"),
        &inner,
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn register_code_html_is_auth_l5_not_blue_shell() {
        let html = register_verification_code_html("12<script>34");
        assert!(html.contains("12") && html.contains("&lt;script&gt;") && html.contains("34"));
        assert!(!html.contains("<script>"));
        assert!(html.contains("TravelTrust") || html.contains("TRAVELTRUST"));
        assert!(html.contains("10") && html.contains("分钟") || html.contains("minutes"));
        assert!(html.contains("#0c0a09"), "Auth L5 dark shell");
        assert!(html.contains("#f9d779") || html.contains("#fde9a8"), "Auth L5 sun/gold");
        assert!(
            !html.contains("#0ea5e9") && !html.contains("#0284c7"),
            "must not use default blue shell"
        );
        assert!(
            html.contains("traveltrust-email-mark.png") || html.contains("http"),
            "brand mark in header"
        );
        assert!(html.contains("web3-ttg.com"), "domain identity for deliverability");
        assert!(html.contains("display:none"), "preheader present");
        assert!(
            html.contains("alt=\"TT\""),
            "short alt prevents TravelTr/ust wrap when images blocked"
        );
        assert!(
            !html.contains("alt=\"TravelTrust\""),
            "long alt must not be used on 56px mark"
        );
        assert!(html.contains("white-space:nowrap"), "brand word must not wrap");
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
        assert!(t.contains("10"));
        assert!(t.contains("web3-ttg.com"));
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
