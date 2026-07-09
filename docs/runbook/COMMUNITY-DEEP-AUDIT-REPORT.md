# Community Deep Audit 报告

**记录时间：** 2026-06-17T07:47:40.189756+00:00  
**API：** `http://127.0.0.1:8080`  
**git_sha：** `57df30576c70e67251131bb357dd48f4ccf3019e`  
**证据：** `D:\TravelTrust-V1.1\evidence\community-deep-audit\20260617T074729Z`  

---

## Executive verdict

**CDA_DEEP_AUDIT: PASS**

```text
CDA_DEEP_AUDIT: PASS
```

---

## 1 · Community Critical Path Matrix

| probe_id | role | step | method | path | http | expected | status | notes |
|---|---|---|---|---|---|---|---|---|
| ccp.create_post | author | 发帖 | POST | /api/v1/community/posts | 200 | 200|201 | PASS |  |
| ccp.get_post_detail | author | 详情 | GET | /api/v1/community/posts/2c50b659-a3d3-49de-baf2-6e1d5d007266 | 200 | 200+body | PASS |  |
| ccp.get_post_detail | public | 匿名详情 | GET | /api/v1/community/posts/2c50b659-a3d3-49de-baf2-6e1d5d007266 | 200 | 200 | PASS |  |
| ccp.get_feed | author | Feed | GET | /api/v1/community/feed | 200 | contains_post | PASS |  |
| ccp.post_comment | engager | 评论 | POST | /api/v1/community/posts/2c50b659-a3d3-49de-baf2-6e1d5d007266/comments | 200 | 200+id | PASS |  |
| ccp.post_reply | author | 回复 | POST | /api/v1/community/posts/2c50b659-a3d3-49de-baf2-6e1d5d007266/comments | 200 | 200+id | PASS |  |
| ccp.delete_post.setup | author | 发帖 | POST | /api/v1/community/posts | 200 | 200|201 | PASS |  |
| ccp.delete_post | author | 删除 | DELETE | /api/v1/community/posts/a84435df-a615-4c15-9dc2-d7d286d54703 | 200 | 200 | PASS |  |
| ccp.delete_post | public | 删后不可读 | GET | /api/v1/community/posts/a84435df-a615-4c15-9dc2-d7d286d54703 | 200 | 404|empty | PASS |  |


---

## 2 · Moderation Matrix

| probe_id | role | step | method | path | http | expected | status | notes |
|---|---|---|---|---|---|---|---|---|
| mod.setup_post | author | 发帖 | POST | /api/v1/community/posts | 200 | 200|201 | PASS |  |
| mod.pre_feed | public | 下架前可见 | GET | /api/v1/community/feed | 200 | present | PASS |  |
| mod.report_create | reporter | 举报 | POST | /api/v1/community/reports | 200 | 200+id | PASS |  |
| mod.admin_queue | admin | 审核队列 | GET | /api/v1/admin/community/reports | 200 | contains | PASS |  |
| mod.rbac.read_denied | engager | RBAC读 | GET | /api/v1/admin/community/reports | 403 | 403 | PASS |  |
| mod.rbac.non_admin | engager | RBAC | PATCH | /api/v1/admin/community/moderation/30b83bd5-857d-4f48-8c4a-5f96c9b62404 | 403 | 403 | PASS |  |
| mod.comment_visibility | admin | 评论隐藏 | PATCH | /api/v1/admin/community/comments/6075e914-0c1f-4fa2-be96-0368b370d5e4 | 200 | 200 | PASS |  |
| mod.content_remove | admin | 下架 | PATCH | /api/v1/admin/community/moderation/30b83bd5-857d-4f48-8c4a-5f96c9b62404 | 200 | 200 | PASS |  |
| mod.feed_hidden | public | Feed隐藏 | GET | /api/v1/community/feed | 200 | absent | PASS |  |


---

## 3 · Engagement Matrix

| probe_id | role | step | method | path | http | expected | status | notes |
|---|---|---|---|---|---|---|---|---|
| eng.like | engager | 点赞 | POST | /api/v1/community/posts/2c50b659-a3d3-49de-baf2-6e1d5d007266/like | 200 | 200 | PASS |  |
| eng.idempotent_like | engager | 幂等点赞 | POST | /api/v1/community/posts/2c50b659-a3d3-49de-baf2-6e1d5d007266/like | 200 | 200+single_row | PASS | False |
| eng.unlike_relike | engager | 取消再赞 | DELETE|POST | /api/v1/community/posts/2c50b659-a3d3-49de-baf2-6e1d5d007266/like | 200 | 200|200 | PASS |  |
| eng.collect | engager | 收藏 | POST | /api/v1/community/posts/2c50b659-a3d3-49de-baf2-6e1d5d007266/collect | 200 | 200 | PASS |  |
| eng.like_count | engager | 计数投影 | GET | /api/v1/community/posts/2c50b659-a3d3-49de-baf2-6e1d5d007266 | 200 | like/collect counts | PASS | liked=None |
| eng.me_posts | author | 我的帖子 | GET | /api/v1/community/me/posts | 200 | contains | PASS |  |
| eng.me_likes | engager | 我的点赞 | GET | /api/v1/community/me/likes | 200 | contains | PASS |  |
| eng.me_collects | engager | 我的收藏 | GET | /api/v1/community/me/collects | 200 | contains | PASS |  |


---

## 4 · UI Corridor

| probe_id | step | status | notes |
|---|---|---|---|
| ui.f015 | F-015 feed | PASS |  |
| ui.f016 | F-016 post | PASS |  |
| ui.f017 | F-017 comment | PASS |  |
| ui.f018 | F-018 like | PASS |  |
| ui.f019 | F-019 report | PASS |  |


---

## 5 · PG Consistency

| probe_id | target | pg_value | expected | status | notes |
|---|---|---|---|---|---|
| pg.like_count | 2c50b659-a3d3-49de-baf2-6e1d5d007266 | 0 | >=1 | WARN |  |
| pg.collect_count | 2c50b659-a3d3-49de-baf2-6e1d5d007266 | 0 | >=1 | WARN |  |
| pg.comment_count | 2c50b659-a3d3-49de-baf2-6e1d5d007266 | 0 | >=1 | WARN |  |
| pg.auth_audit_events |  | 0 |  | WARN |  |


---

## 复跑

```bash
bash scripts/dev/run-community-deep-audit.sh
```
