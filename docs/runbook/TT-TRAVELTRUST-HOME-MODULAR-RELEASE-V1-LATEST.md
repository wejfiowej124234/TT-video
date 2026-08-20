# TRAVELTRUST_HOME_MODULAR_RELEASE_V1

**STATUS:** `REGISTRY_SAMPLED_THREE_ENV`  
**`TT_PRODUCTION_GO`:** `NO_GO`  
**Route:** `/traveltrust` only（`/` 定制旅行不在本册）  
**Machine:** [`registry/traveltrust-home-module-registry.v1.yaml`](../../registry/traveltrust-home-module-registry.v1.yaml)

把官网、本地、Staging 统一到同一套 Homepage Module Registry。每个首页区域有唯一 Module ID。任何一次发布必须声明 `RELEASE_SCOPE`：只允许目标模块变化，其余模块 0-drift。

这不是在 Fly 上物理替换一个 React 文件。Next.js 仍会重建镜像。「只更新模块」= Release Scope + hash/diff/runtime 证明范围外模块零漂移。

**禁止** official/local 双轨（`tt_home_variant` / `officialBody` / `localBody`）。环境差异只来自配置和 CMS 数据。

**不要**用模块数量判断谁对谁错。先映射，再逐个 Release 收口。

① 本地绿 ≠ ② Staging GO ≠ ③ Production GO。本册不签发 Production GO，也不授权 bake Official www。

---

## 目标架构

```
HOME_PAGE
├── M01 Header
├── M02 LIVE / Nav
├── M03 Pulse
├── M04 Hero
├── M05 Trust
├── M06 Settlement
├── M07 Unlock
├── M08 Liquidity
├── M09 Roles
├── M10 FAQ
└── M11 Start / CTA
```

`LOCKED_HOME_CHROME` + `HOME_BODY_MODULE` 是第一层隔离。LOCKED 只是**本轮发布策略**（今天不改 M01–M03），不是永久架构名。以后改 Header：`RELEASE_SCOPE=M01_HEADER`，只验 M01，其余 0-drift。

---

## Module Lifecycle（5 态 · 写死）

Presence（mounted / absent）与 Lifecycle 正交。不要只用 Active / Pending。

| 状态 | 含义 | 能否上线 |
|------|------|----------|
| `CANONICAL_ACTIVE` | 正式模块 | ✅ |
| `LOCAL_ONLY_PENDING` | 本地开发中 | ❌ |
| `READY_FOR_RELEASE` | 已完成、等待发布 | ⚠️ 需 Owner 授权 `TT_HOME_MODULE_RELEASE_AUTH=1` |
| `PROD_ONLY_REBASE` | 官网独有，需要回同步 | ❌ |
| `DEPRECATED` | 待删除模块 | 单独删除 Release（`TT_HOME_MODULE_DELETE_RELEASE=1`） |

禁止：`LOCAL_ONLY_PENDING` 直接进 `RELEASE_SCOPE` · 跳过 `READY_FOR_RELEASE` · Local 直接上官网。`TT_HOME_ALLOW_PENDING_SCOPE` 已废止。

### M07 路径（禁止 Local 跳官网 · bake 前不得写 Active）

```
LOCAL_ONLY_PENDING
        │
        ▼
READY_FOR_RELEASE          ← 须 ledger：from_state / to_state / git_sha / tests / timestamp / reason
        │                     禁止手改 Registry
        ▼
Release Scope PASS
        │
        ▼
Staging / Production deploy
        │
        ▼
Runtime verification PASS
        │
        ▼
CANONICAL_ACTIVE           ← 仅部署后可写；deploy FAIL 则保持 READY_FOR_RELEASE
```

本波 M07 **仍是** `LOCAL_ONLY_PENDING`。Ledger 条目 = 0。Owner 确认 Unlock 完成后用 recorder 晋升 Ready，**不要**直接改 YAML。

```bash
python scripts/dev/record-traveltrust-home-module-lifecycle.py \
  --module M07 --from LOCAL_ONLY_PENDING --to READY_FOR_RELEASE \
  --reason "..." --tests "python scripts/gates/check-traveltrust-home-module-registry.py" \
  --apply-registry
```

`CANONICAL_ACTIVE` 另需 `--deploy-result PASS --runtime-result PASS --release-scope M07_UNLOCK`。本脚本 **不** Fly-deploy。

第一次建表：**Production 已存在模块**记入 `canonical_seed`（M01–M06、M08–M11），不是一次 bake。以后晋升 Canonical 必须走 ledger。

---

## 当前映射（2026-08-19 · Staging 已只读采样）

Official live `https://www.web3-ttg.com/traveltrust`（OPS-2026.08.20-v9 `3e356617` / `2026-08-20T00:51:57Z`）：tip may include `id=unlock` with pre-windows titles; **M07 module** production = absent.

Staging live `https://tt-web-staging.fly.dev/traveltrust`（`git_sha=2ba08bd4` / `2026-08-15T12:30:19Z`，只读）：**同一套存在性** — 有 FAQ/Start，没有 Unlock。本波 **没有** bake Staging。

Local living layout lock `v17-prod-rebase-m10-m11`：回挂 M10/M11；**保留** M07 Unlock（Pending）。

| ID | 模块 | Local | Staging | Production | Registry |
|----|------|-------|---------|------------|----------|
| M01 | Header | mounted | mounted | mounted | CANONICAL_ACTIVE · 本轮锁 |
| M02 | LIVE/Nav | mounted | mounted | mounted | CANONICAL_ACTIVE · 本轮锁 |
| M03 | Pulse | mounted | mounted | mounted | CANONICAL_ACTIVE · 本轮锁 |
| M04 | Hero | mounted | mounted | mounted | CANONICAL_ACTIVE |
| M05 | Trust | mounted | mounted | mounted | CANONICAL_ACTIVE |
| M06 | Settlement | mounted | mounted | mounted | CANONICAL_ACTIVE |
| M07 | Unlock | mounted | **absent** | **absent**（M07 模块） | **LOCAL_ONLY_PENDING** |
| M08 | Liquidity | mounted | mounted | mounted | CANONICAL_ACTIVE |
| M09 | Roles | mounted | mounted | mounted | CANONICAL_ACTIVE |
| M10 | FAQ | **archived** | mounted | mounted | **DEPRECATED**（截图序列无 FAQ；删官网须单独删除 Release） |
| M11 | Start/CTA | mounted | mounted | mounted | CANONICAL_ACTIVE（同上） |

> **OPS-v9 真源说明：** Official 活面 = `3e356617` / `…-v9-20260820`。Tip 可能仍挂 `id="unlock"` 且文案为旧版「Unlock schedule / TTG public unlock」——那是 **OPS-v9 字节**，**不是** M07「公开窗口」CANONICAL。M07 overlay（`2551fafd` / `…-m07-unlock`）已回滚；**禁止**把 M07 写成 OPS-v9。

机器读法：

```
M01–M06, M08–M09, M11  ALIGNED Canonical
M07                     LOCAL_ONLY_PENDING（禁止自动 bake · ≠ OPS-v9 改名）
M10                     DEPRECATED · Local archived（截图无 FAQ）
```

数量仍然可以不同：Local 比 Staging/Production 多一个 M07。禁止按数量抹平。将来首页更新只声明 `RELEASE_SCOPE=M07_UNLOCK`：机器检查只有 M07 变、M01–M06 与 M08–M11 0-drift、Build PASS、Runtime PASS，再由 Owner 授权 Production 更新。禁止整页覆盖。本闸 **不** 自动 Fly-deploy。

---

## Release Scope

```bash
RELEASE_SCOPE=M07_UNLOCK
# 或 RELEASE_SCOPE=M04,M05
python scripts/gates/check-traveltrust-home-module-registry.py
python scripts/gates/check-traveltrust-home-release-scope.py
```

闸相对 `TT_HOME_MODULE_DIFF_BASE`（默认 Official pin SHA）做 diff，**只检查 Homepage 模块宇宙**（各模块 `own_paths` + 共享壳 + `page_shell_paths`）。仓库里其它脏文件不由本闸裁决。

- 范围内模块 `own_paths` 可变
- 共享壳（现 `TravelTrustLandingChrome.tsx` = M02+M03）必须把全部 owner 列入 Scope，否则 FAIL
- 编排壳（MainColumn / Body / Chrome 包装 / sectionMarkers）须 `RELEASE_SCOPE` 含 `PAGE_SHELL`
- 本轮锁模块（M01–M03）未列入 Scope → 若这些文件有 diff 则 FAIL
- `LOCAL_ONLY_PENDING` → **禁止**进 Scope（须先晋升 `READY_FOR_RELEASE`）
- `READY_FOR_RELEASE` → 须 `TT_HOME_MODULE_RELEASE_AUTH=1`（仍不自动 bake）
- `PROD_ONLY_REBASE` → 禁止进 Scope
- `DEPRECATED` → 仅删除 Release + `TT_HOME_MODULE_DELETE_RELEASE=1`
- Registry / 闸 / 本 runbook 在 `scope_allowlist`

活树相对 pin 会有多模块 diff，这是预期；本闸用于**声明了 Scope 的 Release worktree**，不是日常 dirty tree 绿灯。本地可把 `TT_HOME_MODULE_DIFF_BASE=HEAD` 只验未提交变更。

依赖、build、runtime 都 PASS 之后才可以发布。本闸 **不** 自动 Fly-deploy。

---

## 代码挂点

- DOM：`data-tt-home-module="M0x"`
- TS 镜像：`frontend/lib/traveltrustHomeModuleRegistry.ts`
- 第一层壳仍保留 `data-tt-locked-home-chrome` / `data-tt-home-body-module`（17/17 模块化分界）

FIVE-MAIN `/traveltrust` 结构/视觉本波不拆 LandingChrome。M02 与 M03 是逻辑模块，指向现有 Nav / Pulse 文件。

---

## R1 Rebaseline（首页完成之后 · 本波 NOT_STARTED）

等这次首页模块收口后，再正式进入 R1。**本波不执行、不自动 bake、不清 worktree。**

1. Production 更新 M07（**仅当** Owner 确认上线，且已走完 Ready → Scope PASS → deploy → runtime PASS → **然后**才写 `CANONICAL_ACTIVE`）
2. 铸造新的 Production Baseline
3. Local 从新 Baseline 重建
4. Staging 从新 Baseline 重建
5. 三环境 Module Registry 100% 一致
6. 清空旧 Worktree / Stash / Dirty Tree

完成之后才是真正的模块级发布：改任何一个模块不再牵动整页。`r1_rebaseline.status` 现为 `NOT_STARTED`，`wait_for: homepage_module_close`。
