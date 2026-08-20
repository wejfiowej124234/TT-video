# TT · Wait Window · R-OFFICIAL-RUNTIME-ANOMALY-1（LATEST）

**STATUS:** `CLOSED`  
**Stamp:** `2026-08-11T11:30:00Z`  
**Strategy:** `MAXIMIZE_PRE_ETA_REMEDIATION · TRACK1_MONEY_PATH_FROZEN`  
**Official API Cut:** `deployment-01KZR8HJ05AS9KJBQC7S11RNSA`  
**Probe:** [`_probe_tmp/r_official_runtime_role_anomaly.json`](./_probe_tmp/r_official_runtime_role_anomaly.json) · round2 [`_probe_tmp/r_official_runtime_role_anomaly_round2.json`](./_probe_tmp/r_official_runtime_role_anomaly_round2.json)

**Preserve:** R-AUTH-SECURITY-1=CLOSED · R-OWNER-OBSERVED-REALITY-1=PARTIAL · HUMAN_DELETE_RV_PENDING · R-MEDIA=AFTER_SEAL  
**`blocks_track1_finalize`:** `false`  
**`TT_PRODUCTION_GO`:** `NO_GO` · 本包 CLOSED ≠ Seal ≠ GO

---

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## 0 · 角色深审摘要

| Role | 结论 |
|------|------|
| Traveler | FE/API 健康；Discover nil `guide_id` = **CONFIRM_DESIGN**（ORA-008） |
| Guide | 10 干净；公开 DTO KYC 键已剥（ORA-007 **FIXED**）；未知 id API 404 / WEB shell 200+notFound UI |
| Provider/Acq | 10/10 · 未知 listing 404 · 无 UAT 泄漏 |
| Community | OCS 10 OK；未知帖 **404** `post_not_found`（ORA-002 **FIXED**）；Owner `1/2/3` = 已知 FE UX / AFTER_SEAL · 待 Owner Delete RV |
| Governance | WEB 200；proposals API 401 = **CONFIRM_DESIGN** fail-closed（ORA-006） |
| Admin | 无 token 全 401 OK · WEB `/admin` shell → login |

**Indexer checkpoint=0 / meta pause eth_call_error：** **AFTER_SEAL / Ops** · 禁 Indexer fill 本 ETA。

---

## 1 · 本波 CLOSED（Cut + RV）

| ID | FIX | Official RV | Track1 |
|----|-----|-------------|--------|
| ORA-002 | 未知 community post → **404** `post_not_found` | unknown UUID → 404；OCS `2aa95309…` 仍 200 | false |
| ORA-007 | 公开 Guide DTO 剥离 KYC 私密键 | `real_name`/`id_photo_url`/`language_cert_url`/`guide_license_url`  absent | false |

**Post-cut regression（强制）：**

- `bash scripts/gates/check-official-public-gates-regression.sh` → **PASS**
- `python scripts/dev/check-official-ocs-10x4-reality.py` → **PASS_OCS_10X4_REALITY**
- Role×State 无 token：orders/provider/admin/community me/posts/referrals/disputes/reviews → **401**（`guides/me` = `:id` 字面 `me` → `invalid_uuid` 400 · **非**产品路径 · 无 FE 引用）
- Auth：`POST /community/posts` 无 token → **401**；like 无 token → **401**
- Track1 pin 后检：`readyAt=1786491935` · `done=false` · USDC `10000000` · `isEscrow=false`

---

## 2 · 处置（非本 Cut / 不重开 CLOSED）

| ID | Disposition |
|----|-------------|
| ORA-001 | Leave · Owner `1/2/3` + 死封面 · **R-MEDIA AFTER_SEAL** + **HUMAN_DELETE_RV_PENDING** · FE 首帧=UX mitigation only |
| ORA-003 | **CONFIRM_DESIGN** · 无路由 `GET /api/v1/community/me`（仅 `/me/posts` 等）→ 裸路径 404；FE `/community/me` 为页路由 redirect |
| ORA-004 / ORA-005 | **AFTER_SEAL / Ops** · RPC + Indexer · 禁本 ETA fill |
| ORA-006 | **CONFIRM_DESIGN** · proposals 401 under STRICT_SESSION_GATE · 不重开 RBAC |
| ORA-008 | **CONFIRM_DESIGN** · discover 开市 listing 要求 `guide_id == Uuid::nil()` |
| ORA-009 | Observation only · 不重开 R-AUTH-SECURITY-1 |

## 3 · 不做

× 删 Owner `1/2/3` 帖（待 Owner Delete RV）× 对象批修 JPG × Indexer backfill × 主网资金 × 重扫 CLOSED 包
