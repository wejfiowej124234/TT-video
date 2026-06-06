//! **`TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE=1`**：本地/staging 注入 ≥20 条 **`production`** 旅行 UGC（幂等），供公众 Feed / Explore 走查。
//! 与 [`community_public_surface`] · `data_origin` 过滤同源 — **非** E2E/PI-1 自动化帖。

use chrono::{Duration, Utc};
use sqlx::postgres::PgPool;
use uuid::Uuid;

use crate::chain_off::ChainOffStore;

struct ShowcaseAuthor {
    user_id: Uuid,
    email: &'static str,
    nickname: &'static str,
}

struct ShowcasePost {
    id: Uuid,
    user_id: Uuid,
    body: &'static str,
    post_type: &'static str,
    destination: &'static str,
    tags: &'static [&'static str],
    media_urls: &'static [&'static str],
    cover_url: Option<&'static str>,
    days_ago: i64,
}

const IMG: [&str; 10] = [
    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80",
    "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800&q=80",
    "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&q=80",
    "https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?w=800&q=80",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80",
    "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80",
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80",
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80",
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80",
];

const AUTHORS: [ShowcaseAuthor; 6] = [
    ShowcaseAuthor {
        user_id: Uuid::from_u128(0x0000_0000_0000_4000_8000_0000_0000_0401),
        email: "community-showcase-aurora@example.com",
        nickname: "Aurora 在路上",
    },
    ShowcaseAuthor {
        user_id: Uuid::from_u128(0x0000_0000_0000_4000_8000_0000_0000_0402),
        email: "community-showcase-kento@example.com",
        nickname: "京都向导 Kento",
    },
    ShowcaseAuthor {
        user_id: Uuid::from_u128(0x0000_0000_0000_4000_8000_0000_0000_0403),
        email: "community-showcase-mei@example.com",
        nickname: "Mei 食游记",
    },
    ShowcaseAuthor {
        user_id: Uuid::from_u128(0x0000_0000_0000_4000_8000_0000_0000_0404),
        email: "community-showcase-liam@example.com",
        nickname: "Liam · 海岛户外",
    },
    ShowcaseAuthor {
        user_id: Uuid::from_u128(0x0000_0000_0000_4000_8000_0000_0000_0405),
        email: "community-showcase-yuki@example.com",
        nickname: "Yuki 周末飞",
    },
    ShowcaseAuthor {
        user_id: Uuid::from_u128(0x0000_0000_0000_4000_8000_0000_0000_0406),
        email: "community-showcase-lin@example.com",
        nickname: "云游四海 Lin",
    },
];

fn posts_catalog() -> Vec<ShowcasePost> {
    let a = |i: usize| AUTHORS[i % AUTHORS.len()].user_id;
    let mut id_base = 0x0000_0000_0000_4000_8000_0000_0000_0500_u128;
    let mut out = Vec::with_capacity(22);
    let entries: [(&str, &str, &str, &[&str], &[&str], Option<&str>, i64); 22] = [
        ("清晨的祇园石板路几乎没人，八坂塔方向顺光。穿软底鞋走东山散步道最舒服。#摄影 #京都", "photo", "京都", &["#摄影", "#京都", "#旅行"], &[IMG[2], IMG[3], IMG[4]], None, 1),
        ("筑地场外这碗海鲜丼醋饭温度刚好，海胆甜而不腥。建议 9 点前到排队更短。#美食 #东京", "photo", "东京", &["#美食", "#东京"], &[IMG[9], IMG[9]], None, 2),
        ("乌布梯田徒步：Tegallalang 入口进，中途有凉亭补水，记得防滑鞋。#攻略 #巴厘岛", "photo", "巴厘岛", &["#攻略", "#旅行"], &[IMG[4], IMG[1]], None, 3),
        ("塞纳河游船黄昏一镜到底，巴黎秋天很短，抓紧拍。#摄影 #巴黎", "photo", "巴黎", &["#摄影", "#巴黎"], &[IMG[5]], None, 4),
        ("本周快闪：周五晚飞大阪，周日回。20L 背包足够，行程表放评论区。#周末游", "text", "大阪", &["#周末游"], &[], None, 0),
        ("清迈周末市集：手作银饰与木器比古城里便宜，记得带现金。#小众 #清迈", "photo", "清迈", &["#小众", "#攻略"], &[IMG[6], IMG[7]], None, 5),
        ("厦门鼓浪屿日光岩 7 点上岛，海风大但人最少。轮渡票提前在官方小程序买。#海岛 #厦门", "photo", "厦门", &["#海岛", "#旅行"], &[IMG[0], IMG[8]], None, 6),
        ("丽江束河比大研安静，住两晚慢慢走。高反不严重但仍建议第一天少安排。#古镇 #丽江", "photo", "丽江", &["#古镇", "#旅行"], &[IMG[3]], None, 7),
        ("新加坡滨海湾夜景三脚架位：金沙前步道，21:30 灯光秀开始。#摄影 #新加坡", "photo", "新加坡", &["#摄影", "#旅行"], &[IMG[1], IMG[5]], None, 8),
        ("普吉攀瓦海角徒步，浪大但视野开。穿溯溪鞋，别靠近没有护栏的 cliff edge。#海岛 #普吉", "photo", "普吉", &["#海岛", "#攻略"], &[IMG[7], IMG[4]], None, 9),
        ("上海外滩源 winter walk：圆明园路砖楼 + 苏州河桥，人比外滩主平台少。#城市 #上海", "photo", "上海", &["#城市", "#旅行"], &[IMG[0]], None, 10),
        ("祇园附近家庭料理，出汁很干净。老板只会日语，指菜单图片即可。#美食 #京都", "photo", "京都", &["#美食", "#京都"], &[IMG[9], IMG[9], IMG[9]], None, 11),
        ("佩尼达岛精灵坠崖航拍调色版，风浪大但值得。观看请开声音。#海岛 #巴厘岛", "photo", "巴厘岛", &["#海岛", "#摄影"], &[IMG[4]], Some(IMG[8]), 12),
        ("京都伏见稻荷清晨 6 点上山，鸟居里几乎只有本地慢跑的人。#小众 #京都", "photo", "京都", &["#小众", "#摄影"], &[IMG[2], IMG[2]], None, 13),
        ("曼谷 Chatuchak 周末市场：角落里的 vintage 海报店值得挖，带现金。#攻略 #曼谷", "photo", "曼谷", &["#攻略", "#小众"], &[IMG[6]], None, 14),
        ("东京台场 teamLab 预约晚场，人少好拍。镜面地板别穿短裙。#攻略 #东京", "photo", "东京", &["#攻略", "#摄影"], &[IMG[1], IMG[3]], None, 15),
        ("大理洱海东线骑行：双廊→挖色，顺风路段很爽。防晒和手套必备。#亲子 #大理", "photo", "大理", &["#亲子", "#旅行"], &[IMG[8], IMG[0]], None, 16),
        ("巴黎左岸书店区散步路线：莎士比亚书店→卢森堡花园，两公里刚好。#城市 #巴黎", "text", "巴黎", &["#城市", "#攻略"], &[], None, 17),
        ("三亚后海冲浪初体验：早浪软，教练 1 对 2 足够。晕船的先吃片。#海岛 #三亚", "photo", "三亚", &["#海岛", "#周末游"], &[IMG[7]], None, 18),
        ("京都岚山竹林 7:30 前到，之后旅行团会挤满步道。#摄影 #京都", "photo", "京都", &["#摄影"], &[IMG[2]], None, 19),
        ("新加坡 Haji Lane 涂鸦墙上午光最好，附近咖啡店可远程办公。#城市 #新加坡", "photo", "新加坡", &["#城市"], &[IMG[5], IMG[1]], None, 20),
        ("清迈学做泰北 curry，市场买香茅南姜，老师家用灶火力大。带回 recipe 已翻译。#美食 #清迈", "photo", "清迈", &["#美食", "#攻略"], &[IMG[9], IMG[6]], None, 21),
    ];
    for (body, post_type, dest, tags, media, cover, days_ago) in entries {
        id_base += 1;
        out.push(ShowcasePost {
            id: Uuid::from_u128(id_base),
            user_id: a(out.len()),
            body,
            post_type,
            destination: dest,
            tags,
            media_urls: media,
            cover_url: cover,
            days_ago,
        });
    }
    out
}

pub fn community_public_showcase_enabled() -> bool {
    std::env::var("TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE").as_deref() == Ok("1")
}

async fn production_public_post_count(pool: &PgPool) -> Result<i64, sqlx::Error> {
    let (n,): (i64,) = sqlx::query_as(
        r#"SELECT COUNT(*)::bigint FROM community_posts
           WHERE visibility_status = 'public' AND data_origin = 'production'"#,
    )
    .fetch_one(pool)
    .await?;
    Ok(n)
}

/// PG + chain_off：幂等补种公众 Feed 旅行 UGC（≥20 production 帖）。
pub async fn seed_community_public_showcase_if_sparse(pool: &PgPool, store: &mut ChainOffStore) {
    if !community_public_showcase_enabled() {
        return;
    }
    let existing = production_public_post_count(pool).await.unwrap_or(0);
    if existing >= 20 {
        return;
    }
    let now = Utc::now();
    let mut authors_inserted = 0usize;
    for author in &AUTHORS {
        if store.users.contains_key(&author.user_id) {
            continue;
        }
        if super::insert_user(
            pool,
            author.user_id,
            author.email,
            None,
            "tourist",
            "none",
            Some(author.nickname),
            None,
            None,
            now,
            now,
        )
        .await
        .is_ok()
        {
            authors_inserted += 1;
        }
        store.users.insert(
            author.user_id,
            crate::chain_off::UserRow {
                id: author.user_id,
                email: author.email.to_string(),
                password_hash: None,
                role: "tourist".to_string(),
                kyc_status: "none".to_string(),
                nickname: Some(author.nickname.to_string()),
                avatar_url: None,
                default_wallet_address: None,
                created_at: now,
                updated_at: now,
            },
        );
    }
    let mut posts_inserted = 0usize;
    for post in posts_catalog() {
        let created = now - Duration::days(post.days_ago);
        let tags: Vec<String> = post.tags.iter().map(|s| (*s).to_string()).collect();
        let media: Vec<String> = post.media_urls.iter().map(|s| (*s).to_string()).collect();
        let r = sqlx::query(
            r#"INSERT INTO community_posts
               (id, user_id, body, post_type, destination, tags, media_urls, cover_url, visibility_status, data_origin, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'public', 'production', $9)
               ON CONFLICT (id) DO NOTHING"#,
        )
        .bind(post.id)
        .bind(post.user_id)
        .bind(post.body)
        .bind(post.post_type)
        .bind(post.destination)
        .bind(&tags)
        .bind(&media)
        .bind(post.cover_url)
        .bind(created)
        .execute(pool)
        .await;
        if let Ok(res) = r {
            if res.rows_affected() > 0 {
                posts_inserted += 1;
            }
        }
    }
    if authors_inserted > 0 || posts_inserted > 0 {
        eprintln!(
            "[community-showcase] seeded authors={authors_inserted} posts={posts_inserted} (production public UGC)"
        );
    }
}
