# B-ESC-003

`cargo test -p traveltrust-api matrix_93_b_esc_003c_f027_tourist_first_review_then_get_list_contains_comment_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::review_submit_db_pool_idempotent_contract::matrix_93_b_esc_003c_f027_tourist_first_review_then_get_list_contains_comment_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.12s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=1b51c576-9b49-421c-86a6-aeaea69862f0 path=/api/v1/orders/899ed163-5554-484d-8f4a-eedd98a74a70/reviews status=200
[req] x-message-id=44861a63-b5b4-42c6-b854-dd7257ce1fb9 path=/api/v1/orders/899ed163-5554-484d-8f4a-eedd98a74a70/reviews status=200
[req] x-request-id=1537c148-ad5f-4691-baa1-32af993b49d7 path=/api/v1/orders/899ed163-5554-484d-8f4a-eedd98a74a70/reviews status=200
[req] x-message-id=61a3cb4c-eba0-460f-9495-4d3471121364 path=/api/v1/orders/899ed163-5554-484d-8f4a-eedd98a74a70/reviews status=200

```
E2E: `frontend/e2e/f027-f028-f033-request.spec.ts` — F-027 · completed order POST review then GET lists comment
