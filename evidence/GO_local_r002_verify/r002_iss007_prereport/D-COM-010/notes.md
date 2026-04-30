# D-COM-010

`cargo test -p traveltrust-api matrix_93_d_com_010b_f018_report_then_get_post_detail_unauthenticated_ok_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_report_me_posts_db_api_tests::matrix_93_d_com_010b_f018_report_then_get_post_detail_unauthenticated_ok_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.20s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.26s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=8f94aa69-e812-4ab0-9938-b8261d97bbbc path=/api/v1/community/reports status=200
[req] x-message-id=b821a74a-be20-4c4f-8d3c-eced126902ce path=/api/v1/community/reports status=200
[req] x-request-id=880d28c2-9c23-4c3a-ac29-e6dc405268b5 path=/api/v1/community/posts/83ed6554-7f48-4fe0-97cb-d17e21441816 status=200
[req] x-message-id=25b667ea-3afb-4d68-807e-c41a7281232d path=/api/v1/community/posts/83ed6554-7f48-4fe0-97cb-d17e21441816 status=200

```
E2E: `frontend/e2e/f018-f019-f020-request.spec.ts` — F-018 · unauthenticated GET post detail after report still readable
