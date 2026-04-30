# A-AVA-001

`cargo test -p traveltrust-api matrix_93_a_ava_001b_f007_post_profile_avatar_local_persists_avatar_url_on_get_me_app_stack_ok_pg` exit=0

```

running 1 test
test routes::me_profile_avatar_db_api_tests::matrix_93_a_ava_001b_f007_post_profile_avatar_local_persists_avatar_url_on_get_me_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.60s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.40s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=14e287c4-7271-4c5e-bb81-ac61182052fd path=/auth/register status=200
[req] x-message-id=ab4425ed-081e-43cd-a04f-0ef746beeecf path=/auth/register status=200
[req] x-request-id=7d916fdd-a523-43de-9536-7995544f48aa path=/api/v1/me/profile-avatar status=200
[req] x-message-id=aa936098-718e-4d9c-9ebb-24f8c4c78900 path=/api/v1/me/profile-avatar status=200
[req] x-request-id=db141446-4112-45e2-9202-4104808c916a path=/api/v1/me status=200
[req] x-message-id=bc051046-58b9-448a-9e26-e5af810c5f9a path=/api/v1/me status=200

```
E2E: `frontend/e2e/f007-f010-f032-request.spec.ts` — F-007 · POST profile-avatar (local allow) then GET /me has avatar_url
