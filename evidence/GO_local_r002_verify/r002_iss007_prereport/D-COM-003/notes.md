# D-COM-003

`cargo test -p traveltrust-api matrix_93_d_com_003b_f016_post_like_delete_relike_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_003b_f016_post_like_delete_relike_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.14s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.26s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=110fcc7d-51c0-4307-9b84-ab220911fd01 path=/api/v1/community/posts status=200
[req] x-message-id=b2444452-0213-4653-a5fa-67acf79636ab path=/api/v1/community/posts status=200
[req] x-request-id=4a39e062-5f88-4bec-84b9-3bb2491e47ec path=/api/v1/community/posts/49a78863-9c45-4c5d-bf64-3a31f18b2dc8/like status=200
[req] x-message-id=da4b56f1-4f68-42f5-b6a4-c7ed098b06e5 path=/api/v1/community/posts/49a78863-9c45-4c5d-bf64-3a31f18b2dc8/like status=200
[req] x-request-id=7eee6519-dddc-4a98-8228-dc8e2b518966 path=/api/v1/community/posts/49a78863-9c45-4c5d-bf64-3a31f18b2dc8/like status=200
[req] x-message-id=515c4f0b-adc9-4ebd-95c3-d1cc16a15383 path=/api/v1/community/posts/49a78863-9c45-4c5d-bf64-3a31f18b2dc8/like status=200
[req] x-request-id=cf833887-4f76-45b5-8bf3-60b191b530f1 path=/api/v1/community/posts/49a78863-9c45-4c5d-bf64-3a31f18b2dc8/like status=200
[req] x-message-id=3db22fc9-5bd4-4617-98f6-a1a3648553e2 path=/api/v1/community/posts/49a78863-9c45-4c5d-bf64-3a31f18b2dc8/like status=200

```
E2E: `frontend/e2e/f015-f016-f017-request.spec.ts` — F-016 · DELETE like then GET liked_by_me false then POST like relike
