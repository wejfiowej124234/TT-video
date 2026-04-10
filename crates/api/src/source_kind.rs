//! **SourceKind**：`cross-check` 等聚合响应中 **槽位语义** 与 **子体根级 `data_source`** 的 **机读约束**（防 **projection 冒充 chain** 等混用）。

use serde_json::Value;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum SourceKind {
    /// 链上主读 / 治理池泳道（**非** 文档镜像、**非** FeeRouter Σ 投影根级口径）
    ChainSSOT,
    /// 投影 Σ / 占位聚合（**B-084** 等）
    Projection,
    /// **84** 文档镜像（根级 **无** `data_source`）
    Reference,
}

impl SourceKind {
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            SourceKind::ChainSSOT => "chain_ssot",
            SourceKind::Projection => "projection",
            SourceKind::Reference => "reference",
        }
    }
}

/// 校验 **子响应 JSON 根** 与槽位 **`SourceKind`** 一致；**不**改业务 handler，仅在聚合边界 **fail-closed**。
pub fn validate_body_matches_source_kind(
    kind: SourceKind,
    body: &Value,
    slot_label: &'static str,
) -> Result<(), String> {
    let Some(obj) = body.as_object() else {
        return Err(format!("{slot_label}: body is not a JSON object"));
    };
    let ds = obj.get("data_source").and_then(|v| v.as_str());

    match kind {
        SourceKind::Projection => match ds {
            Some("projection" | "placeholder") => Ok(()),
            Some(other) => Err(format!(
                "{slot_label}: envelope source_kind={} incompatible with data_source={other}",
                SourceKind::Projection.as_str()
            )),
            None => Err(format!(
                "{slot_label}: projection lane requires root data_source"
            )),
        },
        SourceKind::ChainSSOT => match ds {
            Some("chain_read" | "database" | "database_empty" | "placeholder") => Ok(()),
            Some(other) => Err(format!(
                "{slot_label}: envelope source_kind={} incompatible with data_source={other}",
                SourceKind::ChainSSOT.as_str()
            )),
            None => Err(format!(
                "{slot_label}: chain_ssot lane requires root data_source"
            )),
        },
        SourceKind::Reference => {
            if ds.is_some() {
                return Err(format!(
                    "{slot_label}: reference mirror must omit root data_source (found {ds:?})"
                ));
            }
            if obj.get("doc_ref").and_then(|v| v.as_str()).is_none()
                || obj.get("doc_version").and_then(|v| v.as_str()).is_none()
            {
                return Err(format!(
                    "{slot_label}: reference mirror requires doc_ref and doc_version"
                ));
            }
            Ok(())
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn projection_accepts_placeholder_and_projection() {
        validate_body_matches_source_kind(
            SourceKind::Projection,
            &json!({"status":"ok","data_source":"placeholder"}),
            "t",
        )
        .unwrap();
        validate_body_matches_source_kind(
            SourceKind::Projection,
            &json!({"status":"ok","data_source":"projection","rule_version":"fee_pool_aggregates_projection_v1"}),
            "t",
        )
        .unwrap();
    }

    #[test]
    fn projection_rejects_chain_read() {
        let e = validate_body_matches_source_kind(
            SourceKind::Projection,
            &json!({"status":"ok","data_source":"chain_read"}),
            "fee_pool_projection.body",
        )
        .unwrap_err();
        assert!(e.contains("incompatible"));
    }

    #[test]
    fn chain_lane_rejects_projection_data_source() {
        let e = validate_body_matches_source_kind(
            SourceKind::ChainSSOT,
            &json!({"status":"ok","data_source":"projection"}),
            "governance_pool_chain.body",
        )
        .unwrap_err();
        assert!(e.contains("incompatible"));
    }

    #[test]
    fn chain_lane_accepts_chain_read_and_placeholder() {
        validate_body_matches_source_kind(
            SourceKind::ChainSSOT,
            &json!({"status":"ok","data_source":"chain_read"}),
            "t",
        )
        .unwrap();
        validate_body_matches_source_kind(
            SourceKind::ChainSSOT,
            &json!({"status":"ok","data_source":"placeholder"}),
            "t",
        )
        .unwrap();
    }

    #[test]
    fn reference_requires_doc_fields_and_no_data_source() {
        validate_body_matches_source_kind(
            SourceKind::Reference,
            &json!({
                "status":"ok",
                "doc_ref": "docs/spec/84.md",
                "doc_version": "1.0.0"
            }),
            "t",
        )
        .unwrap();
        assert!(validate_body_matches_source_kind(
            SourceKind::Reference,
            &json!({
                "status":"ok",
                "data_source":"projection",
                "doc_ref": "x",
                "doc_version": "1"
            }),
            "t",
        )
        .is_err());
    }
}
