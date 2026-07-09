# D-COM-010

`cargo test -p traveltrust-api matrix_93_d_com_010b_f018_report_then_get_post_detail_unauthenticated_ok_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_report_me_posts_db_api_tests::matrix_93_d_com_010b_f018_report_then_get_post_detail_unauthenticated_ok_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1180 filtered out; finished in 0.22s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.31s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-21f06832b8f1b80b.exe)
[req] x-request-id=bf2a0043-b1dc-41de-9011-7716c07694fa path=/api/v1/community/reports status=200
[req] x-message-id=e5ede3b7-9b5b-499c-b222-b97288d180aa path=/api/v1/community/reports status=200
[req] x-request-id=aa1dfa43-fb96-429a-a3f7-b9c56709408e path=/api/v1/community/posts/27488522-f873-4c48-a972-9e04cb3e782f status=200
[req] x-message-id=eab06aac-ddb9-4334-8036-5817e6adfb40 path=/api/v1/community/posts/27488522-f873-4c48-a972-9e04cb3e782f status=200

```
E2E: `frontend/e2e/f018-f019-f020-request.spec.ts` — F-018 · unauthenticated GET post detail after report still readable
