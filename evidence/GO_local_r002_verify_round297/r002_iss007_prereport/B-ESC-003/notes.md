# B-ESC-003

`cargo test -p traveltrust-api matrix_93_b_esc_003c_f027_tourist_first_review_then_get_list_contains_comment_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::review_submit_db_pool_idempotent_contract::matrix_93_b_esc_003c_f027_tourist_first_review_then_get_list_contains_comment_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.13s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=bf3c5b94-50a0-4a16-bca9-c6c479fa2b29 path=/api/v1/orders/47aadb57-42fe-4779-8233-5127efe2bfa4/reviews status=200
[req] x-message-id=da119fed-2c91-4df3-b3ee-2f2188cf6970 path=/api/v1/orders/47aadb57-42fe-4779-8233-5127efe2bfa4/reviews status=200
[req] x-request-id=41db9e77-4caf-42c7-8244-29fc24dc8bed path=/api/v1/orders/47aadb57-42fe-4779-8233-5127efe2bfa4/reviews status=200
[req] x-message-id=66ee71fc-e587-48e6-a805-0b6de868337c path=/api/v1/orders/47aadb57-42fe-4779-8233-5127efe2bfa4/reviews status=200

```
E2E: `frontend/e2e/f027-f028-f033-request.spec.ts` — F-027 · completed order POST review then GET lists comment
