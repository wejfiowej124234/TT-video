//! chain_off 认证：注册/登录/种子账号/占位 stub/鉴权解析（48 §5.2）

use axum::{
    http::{HeaderMap, StatusCode},
    Json,
};
use chrono::{Duration, Utc};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

use super::{
    strict_auth_db_write_enabled, strict_seed_db_write_enabled, ChainOffState, GuideRow, UserRow,
};

const PASSWORD_MIN_LEN: usize = 8;
const PASSWORD_MAX_LEN: usize = 72; // bcrypt 字节上限
const EMAIL_MAX_LEN: usize = 254;

fn is_valid_email_format(s: &str) -> bool {
    let t = s.trim();
    if t.is_empty() || t.len() > EMAIL_MAX_LEN {
        return false;
    }
    if !t.contains('@') || t.starts_with('@') || t.ends_with('@') {
        return false;
    }
    let parts: Vec<&str> = t.splitn(2, '@').collect();
    if parts.len() != 2 || parts[0].is_empty() || parts[1].is_empty() {
        return false;
    }
    if parts[1].find('.').is_none() {
        return false;
    }
    !t.contains(|c: char| c.is_control() || c == ' ' || c == '\n' || c == '\r')
}

/// 公开注册允许的 **`body.role`** 值（**695**：含 **87** 协议名 **`traveler`**；**697**：`traveler` **落库** **`traveler`**，与 **`tourist`** 并存）。
fn is_self_serve_registration_role(role: &str) -> bool {
    matches!(role, "tourist" | "traveler" | "provider" | "region_steward")
}

/// **`users.role`** 存储值（**PD-003**）：自服务注册 **仅** 即时落 **`traveler`/`tourist`**；
/// **`provider`/`region_steward`** 意图 **不** 直写 `users.role`，须 **`role_applications` 审核后** 生效。
fn registration_role_stored(role_after_trim: &str) -> String {
    match role_after_trim {
        "provider" | "region_steward" => "traveler".to_string(),
        other => other.to_string(),
    }
}

#[derive(Deserialize)]
pub struct AuthRegisterBody {
    pub email: String,
    pub password: String,
    #[serde(default)]
    pub nickname: Option<String>,
    #[serde(default)]
    pub default_wallet_address: Option<String>,
    /// 自服务注册角色（缺省 `tourist`）。**693**/**695**/**697**：允许 `tourist` \| **`traveler`**（**87** 协议名，**697** 起存 **`traveler`**）\| `provider` \| `region_steward`；`guide` 须走 `/guide/register`；`arbitrator` 仅 **`P3_SEED_ARBITRATOR_EMAIL`** 命中；`admin`/`super_admin` 等须 Admin 审批。
    #[serde(default)]
    pub role: Option<String>,
    /// 注册前邮箱 6 位验证码（`POST /auth/register/send-verification-code`）
    #[serde(default)]
    pub verification_code: Option<String>,
    /// G-S1 · 可选推荐码（102 §4.2 · `?ref=` 同源）
    #[serde(default)]
    pub referral_code: Option<String>,
}

#[derive(Deserialize)]
pub struct AuthRegisterSendVerificationCodeBody {
    pub email: String,
}

#[derive(Deserialize)]
pub struct AuthLoginBody {
    pub email: String,
    pub password: String,
}

#[derive(Deserialize)]
pub struct PutMeBody {
    pub nickname: Option<String>,
    pub avatar_url: Option<String>,
    pub default_wallet_address: Option<String>,
    /// 设置偏好 JSON（通知开关 · 社区可见性意向）
    pub settings_preferences: Option<serde_json::Value>,
}

#[derive(Deserialize)]
pub struct PutMePasswordBody {
    pub old_password: Option<String>,
    pub new_password: Option<String>,
}

pub async fn auth_register(
    state: ChainOffState,
    headers: Option<&HeaderMap>,
    Json(body): Json<AuthRegisterBody>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let email_trim = body.email.trim();
    if !is_valid_email_format(&body.email) {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key_detail(
                "invalid_email",
                "email format invalid or too long",
            )),
        ));
    }
    if body.password.len() < PASSWORD_MIN_LEN {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key_detail(
                "password_too_short",
                format!("password must be at least {} characters", PASSWORD_MIN_LEN),
            )),
        ));
    }
    if body.password.len() > PASSWORD_MAX_LEN {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key_detail(
                "password_too_long",
                format!("password max {} characters", PASSWORD_MAX_LEN),
            )),
        ));
    }
    let password_hash = match bcrypt::hash(body.password.as_str(), bcrypt::DEFAULT_COST) {
        Ok(h) => h,
        Err(_) => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("password_hash_failed")),
            ));
        }
    };
    let mut store = state.store.write().await;
    if store
        .users
        .values()
        .any(|u| u.email.eq_ignore_ascii_case(email_trim))
    {
        return Err((
            StatusCode::CONFLICT,
            Json(crate::api_json::err_key("email_already_registered")),
        ));
    }
    if let Err(err_key) = verify_register_verification_code(&mut store, email_trim, &body.verification_code)
    {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key(err_key)),
        ));
    }
    let referral_code_norm = body
        .referral_code
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(crate::db::normalize_referral_code);
    if let Some(ref code) = referral_code_norm {
        if let Some(ref pool) = state.db_pool {
            if let Err(reason) = crate::db::precheck_referral_for_register(pool, code).await {
                return Err((
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key(reason.as_key())),
                ));
            }
        }
    }
    let id = Uuid::new_v4();
    let now = Utc::now();
    let role = if std::env::var("P3_SEED_ARBITRATOR_EMAIL")
        .ok()
        .as_ref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .map(|s| s.eq_ignore_ascii_case(email_trim))
        .unwrap_or(false)
    {
        "arbitrator".to_string()
    } else if let Some(raw) = body
        .role
        .as_ref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
    {
        if !is_self_serve_registration_role(raw) {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_registration_role")),
            ));
        }
        registration_role_stored(raw)
    } else {
        "tourist".to_string()
    };
    let default_wallet = body.default_wallet_address.as_ref().and_then(|w| {
        let w = w.trim();
        if w.is_empty() {
            None
        } else if w.len() <= 42
            && w.starts_with("0x")
            && w[2..].chars().all(|c| c.is_ascii_hexdigit())
        {
            Some(w.to_string())
        } else {
            None
        }
    });
    let user = UserRow {
        id,
        email: email_trim.to_string(),
        password_hash: Some(password_hash.clone()),
        role: role.clone(),
        kyc_status: "none".to_string(),
        nickname: body.nickname.clone(),
        avatar_url: None,
        default_wallet_address: default_wallet,
        created_at: now,
        updated_at: now,
    };
    store.users.insert(id, user.clone());
    let verify_dev_token = if state.db_pool.is_none() {
        Some(issue_chain_off_email_verify_token(&mut store, id))
    } else {
        None
    };
    // 有 DB 时不透明会话令牌（不可从 user_id 推导）；纯内存模式保留 bearer_<uuid> 便于联调。
    let token = if state.db_pool.is_some() {
        format!("tts_{}", Uuid::new_v4())
    } else {
        format!("bearer_{}", id)
    };
    store.sessions.insert(token.clone(), id);
    let user_id_reg = user.id;
    let token_for_db = token.clone();
    drop(store);

    if let Some(ref pool) = state.db_pool {
        if strict_auth_db_write_enabled() {
            if let Err(e) = crate::db::insert_user(
                pool,
                user_id_reg,
                &user.email,
                user.password_hash.as_deref(),
                &user.role,
                &user.kyc_status,
                user.nickname.as_deref(),
                user.avatar_url.as_deref(),
                user.default_wallet_address.as_deref(),
                user.created_at,
                user.updated_at,
            )
            .await
            {
                eprintln!(
                    "[audit] strict auth_register: insert_user failed user_id={} error={}",
                    user_id_reg, e
                );
                let mut store = state.store.write().await;
                store.sessions.remove(&token_for_db);
                store.users.remove(&user_id_reg);
                return Err((
                    StatusCode::SERVICE_UNAVAILABLE,
                    Json(json!({
                        "error": "auth_db_persist_failed",
                        "message": "auth_db_persist_failed",
                        "rule": "TRAVELTRUST_STRICT_AUTH_DB_WRITE=1; register rolled back in memory",
                    })),
                ));
            }
            if let Err(e) = crate::db::insert_session(pool, &token_for_db, user_id_reg).await {
                eprintln!(
                    "[audit] strict auth_register: insert_session failed user_id={} error={}",
                    user_id_reg, e
                );
                let mut store = state.store.write().await;
                store.sessions.remove(&token_for_db);
                store.users.remove(&user_id_reg);
                return Err((
                    StatusCode::SERVICE_UNAVAILABLE,
                    Json(json!({
                        "error": "auth_db_persist_failed",
                        "message": "auth_db_persist_failed",
                        "rule": "TRAVELTRUST_STRICT_AUTH_DB_WRITE=1; register rolled back in memory",
                    })),
                ));
            }
            if let Some(ref w) = user.default_wallet_address {
                if let Err(e) = crate::db::sync_primary_wallet_dual_write(
                    pool,
                    user_id_reg,
                    w,
                    user.updated_at,
                )
                .await
                {
                    eprintln!(
                        "[audit] strict auth_register: sync_primary_wallet_dual_write user_id={user_id_reg} error={e}"
                    );
                }
            }
        } else {
            if let Err(e) = crate::db::insert_user(
                pool,
                user.id,
                &user.email,
                user.password_hash.as_deref(),
                &user.role,
                &user.kyc_status,
                user.nickname.as_deref(),
                user.avatar_url.as_deref(),
                user.default_wallet_address.as_deref(),
                user.created_at,
                user.updated_at,
            )
            .await
            {
                eprintln!(
                    "[audit] db insert_user on register failed user_id={} email_len={} error={}",
                    user.id,
                    user.email.len(),
                    e
                );
            }
            if let Err(e) = crate::db::insert_session(pool, &token_for_db, user.id).await {
                eprintln!(
                    "[audit] db insert_session on register failed user_id={} error={}",
                    user.id, e
                );
            }
            if let Some(ref w) = user.default_wallet_address {
                if let Err(e) = crate::db::sync_primary_wallet_dual_write(
                    pool,
                    user.id,
                    w,
                    user.updated_at,
                )
                .await
                {
                    eprintln!(
                        "[audit] auth_register: sync_primary_wallet_dual_write user_id={} error={e}",
                        user.id
                    );
                }
            }
        }
    }

    let mut early_bird_assign: Option<serde_json::Value> = None;
    if let Some(ref pool) = state.db_pool {
        match crate::db::assign_early_bird_on_register(pool, user_id_reg).await {
            Ok(assign) if assign.registration_rank > 0 => {
                early_bird_assign = Some(json!({
                    "registration_rank": assign.registration_rank,
                    "stage_number": assign.stage_number,
                    "multiplier": assign.multiplier,
                }));
            }
            Ok(_) => {}
            Err(e) => {
                eprintln!(
                    "[audit] auth_register assign_early_bird user_id={user_id_reg} error={e}"
                );
            }
        }
    }

    let mut referral_bound: Option<serde_json::Value> = None;
    if let Some(ref pool) = state.db_pool {
        if let Some(ref code) = referral_code_norm {
            match crate::db::bind_referral_on_register(pool, user_id_reg, code).await {
                Ok(bind) => {
                    referral_bound = Some(json!({
                        "referral_code": bind.referral_code,
                        "referrer_user_id": bind.referrer_user_id.to_string(),
                        "referral_event_id": bind.referral_event_id.to_string(),
                    }));
                }
                Err(reason) => {
                    eprintln!(
                        "[audit] auth_register referral bind failed user_id={} code={} reason={:?}",
                        user_id_reg, code, reason
                    );
                    if strict_auth_db_write_enabled() {
                        let mut store = state.store.write().await;
                        store.sessions.remove(&token_for_db);
                        store.users.remove(&user_id_reg);
                        return Err((
                            StatusCode::BAD_REQUEST,
                            Json(crate::api_json::err_key(reason.as_key())),
                        ));
                    }
                }
            }
        }
        if let Err(e) = crate::db::ensure_user_referral_code(pool, user_id_reg).await {
            eprintln!(
                "[audit] auth_register ensure_user_referral_code user_id={} error={e}",
                user_id_reg
            );
        }
        let scan_ctx = crate::db::GrowthFraudScanContext {
            client_ip: headers.and_then(crate::db::client_ip_from_headers),
            email: Some(email_trim.to_string()),
            referral_code: referral_code_norm.clone(),
            default_wallet_address: user.default_wallet_address.clone(),
            user_agent: headers
                .and_then(|h| h.get("user-agent"))
                .and_then(|v| v.to_str().ok())
                .map(String::from),
        };
        crate::db::run_growth_fraud_scan_best_effort(
            pool,
            user_id_reg,
            "register",
            scan_ctx,
        )
        .await;
    }

    let mut reg_json = json!({
        "status": "ok",
        "user_id": user.id.to_string(),
        "token": token,
        "role": user.role
    });
    if let Some(vt) = verify_dev_token {
        if let Some(obj) = reg_json.as_object_mut() {
            obj.insert("email_verification_dev_token".to_string(), json!(vt));
        }
    }
    if let Some(bound) = referral_bound {
        if let Some(obj) = reg_json.as_object_mut() {
            obj.insert("referral_bound".to_string(), bound);
        }
    }
    if let Some(eb) = early_bird_assign {
        if let Some(obj) = reg_json.as_object_mut() {
            obj.insert("early_bird".to_string(), eb);
        }
    }
    Ok(Json(reg_json))
}

fn register_verification_required() -> bool {
    match std::env::var("TRAVELTRUST_AUTH_REGISTER_REQUIRE_CODE")
        .ok()
        .as_deref()
        .map(str::trim)
    {
        Some("0") => false,
        Some("1") => true,
        _ => !cfg!(test),
    }
}

fn normalize_register_email_key(email: &str) -> String {
    email.trim().to_ascii_lowercase()
}

fn generate_register_verification_code() -> String {
    let n = Uuid::new_v4().as_u128() % 1_000_000;
    format!("{:06}", n)
}

fn is_valid_register_verification_code_format(code: &str) -> bool {
    code.len() == 6 && code.chars().all(|c| c.is_ascii_digit())
}

fn verify_register_verification_code(
    store: &mut super::ChainOffStore,
    email_trim: &str,
    verification_code: &Option<String>,
) -> Result<(), &'static str> {
    if !register_verification_required() {
        return Ok(());
    }
    let code_trim = verification_code
        .as_ref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty());
    let Some(code) = code_trim else {
        return Err("verification_code_required");
    };
    if !is_valid_register_verification_code_format(code) {
        return Err("verification_code_invalid");
    }
    let email_key = normalize_register_email_key(email_trim);
    let Some(entry) = store.register_verification_codes.get(&email_key) else {
        return Err("verification_code_invalid");
    };
    if entry.expires_at <= Utc::now() {
        store.register_verification_codes.remove(&email_key);
        return Err("verification_code_expired");
    }
    if entry.code != code {
        return Err("verification_code_invalid");
    }
    store.register_verification_codes.remove(&email_key);
    Ok(())
}

async fn dispatch_register_verification_code_email(to_email: &str, code: &str) -> bool {
    let transport = std::env::var("TRAVELTRUST_EMAIL_TRANSPORT")
        .unwrap_or_default()
        .trim()
        .to_ascii_lowercase();
    let subject = "TravelTrust registration verification code";
    match transport.as_str() {
        "log" => {
            eprintln!(
                "{}",
                json!({
                    "traveltrust_email_outbound": true,
                    "kind": "register_verification_code",
                    "to": to_email,
                    "subject": subject,
                    "code": code,
                })
            );
            true
        }
        _ => false,
    }
}

fn register_verification_returns_dev_code() -> bool {
    match std::env::var("TRAVELTRUST_AUTH_REGISTER_DEV_CODE_IN_RESPONSE")
        .ok()
        .as_deref()
        .map(str::trim)
    {
        Some("1") | Some("true") => return true,
        Some("0") | Some("false") => return false,
        _ => {}
    }
    let transport = std::env::var("TRAVELTRUST_EMAIL_TRANSPORT")
        .unwrap_or_default()
        .trim()
        .to_ascii_lowercase();
    transport.is_empty() || transport == "off" || transport == "log"
}

pub async fn auth_register_send_verification_code(
    state: ChainOffState,
    Json(body): Json<AuthRegisterSendVerificationCodeBody>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let email_trim = body.email.trim();
    if !is_valid_email_format(&body.email) {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key_detail(
                "invalid_email",
                "email format invalid or too long",
            )),
        ));
    }
    let email_key = normalize_register_email_key(email_trim);
    {
        let store = state.store.read().await;
        if store
            .users
            .values()
            .any(|u| u.email.eq_ignore_ascii_case(email_trim))
        {
            return Err((
                StatusCode::CONFLICT,
                Json(crate::api_json::err_key("email_already_registered")),
            ));
        }
        if let Some(entry) = store.register_verification_codes.get(&email_key) {
            if entry.sent_at + Duration::seconds(60) > Utc::now() {
                return Err((
                    StatusCode::TOO_MANY_REQUESTS,
                    Json(crate::api_json::err_key("verification_code_rate_limited")),
                ));
            }
        }
    }
    let code = generate_register_verification_code();
    let now = Utc::now();
    let entry = super::RegisterVerificationCodeEntry {
        code: code.clone(),
        expires_at: now + Duration::minutes(10),
        sent_at: now,
    };
    {
        let mut store = state.store.write().await;
        store
            .register_verification_codes
            .insert(email_key, entry);
    }
    let email_sent = dispatch_register_verification_code_email(email_trim, &code).await;
    let mut resp = json!({
        "status": "ok",
        "message": "verification_code_sent",
        "email_sent": email_sent,
    });
    if register_verification_returns_dev_code() {
        if let Some(obj) = resp.as_object_mut() {
            obj.insert(
                "registration_verification_dev_code".to_string(),
                json!(code),
            );
        }
    }
    Ok(Json(resp))
}

fn issue_chain_off_email_verify_token(store: &mut super::ChainOffStore, user_id: Uuid) -> String {
    let token = format!("ev_{}", Uuid::new_v4().simple());
    store.email_verify_tokens.insert(token.clone(), user_id);
    token
}

async fn resolve_session_user_id(
    state: &ChainOffState,
    token: &str,
) -> Result<Uuid, (StatusCode, Json<serde_json::Value>)> {
    if let Some(ref pool) = state.db_pool {
        match crate::db::get_user_id_by_token(pool, token).await {
            Ok(Some(uid)) => Ok(uid),
            Ok(None) => Err((
                StatusCode::UNAUTHORIZED,
                Json(crate::api_json::err_key_detail(
                    "login_required",
                    "session not found or expired",
                )),
            )),
            Err(_) => Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("db_error")),
            )),
        }
    } else {
        let store = state.store.read().await;
        store.sessions.get(token).copied().ok_or((
            StatusCode::UNAUTHORIZED,
            Json(crate::api_json::err_key_detail(
                "login_required",
                "session not found or expired",
            )),
        ))
    }
}

pub async fn auth_login(
    state: ChainOffState,
    Json(body): Json<AuthLoginBody>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let email = body.email.trim();
    let password = body.password.trim();
    let mut store = state.store.write().await;
    let user = store
        .users
        .values()
        .find(|u| u.email.eq_ignore_ascii_case(email))
        .cloned();
    let user = match user {
        Some(u) => u,
        None => {
            eprintln!(
                "[login] 401 user not found for email (trimmed): {:?}, store has {} users",
                email,
                store.users.len()
            );
            return Err((
                StatusCode::UNAUTHORIZED,
                Json(crate::api_json::err_key("invalid_credentials")),
            ));
        }
    };
    let valid = match user.password_hash.as_deref() {
        Some(h) if h.starts_with("hash:") => h == format!("hash:{}", password),
        Some(h) => bcrypt::verify(password, h).unwrap_or(false),
        None => false,
    };
    if !valid {
        eprintln!("[login] 401 password mismatch for email: {:?}", email);
        return Err((
            StatusCode::UNAUTHORIZED,
            Json(crate::api_json::err_key("invalid_credentials")),
        ));
    }
    let role = user.role.clone();
    let uid = user.id;
    let token = if state.db_pool.is_some() {
        format!("tts_{}", Uuid::new_v4())
    } else {
        format!("bearer_{}", uid)
    };
    store.sessions.insert(token.clone(), uid);
    let token_login = token.clone();
    drop(store);

    if let Some(ref pool) = state.db_pool {
        if strict_auth_db_write_enabled() {
            if let Err(e) = crate::db::insert_session(pool, &token_login, uid).await {
                eprintln!(
                    "[audit] strict auth_login: insert_session failed user_id={} error={}",
                    uid, e
                );
                let mut store = state.store.write().await;
                store.sessions.remove(&token_login);
                return Err((
                    StatusCode::SERVICE_UNAVAILABLE,
                    Json(json!({
                        "error": "auth_db_persist_failed",
                        "message": "auth_db_persist_failed",
                        "rule": "TRAVELTRUST_STRICT_AUTH_DB_WRITE=1; login session not persisted, removed from memory",
                    })),
                ));
            }
        } else if let Err(e) = crate::db::insert_session(pool, &token_login, uid).await {
            eprintln!(
                "[audit] db insert_session on login failed user_id={} error={}",
                uid, e
            );
        }
    }

    Ok(Json(json!({
        "status": "ok",
        "user_id": uid.to_string(),
        "token": token_login,
        "role": role
    })))
}

/// 开发/测试用：当 SEED_TEST_ACCOUNTS=1 且 store 中尚无测试账号时，注入游客与向导。
/// **① 仅开发**：`POST /auth/seed-test-accounts` body **`promote_admin_email`** → **admin**（内存 + PG 同步）。
pub async fn seed_promote_user_to_admin_if_enabled(
    state: &ChainOffState,
    email: &str,
) -> Result<(), &'static str> {
    if std::env::var("SEED_TEST_ACCOUNTS").as_deref() != Ok("1") {
        return Err("seed_test_accounts_disabled");
    }
    let email_norm = email.trim().to_ascii_lowercase();
    if email_norm.is_empty() || !is_valid_email_format(&email_norm) {
        return Err("invalid_email");
    }
    let uid = {
        let store = state.store.read().await;
        store
            .users
            .values()
            .find(|u| u.email.trim().eq_ignore_ascii_case(&email_norm))
            .map(|u| u.id)
    };
    let Some(uid) = uid else {
        return Err("user_not_found");
    };
    if let Some(ref pool) = state.db_pool {
        let r = sqlx::query(
            r#"UPDATE users SET role = 'admin', updated_at = now() WHERE id = $1 AND role NOT IN ('admin', 'super_admin')"#,
        )
        .bind(uid)
        .execute(pool)
        .await
        .map_err(|_| "db_failed")?;
        if r.rows_affected() == 0 {
            let role: Option<String> = sqlx::query_scalar(
                r#"SELECT role::text FROM users WHERE id = $1"#,
            )
            .bind(uid)
            .fetch_optional(pool)
            .await
            .map_err(|_| "db_failed")?;
            if !matches!(role.as_deref(), Some("admin") | Some("super_admin")) {
                return Err("user_not_found");
            }
        }
    }
    let mut store = state.store.write().await;
    if let Some(u) = store.users.get_mut(&uid) {
        if let Some(ref pool) = state.db_pool {
            if let Ok(Some(role)) = sqlx::query_scalar::<_, String>(
                r#"SELECT role::text FROM users WHERE id = $1"#,
            )
            .bind(uid)
            .fetch_optional(pool)
            .await
            {
                if role == "admin" || role == "super_admin" {
                    u.role = role;
                }
            }
        } else if u.role != "super_admin" {
            u.role = "admin".to_string();
        }
        u.updated_at = Utc::now();
    }
    Ok(())
}

pub async fn seed_test_accounts_if_empty(state: &ChainOffState) {
    const SEED_PASSWORD: &str = "Test123!";
    const TOURIST_EMAIL: &str = "tourist@test.com";
    const GUIDE_EMAIL: &str = "guide@test.com";

    let mut store = state.store.write().await;
    let has_tourist = store.users.values().any(|u| u.email == TOURIST_EMAIL);
    let has_guide = store.users.values().any(|u| u.email == GUIDE_EMAIL);
    if has_tourist && has_guide {
        drop(store);
        seed_me_settings_security_notification_fixture(state).await;
        return;
    }
    let password_hash = match bcrypt::hash(SEED_PASSWORD, bcrypt::DEFAULT_COST) {
        Ok(h) => h,
        Err(_) => return,
    };
    let now = Utc::now();
    let mut created = Vec::with_capacity(2);
    let strict_seed = strict_seed_db_write_enabled();

    if !has_tourist {
        let tourist_id = Uuid::new_v4();
        let tourist_user = UserRow {
            id: tourist_id,
            email: TOURIST_EMAIL.to_string(),
            password_hash: Some(password_hash.clone()),
            role: "tourist".to_string(),
            kyc_status: "none".to_string(),
            nickname: Some("测试游客".to_string()),
            avatar_url: None,
            default_wallet_address: None,
            created_at: now,
            updated_at: now,
        };
        if let Some(ref pool) = state.db_pool {
            if strict_seed {
                if let Err(e) = crate::db::insert_user(
                    pool,
                    tourist_user.id,
                    &tourist_user.email,
                    tourist_user.password_hash.as_deref(),
                    &tourist_user.role,
                    &tourist_user.kyc_status,
                    tourist_user.nickname.as_deref(),
                    tourist_user.avatar_url.as_deref(),
                    tourist_user.default_wallet_address.as_deref(),
                    tourist_user.created_at,
                    tourist_user.updated_at,
                )
                .await
                {
                    eprintln!(
                        "[audit] strict seed: tourist insert_user failed — skipped memory: {}",
                        e
                    );
                } else {
                    store.users.insert(tourist_id, tourist_user);
                    created.push("tourist");
                }
            } else {
                store.users.insert(tourist_id, tourist_user.clone());
                if let Err(e) = crate::db::insert_user(
                    pool,
                    tourist_user.id,
                    &tourist_user.email,
                    tourist_user.password_hash.as_deref(),
                    &tourist_user.role,
                    &tourist_user.kyc_status,
                    tourist_user.nickname.as_deref(),
                    tourist_user.avatar_url.as_deref(),
                    tourist_user.default_wallet_address.as_deref(),
                    tourist_user.created_at,
                    tourist_user.updated_at,
                )
                .await
                {
                    eprintln!("[audit] seed: tourist insert_user failed: {}", e);
                }
                created.push("tourist");
            }
        } else {
            store.users.insert(tourist_id, tourist_user);
            created.push("tourist");
        }
    }
    if !has_guide {
        let guide_id = Uuid::new_v4();
        let guide_user = UserRow {
            id: guide_id,
            email: GUIDE_EMAIL.to_string(),
            password_hash: Some(password_hash.clone()),
            role: "guide".to_string(),
            kyc_status: "none".to_string(),
            nickname: Some("测试向导".to_string()),
            avatar_url: None,
            default_wallet_address: None,
            created_at: now,
            updated_at: now,
        };
        let guide_row_id = Uuid::new_v4();
        let guide_row = GuideRow {
            id: guide_row_id,
            user_id: guide_id,
            city: "杭州".to_string(),
            country_code: "CN".to_string(),
            languages: vec!["zh".to_string(), "en".to_string()],
            service_types: vec!["walking".to_string(), "culture".to_string()],
            bio: Some("测试向导账号，用于联调".to_string()),
            wallet_address: None,
            real_name: None,
            passport_number_hash: None,
            id_photo_url: None,
            language_cert_url: None,
            guide_license_url: None,
            stake_amount: "0".to_string(),
            hourly_rate: None,
            avatar_url: None,
            status: "active".to_string(),
            rejection_codes: vec![],
            rejection_message: None,
            data_origin: "test".into(),
            created_at: now,
            updated_at: now,
        };
        if let Some(ref pool) = state.db_pool {
            if strict_seed {
                if let Err(e) = crate::db::insert_user(
                    pool,
                    guide_user.id,
                    &guide_user.email,
                    guide_user.password_hash.as_deref(),
                    &guide_user.role,
                    &guide_user.kyc_status,
                    guide_user.nickname.as_deref(),
                    guide_user.avatar_url.as_deref(),
                    guide_user.default_wallet_address.as_deref(),
                    guide_user.created_at,
                    guide_user.updated_at,
                )
                .await
                {
                    eprintln!(
                        "[audit] strict seed: guide insert_user failed — skipped memory: {}",
                        e
                    );
                } else if let Err(e) = crate::db::insert_guide_with_data_origin(
                    pool,
                    guide_row.id,
                    guide_row.user_id,
                    &guide_row.city,
                    &guide_row.country_code,
                    &guide_row.languages,
                    &guide_row.service_types,
                    guide_row.bio.as_deref(),
                    guide_row.wallet_address.as_deref(),
                    guide_row.real_name.as_deref(),
                    guide_row.passport_number_hash.as_deref(),
                    guide_row.id_photo_url.as_deref(),
                    guide_row.language_cert_url.as_deref(),
                    guide_row.guide_license_url.as_deref(),
                    &guide_row.stake_amount,
                    guide_row.hourly_rate.as_deref(),
                    guide_row.avatar_url.as_deref(),
                    &guide_row.status,
                    guide_row.created_at,
                    guide_row.updated_at,
                    &guide_row.data_origin,
                )
                .await
                {
                    eprintln!(
                        "[audit] strict seed: guide insert_guide failed user_id={} — skipped memory (DB may have user row without guide; reset dev DB if needed): {}",
                        guide_id, e
                    );
                } else {
                    store.users.insert(guide_id, guide_user);
                    store.guides.insert(guide_row_id, guide_row);
                    store.guides_by_user.insert(guide_id, guide_row_id);
                    created.push("guide");
                }
            } else {
                store.users.insert(guide_id, guide_user.clone());
                store.guides.insert(guide_row_id, guide_row.clone());
                store.guides_by_user.insert(guide_id, guide_row_id);
                if let Err(e) = crate::db::insert_user(
                    pool,
                    guide_user.id,
                    &guide_user.email,
                    guide_user.password_hash.as_deref(),
                    &guide_user.role,
                    &guide_user.kyc_status,
                    guide_user.nickname.as_deref(),
                    guide_user.avatar_url.as_deref(),
                    guide_user.default_wallet_address.as_deref(),
                    guide_user.created_at,
                    guide_user.updated_at,
                )
                .await
                {
                    eprintln!("[audit] seed: guide insert_user failed: {}", e);
                }
                if let Err(e) = crate::db::insert_guide_with_data_origin(
                    pool,
                    guide_row.id,
                    guide_row.user_id,
                    &guide_row.city,
                    &guide_row.country_code,
                    &guide_row.languages,
                    &guide_row.service_types,
                    guide_row.bio.as_deref(),
                    guide_row.wallet_address.as_deref(),
                    guide_row.real_name.as_deref(),
                    guide_row.passport_number_hash.as_deref(),
                    guide_row.id_photo_url.as_deref(),
                    guide_row.language_cert_url.as_deref(),
                    guide_row.guide_license_url.as_deref(),
                    &guide_row.stake_amount,
                    guide_row.hourly_rate.as_deref(),
                    guide_row.avatar_url.as_deref(),
                    &guide_row.status,
                    guide_row.created_at,
                    guide_row.updated_at,
                    &guide_row.data_origin,
                )
                .await
                {
                    eprintln!("[audit] seed: guide insert_guide failed: {}", e);
                }
                created.push("guide");
            }
        } else {
            store.users.insert(guide_id, guide_user);
            store.guides.insert(guide_row_id, guide_row);
            store.guides_by_user.insert(guide_id, guide_row_id);
            created.push("guide");
        }
    }
    if !created.is_empty() {
        println!(
            "seed: test accounts created — tourist {} / guide {} (password: {})",
            TOURIST_EMAIL, GUIDE_EMAIL, SEED_PASSWORD
        );
    }
    drop(store);
    seed_me_settings_security_notification_fixture(state).await;
}

/// ① E2E：`GET /me/security-notifications` 至少 2 条（pending + sent · 幂等）
pub async fn seed_me_settings_security_notification_fixture(state: &ChainOffState) {
    const TOURIST_EMAIL: &str = "tourist@test.com";
    let Some(ref pool) = state.db_pool else {
        return;
    };
    let uid = {
        let store = state.store.read().await;
        store
            .users
            .values()
            .find(|u| u.email == TOURIST_EMAIL)
            .map(|u| u.id)
    };
    let Some(uid) = uid else {
        return;
    };

    let now = Utc::now();
    {
        let mut store = state.store.write().await;
        if !store.user_email_verified_at.contains_key(&uid) {
            store.user_email_verified_at.insert(uid, now);
        }
    }
    if let Err(e) = sqlx::query(
        r#"UPDATE users SET email_verified_at = $1, updated_at = now() WHERE id = $2 AND email_verified_at IS NULL"#,
    )
    .bind(now)
    .bind(uid)
    .execute(pool)
    .await
    {
        eprintln!("[seed] me_settings tourist email_verified_at err={e}");
    }

    async fn ensure(
        pool: &sqlx::postgres::PgPool,
        uid: uuid::Uuid,
        event_type: &str,
        template_key: &str,
        delivery_status: &str,
    ) {
        if let Ok(rows) = crate::db::list_user_security_notifications(
            pool,
            uid,
            None,
            Some(event_type),
            20,
        )
        .await
        {
            if rows.iter().any(|r| r.template_key == template_key) {
                return;
            }
        }
        let payload = serde_json::json!({
            "source": "seed_test_accounts",
            "phase": "local-1",
            "template_key": template_key,
        });
        if let Err(e) = crate::db::insert_user_security_notification_with_status(
            pool,
            uid,
            event_type,
            template_key,
            &payload,
            delivery_status,
        )
        .await
        {
            eprintln!(
                "[seed] me_settings security notification {template_key} err={e}"
            );
        }
    }

    ensure(
        pool,
        uid,
        "login_alert",
        "me_settings_e2e_fixture",
        "pending",
    )
    .await;
    ensure(
        pool,
        uid,
        "password_changed",
        "me_settings_e2e_sent",
        "sent",
    )
    .await;
}

fn bearer_token_from_headers(headers: &HeaderMap) -> Option<String> {
    let auth = headers
        .get(axum::http::header::AUTHORIZATION)?
        .to_str()
        .ok()?;
    let s = auth.trim();
    if s.len() < 8 || !s[..7].eq_ignore_ascii_case("bearer ") {
        return None;
    }
    let token = s[7..].trim();
    if token.is_empty() {
        return None;
    }
    Some(token.to_string())
}

/// POST `/auth/logout`：须带 `Authorization: Bearer <session_token>`；删除内存与（若已接库）`sessions` 表中的会话。
pub async fn auth_logout(
    state: ChainOffState,
    headers: HeaderMap,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let Some(token) = bearer_token_from_headers(&headers) else {
        return Err((
            StatusCode::UNAUTHORIZED,
            Json(crate::api_json::err_key_detail(
                "session_token_required",
                "Authorization: Bearer <token> required",
            )),
        ));
    };

    {
        let mut store = state.store.write().await;
        store.sessions.remove(&token);
    }

    if let Some(ref pool) = state.db_pool {
        match crate::db::delete_session(pool, &token).await {
            Ok(_) => {}
            Err(e) => {
                eprintln!("[audit] delete_session on logout failed token_len={} error={}", token.len(), e);
                if super::strict_auth_db_write_enabled() {
                    return Err((
                        StatusCode::SERVICE_UNAVAILABLE,
                        Json(json!({
                            "error": "auth_db_logout_failed",
                            "message": "auth_db_logout_failed",
                            "rule": "TRAVELTRUST_STRICT_AUTH_DB_WRITE=1; session delete failed",
                        })),
                    ));
                }
            }
        }
    }

    Ok(Json(json!({"status": "ok", "message": "logged_out"})))
}

/// 50-B2：刷新 token 真实实现。校验 session（DB 或 store），返回同一 token 与 user_id/role（续期有效）。
pub async fn auth_refresh(
    state: ChainOffState,
    token: Option<String>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let token = match token.filter(|t| !t.is_empty()) {
        Some(t) => t,
        None => {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key_detail(
                    "refresh_token_required",
                    "Provide refresh_token in body or Authorization: Bearer <token>",
                )),
            ));
        }
    };
    let user_id = if let Some(ref pool) = state.db_pool {
        match crate::db::get_user_id_by_token(pool, &token).await {
            Ok(Some(uid)) => uid,
            Ok(None) => {
                return Err((
                    StatusCode::UNAUTHORIZED,
                    Json(crate::api_json::err_key_detail(
                        "invalid_token",
                        "session not found or expired",
                    )),
                ));
            }
            Err(_) => {
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key("db_error")),
                ));
            }
        }
    } else {
        let store = state.store.read().await;
        match store.sessions.get(&token) {
            Some(&uid) => uid,
            None => {
                return Err((
                    StatusCode::UNAUTHORIZED,
                    Json(crate::api_json::err_key_detail(
                        "invalid_token",
                        "session not found or expired",
                    )),
                ));
            }
        }
    };
    let store = state.store.read().await;
    let role = store
        .users
        .get(&user_id)
        .map(|u| u.role.as_str())
        .unwrap_or("tourist");
    Ok(Json(json!({
        "status": "ok",
        "user_id": user_id.to_string(),
        "token": token,
        "role": role
    })))
}

pub async fn auth_refresh_stub(
    _state: ChainOffState,
    Json(_body): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    Ok(Json(json!({"status": "ok", "message": "chain_off_stub"})))
}

/// ① chain_off：`POST /auth/verify-email` 消费 `email_verify_tokens` 并写入 `email_verified_at`。
pub async fn auth_verify_email_stub(
    state: ChainOffState,
    Json(body): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let token = body
        .get("token")
        .or_else(|| body.get("code"))
        .and_then(|v| v.as_str())
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(String::from);
    let token = match token {
        Some(t) => t,
        None => {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_verify_token")),
            ));
        }
    };
    let mut store = state.store.write().await;
    let user_id = match store.email_verify_tokens.remove(&token) {
        Some(uid) => uid,
        None => {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_verify_token")),
            ));
        }
    };
    let now = Utc::now();
    {
        let user = store.users.get_mut(&user_id).ok_or((
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("user_not_found")),
        ))?;
        user.updated_at = now;
    }
    store.user_email_verified_at.insert(user_id, now);
    if let Some(ref pool) = state.db_pool {
        let _ = sqlx::query(
            r#"UPDATE users SET email_verified_at = $1, updated_at = now() WHERE id = $2 AND email_verified_at IS NULL"#,
        )
        .bind(now)
        .bind(user_id)
        .execute(pool)
        .await;
        crate::db::observe_email_verified(pool, user_id).await;
    }
    Ok(Json(json!({
        "status": "ok",
        "message": "email_verified"
    })))
}

/// ① chain_off：已登录用户重发验证令牌（无 PG 邮件时响应含 `email_verification_dev_token` 供本地粘贴）。
pub async fn auth_resend_verification_email(
    state: ChainOffState,
    headers: HeaderMap,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let token = bearer_token_from_headers(&headers).ok_or((
        StatusCode::UNAUTHORIZED,
        Json(crate::api_json::err_key("login_required")),
    ))?;
    let user_id = resolve_session_user_id(&state, &token).await?;
    let mut store = state.store.write().await;
    if store.users.get(&user_id).is_none() {
        return Err((
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("user_not_found")),
        ));
    }
    if store.user_email_verified_at.contains_key(&user_id) {
        return Ok(Json(json!({
            "status": "ok",
            "message": "email_already_verified"
        })));
    }
    let dev_token = issue_chain_off_email_verify_token(&mut store, user_id);
    let mut out = json!({
        "status": "ok",
        "message": "verification_sent"
    });
    if state.db_pool.is_none() {
        if let Some(obj) = out.as_object_mut() {
            obj.insert(
                "email_verification_dev_token".to_string(),
                json!(dev_token),
            );
        }
    }
    Ok(Json(out))
}

/// 50-B2 占位：forgot-password 真实实现待产品排期邮件/令牌后替换。落点 04 §3.1/3.2。
pub async fn auth_forgot_password_stub(
    _state: ChainOffState,
    Json(_body): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    Ok(Json(json!({
        "status": "ok",
        "message": "chain_off_stub",
        "note": "50-B2 占位，待产品排期邮件/令牌后替换，04 §3.1/3.2"
    })))
}

/// 50-B2 占位：reset-password 真实实现待产品排期邮件/令牌后替换。落点 04 §3.1/3.2。
pub async fn auth_reset_password_stub(
    _state: ChainOffState,
    Json(_body): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    Ok(Json(json!({
        "status": "ok",
        "message": "chain_off_stub",
        "note": "50-B2 占位，待产品排期邮件/令牌后替换，04 §3.1/3.2"
    })))
}

/// 50-B2：修改密码真实实现。校验旧密码、更新 store 与 DB。
pub async fn put_me_password(
    state: ChainOffState,
    user_id: Uuid,
    body: PutMePasswordBody,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let old_password = body.old_password.as_deref().unwrap_or("").trim();
    let new_password = body.new_password.as_deref().unwrap_or("").trim();
    if old_password.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key_detail(
                "old_password_required",
                "old_password is required",
            )),
        ));
    }
    if new_password.len() < PASSWORD_MIN_LEN {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key_detail(
                "password_too_short",
                format!(
                    "new_password must be at least {} characters",
                    PASSWORD_MIN_LEN
                ),
            )),
        ));
    }
    if new_password.len() > PASSWORD_MAX_LEN {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key_detail(
                "password_too_long",
                format!(
                    "new_password must be at most {} characters",
                    PASSWORD_MAX_LEN
                ),
            )),
        ));
    }
    let mut store = state.store.write().await;
    let user = match store.users.get_mut(&user_id) {
        Some(u) => u,
        None => {
            return Err((
                StatusCode::NOT_FOUND,
                Json(crate::api_json::err_key("user_not_found")),
            ));
        }
    };
    let valid = match user.password_hash.as_deref() {
        Some(h) if h.starts_with("hash:") => h == format!("hash:{}", old_password),
        Some(h) => bcrypt::verify(old_password, h).unwrap_or(false),
        None => false,
    };
    if !valid {
        return Err((
            StatusCode::UNAUTHORIZED,
            Json(crate::api_json::err_key_detail(
                "invalid_old_password",
                "old_password is incorrect",
            )),
        ));
    }
    let new_hash = match bcrypt::hash(new_password, bcrypt::DEFAULT_COST) {
        Ok(h) => h,
        Err(_) => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("password_hash_failed")),
            ));
        }
    };
    user.password_hash = Some(new_hash.clone());
    user.updated_at = Utc::now();
    if let Some(ref pool) = state.db_pool {
        if let Err(e) = crate::db::update_user_password(pool, user_id, &new_hash).await {
            eprintln!(
                "[audit] put_me_password db update failed user_id={} error={}",
                user_id, e
            );
        }
    }
    Ok(Json(json!({"status": "ok", "message": "password_updated"})))
}

pub async fn put_me_password_stub(
    _state: ChainOffState,
    Json(_body): Json<PutMePasswordBody>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    Ok(Json(json!({"status": "ok", "message": "chain_off_stub"})))
}

/// 从 Authorization: Bearer <token> 或 X-User-Id: <uuid> 解析当前用户（P3 链下测试用）
pub fn extract_user_from_headers(headers: &axum::http::HeaderMap) -> Option<Uuid> {
    if let Some(v) = headers.get("X-User-Id") {
        if let Ok(s) = v.to_str() {
            if let Ok(u) = Uuid::parse_str(s.trim()) {
                return Some(u);
            }
        }
    }
    if let Some(v) = headers.get(axum::http::header::AUTHORIZATION) {
        if let Ok(s) = v.to_str() {
            let s = s.trim();
            if s.to_lowercase().starts_with("bearer ") {
                let token = s[7..].trim();
                if token.starts_with("bearer_") {
                    if let Ok(u) = Uuid::parse_str(&token[7..]) {
                        return Some(u);
                    }
                }
            }
        }
    }
    None
}

#[cfg(test)]
mod registration_role_tests {
    use super::{is_self_serve_registration_role, registration_role_stored};

    #[test]
    fn self_serve_roles_for_register_693() {
        assert!(is_self_serve_registration_role("tourist"));
        assert!(is_self_serve_registration_role("traveler"));
        assert!(is_self_serve_registration_role("provider"));
        assert!(is_self_serve_registration_role("region_steward"));
        assert!(!is_self_serve_registration_role("guide"));
        assert!(!is_self_serve_registration_role("admin"));
        assert!(!is_self_serve_registration_role("super_admin"));
        assert!(!is_self_serve_registration_role("arbitrator"));
    }

    #[test]
    fn registration_role_stored_pd003_traveler_side_only() {
        assert_eq!(registration_role_stored("traveler"), "traveler");
        assert_eq!(registration_role_stored("tourist"), "tourist");
        assert_eq!(registration_role_stored("provider"), "traveler");
        assert_eq!(registration_role_stored("region_steward"), "traveler");
    }
}

#[cfg(test)]
mod register_verification_code_tests {
    use super::{
        generate_register_verification_code, is_valid_register_verification_code_format,
        verify_register_verification_code,
    };
    use chrono::{Duration, Utc};
    use std::collections::HashMap;

    #[test]
    fn generated_code_is_six_digits() {
        let code = generate_register_verification_code();
        assert!(is_valid_register_verification_code_format(&code));
    }

    #[test]
    fn verify_consumes_valid_code() {
        let mut store = super::super::ChainOffStore {
            register_verification_codes: HashMap::from([(
                "user@example.com".to_string(),
                super::super::RegisterVerificationCodeEntry {
                    code: "123456".to_string(),
                    expires_at: Utc::now() + Duration::minutes(10),
                    sent_at: Utc::now(),
                },
            )]),
            ..Default::default()
        };
        std::env::set_var("TRAVELTRUST_AUTH_REGISTER_REQUIRE_CODE", "1");
        let ok = verify_register_verification_code(
            &mut store,
            "user@example.com",
            &Some("123456".to_string()),
        );
        std::env::remove_var("TRAVELTRUST_AUTH_REGISTER_REQUIRE_CODE");
        assert!(ok.is_ok());
        assert!(!store.register_verification_codes.contains_key("user@example.com"));
    }
}
