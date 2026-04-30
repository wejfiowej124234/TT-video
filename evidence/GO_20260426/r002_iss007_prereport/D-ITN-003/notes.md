# D-ITN-003

`cargo test -p traveltrust-api matrix_93_d_itn_003b_f033_post_custom_draft_then_get_roundtrip_bearer_app_stack_ok_pg` exit=0

```

running 1 test
test routes::f031_f032_f033_app_http_db_api_tests::matrix_93_d_itn_003b_f033_post_custom_draft_then_get_roundtrip_bearer_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1208 filtered out; finished in 0.12s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.25s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-273a4482d41a62c1.exe)
[req] x-request-id=835b5936-e9b5-4184-8901-badbedcdea0f path=/api/v1/itineraries/custom/drafts status=200
[req] x-message-id=3cabcc7d-b29f-410d-b453-c2b9ab43ddc9 path=/api/v1/itineraries/custom/drafts status=200
[req] x-request-id=847b049a-4f30-4394-a431-ac6b50fd0bda path=/api/v1/itineraries/custom/drafts/a79783a1-448d-437c-9eaf-dba62c929e3c status=200
[req] x-message-id=97c78f18-e2c0-4c58-8a43-b72c39c2bc3e path=/api/v1/itineraries/custom/drafts/a79783a1-448d-437c-9eaf-dba62c929e3c status=200

```
E2E: `frontend/e2e/f027-f028-f033-request.spec.ts` — F-033 · POST custom itinerary then draft POST+GET round-trip
