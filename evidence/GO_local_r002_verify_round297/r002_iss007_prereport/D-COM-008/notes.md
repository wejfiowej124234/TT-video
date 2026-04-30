# D-COM-008

`cargo test -p traveltrust-api matrix_93_d_com_008b_f017_post_collect_delete_recollect_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_008b_f017_post_collect_delete_recollect_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.14s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=cf50ba2a-97ba-45c8-87f2-8833ae5eb076 path=/api/v1/community/posts status=200
[req] x-message-id=6c057f02-2513-4e12-8218-7050771b3fb9 path=/api/v1/community/posts status=200
[req] x-request-id=b86f20ac-e157-499a-a37d-e93af47a4480 path=/api/v1/community/posts/1d503da0-1c91-4852-ae67-d153ef96fd50/collect status=200
[req] x-message-id=e06fddae-b991-47ef-9b97-93a7f6240c43 path=/api/v1/community/posts/1d503da0-1c91-4852-ae67-d153ef96fd50/collect status=200
[req] x-request-id=24d2103b-d92a-4842-8e5a-dae0718a454e path=/api/v1/community/posts/1d503da0-1c91-4852-ae67-d153ef96fd50/collect status=200
[req] x-message-id=cf80726a-6e2d-472e-87c9-4daac51adc0c path=/api/v1/community/posts/1d503da0-1c91-4852-ae67-d153ef96fd50/collect status=200
[req] x-request-id=ee35bfa9-1da7-4049-9586-982c59548c74 path=/api/v1/community/posts/1d503da0-1c91-4852-ae67-d153ef96fd50/collect status=200
[req] x-message-id=5bb62b28-9902-4cc1-9b21-c8734001437a path=/api/v1/community/posts/1d503da0-1c91-4852-ae67-d153ef96fd50/collect status=200

```
E2E: `frontend/e2e/f015-f016-f017-request.spec.ts` — F-017 · DELETE collect then GET collected_by_me false then POST collect recollect
