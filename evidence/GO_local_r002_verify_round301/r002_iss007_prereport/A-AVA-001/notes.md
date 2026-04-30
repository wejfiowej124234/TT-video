# A-AVA-001

`cargo test -p traveltrust-api matrix_93_a_ava_001b_f007_post_profile_avatar_local_persists_avatar_url_on_get_me_app_stack_ok_pg` exit=0

```

running 1 test
test routes::me_profile_avatar_db_api_tests::matrix_93_a_ava_001b_f007_post_profile_avatar_local_persists_avatar_url_on_get_me_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.60s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=f44259c1-247a-43bf-8cf7-702bd205eb4c path=/auth/register status=200
[req] x-message-id=0dccb03c-5789-446b-a9ad-8ddcf8f9ba92 path=/auth/register status=200
[req] x-request-id=7fe7cd5f-3e68-4a08-a248-a6b06fc2f10b path=/api/v1/me/profile-avatar status=200
[req] x-message-id=71b72004-a6b7-42e3-b161-063e64cb7231 path=/api/v1/me/profile-avatar status=200
[req] x-request-id=e0fbb665-08d4-42af-a8e4-388bce948371 path=/api/v1/me status=200
[req] x-message-id=5ec82d4e-ce9b-46de-958b-c9055275a5d2 path=/api/v1/me status=200

```
E2E: `frontend/e2e/f007-f010-f032-request.spec.ts` — F-007 · POST profile-avatar (local allow) then GET /me has avatar_url
