//! **B 轨** 准入费计价 · **`fee_schedule_v1`**（SSOT：`docs/spec/artifacts/onboarding-fee-schedule.v1.yaml`）。
//! **禁止** 读取 `steward_stake_bps` / protocol-ssot 质押数值。

use serde::Deserialize;
use serde_json::{json, Value};
use std::collections::HashMap;
use std::sync::OnceLock;

pub const FEE_SCHEDULE_V1: &str = "fee_schedule_v1";
pub const FEE_SCHEDULE_STUB_V0: &str = "stub-v0";

const EMBEDDED_YAML: &str = include_str!(
    "../../../../../docs/spec/artifacts/onboarding-fee-schedule.v1.yaml"
);

#[derive(Debug, Clone)]
pub struct JurisdictionLine {
    pub jurisdiction: String,
    pub tier: String,
    pub line_amount_minor: i64,
    pub line_kind: &'static str,
}

#[derive(Debug, Clone)]
pub struct FeeScheduleQuote {
    pub fee_schedule_version: String,
    pub role: String,
    pub sku: String,
    pub currency: String,
    pub computed_amount_minor: i64,
    pub amount_minor: i64,
    pub refund_policy_version: String,
    pub renewal_policy_version: String,
    pub jurisdiction_breakdown: Vec<JurisdictionLine>,
    pub amount_capped: bool,
    pub local_dev_override: bool,
}

#[derive(Debug)]
pub enum FeeScheduleError {
    InvalidJurisdiction(String),
    JurisdictionsRequired,
    TooManyJurisdictions { max: u32 },
    UnknownRole(String),
    YamlLoad(String),
}

impl FeeScheduleError {
    pub fn error_code(&self) -> &'static str {
        match self {
            FeeScheduleError::InvalidJurisdiction(_) => "invalid_jurisdiction",
            FeeScheduleError::JurisdictionsRequired => "onboarding_jurisdictions_required",
            FeeScheduleError::TooManyJurisdictions { .. } => "onboarding_jurisdictions_cap_exceeded",
            FeeScheduleError::UnknownRole(_) => "invalid_onboarding_role",
            FeeScheduleError::YamlLoad(_) => "fee_schedule_unavailable",
        }
    }
}

#[derive(Debug, Deserialize)]
struct FeeScheduleFile {
    version: String,
    currency_default: String,
    jurisdiction_tier_map: HashMap<String, String>,
    roles: RolesBlock,
    refund: RefundBlock,
    renewal: RenewalBlock,
    local_dev: LocalDevBlock,
}

#[derive(Debug, Deserialize)]
struct RolesBlock {
    provider: RolePricing,
    region_steward: RolePricing,
}

#[derive(Debug, Deserialize)]
struct RolePricing {
    sku_default: String,
    pricing_one_time: PricingOneTime,
    #[serde(default)]
    multi_jurisdiction: Option<MultiJurisdiction>,
    quote_ttl_hours: u32,
}

#[derive(Debug, Deserialize)]
struct PricingOneTime {
    by_tier: HashMap<String, TierPrice>,
}

#[derive(Debug, Deserialize)]
struct TierPrice {
    amount_minor: i64,
    currency: String,
}

#[derive(Debug, Deserialize)]
struct MultiJurisdiction {
    each_additional: EachAdditional,
    cap: MultiCap,
}

#[derive(Debug, Deserialize)]
struct EachAdditional {
    amount_minor_ratio_bps: i64,
}

#[derive(Debug, Deserialize)]
struct MultiCap {
    max_jurisdictions: u32,
    max_total_ratio_bps: i64,
}

#[derive(Debug, Deserialize)]
struct RefundBlock {
    policy_version: String,
}

#[derive(Debug, Deserialize)]
struct RenewalBlock {
    policy_version: String,
}

#[derive(Debug, Deserialize)]
struct LocalDevBlock {
    override_amount_minor: i64,
}

static SCHEDULE: OnceLock<Result<FeeScheduleFile, String>> = OnceLock::new();

fn schedule() -> Result<&'static FeeScheduleFile, FeeScheduleError> {
    let loaded = SCHEDULE.get_or_init(|| {
        serde_yaml::from_str(EMBEDDED_YAML).map_err(|e| format!("parse fee schedule yaml: {e}"))
    });
    match loaded {
        Ok(s) => Ok(s),
        Err(e) => Err(FeeScheduleError::YamlLoad(e.clone())),
    }
}

fn normalize_jurisdiction(raw: &str) -> Option<String> {
    let j = raw.trim().to_uppercase();
    if j.len() == 2 && j.chars().all(|c| c.is_ascii_alphabetic()) {
        Some(j)
    } else {
        None
    }
}

pub fn parse_jurisdictions_csv(raw: Option<&str>) -> Result<Vec<String>, FeeScheduleError> {
    let Some(s) = raw.map(str::trim).filter(|x| !x.is_empty()) else {
        return Ok(Vec::new());
    };    let mut out = Vec::new();
    for part in s.split(',') {
        let j = normalize_jurisdiction(part).ok_or_else(|| {
            FeeScheduleError::InvalidJurisdiction(part.trim().to_string())
        })?;
        if !out.contains(&j) {
            out.push(j);
        }
    }
    Ok(out)
}

fn tier_for_jurisdiction(
    map: &HashMap<String, String>,
    jurisdiction: &str,
) -> Result<String, FeeScheduleError> {
    map.get(jurisdiction)
        .cloned()
        .ok_or_else(|| FeeScheduleError::InvalidJurisdiction(jurisdiction.to_string()))
}

fn tier_base_amount(role_pricing: &RolePricing, tier: &str) -> Result<i64, FeeScheduleError> {
    role_pricing
        .pricing_one_time
        .by_tier
        .get(tier)
        .map(|p| p.amount_minor)
        .ok_or_else(|| FeeScheduleError::YamlLoad(format!("missing tier price for {tier}")))
}

pub fn quote_fee_schedule_v1(
    role: &str,
    sku: Option<&str>,
    jurisdictions: &[String],
    local_dev_override: bool,
) -> Result<FeeScheduleQuote, FeeScheduleError> {
    let sched = schedule()?;
    let role_lc = role.to_ascii_lowercase();
    let (role_pricing, resolved_sku) = match role_lc.as_str() {
        "provider" => (&sched.roles.provider, &sched.roles.provider.sku_default),
        "region_steward" => (
            &sched.roles.region_steward,
            &sched.roles.region_steward.sku_default,
        ),
        other => return Err(FeeScheduleError::UnknownRole(other.to_string())),
    };
    let sku = sku
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .unwrap_or(resolved_sku.as_str())
        .to_string();

    let mut jurisdictions = jurisdictions.to_vec();
    if role_lc == "provider" {
        if jurisdictions.is_empty() {
            jurisdictions.push("US".to_string());
        };        if jurisdictions.len() > 1 {
            jurisdictions.truncate(1);
        }
    } else if jurisdictions.is_empty() {
        return Err(FeeScheduleError::JurisdictionsRequired);
    };    let multi = role_pricing.multi_jurisdiction.as_ref();
    let max_j = multi.map(|m| m.cap.max_jurisdictions).unwrap_or(1);
    if jurisdictions.len() as u32 > max_j {
        return Err(FeeScheduleError::TooManyJurisdictions { max: max_j });
    };    let ratio_bps = multi.map(|m| m.each_additional.amount_minor_ratio_bps).unwrap_or(0);
    let max_total_ratio_bps = multi.map(|m| m.cap.max_total_ratio_bps).unwrap_or(10_000);

    let mut breakdown = Vec::new();
    let mut computed: i64 = 0;
    let mut first_base: i64 = 0;

    for (idx, jid) in jurisdictions.iter().enumerate() {
        let tier = tier_for_jurisdiction(&sched.jurisdiction_tier_map, jid)?;
        let base = tier_base_amount(role_pricing, &tier)?;
        let (line_amount, line_kind) = if idx == 0 {
            first_base = base;
            (base, "first_jurisdiction")
        } else {
            let add = base.saturating_mul(ratio_bps) / 10_000;
            (add, "additional_jurisdiction")
        };
        computed = computed.saturating_add(line_amount);
        breakdown.push(JurisdictionLine {
            jurisdiction: jid.clone(),
            tier,
            line_amount_minor: line_amount,
            line_kind,
        });
    };    let cap_max = first_base.saturating_mul(max_total_ratio_bps) / 10_000;
    let amount_capped = computed > cap_max;
    if amount_capped {
        computed = cap_max;
    };    let computed_amount_minor = computed;
    let amount_minor = if local_dev_override {
        sched.local_dev.override_amount_minor
    } else {
        computed_amount_minor
    };

    Ok(FeeScheduleQuote {
        fee_schedule_version: sched.version.clone(),
        role: role_lc,
        sku,
        currency: sched.currency_default.clone(),
        computed_amount_minor,
        amount_minor,
        refund_policy_version: sched.refund.policy_version.clone(),
        renewal_policy_version: sched.renewal.policy_version.clone(),
        jurisdiction_breakdown: breakdown,
        amount_capped,
        local_dev_override,
    })
}

pub fn quote_to_json(
    q: &FeeScheduleQuote,
    jurisdictions: &[String],
    expires_at_rfc3339: &str,
    implementation_status: &str,
) -> Value {
    let breakdown = jurisdiction_breakdown_json(q);

    json!({
        "status": "ok",
        "role": q.role,
        "sku": q.sku,
        "fee_schedule_version": q.fee_schedule_version,
        "currency": q.currency,
        "computed_amount_minor": q.computed_amount_minor,
        "amount_minor": q.amount_minor,
        "jurisdictions": jurisdictions,
        "expires_at": expires_at_rfc3339,
        "refund_policy_version": q.refund_policy_version,
        "renewal_policy_version": q.renewal_policy_version,
        "jurisdiction_breakdown": breakdown,
        "pricing": {
            "tier_weak_linkage": "label_only",
            "amount_capped": q.amount_capped,
            "local_dev_amount_override": q.local_dev_override,
        },
        "meta": {
            "implementation_status": implementation_status,
            "artifact": "docs/spec/artifacts/onboarding-fee-schedule.v1.yaml",
            "doc": "docs/spec/artifacts/onboarding-fee-schedule.v1.md"
        }
    })
}

fn jurisdiction_breakdown_json(q: &FeeScheduleQuote) -> Vec<Value> {
    q.jurisdiction_breakdown
        .iter()
        .map(|line| {
            json!({
                "jurisdiction": line.jurisdiction,
                "tier": line.tier,
                "line_amount_minor": line.line_amount_minor,
                "line_kind": line.line_kind,
            })
        })
        .collect()
}

/// **`POST …/payment-intents`** 响应与 **`onboarding_entitlements.metadata.fee_schedule`** 写入体（B 轨 · 禁止 protocol-ssot 字段）。
pub fn entitlement_pricing_metadata(q: &FeeScheduleQuote, jurisdictions: &[String]) -> Value {
    json!({
        "fee_schedule": {
            "computed_amount_minor": q.computed_amount_minor,
            "amount_minor": q.amount_minor,
            "currency": q.currency,
            "jurisdictions": jurisdictions,
            "refund_policy_version": q.refund_policy_version,
            "renewal_policy_version": q.renewal_policy_version,
            "local_dev_amount_override": q.local_dev_override,
            "jurisdiction_breakdown": jurisdiction_breakdown_json(q),
        }
    })
}

pub fn pricing_metadata_idempotency_matches(stored: &Value, expected: &Value) -> bool {
    let Some(exp) = expected.get("fee_schedule") else {
        return stored.get("fee_schedule").is_none();
    };    let Some(st) = stored.get("fee_schedule") else {
        return false;
    };    let same_i64 = |key: &str| {
        st.get(key).and_then(|v| v.as_i64()) == exp.get(key).and_then(|v| v.as_i64())
    };
    let same_str = |key: &str| {
        st.get(key).and_then(|v| v.as_str()) == exp.get(key).and_then(|v| v.as_str())
    };
    same_i64("computed_amount_minor")
        && same_i64("amount_minor")
        && same_str("currency")
        && same_str("refund_policy_version")
        && st.get("jurisdictions") == exp.get("jurisdictions")
}

/// **`region_steward`**：body **`jurisdictions`** 优先，否则主理人申请辖区；**`provider`** 可空（计价默认 **US**）。
pub fn resolve_jurisdictions_for_role(
    role: &str,
    body_csv: Option<&str>,
    steward_app_jurisdictions: Option<&[String]>,
) -> Result<Vec<String>, FeeScheduleError> {
    let parsed = parse_jurisdictions_csv(body_csv)?;
    if !parsed.is_empty() {
        return Ok(parsed);
    };    if role == "region_steward" {
        if let Some(j) = steward_app_jurisdictions.filter(|x| !x.is_empty()) {
            return Ok(j.to_vec());
        }
        return Err(FeeScheduleError::JurisdictionsRequired);
    }
    Ok(Vec::new())
}

pub fn payment_intent_pricing_fields(q: &FeeScheduleQuote, jurisdictions: &[String]) -> Value {
    json!({
        "role": q.role,
        "fee_schedule_version": q.fee_schedule_version,
        "sku": q.sku,
        "currency": q.currency,
        "computed_amount_minor": q.computed_amount_minor,
        "amount_minor": q.amount_minor,
        "jurisdictions": jurisdictions,
        "refund_policy_version": q.refund_policy_version,
        "renewal_policy_version": q.renewal_policy_version,
        "jurisdiction_breakdown": jurisdiction_breakdown_json(q),
        "pricing": {
            "tier_weak_linkage": "label_only",
            "amount_capped": q.amount_capped,
            "local_dev_amount_override": q.local_dev_override,
        }
    })
}

/// **B 轨证据闸**：quote / payment-intent / entitlement 对拍字段（**禁止** protocol-ssot 数值）。
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FeeScheduleV1Alignment {
    pub fee_schedule_version: String,
    pub sku: String,
    pub computed_amount_minor: i64,
    pub amount_minor: i64,
    pub refund_policy_version: String,
    pub renewal_policy_version: String,
    pub jurisdictions: Vec<String>,
}

fn jurisdictions_from_json_value(v: &Value) -> Option<Vec<String>> {
    let arr = v.get("jurisdictions")?.as_array()?;
    let mut out: Vec<String> = arr
        .iter()
        .filter_map(|x| x.as_str().map(|s| s.trim().to_uppercase()))
        .filter(|s| !s.is_empty())
        .collect();
    out.sort();
    out.dedup();
    Some(out)
}

fn alignment_from_pricing_object(
    fee_schedule_version: &str,
    v: &Value,
    jurisdictions: Vec<String>,
) -> Option<FeeScheduleV1Alignment> {
    Some(FeeScheduleV1Alignment {
        fee_schedule_version: fee_schedule_version.to_string(),
        sku: v.get("sku")?.as_str()?.to_string(),
        computed_amount_minor: v.get("computed_amount_minor")?.as_i64()?,
        amount_minor: v.get("amount_minor")?.as_i64()?,
        refund_policy_version: v.get("refund_policy_version")?.as_str()?.to_string(),
        renewal_policy_version: v.get("renewal_policy_version")?.as_str()?.to_string(),
        jurisdictions,
    })
}

pub fn alignment_from_quote_response(v: &Value) -> Option<FeeScheduleV1Alignment> {
    let ver = v.get("fee_schedule_version")?.as_str()?;
    let jurisdictions = jurisdictions_from_json_value(v)?;
    alignment_from_pricing_object(ver, v, jurisdictions)
}

pub fn alignment_from_payment_intent_response(v: &Value) -> Option<FeeScheduleV1Alignment> {
    let ver = v.get("fee_schedule_version")?.as_str()?;
    let jurisdictions = jurisdictions_from_json_value(v)?;
    alignment_from_pricing_object(ver, v, jurisdictions)
}

pub fn alignment_from_entitlement_item(v: &Value) -> Option<FeeScheduleV1Alignment> {
    let ver = v.get("fee_schedule_version")?.as_str()?;
    let jurisdictions = jurisdictions_from_json_value(v)?;
    alignment_from_pricing_object(ver, v, jurisdictions)
}

pub fn alignment_from_quote_and_payment_intent_fields(
    q: &FeeScheduleQuote,
    jurisdictions: &[String],
) -> (FeeScheduleV1Alignment, FeeScheduleV1Alignment) {
    let mut j = jurisdictions.to_vec();
    j.sort();
    let snap = FeeScheduleV1Alignment {
        fee_schedule_version: q.fee_schedule_version.clone(),
        sku: q.sku.clone(),
        computed_amount_minor: q.computed_amount_minor,
        amount_minor: q.amount_minor,
        refund_policy_version: q.refund_policy_version.clone(),
        renewal_policy_version: q.renewal_policy_version.clone(),
        jurisdictions: j,
    };
    (snap.clone(), snap)
}

/// quote ↔ payment-intent ↔ entitlement（**pending** 或 **paid**）三方对拍。
pub fn assert_fee_schedule_v1_alignment_triple(
    quote: &Value,
    payment_intent: &Value,
    entitlement: &Value,
) -> Result<(), String> {
    let q = alignment_from_quote_response(quote)
        .ok_or_else(|| "quote response missing fee_schedule_v1 alignment fields".to_string())?;
    let p = alignment_from_payment_intent_response(payment_intent).ok_or_else(|| {
        "payment-intent response missing fee_schedule_v1 alignment fields".to_string()
    })?;
    let e = alignment_from_entitlement_item(entitlement)
        .ok_or_else(|| "entitlement item missing fee_schedule_v1 alignment fields".to_string())?;
    if q != p {
        return Err(format!("quote vs payment-intent mismatch: {q:?} != {p:?}"));
    };    if q != e {
        return Err(format!("quote vs entitlement mismatch: {q:?} != {e:?}"));
    }
    Ok(())
}

pub fn fee_schedule_error_json(err: &FeeScheduleError) -> Value {
    json!({
        "status": "error",
        "error": err.error_code(),
        "message": err.error_code(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn provider_us_tier_s_price() {
        let q = quote_fee_schedule_v1(
            "provider",
            None,
            &parse_jurisdictions_csv(Some("US")).unwrap(),
            false,
        )
        .unwrap();
        assert_eq!(q.computed_amount_minor, 29_900);
        assert_eq!(q.fee_schedule_version, FEE_SCHEDULE_V1);
        assert_eq!(q.refund_policy_version, "fee_schedule_v1_refund_policy");
    }

    #[test]
    fn steward_us_fr_additive() {
        let q = quote_fee_schedule_v1(
            "region_steward",
            None,
            &parse_jurisdictions_csv(Some("US,FR")).unwrap(),
            false,
        )
        .unwrap();
        assert_eq!(q.computed_amount_minor, 67_365);
        assert_eq!(q.jurisdiction_breakdown.len(), 2);
    }

    #[test]
    fn local_dev_zero_charge_keeps_breakdown() {
        let q = quote_fee_schedule_v1(
            "region_steward",
            None,
            &parse_jurisdictions_csv(Some("US,FR")).unwrap(),
            true,
        )
        .unwrap();
        assert_eq!(q.amount_minor, 0);
        assert_eq!(q.computed_amount_minor, 67_365);
        assert!(q.local_dev_override);
    }

    #[test]
    fn steward_requires_jurisdictions() {
        let err = quote_fee_schedule_v1("region_steward", None, &[], false).unwrap_err();
        assert!(matches!(err, FeeScheduleError::JurisdictionsRequired));
    }

    #[test]
    fn quote_and_payment_intent_pricing_fields_align() {
        let jurisdictions = parse_jurisdictions_csv(Some("US")).unwrap();
        let q = quote_fee_schedule_v1("provider", None, &jurisdictions, false).unwrap();
        let quote_json = quote_to_json(
            &q,
            &jurisdictions,
            "2099-01-01T00:00:00+00:00",
            "onboarding_quote_fee_schedule_v1",
        );
        let pi_json = payment_intent_pricing_fields(&q, &jurisdictions);
        let qa = alignment_from_quote_response(&quote_json).expect("quote alignment");
        let pa = alignment_from_payment_intent_response(&pi_json).expect("pi alignment");
        assert_eq!(qa, pa);
    }

    #[test]
    fn local_dev_alignment_zero_amount_keeps_computed() {
        let jurisdictions = parse_jurisdictions_csv(Some("US,FR")).unwrap();
        let q = quote_fee_schedule_v1("region_steward", None, &jurisdictions, true).unwrap();
        let quote_json = quote_to_json(
            &q,
            &jurisdictions,
            "2099-01-01T00:00:00+00:00",
            "onboarding_quote_fee_schedule_v1_local_dev_override",
        );
        let pi_json = payment_intent_pricing_fields(&q, &jurisdictions);
        let qa = alignment_from_quote_response(&quote_json).unwrap();
        let pa = alignment_from_payment_intent_response(&pi_json).unwrap();
        assert_eq!(qa.amount_minor, 0);
        assert_eq!(qa.computed_amount_minor, 67_365);
        assert_eq!(qa, pa);
    }
}
