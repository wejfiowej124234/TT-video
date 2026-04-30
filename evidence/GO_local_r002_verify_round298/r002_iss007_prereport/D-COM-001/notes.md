# D-COM-001

`cargo test -p traveltrust-api matrix_93_d_com_001e_f014_get_feed_hot_mode_includes_seeded_post_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_001e_f014_get_feed_hot_mode_includes_seeded_post_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.17s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.29s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=7ff3cfe4-c7cb-4e5f-9aa9-3850dce11b04 path=/api/v1/community/posts status=200
[req] x-message-id=be1108ee-4efe-4cfc-af4b-7c64e1bff7b1 path=/api/v1/community/posts status=200
[req] x-request-id=66369e55-8882-45cf-b48f-e29121815e9b path=/api/v1/community/feed status=200
[req] x-message-id=0f3bf2d7-71ed-4c9f-8b6c-915d0300c034 path=/api/v1/community/feed status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-014 · GET /community/feed includes created post (D-COM-001 feed surface)
