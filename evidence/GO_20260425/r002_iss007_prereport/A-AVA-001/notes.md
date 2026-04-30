# A-AVA-001

`cargo test -p traveltrust-api matrix_93_a_ava_001b_f007_post_profile_avatar_local_persists_avatar_url_on_get_me_app_stack_ok_pg` exit=0

```

running 1 test
test routes::me_profile_avatar_db_api_tests::matrix_93_a_ava_001b_f007_post_profile_avatar_local_persists_avatar_url_on_get_me_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.62s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.26s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=19a420be-1a93-4395-9af9-12be78cae394 path=/auth/register status=200
[req] x-message-id=11fae05a-a46c-475a-b318-c43a85ff259f path=/auth/register status=200
[req] x-request-id=de35f55c-650e-4a99-8a02-1259c70643b9 path=/api/v1/me/profile-avatar status=200
[req] x-message-id=7d457b22-a0df-4399-a49e-9786241e7419 path=/api/v1/me/profile-avatar status=200
[req] x-request-id=b115b530-6d59-4f2e-a4ae-fd4c76078b5e path=/api/v1/me status=200
[req] x-message-id=7ec7077a-aeed-4145-8754-be7751e8f65e path=/api/v1/me status=200

```
E2E: `frontend/e2e/f007-f010-f032-request.spec.ts` — F-007 · POST profile-avatar (local allow) then GET /me has avatar_url
