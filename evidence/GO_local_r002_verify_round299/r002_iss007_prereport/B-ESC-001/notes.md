# B-ESC-001

`cargo test -p traveltrust-api matrix_93_b_esc_001b_f010_mock_pay_then_get_order_escrowed_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_esc_001b_f010_mock_pay_then_get_order_escrowed_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.17s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=6ca2217e-506b-4c09-9e17-f569b88b1396 path=/auth/register status=200
[req] x-message-id=a5e5dc04-d14f-496c-851c-5c6a98607d0a path=/auth/register status=200
[req] x-request-id=7a03f8e1-780a-4cc1-a9e1-a7ce72192c31 path=/auth/register status=200
[req] x-message-id=0b8045aa-4d13-4852-91d5-03d147017441 path=/auth/register status=200
[req] x-request-id=dc47a822-3195-4742-a8b8-d83e516082ed path=/api/v1/guides status=200
[req] x-message-id=4384d114-cc28-4c1d-b1e8-509f4d328f22 path=/api/v1/guides status=200
[req] x-request-id=155e0cb8-267a-4ba9-9f38-fffa922c4f8d path=/api/v1/guides/19033ffd-1a2d-49e4-a2a0-977fbb1636e0/stake status=200
[req] x-message-id=159e6fe5-5f22-479f-a448-dede52f057ba path=/api/v1/guides/19033ffd-1a2d-49e4-a2a0-977fbb1636e0/stake status=200
[req] x-request-id=beb9120a-2131-429f-9258-69f7d519b90e path=/api/v1/orders status=200
[req] x-message-id=f0d53926-993b-46de-a0b8-6d56ef654904 path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=a4c6b2ba-7dd1-4da4-9c02-3589fc3b05ca order_id=4e01da3e-14af-44eb-88b9-91e9a7460dee
[req] x-request-id=e1370df6-814a-4f24-b022-31291b824adc path=/api/v1/orders/4e01da3e-14af-44eb-88b9-91e9a7460dee/accept status=200
[req] x-message-id=e7290ffe-c510-453b-b244-d1e506bfd802 path=/api/v1/orders/4e01da3e-14af-44eb-88b9-91e9a7460dee/accept status=200
[req] x-request-id=f7651b61-8d29-474c-abdf-b456270ef291 path=/api/v1/orders/4e01da3e-14af-44eb-88b9-91e9a7460dee/mock-pay status=200
[req] x-message-id=e9f993a7-2ea7-48b9-848b-02f370005e41 path=/api/v1/orders/4e01da3e-14af-44eb-88b9-91e9a7460dee/mock-pay status=200
[req] x-request-id=b4522953-ba5b-421e-8807-229c814d9e5e path=/api/v1/orders/4e01da3e-14af-44eb-88b9-91e9a7460dee status=200
[req] x-message-id=2a12008d-110b-4058-b1ce-4e112c1af1a4 path=/api/v1/orders/4e01da3e-14af-44eb-88b9-91e9a7460dee status=200

```
E2E: `frontend/e2e/f007-f010-f032-request.spec.ts` — F-010 · accept then mock-pay leaves order escrowed (GET confirms)
