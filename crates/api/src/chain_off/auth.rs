//! chain_off 认证：注册/登录/种子账号/占位 stub/鉴权解析（48 §5.2）

use axum::{http::StatusCode, Json};
use chrono::Utc;
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

/// **`users.role`** 存储值（与自服务请求一致；**697**：`traveler` 不再归一为 `tourist`）。
fn registration_role_stored(role_after_trim: &str) -> String {
    role_after_trim.to_string()
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
}

#[derive(Deserialize)]
pub struct PutMePasswordBody {
    pub old_password: Option<String>,
    pub new_password: Option<String>,
}

pub async fn auth_register(
    state: ChainOffState,
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
        }
    }

    Ok(Json(json!({
        "status": "ok",
        "user_id": user.id.to_string(),
        "token": token,
        "role": user.role
    })))
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
pub async fn seed_test_accounts_if_empty(state: &ChainOffState) {
    const SEED_PASSWORD: &str = "Test123!";
    const TOURIST_EMAIL: &str = "tourist@test.com";
    const GUIDE_EMAIL: &str = "guide@test.com";

    let mut store = state.store.write().await;
    let has_tourist = store.users.values().any(|u| u.email == TOURIST_EMAIL);
    let has_guide = store.users.values().any(|u| u.email == GUIDE_EMAIL);
    if has_tourist && has_guide {
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
            status: "active".to_string(),
            rejection_codes: vec![],
            rejection_message: None,
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
                } else if let Err(e) = crate::db::insert_guide(
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
                    &guide_row.status,
                    guide_row.created_at,
                    guide_row.updated_at,
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
                if let Err(e) = crate::db::insert_guide(
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
                    &guide_row.status,
                    guide_row.created_at,
                    guide_row.updated_at,
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
}

pub async fn auth_logout_stub(
    _state: ChainOffState,
    Json(_body): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    Ok(Json(json!({"status": "ok", "message": "chain_off_stub"})))
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

/// 50-B2 占位：verify-email 真实实现待产品排期邮件/令牌后替换。落点 04 §3.1/3.2。
pub async fn auth_verify_email_stub(
    _state: ChainOffState,
    Json(_body): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    Ok(Json(json!({
        "status": "ok",
        "message": "chain_off_stub",
        "note": "50-B2 占位，待产品排期邮件/令牌后替换，04 §3.1/3.2"
    })))
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
    fn registration_role_stored_traveler_passthrough_697() {
        assert_eq!(registration_role_stored("traveler"), "traveler");
        assert_eq!(registration_role_stored("tourist"), "tourist");
        assert_eq!(registration_role_stored("provider"), "provider");
        assert_eq!(registration_role_stored("region_steward"), "region_steward");
    }
}
