# A-AVA-001

`cargo test -p traveltrust-api matrix_93_a_ava_001b_f007_post_profile_avatar_local_persists_avatar_url_on_get_me_app_stack_ok_pg` exit=0

```

running 1 test
test routes::me_profile_avatar_db_api_tests::matrix_93_a_ava_001b_f007_post_profile_avatar_local_persists_avatar_url_on_get_me_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.59s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.34s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=5c631bf9-d6c3-4d2a-bb4a-be1f8953e4f4 path=/auth/register status=200
[req] x-message-id=cbabd5ce-a8d5-4f3b-bcb0-20c305c38a07 path=/auth/register status=200
[req] x-request-id=74805065-6b18-4a56-aa3f-d03dc8ffac4c path=/api/v1/me/profile-avatar status=200
[req] x-message-id=9f8ada0e-8059-4101-ae36-ee2c489cd5e1 path=/api/v1/me/profile-avatar status=200
[req] x-request-id=7441a496-01dc-4651-9575-2d59fbff83c8 path=/api/v1/me status=200
[req] x-message-id=758bc6ce-2dbc-4977-bfb5-dffdbec495be path=/api/v1/me status=200

```
E2E: `frontend/e2e/f007-f010-f032-request.spec.ts` — F-007 · POST profile-avatar (local allow) then GET /me has avatar_url
