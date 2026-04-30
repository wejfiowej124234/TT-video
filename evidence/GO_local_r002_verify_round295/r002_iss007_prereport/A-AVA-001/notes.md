# A-AVA-001

`cargo test -p traveltrust-api matrix_93_a_ava_001b_f007_post_profile_avatar_local_persists_avatar_url_on_get_me_app_stack_ok_pg` exit=0

```

running 1 test
test routes::me_profile_avatar_db_api_tests::matrix_93_a_ava_001b_f007_post_profile_avatar_local_persists_avatar_url_on_get_me_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.60s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=4c0f7ee1-2aad-40a5-98b2-a60b794a13de path=/auth/register status=200
[req] x-message-id=ae7c3ecc-b1f0-44da-aabf-01faa56b7e26 path=/auth/register status=200
[req] x-request-id=de6f7c89-d42f-40b8-9629-96663b8ac6e6 path=/api/v1/me/profile-avatar status=200
[req] x-message-id=14bb5385-e4b9-4475-b90e-1bfa6ad891aa path=/api/v1/me/profile-avatar status=200
[req] x-request-id=02f48db7-db1d-4fa2-bfb4-b65fbb0443e9 path=/api/v1/me status=200
[req] x-message-id=c4935256-bd24-4def-a7c9-9048b823e29e path=/api/v1/me status=200

```
E2E: `frontend/e2e/f007-f010-f032-request.spec.ts` — F-007 · POST profile-avatar (local allow) then GET /me has avatar_url
