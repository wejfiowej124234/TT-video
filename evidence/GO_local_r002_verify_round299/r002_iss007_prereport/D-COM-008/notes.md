# D-COM-008

`cargo test -p traveltrust-api matrix_93_d_com_008b_f017_post_collect_delete_recollect_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_008b_f017_post_collect_delete_recollect_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.15s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=67624c98-0072-4176-8d94-9f5845e8ffc0 path=/api/v1/community/posts status=200
[req] x-message-id=f2509a1a-b499-4876-bccf-0b1097e13c90 path=/api/v1/community/posts status=200
[req] x-request-id=f6b277dc-f164-41ac-b8c9-f6e6bdc3e99d path=/api/v1/community/posts/a137ea9a-de61-4701-bd35-9af4e7459231/collect status=200
[req] x-message-id=e7aeaff2-d77e-479a-8540-36a17c8d33c9 path=/api/v1/community/posts/a137ea9a-de61-4701-bd35-9af4e7459231/collect status=200
[req] x-request-id=a1d6c010-0010-483d-880d-aebab76dc0d0 path=/api/v1/community/posts/a137ea9a-de61-4701-bd35-9af4e7459231/collect status=200
[req] x-message-id=e872a1f2-7991-4e92-9d3c-6b98709a731f path=/api/v1/community/posts/a137ea9a-de61-4701-bd35-9af4e7459231/collect status=200
[req] x-request-id=03ca797d-fb3c-4416-a951-ea9e1192372d path=/api/v1/community/posts/a137ea9a-de61-4701-bd35-9af4e7459231/collect status=200
[req] x-message-id=24d0655d-6ef5-4e98-b855-82774e55d1dd path=/api/v1/community/posts/a137ea9a-de61-4701-bd35-9af4e7459231/collect status=200

```
E2E: `frontend/e2e/f015-f016-f017-request.spec.ts` — F-017 · DELETE collect then GET collected_by_me false then POST collect recollect
