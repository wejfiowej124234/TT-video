# B-DSP-001

`cargo test -p traveltrust-api matrix_93_b_dsp_001b_f025_post_order_dispute_then_list_contains_dispute_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_dsp_001b_f025_post_order_dispute_then_list_contains_dispute_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.05s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=ff239e7f-eade-45b5-9d8d-4ce4258c4ed2 path=/auth/register status=200
[req] x-message-id=6186380a-1760-4b52-8956-f0435d6c3ddc path=/auth/register status=200
[req] x-request-id=93492a88-5a99-445a-8079-8dba024fab4c path=/auth/register status=200
[req] x-message-id=37506f57-e132-4281-aca1-6a13f3ce3017 path=/auth/register status=200
[req] x-request-id=cf61cdc8-38e2-49c7-9a88-d8eff64fbc27 path=/api/v1/guides status=200
[req] x-message-id=09e76329-a8d9-4f25-a7ab-3127f17a103c path=/api/v1/guides status=200
[req] x-request-id=72830a27-468d-47fb-802d-b34e5fd4e39a path=/api/v1/guides/039176af-290d-40b5-bf85-c0dc3aacbdec/stake status=200
[req] x-message-id=de98ec0c-8a32-4b97-a43e-6267942f74d5 path=/api/v1/guides/039176af-290d-40b5-bf85-c0dc3aacbdec/stake status=200
[req] x-request-id=aff51298-a41a-4a78-b0b3-ce73fa92ef81 path=/api/v1/orders status=200
[req] x-message-id=1e6a2d11-2336-4cd4-8d81-144d50de952b path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=992d87d4-6a25-43c3-94f7-5a7967d5bf08 order_id=e81f985a-205d-4b38-8327-c655dc2f0337
[req] x-request-id=4d9ed4e5-c182-4c8d-985b-030fff93783a path=/api/v1/orders/e81f985a-205d-4b38-8327-c655dc2f0337/accept status=200
[req] x-message-id=373178fb-5204-4780-99bb-afdd8d47b975 path=/api/v1/orders/e81f985a-205d-4b38-8327-c655dc2f0337/accept status=200
[req] x-request-id=e45bc27f-b8b3-44fc-828a-83507943a901 path=/api/v1/orders/e81f985a-205d-4b38-8327-c655dc2f0337/mock-pay status=200
[req] x-message-id=31ad9b7a-21ab-4145-9a23-070006e427d9 path=/api/v1/orders/e81f985a-205d-4b38-8327-c655dc2f0337/mock-pay status=200
[req] x-request-id=ecc68afd-6000-4ec9-a18a-988570b6268f path=/api/v1/orders/e81f985a-205d-4b38-8327-c655dc2f0337 status=200
[req] x-message-id=f80212b4-35ec-4716-8206-8cd23193a117 path=/api/v1/orders/e81f985a-205d-4b38-8327-c655dc2f0337 status=200
[req] x-request-id=8f0f0f9f-187c-4a71-b5f5-e3ffa7b0efd1 path=/api/v1/orders/e81f985a-205d-4b38-8327-c655dc2f0337/dispute status=200
[req] x-message-id=8a6b6299-3705-4c89-b350-a8db164cecb5 path=/api/v1/orders/e81f985a-205d-4b38-8327-c655dc2f0337/dispute status=200
[req] x-request-id=28520374-6c4b-485a-9311-41e2402d9186 path=/api/v1/disputes status=200
[req] x-message-id=0421d7fc-239e-4647-89cb-ce649244a3db path=/api/v1/disputes status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-025 · B-DSP-001 · mock-pay→POST …/dispute→GET /disputes contains row (PG)
