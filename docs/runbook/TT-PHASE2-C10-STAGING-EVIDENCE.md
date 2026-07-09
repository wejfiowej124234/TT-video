# TT-PHASE2-C10-STAGING-EVIDENCE

**阶段口径：** **① 本地 → ② 测试网 / staging → ③ 公网/生产**（须顺序；禁止跳阶）

**文档类型：** Phase ② · **C10 单槽** staging 证据（Critical User Journey · Feed 宽路径 API + 浏览器 E2E）

**机读入口：** `STAGING_API_BASE=https://tt-api-staging.fly.dev bash scripts/dev/record-community-c10-evidence.sh` → `TT_COMMUNITY_C10_EVIDENCE: OK`

**验收执行时间（UTC）：** 2026-06-05T23:52:44Z

**Fly 账号（运维）：** `github3344@hotmail.com` · App **`tt-api-staging`**

**互指：** [COMMUNITY-PHASE-2-3-ROADMAP §C10](../../frontend/evidence/GO_local_marketing_front_closure/COMMUNITY-PHASE-2-3-ROADMAP.md) · [TT-PHASE2-C9-STAGING-EVIDENCE](./TT-PHASE2-C9-STAGING-EVIDENCE.md) · [`evidence/GO_phase2_testnet_20260526/community/C10/`](../../evidence/GO_phase2_testnet_20260526/community/C10/)

---

## 0 · 诚实边界（必读）

| 本报告 **C10 PASS** | **不等于** |
|--------------------|------------|
| ② **C10 槽** · critical journey API smoke + 浏览器宽路径 E2E | **C11～C12** 任一槽 PASS |
| 注册/关注/发帖/评论/点赞/DM/举报/回访 staging 闭环 | **Phase ② GO** · **`TT_PHASE2_GO_VERDICT: NOT_MET`** |
| C1–C9 `STATUS.txt` 可追溯 | **社区 C1–C12 矩阵 GO** |
| Fly API + 本地 Next dev（3012） | **③** Production CDN/HLS/全矩阵 GO |
| **Fly S3 `head_bucket` 降级时 video 切片跳过**（`video_path=skipped_capabilities`） | 本 run 重验 C4 视频 multipart 已 PASS |

**可宣称：** **② C10 槽 PASS**（staging · Fly · 2026-06-06 复验）  
**不可宣称：** 社区 C1–C12 矩阵 GO · Phase ② GO · Production GO

---

## 1 · 总表

| 项 | 结论 | 阶段 |
|----|------|------|
| **有没有收口（C10 槽）** | **是** · `TT_COMMUNITY_C10_EVIDENCE: OK` | **②** |
| **C1–C9 证据闸** | **是** · 九槽 `STATUS.txt` **PASS** | **②** |
| **Critical journey API smoke** | **是** · `TT_COMMUNITY_C10_STAGING_CRITICAL_JOURNEY_API: OK` | **②** |
| **Browser wide-path E2E** | **是** · Playwright + 6 必填截图 + `browser-c10-journey-summary.md` | **②** |
| **Fly API + 本地 FE** | **是** · `https://tt-api-staging.fly.dev` + `http://127.0.0.1:3012` | **②** |
| **Video 宽路径（本 run）** | **跳过** · Fly S3 `public_video_publish_ready=false` | **② 基础设施旁证** |

**一句话结论：** **C10 单槽在 Fly staging 真环境已 PASS**（社交宽路径 + 举报 + 回访）；**video 切片因 Fly S3 降级未在本 run 重验**；**C11–C12 与 Phase ② 总 GO 未在本报告宣称**。

---

## 2 · 清单表（C10 验收项）

| # | 清单项 | 探针 / 断言 | 状态 | 未完成应在哪阶 |
|---|--------|-------------|------|----------------|
| 1 | **C1–C9 STATUS 闸** | 九槽 `status: PASS` | ✅ PASS | — |
| 2 | **三用户注册 + 验证码** | `smoke-auth-register` + 429 退避 | ✅ PASS | — |
| 3 | **Follow · text/photo post · comment · like · DM** | API smoke 全链 | ✅ PASS | — |
| 4 | **Feed / explore / me/posts 面** | API 200 + marker 断言 | ✅ PASS | — |
| 5 | **浏览器：guest → profile → explore → follow 回访** | Playwright 截图链 | ✅ PASS | — |
| 6 | **浏览器：DM · activity · report · me/posts** | 必填 6 截图 + summary | ✅ PASS | — |
| 7 | **Video post + canplay（本 run）** | Fly S3 降级 · `video_path=skipped_capabilities` | ⏸ 跳过 | **② S3 恢复后复跑** |
| 8 | **Production CDN/HLS 宽路径** | — | ❌ 未完成 | **③** |

---

## 3 · 证据文件

| 产物 | 路径 |
|------|------|
| 运行总日志 | [`evidence/…/C10/run-20260605T235244Z.log`](../../evidence/GO_phase2_testnet_20260526/community/C10/run-20260605T235244Z.log) |
| Critical journey E2E | [`evidence/…/C10/critical-journey-e2e-20260605T235244Z.log`](../../evidence/GO_phase2_testnet_20260526/community/C10/critical-journey-e2e-20260605T235244Z.log) |
| Journey summary | [`evidence/…/C10/journey-summary.md`](../../evidence/GO_phase2_testnet_20260526/community/C10/journey-summary.md) |
| 浏览器摘要 | [`evidence/…/C10/browser-c10-journey-summary.md`](../../evidence/GO_phase2_testnet_20260526/community/C10/browser-c10-journey-summary.md) |
| 截图目录 | [`evidence/…/C10/screenshots/`](../../evidence/GO_phase2_testnet_20260526/community/C10/screenshots/) |
| FE dev 旁证 | [`evidence/…/C10/c10-fe-dev-20260605T235244Z.log`](../../evidence/GO_phase2_testnet_20260526/community/C10/c10-fe-dev-20260605T235244Z.log) |
| STATUS | [`evidence/…/C10/STATUS.txt`](../../evidence/GO_phase2_testnet_20260526/community/C10/STATUS.txt) |

**本 run 锚点：** `hero_email=c10-hero-1780703661@example.com` · `target_user_id=0064a74d-3a78-4fdb-807f-ff8b0bf0cc4f` · `video_path=skipped_capabilities`

---

## 4 · 复跑命令（仅 C10 · ②）

```bash
export HTTP_PROXY=http://127.0.0.1:15715
export HTTPS_PROXY=http://127.0.0.1:15715
export ALL_PROXY=socks5://127.0.0.1:15715
export NO_PROXY=tt-api-staging.fly.dev,localhost,127.0.0.1

# 前置：C1–C9 各槽 Fly STATUS.txt 已为 PASS
STAGING_API_BASE=https://tt-api-staging.fly.dev bash scripts/dev/record-community-c10-evidence.sh
```

**期望末行：** `TT_COMMUNITY_C10_STAGING_CRITICAL_JOURNEY_API: OK` · `TT_COMMUNITY_C10_EVIDENCE: OK`

**注意：** 连续注册可能触发 Fly **`verification_code_rate_limited`**；脚本含退避重试。Fly S3 恢复后 `public_video_publish_ready=true` 时可重验 video 切片。

---

## 5 · 机读结论

```
TT_PHASE2_C10_STAGING_VERDICT: PASS
TT_COMMUNITY_C10_EVIDENCE: OK
TT_COMMUNITY_C10_STAGING_CRITICAL_JOURNEY_API: OK
slot: C10 only
api_base: https://tt-api-staging.fly.dev
frontend_base: http://127.0.0.1:3012
stamp_utc: 20260605T235244Z
video_path: skipped_capabilities
NOT: C11-C12 PASS · NOT community C1-C12 matrix GO · NOT Phase② GO · NOT Production GO
```

**下一步（不在本报告范围）：** **C11** · `record-community-c11-evidence.sh` — 单槽验收，禁止跳阶宣称全矩阵 GO。
