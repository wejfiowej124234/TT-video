# A-AVA-001

`cargo test -p traveltrust-api matrix_93_a_ava_001b_f007_post_profile_avatar_local_persists_avatar_url_on_get_me_app_stack_ok_pg` exit=0

```

running 1 test
test routes::me_profile_avatar_db_api_tests::matrix_93_a_ava_001b_f007_post_profile_avatar_local_persists_avatar_url_on_get_me_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.61s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=16e4d336-cdb9-426a-9127-9892ef189182 path=/auth/register status=200
[req] x-message-id=93d6a7b2-def0-4bb9-b125-163b29e6745f path=/auth/register status=200
[req] x-request-id=32683676-77b5-46bc-836d-1e7667b965e6 path=/api/v1/me/profile-avatar status=200
[req] x-message-id=1705b40a-c1ec-4b0a-8be1-f729ba8febd8 path=/api/v1/me/profile-avatar status=200
[req] x-request-id=c58863f0-901a-443f-9326-748fad603d1d path=/api/v1/me status=200
[req] x-message-id=35ae52cd-66e0-4967-810e-ce3f71277214 path=/api/v1/me status=200

```
E2E: `frontend/e2e/f007-f010-f032-request.spec.ts` — F-007 · POST profile-avatar (local allow) then GET /me has avatar_url
