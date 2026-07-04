//! 公众 catalog 读面过滤（① 本地 · 企业级测试/真实数据分离）。
//!
//! 环境变量（任一开启即过滤；**推荐** `TRAVELTRUST_PUBLIC_CATALOG_SURFACE=1`）：
//! - `TRAVELTRUST_PUBLIC_CATALOG_SURFACE=1` / `TRAVELTRUST_MARKET_PUBLIC_SURFACE=1`
//! - 未设且 **`P3_CHAIN_OFF=1`** → 默认开启
//! - 未设且 **`SEED_TEST_ACCOUNTS=1`**（或开发态空 `CORS_ORIGINS`）→ `main` 启动时默认 `=1`
//! - `=0` → 关闭（烟测 / Admin 直查 DB 不受影响）
//!
//! **本地手测例外**：`TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET=1`（一键脚本默认）或
//! `TRAVELTRUST_MANUAL_ACCEPTANCE=1` 或 **未显式关闭且 `SEED_TEST_ACCOUNTS=1` + 公众 catalog 过滤已开**
//! → **`guide@test.com`** 仍可在 **`GET /guides`** / 自由市场「向导」列表出现；
//! `TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET=0` 显式关闭。
//! **`multi-demo@test.com`**：`TRAVELTRUST_SEED_MULTI_DEMO_PUBLIC_MARKET=1`（默认随 guide 手测栈开启）同理。
//!
//! 消费方：`GET /discover/orders` · `GET /guides` · `GET /guides/:id` ·
//! `GET /market/{provider|acquisition}/listings` · DID 副榜 providers/acquisitions 等。

const SEED_GUIDE_PUBLIC_MARKET_EMAIL: &str = "guide@test.com";
const SEED_MULTI_DEMO_PUBLIC_MARKET_EMAIL: &str = "multi-demo@test.com";

use serde_json::Value;

use super::itineraries::ItineraryBundle;
use super::{ChainOffStore, GuideRow, OrderRow};

fn env_flag_on(name: &str) -> Option<bool> {
    match std::env::var(name).ok().as_deref().map(str::trim) {
        Some("0") | Some("false") | Some("FALSE") => Some(false),
        Some("1") | Some("true") | Some("TRUE") => Some(true),
        _ => None,
    }
}

/// 是否对公众 catalog 读面应用 dev/smoke 过滤。
pub fn public_catalog_surface_filter_enabled() -> bool {
    if let Some(v) = env_flag_on("TRAVELTRUST_PUBLIC_CATALOG_SURFACE") {
        return v;
    }
    if let Some(v) = env_flag_on("TRAVELTRUST_MARKET_PUBLIC_SURFACE") {
        return v;
    }
    if std::env::var("P3_CHAIN_OFF").as_deref() == Ok("1") {
        return true;
    }
    std::env::var("SEED_TEST_ACCOUNTS").as_deref() == Ok("1")
}

/// 与 [`public_catalog_surface_filter_enabled`] 同源（历史别名）。
pub fn market_public_surface_filter_enabled() -> bool {
    public_catalog_surface_filter_enabled()
}

/// 本地手测：`guide@test.com` 出现在自由市场向导列表（正常客户选向导 UI）。
/// **Staging / Production 默认关闭** — 须显式 `TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET=1` 或 `TRAVELTRUST_MANUAL_ACCEPTANCE=1`。
/// OCS 基线 CLOSED 后公众 catalog 仅展示官方冷启动 10 城向导，C3 不得隐式曝光。
pub fn seed_guide_public_market_enabled() -> bool {
    crate::runtime_identity::RuntimeIdentity::current().allows_seed_guide_public_market()
}

fn is_seed_guide_public_market_walkthrough(g: &GuideRow, store: &ChainOffStore) -> bool {
    if !seed_guide_public_market_enabled() {
        return false;
    }
    store.users.get(&g.user_id).is_some_and(|u| {
        u.email
            .trim()
            .eq_ignore_ascii_case(SEED_GUIDE_PUBLIC_MARKET_EMAIL)
    })
}

/// 本地手测：`multi-demo@test.com` 向导挂牌可在市场曝光 / `GET /guides` 出现。
/// **Staging / Production 默认关闭** — 须显式 `TRAVELTRUST_SEED_MULTI_DEMO_PUBLIC_MARKET=1` 或 `TRAVELTRUST_MANUAL_ACCEPTANCE=1`。
pub fn seed_multi_demo_public_market_enabled() -> bool {
    crate::runtime_identity::RuntimeIdentity::current().allows_seed_multi_demo_public_market()
}

fn is_seed_multi_demo_public_market_walkthrough(g: &GuideRow, store: &ChainOffStore) -> bool {
    if !seed_multi_demo_public_market_enabled() {
        return false;
    }
    store.users.get(&g.user_id).is_some_and(|u| {
        u.email
            .trim()
            .eq_ignore_ascii_case(SEED_MULTI_DEMO_PUBLIC_MARKET_EMAIL)
    })
}

/// 烟测 / 演示 / 种子账号邮箱（仍留 DB，不进入公众 catalog）。
pub fn is_dev_catalog_email(email: &str) -> bool {
    let e = email.trim().to_lowercase();
    if e.is_empty() {
        return false;
    }
    if e.ends_with("@traveltrust.test") {
        return true;
    }
    matches!(
        e.as_str(),
        "tourist@test.com"
            | "guide@test.com"
            | "multi-demo@test.com"
            | "provider-did-rank-demo@test.com"
            | "steward-did-rank-demo@test.com"
    )
}

fn payload_text_is_smoke_market_listing(payload: &Value) -> bool {
    let Some(obj) = payload.as_object() else {
        return false;
    };
    let mut parts: Vec<String> = Vec::new();
    for key in ["title", "description", "summary", "subtitle"] {
        if let Some(s) = obj.get(key).and_then(|v| v.as_str()) {
            let t = s.trim();
            if !t.is_empty() {
                parts.push(t.to_lowercase());
            }
        }
    }
    let combined = parts.join(" ");
    if combined.is_empty() {
        return false;
    }
    combined.contains("multi-demo")
        || combined.contains("l3 closure")
        || combined.contains("probe")
        || combined.contains("did rank demo")
        || combined.contains("smoke")
        || combined.starts_with("demo ")
        || combined.contains("演示")
        || combined.contains("联调")
}

/// 内置/烟测 `market_listings.payload` 标题等（DID rank demo、smoke 等）。
pub fn is_dev_market_listing_payload(payload: &Value) -> bool {
    payload_text_is_smoke_market_listing(payload)
}

pub fn is_dev_market_listing(owner_email: &str, payload: &Value) -> bool {
    is_dev_catalog_email(owner_email) || is_dev_market_listing_payload(payload)
}

/// 写入 **`market_listings.data_origin`** 时的分类（企业级 · 与公众读面过滤同源）。
pub fn infer_market_listing_data_origin(owner_email: &str, payload: &Value) -> &'static str {
    if is_dev_catalog_email(owner_email) {
        if owner_email.contains("did-rank-demo") {
            return "demo";
        }
        return "test";
    }
    if is_dev_market_listing_payload(payload) {
        return "demo";
    }
    "production"
}

/// 用户实体（orders / guides owner）写入 **`data_origin`** 时的分类。
pub fn infer_entity_data_origin_from_email(email: &str) -> &'static str {
    infer_market_listing_data_origin(email, &Value::Null)
}

pub fn is_non_production_data_origin(origin: &str) -> bool {
    origin != "production"
}

/// 订单写入 **`data_origin`**：烟测账号 + 行程 **`smoke save`** 占位。
pub fn infer_order_data_origin(tourist_email: &str, bundle: &ItineraryBundle) -> String {
    let base = infer_entity_data_origin_from_email(tourist_email);
    if base != "production" {
        return base.to_string();
    }
    if is_dev_discover_landing_itinerary(bundle) {
        return "test".into();
    }
    for day in &bundle.days {
        if day_text_is_smoke_placeholder(&day.content_text) {
            return "test".into();
        }
        if day
            .description
            .as_deref()
            .map(day_text_is_smoke_placeholder)
            .unwrap_or(false)
        {
            return "test".into();
        }
    }
    "production".into()
}

/// 公众 catalog 是否应隐藏该行（**`data_origin`** + 邮箱/标题启发式双闸）。
pub fn is_non_production_market_listing(
    data_origin: &str,
    owner_email: &str,
    payload: &Value,
) -> bool {
    if data_origin != "production" {
        return true;
    }
    is_dev_market_listing(owner_email, payload)
}
/// 种子 / 烟测向导 bio（`data_origin` 误写为 production 时的兜底）。
pub fn is_dev_guide_bio(bio: Option<&str>) -> bool {
    let Some(b) = bio.map(str::trim).filter(|s| !s.is_empty()) else {
        return false;
    };
    let b = b.to_lowercase();
    b.contains("测试向导") || b.contains("用于联调") || b.contains("test guide")
}

/// 公众 catalog 排序：featured DESC · display_priority DESC · 时间 DESC · id DESC
pub fn cmp_public_display_sort<T: Ord>(
    featured_a: bool,
    priority_a: i32,
    ts_a: T,
    id_a: uuid::Uuid,
    featured_b: bool,
    priority_b: i32,
    ts_b: T,
    id_b: uuid::Uuid,
) -> std::cmp::Ordering {
    featured_b
        .cmp(&featured_a)
        .then(priority_b.cmp(&priority_a))
        .then(ts_b.cmp(&ts_a))
        .then(id_b.cmp(&id_a))
}

/// 公众 catalog 列表：同一 `user_id` 仅保留 `updated_at` 最新的一条 active 向导。
pub fn dedupe_guides_latest_per_user<'a>(
    guides: impl IntoIterator<Item = &'a GuideRow>,
) -> Vec<&'a GuideRow> {
    use std::collections::HashMap;
    use uuid::Uuid;

    let mut by_user: HashMap<Uuid, &GuideRow> = HashMap::new();
    for g in guides {
        match by_user.get(&g.user_id) {
            Some(existing) if existing.updated_at >= g.updated_at => {}
            _ => {
                by_user.insert(g.user_id, g);
            }
        }
    }
    by_user.into_values().collect()
}

/// PD-009 / 占位向导：`city=Global` 不属于旅行预约可预约向导（`country_code` 可为历史脏数据）。
pub fn is_placeholder_global_guide(g: &GuideRow) -> bool {
    g.city.trim().eq_ignore_ascii_case("global")
}

/// PD-009 履约专用向导：仅 `acquisition_fulfillment` 或 auto-provisioned bio，不属于旅行预约可预约向导。
pub fn is_internal_guide_for_travel_booking(g: &GuideRow) -> bool {
    if is_placeholder_global_guide(g) {
        return true;
    }
    let types: Vec<String> = g
        .service_types
        .iter()
        .map(|s| s.trim().to_lowercase())
        .filter(|s| !s.is_empty())
        .collect();
    let only_acquisition = !types.is_empty()
        && types
            .iter()
            .all(|s| s == "acquisition_fulfillment");
    if only_acquisition {
        return true;
    }
    if let Some(bio) = g.bio.as_deref().map(str::trim).filter(|s| !s.is_empty()) {
        let bio_low = bio.to_lowercase();
        if bio_low.contains("pd-009 acquisition fulfillment")
            || bio_low.contains("auto-provisioned")
        {
            return true;
        }
    }
    false
}

/// DDG / OCIP / SOPCP filters for guides already passing PCP Governance (Governed View).
pub fn should_hide_guide_ddg_from_public_catalog(g: &GuideRow, store: &ChainOffStore) -> bool {
    if is_seed_guide_public_market_walkthrough(g, store)
        || is_seed_multi_demo_public_market_walkthrough(g, store)
    {
        return false;
    }
    if is_placeholder_global_guide(g) {
        return true;
    }
    if is_non_production_data_origin(&g.data_origin) {
        return true;
    }
    if is_internal_guide_for_travel_booking(g) {
        return true;
    }
    if is_dev_guide_bio(g.bio.as_deref()) {
        return true;
    }
    if let Some(u) = store.users.get(&g.user_id) {
        if is_dev_catalog_email(&u.email) {
            return true;
        }
    }
    if public_catalog_surface_filter_enabled()
        && !crate::db::entity_visible_by_display_origin_policy(
            &g.display_origin,
            &store.public_ops_policy,
        )
    {
        return true;
    }
    false
}

/// 向导是否应从公众 catalog（列表 + 详情）隐藏。
pub fn should_hide_guide_from_public_catalog(g: &GuideRow, store: &ChainOffStore) -> bool {
    if is_seed_guide_public_market_walkthrough(g, store)
        || is_seed_multi_demo_public_market_walkthrough(g, store)
    {
        return false;
    }
    if g.display_status != "published" {
        return true;
    }
    if public_catalog_surface_filter_enabled()
        && !crate::db::entity_visible_on_public_surface(&g.display_surfaces, "market_feed")
    {
        return true;
    }
    if public_catalog_surface_filter_enabled()
        && !crate::db::entity_visible_in_public_schedule(
            g.display_start_at,
            g.display_end_at,
            chrono::Utc::now(),
        )
    {
        return true;
    }
    should_hide_guide_ddg_from_public_catalog(g, store)
}

fn day_text_is_smoke_placeholder(text: &str) -> bool {
    let t = text.trim().to_lowercase();
    t == "smoke save" || t.starts_with("smoke save ") || t.contains("smoke save")
}

/// 首页 mock 行程 / landing E2E 写入的北京模板（`generate_itinerary_mock` 同形）。
fn day_text_is_landing_mock_itinerary(text: &str) -> bool {
    let t = text.trim();
    if !t.contains('天') {
        return false;
    }
    t.contains("当地交通")
        && t.contains("当地特色")
        && (t.contains("酒店") || t.contains("住宿"))
}

/// 首页 / landing 联调写入的 discover 订单（误标 production 时的兜底）。
pub fn is_dev_discover_landing_itinerary(bundle: &ItineraryBundle) -> bool {
    if bundle.destination.trim() != "中国" || bundle.city.trim() != "北京" {
        return false;
    }
    if bundle.days.is_empty() {
        return false;
    }
    bundle
        .days
        .iter()
        .any(|d| day_text_is_landing_mock_itinerary(&d.content_text))
}

/// 烟测 / 自动化注册账号写入的 discover 订单（仍留 DB，不进入公众读面）。
pub fn is_smoke_discover_order(
    store: &ChainOffStore,
    o: &OrderRow,
    bundle: &ItineraryBundle,
) -> bool {
    if o.display_status != "published" {
        return true;
    }
    if public_catalog_surface_filter_enabled()
        && !crate::db::entity_visible_on_public_surface(&o.display_surfaces, "market_feed")
    {
        return true;
    }
    if public_catalog_surface_filter_enabled()
        && !crate::db::entity_visible_in_public_schedule(
            o.display_start_at,
            o.display_end_at,
            chrono::Utc::now(),
        )
    {
        return true;
    }
    if public_catalog_surface_filter_enabled()
        && !crate::db::entity_visible_by_display_origin_policy(&o.display_origin, &store.public_ops_policy)
    {
        return true;
    }
    if is_non_production_data_origin(&o.data_origin) {
        return true;
    }
    if let Some(user) = store.users.get(&o.tourist_id) {
        if is_dev_catalog_email(&user.email) {
            return true;
        }
    }
    if is_dev_discover_landing_itinerary(bundle) {
        return true;
    }
    for day in &bundle.days {
        if day_text_is_smoke_placeholder(&day.content_text) {
            return true;
        }
        if day
            .description
            .as_deref()
            .map(day_text_is_smoke_placeholder)
            .unwrap_or(false)
        {
            return true;
        }
    }
    false
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use serde_json::json;
    use traveltrust_core::OrderState;
    use uuid::Uuid;

    use super::super::itineraries::{AmountBreakdown, ItineraryBundle, ItineraryDayRow};
    use super::super::UserRow;

    fn guide_with_types(types: &[&str]) -> GuideRow {
        let now = Utc::now();
        GuideRow {
            id: Uuid::new_v4(),
            user_id: Uuid::new_v4(),
            city: "Global".into(),
            country_code: "XX".into(),
            languages: vec!["en".into()],
            service_types: types.iter().map(|s| (*s).into()).collect(),
            bio: None,
            wallet_address: None,
            real_name: None,
            passport_number_hash: None,
            id_photo_url: None,
            language_cert_url: None,
            guide_license_url: None,
            stake_amount: "0".into(),
            hourly_rate: None,
            avatar_url: None,
            public_title: None,
            status: "active".into(),
            rejection_codes: vec![],
            rejection_message: None,
            data_origin: "production".into(),
            created_at: now,
            updated_at: now,
        }
    }

    #[test]
    fn dev_catalog_email_and_listing_payload() {
        assert!(is_dev_catalog_email("landing-smoke-1@traveltrust.test"));
        assert!(is_dev_catalog_email("guide@test.com"));
        assert!(is_dev_catalog_email("multi-demo@test.com"));
        assert!(!is_dev_catalog_email("merchant@test.com"));
        assert!(!is_dev_catalog_email("real.user@example.com"));
        assert!(is_dev_market_listing_payload(&json!({"title": "DID Rank Demo Shop"})));
        assert!(is_dev_market_listing_payload(&json!({"title": "Multi-demo acq 1781486914"})));
        assert!(is_dev_market_listing_payload(&json!({"title": "probe 1781408670"})));
        assert!(is_dev_market_listing_payload(&json!({"title": "TEST probe acquisition entitlement"})));
        assert!(is_dev_market_listing_payload(
            &json!({"title": "Shop", "description": "L3 closure"})
        ));
        assert!(!is_dev_market_listing_payload(&json!({"title": "Kyoto Tea House Tour"})));
    }

    #[test]
    fn infer_market_listing_data_origin_classifies() {
        assert_eq!(
            infer_market_listing_data_origin(
                "provider-did-rank-demo@test.com",
                &json!({"title": "Shop"})
            ),
            "demo"
        );
        assert_eq!(
            infer_market_listing_data_origin(
                "mkt-it@traveltrust.test",
                &json!({"title": "Real title"})
            ),
            "test"
        );
        assert_eq!(
            infer_market_listing_data_origin(
                "merchant@example.com",
                &json!({"title": "DID rank demo shop"})
            ),
            "demo"
        );
        assert_eq!(
            infer_market_listing_data_origin(
                "merchant@example.com",
                &json!({"title": "Kyoto Tea House"})
            ),
            "production"
        );
        assert_eq!(
            infer_market_listing_data_origin(
                "multi-demo@test.com",
                &json!({"title": "Kyoto Tea House"})
            ),
            "test"
        );
        assert_eq!(
            infer_market_listing_data_origin(
                "merchant@test.com",
                &json!({"title": "Multi-demo shop 1782831275"})
            ),
            "demo"
        );
    }

    #[test]
    fn is_non_production_market_listing_respects_data_origin() {
        assert!(is_non_production_market_listing(
            "test",
            "real@example.com",
            &json!({"title": "Ok"})
        ));
        assert!(!is_non_production_market_listing(
            "production",
            "real@example.com",
            &json!({"title": "Ok"})
        ));
        assert!(is_non_production_market_listing(
            "production",
            "multi-demo@test.com",
            &json!({"title": "Kyoto Tea House"})
        ));
        assert!(is_non_production_market_listing(
            "production",
            "merchant@test.com",
            &json!({"title": "Multi-demo shop 1782831275"})
        ));
    }

    #[test]
    fn dev_guide_bio_heuristic() {
        assert!(is_dev_guide_bio(Some("测试向导账号，用于联调")));
        assert!(is_dev_guide_bio(Some("Local test guide profile")));
        assert!(!is_dev_guide_bio(Some("Kyoto cultural walking tours")));
        assert!(!is_dev_guide_bio(None));
    }

    #[test]
    fn dedupe_guides_latest_per_user_keeps_newest() {
        let now = Utc::now();
        let uid = Uuid::new_v4();
        let older = GuideRow {
            id: Uuid::new_v4(),
            user_id: uid,
            updated_at: now - chrono::Duration::hours(2),
            ..guide_with_types(&["walking"])
        };
        let newer = GuideRow {
            id: Uuid::new_v4(),
            user_id: uid,
            updated_at: now,
            ..guide_with_types(&["walking"])
        };
        let deduped = dedupe_guides_latest_per_user([&older, &newer]);
        assert_eq!(deduped.len(), 1);
        assert_eq!(deduped[0].id, newer.id);
    }

    fn with_seed_guide_public_market_env<F: FnOnce()>(flag: Option<&str>, f: F) {
        let _env = crate::test_env_serial::lock();
        let saved_market = std::env::var("TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET").ok();
        let saved_acceptance = std::env::var("TRAVELTRUST_MANUAL_ACCEPTANCE").ok();
        match flag {
            Some(v) => std::env::set_var("TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET", v),
            None => std::env::remove_var("TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET"),
        }
        std::env::remove_var("TRAVELTRUST_MANUAL_ACCEPTANCE");
        f();
        match saved_market {
            Some(v) => std::env::set_var("TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET", v),
            None => std::env::remove_var("TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET"),
        }
        match saved_acceptance {
            Some(v) => std::env::set_var("TRAVELTRUST_MANUAL_ACCEPTANCE", v),
            None => std::env::remove_var("TRAVELTRUST_MANUAL_ACCEPTANCE"),
        }
    }

    #[test]
    fn should_show_seed_guide_when_seed_test_accounts_default() {
        let _env = crate::test_env_serial::lock();
        let saved_market = std::env::var("TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET").ok();
        let saved_acceptance = std::env::var("TRAVELTRUST_MANUAL_ACCEPTANCE").ok();
        let saved_seed = std::env::var("SEED_TEST_ACCOUNTS").ok();
        let saved_p3 = std::env::var("P3_CHAIN_OFF").ok();
        let saved_profile = std::env::var("TRAVELTRUST_DEPLOYMENT_PROFILE").ok();
        std::env::remove_var("TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET");
        std::env::remove_var("TRAVELTRUST_MANUAL_ACCEPTANCE");
        std::env::set_var("SEED_TEST_ACCOUNTS", "1");
        std::env::set_var("P3_CHAIN_OFF", "1");
        std::env::set_var("TRAVELTRUST_DEPLOYMENT_PROFILE", "local");

        assert!(seed_guide_public_market_enabled());

        let mut store = ChainOffStore::default();
        let uid = Uuid::new_v4();
        store.users.insert(
            uid,
            UserRow {
                id: uid,
                email: "guide@test.com".into(),
                password_hash: None,
                role: "guide".into(),
                kyc_status: "none".into(),
                nickname: None,
                avatar_url: None,
                default_wallet_address: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            },
        );
        let mut g = guide_with_types(&["walking", "culture"]);
        g.user_id = uid;
        g.city = "杭州".into();
        g.data_origin = "test".into();
        g.bio = Some("测试向导账号，用于联调".into());
        assert!(!should_hide_guide_from_public_catalog(&g, &store));

        match saved_market {
            Some(v) => std::env::set_var("TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET", v),
            None => std::env::remove_var("TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET"),
        }
        match saved_acceptance {
            Some(v) => std::env::set_var("TRAVELTRUST_MANUAL_ACCEPTANCE", v),
            None => std::env::remove_var("TRAVELTRUST_MANUAL_ACCEPTANCE"),
        }
        match saved_seed {
            Some(v) => std::env::set_var("SEED_TEST_ACCOUNTS", v),
            None => std::env::remove_var("SEED_TEST_ACCOUNTS"),
        }
        match saved_p3 {
            Some(v) => std::env::set_var("P3_CHAIN_OFF", v),
            None => std::env::remove_var("P3_CHAIN_OFF"),
        }
        match saved_profile {
            Some(v) => std::env::set_var("TRAVELTRUST_DEPLOYMENT_PROFILE", v),
            None => std::env::remove_var("TRAVELTRUST_DEPLOYMENT_PROFILE"),
        }
    }

    #[test]
    fn should_hide_seed_guide_on_staging_profile_without_explicit_flag() {
        let _env = crate::test_env_serial::lock();
        let saved_market = std::env::var("TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET").ok();
        let saved_seed = std::env::var("SEED_TEST_ACCOUNTS").ok();
        let saved_p3 = std::env::var("P3_CHAIN_OFF").ok();
        let saved_profile = std::env::var("TRAVELTRUST_DEPLOYMENT_PROFILE").ok();
        std::env::remove_var("TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET");
        std::env::set_var("SEED_TEST_ACCOUNTS", "1");
        std::env::set_var("P3_CHAIN_OFF", "1");
        std::env::set_var("TRAVELTRUST_DEPLOYMENT_PROFILE", "staging");
        assert!(!seed_guide_public_market_enabled());
        match saved_market {
            Some(v) => std::env::set_var("TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET", v),
            None => std::env::remove_var("TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET"),
        }
        match saved_seed {
            Some(v) => std::env::set_var("SEED_TEST_ACCOUNTS", v),
            None => std::env::remove_var("SEED_TEST_ACCOUNTS"),
        }
        match saved_p3 {
            Some(v) => std::env::set_var("P3_CHAIN_OFF", v),
            None => std::env::remove_var("P3_CHAIN_OFF"),
        }
        match saved_profile {
            Some(v) => std::env::set_var("TRAVELTRUST_DEPLOYMENT_PROFILE", v),
            None => std::env::remove_var("TRAVELTRUST_DEPLOYMENT_PROFILE"),
        }
    }

    #[test]
    fn should_hide_seed_guide_when_explicit_public_market_off() {
        let _env = crate::test_env_serial::lock();
        let saved_market = std::env::var("TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET").ok();
        let saved_seed = std::env::var("SEED_TEST_ACCOUNTS").ok();
        std::env::set_var("TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET", "0");
        std::env::set_var("SEED_TEST_ACCOUNTS", "1");
        assert!(!seed_guide_public_market_enabled());
        match saved_market {
            Some(v) => std::env::set_var("TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET", v),
            None => std::env::remove_var("TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET"),
        }
        match saved_seed {
            Some(v) => std::env::set_var("SEED_TEST_ACCOUNTS", v),
            None => std::env::remove_var("SEED_TEST_ACCOUNTS"),
        }
    }

    #[test]
    fn should_hide_guide_dev_email() {
        with_seed_guide_public_market_env(Some("0"), || {
            let mut store = ChainOffStore::default();
            let uid = Uuid::new_v4();
            store.users.insert(
                uid,
                UserRow {
                    id: uid,
                    email: "guide@test.com".into(),
                    password_hash: None,
                    role: "guide".into(),
                    kyc_status: "none".into(),
                    nickname: None,
                    avatar_url: None,
                    default_wallet_address: None,
                    created_at: Utc::now(),
                    updated_at: Utc::now(),
                },
            );
            let mut g = guide_with_types(&["walking"]);
            g.user_id = uid;
            assert!(should_hide_guide_from_public_catalog(&g, &store));
        });
    }

    #[test]
    fn should_show_seed_guide_when_public_market_flag() {
        with_seed_guide_public_market_env(Some("1"), || {
            let mut store = ChainOffStore::default();
            let uid = Uuid::new_v4();
            store.users.insert(
                uid,
                UserRow {
                    id: uid,
                    email: "guide@test.com".into(),
                    password_hash: None,
                    role: "guide".into(),
                    kyc_status: "none".into(),
                    nickname: None,
                    avatar_url: None,
                    default_wallet_address: None,
                    created_at: Utc::now(),
                    updated_at: Utc::now(),
                },
            );
            let mut g = guide_with_types(&["walking", "culture"]);
            g.user_id = uid;
            g.city = "杭州".into();
            g.data_origin = "test".into();
            g.bio = Some("测试向导账号，用于联调".into());
            assert!(!should_hide_guide_from_public_catalog(&g, &store));
        });
    }

    #[test]
    fn placeholder_global_city_hides_even_wrong_country() {
        let mut g = guide_with_types(&["walking", "culture"]);
        g.city = "Global".into();
        g.country_code = "CN".into();
        g.data_origin = "production".into();
        assert!(is_placeholder_global_guide(&g));
        assert!(should_hide_guide_from_public_catalog(&g, &ChainOffStore::default()));
    }

    #[test]
    fn internal_guide_only_acquisition_fulfillment() {
        assert!(is_internal_guide_for_travel_booking(&guide_with_types(&[
            "acquisition_fulfillment"
        ])));
        assert!(is_internal_guide_for_travel_booking(&guide_with_types(&["walking"])));
        let mut beijing = guide_with_types(&["walking", "culture"]);
        beijing.city = "北京".into();
        beijing.country_code = "CN".into();
        assert!(!is_internal_guide_for_travel_booking(&beijing));
        let mut mixed = guide_with_types(&["acquisition_fulfillment", "walking"]);
        mixed.city = "上海".into();
        mixed.country_code = "CN".into();
        assert!(!is_internal_guide_for_travel_booking(&mixed));
    }

    #[test]
    fn landing_mock_itinerary_heuristic() {
        let bundle = ItineraryBundle {
            order_id: Uuid::new_v4(),
            version: 1,
            destination: "中国".into(),
            city: "北京".into(),
            days: vec![ItineraryDayRow {
                day_index: 1,
                content_text: "中国 第1天：北京；酒店标准，交通当地交通，餐饮当地特色。".into(),
                ..Default::default()
            }],
            amount_breakdown: AmountBreakdown {
                hotel: 0.,
                catering: 0.,
                tickets: 0.,
                guide_fee: 0.,
                vehicle: 0.,
                platform_fee: 0.,
                total_budget: 0.,
            },
            snapshot_hash: None,
            cover_image: None,
        };
        assert!(is_dev_discover_landing_itinerary(&bundle));
        assert_eq!(
            infer_order_data_origin("real@example.com", &bundle),
            "test"
        );
        let mut kyoto = bundle.clone();
        kyoto.destination = "日本".into();
        kyoto.city = "京都".into();
        assert!(!is_dev_discover_landing_itinerary(&kyoto));
    }

    #[test]
    fn smoke_order_by_email_and_itinerary() {
        let mut store = ChainOffStore::default();
        let tid = Uuid::new_v4();
        store.users.insert(
            tid,
            UserRow {
                id: tid,
                email: "landing-smoke-1@traveltrust.test".into(),
                password_hash: None,
                role: "tourist".into(),
                kyc_status: "none".into(),
                nickname: None,
                avatar_url: None,
                default_wallet_address: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            },
        );
        let oid = Uuid::new_v4();
        let now = Utc::now();
        let order = OrderRow {
            id: oid,
            tourist_id: tid,
            guide_id: Uuid::nil(),
            amount: "100".into(),
            currency: "USDC".into(),
            escrow_address: None,
            state: OrderState::Created,
            created_at: now,
            accepted_at: None,
            escrowed_at: None,
            completed_at: None,
            dispute_deadline_at: None,
            auto_complete_at: None,
            updated_at: now,
            start_date: None,
            end_date: None,
            sub_status: None,
            tourist_confirmed: None,
            guide_confirmed: None,
            rating_tourist_confirmed: None,
            rating_guide_confirmed: None,
            chain_id: None,
            data_origin: "production".into(),
            order_kind: None,
            market_listing_id: None,
        };
        let bundle = ItineraryBundle {
            order_id: oid,
            version: 1,
            destination: "中国".into(),
            city: "北京".into(),
            days: vec![],
            amount_breakdown: AmountBreakdown {
                hotel: 0.,
                catering: 0.,
                tickets: 0.,
                guide_fee: 0.,
                vehicle: 0.,
                platform_fee: 0.,
                total_budget: 0.,
            },
            snapshot_hash: None,
            cover_image: None,
        };

        assert!(is_smoke_discover_order(&store, &order, &bundle));

        let mut bundle_smoke = bundle.clone();
        bundle_smoke.days.push(ItineraryDayRow {
            day_index: 1,
            content_text: "smoke save".into(),
            ..Default::default()
        });
        let tid2 = Uuid::new_v4();
        let order2 = OrderRow {
            tourist_id: tid2,
            ..order
        };
        assert!(is_smoke_discover_order(
            &store,
            &order2,
            &bundle_smoke
        ));
    }
}
