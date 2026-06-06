# GO_local · 社区 Phase ① 窄 E2E 证据根（§七 第 3 步）

**阶段：① 本地** — **非** ② 测试网 / ③ 生产 GO。

## 命令

```bash
# 前置：API :8080（建议 P3_CHAIN_OFF=1 · chain_off 已 hydrate）+ Next :3012
curl -sf http://127.0.0.1:8080/health

cd frontend
PLAYWRIGHT_REUSE_API_SERVER=1 npm run e2e:community-phase1-narrow   # 本目录 e2e-narrow.latest.log
PLAYWRIGHT_REUSE_API_SERVER=0 npm run e2e:community-l5-all            # 并集 · 含 subroutes/modals/social + narrow
PLAYWRIGHT_REUSE_API_SERVER=0 npm run e2e:pi1-community-all
PLAYWRIGHT_REUSE_API_SERVER=0 bash ../scripts/evidence/run-community-publishdrawer-browser-evidence.sh
cargo test -p traveltrust-api   # ②③ 全量 GO 键 · 与社区切片并行
```

## 用例映射（P1/P2/P3）

| ID | 用例 | spec |
|----|------|------|
| COM-P1-01 | 举报 submit → me/reports | `community-phase1-narrow-flows` |
| COM-P1-02 | reports/[id] 详情 GET 200 | 同上 |
| COM-P1-03 | activity · 仅 likes-received（无 notifications API） | 同上 |
| COM-P2-01 | me/posts 删帖 | 同上 |
| COM-P2-02 | /community/me 昵称保存 | 同上 |
| COM-P2-03 | user 页 follow | 同上 |
| COM-P2-04 | feedback submit | 同上 |
| COM-P3-01 | topic feed `tag=` | 同上 |
| COM-P3-02 | 评论抽屉发帖可见 | 同上 |
| COM-P3-03 | guidelines → terms marker | 同上 · `data-tt-terms-community-guidelines-page` |
| COM-P3-04 | 好友申请 accept | 同上 |

## 合法宣称

| 宣称 | 条件 |
|------|------|
| ① 社区窄 E2E 并集 exit 0 | 上表 + `e2e:community-l5-all` 全绿 |
| ① 全仓 G-08 | `acceptance.latest.log` 末行 `TT_GO_LOCAL_PHASE1: OK`（**独立**于社区；须 onboarding quote 200 · 见 PHASE2-REPOSITORY-STATUS） |
| ② C1～C12 / staging GO | **G-1/G-2 清闸后** · 见 [COMMUNITY-PHASE-2-3-ROADMAP](../GO_local_marketing_front_closure/COMMUNITY-PHASE-2-3-ROADMAP.md) |

## 日志

- `e2e-narrow.latest.log` — 最近一次 `e2e:community-phase1-narrow` 终端摘录（维护轮覆写）

## 2026-05-31 维护轮（① · 100% 社区切片 + G-08 复跑）

| 项 | 命令 | 证据 | 结果 | 可宣称 |
|----|------|------|------|--------|
| §七 窄 E2E P1/P2/P3 | `npm run e2e:community-phase1-narrow` | `e2e-narrow.latest.log` | **13 passed · exit 0** | **①** |
| §二 2.2 并集 | `npm run e2e:community-l5-all` | `e2e-l5-all.latest.log` | **42 passed · exit 0** | **①** |
| §二 2.3 PI-1 | `npm run e2e:pi1-community-all` | `e2e-pi1-community-all.latest.log` | **8 passed · exit 0** | **①** |
| §二 2.5 vitest | COMMUNITY-L5-CLOSURE 最小集 | `vitest-community-l5.latest.log` | **82 passed · exit 0** | **①** |
| §二 2.4 MinIO 浏览器 | `bash scripts/evidence/run-community-publishdrawer-browser-evidence.sh` | `e2e-publishdrawer-minio.latest.log` + `evidence/community-media-local-minio-chain/out/browser.har` | **3 passed · exit 0** | **①**（**非** ② staging） |
| G-08 全仓 | `bash scripts/dev/record-go-local-phase1-acceptance-log.sh` | `frontend/evidence/GO_local_phase1/acceptance.latest.log` | **`TT_GO_LOCAL_PHASE1: OK`** · `recorded=20260531T074458Z` | **①** |

**① 社区 Phase ① 可宣称：** 上表 **全部 exit 0**（MinIO 须 `evidence/community-media-local-minio-chain/out/24-env-snapshot.txt` 已存在）。

**最后机读核验：** `20260531T075008Z` — 82/13/42/8/3 与 G-08 `20260531T074458Z` 对拍见 [`evidence/GO_phase2_testnet_20260526/community/BLOCKERS.md`](../../../evidence/GO_phase2_testnet_20260526/community/BLOCKERS.md)（**非** ② GO）。

**②③：** **NOT STARTED**（G-1/G-2 / Production GO 另闸）— 见 [COMMUNITY-PHASE-2-3-ROADMAP](../GO_local_marketing_front_closure/COMMUNITY-PHASE-2-3-ROADMAP.md) §C1～C12 · §P3-COM。
