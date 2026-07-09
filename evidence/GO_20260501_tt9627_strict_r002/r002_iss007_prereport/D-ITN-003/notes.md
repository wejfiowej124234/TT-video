# D-ITN-003

`cargo test -p traveltrust-api matrix_93_d_itn_003b_f033_post_custom_draft_then_get_roundtrip_bearer_app_stack_ok_pg` exit=0

```

running 1 test
test routes::f031_f032_f033_app_http_db_api_tests::matrix_93_d_itn_003b_f033_post_custom_draft_then_get_roundtrip_bearer_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1180 filtered out; finished in 0.15s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.30s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-21f06832b8f1b80b.exe)
[req] x-request-id=44ef9b5e-73a4-4798-a13e-7da309f874f6 path=/api/v1/itineraries/custom/drafts status=200
[req] x-message-id=d44d7ed3-2c8e-40b0-83a0-9df606db9963 path=/api/v1/itineraries/custom/drafts status=200
[req] x-request-id=47d66c6c-c841-46f3-a67a-30764ffc1e57 path=/api/v1/itineraries/custom/drafts/fbbbdf63-8cfe-47ba-bec6-a1c68ba3d41a status=200
[req] x-message-id=8144b365-1328-4c0c-8b1f-f6b4eaa5e717 path=/api/v1/itineraries/custom/drafts/fbbbdf63-8cfe-47ba-bec6-a1c68ba3d41a status=200

```
E2E: `frontend/e2e/f027-f028-f033-request.spec.ts` — F-033 · POST custom itinerary then draft POST+GET round-trip
