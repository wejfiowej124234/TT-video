# D-COM-008

`cargo test -p traveltrust-api matrix_93_d_com_008b_f017_post_collect_delete_recollect_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_008b_f017_post_collect_delete_recollect_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.14s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.26s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=7f55ee78-41f9-4f1b-b815-ee25e06f9f80 path=/api/v1/community/posts status=200
[req] x-message-id=4520d41d-aa55-48b4-b5d5-009fdd670277 path=/api/v1/community/posts status=200
[req] x-request-id=d64466f2-cb8b-4836-8595-7e635fe6268c path=/api/v1/community/posts/a37aa7cc-4b13-4a5b-900e-5db6af2ae90b/collect status=200
[req] x-message-id=b4af2429-e128-433a-ab32-92ba7e0f4165 path=/api/v1/community/posts/a37aa7cc-4b13-4a5b-900e-5db6af2ae90b/collect status=200
[req] x-request-id=ace7276a-0f6c-4c93-8065-b09ca8c07995 path=/api/v1/community/posts/a37aa7cc-4b13-4a5b-900e-5db6af2ae90b/collect status=200
[req] x-message-id=6c6214cd-a3c0-4dd0-9a6d-eb6d00b48ee4 path=/api/v1/community/posts/a37aa7cc-4b13-4a5b-900e-5db6af2ae90b/collect status=200
[req] x-request-id=ddc48a24-4eec-44c3-ab6a-257198fb7f04 path=/api/v1/community/posts/a37aa7cc-4b13-4a5b-900e-5db6af2ae90b/collect status=200
[req] x-message-id=dff725de-7cd1-48c7-8f70-4707cf0bede3 path=/api/v1/community/posts/a37aa7cc-4b13-4a5b-900e-5db6af2ae90b/collect status=200

```
E2E: `frontend/e2e/f015-f016-f017-request.spec.ts` — F-017 · DELETE collect then GET collected_by_me false then POST collect recollect
