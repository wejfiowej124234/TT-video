# B-ESC-003

`cargo test -p traveltrust-api matrix_93_b_esc_003c_f027_tourist_first_review_then_get_list_contains_comment_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::review_submit_db_pool_idempotent_contract::matrix_93_b_esc_003c_f027_tourist_first_review_then_get_list_contains_comment_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.12s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=d9b2a8d0-8e73-4187-9aa2-2904e57bcb00 path=/api/v1/orders/3babffd6-31b5-4cf2-b2a1-f35360b7c0f5/reviews status=200
[req] x-message-id=0b1e9d3d-4ee6-41ee-a44c-05f20e39b283 path=/api/v1/orders/3babffd6-31b5-4cf2-b2a1-f35360b7c0f5/reviews status=200
[req] x-request-id=08fa5407-0ff2-4764-b776-e558d16094b8 path=/api/v1/orders/3babffd6-31b5-4cf2-b2a1-f35360b7c0f5/reviews status=200
[req] x-message-id=1d53a8db-0cf8-4890-9ead-fac20e597e23 path=/api/v1/orders/3babffd6-31b5-4cf2-b2a1-f35360b7c0f5/reviews status=200

```
E2E: `frontend/e2e/f027-f028-f033-request.spec.ts` — F-027 · completed order POST review then GET lists comment
