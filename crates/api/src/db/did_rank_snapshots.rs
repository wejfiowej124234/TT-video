//! **`did_rank_rank_snapshots`**：`rank_delta` 上一榜快照（`cache_key` → id→rank JSON）。

use std::collections::HashMap;

use chrono::Utc;
use serde_json::Value;
use sqlx::postgres::PgPool;

fn ranks_to_json(map: &HashMap<String, i64>) -> Value {
    let obj: serde_json::Map<String, Value> = map
        .iter()
        .map(|(k, v)| (k.clone(), Value::from(*v)))
        .collect();
    Value::Object(obj)
}

fn ranks_from_json(v: &Value) -> HashMap<String, i64> {
    let Some(obj) = v.as_object() else {
        return HashMap::new();
    };
    obj.iter()
        .filter_map(|(k, v)| Some((k.clone(), v.as_i64()?)))
        .collect()
}

pub async fn load_did_rank_rank_snapshot(
    pool: &PgPool,
    cache_key: &str,
) -> Result<Option<HashMap<String, i64>>, sqlx::Error> {
    let row: Option<(Value,)> = sqlx::query_as(
        "SELECT ranks_json FROM did_rank_rank_snapshots WHERE cache_key = $1",
    )
    .bind(cache_key)
    .fetch_optional(pool)
    .await?;
    Ok(row.map(|(j,)| ranks_from_json(&j)))
}

pub async fn upsert_did_rank_rank_snapshot(
    pool: &PgPool,
    cache_key: &str,
    ranks: &HashMap<String, i64>,
) -> Result<(), sqlx::Error> {
    let now = Utc::now();
    let body = ranks_to_json(ranks);
    sqlx::query(
        r#"INSERT INTO did_rank_rank_snapshots (cache_key, ranks_json, updated_at)
           VALUES ($1, $2, $3)
           ON CONFLICT (cache_key) DO UPDATE
           SET ranks_json = EXCLUDED.ranks_json, updated_at = EXCLUDED.updated_at"#,
    )
    .bind(cache_key)
    .bind(body)
    .bind(now)
    .execute(pool)
    .await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ranks_json_roundtrip() {
        let mut m = HashMap::new();
        m.insert("a".to_string(), 1);
        m.insert("b".to_string(), 2);
        let j = ranks_to_json(&m);
        let back = ranks_from_json(&j);
        assert_eq!(back.get("a"), Some(&1));
        assert_eq!(back.get("b"), Some(&2));
    }
}
