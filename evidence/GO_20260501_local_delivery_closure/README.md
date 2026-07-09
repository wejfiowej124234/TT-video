# Evidence · GO_20260501_local_delivery_closure

**阶次：** **① 本地**（非 **②** staging 全矩阵、非 **③** Production GO）。

**记录时 git HEAD：** `e1ddff25a51fd2b969f395444eae61d234510638`（`e1ddff2`）。若随后才 commit 04/14 变更，请更新本行 commit。

## 本轮收口

1. **04 §3.4 + 14 附录**：登记 `me/market-bookmarks*`、`me/profile-avatar*`、`uploads/profile-avatars/:file`，解除 `run-check-04-routes` STRICT 缺失告警。
2. **`ci-local-delivery-minimum.sh`**：`CI_LOCAL_SKIP_AI_TASK_CARD_INDEX_OVERVIEW=1` `TT9627_SEGMENT456_SPEC_PRESENCE=1` — `cargo test -p traveltrust-api`、04 路由闸、段 4–6 spec presence — **exit 0**。
3. **`check-runbook-golive-doclink-gate.sh`** — **exit 0**。
4. **段 3 窄机读**：`frontend/evidence/GO_20260426_local_final_truth/report.json` — `validate-regression-report.py --fail-on-no-go` + `vertical-slice-tt9627-segment3-r002-validate.sh` — **exit 0**（3 cases LOCAL-GATE，非全 93 矩阵）。

## 仍未闭（不冒充）

- 主脊 E2E/手点（注册→市场→创单→托管全链）
- 96-20 批量行级验证
- P0 十二项人工勾选
- 带 **`DATABASE_URL`** 的 R-002 预链 **strict**（全锚 **NOT_RUN=0**）

**96-15 全 Tier：** 本轮无对外深度审计义务 → N/A。

## 复跑（机读三连 + B-421 + 段 3 窄报告）

```bash
export CI_LOCAL_SKIP_AI_TASK_CARD_INDEX_OVERVIEW=1 TT9627_SEGMENT456_SPEC_PRESENCE=1
bash scripts/gates/ci-local-delivery-minimum.sh
bash scripts/check-runbook-golive-doclink-gate.sh
python scripts/validate-regression-report.py frontend/evidence/GO_20260426_local_final_truth/report.json --fail-on-no-go
bash scripts/gates/vertical-slice-tt9627-segment3-r002-validate.sh frontend/evidence/GO_20260426_local_final_truth/report.json
```

---

## 追加 · 2026-05-01（段 1 / 段 2 API smoke + R-002 软预链）

**环境：** `BASE=http://127.0.0.1:8080`（本机 API 已监听；`/meta` 冷路径可 **>25s**，段 1+2 合计约 **90s**）。

**段 1：** `bash scripts/gates/vertical-slice-tt9627-segment1-api-smoke.sh` → **pass**（`vertical-slice-02` + `vertical-slice-01`，`GET /api/v1/guides` items.length=3）。

**段 2：** `bash scripts/gates/vertical-slice-tt9627-segment2-hub-public-smoke.sh` → **pass**（`vertical-slice-03` + `vertical-slice-04`，community feed + posts-by-tag）。

**R-002 软预链（无 `DATABASE_URL`）：**

```bash
mkdir -p evidence/GO_20260501_local_delivery_closure/r002_soft
TRAVELTRUST_LOCAL_R002_EVIDENCE_DIR=evidence/GO_20260501_local_delivery_closure/r002_soft \
  bash scripts/gates/local-verify-r002-prereport-chain.sh
```

产物：`r002_soft/r002_iss007_prereport/report.json`，**`release_gate=PARTIAL_GO`**，**43** cases（设计如此；**不**冒充 staging 全矩阵 **GO**）。

**一键复跑段 1+2（须 API）：**

```bash
export BASE=http://127.0.0.1:8080
bash scripts/gates/vertical-slice-tt9627-segment1-api-smoke.sh
bash scripts/gates/vertical-slice-tt9627-segment2-hub-public-smoke.sh
```

**工程加固（同轮）：** **`scripts/gates/_http_smoke_retry.sh`** 与竖切 **01/02/03/04** 的 **`curl`** 默认增加 **`HTTP_SMOKE_CURL_MAX_TIME_SECS`**（默认 **180** 秒，**`0`** 关闭）；**`scripts/README.md`** 已互指。
