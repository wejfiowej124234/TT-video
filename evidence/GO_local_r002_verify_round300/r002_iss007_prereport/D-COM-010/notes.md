# D-COM-010

`cargo test -p traveltrust-api matrix_93_d_com_010b_f018_report_then_get_post_detail_unauthenticated_ok_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_report_me_posts_db_api_tests::matrix_93_d_com_010b_f018_report_then_get_post_detail_unauthenticated_ok_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.18s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.29s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=103c70ce-5036-4f00-9eab-28fe1a795e44 path=/api/v1/community/reports status=200
[req] x-message-id=7c1082f9-5377-4226-b067-d200ba5d7bd9 path=/api/v1/community/reports status=200
[req] x-request-id=547362c3-17ab-447d-b096-c33fa2720738 path=/api/v1/community/posts/c076ea04-1157-4eea-b83c-1759a80300f5 status=200
[req] x-message-id=ccd748bc-f9ff-47fd-a228-e3d3f8d2d003 path=/api/v1/community/posts/c076ea04-1157-4eea-b83c-1759a80300f5 status=200

```
E2E: `frontend/e2e/f018-f019-f020-request.spec.ts` — F-018 · unauthenticated GET post detail after report still readable
