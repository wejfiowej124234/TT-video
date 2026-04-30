# D-COM-010

`cargo test -p traveltrust-api matrix_93_d_com_010b_f018_report_then_get_post_detail_unauthenticated_ok_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_report_me_posts_db_api_tests::matrix_93_d_com_010b_f018_report_then_get_post_detail_unauthenticated_ok_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.19s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.29s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=a5ba4bc3-c80f-4b51-a879-0c768c3eda23 path=/api/v1/community/reports status=200
[req] x-message-id=3cfc2740-77d4-4321-8431-bb5a11180daa path=/api/v1/community/reports status=200
[req] x-request-id=12e65781-a835-41d4-990b-b9193fd9916e path=/api/v1/community/posts/fb24d0a7-a381-4b7a-bce9-73117b37c1c2 status=200
[req] x-message-id=159cb839-8155-408d-88da-9d206bac9cda path=/api/v1/community/posts/fb24d0a7-a381-4b7a-bce9-73117b37c1c2 status=200

```
E2E: `frontend/e2e/f018-f019-f020-request.spec.ts` — F-018 · unauthenticated GET post detail after report still readable
