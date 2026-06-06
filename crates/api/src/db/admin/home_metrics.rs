//! Admin 工作台首页 metrics（用户注册趋势 · 控制台活动 · 角色分布）。

use chrono::{DateTime, Datelike, NaiveDate, Utc};
use serde_json::{json, Value};
use sqlx::postgres::PgPool;

#[derive(Debug, Clone)]
pub struct AdminHomeMetricsSnapshot {
    pub source: &'static str,
    pub users_total: i64,
    pub users_by_role: Value,
    pub console_roles_by_name: Option<Value>,
    pub trend_days: Vec<String>,
    pub user_signups: Vec<i64>,
    pub admin_activity: Vec<i64>,
    pub admin_activity_available: bool,
}

pub fn utc_day_key(dt: DateTime<Utc>) -> NaiveDate {
    dt.date_naive()
}

pub fn last_n_utc_day_labels(now: DateTime<Utc>, n: i64) -> Vec<String> {
    let today = now.date_naive();
    (0..n)
        .map(|i| {
            let d = today - chrono::Duration::days(n - 1 - i);
            format!("{:04}-{:02}-{:02}", d.year(), d.month(), d.day())
        })
        .collect()
}

pub fn bucket_counts(day_labels: &[String], rows: &[(NaiveDate, i64)]) -> Vec<i64> {
    day_labels
        .iter()
        .map(|label| {
            let Ok(parsed) = NaiveDate::parse_from_str(label, "%Y-%m-%d") else {
                return 0;
            };
            rows.iter()
                .find(|(d, _)| *d == parsed)
                .map(|(_, c)| *c)
                .unwrap_or(0)
        })
        .collect()
}

pub async fn fetch_admin_home_metrics_from_pg(pool: &PgPool) -> Result<AdminHomeMetricsSnapshot, sqlx::Error> {
    let now = Utc::now();
    let day_labels = last_n_utc_day_labels(now, 7);
    let since = now - chrono::Duration::days(7);

    let users_total: i64 = sqlx::query_scalar("SELECT COUNT(*)::bigint FROM users")
        .fetch_one(pool)
        .await?;

    let role_rows: Vec<(String, i64)> = sqlx::query_as(
        "SELECT role, COUNT(*)::bigint AS c FROM users GROUP BY role ORDER BY c DESC, role ASC",
    )
    .fetch_all(pool)
    .await?;

    let mut by_role = serde_json::Map::new();
    for (role, count) in role_rows {
        by_role.insert(role, json!(count));
    }

    let signup_rows: Vec<(NaiveDate, i64)> = sqlx::query_as(
        "SELECT (created_at AT TIME ZONE 'UTC')::date AS d, COUNT(*)::bigint
         FROM users
         WHERE created_at >= $1
         GROUP BY d
         ORDER BY d ASC",
    )
    .bind(since)
    .fetch_all(pool)
    .await?;

    let admin_activity_rows: Vec<(NaiveDate, i64)> = sqlx::query_as(
        "SELECT (created_at AT TIME ZONE 'UTC')::date AS d, COUNT(*)::bigint
         FROM admin_audit_logs
         WHERE created_at >= $1
         GROUP BY d
         ORDER BY d ASC",
    )
    .bind(since)
    .fetch_all(pool)
    .await
    .unwrap_or_default();

    let console_roles_by_name = match sqlx::query_as::<_, (String, i64)>(
        "SELECT console_role, COUNT(*)::bigint FROM admin_console_roles GROUP BY console_role ORDER BY console_role ASC",
    )
    .fetch_all(pool)
    .await
    {
        Ok(rows) if !rows.is_empty() => {
            let mut m = serde_json::Map::new();
            for (role, count) in rows {
                m.insert(role, json!(count));
            }
            Some(Value::Object(m))
        }
        _ => None,
    };

    Ok(AdminHomeMetricsSnapshot {
        source: "postgres",
        users_total,
        users_by_role: Value::Object(by_role),
        console_roles_by_name,
        user_signups: bucket_counts(&day_labels, &signup_rows),
        admin_activity: bucket_counts(&day_labels, &admin_activity_rows),
        admin_activity_available: true,
        trend_days: day_labels,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn bucket_counts_aligns_to_day_labels() {
        let labels = vec!["2026-06-01".to_string(), "2026-06-02".to_string()];
        let rows = vec![(NaiveDate::from_ymd_opt(2026, 6, 1).unwrap(), 3)];
        assert_eq!(bucket_counts(&labels, &rows), vec![3, 0]);
    }
}
