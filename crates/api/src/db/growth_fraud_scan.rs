//! BE-FRD-01 · Growth fraud-scan engine v1 (Sprint 168-B)

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sqlx::PgPool;
use uuid::Uuid;

use super::growth_fraud_ops::{self, GrowthFraudRuleRow};

const IP_VELOCITY_WINDOW_MINUTES: i64 = 60;
const IP_VELOCITY_MAX_REGISTERS: i64 = 8;
const EMAIL_ALIAS_WINDOW_MINUTES: i64 = 60;
const EMAIL_ALIAS_MAX_ACCOUNTS: i64 = 5;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GrowthFraudRuleFired {
    pub rule_id: String,
    pub signal_type: String,
    pub risk_level: String,
    pub action: String,
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct GrowthFraudScanRunRow {
    pub id: Uuid,
    pub subject_user_id: Uuid,
    pub trigger: String,
    pub idempotency_key: String,
    pub outcome: String,
    pub rules_fired: Value,
    pub context_snapshot: Value,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct GrowthFraudScanResult {
    pub scan_run_id: Uuid,
    pub outcome: String,
    pub rules_fired: Vec<GrowthFraudRuleFired>,
    pub duplicate: bool,
}

#[derive(Debug, Clone, Default)]
pub struct GrowthFraudScanContext {
    pub client_ip: Option<String>,
    pub email: Option<String>,
    pub referral_code: Option<String>,
    pub default_wallet_address: Option<String>,
    pub user_agent: Option<String>,
}

pub fn client_ip_from_headers(headers: &axum::http::HeaderMap) -> Option<String> {
    const MAX: usize = 512;
    let s = headers
        .get("x-forwarded-for")
        .and_then(|v| v.to_str().ok())
        .and_then(|raw| raw.split(',').next().map(str::trim))
        .filter(|x| !x.is_empty())
        .or_else(|| {
            headers
                .get("x-real-ip")
                .and_then(|v| v.to_str().ok())
                .map(str::trim)
        })
        .filter(|x| !x.is_empty())
        .unwrap_or("default");
    Some(s.chars().take(MAX).collect())
}

pub fn growth_fraud_scan_rules_catalog_v1() -> Vec<GrowthFraudRuleRow> {
    let mut rules = growth_fraud_ops::growth_fraud_rules_catalog();
    rules.extend([
        GrowthFraudRuleRow {
            id: "register_email_disposable_domain",
            signal_type: "email_disposable_domain",
            risk_level: "MEDIUM",
            description: "Registration email uses known disposable domain",
            action: "Record signal",
            source: "BE-FRD-01 v1",
        },
        GrowthFraudRuleRow {
            id: "register_email_alias_burst",
            signal_type: "email_alias_pattern",
            risk_level: "MEDIUM",
            description: "Too many accounts sharing email base in 60min",
            action: "Record signal",
            source: "BE-FRD-01 v1",
        },
        GrowthFraudRuleRow {
            id: "register_ip_velocity",
            signal_type: "register_ip_velocity",
            risk_level: "HIGH",
            description: "Too many registrations from same IP in 60min",
            action: "Auto airdrop_ineligible",
            source: "BE-FRD-01 v1",
        },
        GrowthFraudRuleRow {
            id: "register_wallet_collision",
            signal_type: "wallet_address_collision",
            risk_level: "HIGH",
            description: "Wallet address already bound to another user",
            action: "Auto points_frozen",
            source: "BE-FRD-01 v1",
        },
    ]);
    rules
}

pub async fn run_growth_fraud_scan_best_effort(
    pool: &PgPool,
    user_id: Uuid,
    trigger: &str,
    ctx: GrowthFraudScanContext,
) {
    let idem = format!("{trigger}:{user_id}");
    if let Err(e) = run_growth_fraud_scan(pool, user_id, trigger, &idem, ctx).await {
        eprintln!(
            "[audit] growth_fraud_scan best_effort user_id={user_id} trigger={trigger} error={e}"
        );
    }
}

pub async fn run_growth_fraud_scan(
    pool: &PgPool,
    user_id: Uuid,
    trigger: &str,
    idempotency_key: &str,
    ctx: GrowthFraudScanContext,
) -> Result<GrowthFraudScanResult, sqlx::Error> {
    if let Some(existing) = get_scan_run_by_idempotency_key(pool, idempotency_key).await? {
        return Ok(scan_result_from_row(existing, true));
    }

    let mut fired: Vec<GrowthFraudRuleFired> = Vec::new();
    let mut auto_status: Option<&str> = None;

    if let Some(ref email) = ctx.email {
        if is_disposable_email_domain(email) {
            fired.push(rule_fired(
                "register_email_disposable_domain",
                "email_disposable_domain",
                "MEDIUM",
                "record_signal",
            ));
            record_signal(
                pool,
                user_id,
                "email_disposable_domain",
                "MEDIUM",
                json!({ "email": email }),
            )
            .await;
        }
        if email_alias_burst(pool, user_id, email).await? {
            fired.push(rule_fired(
                "register_email_alias_burst",
                "email_alias_pattern",
                "MEDIUM",
                "record_signal",
            ));
            record_signal(
                pool,
                user_id,
                "email_alias_pattern",
                "MEDIUM",
                json!({ "email": email }),
            )
            .await;
        }
    }

    if let Some(ref ip) = ctx.client_ip {
        if register_ip_velocity_exceeded(pool, ip).await? {
            fired.push(rule_fired(
                "register_ip_velocity",
                "register_ip_velocity",
                "HIGH",
                "auto_airdrop_ineligible",
            ));
            record_signal(
                pool,
                user_id,
                "register_ip_velocity",
                "HIGH",
                json!({ "client_ip": ip }),
            )
            .await;
            auto_status = Some("airdrop_ineligible");
        }
    }

    if let Some(ref wallet) = ctx.default_wallet_address {
        if wallet_collision(pool, user_id, wallet).await? {
            fired.push(rule_fired(
                "register_wallet_collision",
                "wallet_address_collision",
                "HIGH",
                "auto_points_frozen",
            ));
            record_signal(
                pool,
                user_id,
                "wallet_address_collision",
                "HIGH",
                json!({ "wallet": wallet }),
            )
            .await;
            auto_status = Some("points_frozen");
        }
    }

    evaluate_referral_rules(pool, user_id, &ctx, &mut fired).await?;

    let outcome = if auto_status.is_some() {
        "auto_action"
    } else if fired.is_empty() {
        "clean"
    } else {
        "signaled"
    };

    if let Some(status) = auto_status {
        growth_fraud_ops::patch_user_growth_fraud_status(pool, user_id, status, false).await?;
    }

    let context_snapshot = json!({
        "client_ip": ctx.client_ip,
        "email": ctx.email,
        "referral_code": ctx.referral_code,
        "default_wallet_address": ctx.default_wallet_address,
        "user_agent": ctx.user_agent,
    });
    let rules_json = serde_json::to_value(&fired).unwrap_or_else(|_| json!([]));
    let row: GrowthFraudScanRunRow = sqlx::query_as(
        r#"
        INSERT INTO growth_fraud_scan_runs
            (subject_user_id, trigger, idempotency_key, outcome, rules_fired, context_snapshot)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, subject_user_id, trigger, idempotency_key, outcome, rules_fired,
                  context_snapshot, created_at
        "#,
    )
    .bind(user_id)
    .bind(trigger)
    .bind(idempotency_key)
    .bind(outcome)
    .bind(rules_json)
    .bind(context_snapshot)
    .fetch_one(pool)
    .await?;

    Ok(scan_result_from_row(row, false))
}

async fn evaluate_referral_rules(
    pool: &PgPool,
    user_id: Uuid,
    ctx: &GrowthFraudScanContext,
    fired: &mut Vec<GrowthFraudRuleFired>,
) -> Result<(), sqlx::Error> {
    if ctx.referral_code.is_some() {
        let hourly: Option<(i64,)> = sqlx::query_as(
            r#"
            SELECT COUNT(*)::bigint
            FROM growth_fraud_signals
            WHERE subject_user_id = (
                SELECT referred_by_user_id FROM users WHERE id = $1
            )
              AND signal_type = 'referral_hourly_rate_limit'
              AND created_at > now() - interval '1 hour'
            "#,
        )
        .bind(user_id)
        .fetch_optional(pool)
        .await?;
        if hourly.is_some_and(|(c,)| c > 0) {
            fired.push(rule_fired(
                "referral_hourly_rate_limit",
                "referral_hourly_rate_limit",
                "HIGH",
                "record_signal",
            ));
        }
    }
    Ok(())
}

fn rule_fired(rule_id: &str, signal_type: &str, risk_level: &str, action: &str) -> GrowthFraudRuleFired {
    GrowthFraudRuleFired {
        rule_id: rule_id.into(),
        signal_type: signal_type.into(),
        risk_level: risk_level.into(),
        action: action.into(),
    }
}

async fn record_signal(
    pool: &PgPool,
    user_id: Uuid,
    signal_type: &str,
    risk_level: &str,
    payload: Value,
) {
    let _ = sqlx::query(
        r#"
        INSERT INTO growth_fraud_signals (subject_user_id, signal_type, risk_level, payload)
        VALUES ($1, $2, $3, $4)
        "#,
    )
    .bind(user_id)
    .bind(signal_type)
    .bind(risk_level)
    .bind(payload)
    .execute(pool)
    .await;
}

fn is_disposable_email_domain(email: &str) -> bool {
    let Some(domain) = email.split('@').nth(1).map(|d| d.trim().to_ascii_lowercase()) else {
        return false;
    };
    matches!(
        domain.as_str(),
        "mailinator.com"
            | "guerrillamail.com"
            | "tempmail.com"
            | "10minutemail.com"
            | "throwaway.email"
            | "yopmail.com"
    )
}

fn email_local_base(email: &str) -> Option<String> {
    let at = email.find('@')?;
    let local = email[..at].trim().to_ascii_lowercase();
    let base = local.split('+').next()?.split('.').next()?.trim();
    if base.is_empty() {
        return None;
    }
    let domain = email[at + 1..].trim().to_ascii_lowercase();
    Some(format!("{base}@{domain}"))
}

async fn email_alias_burst(pool: &PgPool, user_id: Uuid, email: &str) -> Result<bool, sqlx::Error> {
    let Some(base) = email_local_base(email) else {
        return Ok(false);
    };
    let row: (i64,) = sqlx::query_as(
        r#"
        SELECT COUNT(*)::bigint
        FROM users
        WHERE id <> $1
          AND (
            split_part(lower(email), '+', 1) || '@' || split_part(lower(email), '@', 2)
          ) = $2
          AND created_at > now() - ($3::text || ' minutes')::interval
        "#,
    )
    .bind(user_id)
    .bind(base)
    .bind(EMAIL_ALIAS_WINDOW_MINUTES.to_string())
    .fetch_one(pool)
    .await?;
    Ok(row.0 >= EMAIL_ALIAS_MAX_ACCOUNTS)
}

async fn register_ip_velocity_exceeded(pool: &PgPool, client_ip: &str) -> Result<bool, sqlx::Error> {
    let row: (i64,) = sqlx::query_as(
        r#"
        SELECT COUNT(*)::bigint
        FROM growth_fraud_scan_runs
        WHERE trigger = 'register'
          AND context_snapshot ->> 'client_ip' = $1
          AND created_at > now() - ($2::text || ' minutes')::interval
        "#,
    )
    .bind(client_ip)
    .bind(IP_VELOCITY_WINDOW_MINUTES.to_string())
    .fetch_one(pool)
    .await?;
    Ok(row.0 >= IP_VELOCITY_MAX_REGISTERS)
}

async fn wallet_collision(pool: &PgPool, user_id: Uuid, wallet: &str) -> Result<bool, sqlx::Error> {
    let row: (i64,) = sqlx::query_as(
        r#"
        SELECT COUNT(*)::bigint
        FROM users
        WHERE id <> $1
          AND lower(default_wallet_address) = lower($2)
        "#,
    )
    .bind(user_id)
    .bind(wallet.trim())
    .fetch_one(pool)
    .await?;
    Ok(row.0 > 0)
}

pub async fn get_scan_run_by_idempotency_key(
    pool: &PgPool,
    key: &str,
) -> Result<Option<GrowthFraudScanRunRow>, sqlx::Error> {
    sqlx::query_as(
        r#"
        SELECT id, subject_user_id, trigger, idempotency_key, outcome, rules_fired,
               context_snapshot, created_at
        FROM growth_fraud_scan_runs
        WHERE idempotency_key = $1
        "#,
    )
    .bind(key)
    .fetch_optional(pool)
    .await
}

pub async fn list_growth_fraud_scan_runs(
    pool: &PgPool,
    subject_user_id: Option<Uuid>,
    limit: i64,
) -> Result<Vec<GrowthFraudScanRunRow>, sqlx::Error> {
    let limit = limit.clamp(1, 200);
    sqlx::query_as(
        r#"
        SELECT id, subject_user_id, trigger, idempotency_key, outcome, rules_fired,
               context_snapshot, created_at
        FROM growth_fraud_scan_runs
        WHERE ($1::uuid IS NULL OR subject_user_id = $1)
        ORDER BY created_at DESC
        LIMIT $2
        "#,
    )
    .bind(subject_user_id)
    .bind(limit)
    .fetch_all(pool)
    .await
}

fn scan_result_from_row(row: GrowthFraudScanRunRow, duplicate: bool) -> GrowthFraudScanResult {
    let rules_fired: Vec<GrowthFraudRuleFired> =
        serde_json::from_value(row.rules_fired.clone()).unwrap_or_default();
    GrowthFraudScanResult {
        scan_run_id: row.id,
        outcome: row.outcome,
        rules_fired,
        duplicate,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn disposable_domain_detects_mailinator() {
        assert!(is_disposable_email_domain("x@mailinator.com"));
        assert!(!is_disposable_email_domain("x@example.com"));
    }

    #[test]
    fn email_local_base_strips_plus_alias() {
        assert_eq!(
            email_local_base("user+tag@gmail.com"),
            Some("user@gmail.com".into())
        );
    }
}
