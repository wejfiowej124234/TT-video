# TT-PHASE2-C2-STAGING-EVIDENCE

**阶段口径：** **① 本地 → ② 测试网 / staging → ③ 公网/生产**（须顺序；禁止跳阶）

**文档类型：** Phase ② · **C2 单槽** staging 证据（上传安全 · MIME/魔数/体限/路径 · Feed 隔离）

**机读入口：** `API_BASE=https://tt-api-staging.fly.dev bash scripts/dev/record-community-c2-evidence.sh` → `TT_COMMUNITY_C2_EVIDENCE: OK`

**验收执行时间（UTC）：** 2026-06-05T12:54:40Z

**Fly 账号（运维）：** `github3344@hotmail.com` · App **`tt-api-staging`**

**互指：** [COMMUNITY-PHASE-2-3-ROADMAP §C2](../../frontend/evidence/GO_local_marketing_front_closure/COMMUNITY-PHASE-2-3-ROADMAP.md) · [TT-PHASE2-C1-STAGING-EVIDENCE](./TT-PHASE2-C1-STAGING-EVIDENCE.md) · [`evidence/GO_phase2_testnet_20260526/community/C2/`](../../evidence/GO_phase2_testnet_20260526/community/C2/)

---

## 0 · 诚实边界（必读）

| 本报告 **C2 PASS** | **不等于** |
|--------------------|------------|
| ② **C2 槽** · security IT + Fly staging upload E2E | **C1** / **C3～C12** 任一槽 PASS |
| Fly HTTPS 上传/读取/拒绝路径 | **Phase ② GO** · **`TT_PHASE2_GO_VERDICT: NOT_MET`** |
| 本机 `cargo test` 矩阵（`matrix_93_d_com_c2_*` 等） | **93 全站 D 域 GO**（属 **C7** 槽） |
| staging 注册烟测（验证码 dev code · `EMAIL_TRANSPORT=log`） | **③** 生产 Resend/真邮件注册链 |

**可宣称：** **② C2 槽 PASS**（staging · Fly · 2026-06-05）  
**不可宣称：** C1–C12 全矩阵 GO · Phase ② GO · Production GO

---

## 1 · 总表

| 项 | 结论 | 阶段 |
|----|------|------|
| **有没有收口（C2 槽）** | **是** · `TT_COMMUNITY_C2_EVIDENCE: OK` | **②** |
| **Security IT** | **是** · `matrix_93_d_com_c2_*` **11** + 辅助 parse/filename/object_key 套件 | **① 代码 / ② 对拍** |
| **Staging upload E2E** | **是** · `TT_COMMUNITY_C2_STAGING_UPLOAD: OK` | **②** |
| **Fly API** | **是** · `https://tt-api-staging.fly.dev` | **②** |
| **Feed 隔离** | **是** · 测试源帖未泄漏公众 Feed | **②** |

**一句话结论：** **C2 单槽在 Fly staging 真环境已 PASS**；C1/C3～C12 与 Phase ② 全矩阵 **未在本报告宣称**。

---

## 2 · 清单表（C2 验收项）

| # | 清单项 | 命令 / 探针 | 状态 | 未完成应在哪阶 |
|---|--------|-------------|------|----------------|
| 1 | **Security IT · 93 D 域 C2** | `cargo test -p traveltrust-api matrix_93_d_com_c2_` | ✅ **11 passed** | — |
| 2 | **parse / filename / object_key** | `media_upload_parse_tests` · `community_post_media_filename_tests` · `object_key_tests` | ✅ exit 0 | — |
| 3 | **合法 PNG 上传 + GET** | `POST …/community/posts/upload-media` → **200** · `GET …/uploads/community-posts/{uuid}.png` → **200** | ✅ 完成 | — |
| 4 | **MIME/魔数不一致** | 声明 png · JPEG 魔数 → **400** `mime_body_mismatch` | ✅ 完成 | — |
| 5 | **空体 / 超大 / MP4 JSON** | `empty` · `file_too_large` · multipart 要求 | ✅ 完成 | — |
| 6 | **路径/文件名攻击** | traversal · `bad-chars!` → **400** | ✅ 完成 | — |
| 7 | **Feed 隔离** | 测试用户发帖 **不** 出现在 `GET …/community/feed` | ✅ 完成 | — |
| 8 | **Staging 注册链** | `send-verification-code` + `registration_verification_dev_code`（Fly secrets：`EMAIL_TRANSPORT=log` · `AUTH_REGISTER_DEV_CODE_IN_RESPONSE=1`） | ✅ 完成 | 生产真邮件 → **③** |

---

## 3 · 证据文件

| 产物 | 路径 |
|------|------|
| 运行总日志 | [`evidence/…/C2/run-20260605T125440Z.log`](../../evidence/GO_phase2_testnet_20260526/community/C2/run-20260605T125440Z.log) |
| Security IT | [`evidence/…/C2/security-it-20260605T125440Z.log`](../../evidence/GO_phase2_testnet_20260526/community/C2/security-it-20260605T125440Z.log) |
| Staging upload E2E | [`evidence/…/C2/staging-upload-e2e-20260605T125440Z.log`](../../evidence/GO_phase2_testnet_20260526/community/C2/staging-upload-e2e-20260605T125440Z.log) |
| STATUS | [`evidence/…/C2/STATUS.txt`](../../evidence/GO_phase2_testnet_20260526/community/C2/STATUS.txt) |

---

## 4 · 复跑命令（仅 C2 · ②）

```bash
export HTTP_PROXY=http://127.0.0.1:15715
export HTTPS_PROXY=http://127.0.0.1:15715
export ALL_PROXY=socks5://127.0.0.1:15715

API_BASE=https://tt-api-staging.fly.dev bash scripts/dev/record-community-c2-evidence.sh
```

**期望末行：** `TT_COMMUNITY_C2_STAGING_UPLOAD: OK` · `TT_COMMUNITY_C2_EVIDENCE: OK`

**Fly staging 前置（C2 注册烟测）：** secrets 含 `TRAVELTRUST_EMAIL_TRANSPORT=log` · `TRAVELTRUST_AUTH_REGISTER_DEV_CODE_IN_RESPONSE=1`（**② staging 专用 · 非 ③**）。

---

## 5 · 机读结论

```
TT_PHASE2_C2_STAGING_VERDICT: PASS
TT_COMMUNITY_C2_EVIDENCE: OK
TT_COMMUNITY_C2_STAGING_UPLOAD: OK
slot: C2 only
api_base: https://tt-api-staging.fly.dev
stamp_utc: 20260605T125440Z
matrix_93_d_com_c2: 11 passed
NOT: C1/C3-C12 PASS · NOT Phase② GO · NOT Production GO
```

**下一步（不在本报告范围）：** **C3** · `record-community-c3-evidence.sh` — 单槽验收，禁止跳阶宣称全矩阵 GO。
