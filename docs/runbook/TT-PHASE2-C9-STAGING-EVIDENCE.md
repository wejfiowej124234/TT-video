# TT-PHASE2-C9-STAGING-EVIDENCE

**阶段口径：** **① 本地 → ② 测试网 / staging → ③ 公网/生产**（须顺序；禁止跳阶）

**文档类型：** Phase ② · **C9 单槽** staging 证据（Shell Token · Visual Sign-off · Founder Review + 88 §18.7）

**机读入口：** `STAGING_API_BASE=https://tt-api-staging.fly.dev bash scripts/dev/record-community-c9-evidence.sh` → `TT_COMMUNITY_C9_EVIDENCE: OK`

**验收执行时间（UTC）：** 2026-06-05T15:13:58Z

**Fly 账号（运维）：** `github3344@hotmail.com` · App **`tt-api-staging`**

**互指：** [COMMUNITY-PHASE-2-3-ROADMAP §C9](../../frontend/evidence/GO_local_marketing_front_closure/COMMUNITY-PHASE-2-3-ROADMAP.md) · [TT-PHASE2-C8-STAGING-EVIDENCE](./TT-PHASE2-C8-STAGING-EVIDENCE.md) · [FOUNDER-REVIEW-REPORT](./FOUNDER-REVIEW-REPORT.md) · [`evidence/GO_phase2_testnet_20260526/community/C9/`](../../evidence/GO_phase2_testnet_20260526/community/C9/)

---

## 0 · 诚实边界（必读）

| 本报告 **C9 PASS** | **不等于** |
|--------------------|------------|
| ② **C9 槽** · shell smoke + vitest + Playwright 截图 + `visual-review.md` | **C10～C12** 任一槽 PASS |
| Fly API feed 密度 + 本地 FE 壳视觉签收 | **Phase ② GO** · **`TT_PHASE2_GO_VERDICT: NOT_MET`** |
| C1–C8 `STATUS.txt` 可追溯 · ① shell token 契约绿 | **社区 C1–C12 矩阵 GO** |
| 本地 Next dev（3012）+ Fly API 数据链 | **③** Production CDN/HLS/Nav 全量 rename GO |
| Feed 签收用 **guest 公共 catalog**（showcase 密度） | 已登录 follow 流与 `/community/me` 全路径 Production SLA |

**可宣称：** **② C9 槽 PASS**（staging · Fly · 2026-06-05）  
**不可宣称：** 社区 C1–C12 矩阵 GO · Phase ② GO · Production GO

---

## 1 · 总表

| 项 | 结论 | 阶段 |
|----|------|------|
| **有没有收口（C9 槽）** | **是** · `TT_COMMUNITY_C9_EVIDENCE: OK` | **②** |
| **C1–C8 证据闸** | **是** · 八槽 `STATUS.txt` **PASS** | **②** |
| **Staging shell sign-off smoke** | **是** · `TT_COMMUNITY_C9_STAGING_SHELL_SIGNOFF: OK` | **②** |
| **Shell token vitest** | **是** · 4 files · **63** tests | **① 冻结 / ② 对拍** |
| **Browser visual sign-off** | **是** · 8 必填截图 + `browser-c9-shell-summary.md` | **②** |
| **Fly API + 本地 FE** | **是** · `https://tt-api-staging.fly.dev` + `http://127.0.0.1:3012` | **②** |

**一句话结论：** **C9 单槽在 Fly staging 真环境已 PASS**（Shell Token 契约 + 多路由视觉签收）；**C10–C12 与 Phase ② 总 GO 未在本报告宣称**。

---

## 2 · 清单表（C9 验收项）

| # | 清单项 | 探针 / 断言 | 状态 | 未完成应在哪阶 |
|---|--------|-------------|------|----------------|
| 1 | **C1–C8 STATUS 闸** | 八槽 `status: PASS` | ✅ PASS | — |
| 2 | **GET /health + feed** | Fly **200** · `feed_count≥10` · `automation_leak=0` | ✅ PASS | — |
| 3 | **本地 FE `/community`** | **200**（脚本拉起 Next dev） | ✅ PASS | — |
| 4 | **Vitest shell contracts** | 4 contract files exit 0 | ✅ PASS | — |
| 5 | **Playwright 多路由壳** | Feed · Explore · Friends · Messages · Activity · user profile · did-rank · mobile | ✅ PASS | — |
| 6 | **visual-review.md** | `C9 slot verdict` **PASS** | ✅ PASS | — |
| 7 | **Showcase profile** | `showcase_user_id=00000000-0000-4000-8000-000000000401` | ✅ PASS | — |
| 8 | **Founder Review B 类** | B-01/B-03/B-04 等 **PLANNED** | ❌ 未完成 | **② 增量 / C10–C12** |
| 9 | **Production CDN/HLS** | — | ❌ 未完成 | **③** |

---

## 3 · 证据文件

| 产物 | 路径 |
|------|------|
| 运行总日志 | [`evidence/…/C9/run-20260605T151358Z.log`](../../evidence/GO_phase2_testnet_20260526/community/C9/run-20260605T151358Z.log) |
| Visual review | [`evidence/…/C9/visual-review.md`](../../evidence/GO_phase2_testnet_20260526/community/C9/visual-review.md) |
| 浏览器摘要 | [`evidence/…/C9/browser-c9-shell-summary.md`](../../evidence/GO_phase2_testnet_20260526/community/C9/browser-c9-shell-summary.md) |
| 截图目录 | [`evidence/…/C9/screenshots/`](../../evidence/GO_phase2_testnet_20260526/community/C9/screenshots/) |
| FE dev 旁证 | [`evidence/…/C9/c9-fe-dev-20260605T151358Z.log`](../../evidence/GO_phase2_testnet_20260526/community/C9/c9-fe-dev-20260605T151358Z.log) |
| STATUS | [`evidence/…/C9/STATUS.txt`](../../evidence/GO_phase2_testnet_20260526/community/C9/STATUS.txt) |

**本 run 锚点：** `showcase_user_id=00000000-0000-4000-8000-000000000401` · `feed_count=30` · `staging_login_email=c6-author-1780670465@example.com`

---

## 4 · 复跑命令（仅 C9 · ②）

```bash
export HTTP_PROXY=http://127.0.0.1:15715
export HTTPS_PROXY=http://127.0.0.1:15715
export ALL_PROXY=socks5://127.0.0.1:15715
export NO_PROXY=tt-api-staging.fly.dev,localhost,127.0.0.1

# 前置：C1–C8 各槽 Fly STATUS.txt 已为 PASS
STAGING_API_BASE=https://tt-api-staging.fly.dev bash scripts/dev/record-community-c9-evidence.sh
```

**期望末行：** `TT_COMMUNITY_C9_STAGING_SHELL_SIGNOFF: OK` · `TT_COMMUNITY_C9_EVIDENCE: OK`

**架构说明：** Fly 承载 API；本地 Next dev（3012）承载 FE 壳；脚本 patch `frontend/.env.local` 指向 Fly API 并拉起 dev server。

---

## 5 · 机读结论

```
TT_PHASE2_C9_STAGING_VERDICT: PASS
TT_COMMUNITY_C9_EVIDENCE: OK
TT_COMMUNITY_C9_STAGING_SHELL_SIGNOFF: OK
slot: C9 only
api_base: https://tt-api-staging.fly.dev
frontend_base: http://127.0.0.1:3012
stamp_utc: 20260605T151358Z
showcase_user_id: 00000000-0000-4000-8000-000000000401
NOT: C10-C12 PASS · NOT community C1-C12 matrix GO · NOT Phase② GO · NOT Production GO
```

**下一步（不在本报告范围）：** **C10** · `record-community-c10-evidence.sh` — 单槽验收，禁止跳阶宣称全矩阵 GO。
