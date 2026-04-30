# D-COM-008

`cargo test -p traveltrust-api matrix_93_d_com_008b_f017_post_collect_delete_recollect_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_008b_f017_post_collect_delete_recollect_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1208 filtered out; finished in 0.18s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.26s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-273a4482d41a62c1.exe)
[req] x-request-id=f6de85f9-81b7-43e9-a4fb-a3ec9f600903 path=/api/v1/community/posts status=200
[req] x-message-id=3320aef1-8bce-4de3-b849-90c2b0a7c026 path=/api/v1/community/posts status=200
[req] x-request-id=eecf182e-0ad0-4567-90dc-6e4e98d8e7f8 path=/api/v1/community/posts/8f9a476e-6cb6-47df-8e89-19089ba1b59c/collect status=200
[req] x-message-id=ff3dc0b5-ece6-42f2-941d-8adb5672de87 path=/api/v1/community/posts/8f9a476e-6cb6-47df-8e89-19089ba1b59c/collect status=200
[req] x-request-id=b933b636-1d39-44d6-9c4f-89145015e72c path=/api/v1/community/posts/8f9a476e-6cb6-47df-8e89-19089ba1b59c/collect status=200
[req] x-message-id=c538b01c-b278-4d7f-88e0-0465b87f5690 path=/api/v1/community/posts/8f9a476e-6cb6-47df-8e89-19089ba1b59c/collect status=200
[req] x-request-id=bf6c8f19-6d5c-4076-bad9-50ca427d700e path=/api/v1/community/posts/8f9a476e-6cb6-47df-8e89-19089ba1b59c/collect status=200
[req] x-message-id=b2a558c4-61bd-4828-ae85-7355ef18af39 path=/api/v1/community/posts/8f9a476e-6cb6-47df-8e89-19089ba1b59c/collect status=200

```
E2E: `frontend/e2e/f015-f016-f017-request.spec.ts` — F-017 · DELETE collect then GET collected_by_me false then POST collect recollect
