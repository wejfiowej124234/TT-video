# TT-PHASE2-C3-STAGING-EVIDENCE

**阶段口径：** **① 本地 → ② 测试网 / staging → ③ 公网/生产**（须顺序；禁止跳阶）

**文档类型：** Phase ② · **C3 单槽** staging 证据（举报 → Admin 队列 → content_remove · 公众面下架）

**机读入口：** `API_BASE=https://tt-api-staging.fly.dev bash scripts/dev/record-community-c3-evidence.sh` → `TT_COMMUNITY_C3_EVIDENCE: OK`

**验收执行时间（UTC）：** 2026-06-05T12:57:12Z

**Fly 账号（运维）：** `github3344@hotmail.com` · App **`tt-api-staging`**

**互指：** [COMMUNITY-PHASE-2-3-ROADMAP §C3](../../frontend/evidence/GO_local_marketing_front_closure/COMMUNITY-PHASE-2-3-ROADMAP.md) · [TT-PHASE2-C2-STAGING-EVIDENCE](./TT-PHASE2-C2-STAGING-EVIDENCE.md) · [`evidence/GO_phase2_testnet_20260526/community/C3/`](../../evidence/GO_phase2_testnet_20260526/community/C3/)

---

## 0 · 诚实边界（必读）

| 本报告 **C3 PASS** | **不等于** |
|--------------------|------------|
| ② **C3 槽** · moderation IT + Fly staging 全链 E2E | **C1/C2/C4～C12** 任一槽 PASS |
| 举报→审核→下架 staging 闭环 | **Phase ② GO** · **`TT_PHASE2_GO_VERDICT: NOT_MET`** |
| Admin `content_remove` 烟测 | **C11** 04 路由全量 staging 对拍 |
| staging 注册（验证码 dev code） | **③** 生产法务/guidelines 终稿链 |

**可宣称：** **② C3 槽 PASS**（staging · Fly · 2026-06-05）  
**不可宣称：** 社区 C1–C12 矩阵 GO · Phase ② GO · Production GO

---

## 1 · 总表

| 项 | 结论 | 阶段 |
|----|------|------|
| **有没有收口（C3 槽）** | **是** · `TT_COMMUNITY_C3_EVIDENCE: OK` | **②** |
| **Moderation IT** | **是** · `matrix_93_d_com_c3_*` **2 passed** | **① 代码 / ② 对拍** |
| **Staging moderation E2E** | **是** · `TT_COMMUNITY_C3_STAGING_MODERATION: OK` | **②** |
| **Fly API** | **是** · `https://tt-api-staging.fly.dev` | **②** |

**一句话结论：** **C3 单槽在 Fly staging 真环境已 PASS**；其余槽与 Phase ② 全矩阵 **未在本报告宣称**。

---

## 2 · 清单表（C3 验收项）

| # | 清单项 | 探针 / 断言 | 状态 | 未完成应在哪阶 |
|---|--------|-------------|------|----------------|
| 1 | **IT · 举报入队** | `matrix_93_d_com_c3_report_admin_queue_lists_open_pg` | ✅ PASS | — |
| 2 | **IT · content_remove** | `matrix_93_d_com_c3_content_remove_hides_from_public_surfaces_pg` | ✅ PASS | — |
| 3 | **作者发帖 · 公众可见** | Feed / Profile / 详情 **200** · 帖在 feed | ✅ PASS | — |
| 4 | **用户举报** | `POST …/community/reports` → **200** | ✅ PASS | — |
| 5 | **Admin 队列** | `GET …/admin/community/reports?status=open` 含 report id | ✅ PASS | — |
| 6 | **Admin 下架** | `PATCH …/admin/community/moderation/{id}` · `content_remove` · **200** | ✅ PASS | — |
| 7 | **公众面隐藏** | Feed / Profile / 匿名详情不可见 | ✅ PASS | — |
| 8 | **作者归档可见** | `GET …/community/me/posts` 仍含该帖 | ✅ PASS | — |

---

## 3 · 证据文件

| 产物 | 路径 |
|------|------|
| 运行总日志 | [`evidence/…/C3/run-20260605T125712Z.log`](../../evidence/GO_phase2_testnet_20260526/community/C3/run-20260605T125712Z.log) |
| Moderation IT | [`evidence/…/C3/moderation-it-20260605T125712Z.log`](../../evidence/GO_phase2_testnet_20260526/community/C3/moderation-it-20260605T125712Z.log) |
| Staging moderation E2E | [`evidence/…/C3/staging-moderation-e2e-20260605T125712Z.log`](../../evidence/GO_phase2_testnet_20260526/community/C3/staging-moderation-e2e-20260605T125712Z.log) |
| STATUS | [`evidence/…/C3/STATUS.txt`](../../evidence/GO_phase2_testnet_20260526/community/C3/STATUS.txt) |

---

## 4 · 复跑命令（仅 C3 · ②）

```bash
export HTTP_PROXY=http://127.0.0.1:15715
export HTTPS_PROXY=http://127.0.0.1:15715
export ALL_PROXY=socks5://127.0.0.1:15715

API_BASE=https://tt-api-staging.fly.dev bash scripts/dev/record-community-c3-evidence.sh
```

**期望末行：** `TT_COMMUNITY_C3_STAGING_MODERATION: OK` · `TT_COMMUNITY_C3_EVIDENCE: OK`

**Fly staging 前置：** `SEED_TEST_ACCOUNTS=1`（Admin promote）· `TRAVELTRUST_EMAIL_TRANSPORT=log` · `TRAVELTRUST_AUTH_REGISTER_DEV_CODE_IN_RESPONSE=1` · `TRAVELTRUST_PUBLIC_CATALOG_SURFACE=1`（Feed 过滤）。

---

## 5 · 机读结论

```
TT_PHASE2_C3_STAGING_VERDICT: PASS
TT_COMMUNITY_C3_EVIDENCE: OK
TT_COMMUNITY_C3_STAGING_MODERATION: OK
slot: C3 only
api_base: https://tt-api-staging.fly.dev
stamp_utc: 20260605T125712Z
matrix_93_d_com_c3: 2 passed
NOT: C1/C2/C4-C12 PASS · NOT community matrix GO · NOT Phase② GO
```

**下一步（不在本报告范围）：** **C4** · `record-community-c4-evidence.sh` — 单槽验收，禁止跳阶宣称全矩阵 GO。
