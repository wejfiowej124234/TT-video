# TT-PHASE2-DEEP-RELEASE-GATE · 多维 Release Gate（Phase ②）

**生效：** 2026-06-07  
**阶段：** ② 测试网 / staging · **≠ Phase ③ Production GO**  
**编排 SSOT：** [PHASE2-LOCAL-STAGING-PARITY-LOOP](./PHASE2-LOCAL-STAGING-PARITY-LOOP.md)

---

## 0 · 目的

在 **S6 复跑 / Phase ②.8 HAT / Phase ③ 入口** 之前，对 **staging 真 host** 做 **多维机读验收**：

- **禁止** 用 ① `localhost` 绿集或本地 CI 冒充 **② staging 绿**
- **FAIL 时明确阻断：** `S6` · `HAT` · `Phase ③`
- 所有子闸输出 **report.json + SUMMARY.md**

---

## 1 · 八维 Gate（G01–G08）

| ID | 名称 | 验证内容 | 数据源 |
|----|------|----------|--------|
| **G01** | API/Web SHA 一致性 | API `/meta` 与 Web `/meta` rewrite 的 `build.git_sha` 一致；可选 `PHASE2_EXPECT_GIT_SHA` | staging HTTP |
| **G02** | `/meta` 契约 | service · build_top_keys · chain_id · dual_write · indexer · meta_top_keys(37) · database · governance · product_roles | staging API |
| **G03** | 五角色登录冒烟 | seed → tourist / guide / merchant / admin / governance 登录 + 关键 API | staging API |
| **G04** | Admin RBAC 矩阵 | ADM-U01 六角色 deny/pass（`run-admin-rbac-staging-matrix.py`） | staging API |
| **G05** | DB migrate-from-zero | G-2 证据 +（可选）`DATABASE_URL` 上 `sqlx migrate info` 无 Pending | 证据 + staging PG |
| **G06** | Seed 数据一致性 | `seed_test_accounts` meta · 稳定 user_id · tourist `/me` | staging API |
| **G07** | Staging env 完整性 | 无 `R003_LOCAL_CHAIN` · R-003 env · health/CORS · build.env 对拍 | env 文件 + HTTP |
| **G08** | HAT 前置阻断 | staging host 校验 · G01–G07 全绿 · 下游 block 策略 | 编排 |

**P0 失败 → gate FAIL → `release_gate: NO_GO`**

**P1 子项（如 merchant 无种子、G-2 仅证据）→ gate WARN；不单独阻断整体 PASS**（见脚本 `severity`）

---

## 2 · 命令

```bash
# 独立跑（推荐 deploy 后、S6/HAT 前）
bash scripts/dev/run-phase2-deep-release-gate.sh

# 跳过慢速 RBAC（G04 仅登记 skip — 正式收口勿用）
bash scripts/dev/run-phase2-deep-release-gate.sh --skip-rbac

# 接入 parity 编排（S6 前自动跑）
bash scripts/dev/run-phase2-local-staging-parity-gate.sh --staging-retest

# 仅 deep gate
bash scripts/dev/run-phase2-local-staging-parity-gate.sh --deep-release-gate
```

**Windows Fly 代理：**

```bash
export HTTPS_PROXY=http://127.0.0.1:15715
# 勿把 api.fly.io 放入 NO_PROXY
```

---

## 3 · 机读输出

| 产物 | 路径 |
|------|------|
| JSON | `evidence/GO_phase2_testnet_20260526/deep-release-gate/<stamp>/report.json` |
| Markdown | 同目录 `SUMMARY.md` |
| latest 指针 | `deep-release-gate/latest` → 最近 stamp |

**末行 grep 键：**

```text
TT_PHASE2_DEEP_RELEASE_GATE: PASS|FAIL
TT_PHASE2_DEEP_RELEASE_GATE_RELEASE: GO|NO_GO
TT_PHASE2_DEEP_RELEASE_GATE_BLOCKS: S6,HAT,PHASE3   # 仅 FAIL
```

**JSON `kind`：** `traveltrust.phase2_deep_release_gate.v1`

---

## 4 · 与 S6 / HAT / Phase ③ 关系

```text
S5 deploy ──► Deep release gate (G01–G08) ──► S6 UAT / Closing Gap
                         │
                         ├── FAIL ──► 阻断 S6 · HAT · Phase ③
                         └── PASS ──► 允许 S6；HAT 脚本读 latest report.json
```

- **`run-phase2-local-staging-parity-gate.sh --staging-retest`**：S6 块**之前**自动跑 deep gate
- **`run-phase28-human-acceptance-test.sh`**：启动时断言 deep gate **PASS + release_gate GO**（`HAT_SKIP_DEEP_GATE=1` 仅调试）

---

## 5 · 环境变量

| 变量 | 含义 |
|------|------|
| `STAGING_API_BASE` | 默认 `https://tt-api-staging.fly.dev` |
| `STAGING_WEB_BASE` | 默认 `https://tt-web-staging.fly.dev` |
| `PHASE2_EXPECT_GIT_SHA` | 期望 API git_sha（默认 `git rev-parse HEAD`） |
| `PHASE2_DEEP_GATE_OUT` | 证据目录 override |
| `PHASE2_DEEP_GATE_ALLOW_LOCAL` | `=1` 允许 localhost（**仅调试**） |
| `PHASE2_DEEP_GATE_PASSWORD` | 五角色登录密码（默认 `Test123!`） |
| `HAT_SKIP_DEEP_GATE` | `=1` 跳过 HAT 前置（**禁止**用于正式 staging GO 宣称） |

---

## 6 · 禁止项

1. **禁止** 在 `127.0.0.1:8080` 跑本 gate 并写入 staging GO 证据（除非 `ALLOW_LOCAL` 调试）。  
2. **禁止** deep gate FAIL 仍跑 S6 / HAT / 进 Phase ③。  
3. **禁止** `--skip-rbac` 结果替代正式 ADM-U01 收口。  
4. **禁止** 本地 `ci-local-delivery-minimum` 绿冒充本 gate PASS。

---

## 7 · 相关脚本

| 脚本 | 角色 |
|------|------|
| `scripts/dev/phase2-deep-release-gate.py` | 八维检查 + JSON/MD |
| `scripts/dev/run-phase2-deep-release-gate.sh` | Shell 包装 |
| `scripts/gates/run-admin-rbac-staging-matrix.py` | G04 |
| `scripts/dev/check_r003_staging_env_ready.py` | G07 子集 |
| `scripts/dev/record-phase2-g2-staging-sqlx-migrate-evidence.sh` | G05 证据来源 |

---

*Maintainer: Phase ② delivery · 独立开发期本地 exit 0 为真源 · CI 恢复后可挂 workflow 复跑同一脚本*
