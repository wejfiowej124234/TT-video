//! **F-014 / F-015 / F-016 / F-017 · API·IT（PostgreSQL + `Router::oneshot`）**
//!
//! - **F-014**：**`GET /api/v1/community/feed`**（默认 **`recommend`**）在库内存在公开帖时返回 **`status=ok`** 与帖子列表。
//! - **F-015**：**`POST …/community/posts`** + **`GET …/posts/:id`** 详情可读。
//! - **F-016**：**`POST /api/v1/community/posts/:id/like`** → **`status=ok`**。
//! - **F-017**：**`POST /api/v1/community/posts/:id/collect`** → **`status=ok`**。
//! - **v1.4.241**：**`matrix_93_d_com_008_f017_post_collect_twice_idempotent_app_stack_ok_pg`** — **`router::app`** 主栈（与 **`matrix_93_d_com_008_post_collect_twice_idempotent`** **互补**）。
//! - **v1.4.242**：**`matrix_93_d_com_003b_f016_post_like_delete_relike_app_stack_ok_pg`** / **`matrix_93_d_com_008b_f017_post_collect_delete_recollect_app_stack_ok_pg`** / **`matrix_93_d_com_009b_f019_get_me_collects_includes_post_after_collect_app_stack_ok_pg`** — **`DELETE …/like`**、**`DELETE …/collect`**、**`GET …/me/collects`**（**`router::app`**）。
//! - **v1.4.243**：**`matrix_93_d_com_003d_f016_get_post_detail_liked_by_me_true_after_like_app_stack_ok_pg`** / **`matrix_93_d_com_008c_f017_get_post_detail_collected_by_me_true_after_collect_app_stack_ok_pg`** / **`matrix_93_d_com_009c_f019_get_me_likes_includes_post_after_like_app_stack_ok_pg`** — **`GET …/posts/:id`** **`liked_by_me`/`collected_by_me`**、**`GET …/me/likes`**（**`router::app`**）。
//! - **v1.4.244**：**`matrix_93_d_com_003e_f016_get_post_detail_liked_by_me_false_after_unlike_app_stack_ok_pg`** / **`matrix_93_d_com_008d_f017_get_post_detail_collected_by_me_false_after_uncollect_app_stack_ok_pg`** / **`matrix_93_d_com_009d_f019_get_me_likes_excludes_post_after_unlike_app_stack_ok_pg`** — **`DELETE …/like`**/**`DELETE …/collect`** 后详情与 **`me/likes`** 读回（**`router::app`**）。
//! - **v1.4.245**：**`matrix_93_d_com_003f_f016_get_feed_post_liked_by_me_true_after_like_app_stack_ok_pg`** / **`matrix_93_d_com_008e_f017_get_feed_post_collected_by_me_true_after_collect_app_stack_ok_pg`** / **`matrix_93_d_com_009e_f019_get_me_collects_excludes_post_after_uncollect_app_stack_ok_pg`** — **`GET …/feed`**（**Bearer**）**`liked_by_me`/`collected_by_me`**；**`DELETE …/collect`** 后 **`me/collects`**（**`router::app`**）。
//! - **v1.4.272**：**`matrix_93_d_com_008f_f017_collect_then_get_detail_unauthenticated_collect_count_ok_app_stack_ok_pg`** / **`matrix_93_d_com_009g_f019_get_me_likes_empty_list_ok_bearer_app_stack_ok_pg`** — **收藏后匿名** **`GET …/posts/:id`** **`collect_count`** **且无** **`collected_by_me`**；**Bearer** **`GET …/me/likes`** **空列表**（**`router::app`**）。
//! - **v1.4.273**：**`matrix_93_d_com_001c_f014_get_feed_tag_filter_includes_tagged_post_app_stack_ok_pg`** — **`GET …/feed?tag=`** **精确匹配** **含** **Bearer** **发帖** **`tags[]`** **帖**（**`router::app`**）。
//! - **v1.4.274**：**`matrix_93_d_com_001e_f014_get_feed_hot_mode_includes_seeded_post_app_stack_ok_pg`** — **匿名** **`GET …/feed?mode=hot`** **`posts`** **含** **主栈种子帖**（**`router::app`**）。
//! - **v1.4.275**：**`matrix_93_d_com_001f_f014_bearer_get_feed_follow_mode_ok_shape_app_stack_ok_pg`** — **Bearer** **`GET …/feed?mode=follow`** **`200`** **`posts`** **数组**（**`router::app`**；无关注时 **可空**）。
//! - **v1.4.276**：**`matrix_93_d_com_001g_f014_bearer_follow_feed_includes_followed_author_post_app_stack_ok_pg`** — **`community_follows`** **后** **Bearer** **`GET …/feed?mode=follow`** **`posts`** **含** **被关注者** **新帖** **`id`**（**`router::app`**）。
//! - **Feed geo enrich（①）**：**`matrix_93_d_com_feed_geo_max_distance_m_enrich_pg`** — **`GET …/feed?anchor_poi_id=&max_distance_m=1000`** → **`venue_name`/`distance_m`/`is_sponsored`** enrich + 距离过滤排序（**`feed_geo.rs`** · PG·IT）。
//!
//! **93 §4.1（D 域 · AUTO-P0）**：**`matrix_93_d_com_001_*`** ↔ **D-COM-001**/**F-014**（**`matrix_93_d_com_001_f014_feed_cursor_second_page_*`** / **`matrix_93_d_com_001b_f014_feed_cursor_second_page_*`**：**RFC3339 `cursor`** 第二页正路径；**`001b_*`** = **`router::app`**）；**`matrix_93_d_com_001c_f014_*`**：**`tag` 过滤** **主栈**；**`matrix_93_d_com_001e_f014_*`**：**`mode=hot`** **主栈**；**`matrix_93_d_com_001f_f014_*`**：**`mode=follow`** **Bearer** **主栈**；**`matrix_93_d_com_001g_f014_*`**：**`mode=follow`** **+** **`insert_follow`** **读回**；**`matrix_93_d_com_002_*`** ↔ **D-COM-002**/**F-015**（**`matrix_93_d_com_002b_f015_*`**：**Bearer** **发帖** → **无身份头** **`GET …/posts/:id`** **公开读**）；**`matrix_93_d_com_003_*`** ↔ **D-COM-003**/**F-016**（**`matrix_93_d_com_003g_f016_*`**：**点赞** 后 **匿名** **`GET …/posts/:id`** **`like_count`** **且不返回** **`liked_by_me`**）；**`matrix_93_d_com_008_*`** ↔ **D-COM-008**/**F-017**（判据见 **`spec/93-全站功能验证矩阵-域别回归清单.md`** §4.1；**`008f_*`**：**收藏** 后 **匿名详情** **`collect_count`**）；**`matrix_93_d_com_009g_f019_*`** ↔ **D-COM-009**/**F-019**（**`GET …/me/likes`** **空** **`likes`**）。
//! - **v1.4.240**：**`matrix_93_d_com_001_f014_get_feed_includes_seeded_text_post_app_stack_ok_pg`** / **`matrix_93_d_com_002_f015_post_then_get_post_detail_matches_app_stack_ok_pg`** / **`matrix_93_d_com_003_f016_post_like_twice_idempotent_app_stack_ok_pg`** — **`router::app`** 主栈（与 **`community::router()`** **`app_with_pool`** **互补**）。
//! - **v1.4.271**：**`matrix_93_d_com_001b_f014_feed_cursor_second_page_includes_older_post_app_stack_ok_pg`** / **`matrix_93_d_com_002b_f015_post_bearer_then_get_detail_unauthenticated_ok_app_stack_ok_pg`** / **`matrix_93_d_com_003g_f016_like_then_get_detail_unauthenticated_like_count_ok_app_stack_ok_pg`** — **`router::app`** **F-014/F-015/F-016` 正路径扩格**（**`spec/95-全链路生产就绪检查清单与完成度矩阵.md`** **v1.4.271**）。
//!
//! **跳过条件**：未设置 **`DATABASE_URL`**（与 **`tests_create_post_commerce_db`** 同源）；须指向**已迁移**库。
//!
//! **TT-MOD**：目录化拆分（**`helpers` + 子文件**）；**HTTP/JSON 与 04** 不变。

mod app_stack_feed_follow_detail;
mod collect_feed_me_edges;
mod detail_liked_me_lists;
mod detail_unlike_feed_anon_counts;
mod engagement_delete_recollect_me;
mod feed_subrouter_cursor;
mod helpers;
mod comments_sort_thread_pg;
mod engagement_feed_detail_aligned_pg;
mod feed_geo_enrich_pg;
mod commerce_read_feed_detail_pg;
mod media_urls_feed_detail_pg;
mod primary_media_asset_id_feed_pg;
mod stack_posts_feed_modes;
mod upload_media_pg;
mod upload_media_security_pg;
mod moderation_flow_pg;
mod video_playback_pg;
mod image_delivery_pg;
mod social_graph_pg;
