# A-AVA-001

`cargo test -p traveltrust-api matrix_93_a_ava_001b_f007_post_profile_avatar_local_persists_avatar_url_on_get_me_app_stack_ok_pg` exit=0

```

running 1 test
test routes::me_profile_avatar_db_api_tests::matrix_93_a_ava_001b_f007_post_profile_avatar_local_persists_avatar_url_on_get_me_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1208 filtered out; finished in 0.42s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-273a4482d41a62c1.exe)
[req] x-request-id=c42659c4-577b-4117-8e39-a64a308d1b83 path=/auth/register status=200
[req] x-message-id=1e964f32-5d9b-4e01-8d00-a1360e6d2c00 path=/auth/register status=200
[req] x-request-id=f58f21a8-bd34-4dbc-b293-8625bba8c01f path=/api/v1/me/profile-avatar status=200
[req] x-message-id=19e68381-3114-49b5-9615-b9b169a97718 path=/api/v1/me/profile-avatar status=200
[req] x-request-id=4b1865d5-37d5-4722-ae62-69c8c4ed61ac path=/api/v1/me status=200
[req] x-message-id=f99150ed-d8f7-45c5-adf1-1dd2617068f5 path=/api/v1/me status=200

```
E2E: `frontend/e2e/f007-f010-f032-request.spec.ts` — F-007 · POST profile-avatar (local allow) then GET /me has avatar_url
