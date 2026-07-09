# TT-PHASE2-C8-STAGING-EVIDENCE

**阶段口径：** **① 本地 → ② 测试网 / staging → ③ 公网/生产**（须顺序；禁止跳阶）

**文档类型：** Phase ② · **C8 单槽** staging 证据（Runbook 归档 · 监控/健康 smoke · C1–C7 证据可追溯）

**机读入口：** `STAGING_API_BASE=https://tt-api-staging.fly.dev bash scripts/dev/record-community-c8-evidence.sh` → `TT_COMMUNITY_C8_EVIDENCE: OK`

**验收执行时间（UTC）：** 2026-06-05T14:53:42Z

**Fly 账号（运维）：** `github3344@hotmail.com` · App **`tt-api-staging`**

**互指：** [COMMUNITY-PHASE-2-3-ROADMAP §C8](../../frontend/evidence/GO_local_marketing_front_closure/COMMUNITY-PHASE-2-3-ROADMAP.md) · [TT-PHASE2-C7-STAGING-EVIDENCE](./TT-PHASE2-C7-STAGING-EVIDENCE.md) · [COMMUNITY-STAGING-OPS-RUNBOOK](./COMMUNITY-STAGING-OPS-RUNBOOK.md) · [`evidence/GO_phase2_testnet_20260526/community/C8/`](../../evidence/GO_phase2_testnet_20260526/community/C8/)

---

## 0 · 诚实边界（必读）

| 本报告 **C8 PASS** | **不等于** |
|--------------------|------------|
| ② **C8 槽** · Runbook 快照 + monitoring smoke exit 0 | **C9～C12** 任一槽 PASS |
| Fly **`/health` · `/meta` · Feed · media/capabilities** 探针 | **Phase ② GO** · **`TT_PHASE2_GO_VERDICT: NOT_MET`** |
| C1–C7 `STATUS.txt` + C7 `report.json` 可追溯 | **社区 C1–C12 矩阵 GO** |
| G-2 migrate 证据旁证（可选） | **③** Production 监控/SLO/告警 GO |
| Fly 路径下 **本地 FE `/community` 探针跳过**（无 3012 服务时） | 全站 FE staging 壳已验 |

**可宣称：** **② C8 槽 PASS**（staging · Fly · 2026-06-05）  
**不可宣称：** 社区 C1–C12 矩阵 GO · Phase ② GO · Production GO

---

## 1 · 总表

| 项 | 结论 | 阶段 |
|----|------|------|
| **有没有收口（C8 槽）** | **是** · `TT_COMMUNITY_C8_EVIDENCE: OK` | **②** |
| **C1–C7 证据闸** | **是** · 七槽 `STATUS.txt` **PASS** · C7 `release_gate=GO` | **②** |
| **Staging monitoring smoke** | **是** · `TT_COMMUNITY_C8_STAGING_MONITORING: OK` | **②** |
| **Runbook 归档** | **是** · `runbook.md` ← `COMMUNITY-STAGING-OPS-RUNBOOK.md` | **②** |
| **Fly API 探针** | **是** · `https://tt-api-staging.fly.dev` | **②** |

**一句话结论：** **C8 单槽在 Fly staging 真环境已 PASS**（运维 Runbook + 监控 smoke + 上游证据可追溯）；**C9–C12 与 Phase ② 总 GO 未在本报告宣称**。

---

## 2 · 清单表（C8 验收项）

| # | 清单项 | 探针 / 断言 | 状态 | 未完成应在哪阶 |
|---|--------|-------------|------|----------------|
| 1 | **C1–C7 STATUS 闸** | 七槽 `status: PASS` | ✅ PASS | — |
| 2 | **C7 report.json** | `release_gate=GO` | ✅ PASS | — |
| 3 | **GET /health** | Fly **200** | ✅ PASS | — |
| 4 | **GET /meta** | Fly **200** | ✅ PASS | — |
| 5 | **GET /api/v1/community/feed** | Fly **200** | ✅ PASS | — |
| 6 | **GET …/media/capabilities** | Fly **200** | ✅ PASS | — |
| 7 | **Runbook 安装** | `runbook.md` 含 `C8 · Community Staging Ops` | ✅ PASS | — |
| 8 | **G-2 migrate 旁证** | `g2-staging-migrate` 证据 present | ✅ PASS | — |
| 9 | **本地 FE `/community` 200** | Fly 路径 **跳过**（可选 · 本地 FE + staging API） | ⏸ 可选 | **② 本地壳** |
| 10 | **Production 监控/SLO** | — | ❌ 未完成 | **③** |

---

## 3 · 证据文件

| 产物 | 路径 |
|------|------|
| 运行总日志 | [`evidence/…/C8/run-20260605T145342Z.log`](../../evidence/GO_phase2_testnet_20260526/community/C8/run-20260605T145342Z.log) |
| Monitoring smoke | [`evidence/…/C8/monitoring-check-20260605T145342Z.log`](../../evidence/GO_phase2_testnet_20260526/community/C8/monitoring-check-20260605T145342Z.log) |
| Runbook 快照 | [`evidence/…/C8/runbook.md`](../../evidence/GO_phase2_testnet_20260526/community/C8/runbook.md) |
| STATUS | [`evidence/…/C8/STATUS.txt`](../../evidence/GO_phase2_testnet_20260526/community/C8/STATUS.txt) |

---

## 4 · 复跑命令（仅 C8 · ②）

```bash
export HTTP_PROXY=http://127.0.0.1:15715
export HTTPS_PROXY=http://127.0.0.1:15715
export ALL_PROXY=socks5://127.0.0.1:15715
export NO_PROXY=tt-api-staging.fly.dev,localhost,127.0.0.1

# 前置：C1–C7 各槽 Fly STATUS.txt 已为 PASS
STAGING_API_BASE=https://tt-api-staging.fly.dev bash scripts/dev/record-community-c8-evidence.sh
```

**期望末行：** `TT_COMMUNITY_C8_STAGING_MONITORING: OK` · `TT_COMMUNITY_C8_EVIDENCE: OK`

**Fly staging 探针：** `GET https://tt-api-staging.fly.dev/health` · `/meta` · `/api/v1/community/feed` · `/api/v1/community/media/capabilities`。

---

## 5 · 机读结论

```
TT_PHASE2_C8_STAGING_VERDICT: PASS
TT_COMMUNITY_C8_EVIDENCE: OK
TT_COMMUNITY_C8_STAGING_MONITORING: OK
slot: C8 only
api_base: https://tt-api-staging.fly.dev
stamp_utc: 20260605T145342Z
c7_release_gate: GO
NOT: C9-C12 PASS · NOT community C1-C12 matrix GO · NOT Phase② GO · NOT Production GO
```

**下一步（不在本报告范围）：** **C9** · `record-community-c9-evidence.sh` — 单槽验收，禁止跳阶宣称全矩阵 GO。
