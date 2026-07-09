# TT-PHASE2-C11-STAGING-EVIDENCE

**阶段口径：** **① 本地 → ② 测试网 / staging → ③ 公网/生产**（须顺序；禁止跳阶）

**文档类型：** Phase ② · **C11 单槽** staging 证据（04 路由闸 · staging API + 浏览器对拍）

**机读入口：** `STAGING_API_BASE=https://tt-api-staging.fly.dev bash scripts/dev/record-community-c11-evidence.sh` → `TT_COMMUNITY_C11_EVIDENCE: OK`

**验收执行时间（UTC）：** 2026-06-06T00:10:39Z

**Fly 账号（运维）：** `github3344@hotmail.com` · App **`tt-api-staging`**

**互指：** [COMMUNITY-PHASE-2-3-ROADMAP §C11](../../frontend/evidence/GO_local_marketing_front_closure/COMMUNITY-PHASE-2-3-ROADMAP.md) · [TT-PHASE2-C10-STAGING-EVIDENCE](./TT-PHASE2-C10-STAGING-EVIDENCE.md) · [`evidence/GO_phase2_testnet_20260526/community/C11/`](../../evidence/GO_phase2_testnet_20260526/community/C11/)

---

## 0 · 诚实边界（必读）

| 本报告 **C11 PASS** | **不等于** |
|--------------------|------------|
| ② **C11 槽** · `run-check-04-routes.sh` + staging API 探针 + 浏览器路由探针 | **C12** 槽 PASS |
| 04 §3.4 / Axum / `api.ts` / `app/community` 静态对拍 | **Phase ② GO** · **`TT_PHASE2_GO_VERDICT: NOT_MET`** |
| C1–C10 `STATUS.txt` 可追溯 | **社区 C1–C12 矩阵 GO** |
| Fly API + 本地 Next dev（3012） | **③** Production 全矩阵 GO |
| 浏览器探针为 **guest 可达**（登录门闸 / redirect 合法） | 已登录全路径 Production SLA |

**可宣称：** **② C11 槽 PASS**（staging · Fly · 2026-06-06 复验）  
**不可宣称：** 社区 C1–C12 矩阵 GO · Phase ② GO · Production GO

---

## 1 · 总表

| 项 | 结论 | 阶段 |
|----|------|------|
| **有没有收口（C11 槽）** | **是** · `TT_COMMUNITY_C11_EVIDENCE: OK` | **②** |
| **C1–C10 证据闸** | **是** · 十槽 `STATUS.txt` **PASS** | **②** |
| **`run-check-04-routes.sh`** | **是** · `STRICT_WARNINGS=1` exit 0 | **②** |
| **Staging API probes** | **是** · **24/24** · `route-gate-report.json` **`verdict: PASS`** | **②** |
| **Browser route probes** | **是** · **18/18** · `browser-route-probes.json` | **②** |
| **Fly API + 本地 FE** | **是** · `https://tt-api-staging.fly.dev` + `http://127.0.0.1:3012` | **②** |

**一句话结论：** **C11 单槽在 Fly staging 真环境已 PASS**（04 路由闸 + 静态对拍 + API/浏览器探针）；**C12 与 Phase ② 总 GO 未在本报告宣称**。

---

## 2 · 清单表（C11 验收项）

| # | 清单项 | 探针 / 断言 | 状态 | 未完成应在哪阶 |
|---|--------|-------------|------|----------------|
| 1 | **C1–C10 STATUS 闸** | 十槽 `status: PASS` | ✅ PASS | — |
| 2 | **04 机读闸** | `run-check-04-routes.sh` exit 0 | ✅ PASS | — |
| 3 | **静态对拍** | 04 §3.4 **42** · Axum **42** · `api.ts` **29** · FE pages **18** | ✅ PASS | — |
| 4 | **Staging API 探针** | 注册（dev code）+ **24** 路由 HTTP | ✅ PASS | — |
| 5 | **浏览器子路由** | **18** App Router 可达 · 无 error boundary | ✅ PASS | — |
| 6 | **`route-gate-summary.md`** | `C11 slot verdict` **PASS** | ✅ PASS | — |
| 7 | **Production 全站 04/93 GO** | — | ❌ 未完成 | **③** |

---

## 3 · 证据文件

| 产物 | 路径 |
|------|------|
| 运行总日志 | [`evidence/…/C11/run-20260606T001039Z.log`](../../evidence/GO_phase2_testnet_20260526/community/C11/run-20260606T001039Z.log) |
| Route gate report | [`evidence/…/C11/route-gate-report.json`](../../evidence/GO_phase2_testnet_20260526/community/C11/route-gate-report.json) |
| Route gate summary | [`evidence/…/C11/route-gate-summary.md`](../../evidence/GO_phase2_testnet_20260526/community/C11/route-gate-summary.md) |
| Browser probes | [`evidence/…/C11/browser-route-probes.json`](../../evidence/GO_phase2_testnet_20260526/community/C11/browser-route-probes.json) |
| check-04 结果 | [`evidence/…/C11/check-04-routes-result.json`](../../evidence/GO_phase2_testnet_20260526/community/C11/check-04-routes-result.json) |
| STATUS | [`evidence/…/C11/STATUS.txt`](../../evidence/GO_phase2_testnet_20260526/community/C11/STATUS.txt) |

**本 run 锚点：** `staging_api_probes=24/24` · `browser_routes=18/18` · `report_verdict=PASS` · static **42/42/29/18**

---

## 4 · 复跑命令（仅 C11 · ②）

```bash
export HTTP_PROXY=http://127.0.0.1:15715
export HTTPS_PROXY=http://127.0.0.1:15715
export ALL_PROXY=socks5://127.0.0.1:15715
export NO_PROXY=tt-api-staging.fly.dev,localhost,127.0.0.1

# 前置：C1–C10 各槽 Fly STATUS.txt 已为 PASS；本地 Next dev 3012 可达 /community
STAGING_API_BASE=https://tt-api-staging.fly.dev bash scripts/dev/record-community-c11-evidence.sh
```

**期望末行：** `TT_COMMUNITY_C11_STAGING_ROUTE_GATE: OK` · `TT_COMMUNITY_C11_EVIDENCE: OK`

**架构说明：** Fly 承载 API；本地 Next dev（3012）承载 FE 壳；staging 注册须 Fly **`registration_verification_dev_code`**（`TRAVELTRUST_EMAIL_TRANSPORT=log`）。

---

## 5 · 机读结论

```
TT_PHASE2_C11_STAGING_VERDICT: PASS
TT_COMMUNITY_C11_EVIDENCE: OK
TT_COMMUNITY_C11_STAGING_ROUTE_GATE: OK
slot: C11 only
api_base: https://tt-api-staging.fly.dev
frontend_base: http://127.0.0.1:3012
stamp_utc: 20260606T001039Z
staging_api_probes: 24/24
browser_routes: 18/18
NOT: C12 PASS · NOT community C1-C12 matrix GO · NOT Phase② GO · NOT Production GO
```

**下一步（不在本报告范围）：** **C12** · `record-community-c12-evidence.sh` — 单槽验收，禁止跳阶宣称全矩阵 GO。
