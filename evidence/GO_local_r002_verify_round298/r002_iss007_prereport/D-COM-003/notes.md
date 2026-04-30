# D-COM-003

`cargo test -p traveltrust-api matrix_93_d_com_003b_f016_post_like_delete_relike_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_003b_f016_post_like_delete_relike_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.14s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=5553d715-6863-4722-beff-0ddc1d5d91ff path=/api/v1/community/posts status=200
[req] x-message-id=72475e1f-b419-4c70-9c85-a96014a132f1 path=/api/v1/community/posts status=200
[req] x-request-id=bcd1b298-6438-4c20-b067-2eb9e29dd5a5 path=/api/v1/community/posts/136f37c1-6f00-419a-a886-a3c6e4ccee56/like status=200
[req] x-message-id=855d9e8a-79ef-4c5d-b3cb-2b49d68369ec path=/api/v1/community/posts/136f37c1-6f00-419a-a886-a3c6e4ccee56/like status=200
[req] x-request-id=c6d339af-2bf6-4dac-92ab-d8f03109e924 path=/api/v1/community/posts/136f37c1-6f00-419a-a886-a3c6e4ccee56/like status=200
[req] x-message-id=25c9f6ca-870c-4498-aecb-5622ce8b5a51 path=/api/v1/community/posts/136f37c1-6f00-419a-a886-a3c6e4ccee56/like status=200
[req] x-request-id=728a7b09-d6f2-44ed-abdd-0e9b641e598e path=/api/v1/community/posts/136f37c1-6f00-419a-a886-a3c6e4ccee56/like status=200
[req] x-message-id=6be4ef1a-385f-47a4-a2f3-2e9221b9935e path=/api/v1/community/posts/136f37c1-6f00-419a-a886-a3c6e4ccee56/like status=200

```
E2E: `frontend/e2e/f015-f016-f017-request.spec.ts` — F-016 · DELETE like then GET liked_by_me false then POST like relike
