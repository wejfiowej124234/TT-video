//! G-S2 · Growth Observer（102 §5.4 · 事件驱动积分 · 不改状态机）

use sqlx::PgPool;
use uuid::Uuid;

use super::growth_ledger::{
    award_growth_points, count_completed_escrow_orders_for_tourist, count_completed_orders_for_tourist,
    count_user_posts, referred_by_user_id, AwardOutcomeKind,
};

/// 102 §5.2 默认基础分（G-S2 无 Early Bird 倍率 · multiplier=1.0）
const DEFAULT_RULES: &[(&str, i64)] = &[
    ("email_verified", 100),
    ("kyc_verified", 200),
    ("did_wallet_verified", 50),
    ("first_post", 50),
    ("first_order_completed", 300),
    ("first_escrow_completed", 500),
    ("referral_email_verified", 50),
    ("referral_kyc_verified", 100),
    ("referral_first_order_completed", 200),
    ("referral_first_escrow_completed", 200),
];

pub fn observer_enabled() -> bool {
    match std::env::var("TRAVELTRUST_GROWTH_OBSERVER")
        .ok()
        .as_deref()
        .map(str::trim)
    {
        Some("0") | Some("false") | Some("off") => false,
        _ => true,
    }
}

pub fn is_source_enabled(source: &str) -> bool {
    if !observer_enabled() {
        return false;
    }
    if is_source_disabled_by_env(source) {
        return false;
    }
    points_for_source(source).is_some()
}

fn is_source_disabled_by_env(source: &str) -> bool {
    let Ok(raw) = std::env::var("TRAVELTRUST_GROWTH_OBSERVER_DISABLE") else {
        return false;
    };
    raw.split(',')
        .map(str::trim)
        .any(|s| !s.is_empty() && s.eq_ignore_ascii_case(source))
}

/// 可配置覆盖：`TRAVELTRUST_GROWTH_POINTS_<SOURCE>`，如 `TRAVELTRUST_GROWTH_POINTS_EMAIL_VERIFIED=100`
pub fn points_for_source(source: &str) -> Option<i64> {
    let env_key = format!(
        "TRAVELTRUST_GROWTH_POINTS_{}",
        source.to_ascii_uppercase().replace('-', "_")
    );
    if let Ok(raw) = std::env::var(&env_key) {
        if let Ok(n) = raw.trim().parse::<i64>() {
            return if n > 0 { Some(n) } else { None };
        }
    }
    DEFAULT_RULES
        .iter()
        .find(|(s, _)| *s == source)
        .map(|(_, p)| *p)
}

async fn award_if_enabled(
    pool: &PgPool,
    user_id: Uuid,
    source: &str,
    idempotency_key: &str,
    related_user_id: Option<Uuid>,
    related_entity_type: Option<&str>,
    related_entity_id: Option<Uuid>,
) {
    if !is_source_enabled(source) {
        return;
    }
    let Some(base) = points_for_source(source) else {
        return;
    };
    match award_growth_points(
        pool,
        user_id,
        source,
        base,
        idempotency_key,
        related_user_id,
        related_entity_type,
        related_entity_id,
    )
    .await
    {
        Ok(out) if out.kind == AwardOutcomeKind::Awarded => {
            eprintln!(
                "[growth_observer] awarded user_id={user_id} source={source} points={} key={idempotency_key}",
                out.points
            );
        }
        Ok(_) => {}
        Err(e) => {
            eprintln!(
                "[growth_observer] award failed user_id={user_id} source={source} error={e}"
            );
        }
    }
}

async fn award_referrer_for_referred(
    pool: &PgPool,
    referred_user_id: Uuid,
    referral_source: &str,
    idempotency_suffix: &str,
    related_entity_type: Option<&str>,
    related_entity_id: Option<Uuid>,
) {
    let Ok(Some(referrer_id)) = referred_by_user_id(pool, referred_user_id).await else {
        return;
    };
    if referrer_id == referred_user_id {
        return;
    }
    let key = format!("{referral_source}:{idempotency_suffix}:referrer:{referrer_id}");
    award_if_enabled(
        pool,
        referrer_id,
        referral_source,
        &key,
        Some(referred_user_id),
        related_entity_type,
        related_entity_id,
    )
    .await;
}

pub async fn observe_email_verified(pool: &PgPool, user_id: Uuid) {
    let key = format!("email_verified:{user_id}");
    award_if_enabled(pool, user_id, "email_verified", &key, None, None, None).await;
    award_referrer_for_referred(
        pool,
        user_id,
        "referral_email_verified",
        &format!("referred:{user_id}"),
        None,
        None,
    )
    .await;
}

pub async fn observe_kyc_verified(pool: &PgPool, user_id: Uuid) {
    let key = format!("kyc_verified:{user_id}");
    award_if_enabled(pool, user_id, "kyc_verified", &key, None, None, None).await;
    award_referrer_for_referred(
        pool,
        user_id,
        "referral_kyc_verified",
        &format!("referred:{user_id}"),
        None,
        None,
    )
    .await;
}

pub async fn observe_did_wallet_verified(pool: &PgPool, user_id: Uuid) {
    let key = format!("did_wallet_verified:{user_id}");
    award_if_enabled(pool, user_id, "did_wallet_verified", &key, None, None, None).await;
}

pub async fn observe_first_post(pool: &PgPool, user_id: Uuid, post_id: Uuid) {
    let Ok(count) = count_user_posts(pool, user_id).await else {
        return;
    };
    if count != 1 {
        return;
    }
    let key = format!("first_post:{user_id}:{post_id}");
    award_if_enabled(
        pool,
        user_id,
        "first_post",
        &key,
        None,
        Some("community_post"),
        Some(post_id),
    )
    .await;
}

pub async fn observe_order_completed(
    pool: &PgPool,
    tourist_id: Uuid,
    order_id: Uuid,
    had_escrow: bool,
) {
    let Ok(completed_count) = count_completed_orders_for_tourist(pool, tourist_id).await else {
        return;
    };
    if completed_count == 1 {
        let key = format!("first_order_completed:{tourist_id}:{order_id}");
        award_if_enabled(
            pool,
            tourist_id,
            "first_order_completed",
            &key,
            None,
            Some("order"),
            Some(order_id),
        )
        .await;
        award_referrer_for_referred(
            pool,
            tourist_id,
            "referral_first_order_completed",
            &format!("referred:{tourist_id}:order:{order_id}"),
            Some("order"),
            Some(order_id),
        )
        .await;
    }

    if !had_escrow {
        return;
    }
    let Ok(escrow_count) = count_completed_escrow_orders_for_tourist(pool, tourist_id).await else {
        return;
    };
    if escrow_count == 1 {
        let key = format!("first_escrow_completed:{tourist_id}:{order_id}");
        award_if_enabled(
            pool,
            tourist_id,
            "first_escrow_completed",
            &key,
            None,
            Some("order"),
            Some(order_id),
        )
        .await;
        award_referrer_for_referred(
            pool,
            tourist_id,
            "referral_first_escrow_completed",
            &format!("referred:{tourist_id}:order:{order_id}"),
            Some("order"),
            Some(order_id),
        )
        .await;
    }
}

/// 内网/测试：按 source 直发（须自带幂等键语义）。
pub async fn observe_custom_event(
    pool: &PgPool,
    user_id: Uuid,
    source: &str,
    idempotency_key: &str,
    related_user_id: Option<Uuid>,
    related_entity_type: Option<&str>,
    related_entity_id: Option<Uuid>,
) {
    award_if_enabled(
        pool,
        user_id,
        source,
        idempotency_key,
        related_user_id,
        related_entity_type,
        related_entity_id,
    )
    .await;
}

pub async fn observe_best_effort(pool: &PgPool, user_id: Uuid, source: &str) {
    match source {
        "email_verified" => observe_email_verified(pool, user_id).await,
        "kyc_verified" => observe_kyc_verified(pool, user_id).await,
        "did_wallet_verified" => observe_did_wallet_verified(pool, user_id).await,
        other => {
            let key = format!("{other}:{user_id}");
            observe_custom_event(pool, user_id, other, &key, None, None, None).await;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_email_verified_points() {
        assert_eq!(points_for_source("email_verified"), Some(100));
    }

    #[test]
    fn disabled_source_via_env() {
        std::env::set_var("TRAVELTRUST_GROWTH_OBSERVER_DISABLE", "first_post,email_verified");
        assert!(!is_source_enabled("email_verified"));
        assert!(!is_source_enabled("first_post"));
        assert!(is_source_enabled("kyc_verified"));
        std::env::remove_var("TRAVELTRUST_GROWTH_OBSERVER_DISABLE");
    }
}
