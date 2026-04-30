# B-GDE-003

`cargo test -p traveltrust-api matrix_93_b_gde_003b_f024_stake_post_persists_guide_row_active_app_stack_ok_pg` exit=0

```

running 1 test
test routes::guides_disputes_db_api_tests::matrix_93_b_gde_003b_f024_stake_post_persists_guide_row_active_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1208 filtered out; finished in 0.12s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.25s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-273a4482d41a62c1.exe)
[req] x-request-id=111c6709-ef34-4fa7-83f2-4bea17b2f6e9 path=/api/v1/guides status=200
[req] x-message-id=ad0143db-22e5-42f5-9023-ba773def6644 path=/api/v1/guides status=200
[req] x-request-id=9c89aa4c-6b24-4a7c-bcda-f244dfb81758 path=/api/v1/guides/1fedc5a3-8127-4bd5-8884-dff2f2c9d55f/stake status=200
[req] x-message-id=f62a8d69-46a7-4e82-8245-f69e1308c7b7 path=/api/v1/guides/1fedc5a3-8127-4bd5-8884-dff2f2c9d55f/stake status=200
[req] x-request-id=0e1a3d54-26a7-4ff9-9f11-fcf1fd30d412 path=/api/v1/guides status=200
[req] x-message-id=4a13bbd7-a4cb-45bb-b547-35fe74d022b9 path=/api/v1/guides status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-024 · stake then GET guides list includes active guide
