# TT-PHASE2-C7-STAGING-EVIDENCE

**阶段口径：** **① 本地 → ② 测试网 / staging → ③ 公网/生产**（须顺序；禁止跳阶）

**文档类型：** Phase ② · **C7 单槽** staging 证据（社区 D 域 **93 矩阵** 归档 · `report.json` · **非全站 GO**）

**机读入口：** `STAGING_API_BASE=https://tt-api-staging.fly.dev bash scripts/dev/record-community-c7-evidence.sh` → `TT_COMMUNITY_C7_EVIDENCE: OK`

**验收执行时间（UTC）：** 2026-06-05T14:48:41Z

**Fly 账号（运维）：** `github3344@hotmail.com` · App **`tt-api-staging`**

**互指：** [COMMUNITY-PHASE-2-3-ROADMAP §C7](../../frontend/evidence/GO_local_marketing_front_closure/COMMUNITY-PHASE-2-3-ROADMAP.md) · [TT-PHASE2-C6-STAGING-EVIDENCE](./TT-PHASE2-C6-STAGING-EVIDENCE.md) · [`evidence/GO_phase2_testnet_20260526/community/C7/`](../../evidence/GO_phase2_testnet_20260526/community/C7/) · [TT-9628 · 覆盖边界](../../docs/runbook/TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-coverage-boundary)

---

## 0 · 诚实边界（必读）

| 本报告 **C7 PASS** | **不等于** |
|--------------------|------------|
| ② **C7 槽** · C1–C6 证据映射 + spot-check IT + `report.json` 机读校验 | **C8～C12** 任一槽 PASS |
| `report.json` **`release_gate=GO`**（社区 D 域 staging 矩阵 · 25 cases） | **Phase ② GO** · **`TT_PHASE2_GO_VERDICT: NOT_MET`** |
| Fly staging feed 探针 + C1–C6 `STATUS.txt` 全 **PASS** | **全站 93 矩阵 GO** · **ISS-007 窄切片全矩阵 GO** |
| 2× **BLOCKED**（C4 HLS · C5 production CDN → **③**） | **Production GO** |
| 1× **NOT_RUN**（D-COM-006 → **C10** 宽路径） | 每路由/每角色交叉穷举验收 |

**可宣称：** **② C7 槽 PASS**（staging · Fly · 2026-06-05）· **`report.json` `environment.name=staging`**  
**不可宣称：** 社区 C1–C12 矩阵 GO · Phase ② GO · 全站 93 GO · Production GO

**`report.json` GO 口径：** 仅 **社区 D 域 staging 矩阵**（C1–C6 映射 + spot-check + ③ BLOCKED 行）；**禁止**用本 `report.json` 冒充 staging 全矩阵或 Phase ② 总 GO（与 **CONTRIBUTING · 禁止假完成**、**TT-9628 覆盖边界** 同源）。

---

## 1 · 总表

| 项 | 结论 | 阶段 |
|----|------|------|
| **有没有收口（C7 槽）** | **是** · `TT_COMMUNITY_C7_EVIDENCE: OK` | **②** |
| **C1–C6 证据闸** | **是** · 六槽 `STATUS.txt` 均为 **PASS** | **②** |
| **Spot-check IT** | **是** · C2/C5/C6 各 1 条 cargo **PASS** | **① 代码 / ② 对拍** |
| **Staging feed 探针** | **是** · `GET …/community/feed` · Fly | **②** |
| **`report.json`** | **是** · `release_gate=GO` · **22 PASS** · **0 FAIL** · **2 BLOCKED** · **1 NOT_RUN** | **②** |
| **R-001 机读校验** | **是** · `validate-regression-report.py` exit 0 | **②** |

**一句话结论：** **C7 单槽在 Fly staging 真环境已 PASS**（社区 D 域矩阵归档）；**C8–C12 与 Phase ② 总 GO 未在本报告宣称**。

---

## 2 · 清单表（C7 验收项）

| # | 清单项 | 探针 / 断言 | 状态 | 未完成应在哪阶 |
|---|--------|-------------|------|----------------|
| 1 | **C1–C6 STATUS 闸** | 六槽 `status: PASS` | ✅ PASS | — |
| 2 | **Spot-check C2 IT** | `matrix_93_d_com_c2_upload_png_ok_pg` | ✅ PASS | — |
| 3 | **Spot-check C5 IT** | `matrix_93_d_com_c5_multi_image_feed_profile_explore_read_pg` | ✅ PASS | — |
| 4 | **Spot-check C6 IT** | `matrix_93_d_com_c6_follow_followers_following_feed_profile_pg` | ✅ PASS | — |
| 5 | **Staging feed 探针** | Fly `GET /api/v1/community/feed?limit=5` | ✅ PASS | — |
| 6 | **`report.json` 生成** | `gen-community-c7-staging-matrix-report.py` | ✅ PASS | — |
| 7 | **R-001 校验** | `validate-regression-report.py` · `release_gate=GO` | ✅ PASS | — |
| 8 | **PHASE2-C4-HLS-CDN** | 矩阵行 **BLOCKED** | ✅ 按设计 · ③ | **③** |
| 9 | **PHASE2-C5-PRODUCTION-CDN** | 矩阵行 **BLOCKED** | ✅ 按设计 · ③ | **③** |
| 10 | **D-COM-006 feedback** | **NOT_RUN** · 归 **C10** | ⏸ PENDING | **② C10** |

---

## 3 · 证据文件

| 产物 | 路径 |
|------|------|
| 运行总日志 | [`evidence/…/C7/run-20260605T144841Z.log`](../../evidence/GO_phase2_testnet_20260526/community/C7/run-20260605T144841Z.log) |
| Spot-check IT | [`evidence/…/C7/spotcheck-it-20260605T144841Z.log`](../../evidence/GO_phase2_testnet_20260526/community/C7/spotcheck-it-20260605T144841Z.log) |
| 矩阵机读 | [`evidence/…/C7/report.json`](../../evidence/GO_phase2_testnet_20260526/community/C7/report.json) |
| 矩阵摘要 | [`evidence/…/C7/matrix-summary.md`](../../evidence/GO_phase2_testnet_20260526/community/C7/matrix-summary.md) |
| STATUS | [`evidence/…/C7/STATUS.txt`](../../evidence/GO_phase2_testnet_20260526/community/C7/STATUS.txt) |

---

## 4 · 复跑命令（仅 C7 · ②）

```bash
export HTTP_PROXY=http://127.0.0.1:15715
export HTTPS_PROXY=http://127.0.0.1:15715
export ALL_PROXY=socks5://127.0.0.1:15715
export NO_PROXY=tt-api-staging.fly.dev,localhost,127.0.0.1

# 前置：C1–C6 各槽 Fly STATUS.txt 已为 PASS
STAGING_API_BASE=https://tt-api-staging.fly.dev bash scripts/dev/record-community-c7-evidence.sh
```

**期望末行：** `release_gate=GO` · `TT_COMMUNITY_C7_EVIDENCE: OK`

**前置：** **C1–C6** 已 Fly 复验 **PASS**（本 run 读取 `evidence/…/community/C{1..6}/STATUS.txt`）· 本地 **PG**（`DATABASE_URL` / spot-check cargo）· Fly **`API_BASE`** feed 探针。

---

## 5 · 机读结论

```
TT_PHASE2_C7_STAGING_VERDICT: PASS
TT_COMMUNITY_C7_EVIDENCE: OK
slot: C7 only
api_base: https://tt-api-staging.fly.dev
stamp_utc: 20260605T144841Z
report.json: release_gate=GO cases=25 (PASS=22 FAIL=0 BLOCKED=2 NOT_RUN=1)
environment.name: staging
NOT: C8-C12 PASS · NOT community C1-C12 matrix GO · NOT Phase② GO · NOT full-site 93 GO · NOT Production GO
```

**下一步（不在本报告范围）：** **C8** · `record-community-c8-evidence.sh` — 单槽验收，禁止跳阶宣称全矩阵 GO。
