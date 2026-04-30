# D-COM-010

`cargo test -p traveltrust-api matrix_93_d_com_010b_f018_report_then_get_post_detail_unauthenticated_ok_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_report_me_posts_db_api_tests::matrix_93_d_com_010b_f018_report_then_get_post_detail_unauthenticated_ok_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.19s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.25s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=91439a56-c603-408b-87a5-f18bdfa78fca path=/api/v1/community/reports status=200
[req] x-message-id=cd534682-f9ca-4d78-b8d8-001a148f30d1 path=/api/v1/community/reports status=200
[req] x-request-id=6d051f03-96eb-4fa5-9c2c-a434a088043c path=/api/v1/community/posts/63d91e9f-2485-4c86-8b18-349e3aa0c82e status=200
[req] x-message-id=f4f1ed7b-0a64-4d64-88ad-4369432727bc path=/api/v1/community/posts/63d91e9f-2485-4c86-8b18-349e3aa0c82e status=200

```
E2E: `frontend/e2e/f018-f019-f020-request.spec.ts` — F-018 · unauthenticated GET post detail after report still readable
