# D-COM-008

`cargo test -p traveltrust-api matrix_93_d_com_008b_f017_post_collect_delete_recollect_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_008b_f017_post_collect_delete_recollect_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.15s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=19c3d393-4f35-4812-addf-c52d1d0ffab5 path=/api/v1/community/posts status=200
[req] x-message-id=d91cb9a5-e23c-451d-b4eb-b3056444e95a path=/api/v1/community/posts status=200
[req] x-request-id=c45cea73-2377-4d51-b320-987df55210b1 path=/api/v1/community/posts/017b878d-8c95-4ca6-9c7d-9a161009c60d/collect status=200
[req] x-message-id=5c1f7e39-7e84-4ed4-be5c-65820ce189da path=/api/v1/community/posts/017b878d-8c95-4ca6-9c7d-9a161009c60d/collect status=200
[req] x-request-id=92e161db-eb3f-4ad4-8246-f88c3dd24ffb path=/api/v1/community/posts/017b878d-8c95-4ca6-9c7d-9a161009c60d/collect status=200
[req] x-message-id=b34d7ea0-0f7d-4db2-b175-74cd70dfd10c path=/api/v1/community/posts/017b878d-8c95-4ca6-9c7d-9a161009c60d/collect status=200
[req] x-request-id=c1a35296-286a-4bbf-a735-5cd3e1714601 path=/api/v1/community/posts/017b878d-8c95-4ca6-9c7d-9a161009c60d/collect status=200
[req] x-message-id=8caa9639-5d98-4bae-a401-e4cbb1889bfb path=/api/v1/community/posts/017b878d-8c95-4ca6-9c7d-9a161009c60d/collect status=200

```
E2E: `frontend/e2e/f015-f016-f017-request.spec.ts` — F-017 · DELETE collect then GET collected_by_me false then POST collect recollect
