//! BE-GCM-01 · Country market launch SSOT (Sprint 168-B)

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sqlx::PgPool;
use uuid::Uuid;

pub const LAUNCH_PHASES: &[&str] = &[
    "intake", "legal", "catalog", "geo", "steward", "publish", "live", "archived",
];

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct CountryMarketLaunchRow {
    pub id: Uuid,
    pub jurisdiction_iso: String,
    pub catalog_country_id: Option<Uuid>,
    pub phase: String,
    pub checklist: Value,
    pub owner_user_id: Option<Uuid>,
    pub launched_at: Option<DateTime<Utc>>,
    pub evidence_ref: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize)]
pub struct CountryMarketGateBlock {
    pub gate: String,
    pub detail: String,
}

pub fn normalize_jurisdiction_iso(raw: &str) -> Option<String> {
    let iso = raw.trim().to_ascii_uppercase();
    if iso.len() == 2 && iso.chars().all(|c| c.is_ascii_alphabetic()) {
        Some(iso)
    } else {
        None
    }
}

pub fn next_launch_phase(current: &str) -> Option<&'static str> {
    match current {
        "intake" => Some("legal"),
        "legal" => Some("catalog"),
        "catalog" => Some("geo"),
        "geo" => Some("steward"),
        "steward" => Some("publish"),
        "publish" => Some("live"),
        _ => None,
    }
}

fn checklist_item_status<'a>(checklist: &'a Value, path: &[&str]) -> Option<&'a str> {
    let mut cur = checklist;
    for key in path {
        cur = cur.get(key)?;
    }
    cur.get("status")?.as_str()
}

pub fn legal_checklist_pass(checklist: &Value) -> bool {
    ["tos_version", "payment_policy_ref", "data_transfer"]
        .iter()
        .all(|k| checklist_item_status(checklist, &["legal", k]) == Some("pass"))
}

pub fn geo_checklist_pass(checklist: &Value) -> bool {
    checklist_item_status(checklist, &["geo", "meta_parity"]) == Some("pass")
}

pub fn steward_checklist_ready(checklist: &Value) -> bool {
    checklist
        .get("steward")
        .and_then(|s| s.get("user_id"))
        .and_then(|v| v.as_str())
        .is_some_and(|s| !s.is_empty())
}

pub fn assert_country_market_gates_for_publish(
    launch: &CountryMarketLaunchRow,
) -> Result<(), Vec<CountryMarketGateBlock>> {
    let mut blocks = Vec::new();
    if !legal_checklist_pass(&launch.checklist) {
        blocks.push(CountryMarketGateBlock {
            gate: "GCM-G1".into(),
            detail: "legal checklist items must all be pass".into(),
        });
    }
    if !geo_checklist_pass(&launch.checklist) {
        blocks.push(CountryMarketGateBlock {
            gate: "GCM-G2".into(),
            detail: "geo.meta_parity must be pass".into(),
        });
    }
    if !steward_checklist_ready(&launch.checklist) {
        blocks.push(CountryMarketGateBlock {
            gate: "GCM-G3".into(),
            detail: "steward.user_id required before publish".into(),
        });
    }
    if !matches!(launch.phase.as_str(), "steward" | "publish" | "live") {
        blocks.push(CountryMarketGateBlock {
            gate: "GCM-G4".into(),
            detail: format!("launch phase must be >= steward (current={})", launch.phase),
        });
    }
    if blocks.is_empty() {
        Ok(())
    } else {
        Err(blocks)
    }
}

pub async fn list_country_market_launches(
    pool: &PgPool,
    phase: Option<&str>,
    limit: i64,
) -> Result<Vec<CountryMarketLaunchRow>, sqlx::Error> {
    let limit = limit.clamp(1, 200);
    sqlx::query_as(
        r#"
        SELECT id, jurisdiction_iso, catalog_country_id, phase, checklist, owner_user_id,
               launched_at, evidence_ref, created_at, updated_at
        FROM country_market_launches
        WHERE ($1::text IS NULL OR phase = $1)
        ORDER BY updated_at DESC
        LIMIT $2
        "#,
    )
    .bind(phase)
    .bind(limit)
    .fetch_all(pool)
    .await
}

pub async fn get_country_market_launch(
    pool: &PgPool,
    id: Uuid,
) -> Result<Option<CountryMarketLaunchRow>, sqlx::Error> {
    sqlx::query_as(
        r#"
        SELECT id, jurisdiction_iso, catalog_country_id, phase, checklist, owner_user_id,
               launched_at, evidence_ref, created_at, updated_at
        FROM country_market_launches
        WHERE id = $1
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

pub async fn get_country_market_launch_by_iso(
    pool: &PgPool,
    iso: &str,
) -> Result<Option<CountryMarketLaunchRow>, sqlx::Error> {
    sqlx::query_as(
        r#"
        SELECT id, jurisdiction_iso, catalog_country_id, phase, checklist, owner_user_id,
               launched_at, evidence_ref, created_at, updated_at
        FROM country_market_launches
        WHERE jurisdiction_iso = $1 AND phase <> 'archived'
        "#,
    )
    .bind(iso)
    .fetch_optional(pool)
    .await
}

pub async fn create_country_market_launch(
    pool: &PgPool,
    jurisdiction_iso: &str,
    catalog_country_id: Option<Uuid>,
    owner_user_id: Option<Uuid>,
) -> Result<CountryMarketLaunchRow, sqlx::Error> {
    sqlx::query_as(
        r#"
        INSERT INTO country_market_launches (jurisdiction_iso, catalog_country_id, owner_user_id, phase, checklist)
        VALUES ($1, $2, $3, 'intake', '{}'::jsonb)
        RETURNING id, jurisdiction_iso, catalog_country_id, phase, checklist, owner_user_id,
                  launched_at, evidence_ref, created_at, updated_at
        "#,
    )
    .bind(jurisdiction_iso)
    .bind(catalog_country_id)
    .bind(owner_user_id)
    .fetch_one(pool)
    .await
}

pub async fn patch_country_market_checklist(
    pool: &PgPool,
    id: Uuid,
    patch: Value,
) -> Result<Option<CountryMarketLaunchRow>, sqlx::Error> {
    let row = get_country_market_launch(pool, id).await?;
    let Some(existing) = row else {
        return Ok(None);
    };
    let merged = merge_json(existing.checklist, patch);
    sqlx::query_as(
        r#"
        UPDATE country_market_launches
        SET checklist = $2, updated_at = now()
        WHERE id = $1
        RETURNING id, jurisdiction_iso, catalog_country_id, phase, checklist, owner_user_id,
                  launched_at, evidence_ref, created_at, updated_at
        "#,
    )
    .bind(id)
    .bind(merged)
    .fetch_optional(pool)
    .await
}

pub async fn advance_country_market_launch_phase(
    pool: &PgPool,
    id: Uuid,
) -> Result<Result<CountryMarketLaunchRow, &'static str>, sqlx::Error> {
    let Some(row) = get_country_market_launch(pool, id).await? else {
        return Ok(Err("not_found"));
    };
    let Some(next) = next_launch_phase(row.phase.as_str()) else {
        return Ok(Err("invalid_phase_transition"));
    };
    if row.phase == "legal" && !legal_checklist_pass(&row.checklist) {
        return Ok(Err("legal_checklist_incomplete"));
    }
    if row.phase == "geo" && !geo_checklist_pass(&row.checklist) {
        return Ok(Err("geo_checklist_incomplete"));
    }
    if row.phase == "steward" && !steward_checklist_ready(&row.checklist) {
        return Ok(Err("steward_checklist_incomplete"));
    }
    let updated = sqlx::query_as(
        r#"
        UPDATE country_market_launches
        SET phase = $2, updated_at = now()
        WHERE id = $1
        RETURNING id, jurisdiction_iso, catalog_country_id, phase, checklist, owner_user_id,
                  launched_at, evidence_ref, created_at, updated_at
        "#,
    )
    .bind(id)
    .bind(next)
    .fetch_one(pool)
    .await?;
    Ok(Ok(updated))
}

pub async fn activate_country_market_launch(
    pool: &PgPool,
    id: Uuid,
    evidence_ref: Option<&str>,
) -> Result<Result<CountryMarketLaunchRow, &'static str>, sqlx::Error> {
    let Some(row) = get_country_market_launch(pool, id).await? else {
        return Ok(Err("not_found"));
    };
    if row.phase != "publish" && row.phase != "live" {
        return Ok(Err("invalid_phase_for_activate"));
    }
    if !legal_checklist_pass(&row.checklist) || !geo_checklist_pass(&row.checklist) {
        return Ok(Err("checklist_incomplete"));
    }
    let updated = sqlx::query_as(
        r#"
        UPDATE country_market_launches
        SET phase = 'live', launched_at = COALESCE(launched_at, now()),
            evidence_ref = COALESCE($2, evidence_ref), updated_at = now()
        WHERE id = $1
        RETURNING id, jurisdiction_iso, catalog_country_id, phase, checklist, owner_user_id,
                  launched_at, evidence_ref, created_at, updated_at
        "#,
    )
    .bind(id)
    .bind(evidence_ref)
    .fetch_one(pool)
    .await?;
    Ok(Ok(updated))
}

pub async fn verify_geo_parity_for_iso(pool: &PgPool, iso: &str) -> Result<bool, sqlx::Error> {
    let rows = super::catalog_geo_validation_ops_admin::build_meta_product_countries_parity(pool).await?;
    Ok(rows
        .into_iter()
        .find(|r| r.core_iso.eq_ignore_ascii_case(iso))
        .is_some_and(|r| r.passed))
}

pub async fn get_catalog_country_iso_by_id(
    pool: &PgPool,
    country_id: Uuid,
) -> Result<Option<String>, sqlx::Error> {
    let row: Option<(String,)> =
        sqlx::query_as("SELECT iso3166 FROM catalog_countries WHERE id = $1")
            .bind(country_id)
            .fetch_optional(pool)
            .await?;
    Ok(row.map(|(s,)| s))
}

pub async fn assert_publish_gate_for_catalog_country(
    pool: &PgPool,
    catalog_country_id: Uuid,
) -> Result<Result<(), Vec<CountryMarketGateBlock>>, sqlx::Error> {
    let Some(iso) = get_catalog_country_iso_by_id(pool, catalog_country_id).await? else {
        return Ok(Ok(()));
    };
    let Some(launch) = get_country_market_launch_by_iso(pool, &iso).await? else {
        return Ok(Ok(()));
    };
    match assert_country_market_gates_for_publish(&launch) {
        Ok(()) => {
            if !verify_geo_parity_for_iso(pool, &iso).await? {
                return Ok(Err(vec![CountryMarketGateBlock {
                    gate: "GCM-G2-LIVE".into(),
                    detail: format!("C-S5 meta parity failed for {iso}"),
                }]));
            }
            Ok(Ok(()))
        }
        Err(blocks) => Ok(Err(blocks)),
    }
}

fn merge_json(base: Value, patch: Value) -> Value {
    match (base, patch) {
        (Value::Object(mut a), Value::Object(b)) => {
            for (k, v) in b {
                let entry = a.entry(k).or_insert(Value::Null);
                *entry = if entry.is_object() && v.is_object() {
                    merge_json(entry.clone(), v)
                } else {
                    v
                };
            }
            Value::Object(a)
        }
        (_, patch) => patch,
    }
}

#[derive(Debug, Deserialize)]
pub struct CreateCountryMarketLaunchInput {
    pub jurisdiction_iso: String,
    pub catalog_country_id: Option<Uuid>,
    pub owner_user_id: Option<Uuid>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn legal_checklist_requires_three_pass() {
        let cl = json!({
            "legal": {
                "tos_version": { "status": "pass" },
                "payment_policy_ref": { "status": "pass" },
                "data_transfer": { "status": "pass" }
            }
        });
        assert!(legal_checklist_pass(&cl));
    }

    #[test]
    fn next_phase_intake_to_legal() {
        assert_eq!(next_launch_phase("intake"), Some("legal"));
    }
}
