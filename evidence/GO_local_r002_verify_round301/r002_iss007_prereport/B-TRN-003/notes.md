# B-TRN-003

`cargo test -p traveltrust-api matrix_93_b_trn_003b_f025_get_order_detail_disputed_after_open_dispute_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_trn_003b_f025_get_order_detail_disputed_after_open_dispute_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.07s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=dffb968b-a988-473a-9aa6-65376dc86961 path=/auth/register status=200
[req] x-message-id=62253f49-2cb4-4003-9adc-edd791636fde path=/auth/register status=200
[req] x-request-id=e48b1adf-446c-46ec-b4cf-059882c5e4cd path=/auth/register status=200
[req] x-message-id=46e8a433-7f25-4f04-8422-246a9622c674 path=/auth/register status=200
[req] x-request-id=d417105c-20fc-4214-8d66-cae5fbc5bda1 path=/api/v1/guides status=200
[req] x-message-id=14675f26-8b53-4cc9-b367-425306b8fde0 path=/api/v1/guides status=200
[req] x-request-id=5903dc5b-512b-4556-9ad6-a6c57159a8ac path=/api/v1/guides/c095bfe4-a9cf-46cd-9836-228a74dc3059/stake status=200
[req] x-message-id=d6e1a608-a868-4202-b20d-844e1f0e1643 path=/api/v1/guides/c095bfe4-a9cf-46cd-9836-228a74dc3059/stake status=200
[req] x-request-id=c4d84a09-dae0-42e0-87cb-a481d625483e path=/api/v1/orders status=200
[req] x-message-id=0c32f470-9ea8-41eb-a6eb-8526862f94fd path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=aa278673-62b3-4e4e-bcc8-f66e75138765 order_id=3d3fde0b-2035-403d-8c79-c2a9f7f09c8a
[req] x-request-id=5a8757c8-95f5-4b64-b47b-83e4990ba439 path=/api/v1/orders/3d3fde0b-2035-403d-8c79-c2a9f7f09c8a/accept status=200
[req] x-message-id=dfa6788b-8e10-4103-aceb-39da3afdae71 path=/api/v1/orders/3d3fde0b-2035-403d-8c79-c2a9f7f09c8a/accept status=200
[req] x-request-id=8264f97f-8a17-4dea-aad5-8a6ad33790c4 path=/api/v1/orders/3d3fde0b-2035-403d-8c79-c2a9f7f09c8a/mock-pay status=200
[req] x-message-id=f1692282-76c7-4f47-9ef9-eb387545b091 path=/api/v1/orders/3d3fde0b-2035-403d-8c79-c2a9f7f09c8a/mock-pay status=200
[req] x-request-id=6d81224c-dce3-49ee-b216-f5b246ad80bb path=/api/v1/orders/3d3fde0b-2035-403d-8c79-c2a9f7f09c8a status=200
[req] x-message-id=14270ab3-4ee4-4387-a256-6020cf35e643 path=/api/v1/orders/3d3fde0b-2035-403d-8c79-c2a9f7f09c8a status=200
[req] x-request-id=4e3812fe-da46-41d7-8bfc-e439658d1778 path=/api/v1/orders/3d3fde0b-2035-403d-8c79-c2a9f7f09c8a/dispute status=200
[req] x-message-id=30ed68ff-fac8-4a88-9933-af7b2d4b88d5 path=/api/v1/orders/3d3fde0b-2035-403d-8c79-c2a9f7f09c8a/dispute status=200
[req] x-request-id=7c09920e-01d8-4996-ace3-8e6191cdfac6 path=/api/v1/orders/3d3fde0b-2035-403d-8c79-c2a9f7f09c8a status=200
[req] x-message-id=4095e510-aee8-42b8-ba4b-965c780c2082 path=/api/v1/orders/3d3fde0b-2035-403d-8c79-c2a9f7f09c8a status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-025 · escrowed order open dispute then GET list and detail
