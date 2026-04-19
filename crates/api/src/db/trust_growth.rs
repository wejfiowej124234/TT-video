//! P-SCALE1 / P-OBS1：信任增长指标、运行时权重、控制面与可观测

use sqlx::{PgPool, Postgres, Transaction, types::Json};

use crate::trust_growth_autopilot::{
    apply_variant_weight_caps, compute_trust_growth_alerts, equal_weights_moments_json,
    recompute_runtime_weights, VariantAgg, MOMENTS, VARIANT_IDS,
};

fn trust_growth_env() -> String {
    std::env::var("TRUST_GROWTH_ENV")
        .unwrap_or_else(|_| "default".to_string())
        .trim()
        .to_string()
}

/// 人工控制状态（与 `trust_growth_control` 表对应）
#[derive(Debug, Clone)]
pub struct TrustGrowthControlState {
    pub weights_frozen: bool,
    pub force_control_only: bool,
    pub variant_weight_caps: serde_json::Value,
}

impl Default for TrustGrowthControlState {
    fn default() -> Self {
        Self {
            weights_frozen: false,
            force_control_only: false,
            variant_weight_caps: serde_json::json!({}),
        }
    }
}

async fn load_control_tx(
    tx: &mut Transaction<'_, Postgres>,
    env: &str,
) -> Result<TrustGrowthControlState, String> {
    sqlx::query(
        r#"
        INSERT INTO trust_growth_control (environment) VALUES ($1)
        ON CONFLICT (environment) DO NOTHING
        "#,
    )
    .bind(env)
    .execute(&mut **tx)
    .await
    .map_err(|e| e.to_string())?;

    let row: Option<(bool, bool, serde_json::Value)> = sqlx::query_as(
        r#"
        SELECT weights_frozen, force_control_only, variant_weight_caps
        FROM trust_growth_control
        WHERE environment = $1
        "#,
    )
    .bind(env)
    .fetch_optional(&mut **tx)
    .await
    .map_err(|e| e.to_string())?;

    Ok(match row {
        Some((wf, fc, caps)) => TrustGrowthControlState {
            weights_frozen: wf,
            force_control_only: fc,
            variant_weight_caps: caps,
        },
        None => TrustGrowthControlState::default(),
    })
}

async fn load_control_pool(pool: &PgPool, env: &str) -> Result<TrustGrowthControlState, sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO trust_growth_control (environment) VALUES ($1)
        ON CONFLICT (environment) DO NOTHING
        "#,
    )
    .bind(env)
    .execute(pool)
    .await?;

    let row: Option<(bool, bool, serde_json::Value)> = sqlx::query_as(
        r#"
        SELECT weights_frozen, force_control_only, variant_weight_caps
        FROM trust_growth_control
        WHERE environment = $1
        "#,
    )
    .bind(env)
    .fetch_optional(pool)
    .await?;

    Ok(match row {
        Some((wf, fc, caps)) => TrustGrowthControlState {
            weights_frozen: wf,
            force_control_only: fc,
            variant_weight_caps: caps,
        },
        None => TrustGrowthControlState::default(),
    })
}

fn apply_control_to_moments(
    computed: serde_json::Value,
    control: &TrustGrowthControlState,
) -> serde_json::Value {
    let mut v = if control.force_control_only {
        equal_weights_moments_json()
    } else {
        computed
    };
    if let Some(caps) = control.variant_weight_caps.as_object() {
        if !caps.is_empty() {
            v = apply_variant_weight_caps(&v, caps);
        }
    }
    v
}

async fn fetch_metric_rows_tx(
    tx: &mut Transaction<'_, Postgres>,
    env: &str,
) -> Result<Vec<MetricRow>, String> {
    sqlx::query_as::<_, MetricRow>(
        r#"
        SELECT moment, variant_id, view_count, trust_hub_click_count, dismiss_count, details_toggle_open_count
        FROM trust_growth_variant_metrics
        WHERE environment = $1
        "#,
    )
    .bind(env)
    .fetch_all(&mut **tx)
    .await
    .map_err(|e| e.to_string())
}

fn rows_to_flat(rows: Vec<MetricRow>) -> Vec<(String, String, VariantAgg)> {
    let mut flat: Vec<(String, String, VariantAgg)> = rows
        .into_iter()
        .map(|r| {
            (
                r.moment,
                r.variant_id,
                VariantAgg {
                    view: r.view_count,
                    trust_hub_click: r.trust_hub_click_count,
                    dismiss: r.dismiss_count,
                    details_toggle_open: r.details_toggle_open_count,
                },
            )
        })
        .collect();

    for m in MOMENTS.iter().copied() {
        for v in VARIANT_IDS.iter().copied() {
            if !flat
                .iter()
                .any(|(mm, vv, _)| mm.as_str() == m && vv.as_str() == v)
            {
                flat.push((m.to_string(), v.to_string(), VariantAgg::default()));
            }
        }
    }
    flat
}

async fn persist_runtime_and_history(
    tx: &mut Transaction<'_, Postgres>,
    env: &str,
    moments_json: &serde_json::Value,
) -> Result<i64, String> {
    let gen: i64 = sqlx::query_scalar(
        r#"
        INSERT INTO trust_growth_runtime_state (environment, moments_json, autopilot_generation, updated_at)
        VALUES ($1, $2::jsonb, 1, now())
        ON CONFLICT (environment) DO UPDATE SET
          moments_json = EXCLUDED.moments_json,
          autopilot_generation = trust_growth_runtime_state.autopilot_generation + 1,
          updated_at = now()
        RETURNING autopilot_generation
        "#,
    )
    .bind(env)
    .bind(Json(moments_json))
    .fetch_one(&mut **tx)
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query(
        r#"
        INSERT INTO trust_growth_generation_history (environment, autopilot_generation)
        VALUES ($1, $2)
        "#,
    )
    .bind(env)
    .bind(gen)
    .execute(&mut **tx)
    .await
    .map_err(|e| e.to_string())?;

    Ok(gen)
}

/// 在指标已更新后，按当前控制策略重算并落库（ingest 尾段与 admin PATCH 共用）。
pub async fn trust_growth_recompute_and_persist(
    pool: &PgPool,
    control: &TrustGrowthControlState,
) -> Result<(i64, serde_json::Value), String> {
    let env = trust_growth_env();
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
    if control.weights_frozen {
        tx.commit().await.map_err(|e| e.to_string())?;
        let (g, j, _) = trust_growth_get_config(pool).await.map_err(|e| e.to_string())?;
        return Ok((g, j));
    }

    let rows = fetch_metric_rows_tx(&mut tx, &env).await?;
    let flat = rows_to_flat(rows);
    let computed = recompute_runtime_weights(&flat);
    let moments_json = apply_control_to_moments(computed, control);
    let gen = persist_runtime_and_history(&mut tx, &env, &moments_json).await?;
    tx.commit().await.map_err(|e| e.to_string())?;
    Ok((gen, moments_json))
}

/// 累加指标并按控制策略重算（单事务）；`weights_frozen` 时仅写指标、不推进 generation。
pub async fn trust_growth_ingest_and_recompute(
    pool: &PgPool,
    event: &str,
    moment: &str,
    variant_id: &str,
    details_open: Option<bool>,
) -> Result<(i64, serde_json::Value), String> {
    let env = trust_growth_env();
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    let control = load_control_tx(&mut tx, &env).await?;

    match event {
        "trust_growth_moment_view" => {
            sqlx::query(
                r#"
                INSERT INTO trust_growth_variant_metrics
                  (environment, moment, variant_id, view_count, updated_at)
                VALUES ($1, $2, $3, 1, now())
                ON CONFLICT (environment, moment, variant_id) DO UPDATE SET
                  view_count = trust_growth_variant_metrics.view_count + 1,
                  updated_at = now()
                "#,
            )
            .bind(&env)
            .bind(moment)
            .bind(variant_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
        }
        "trust_growth_trust_hub_click" => {
            sqlx::query(
                r#"
                INSERT INTO trust_growth_variant_metrics
                  (environment, moment, variant_id, trust_hub_click_count, updated_at)
                VALUES ($1, $2, $3, 1, now())
                ON CONFLICT (environment, moment, variant_id) DO UPDATE SET
                  trust_hub_click_count = trust_growth_variant_metrics.trust_hub_click_count + 1,
                  updated_at = now()
                "#,
            )
            .bind(&env)
            .bind(moment)
            .bind(variant_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
        }
        "trust_growth_moment_dismiss" => {
            sqlx::query(
                r#"
                INSERT INTO trust_growth_variant_metrics
                  (environment, moment, variant_id, dismiss_count, updated_at)
                VALUES ($1, $2, $3, 1, now())
                ON CONFLICT (environment, moment, variant_id) DO UPDATE SET
                  dismiss_count = trust_growth_variant_metrics.dismiss_count + 1,
                  updated_at = now()
                "#,
            )
            .bind(&env)
            .bind(moment)
            .bind(variant_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
        }
        "trust_growth_details_toggle" => {
            if details_open == Some(true) {
                sqlx::query(
                    r#"
                    INSERT INTO trust_growth_variant_metrics
                      (environment, moment, variant_id, details_toggle_open_count, updated_at)
                    VALUES ($1, $2, $3, 1, now())
                    ON CONFLICT (environment, moment, variant_id) DO UPDATE SET
                      details_toggle_open_count = trust_growth_variant_metrics.details_toggle_open_count + 1,
                      updated_at = now()
                    "#,
                )
                .bind(&env)
                .bind(moment)
                .bind(variant_id)
                .execute(&mut *tx)
                .await
                .map_err(|e| e.to_string())?;
            }
        }
        _ => {
            tx.rollback().await.ok();
            return Err("unknown_event".to_string());
        }
    }

    if control.weights_frozen {
        tx.commit().await.map_err(|e| e.to_string())?;
        let (gen, json, _) = trust_growth_get_config(pool).await.map_err(|e| e.to_string())?;
        return Ok((gen, json));
    }

    let rows = fetch_metric_rows_tx(&mut tx, &env).await?;
    let flat = rows_to_flat(rows);
    let computed = recompute_runtime_weights(&flat);
    let moments_json = apply_control_to_moments(computed, &control);
    let gen = persist_runtime_and_history(&mut tx, &env, &moments_json).await?;
    tx.commit().await.map_err(|e| e.to_string())?;
    Ok((gen, moments_json))
}

#[derive(Clone, sqlx::FromRow)]
struct MetricRow {
    moment: String,
    variant_id: String,
    view_count: i64,
    trust_hub_click_count: i64,
    dismiss_count: i64,
    details_toggle_open_count: i64,
}

pub async fn trust_growth_get_config(
    pool: &PgPool,
) -> Result<(i64, serde_json::Value, chrono::DateTime<chrono::Utc>), sqlx::Error> {
    let env = trust_growth_env();
    let row: Option<(serde_json::Value, i64, chrono::DateTime<chrono::Utc>)> = sqlx::query_as(
        r#"
        SELECT moments_json, autopilot_generation, updated_at
        FROM trust_growth_runtime_state
        WHERE environment = $1
        "#,
    )
    .bind(&env)
    .fetch_optional(pool)
    .await?;

    if let Some((json, gen, updated)) = row {
        return Ok((gen, json, updated));
    }

    Ok((0, serde_json::json!({}), chrono::Utc::now()))
}

/// P-OBS1：更新控制行并立即按当前指标重算权重（admin）。
pub async fn trust_growth_patch_control_and_refresh(
    pool: &PgPool,
    patch: TrustGrowthControlState,
) -> Result<(TrustGrowthControlState, i64, serde_json::Value), String> {
    let env = trust_growth_env();
    let caps = patch.variant_weight_caps.clone();
    sqlx::query(
        r#"
        INSERT INTO trust_growth_control
          (environment, weights_frozen, force_control_only, variant_weight_caps, control_updated_at)
        VALUES ($1, $2, $3, $4::jsonb, now())
        ON CONFLICT (environment) DO UPDATE SET
          weights_frozen = EXCLUDED.weights_frozen,
          force_control_only = EXCLUDED.force_control_only,
          variant_weight_caps = EXCLUDED.variant_weight_caps,
          control_updated_at = now()
        "#,
    )
    .bind(&env)
    .bind(patch.weights_frozen)
    .bind(patch.force_control_only)
    .bind(Json(&caps))
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    let current = load_control_pool(pool, &env).await.map_err(|e| e.to_string())?;
    let (gen, mj) = trust_growth_recompute_and_persist(pool, &current).await?;
    Ok((current, gen, mj))
}

pub async fn trust_growth_get_control(pool: &PgPool) -> Result<TrustGrowthControlState, sqlx::Error> {
    let env = trust_growth_env();
    load_control_pool(pool, &env).await
}

#[derive(sqlx::FromRow)]
struct GenHistRow {
    autopilot_generation: i64,
    recorded_at: chrono::DateTime<chrono::Utc>,
}

/// Admin：可观测快照（指标、控制、告警、generation 轨迹）。
pub async fn trust_growth_observability_snapshot(
    pool: &PgPool,
) -> Result<serde_json::Value, String> {
    let env = trust_growth_env();
    let control = load_control_pool(pool, &env).await.map_err(|e| e.to_string())?;

    let rows = sqlx::query_as::<_, MetricRow>(
        r#"
        SELECT moment, variant_id, view_count, trust_hub_click_count, dismiss_count, details_toggle_open_count
        FROM trust_growth_variant_metrics
        WHERE environment = $1
        ORDER BY moment, variant_id
        "#,
    )
    .bind(&env)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    let flat = rows_to_flat(rows.clone());
    let (gen, moments_json, updated_rt) =
        trust_growth_get_config(pool).await.map_err(|e| e.to_string())?;

    let ctrl_updated: Option<chrono::DateTime<chrono::Utc>> = sqlx::query_scalar(
        r#"SELECT control_updated_at FROM trust_growth_control WHERE environment = $1"#,
    )
    .bind(&env)
    .fetch_optional(pool)
    .await
    .map_err(|e| e.to_string())?;

    let history: Vec<GenHistRow> = sqlx::query_as(
        r#"
        SELECT autopilot_generation, recorded_at
        FROM trust_growth_generation_history
        WHERE environment = $1
        ORDER BY recorded_at DESC
        LIMIT 120
        "#,
    )
    .bind(&env)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    let alerts = compute_trust_growth_alerts(&flat, &moments_json);

    let mut by_moment: Vec<serde_json::Value> = Vec::new();
    for m in MOMENTS.iter().copied() {
        let mut total_v: i64 = 0;
        for vid in VARIANT_IDS.iter().copied() {
            let r = rows
                .iter()
                .find(|x| x.moment.as_str() == m && x.variant_id.as_str() == vid);
            total_v += r.map(|x| x.view_count).unwrap_or(0);
        }
        let mut variants: Vec<serde_json::Value> = Vec::new();
        let mut view_distribution: Vec<serde_json::Value> = Vec::new();
        for vid in VARIANT_IDS.iter().copied() {
            let r = rows
                .iter()
                .find(|x| x.moment.as_str() == m && x.variant_id.as_str() == vid);
            let v = r.map(|x| x.view_count).unwrap_or(0);
            let c = r.map(|x| x.trust_hub_click_count).unwrap_or(0);
            let ctr = if v > 0 {
                (c as f64) / (v as f64)
            } else {
                0.0
            };
            let w = moments_json
                .get(m)
                .and_then(|x| x.get(vid))
                .and_then(|x| x.as_f64())
                .unwrap_or(0.0);
            let frac = if total_v > 0 {
                (v as f64) / (total_v as f64)
            } else {
                0.0
            };
            variants.push(serde_json::json!({
                "variant_id": vid,
                "views": v,
                "clicks": c,
                "ctr": ctr,
                "weight": w,
            }));
            view_distribution.push(serde_json::json!({
                "variant_id": vid,
                "view_share": frac,
            }));
        }

        by_moment.push(serde_json::json!({
            "moment": m,
            "total_views": total_v,
            "variants": variants,
            "view_distribution": view_distribution,
        }));
    }

    Ok(serde_json::json!({
        "anchor": "trust_growth_obs_v1",
        "environment": env,
        "runtime": {
            "autopilot_generation": gen,
            "updated_at": updated_rt.to_rfc3339(),
            "moments": moments_json,
        },
        "control": {
            "weights_frozen": control.weights_frozen,
            "force_control_only": control.force_control_only,
            "variant_weight_caps": control.variant_weight_caps,
            "control_updated_at": ctrl_updated.map(|t| t.to_rfc3339()).unwrap_or_else(|| chrono::Utc::now().to_rfc3339()),
        },
        "metrics": { "by_moment": by_moment },
        "generation_history": history.iter().map(|h| serde_json::json!({
            "autopilot_generation": h.autopilot_generation,
            "recorded_at": h.recorded_at.to_rfc3339(),
        })).collect::<Vec<_>>(),
        "alerts": alerts,
        "thresholds": {
            "traffic_skew_ratio": std::env::var("TRUST_GROWTH_ALERT_TRAFFIC_SKEW_RATIO").ok().and_then(|s| s.parse().ok()).unwrap_or(8.0_f64),
            "ctr_collapse": std::env::var("TRUST_GROWTH_ALERT_CTR_COLLAPSE").ok().and_then(|s| s.parse().ok()).unwrap_or(0.003_f64),
            "weight_band": [
                std::env::var("TRUST_GROWTH_ALERT_WEIGHT_LOW").ok().and_then(|s| s.parse().ok()).unwrap_or(4.0_f64),
                std::env::var("TRUST_GROWTH_ALERT_WEIGHT_HIGH").ok().and_then(|s| s.parse().ok()).unwrap_or(92.0_f64),
            ],
        },
    }))
}
