# B-ESC-003

`cargo test -p traveltrust-api matrix_93_b_esc_005b_f027_dual_reviews_after_completed_get_list_len_two_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_esc_005b_f027_dual_reviews_after_completed_get_list_len_two_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1180 filtered out; finished in 1.09s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.30s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-21f06832b8f1b80b.exe)
[req] x-request-id=583ba330-7b09-4bba-a5f8-2b2d1e7a5521 path=/auth/register status=200
[req] x-message-id=46758a6f-275c-470c-b7ee-9c3b7ae18d18 path=/auth/register status=200
[req] x-request-id=6e5b8373-2232-47b1-9e12-7445c3dcb60f path=/auth/register status=200
[req] x-message-id=8319067e-58e4-4857-b057-53f218c3747c path=/auth/register status=200
[req] x-request-id=0a8cd824-1639-4a25-b035-fd69ddb36a54 path=/api/v1/guides status=200
[req] x-message-id=2b1ad4de-0b6d-444b-a9ed-859f933e91aa path=/api/v1/guides status=200
[req] x-request-id=fbd4f7e0-10e1-4e23-b8a5-220df9dbad57 path=/api/v1/guides/5dcb0c70-cf16-41d3-b133-53aa64203b28/stake status=200
[req] x-message-id=6b2ef9cc-acef-4eb5-a488-e17bef313854 path=/api/v1/guides/5dcb0c70-cf16-41d3-b133-53aa64203b28/stake status=200
[req] x-request-id=02803b4a-57ca-4e6c-b087-90084893cc0b path=/api/v1/orders status=200
[req] x-message-id=fcd3c166-4f03-4891-8213-405363b99243 path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=9188c701-7acd-419f-8012-6921381d2acc order_id=1c2ec1db-11e2-4bf8-ba01-5cc7b1aaba07
[req] x-request-id=ef63f0ea-52e5-41ad-ac9f-d3daa71c75f2 path=/api/v1/orders/1c2ec1db-11e2-4bf8-ba01-5cc7b1aaba07/accept status=200
[req] x-message-id=a0d0636e-e819-4731-b2cb-163f0033abaa path=/api/v1/orders/1c2ec1db-11e2-4bf8-ba01-5cc7b1aaba07/accept status=200
[req] x-request-id=46c707a0-8565-432d-97be-59c143bae01b path=/api/v1/orders/1c2ec1db-11e2-4bf8-ba01-5cc7b1aaba07/mock-pay status=200
[req] x-message-id=4c60d3f3-64d4-4f66-b100-14c4b1f8126d path=/api/v1/orders/1c2ec1db-11e2-4bf8-ba01-5cc7b1aaba07/mock-pay status=200
[req] x-request-id=d95e1425-bf9f-4d41-a257-9bff18f27264 path=/api/v1/orders/1c2ec1db-11e2-4bf8-ba01-5cc7b1aaba07 status=200
[req] x-message-id=679a4e58-80e2-414a-8fd9-2ca5419818cc path=/api/v1/orders/1c2ec1db-11e2-4bf8-ba01-5cc7b1aaba07 status=200
[req] x-request-id=72ceeaf5-c559-400c-9dac-9c46ce8f42b0 path=/api/v1/orders/1c2ec1db-11e2-4bf8-ba01-5cc7b1aaba07/confirm-completion status=200
[req] x-message-id=1214b1da-5099-4684-a86d-a7d1112c7d6b path=/api/v1/orders/1c2ec1db-11e2-4bf8-ba01-5cc7b1aaba07/confirm-completion status=200
[req] x-request-id=5433a8ef-5d6d-43b6-a22a-5e1980547af0 path=/api/v1/orders/1c2ec1db-11e2-4bf8-ba01-5cc7b1aaba07 status=200
[req] x-message-id=fc99ff6d-ce4e-402b-b65e-8195b30abc1c path=/api/v1/orders/1c2ec1db-11e2-4bf8-ba01-5cc7b1aaba07 status=200
[audit] db insert_review failed review_id=ff6e5e15-5ee3-4625-93d3-6814a00c77f6 error=error returned from database: insert or update on table "reviews" violates foreign key constraint "reviews_reviewee_id_fkey"
[req] x-request-id=325979ef-1ebe-47b9-a14c-122df116e79d path=/api/v1/orders/1c2ec1db-11e2-4bf8-ba01-5cc7b1aaba07/reviews status=200
[req] x-message-id=b7b0fc79-2167-4df5-b73a-70f594a829c2 path=/api/v1/orders/1c2ec1db-11e2-4bf8-ba01-5cc7b1aaba07/reviews status=200
[req] x-request-id=2aacad40-aab8-4db2-a52e-8ae948ff9b98 path=/api/v1/orders/1c2ec1db-11e2-4bf8-ba01-5cc7b1aaba07/reviews status=200
[req] x-message-id=2d34bfa4-f82f-42eb-8a6c-3e499a73ae2d path=/api/v1/orders/1c2ec1db-11e2-4bf8-ba01-5cc7b1aaba07/reviews status=200
[req] x-request-id=50d8afbe-3917-4dac-a3c2-22bd332bfa5f path=/api/v1/orders/1c2ec1db-11e2-4bf8-ba01-5cc7b1aaba07/reviews status=200
[req] x-message-id=4fb0340e-ccfb-4140-9731-db04819b1f62 path=/api/v1/orders/1c2ec1db-11e2-4bf8-ba01-5cc7b1aaba07/reviews status=200

```
E2E: `frontend/e2e/f027-f028-f033-request.spec.ts` — F-027 · completed order dual POST reviews then GET list len 2
