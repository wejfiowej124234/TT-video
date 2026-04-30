# B-ORD-004

`cargo test -p traveltrust-api matrix_93_b_ord_004b_f008_patch_itinerary_then_get_detail_reflects_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_create_list_set_escrow_address_db_api_tests::matrix_93_b_ord_004b_f008_patch_itinerary_then_get_detail_reflects_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.09s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=2809f32f-938d-4dfa-acc4-203ec24047ac path=/auth/register status=200
[req] x-message-id=4741d82b-95e2-4b31-9b6b-fa732f717a70 path=/auth/register status=200
[req] x-request-id=2af56584-a160-4b43-a934-87e7caea2847 path=/auth/register status=200
[req] x-message-id=efdcb88e-47e4-4635-bfc8-89ac6c92ef40 path=/auth/register status=200
[req] x-request-id=d938a792-28a8-4e85-a64f-a4846297200b path=/api/v1/guides status=200
[req] x-message-id=02ae4796-c7b1-47bd-be7b-2b960ad7c236 path=/api/v1/guides status=200
[req] x-request-id=959472e4-09b4-4f59-87aa-79bef57a8e33 path=/api/v1/guides/cbb384ef-1462-4d6a-8fee-101431ce8560/stake status=200
[req] x-message-id=c1a241f0-1175-49df-a57a-31d46186e783 path=/api/v1/guides/cbb384ef-1462-4d6a-8fee-101431ce8560/stake status=200
[req] x-request-id=e26739ca-8b11-42dd-8b55-731f41795039 path=/api/v1/orders status=200
[req] x-message-id=af0fa4e6-414a-4199-9055-9edcb5643529 path=/api/v1/orders status=200
audit_key_write op=patch_order_itinerary request_id=- user_id=4cdb4e90-62e2-4aec-a913-99ab75328c7a order_id=44957ca0-dcf7-4b20-a7d0-7a0ff393e303
[req] x-request-id=90c698ee-a03e-4006-ae33-7134d8526fcc path=/api/v1/orders/44957ca0-dcf7-4b20-a7d0-7a0ff393e303/itinerary status=200
[req] x-message-id=a8734c1e-fa56-4b5e-85f6-1d6b0a979583 path=/api/v1/orders/44957ca0-dcf7-4b20-a7d0-7a0ff393e303/itinerary status=200
[req] x-request-id=844b77f8-0599-4e46-a813-d436bca91fa0 path=/api/v1/orders/44957ca0-dcf7-4b20-a7d0-7a0ff393e303 status=200
[req] x-message-id=43ba8050-3780-4aa5-aa37-15791a00a7b8 path=/api/v1/orders/44957ca0-dcf7-4b20-a7d0-7a0ff393e303 status=200

```
E2E: `frontend/e2e/orders-b-domain-request.spec.ts` — F-008 · B-ORD-004 · PATCH …/orders/:id/itinerary then GET detail reflects
