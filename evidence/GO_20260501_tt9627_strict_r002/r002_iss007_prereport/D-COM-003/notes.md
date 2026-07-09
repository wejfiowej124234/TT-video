# D-COM-003

`cargo test -p traveltrust-api matrix_93_d_com_003b_f016_post_like_delete_relike_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_003b_f016_post_like_delete_relike_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1180 filtered out; finished in 0.17s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.31s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-21f06832b8f1b80b.exe)
[req] x-request-id=db4ee639-3675-44d1-804e-a1a99ad6019d path=/api/v1/community/posts status=200
[req] x-message-id=555d5adf-43e2-4884-9d36-c6b64ee8b929 path=/api/v1/community/posts status=200
[req] x-request-id=af257b8d-509a-41cc-953f-56959e6ac210 path=/api/v1/community/posts/a30151bc-6885-4af3-aacc-972089ea35d8/like status=200
[req] x-message-id=a24aaf79-3248-4beb-aeaa-ecc407b9c690 path=/api/v1/community/posts/a30151bc-6885-4af3-aacc-972089ea35d8/like status=200
[req] x-request-id=15062ab5-c009-4af2-a77c-d9096c245cdd path=/api/v1/community/posts/a30151bc-6885-4af3-aacc-972089ea35d8/like status=200
[req] x-message-id=7f943d5f-e4a8-413d-88b6-960b10e3c8f0 path=/api/v1/community/posts/a30151bc-6885-4af3-aacc-972089ea35d8/like status=200
[req] x-request-id=59b60e05-8780-49b8-93c8-aad13437c240 path=/api/v1/community/posts/a30151bc-6885-4af3-aacc-972089ea35d8/like status=200
[req] x-message-id=eb86e7b0-b771-4fcd-ab36-a8faa11bab09 path=/api/v1/community/posts/a30151bc-6885-4af3-aacc-972089ea35d8/like status=200

```
E2E: `frontend/e2e/f015-f016-f017-request.spec.ts` — F-016 · DELETE like then GET liked_by_me false then POST like relike
