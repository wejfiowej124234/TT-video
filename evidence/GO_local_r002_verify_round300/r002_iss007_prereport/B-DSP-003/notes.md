# B-DSP-003

`cargo test -p traveltrust-api matrix_93_b_dsp_003b_f025_post_dispute_resolve_then_pg_status_resolved_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_dsp_003b_f025_post_dispute_resolve_then_pg_status_resolved_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.51s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=3d98d70d-b29e-429f-a4cf-09555e6f0e2d path=/auth/register status=200
[req] x-message-id=a95d97b6-c73f-44ec-b57d-5ea9345ba0d1 path=/auth/register status=200
[req] x-request-id=6be054d8-cdcb-4884-b562-7289baba47a0 path=/auth/register status=200
[req] x-message-id=64e635e6-f799-4016-b113-3086c60ccad2 path=/auth/register status=200
[req] x-request-id=ffc4c061-9664-4894-9f24-832910fc1dde path=/api/v1/guides status=200
[req] x-message-id=7280d044-d81f-4193-a0a2-4f36d0f7f624 path=/api/v1/guides status=200
[req] x-request-id=b9eaf513-873f-4c10-a35e-b208f9095bc8 path=/api/v1/guides/886933e4-e876-4dbd-ab89-9da9cf23505b/stake status=200
[req] x-message-id=40303b84-e8ea-4544-9db9-b96e81315a12 path=/api/v1/guides/886933e4-e876-4dbd-ab89-9da9cf23505b/stake status=200
[req] x-request-id=fe8afe52-f138-4f5d-a562-c9fd171eab41 path=/api/v1/orders status=200
[req] x-message-id=f37af938-85f8-4817-a164-a6d4c5ff48fb path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=0550d164-ce1d-41c9-aa93-6aaa2746be2c order_id=fa0ad35c-1aca-4eca-909c-994f9a9f9d27
[req] x-request-id=0a5d35e0-637f-4b15-8b9d-e31280f2be98 path=/api/v1/orders/fa0ad35c-1aca-4eca-909c-994f9a9f9d27/accept status=200
[req] x-message-id=24ceb3f5-9c5b-43b7-b7b3-7a50be153cc4 path=/api/v1/orders/fa0ad35c-1aca-4eca-909c-994f9a9f9d27/accept status=200
[req] x-request-id=278d1a5e-1092-463c-96a6-2b8a103c1f5f path=/api/v1/orders/fa0ad35c-1aca-4eca-909c-994f9a9f9d27/mock-pay status=200
[req] x-message-id=1899004f-1ede-4c18-b06e-7b15c78e24bf path=/api/v1/orders/fa0ad35c-1aca-4eca-909c-994f9a9f9d27/mock-pay status=200
[req] x-request-id=01b7bf09-204b-4d5f-adb8-fd397deea149 path=/api/v1/orders/fa0ad35c-1aca-4eca-909c-994f9a9f9d27 status=200
[req] x-message-id=d66bfd1f-2fcb-4fdb-b9d3-612664fe7c8f path=/api/v1/orders/fa0ad35c-1aca-4eca-909c-994f9a9f9d27 status=200
[req] x-request-id=1ec87e1d-1e24-4e36-88ba-d2e6757d89f2 path=/api/v1/orders/fa0ad35c-1aca-4eca-909c-994f9a9f9d27/dispute status=200
[req] x-message-id=5b199cff-4c79-45b2-b950-ca1634e5efd5 path=/api/v1/orders/fa0ad35c-1aca-4eca-909c-994f9a9f9d27/dispute status=200
[req] x-request-id=0d710e90-cf7e-49b6-b112-3b20a1611584 path=/auth/register status=200
[req] x-message-id=3912789f-fd62-4e64-b91d-e80b38fe125c path=/auth/register status=200
[req] x-request-id=67fd71e3-647c-4a18-8bf4-5cea29ac4f21 path=/api/v1/disputes/291d5f1b-40f8-4278-a3b2-c901484fdf3c/resolve status=200
[req] x-message-id=c476425d-fb8c-4463-a7bd-fb208d9efcfe path=/api/v1/disputes/291d5f1b-40f8-4278-a3b2-c901484fdf3c/resolve status=200
[req] x-request-id=88268792-cde8-4e0c-8b20-e7942d572864 path=/api/v1/disputes/291d5f1b-40f8-4278-a3b2-c901484fdf3c status=200
[req] x-message-id=f01b2b08-14cf-430d-a57c-f886e2bf4c22 path=/api/v1/disputes/291d5f1b-40f8-4278-a3b2-c901484fdf3c status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-025 · B-DSP-003 · seed arbitrator POST …/disputes/:id/resolve → resolved (PG)
