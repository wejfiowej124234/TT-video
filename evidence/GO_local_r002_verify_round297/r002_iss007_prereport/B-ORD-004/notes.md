# B-ORD-004

`cargo test -p traveltrust-api matrix_93_b_ord_004b_f008_patch_itinerary_then_get_detail_reflects_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_create_list_set_escrow_address_db_api_tests::matrix_93_b_ord_004b_f008_patch_itinerary_then_get_detail_reflects_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.05s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=7d4887ea-bf35-4b55-a139-1f1bc645e2d6 path=/auth/register status=200
[req] x-message-id=743b5752-3335-4c6f-b6f3-9a134203f7d1 path=/auth/register status=200
[req] x-request-id=0be9b849-e8f2-4d59-b7b8-50422f1fd054 path=/auth/register status=200
[req] x-message-id=52658ebf-e89c-480f-931e-24eff6c77ca6 path=/auth/register status=200
[req] x-request-id=d440e8fc-d9f4-490d-acba-13f39ea5a7f1 path=/api/v1/guides status=200
[req] x-message-id=5a5f79c3-6b9d-4971-b8a0-a27b28a8154d path=/api/v1/guides status=200
[req] x-request-id=e74223a7-039f-4ca6-a9da-a16764b5f3b3 path=/api/v1/guides/359ac1f9-ff9e-4740-b8bb-1a1e387fbdb5/stake status=200
[req] x-message-id=f676a1f1-3112-43ae-9992-9cbacfd849db path=/api/v1/guides/359ac1f9-ff9e-4740-b8bb-1a1e387fbdb5/stake status=200
[req] x-request-id=156a4264-63e2-47fe-9212-3fd619d7370f path=/api/v1/orders status=200
[req] x-message-id=0c90c163-1691-4a33-8a0a-995a0c6c8fcd path=/api/v1/orders status=200
audit_key_write op=patch_order_itinerary request_id=- user_id=0d67073f-3dea-4070-b698-8233a7e485f7 order_id=c9627bcb-daa5-4cfe-a914-2625f52d50d8
[req] x-request-id=c8ec9fed-e9c0-4a6d-9149-5f279bf41d93 path=/api/v1/orders/c9627bcb-daa5-4cfe-a914-2625f52d50d8/itinerary status=200
[req] x-message-id=385f5934-3cf0-46d0-b009-f025e789deef path=/api/v1/orders/c9627bcb-daa5-4cfe-a914-2625f52d50d8/itinerary status=200
[req] x-request-id=a63e261e-ac54-412b-8ee4-576b38e10f51 path=/api/v1/orders/c9627bcb-daa5-4cfe-a914-2625f52d50d8 status=200
[req] x-message-id=2478573a-14e3-406b-b37a-4a6334d7e7b2 path=/api/v1/orders/c9627bcb-daa5-4cfe-a914-2625f52d50d8 status=200

```
E2E: `frontend/e2e/orders-b-domain-request.spec.ts` — F-008 · B-ORD-004 · PATCH …/orders/:id/itinerary then GET detail reflects
