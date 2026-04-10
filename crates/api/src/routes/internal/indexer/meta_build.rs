use serde_json::json;

/// **110 / 140**：与 **`GET …/internal/indexer-status`** 成功体同源，便于 tick 单段 JSON 与 **`GET /meta.build`** 对齐（CI 锚点 **`INDEXER_TICK_RESPONSE_META_BUILD`**）。
pub(crate) fn attach_meta_build_to_tick_ok_body(body: &mut serde_json::Value) {
    if let Some(obj) = body.as_object_mut() {
        obj.insert(
            "meta".to_string(),
            json!({
                "build": crate::routes::health_meta::meta_build_value()
            }),
        );
    }
}
