# A-AVA-001

`cargo test -p traveltrust-api matrix_93_a_ava_001b_f007_post_profile_avatar_local_persists_avatar_url_on_get_me_app_stack_ok_pg` exit=0

```

running 1 test
test routes::me_profile_avatar_db_api_tests::matrix_93_a_ava_001b_f007_post_profile_avatar_local_persists_avatar_url_on_get_me_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.60s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=c40f0bbc-d96e-4e73-a0e4-f2552f826b9c path=/auth/register status=200
[req] x-message-id=91bcef89-f5e6-44d0-9509-c0d1696ffee1 path=/auth/register status=200
[req] x-request-id=38905423-0248-4e2a-924f-e5a7c78ebef4 path=/api/v1/me/profile-avatar status=200
[req] x-message-id=2206a299-b3e1-4ad1-8ff3-f93caccfcf87 path=/api/v1/me/profile-avatar status=200
[req] x-request-id=a29d033c-4ec1-49eb-9d3c-8f727f23f9c9 path=/api/v1/me status=200
[req] x-message-id=b0e148ed-9d1a-4d34-897b-99c6049d769a path=/api/v1/me status=200

```
E2E: `frontend/e2e/f007-f010-f032-request.spec.ts` — F-007 · POST profile-avatar (local allow) then GET /me has avatar_url
