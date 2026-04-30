# D-COM-010

`cargo test -p traveltrust-api matrix_93_d_com_010b_f018_report_then_get_post_detail_unauthenticated_ok_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_report_me_posts_db_api_tests::matrix_93_d_com_010b_f018_report_then_get_post_detail_unauthenticated_ok_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1208 filtered out; finished in 0.20s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.26s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-273a4482d41a62c1.exe)
[req] x-request-id=113954da-a266-4be8-9e26-bab1ce1c9164 path=/api/v1/community/reports status=200
[req] x-message-id=33d39001-37f5-422f-a30d-4f14dd970e00 path=/api/v1/community/reports status=200
[req] x-request-id=6f335646-1432-480e-be3b-01fe845d4c02 path=/api/v1/community/posts/7ac11c2d-8775-45a1-8f13-8871e1a8dd94 status=200
[req] x-message-id=127814dc-0b05-48d9-b759-789846111a84 path=/api/v1/community/posts/7ac11c2d-8775-45a1-8f13-8871e1a8dd94 status=200

```
E2E: `frontend/e2e/f018-f019-f020-request.spec.ts` — F-018 · unauthenticated GET post detail after report still readable
