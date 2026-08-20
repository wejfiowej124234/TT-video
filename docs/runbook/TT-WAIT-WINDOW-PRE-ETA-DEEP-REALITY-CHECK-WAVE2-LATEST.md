# TT · Wait Window · PRE_ETA_DEEP_REALITY_CHECK · WAVE_2（LATEST）

**STATUS:** `WAVE2_RECORDED · STOP`  
**Stamp:** `2026-08-11T03:52:00Z` · **BEFORE_ETA** · ETA `2026-08-11T23:45:35Z`  
**Mode:** READ_ONLY · **NO_FIX** · Track1 / Official Runtime / 29-file Cut Queue / 代码 / 链上：**零改动**  
**Track1 delay:** **否**（无 execute/release/Settlement 危及 P0）  
**FTB:** 仍为全系统唯一 SSOT（本文件 ≠ 第二真源）

**Machine:** [`TT-WAIT-WINDOW-PRE-ETA-DEEP-REALITY-CHECK-WAVE2-LATEST.json`](./TT-WAIT-WINDOW-PRE-ETA-DEEP-REALITY-CHECK-WAVE2-LATEST.json)  
**Wave-1 parent:** [`TT-WAIT-WINDOW-PRE-ETA-DEEP-REALITY-CHECK-LATEST`](./TT-WAIT-WINDOW-PRE-ETA-DEEP-REALITY-CHECK-LATEST.md)

---

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## 0 · Wave-1 NEW_GAP 去重（禁止重复开修）

| W1 ID | 现分类 | Pack |
|-------|--------|------|
| DRC-W1-004 `/me/payments` 404 | **COVERED_BY_LOCAL_READY_PACK** | **R-PAY-IA-1** |
| DRC-W1-005 Admin USD vs Traveler USDC | **COVERED_BY_LOCAL_READY_PACK** | **R-USDC-1**（Refunded 再证） |
| DRC-W1-006 Disputes Can write 双信号 | **COVERED_BY_LOCAL_READY_PACK** | **R-ADMIN-1** |
| DRC-W1-007 Disputes 12 vs 1 | **PARTIAL** → 残差 **DRC-W2-007** | R-ADMIN 不重复开修双信号 |
| DRC-W1-008 relative media 404 | **NEW_GAP 根因闭环** → **DRC-W2-001** | **R-MEDIA-1**（非三包） |

---

## 1 · Community relative-media 404 根因（只定位）

```text
DB cover_url 引用 INT ACT
  → object key（UUID.jpg）在 URL 中存在
  → object storage / 本地卷  ❌ Official 无文件
       handlers.rs: data/community_post_media/<name> 本地 FS 读写
       GET → {"error":"not_found"} 404
  → API rewrite / 路由 INT ACT（匿名可读）
  → FE onError 降级 PARTIAL（CDN video 仍可播；poster/avatar 可裂）
```

**断裂层：`OBJECT_STORAGE_OR_VOLUME_PERSISTENCE`**（非 DB、非 rewrite）。  
样本键：`ca438fb3…jpg` · `16e8fc19…jpg` · `2441880f…jpg`。  
**不修。** 建议包：`R-MEDIA-1`（Seal 后 SEPARATE · 不插队 Cut Queue 三包 · 不挡 Track1）。

---

## 2 · Wave-2 计数与阻断轴

| Class | # |
|-------|---|
| PASS | 6 |
| NEW_GAP | 5 |
| COVERED_BY_LOCAL_READY_PACK | 1 |
| COVERAGE_GAP | 2 |
| EXPECTED_DIFFERENCE | 1 |

**全部 `blocks_track1_finalize=false` · `blocks_reality_seal=false`。**  
Hard Gate / GO 仍仅由既有 POST_SEAL（lineage / Indexer fill 等 W1）候选，本波未新增 Track1 阻断。

---

## 3 · 角色 / 订单 / Growth / CMS（摘要）

| 域 | 结论 |
|----|------|
| Refunded `0cd98cfc` Traveler↔Admin↔Pay | **PASS** 态一致 · Pay 不可付 · Admin **USD** 显示归 **R-USDC-1** |
| Disputed | **PASS** 复证 |
| Cancelled | **COVERAGE_GAP**（无活样本 · 禁造数） |
| Guide Omar | **PASS** 详情可订 |
| Guide Owner UAT | **EXPECTED_DIFFERENCE**（B10 门禁故意 not-found） |
| Acquisition | **PASS** 空目录诚实 · 发布门控 · API 401 |
| Provider | **PASS** register 200 · `/provider/me` 401；认证闭环 **COVERAGE_GAP** |
| Growth FE `/growth|/referral` | **NEW_GAP** 404；validate/config API OK |
| CMS public read | **PASS**；`cms/public/announcements` **NEW_GAP** 401 误名 |
| Community comments | **PASS** |

---

## 4 · 建议 Remediation Pack（不本轮执行）

1. **R-USDC-1 → R-PAY-IA-1 → R-ADMIN-1**（已冻结 Cut Queue · Seal 后串行）  
2. **R-MEDIA-1**（对象存储/持久卷 · SEPARATE · 不插队）  
3. **POST_SEAL_GROWTH_IA** · **POST_SEAL_ADMIN_DISPUTE_UNIVERSE** · **POST_SEAL_CMS_ROUTE_HYGIENE**

---

## 5 · STOP

Wave-2 **完成并 STOP**。是否开 Wave-3（安全/性能/发布配置）由 Owner 决定。  
**ETA 到点无条件终止审计 → Track1 fresh Preflight。**
