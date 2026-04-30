# A-AVA-001

`cargo test -p traveltrust-api matrix_93_a_ava_001b_f007_post_profile_avatar_local_persists_avatar_url_on_get_me_app_stack_ok_pg` exit=0

```

running 1 test
test routes::me_profile_avatar_db_api_tests::matrix_93_a_ava_001b_f007_post_profile_avatar_local_persists_avatar_url_on_get_me_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.61s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.26s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=ed54e5ad-3b74-44d2-836b-27ae6c52d96e path=/auth/register status=200
[req] x-message-id=bcb0b484-6150-4508-8145-07ddceaa8925 path=/auth/register status=200
[req] x-request-id=d00ee675-0192-4a47-b4c5-06a9e72c13b5 path=/api/v1/me/profile-avatar status=200
[req] x-message-id=182fbce0-a7f7-45ed-92ea-b7dd46e4a5db path=/api/v1/me/profile-avatar status=200
[req] x-request-id=e91cb6fe-1603-486b-b68d-a5c3029cf88a path=/api/v1/me status=200
[req] x-message-id=6e9622f4-5df2-4568-bb8a-91f39483a7f7 path=/api/v1/me status=200

```
E2E: `frontend/e2e/f007-f010-f032-request.spec.ts` — F-007 · POST profile-avatar (local allow) then GET /me has avatar_url
