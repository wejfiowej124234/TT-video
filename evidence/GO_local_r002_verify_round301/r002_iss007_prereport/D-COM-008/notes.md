# D-COM-008

`cargo test -p traveltrust-api matrix_93_d_com_008b_f017_post_collect_delete_recollect_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_008b_f017_post_collect_delete_recollect_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.14s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=6bf1551c-2ae3-4b76-b26e-1bcd35923028 path=/api/v1/community/posts status=200
[req] x-message-id=aea02a66-d5b8-4031-930e-8bee82425105 path=/api/v1/community/posts status=200
[req] x-request-id=7a5f163d-a91d-47dc-9f37-ef61011ebddd path=/api/v1/community/posts/8aa52bae-3f76-4b51-880b-c38cda56e9b7/collect status=200
[req] x-message-id=c07e5e84-a630-4edb-8656-54be5bffa92f path=/api/v1/community/posts/8aa52bae-3f76-4b51-880b-c38cda56e9b7/collect status=200
[req] x-request-id=1cbb896b-088d-46c8-a6e5-07de73608834 path=/api/v1/community/posts/8aa52bae-3f76-4b51-880b-c38cda56e9b7/collect status=200
[req] x-message-id=f7a0753c-0b81-4563-b137-8877afd4ef94 path=/api/v1/community/posts/8aa52bae-3f76-4b51-880b-c38cda56e9b7/collect status=200
[req] x-request-id=31563a18-1ca4-4f7c-8b59-9e0f70247c28 path=/api/v1/community/posts/8aa52bae-3f76-4b51-880b-c38cda56e9b7/collect status=200
[req] x-message-id=ba605af3-e674-4fea-8650-b9b3d62d820a path=/api/v1/community/posts/8aa52bae-3f76-4b51-880b-c38cda56e9b7/collect status=200

```
E2E: `frontend/e2e/f015-f016-f017-request.spec.ts` — F-017 · DELETE collect then GET collected_by_me false then POST collect recollect
