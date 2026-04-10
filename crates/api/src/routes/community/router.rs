use axum::routing::{get, post};
use axum::Router;

use crate::state::ApiMetaState;

use super::dm_social::{
    delete_collect, delete_follow, get_conversation_messages, get_conversations,
    get_friends_list, get_friends_requests, get_friends_requests_sent, get_me_collects,
    get_me_followers, get_me_following, get_me_likes_received, post_collect,
    post_conversation_message, post_follow, post_friends_accept, post_friends_reject,
    post_friends_request,
};
use super::feedback_reports::{
    get_community_report_detail, get_feedback, get_me_community_reports, post_community_report,
    post_community_report_appeal, post_feedback,
};
use super::posts::{
    create_post, delete_like, delete_post, get_comments, get_feed, get_me_posts, get_post_detail,
    get_public_posts_by_tag_count, get_user_posts, patch_post, post_comment, post_like,
};

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route("/api/v1/community/feed", get(get_feed))
        .route(
            "/api/v1/community/stats/posts-by-tag",
            get(get_public_posts_by_tag_count),
        )
        .route("/api/v1/community/posts", post(create_post))
        .route(
            "/api/v1/community/posts/:id",
            get(get_post_detail).delete(delete_post).patch(patch_post),
        )
        .route(
            "/api/v1/community/posts/:id/like",
            post(post_like).delete(delete_like),
        )
        .route(
            "/api/v1/community/posts/:id/comments",
            get(get_comments).post(post_comment),
        )
        .route("/api/v1/community/conversations", get(get_conversations))
        .route(
            "/api/v1/community/conversations/:id/messages",
            get(get_conversation_messages).post(post_conversation_message),
        )
        .route(
            "/api/v1/community/users/:user_id/posts",
            get(get_user_posts),
        )
        .route(
            "/api/v1/community/users/:id/follow",
            post(post_follow).delete(delete_follow),
        )
        .route("/api/v1/community/me/following", get(get_me_following))
        .route("/api/v1/community/me/followers", get(get_me_followers))
        .route(
            "/api/v1/community/me/likes-received",
            get(get_me_likes_received),
        )
        .route(
            "/api/v1/community/friends/request",
            post(post_friends_request),
        )
        .route(
            "/api/v1/community/friends/accept",
            post(post_friends_accept),
        )
        .route(
            "/api/v1/community/friends/reject",
            post(post_friends_reject),
        )
        .route("/api/v1/community/friends/list", get(get_friends_list))
        .route(
            "/api/v1/community/friends/requests/sent",
            get(get_friends_requests_sent),
        )
        .route(
            "/api/v1/community/friends/requests",
            get(get_friends_requests),
        )
        .route(
            "/api/v1/community/posts/:id/collect",
            post(post_collect).delete(delete_collect),
        )
        .route("/api/v1/community/me/collects", get(get_me_collects))
        .route("/api/v1/community/me/posts", get(get_me_posts))
        .route(
            "/api/v1/community/me/reports",
            get(get_me_community_reports),
        )
        .route(
            "/api/v1/community/feedback",
            get(get_feedback).post(post_feedback),
        )
        .route("/api/v1/community/reports", post(post_community_report))
        .route(
            "/api/v1/community/reports/:id/appeals",
            post(post_community_report_appeal),
        )
        .route(
            "/api/v1/community/reports/:id",
            get(get_community_report_detail),
        )
}
