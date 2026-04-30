# D-COM-010

`cargo test -p traveltrust-api matrix_93_d_com_010b_f018_report_then_get_post_detail_unauthenticated_ok_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_report_me_posts_db_api_tests::matrix_93_d_com_010b_f018_report_then_get_post_detail_unauthenticated_ok_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.21s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=93af5405-24f9-465f-b441-bf5586dafc58 path=/api/v1/community/reports status=200
[req] x-message-id=dbfd64e2-ef4b-47d0-89ae-a8b3f995a2b2 path=/api/v1/community/reports status=200
[req] x-request-id=2c93d98a-ecf7-4501-9c2c-ec80891480b1 path=/api/v1/community/posts/677b0241-72a3-49d5-9ef6-88842f1c9223 status=200
[req] x-message-id=f7b3dfe4-331b-4c0d-ae91-4a1d8c8d4963 path=/api/v1/community/posts/677b0241-72a3-49d5-9ef6-88842f1c9223 status=200

```
E2E: `frontend/e2e/f018-f019-f020-request.spec.ts` — F-018 · unauthenticated GET post detail after report still readable
