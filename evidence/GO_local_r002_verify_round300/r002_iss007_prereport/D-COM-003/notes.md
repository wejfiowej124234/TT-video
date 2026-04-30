# D-COM-003

`cargo test -p traveltrust-api matrix_93_d_com_003b_f016_post_like_delete_relike_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_003b_f016_post_like_delete_relike_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.14s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=fa0e9bbc-de9a-45e9-9680-48bad7ca6225 path=/api/v1/community/posts status=200
[req] x-message-id=07172669-e516-4999-bbbb-6f0bfaff5290 path=/api/v1/community/posts status=200
[req] x-request-id=e5213dcb-63b0-4b30-9105-02d7d23b30a3 path=/api/v1/community/posts/fd304abe-c0c5-4f0b-a620-0a55f959c715/like status=200
[req] x-message-id=58b7cca0-b619-44b5-964f-50d136468303 path=/api/v1/community/posts/fd304abe-c0c5-4f0b-a620-0a55f959c715/like status=200
[req] x-request-id=9cd48632-113b-4637-81c7-20693e33f271 path=/api/v1/community/posts/fd304abe-c0c5-4f0b-a620-0a55f959c715/like status=200
[req] x-message-id=adda1a00-b139-4164-ac7b-0fcd3f7590a9 path=/api/v1/community/posts/fd304abe-c0c5-4f0b-a620-0a55f959c715/like status=200
[req] x-request-id=15a1ed82-9375-4db9-8335-764a1abc3a73 path=/api/v1/community/posts/fd304abe-c0c5-4f0b-a620-0a55f959c715/like status=200
[req] x-message-id=7a49f99a-df02-4da4-98e3-33159be8dcbc path=/api/v1/community/posts/fd304abe-c0c5-4f0b-a620-0a55f959c715/like status=200

```
E2E: `frontend/e2e/f015-f016-f017-request.spec.ts` — F-016 · DELETE like then GET liked_by_me false then POST like relike
