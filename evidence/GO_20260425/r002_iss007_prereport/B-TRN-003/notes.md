# B-TRN-003

`cargo test -p traveltrust-api matrix_93_b_trn_003b_f025_get_order_detail_disputed_after_open_dispute_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_trn_003b_f025_get_order_detail_disputed_after_open_dispute_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.05s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.25s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=3953f5e3-e4df-43b4-9a4c-f06e9d68b38c path=/auth/register status=200
[req] x-message-id=982ebd5a-e806-4f39-b5f9-4b030637690b path=/auth/register status=200
[req] x-request-id=b268ea15-aa84-4c17-8520-73b05213acf0 path=/auth/register status=200
[req] x-message-id=504f1d7a-efc8-43d7-87e0-0fc54cbcc34b path=/auth/register status=200
[req] x-request-id=2f58bfc6-3c05-41b4-894d-c77a5c1ef40b path=/api/v1/guides status=200
[req] x-message-id=a846e3a5-b498-473e-95a6-d2e5b93587a4 path=/api/v1/guides status=200
[req] x-request-id=9d6fff34-d54e-4274-96d3-2a0b2373ec10 path=/api/v1/guides/a2674ceb-a36e-4e6a-a51f-c132725e5e79/stake status=200
[req] x-message-id=9adecdac-9530-440b-bb4a-08266c320365 path=/api/v1/guides/a2674ceb-a36e-4e6a-a51f-c132725e5e79/stake status=200
[req] x-request-id=314d8ade-3c56-4bde-bc21-89b49e794799 path=/api/v1/orders status=200
[req] x-message-id=2e941da5-b522-47b4-8674-d802921c3efd path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=c385ecaa-3454-4337-886e-4d57bbf91be6 order_id=66f864d1-98b6-481d-83e7-19654bb75017
[req] x-request-id=16d30407-3d10-4fa2-8c7d-56489430b348 path=/api/v1/orders/66f864d1-98b6-481d-83e7-19654bb75017/accept status=200
[req] x-message-id=d5db437b-24d1-453e-af5e-1f5a11b43036 path=/api/v1/orders/66f864d1-98b6-481d-83e7-19654bb75017/accept status=200
[req] x-request-id=0d2245ec-644d-4d4f-93da-f7128ba5c4c0 path=/api/v1/orders/66f864d1-98b6-481d-83e7-19654bb75017/mock-pay status=200
[req] x-message-id=6ad48574-6eef-4d5e-8dcb-fd4808dd1492 path=/api/v1/orders/66f864d1-98b6-481d-83e7-19654bb75017/mock-pay status=200
[req] x-request-id=dc405983-0071-4bf8-84af-9e47ef3b33a5 path=/api/v1/orders/66f864d1-98b6-481d-83e7-19654bb75017 status=200
[req] x-message-id=337e96d0-d974-4505-bdc3-3d5f0a015665 path=/api/v1/orders/66f864d1-98b6-481d-83e7-19654bb75017 status=200
[req] x-request-id=eaadaf57-9d6f-48e1-999f-7cabd330d3ed path=/api/v1/orders/66f864d1-98b6-481d-83e7-19654bb75017/dispute status=200
[req] x-message-id=240821f3-fa2a-4615-8356-2b97802873c8 path=/api/v1/orders/66f864d1-98b6-481d-83e7-19654bb75017/dispute status=200
[req] x-request-id=95bdd7ab-bcd3-4104-95a7-e443d33100d0 path=/api/v1/orders/66f864d1-98b6-481d-83e7-19654bb75017 status=200
[req] x-message-id=959b6dba-8e5d-453d-9789-23bfed03a10e path=/api/v1/orders/66f864d1-98b6-481d-83e7-19654bb75017 status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-025 · escrowed order open dispute then GET list and detail
