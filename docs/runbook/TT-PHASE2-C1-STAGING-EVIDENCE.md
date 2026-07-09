# TT-PHASE2-C1-STAGING-EVIDENCE

**阶段口径：** **① 本地 → ② 测试网 / staging → ③ 公网/生产**（须顺序；禁止跳阶）

**文档类型：** Phase ② · **C1 单槽** staging 最小闭环证据（公开 Feed · onboarding 预检 · Sepolia env 读面 · Fly API）

**机读入口：** `API_BASE=https://tt-api-staging.fly.dev bash scripts/dev/record-community-c1-seed-evidence.sh` → `TT_COMMUNITY_C1_FEED_CHECK: OK`

**验收执行时间（UTC）：** 2026-06-05T12:36:51Z（Feed 对拍）· 2026-06-05T12:41:30Z（staging 探针旁证）

**Fly 账号（运维）：** `github3344@hotmail.com` · App **`tt-api-staging`** · Postgres **`tt-traveltrust-staging`**

**互指：** [COMMUNITY-PHASE-2-3-ROADMAP §C1](../../frontend/evidence/GO_local_marketing_front_closure/COMMUNITY-PHASE-2-3-ROADMAP.md) · [PHASE2-START-CHECKLIST · C1](./PHASE2-START-CHECKLIST.md) · [TT-PHASE2-SEPOLIA-SYSTEM-ACCEPTANCE-REPORT](./TT-PHASE2-SEPOLIA-SYSTEM-ACCEPTANCE-REPORT.md) · [`evidence/GO_phase2_testnet_20260526/community/C1/`](../../evidence/GO_phase2_testnet_20260526/community/C1/)

---

## 0 · 诚实边界（必读）

| 本报告 **C1 PASS** | **不等于** |
|--------------------|------------|
| ② **C1 槽** · Feed ≥20 production UGC · automation_leak=0 | **C2～C12** 任一槽 PASS |
| Fly HTTPS **`API_BASE`** + Sepolia env 已注入 runtime | **Phase ② GO** · **`TT_PHASE2_GO_VERDICT: NOT_MET`** |
| G-0～G-4 onboarding **预检** OK | **ONB-P2-006** 全链 Stripe webhook paid 烟测（`smoke-onboarding-testnet.sh`） |
| steward/redemption **只读 quote** HTTP 200 | **③** 主网真链 · Production PSP |
| 社区 C1 证据 | **96-20 全路由矩阵 GO** · ISS-007 **`--require-go`** 全站 GO |

**可宣称：** **② C1 槽 PASS**（staging · Fly · 2026-06-05）  
**不可宣称：** C1–C12 全矩阵 GO · Phase ② GO · Production GO

---

## 1 · 总表

| 项 | 结论 | 阶段 |
|----|------|------|
| **有没有收口（C1 槽）** | **是** · `TT_COMMUNITY_C1_FEED_CHECK: OK` | **②** |
| **有没有 UI 冻结** | **是（①）** · 五主 + `/community/*` Phase① 冻结；本槽仅验 **数据链** | **① UI / ② 数据** |
| **Fly API 可达** | **是** · `GET /health` → **200** | **②** |
| **Onboarding 预检** | **是** · `TT_CHECK_PHASE2_ONBOARDING_STAGING: OK` | **②** |
| **Sepolia env 读面** | **是（partial）** · stake-quote / redemption quote / protocol-reference **200** | **②** |
| **C1 公开 Feed** | **是** · feed **22** · automation_leak **0** | **②** |

**一句话结论：** **C1 单槽在 Fly staging 真环境最小闭环已 PASS**；C2～C12 与 Phase ② 全矩阵 **未验**。

---

## 2 · 清单表（C1 最小闭环）

| # | 清单项 | 命令 / 探针 | 状态 | 未完成应在哪阶 |
|---|--------|-------------|------|----------------|
| 1 | **开工闸** | `bootstrap-phase2-g1-g2.sh` · `TT_PHASE2_READY_VERDICT: READY_FOR_C1_C12` | ✅ 完成 | — |
| 2 | **Fly HTTPS** | `GET https://tt-api-staging.fly.dev/health` | ✅ 完成 | — |
| 3 | **Onboarding G-0～G-4 预检** | `check-phase2-onboarding-staging-ready.sh` | ✅ 完成 | 真 webhook paid 闭环 → **②** 另槽 ONB-P2-006 |
| 4 | **Sepolia env（runtime）** | Fly secrets：`CHAIN_RPC_URL` · `CHAIN_ID=11155111` · 序 3～5 合约地址（见 P0-03 merge） | ✅ 完成 | 链上 tx / Escrow E2E → **②** 其它槽 |
| 5 | **Sepolia 读面 HTTP** | `GET …/steward/stake-quote?jurisdictions=CN` **200** · `GET …/redemption/quote?jurisdiction=CN` **200** · `GET …/governance/protocol-reference` **200** | ✅ 完成 | `country-ledger/DE` 须登录 **401**（预期）· runtime 链读深化 → **②** |
| 6 | **C1 Feed ≥20** | `record-community-c1-seed-evidence.sh` | ✅ 完成 · **已冻结** | — |
| 7 | **automation_leak=0** | Feed body 不含 `e2e-` / `pi1-fe-` / `browser-minio-` 前缀 | ✅ 完成 | — |
| 8 | **04 §3.4 路由闸（T3）** | `run-check-04-routes.sh` exit 0（含 `me/wallets` · `me/role-applications` 登记） | ✅ 完成 | — |

---

## 3 · C1 Feed 机读指标（Fly · production UGC）

| 指标 | 阈值 | 实测 | 结果 |
|------|------|------|------|
| `feed_count` | ≥ 20 | **22** | PASS |
| `automation_leak` | 0 | **0** | PASS |
| `author_count` | ≥ 4 | **6** | PASS |
| `destination_count` | ≥ 5 | **14** | PASS |
| `media_post_count` | ≥ 8 | **20** | PASS |

**种子来源：** Fly runtime · `SEED_TEST_ACCOUNTS=1` → `TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE=1` · PG **`tt-traveltrust-staging`** · `data_origin=production`（与 [`seed_community_public_showcase.rs`](../../crates/api/src/db/seed_community_public_showcase.rs) 同源）

**证据文件：**

| 产物 | 路径 |
|------|------|
| 运行日志 | [`evidence/GO_phase2_testnet_20260526/community/C1/run-20260605T123651Z.log`](../../evidence/GO_phase2_testnet_20260526/community/C1/run-20260605T123651Z.log) |
| Feed 样本 JSON | [`evidence/GO_phase2_testnet_20260526/community/C1/feed-sample-20260605T123651Z.json`](../../evidence/GO_phase2_testnet_20260526/community/C1/feed-sample-20260605T123651Z.json) |
| STATUS | [`evidence/GO_phase2_testnet_20260526/community/C1/STATUS.txt`](../../evidence/GO_phase2_testnet_20260526/community/C1/STATUS.txt) |
| Staging 探针旁证 | [`evidence/GO_phase2_testnet_20260526/community/C1/c1-staging-probes-20260605T123800Z.log`](../../evidence/GO_phase2_testnet_20260526/community/C1/c1-staging-probes-20260605T123800Z.log) |

---

## 4 · 环境真源（② staging）

| 组件 | 值 |
|------|-----|
| **API_BASE** | `https://tt-api-staging.fly.dev` |
| **Postgres** | `tt-traveltrust-staging`（Fly · region sin · flycast） |
| **Stripe** | test mode · `sk_test_*` / `whsec_*`（`scripts/dev/.env.staging-secrets.local` · **勿提交**） |
| **Sepolia** | `CHAIN_ID=11155111` · RPC + 序 3～5 地址经 `phase2-staging-merge-sepolia-env.sh` → Fly secrets |
| **代理（本机运维）** | `HTTP(S)_PROXY=http://127.0.0.1:15715` · `ALL_PROXY=socks5://127.0.0.1:15715` |

---

## 5 · 复跑命令（仅 C1 · ②）

```bash
export HTTP_PROXY=http://127.0.0.1:15715
export HTTPS_PROXY=http://127.0.0.1:15715
export ALL_PROXY=socks5://127.0.0.1:15715

# C1 Feed 对拍（唯一 C1 机读闸）
API_BASE=https://tt-api-staging.fly.dev bash scripts/dev/record-community-c1-seed-evidence.sh

# 旁证（非 C1 槽 GO 键 · 可选）
bash scripts/dev/check-phase2-onboarding-staging-ready.sh
```

**期望末行：** `TT_COMMUNITY_C1_FEED_CHECK: OK` · `TT_COMMUNITY_C1_EVIDENCE: OK`

---

## 6 · 机读结论

```
TT_PHASE2_C1_STAGING_VERDICT: PASS
TT_COMMUNITY_C1_FEED_CHECK: OK
slot: C1 only
api_base: https://tt-api-staging.fly.dev
stamp_utc: 20260605T123651Z
NOT: C2-C12 PASS · NOT Phase② GO · NOT Production GO
```

**下一步（不在本报告范围）：** C2 上传安全 · `record-community-c2-evidence.sh` — **单槽验收 · 不得跳阶宣称全矩阵 GO**。
