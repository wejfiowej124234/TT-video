# B-ORD-004

`cargo test -p traveltrust-api matrix_93_b_ord_004b_f008_patch_itinerary_then_get_detail_reflects_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_create_list_set_escrow_address_db_api_tests::matrix_93_b_ord_004b_f008_patch_itinerary_then_get_detail_reflects_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.07s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=e46f97d7-e90c-4aab-befb-dfa0ae248217 path=/auth/register status=200
[req] x-message-id=48b6f397-3c82-4129-ae47-07fbe8ed8e3a path=/auth/register status=200
[req] x-request-id=296e2ccd-b2a0-446d-9b5f-07a6d2ff5428 path=/auth/register status=200
[req] x-message-id=0a947905-3b6f-431c-976f-7ffa81a41f73 path=/auth/register status=200
[req] x-request-id=f0286d11-546e-4e39-a511-965c9c654d03 path=/api/v1/guides status=200
[req] x-message-id=2437b1e6-e877-4579-900f-1ad689c39262 path=/api/v1/guides status=200
[req] x-request-id=a202060f-d0c0-495d-b4c2-db65565f0719 path=/api/v1/guides/a0aa459e-2e79-4b31-b42f-75a203ecfb18/stake status=200
[req] x-message-id=ef25f4c1-c4f1-4640-a93d-d420627e318e path=/api/v1/guides/a0aa459e-2e79-4b31-b42f-75a203ecfb18/stake status=200
[req] x-request-id=9162cd83-d317-4047-b66d-f9bfe4e819c3 path=/api/v1/orders status=200
[req] x-message-id=2b65073e-c20c-402a-8acd-eadec913c961 path=/api/v1/orders status=200
audit_key_write op=patch_order_itinerary request_id=- user_id=1a391e30-3b5d-491c-adf1-b73c1240f93a order_id=4f26d3fa-831d-42f7-acb7-f463bc7df37d
[req] x-request-id=42b484a2-3288-4f51-8801-cdae03997ac9 path=/api/v1/orders/4f26d3fa-831d-42f7-acb7-f463bc7df37d/itinerary status=200
[req] x-message-id=37a8d3cf-c921-48a8-8031-5caa1da8529b path=/api/v1/orders/4f26d3fa-831d-42f7-acb7-f463bc7df37d/itinerary status=200
[req] x-request-id=0c6a5528-fbcd-4987-894f-834b684ac9ba path=/api/v1/orders/4f26d3fa-831d-42f7-acb7-f463bc7df37d status=200
[req] x-message-id=6e7a8c6e-c091-456c-add8-846e3889612d path=/api/v1/orders/4f26d3fa-831d-42f7-acb7-f463bc7df37d status=200

```
E2E: `frontend/e2e/orders-b-domain-request.spec.ts` — F-008 · B-ORD-004 · PATCH …/orders/:id/itinerary then GET detail reflects
