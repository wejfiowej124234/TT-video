# Batch-13 · FP-D · 其余叶 + Chrome（争议→入驻→内容→官方→增长）· LATEST

**Machine:** `TT_ADMIN_BATCH13_FP_D_LEAVES_CHROME`  
**Stamp:** `20260726T081500Z`  
**Status:** **FP-D_CODE_LANDED · ① 机读绿 · ② Staging 复截/闸闭待**  
**Patch:** `PATCH-STG-017`  
**≠ tip 移动 · ≠ Hard Gate unlock · ≠ Cutover · ≠ Production GO · ≠ FINANCE_WRITE**

---

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## 1 · 争议 `/admin/disputes`（FD1～FD10 路径）

| FD | 动作 | ① |
|----|------|---|
| FD1/FD2 | 状态筛去「精确匹配」恐吓 · 已应用含 id/order/q | **CODE** |
| FD3 | 主钮「查看争议」 | **CODE** |
| FD4 | 行级「公开仲裁」→ `/disputes/:id` | **CODE** |
| FD5 | order_id → `/admin/orders/:id` | **CODE** |
| FD6 | API `id`/`order_id`/`q` + FE URL 可复现 | **CODE** |
| FD8/FD9 | 数据源 Strip + 「台账只读」注 | **CODE** |
| FD10 | 财务观测默认折叠 · 裁决台 list 默认折叠 | **CODE** |

**闸 518/519：** 仍 **OPEN**（须 ② R-D + B13-08′）

---

## 2 · 入驻中心（OH5～OH10）

| OH | 动作 | ① |
|----|------|---|
| OH7～OH9 | 首屏三审核卡（向导/商家/主理人） | **CODE** |
| OH5 | 用户权益文案去 eng | **CODE** |
| OH3 | Webhook 副文「失败队列」 | **CODE** |
| OH10 | 副文点明准入费+审核入口 | **CODE** |

**闸 526/527：** 仍 **OPEN**（须 ②）

---

## 3 · 内容中心（CC4·CC11·CC12）

| CC | 动作 | ① |
|----|------|---|
| CC4 | 首屏「官网视觉」三链 | **CODE** |
| CC11 | 磁贴搜索过滤 | **CODE** |
| CC12 | 副文写死氛围≠首页背景 | **CODE** |
| CC9 | TOOL 徽章人话「只读观测」 | **CODE** |

**闸 534/535：** 仍 **OPEN**（须 ② Live 氛围）

---

## 4 · 官方运营（OO3·OO9·OO10）

| OO | 动作 | ① |
|----|------|---|
| OO10 | 快建条（账号/冷启动/模板） | **CODE** |
| OO3 | 待审 KPI 可点 | **CODE** |
| OO9 | 冷启动活动 KPI 卡 | **CODE** |
| OO2/OO11 | KPI 可点进全列表 · 样本诚实 | **CODE** |

**闸 542/543：** 仍 **OPEN**（须 ② Staging 真发 1）

---

## 5 · 增长中心（GH3·GH9·GH10）

| GH | 动作 | ① |
|----|------|---|
| GH3 | 空投进首屏磁贴（≤6 · 保留 antifraud+conversion） | **CODE** |
| GH9 | 新建推荐码 CTA | **CODE** |
| GH10 | KPI 四卡可点深链 | **CODE** |
| GH11 | 推荐事件 0 说明 | **CODE** |

**闸 550/551：** 仍 **OPEN**（须 ②）

---

## 6 · Chrome 工作台（部分 ①）

| HU | 动作 | ① |
|----|------|---|
| 483 | Sepolia 人话（非裸「链 11155111」运营句） | **CODE** |
| 485 | 顶栏 Inbox 次级描边徽标 | **CODE** |
| 484 | 概况折叠空值统一 `0` | **CODE** |
| 479·486·482 | 既有 quiet/demote 保留 | **PARTIAL** |
| 488·489 | Staging SLA / 官网对照 | **② PENDING** |

---

## 7 · 验收（本波）

| 项 | 状态 |
|----|------|
| `cargo check -p traveltrust-api` | **PASS** |
| disputes / hubs / W13 growth tiles vitest | **PASS** |
| tip `ea71c577` | **未动** |
| Hard Gate / Cutover / Production GO | **LOCKED / NO_GO** |
| FINANCE_WRITE | **FORBIDDEN** |

---

## 8 · 下一波

**FP-E** · 叶闸复验 · Staging 矩阵 · 490 签收材料 · Delta Recertify dry-run — 见 [`FAST-PATH`](./TT-BATCH13-FAST-PATH-REMEDIATION-PLAN-LATEST.md)

```text
TT_ADMIN_BATCH13_FP_D: CODE_LANDED
TT_ADMIN_BATCH13_FP_D_STAGING: PENDING
TT_ADMIN_BATCH13_NEXT: FP_E
TT_PRODUCTION_GO: NO_GO
TT_TIP: ea71c577_IMMOBILE
```
