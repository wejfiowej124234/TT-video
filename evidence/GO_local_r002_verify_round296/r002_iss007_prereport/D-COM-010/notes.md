# D-COM-010

`cargo test -p traveltrust-api matrix_93_d_com_010b_f018_report_then_get_post_detail_unauthenticated_ok_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_report_me_posts_db_api_tests::matrix_93_d_com_010b_f018_report_then_get_post_detail_unauthenticated_ok_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.20s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=e6ac617e-672d-48a1-a131-437c16abf36e path=/api/v1/community/reports status=200
[req] x-message-id=e24bc258-586d-4bf3-a4a5-fa8742b78ab5 path=/api/v1/community/reports status=200
[req] x-request-id=de238b82-ea91-473a-820a-281be79eb5ce path=/api/v1/community/posts/bb6d5e2e-4105-4ddb-b153-62fe766b1388 status=200
[req] x-message-id=e30cc871-b74c-42ac-af4b-ea801341a05a path=/api/v1/community/posts/bb6d5e2e-4105-4ddb-b153-62fe766b1388 status=200

```
E2E: `frontend/e2e/f018-f019-f020-request.spec.ts` — F-018 · unauthenticated GET post detail after report still readable
