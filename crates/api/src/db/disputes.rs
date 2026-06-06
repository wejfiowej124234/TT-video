//! disputes 表：DbDisputeRow、insert_dispute、update_dispute_resolved、list_disputes（48 §6.8）
//! 公开 **`GET /api/v1/disputes*`** 在 **`DATABASE_URL`** 路径下可走 **`list_disputes_public_page`** / **`get_dispute_public_detail`**（与 **87** 双读一致）。
//!
//! **B-099 / TT-DISPUTES-LIST-DETAIL-POSTGRES-001**：列表分页与详情 JSON **仅**经本模块查询 + **`disputes_public_list_ok_envelope`** / **`dispute_public_detail_envelope_from_join_row`** 组装，与 **`routes/disputes`** 生产路径同源。
//! - **TT-B099-LIST-ENVELOPE-POSTGRES-SOURCE-001**：**`page.source`**=`postgres`，**`next_cursor`** 与 **`list_disputes_public_page`** 键集一致。
//! - **TT-B099-DETAIL-JOIN-ENVELOPE-001**：**`GET /disputes/:id`** PG 路径 **`disputes` LEFT JOIN `orders`** 行 → 详情 **`status":"ok"`** 包络（与 **`chain_off::dispute_detail_envelope`** 成功体同形）。
//!
//! **B-118 / TT-B118-DISPUTES-PG-ENVELOPE-SSOT-001**：**`dispute_order_party_ids_json`** 为 **`orders.tourist_id` → `tourist_id`/`traveler_id`** 镜像**唯一**实现；列表 **`items[]`** 仅经 **`disputes_public_list_item_from_join_row`**；**`next_cursor`** 仅经 **`disputes_public_list_page_from_join_rows`**（与 **`encode_disputes_list_cursor`** 同源），**禁止**路由层平行 **`json!`** 组 **`items`** 或游标。

use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use base64::Engine;
use chrono::{DateTime, Utc};
use serde_json::{json, Value as JsonValue};
use sqlx::postgres::PgPool;
use uuid::Uuid;

/// 插入争议（open dispute 时双写）
pub async fn insert_dispute(
    pool: &PgPool,
    id: Uuid,
    order_id: Uuid,
    status: &str,
    evidence_hashes: &JsonValue,
    arbitrator_id: Option<Uuid>,
    refund_ratio: Option<f64>,
    slash_guide: Option<bool>,
    resolved_at: Option<DateTime<Utc>>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
    arb_fee_paid: Option<&str>,
    dispute_sequence: i32,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO disputes (id, order_id, status, evidence_hashes, arbitrator_id, refund_ratio, slash_guide, resolved_at, created_at, updated_at, arb_fee_paid, dispute_sequence)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO NOTHING
        "#,
    )
    .bind(id)
    .bind(order_id)
    .bind(status)
    .bind(evidence_hashes)
    .bind(arbitrator_id)
    .bind(refund_ratio)
    .bind(slash_guide)
    .bind(resolved_at)
    .bind(created_at)
    .bind(updated_at)
    .bind(arb_fee_paid)
    .bind(dispute_sequence)
    .execute(pool)
    .await?;
    Ok(())
}

/// 更新争议（resolve 时）
pub async fn update_dispute_resolved(
    pool: &PgPool,
    id: Uuid,
    status: &str,
    arbitrator_id: Uuid,
    refund_ratio: f64,
    slash_guide: bool,
    resolved_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE disputes SET status = $1, arbitrator_id = $2, refund_ratio = $3, slash_guide = $4, resolved_at = $5, updated_at = $6 WHERE id = $7",
    )
    .bind(status)
    .bind(arbitrator_id)
    .bind(refund_ratio)
    .bind(slash_guide)
    .bind(resolved_at)
    .bind(updated_at)
    .bind(id)
    .execute(pool)
    .await?;
    Ok(())
}

/// 争议行（用于 hydrate）
#[derive(Debug)]
pub struct DbDisputeRow {
    pub id: Uuid,
    pub order_id: Uuid,
    pub status: String,
    pub evidence_hashes: JsonValue,
    pub arbitrator_id: Option<Uuid>,
    pub refund_ratio: Option<f64>,
    pub slash_guide: Option<bool>,
    pub resolved_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub arb_fee_paid: Option<String>,
    pub dispute_sequence: i32,
}

/// 加载所有争议（启动 hydrate）
pub async fn list_disputes(pool: &PgPool) -> Result<Vec<DbDisputeRow>, sqlx::Error> {
    #[derive(sqlx::FromRow)]
    struct Row {
        id: Uuid,
        order_id: Uuid,
        status: String,
        evidence_hashes: JsonValue,
        arbitrator_id: Option<Uuid>,
        refund_ratio: Option<f64>,
        slash_guide: Option<bool>,
        resolved_at: Option<DateTime<Utc>>,
        created_at: DateTime<Utc>,
        updated_at: DateTime<Utc>,
        arb_fee_paid: Option<String>,
        dispute_sequence: i32,
    }
    let rows = sqlx::query_as::<_, Row>(
        "SELECT id, order_id, status, evidence_hashes, arbitrator_id, refund_ratio, slash_guide, resolved_at, created_at, updated_at, arb_fee_paid, dispute_sequence FROM disputes",
    )
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(|r| DbDisputeRow {
            id: r.id,
            order_id: r.order_id,
            status: r.status,
            evidence_hashes: r.evidence_hashes,
            arbitrator_id: r.arbitrator_id,
            refund_ratio: r.refund_ratio,
            slash_guide: r.slash_guide,
            resolved_at: r.resolved_at,
            created_at: r.created_at,
            updated_at: r.updated_at,
            arb_fee_paid: r.arb_fee_paid,
            dispute_sequence: r.dispute_sequence,
        })
        .collect())
}

/// `GET /api/v1/disputes?limit&cursor` 游标（URL-safe base64(JSON)）。
#[derive(serde::Deserialize, serde::Serialize)]
struct DisputesListCursorPayload {
    u: String,
    i: String,
}

/// 解码列表游标；空串表示首页。
pub fn decode_disputes_list_cursor(
    raw: Option<&str>,
) -> Result<Option<(DateTime<Utc>, Uuid)>, ()> {
    let Some(s) = raw.map(str::trim).filter(|x| !x.is_empty()) else {
        return Ok(None);
    };
    let bytes = URL_SAFE_NO_PAD.decode(s.as_bytes()).map_err(|_| ())?;
    let p: DisputesListCursorPayload = serde_json::from_slice(&bytes).map_err(|_| ())?;
    let ts = DateTime::parse_from_rfc3339(&p.u)
        .map_err(|_| ())?
        .with_timezone(&Utc);
    let id = Uuid::parse_str(&p.i).map_err(|_| ())?;
    Ok(Some((ts, id)))
}

/// **`LEFT JOIN orders`** 行上之 **`order_tourist_id`** → 公开 **`tourist_id` / `traveler_id`**（**87** 镜像）；列表 **`items[]`** 与详情 **`dispute`** **共用**，**禁止**平行手写两套。
pub fn dispute_order_party_ids_json(order_tourist_id: Option<Uuid>) -> (JsonValue, JsonValue) {
    match order_tourist_id {
        Some(t) => {
            let s = t.to_string();
            (json!(s.clone()), json!(s))
        }
        None => (JsonValue::Null, JsonValue::Null),
    }
}

pub(crate) fn encode_disputes_list_cursor(ts: DateTime<Utc>, id: Uuid) -> String {
    let p = DisputesListCursorPayload {
        u: ts.to_rfc3339(),
        i: id.to_string(),
    };
    let bytes = serde_json::to_vec(&p).expect("cursor json");
    URL_SAFE_NO_PAD.encode(bytes)
}

/// 与 **`chain_off::disputes_list_impl`** **`items[]`** 同形；**`source`**=`postgres`。
pub struct DisputesPublicListPage {
    pub items: Vec<JsonValue>,
    pub next_cursor: Option<String>,
    pub has_more: bool,
    pub limit_applied: i64,
}

/// **`GET /api/v1/disputes`** 在 **`list_disputes_public_page` 成功** 时的 **`200`** 体（与 **`routes/disputes::get_disputes`** 同源）。
pub fn disputes_public_list_ok_envelope(page: &DisputesPublicListPage) -> JsonValue {
    json!({
        "status": "ok",
        "items": &page.items,
        "page": {
            "limit": page.limit_applied,
            "has_more": page.has_more,
            "next_cursor": page.next_cursor,
            "source": "postgres",
        }
    })
}

/// **`DisputeListJoinRow`** 列表项 JSON（**`GET /disputes`** **`items[]`** **唯一**组装入口）。
pub fn disputes_public_list_item_from_join_row(r: &DisputeListJoinRow) -> JsonValue {
    let (tourist_id, traveler_id) = dispute_order_party_ids_json(r.order_tourist_id);
    json!({
        "id": r.id.to_string(),
        "order_id": r.order_id.to_string(),
        "tourist_id": tourist_id,
        "traveler_id": traveler_id,
        "status": &r.status,
        "resolved_at": r.resolved_at.map(|t| t.to_rfc3339()),
        "created_at": r.created_at.to_rfc3339(),
    })
}

/// 将 **`LIMIT fetch`** 原始行裁成一页并计算 **`next_cursor`**（与 **`list_disputes_public_page`** SQL 之后路径**同源**）。
pub fn disputes_public_list_page_from_join_rows(
    mut rows: Vec<DisputeListJoinRow>,
    limit: i64,
) -> DisputesPublicListPage {
    let mut has_more = false;
    if (rows.len() as i64) > limit {
        has_more = true;
        rows.truncate(limit as usize);
    }

    let last_for_cursor = rows.last().map(|r| (r.updated_at, r.id));

    let items: Vec<JsonValue> = rows
        .iter()
        .map(disputes_public_list_item_from_join_row)
        .collect();

    let next_cursor = if has_more {
        last_for_cursor.map(|(ts, id)| encode_disputes_list_cursor(ts, id))
    } else {
        None
    };

    DisputesPublicListPage {
        items,
        next_cursor,
        has_more,
        limit_applied: limit,
    }
}

/// 按 **`updated_at DESC, id DESC`** 键集分页（**`limit`** 已钳 1～500）。
pub async fn list_disputes_public_page(
    pool: &PgPool,
    limit: i64,
    cursor: Option<(DateTime<Utc>, Uuid)>,
) -> Result<DisputesPublicListPage, sqlx::Error> {
    let fetch = limit.saturating_add(1).max(2);
    let rows: Vec<DisputeListJoinRow> = if let Some((ts, id)) = cursor {
        sqlx::query_as(
            r#"
            SELECT d.id, d.order_id, d.status, d.resolved_at, d.created_at, d.updated_at,
                   o.tourist_id AS order_tourist_id
            FROM disputes d
            LEFT JOIN orders o ON o.id = d.order_id
            WHERE (d.updated_at, d.id) < ($1::timestamptz, $2::uuid)
            ORDER BY d.updated_at DESC, d.id DESC
            LIMIT $3
            "#,
        )
        .bind(ts)
        .bind(id)
        .bind(fetch)
        .fetch_all(pool)
        .await?
    } else {
        sqlx::query_as(
            r#"
            SELECT d.id, d.order_id, d.status, d.resolved_at, d.created_at, d.updated_at,
                   o.tourist_id AS order_tourist_id
            FROM disputes d
            LEFT JOIN orders o ON o.id = d.order_id
            ORDER BY d.updated_at DESC, d.id DESC
            LIMIT $1
            "#,
        )
        .bind(fetch)
        .fetch_all(pool)
        .await?
    };

    Ok(disputes_public_list_page_from_join_rows(rows, limit))
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct DisputeListJoinRow {
    pub id: Uuid,
    pub order_id: Uuid,
    pub status: String,
    pub resolved_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub order_tourist_id: Option<Uuid>,
}

/// 与 **`chain_off::dispute_detail_envelope`** 成功体同形；**`get_dispute_public_detail`** 查询后唯一映射入口。
pub fn dispute_public_detail_envelope_from_join_row(r: DisputeDetailJoinRow) -> JsonValue {
    let (tourist_id, traveler_id) = dispute_order_party_ids_json(r.order_tourist_id);
    json!({
        "status": "ok",
        "dispute": {
            "id": r.id.to_string(),
            "order_id": r.order_id.to_string(),
            "tourist_id": tourist_id,
            "traveler_id": traveler_id,
            "status": r.status,
            "evidence_hashes": r.evidence_hashes,
            "arbitrator_id": r.arbitrator_id.map(|u| u.to_string()),
            "arb_fee_paid": r.arb_fee_paid,
            "dispute_sequence": r.dispute_sequence,
            "refund_ratio": r.refund_ratio,
            "slash_guide": r.slash_guide,
            "resolved_at": r.resolved_at.map(|t| t.to_rfc3339()),
            "created_at": r.created_at.to_rfc3339(),
            "updated_at": r.updated_at.to_rfc3339(),
        }
    })
}

/// 与 **`chain_off::dispute_detail_envelope`** 成功体同形；无行则 **`None`**。
pub async fn get_dispute_public_detail(
    pool: &PgPool,
    id: Uuid,
) -> Result<Option<JsonValue>, sqlx::Error> {
    let row = sqlx::query_as::<_, DisputeDetailJoinRow>(
        r#"
        SELECT d.id, d.order_id, d.status,
               CASE
                 WHEN pg_typeof(d.evidence_hashes)::text = 'jsonb'
                   THEN d.evidence_hashes::jsonb
                 ELSE COALESCE(to_jsonb(d.evidence_hashes), '[]'::jsonb)
               END AS evidence_hashes,
               d.arbitrator_id, d.refund_ratio, d.slash_guide,
               d.resolved_at, d.created_at, d.updated_at, d.arb_fee_paid, d.dispute_sequence,
               o.tourist_id AS order_tourist_id
        FROM disputes d
        LEFT JOIN orders o ON o.id = d.order_id
        WHERE d.id = $1
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    let Some(r) = row else {
        return Ok(None);
    };

    Ok(Some(dispute_public_detail_envelope_from_join_row(r)))
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct DisputeDetailJoinRow {
    pub id: Uuid,
    pub order_id: Uuid,
    pub status: String,
    pub evidence_hashes: JsonValue,
    pub arbitrator_id: Option<Uuid>,
    pub refund_ratio: Option<f64>,
    pub slash_guide: Option<bool>,
    pub resolved_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub arb_fee_paid: Option<String>,
    pub dispute_sequence: i32,
    pub order_tourist_id: Option<Uuid>,
}

#[cfg(test)]
mod disputes_cursor_tests {
    use super::*;

    #[test]
    fn disputes_list_cursor_roundtrip() {
        let ts = DateTime::parse_from_rfc3339("2024-01-01T12:34:56Z")
            .unwrap()
            .with_timezone(&Utc);
        let id = Uuid::new_v4();
        let enc = encode_disputes_list_cursor(ts, id);
        let dec = decode_disputes_list_cursor(Some(&enc)).expect("decode");
        let (ts2, id2) = dec.expect("some");
        assert_eq!(id, id2);
        assert_eq!(ts, ts2);
    }

    #[test]
    fn disputes_list_cursor_empty_means_first_page() {
        assert!(decode_disputes_list_cursor(None).unwrap().is_none());
        assert!(decode_disputes_list_cursor(Some("")).unwrap().is_none());
        assert!(decode_disputes_list_cursor(Some("   ")).unwrap().is_none());
    }
}

#[cfg(test)]
mod b099_disputes_pg_envelope_tests {
    use super::*;
    use serde_json::json;

    /// **TT-B099-LIST-ENVELOPE-POSTGRES-SOURCE-001**：列表成功体 **`page.source`**=`postgres`，分页字段透传。
    #[test]
    fn b099_disputes_public_list_envelope_source_postgres_and_pagination_fields() {
        let page = DisputesPublicListPage {
            items: vec![json!({"id": "a"})],
            next_cursor: Some("opaque".to_string()),
            has_more: true,
            limit_applied: 42,
        };
        let v = disputes_public_list_ok_envelope(&page);
        assert_eq!(v["status"], "ok");
        assert_eq!(v["page"]["source"], "postgres");
        assert_eq!(v["page"]["limit"], 42);
        assert_eq!(v["page"]["has_more"], true);
        assert_eq!(v["page"]["next_cursor"], "opaque");
        assert!(v["items"].is_array());
    }

    /// **TT-B099-NEXT-CURSOR-KEYSET-001**：**`next_cursor`** 为末行 **`(updated_at, id)`** 编码；客户端 **`?cursor=`** 解码后与 **`list_disputes_public_page`** 键集 **`(d.updated_at, d.id) < ($1,$2)`** 对齐。
    #[test]
    fn b099_next_cursor_matches_encode_of_last_row_sort_key() {
        let ts = DateTime::parse_from_rfc3339("2025-06-01T00:00:00Z")
            .unwrap()
            .with_timezone(&Utc);
        let id = Uuid::parse_str("aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee").unwrap();
        let page = DisputesPublicListPage {
            items: vec![json!({"id": "x"})],
            next_cursor: Some(encode_disputes_list_cursor(ts, id)),
            has_more: true,
            limit_applied: 10,
        };
        let enc = page.next_cursor.as_ref().unwrap();
        let dec = decode_disputes_list_cursor(Some(enc)).unwrap().unwrap();
        assert_eq!(dec.0, ts);
        assert_eq!(dec.1, id);
    }

    /// **TT-B099-DETAIL-JOIN-ENVELOPE-001**：PG join 行 → **`status":"ok"`** + **`dispute`**；**87** **`tourist_id`****/**`traveler_id`** 镜像。
    #[test]
    fn b099_dispute_detail_envelope_tourist_traveler_and_dispute_keys() {
        let tid = Uuid::new_v4();
        let row = DisputeDetailJoinRow {
            id: Uuid::new_v4(),
            order_id: Uuid::new_v4(),
            status: "Open".to_string(),
            evidence_hashes: json!([]),
            arbitrator_id: None,
            refund_ratio: None,
            slash_guide: None,
            resolved_at: None,
            created_at: DateTime::parse_from_rfc3339("2025-01-01T00:00:00Z")
                .unwrap()
                .with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339("2025-01-02T00:00:00Z")
                .unwrap()
                .with_timezone(&Utc),
            arb_fee_paid: None,
            dispute_sequence: 1,
            order_tourist_id: Some(tid),
        };
        let v = dispute_public_detail_envelope_from_join_row(row);
        assert_eq!(v["status"], "ok");
        let d = &v["dispute"];
        let ts = tid.to_string();
        assert_eq!(d["tourist_id"], ts);
        assert_eq!(d["traveler_id"], ts);
        assert_eq!(d["status"], "Open");
        assert!(d.get("evidence_hashes").is_some());
        assert_eq!(d["dispute_sequence"], 1);
    }

    /// **TT-B118-LIST-NEXT-CURSOR-LAST-ROW-001**：**`has_more`** 时 **`next_cursor`** 等于页内**末行** **`(updated_at, id)`** 之 **`encode_disputes_list_cursor`**。
    #[test]
    fn b118_list_page_next_cursor_matches_last_displayed_row_sort_key() {
        let t0 = DateTime::parse_from_rfc3339("2025-03-01T00:00:00Z")
            .unwrap()
            .with_timezone(&Utc);
        let t1 = DateTime::parse_from_rfc3339("2025-03-02T00:00:00Z")
            .unwrap()
            .with_timezone(&Utc);
        let t2 = DateTime::parse_from_rfc3339("2025-03-03T00:00:00Z")
            .unwrap()
            .with_timezone(&Utc);
        let id0 = Uuid::new_v4();
        let id1 = Uuid::new_v4();
        let id2 = Uuid::new_v4();
        let rows = vec![
            DisputeListJoinRow {
                id: id2,
                order_id: Uuid::new_v4(),
                status: "open".into(),
                resolved_at: None,
                created_at: t0,
                updated_at: t2,
                order_tourist_id: None,
            },
            DisputeListJoinRow {
                id: id1,
                order_id: Uuid::new_v4(),
                status: "open".into(),
                resolved_at: None,
                created_at: t0,
                updated_at: t1,
                order_tourist_id: None,
            },
            DisputeListJoinRow {
                id: id0,
                order_id: Uuid::new_v4(),
                status: "open".into(),
                resolved_at: None,
                created_at: t0,
                updated_at: t0,
                order_tourist_id: None,
            },
        ];
        let page = disputes_public_list_page_from_join_rows(rows, 2);
        assert!(page.has_more);
        let last = page.items.last().expect("two items");
        let last_id = Uuid::parse_str(last["id"].as_str().unwrap()).unwrap();
        let enc = page.next_cursor.as_ref().expect("cursor when has_more");
        let dec = decode_disputes_list_cursor(Some(enc)).unwrap().unwrap();
        assert_eq!(dec.1, last_id);
        assert_eq!(
            dec.0,
            DateTime::parse_from_rfc3339("2025-03-02T00:00:00Z")
                .unwrap()
                .with_timezone(&Utc)
        );
        assert_eq!(*enc, encode_disputes_list_cursor(dec.0, dec.1));
    }

    /// **TT-B118-DETAIL-LIST-OVERLAP-SSOT-001**：同键 **`DisputeDetailJoinRow`** 之 **`dispute`** 与 **`DisputeListJoinRow`** 列表项在重叠字段上**同源**（经 **`dispute_order_party_ids_json`** / **`disputes_public_list_item_from_join_row`**）。
    #[test]
    fn b118_detail_dispute_overlaps_list_item_from_same_join_keys() {
        let tid = Uuid::new_v4();
        let oid = Uuid::new_v4();
        let did = Uuid::new_v4();
        let ca = DateTime::parse_from_rfc3339("2025-01-01T00:00:00Z")
            .unwrap()
            .with_timezone(&Utc);
        let ua = DateTime::parse_from_rfc3339("2025-01-02T00:00:00Z")
            .unwrap()
            .with_timezone(&Utc);
        let detail = DisputeDetailJoinRow {
            id: did,
            order_id: oid,
            status: "Open".into(),
            evidence_hashes: json!([]),
            arbitrator_id: None,
            refund_ratio: None,
            slash_guide: None,
            resolved_at: None,
            created_at: ca,
            updated_at: ua,
            arb_fee_paid: None,
            dispute_sequence: 1,
            order_tourist_id: Some(tid),
        };
        let list_row = DisputeListJoinRow {
            id: detail.id,
            order_id: detail.order_id,
            status: detail.status.clone(),
            resolved_at: detail.resolved_at,
            created_at: detail.created_at,
            updated_at: detail.updated_at,
            order_tourist_id: detail.order_tourist_id,
        };
        let env = dispute_public_detail_envelope_from_join_row(detail);
        let item = disputes_public_list_item_from_join_row(&list_row);
        let d = &env["dispute"];
        for k in ["id", "order_id", "tourist_id", "traveler_id", "status", "resolved_at", "created_at"] {
            assert_eq!(d[k], item[k], "overlap key {}", k);
        }
    }
}
