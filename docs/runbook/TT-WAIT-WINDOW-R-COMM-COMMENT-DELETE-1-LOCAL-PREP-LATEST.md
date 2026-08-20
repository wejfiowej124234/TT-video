# TT · Wait Window · R-COMM-COMMENT-DELETE-1（LATEST）

**STATUS:** `OPEN_RESIDUALS` · **暂停 CLOSED**（COMMUNITY_RUNTIME_RECOVERY）  
**Stamp:** `2026-08-13T02:00:00Z`  
**Machine:** [`TT-WAIT-WINDOW-R-COMM-COMMENT-DELETE-1-LOCAL-PREP-LATEST.json`](./TT-WAIT-WINDOW-R-COMM-COMMENT-DELETE-1-LOCAL-PREP-LATEST.json)  
**Umbrella:** [`OFFICIAL_FULL_REALITY_RECONCILIATION-1`](./TT-OFFICIAL-FULL-REALITY-RECONCILIATION-1-LATEST.md) · **禁止本包单独散修**  
**Opens after:** [`UI-HYG`](./TT-WAIT-WINDOW-UI-HYG-COMM-COMMENT-WALLET-CONTRAST-1-LOCAL-PREP-LATEST.md) **CLOSED**

**`TT_PRODUCTION_GO`:** `NO_GO` · Hard Gate **REFUSED** · FeeRouter/Track2/83 **unauthorized**

---

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## Delivered（API 删除能力仍在；评论链整体不标 CLOSED）

| Layer | Evidence |
|-------|----------|
| API | `DELETE /api/v1/community/posts/:id/comments/:comment_id` · ownership · idempotent `already_deleted` · `removed_visible_count` |
| Official API Cut | `deployment-01KZSVKBK6NCKXV8D1WAFCWWYA` |
| FE residuals tip | `3e600076eab6613b55484852197921cb5c622f7e` · homepage Cold Start OCS cover → durable-media · prior optimistic DELETE fail-closed · draft Idempotency-Key |

## OPEN residuals（Runtime）

1. **Optimistic reconciliation** — 禁止 `comment-local-*` 出站 DELETE；POST 成功须换真实 UUID；`comment_duplicate` 仅 soft-success + refresh（**不为预期 429 改 API**）  
2. **OCS Network** — Initiator pinned：`/` · `ColdStartOfficialHighlightCard` · `guide_post.cover_url` raw legacy upload → 404。Fix at `coldStartConsumerPresentation.resolveCoverUrl` + img belt。Hard bar：**Network `community-posts/ocs-*` = 0**（不单 CDN=200）  
3. **Provider draft 400** — Official 实测分类为 **`missing_idempotency_key`**（非猜测）  
4. **Immersive Translate** — 扩展噪音 · **忽略**

**Admin / stranger:** ownership DELETE returns `404 not_found_or_forbidden` for non-author (Local IT module; Admin remains PATCH visibility only).

---

## Next

Owner RV（全部 PASS 才可重签 Community CLOSED）：  
- Network `/` hard-refresh：`community-posts/ocs-*` = **0**  
- Comment：create→server UUID→delete 200→二次 `already_deleted`→count→hard-refresh；新文案首次发送不得错误 429  
- Provider/Guide draft：不再 `missing_idempotency_key`  
- Public Gates / OCS / attestation / dual-wait PF  

**R-MEDIA-1** 仍可并行（DB durable rewrite），但本包 **不** 冒充评论链 CLOSED。

*Sebastian Ward · Solo · R-COMM-COMMENT-DELETE-1 OPEN_RESIDUALS · NO_GO*
