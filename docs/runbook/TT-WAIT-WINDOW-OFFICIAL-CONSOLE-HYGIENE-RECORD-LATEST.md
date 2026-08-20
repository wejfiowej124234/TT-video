# TT · Wait Window · Official Console / Market Hygiene · RECORD_ONLY（LATEST）

**STATUS:** `RECORD_ONLY · PRE_ETA_READ_ONLY · NO_FIX · NO_OFFICIAL_DEPLOY`  
**Stamp:** `2026-08-11T04:12:00Z` · **BEFORE_ETA**  
**FTB:** 唯一 SSOT · 本文件 ≠ 第二真源  
**Hold:** WAVE3_STOP · Cut Queue 29-file **未改** · 产品代码 / Official Runtime：**零改动**

**Machine:** [`TT-WAIT-WINDOW-OFFICIAL-CONSOLE-HYGIENE-RECORD-LATEST.json`](./TT-WAIT-WINDOW-OFFICIAL-CONSOLE-HYGIENE-RECORD-LATEST.json)

---

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## 0 · Owner 冲突闸（写死）

现行 Freeze：**ETA 前禁止 Official FIX/Deploy**。  
本轮 Owner 报了官网控制台/社区/商家脏数据并要求修复——**与 Freeze 冲突**。

| 选项 | 含义 |
|------|------|
| **A · 维持 Freeze（默认）** | 只 RECORD · Track1 优先 · Seal 后按 Ladder 开包 |
| **B · Owner 书面 OVERRIDE** | 才允许开 Official hygiene 修包（仍 **不得** 挡 Track1 Finalize） |

**本文件默认走 A。未收到 B 之前：不改代码、不部署官网、不同步测试网冒充已修。**

---

## 1 · 控制台项分类

| # | 现象 | 归类 | 是否本仓债 | 已有 Pack / 建议 | blocks_track1_finalize |
|---|------|------|------------|------------------|:---:|
| 1 | Immersive Translate `dynamic-i18n version mismatch` | **EXPECTED_DIFFERENCE** | **否**（浏览器扩展） | 忽略 / 关扩展 | F |
| 2 | `PATCH …/orders/{id}/guide` **409** | **KNOWN_GAP** / 并发或已绑定 | 是 · UX/幂等 | `POST_SEAL_ORDER_GUIDE_409_UX` | F |
| 3 | community-posts `*.jpg` **404** | **COVERED_BY_READY_PACK** | 是 · 对象/卷持久化 | **R-MEDIA-1** | F |
| 4 | `POST …/comments` **429** + `comment_duplicate` | **KNOWN_GAP**（防刷生效 · UX 差） | 是 | `POST_SEAL_COMMENT_DEDUP_UX` | F |
| 5 | 社区 **纯文字**发布仍存在 | **NEW_GAP** · 产品策略 | 是 · FE+API 仍允许 `post_type=text` | **R-COMM-TEXT-BAN-1**（新包 · Seal 后） | F |
| 6 | 自由市场商家卡 `uat-v65-…Z shop` · Beijing · 0 USDC | **NEW_GAP** · 生产脏数据 | 是 · **非 CMS Ambient / 非 COS 主因** | **R-MKT-UAT-LEAK-1**（数据卫生 + catalog 过滤 hardening） | F |

---

## 2 · 商家页 `uat-v65-… shop` 定性

**不是** CMS 国家 Ambient 图库；**不是** COS/OCS 官方冷启动主路径标题形态。

**最可能：** V65 / UAT / 商家入驻手测脚本或测试账号，经 `POST /api/v1/market/provider/listings` 写入 **`market_listings`（provider）**，标题形如 `uat-v65-<ISO>Z shop`，城市 Beijing，标价 0 USDC；封面可能复用旅行静物图。

| 问 | 答 |
|----|-----|
| CMS？ | **否**（CMS = Ambient/POI 内容轨） |
| COS/OCS？ | **否**为主因（OCS 有独立冷启动校验；标题模式像 UAT stamp） |
| 测试脚本/测试账号？ | **是（高置信）** · 生产库残留 |
| 已发布后是否应存在？ | **否** · 公众 catalog **不应**暴露 UAT 店铺名；UAT-04 明确「无 test 数据泄漏到公众 provider 列表」 |
| 处置 | Seal 后：**下架/改 `data_origin`/硬过滤标题前缀** + 禁止再生产 UAT 写 Official（脚本闸） |

---

## 3 · 纯文字发帖清除范围（待 Owner OVERRIDE / Seal 后）

现行真源（代码）：

- API：`post_type=text` **允许**空媒体（`posts.rs`：仅非 text 才 `media_required`）
- FE：`PublishDrawer` `TYPES` 含 `"text"` · i18n「纯文字」

目标（Owner）：**只接受 图片+文字 / 视频+文字** · 彻底清除纯文字（FE · API · DB 策略）。

建议包 **R-COMM-TEXT-BAN-1**：

1. API reject `post_type=text`（及空 `media_urls`）  
2. FE 移除纯文字入口与文案  
3. DB：存量 text 帖 **hide/unpublish** 策略（禁裸 DELETE 生产资金无关表也须 Owner 批）  
4. E2E/单测改走 photo/video  
5. SSOT → Staging/Local **跟随后** Official RV（Dual-track：先 Official 再对齐）

---

## 4 · 正确修复顺序（与 Freeze 对齐）

```text
Track1 ETA → fresh Preflight → execute → release → Settlement/Fee → Reality Seal
  → 再开 Cut Queue：R-USDC-1 → R-PAY-IA-1 → R-ADMIN-1
  → R-MEDIA-1 SEPARATE
  → R-COMM-TEXT-BAN-1 · R-MKT-UAT-LEAK-1 · comment/guide UX
  → Official Cut → Runtime Evidence → SSOT
  → 再 Staging/Local 同步真源
```

**禁止：** 先改本地冒充官网已修 · 先翻 GO · 用修社区挡 Track1。

---

## 5 · 诚实边界

- RECORD ≠ FIX ≠ Official Deploy ≠ Seal ≠ `TT_PRODUCTION_GO`  
- Immersive Translate **不是** TravelTrust 产品缺陷  

*Sebastian Ward · Solo · RECORD_ONLY*
