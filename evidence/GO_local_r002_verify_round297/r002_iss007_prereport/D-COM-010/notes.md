# D-COM-010

`cargo test -p traveltrust-api matrix_93_d_com_010b_f018_report_then_get_post_detail_unauthenticated_ok_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_report_me_posts_db_api_tests::matrix_93_d_com_010b_f018_report_then_get_post_detail_unauthenticated_ok_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.19s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.32s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=e1c4c1a2-11df-42c6-a1e1-8a53cb21c3b7 path=/api/v1/community/reports status=200
[req] x-message-id=9bfde599-a3e1-4a17-a9ac-e42871623329 path=/api/v1/community/reports status=200
[req] x-request-id=2f872c17-2a9a-4afc-b418-9a3bc186a545 path=/api/v1/community/posts/f6d5e6ea-954f-4e3d-a8b1-79b70efc65f7 status=200
[req] x-message-id=299b3799-606a-4e3d-a010-4d736cf19d12 path=/api/v1/community/posts/f6d5e6ea-954f-4e3d-a8b1-79b70efc65f7 status=200

```
E2E: `frontend/e2e/f018-f019-f020-request.spec.ts` — F-018 · unauthenticated GET post detail after report still readable
