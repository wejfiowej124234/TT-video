# B-ORD-004

`cargo test -p traveltrust-api matrix_93_b_ord_004b_f008_patch_itinerary_then_get_detail_reflects_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_create_list_set_escrow_address_db_api_tests::matrix_93_b_ord_004b_f008_patch_itinerary_then_get_detail_reflects_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.03s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=17b8dcee-5167-4c89-8776-f211742ae6b3 path=/auth/register status=200
[req] x-message-id=f81efac7-f1f6-4c1c-90d1-9be0108ecdb2 path=/auth/register status=200
[req] x-request-id=7de28329-968e-4d99-8a01-fd5a90932a36 path=/auth/register status=200
[req] x-message-id=e79adab2-0ec9-4c9c-8229-23f2ff674d8b path=/auth/register status=200
[req] x-request-id=4dea6f2c-d10e-4680-83f8-d7278e67f323 path=/api/v1/guides status=200
[req] x-message-id=9f1cdca4-f052-42ab-9cfa-984a28c2194b path=/api/v1/guides status=200
[req] x-request-id=79c9fe6e-ab0e-4fc4-8f37-ec4e998dc2b5 path=/api/v1/guides/dc405748-e05d-46df-97c2-2a002ab049e1/stake status=200
[req] x-message-id=e3e7cc0d-075e-458c-a90c-fe4eef1cb0c7 path=/api/v1/guides/dc405748-e05d-46df-97c2-2a002ab049e1/stake status=200
[req] x-request-id=6a30e411-e394-4afe-862f-c531afc8528b path=/api/v1/orders status=200
[req] x-message-id=b1a17c12-4659-4971-8187-f47b703e2f38 path=/api/v1/orders status=200
audit_key_write op=patch_order_itinerary request_id=- user_id=661ccc82-9d2a-4529-b74b-cf458facee44 order_id=6a567b08-3f8a-40f9-a0f7-eece178603aa
[req] x-request-id=966f9bca-5435-461d-bc6d-996eb1fe9ed3 path=/api/v1/orders/6a567b08-3f8a-40f9-a0f7-eece178603aa/itinerary status=200
[req] x-message-id=5166ba37-8a82-413c-8a45-460431ab66b7 path=/api/v1/orders/6a567b08-3f8a-40f9-a0f7-eece178603aa/itinerary status=200
[req] x-request-id=73c1fd9e-a7e8-4b9c-95d6-1b5b1a155c2d path=/api/v1/orders/6a567b08-3f8a-40f9-a0f7-eece178603aa status=200
[req] x-message-id=1413aa05-c772-4008-a2c5-ed17691cb2de path=/api/v1/orders/6a567b08-3f8a-40f9-a0f7-eece178603aa status=200

```
E2E: `frontend/e2e/orders-b-domain-request.spec.ts` — F-008 · B-ORD-004 · PATCH …/orders/:id/itinerary then GET detail reflects
