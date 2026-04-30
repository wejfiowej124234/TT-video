# A-AVA-001

`cargo test -p traveltrust-api matrix_93_a_ava_001b_f007_post_profile_avatar_local_persists_avatar_url_on_get_me_app_stack_ok_pg` exit=0

```

running 1 test
test routes::me_profile_avatar_db_api_tests::matrix_93_a_ava_001b_f007_post_profile_avatar_local_persists_avatar_url_on_get_me_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.72s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=077de8f2-cbfd-4dc0-b6ae-c927520b4a8c path=/auth/register status=200
[req] x-message-id=142c6d8a-73fc-4463-aa68-d6b15d7a5dfd path=/auth/register status=200
[req] x-request-id=def93668-06da-402d-83e8-5162590b3467 path=/api/v1/me/profile-avatar status=200
[req] x-message-id=a40aa14f-e94a-4877-b112-8c91d167ac00 path=/api/v1/me/profile-avatar status=200
[req] x-request-id=62e74262-f730-489f-b5da-3ad795071303 path=/api/v1/me status=200
[req] x-message-id=2aa449f1-453d-4d25-aadb-f3e82568bb75 path=/api/v1/me status=200

```
E2E: `frontend/e2e/f007-f010-f032-request.spec.ts` — F-007 · POST profile-avatar (local allow) then GET /me has avatar_url
