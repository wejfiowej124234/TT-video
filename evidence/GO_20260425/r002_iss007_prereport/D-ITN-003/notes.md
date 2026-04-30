# D-ITN-003

`cargo test -p traveltrust-api matrix_93_d_itn_003b_f033_post_custom_draft_then_get_roundtrip_bearer_app_stack_ok_pg` exit=0

```

running 1 test
test routes::f031_f032_f033_app_http_db_api_tests::matrix_93_d_itn_003b_f033_post_custom_draft_then_get_roundtrip_bearer_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.11s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=b7b1da4c-5dd7-4348-b4fb-1bfc0e35b124 path=/api/v1/itineraries/custom/drafts status=200
[req] x-message-id=d64610c8-714b-4f00-a9a6-26869063df8a path=/api/v1/itineraries/custom/drafts status=200
[req] x-request-id=b755af6d-4c1c-4deb-afa0-310864c818c6 path=/api/v1/itineraries/custom/drafts/fa9e9c68-aa29-41cd-b37e-91edf5008fbd status=200
[req] x-message-id=1a3e59dc-6a11-4629-a72e-9d1fedc6804d path=/api/v1/itineraries/custom/drafts/fa9e9c68-aa29-41cd-b37e-91edf5008fbd status=200

```
E2E: `frontend/e2e/f027-f028-f033-request.spec.ts` — F-033 · POST custom itinerary then draft POST+GET round-trip
