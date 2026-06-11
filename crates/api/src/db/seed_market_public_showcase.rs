//! **`TRAVELTRUST_MARKET_PUBLIC_SHOWCASE=1`**：本地 ① 注入少量 **`production`** 向导（幂等），供 `/market` L5 走查。
//! 与 `chain_off::market_public_surface` 过滤同源 — **非** test/demo/Global 占位。

use chrono::Utc;
use sqlx::postgres::PgPool;
use uuid::Uuid;

use crate::chain_off::{ChainOffStore, GuideRow, UserRow};

struct ShowcaseGuideDef {
    user_id: Uuid,
    guide_id: Uuid,
    email: &'static str,
    nickname: &'static str,
    city: &'static str,
    country_code: &'static str,
    languages: &'static [&'static str],
    service_types: &'static [&'static str],
    bio: &'static str,
    stake_amount: &'static str,
}

const SHOWCASE_GUIDES: &[ShowcaseGuideDef] = &[
    ShowcaseGuideDef {
        user_id: Uuid::from_u128(0x0000_0000_0000_4000_8000_0000_0000_0301),
        guide_id: Uuid::from_u128(0x0000_0000_0000_4000_8000_0000_0000_0311),
        email: "market-showcase-beijing@example.com",
        nickname: "北京文化向导",
        city: "北京",
        country_code: "CN",
        languages: &["zh", "en"],
        service_types: &["walking", "culture"],
        bio: "10 年北京地接，故宫、长城与胡同深度讲解，持证双语向导。",
        stake_amount: "800",
    },
    ShowcaseGuideDef {
        user_id: Uuid::from_u128(0x0000_0000_0000_4000_8000_0000_0000_0302),
        guide_id: Uuid::from_u128(0x0000_0000_0000_4000_8000_0000_0000_0312),
        email: "market-showcase-shanghai@example.com",
        nickname: "上海城市向导",
        city: "上海",
        country_code: "CN",
        languages: &["zh", "en"],
        service_types: &["walking", "food"],
        bio: "外滩、豫园与法租界美食路线，擅长城市故事与摄影点位。",
        stake_amount: "650",
    },
    ShowcaseGuideDef {
        user_id: Uuid::from_u128(0x0000_0000_0000_4000_8000_0000_0000_0303),
        guide_id: Uuid::from_u128(0x0000_0000_0000_4000_8000_0000_0000_0313),
        email: "market-showcase-kyoto@example.com",
        nickname: "Kyoto Walk Guide",
        city: "京都",
        country_code: "JP",
        languages: &["ja", "en"],
        service_types: &["culture", "walking"],
        bio: "Kyoto temples, tea districts, and seasonal gardens — licensed local guide.",
        stake_amount: "720",
    },
];

pub fn market_public_showcase_enabled() -> bool {
    std::env::var("TRAVELTRUST_MARKET_PUBLIC_SHOWCASE").as_deref() == Ok("1")
}

/// PG + chain_off 内存：幂等补种 L5 走查用 production 向导（北京/上海/京都）。
pub async fn seed_market_public_showcase_if_sparse(pool: &PgPool, store: &mut ChainOffStore) {
    if !market_public_showcase_enabled() {
        return;
    }
    let now = Utc::now();
    let mut inserted = 0usize;
    for def in SHOWCASE_GUIDES {
        if store.guides.contains_key(&def.guide_id) {
            continue;
        }
        if super::insert_user(
            pool,
            def.user_id,
            def.email,
            None,
            "guide",
            "none",
            Some(def.nickname),
            None,
            None,
            now,
            now,
        )
        .await
        .is_err()
        {
            // 已存在可继续写 guide
        }
        let langs: Vec<String> = def.languages.iter().map(|s| (*s).to_string()).collect();
        let types: Vec<String> = def.service_types.iter().map(|s| (*s).to_string()).collect();
        if super::insert_guide_with_data_origin(
            pool,
            def.guide_id,
            def.user_id,
            def.city,
            def.country_code,
            &langs,
            &types,
            Some(def.bio),
            None,
            Some(def.nickname),
            None,
            None,
            None,
            None,
            def.stake_amount,
            None,
            None,
            "active",
            now,
            now,
            "production",
        )
        .await
        .is_err()
        {
            continue;
        }
        store.users.insert(
            def.user_id,
            UserRow {
                id: def.user_id,
                email: def.email.to_string(),
                password_hash: None,
                role: "guide".to_string(),
                kyc_status: "none".to_string(),
                nickname: Some(def.nickname.to_string()),
                avatar_url: None,
                default_wallet_address: None,
                created_at: now,
                updated_at: now,
            },
        );
        let guide_row = GuideRow {
            id: def.guide_id,
            user_id: def.user_id,
            city: def.city.to_string(),
            country_code: def.country_code.to_string(),
            languages: langs,
            service_types: types,
            bio: Some(def.bio.to_string()),
            wallet_address: None,
            real_name: Some(def.nickname.to_string()),
            passport_number_hash: None,
            id_photo_url: None,
            language_cert_url: None,
            guide_license_url: None,
            stake_amount: def.stake_amount.to_string(),
            hourly_rate: None,
            avatar_url: None,
            status: "active".to_string(),
            rejection_codes: vec![],
            rejection_message: None,
            data_origin: "production".into(),
            created_at: now,
            updated_at: now,
        };
        store.guides.insert(def.guide_id, guide_row.clone());
        store.guides_by_user.insert(def.user_id, def.guide_id);
        inserted += 1;
    }
    if inserted > 0 {
        eprintln!(
            "[market-showcase] seeded {inserted} production guides for /market L5 walkthrough"
        );
    }
}
