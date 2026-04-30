# D-COM-001

`cargo test -p traveltrust-api matrix_93_d_com_001e_f014_get_feed_hot_mode_includes_seeded_post_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_001e_f014_get_feed_hot_mode_includes_seeded_post_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.18s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=ba06212a-aedf-459a-b18b-c65695bd4885 path=/api/v1/community/posts status=200
[req] x-message-id=059371ba-078d-4fc7-8069-89fe2e8e0e98 path=/api/v1/community/posts status=200
[req] x-request-id=f072c0f0-501b-46e7-a7c5-4f79346c9007 path=/api/v1/community/feed status=200
[req] x-message-id=2295d3de-6884-43e9-814d-3aac6399ebe3 path=/api/v1/community/feed status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-014 · GET /community/feed includes created post (D-COM-001 feed surface)
