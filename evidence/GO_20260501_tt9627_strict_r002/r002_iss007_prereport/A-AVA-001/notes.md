# A-AVA-001

`cargo test -p traveltrust-api matrix_93_a_ava_001b_f007_post_profile_avatar_local_persists_avatar_url_on_get_me_app_stack_ok_pg` exit=0

```

running 1 test
test routes::me_profile_avatar_db_api_tests::matrix_93_a_ava_001b_f007_post_profile_avatar_local_persists_avatar_url_on_get_me_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1180 filtered out; finished in 0.58s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.29s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-21f06832b8f1b80b.exe)
[req] x-request-id=029d3449-b7ed-43c5-a031-815704057fe3 path=/auth/register status=200
[req] x-message-id=25c190db-0063-41fd-bf49-1b822f112260 path=/auth/register status=200
[req] x-request-id=aed621d7-9ecb-4a2c-a701-1791767ef668 path=/api/v1/me/profile-avatar status=200
[req] x-message-id=f6e8e812-df98-442c-95bf-c9731e564cfc path=/api/v1/me/profile-avatar status=200
[req] x-request-id=c0d063c9-9a86-498b-9c04-2760015667e2 path=/api/v1/me status=200
[req] x-message-id=9bbde803-219c-47b1-8aaf-ce121272c166 path=/api/v1/me status=200

```
E2E: `frontend/e2e/f007-f010-f032-request.spec.ts` — F-007 · POST profile-avatar (local allow) then GET /me has avatar_url
