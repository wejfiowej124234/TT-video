# D-COM-003

`cargo test -p traveltrust-api matrix_93_d_com_003b_f016_post_like_delete_relike_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_003b_f016_post_like_delete_relike_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.14s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=c0c4a5b1-78d0-415c-8c23-27305cb73ba5 path=/api/v1/community/posts status=200
[req] x-message-id=7fb3d292-65ef-4117-88af-e8c92b78932b path=/api/v1/community/posts status=200
[req] x-request-id=7a313178-fdff-4cd0-bc94-0310a26b6cde path=/api/v1/community/posts/f338787b-7a22-4360-824a-5062f1a6645b/like status=200
[req] x-message-id=eca9de81-0005-48f1-8776-5e018c674bda path=/api/v1/community/posts/f338787b-7a22-4360-824a-5062f1a6645b/like status=200
[req] x-request-id=12c46c74-1b22-4954-9754-f2c95fc13dbb path=/api/v1/community/posts/f338787b-7a22-4360-824a-5062f1a6645b/like status=200
[req] x-message-id=0157b3ec-6dcc-4c5e-b0b4-bea9c66717ad path=/api/v1/community/posts/f338787b-7a22-4360-824a-5062f1a6645b/like status=200
[req] x-request-id=b7c00b94-5534-4c29-aeae-821267b579a7 path=/api/v1/community/posts/f338787b-7a22-4360-824a-5062f1a6645b/like status=200
[req] x-message-id=126adbb1-e793-4d11-b5f5-317eb511ee45 path=/api/v1/community/posts/f338787b-7a22-4360-824a-5062f1a6645b/like status=200

```
E2E: `frontend/e2e/f015-f016-f017-request.spec.ts` — F-016 · DELETE like then GET liked_by_me false then POST like relike
