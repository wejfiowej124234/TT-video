# D-COM-010

`cargo test -p traveltrust-api matrix_93_d_com_010b_f018_report_then_get_post_detail_unauthenticated_ok_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_report_me_posts_db_api_tests::matrix_93_d_com_010b_f018_report_then_get_post_detail_unauthenticated_ok_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.21s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=89eb6793-273f-450d-8828-6b0e205d7843 path=/api/v1/community/reports status=200
[req] x-message-id=2bdcc048-d322-46b6-9bfb-46a0ebca5da0 path=/api/v1/community/reports status=200
[req] x-request-id=011da946-0e8f-4bb3-b518-6efa057d3999 path=/api/v1/community/posts/5e7b800a-3bc9-48aa-b076-9530debc5be9 status=200
[req] x-message-id=fed27282-061b-4963-ad16-485a8c543b34 path=/api/v1/community/posts/5e7b800a-3bc9-48aa-b076-9530debc5be9 status=200

```
E2E: `frontend/e2e/f018-f019-f020-request.spec.ts` — F-018 · unauthenticated GET post detail after report still readable
