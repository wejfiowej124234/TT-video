# V9修复工作流程

**STATUS:** `ACTIVE_PROTOCOL_FROZEN`  
**protocol_bar_ceiling:** `95` · **protocol_bar_closed:** `true`  
**UNIQUE_PRODUCT_PROMOTION_PROTOCOL** · 全仓**唯一**产品升阶协议  
**Machine id:** `V9_FIX_WORKFLOW` · `V9_FIX_WORKFLOW_ONLY` · 机读别名 `RTVP_V1`（**不是**第二套流程）  
**`TT_PRODUCTION_GO`:** **out of scope** · Official 写回 **≠** Production GO · **Not FTB**

**Living Official parent:** www `5c70d833a684e665d255f458a0efa1aa2b56b0cf` · API `8c522cdcfc655cfdcc5866d219dfc3254d833e32`

**SSOT 只此一篇人读 +** [`registry/v9-fix-workflow.v1.yaml`](../../registry/v9-fix-workflow.v1.yaml)

## 唯一性（必须对得上）

| 名字 | 是什么 | 不是什么 |
|---|---|---|
| **V9修复工作流程** | 官网**产品**缺陷：从 Living Pin 派生 → ①验证 → ②验证 → 写回官网 | 不是合约轨、不是 GO |
| TTG V9 / `contracts/src/ttg-v9` | Web3 合约代码 | 不走本流程改地址 |
| OPS-v9 / `TT-OFFICIAL-OPS-20260820-V9` | 官网 pin **program id** | 活字节以 Pin Index 为准 |
| Dual Plane **WEB3** 「V9 Design Freeze」 | FTB + Sepolia/主网合约梯 | 独立轨，本流程默认 `P_L7=N_A` |
| PSG / `TT_PRODUCTION_GO` | 生产 GO / 认证 / Archive | 本流程结束仍是 `NO_GO` |

禁止再并列一套「默认发布协议」。RTVP 文只是本流程的机读别名。

## Agent 默认入口（`V9_DEFAULT_INTAKE`）

用户说「有问题 / 检查 / 排查 / 修复 / 改这里」→ **默认本流程**，先分类再动手。

| hop_class | 做什么 |
|---|---|
| **CAUSAL** / **ENVIRONMENTAL** | www/api 用户可见阻断 → 派生 Candidate → ① → ② → Owner Gate → Official → `--live-hop` → 改针 → `--live` |
| **NON_CAUSAL** | 登记残差，不把当前 Candidate 判 FAIL，不另开梯子 |
| **N_A** | 合约 / FTB / Indexer / CMS catalog / Production GO — 点名原轨，**不**冒充 Official 产品 hop |

禁止：跳过分类直接改 occupied Official；Local→Official；把 Local 当产品母版。Cursor 闸：`.cursor/rules/traveltrust-v9-default-intake.mdc`（alwaysApply）。

## 专业检查（`inspect_before_repair` · 动手修之前）

**顺序写死：** 三环境身份 → 具名问题 → 工作区 → 部署对齐 → UI/UX 冻结指针 → **才允许修代码**。

| 层 | 查什么 | 对齐口径 |
|---|---|---|
| **Official** | `www.web3-ttg.com` + `api.web3-ttg.com` live SHA vs Bundle | **产品母版**。≠ Bundle 且 ≠ 当前 hop `git_head` → 未解释漂移，先停 |
| **Staging** | `tt-web-staging` / `tt-api-staging` | **不是**产品母版。SHA ≠ Official **是预期**。Staging live SHA **等于** Official Bundle → 禁止（当成活 Staging cite） |
| **Local** | bake 树 `git HEAD` | **不是**产品母版。≠ Official **是预期**。禁止用改 Local UI 去「对齐」官网视觉 |
| **工作区** | 脏文件、`TRAVELTRUST_DEPLOY_ROOT`、unlock 泄漏 | occupied 脏文件 **登记**，`DIRT_BUDGET_WARN`（默认 >200）· 修复闸 >2500 须 `TT_V9_DIRT_BUDGET_ACK=1` · **禁止** `reset --hard` |
| **部署** | Fly `tt-web-prod`/`tt-api-prod` vs `tt-web-staging`/`tt-api-staging` | 禁止 cookie/API origin 串面、mixed living bake · **Cookie/CORS 活检**：对方面 Origin 的 ACAO 不得等于对方平面 |
| **UI/UX** | 五主 / 登录注册 / Official www freeze 指针文件 **含冻结 token** | **禁止**为对齐环境而解冻五主结构；冻结面只修数据链 |
| **探活** | `named_error_probe_derive` | Owner `TT_V9_PROBE_URL` 优先，否则按具名错误映射 `/auth/login` `/community` `/market` … 或官网 `/` |

```bash
python scripts/gates/check-rtvp-release-gate.py --phase inspect
python scripts/gates/check-rtvp-release-gate.py --phase fly-heartbeat
python scripts/gates/check-rtvp-release-gate.py --phase pin-retarget-preflight
```

无网：`TT_V9_INSPECT_OFFLINE=1`（官方 hop **禁止**离线戳）。闸：[`check-v9-pre-repair-inspection.py`](../../scripts/gates/check-v9-pre-repair-inspection.py) · [`registry/v9-pre-repair-inspection.v1.yaml`](../../registry/v9-pre-repair-inspection.v1.yaml)

**protocol_bar_ceiling: 95** — 本流程作为变更控制协议的满分上限。不是产品 100%，不是 `TT_PRODUCTION_GO`。禁止自动改针、禁止闸内杀 Fly 机。

## 口号（双平面对齐）

**禁止当产品母版梯子：** `Local → Staging → Production`  
**本流程唯一口号：**

```text
从官网 live SHA 派生 Candidate（`LIVING_PARENT.yaml` / `release-identity`；Pin 未改针时禁止从旧 Bundle 开新 hop）
→ inspect（①本地 / ②测试网 / ③官网身份 + 工作区 + 部署/UI 对齐 · 先于修复）
→ ① 本地验证（含 FE npm run build + .next/BUILD_ID 戳）
→ ② Staging 验证
→ Owner Gate + 具名错误
→ 写回官网
→ --live-hop 对 hop 烘焙 SHA（www-only 不要求 API SHA==hop）
→ Owner 改 Living Pin / cite-set / product-release-baseline
→ --live 对针新 Bundle
→ Owner 确认部署结束
→ 清临时工作树（不清 occupied Official 脏文件）
```

Local / Staging **不是**产品 SSOT。

## 防回滚锁（`LIVING_PARENT` · mixed_living_bake 机读）

今天这类「修了又飘」不是闸随机失败，而是 **活官网字节 ≠ git 标签**：

1. 从 **脏 occupied 工作树** 烤进 Official，`release-identity` 仍写旧 SHA → 用户看见的修复 **没有** 进入下一跳的 git 父提交。
2. 下一跳按 **Living Pin / Bundle** 开干净 Candidate → 上一跳产品字节消失。
3. leftover 甚至标成 `not-this-hop`，仍被当官网用户可见面烤上去。
4. hop 结束后 **未改针**，下一跳再从 Pin 派生，等于再丢一次。

**写死（每跳 Official `--live-hop` PASS 后自动写）：** [`evidence/GO_v9_fix_workflow/LIVING_PARENT.yaml`](../../evidence/GO_v9_fix_workflow/LIVING_PARENT.yaml)

| 规则 | 闸 |
|---|---|
| `CAUSAL`/`ENVIRONMENTAL` inspect 必须 Candidate bake 树（≠ occupied）且 HEAD 含 Living Parent | `check-v9-pre-repair-inspection.py` |
| inspect 允许 live == `LIVING_PARENT`（Pin 仍可指向旧 Bundle） | 同上 |
| bake 树 `frontend/` · `crates/` 必须已提交；**Official 禁止** `TT_V9_BAKE_DIRTY_ACK` | `check-v9-local.py --bake-clean` / `--official` |
| 仓内旁路部署脚本先 `--phase preflight` | `scripts/dev/lib/v9-unsigned-deploy-preflight.sh` |
| hop 结束自动写改针待办（**不**改 Pin） | `PIN_RETARGET_DUE.yaml` |
| 禁止 `not-this-hop leftover` 当 Official 用户可见面 | Agent 规则 · 不进 hop |

`TT_V9_BAKE_DIRTY_ACK=1` 仅 ①/② 应急。**禁止**自动改 Living Pin / cite / Bundle。改针后 `--phase official-living-pin-live` 刷新 Living Parent。**不**自动 `TT_PRODUCTION_GO`。CMS/合约/Indexer 仍 `N_A`。

## CAUSAL（防止开缝变新功能）

Official 仅 `TT_V9_HOP_CLASS=CAUSAL` 或 `ENVIRONMENTAL`，且必须 `TT_V9_OWNER_NAMED_ERROR`（≥16 字，用户可见阻断）。

**算 CAUSAL：** 已登录仍拦发布、关键路径 404/429、写入丢失、Cookie 会话被当成未登录。  
**不算 CAUSAL：** CMS 美图、UX 改版、文案润色、五主结构/视觉、纯文档 parity。

## 最高效路径（`lean_hop` · 已确认）

日常缺陷 **不要**从 `--phase preflight` 起跳。preflight 只给未挂钩的部署脚本。

```text
classify（hop_class / surfaces / named error）
→ --phase inspect（ freshest 4-URL + CORS；cite TTL 内跳过 cite）
→ ① --phase local（inspect 戳未过期则跳过重拉；unique 已在 inspect 跑过则跳过）
→ ② staging-www|staging-api
→ CAUSAL|ENVIRONMENTAL 才 Owner Gate + official
→ fly-heartbeat（仅 Official 烘焙等待）
→ pin-retarget-preflight（清单，不改针）
→ Owner 改针后 --phase official-living-pin-live
```

NON_CAUSAL / N_A **停在 inspect 之后**，不走 ①② Official。  
这是本仓官网产品 hop 的最瘦正确路径：不并 PSG/GO、不扫全仓 SHA、不把 Local 当母版。  
Feature → PSG → Production GO 仍是**生产认证**，不是本 hop。

卡住：`--phase resume`。Official 烘焙等待超时跑 `--phase fly-heartbeat`。`TT_PRODUCTION_GO=GO` 只禁 Official hop，inspect/①② 可继续（须 unset 才能写回）。unlock 泄漏在非 Official in-flight 会 FAIL；`OFFICIAL_GATED`/`OFFICIAL_BAKED` 自动允许 inspect。陈旧 hop 不在这两个状态不得冒充 `HOP_IN_FLIGHT`。

## TIMEBOX_WATCHDOG_V1（层 · 不是第二套产品协议）

每个 hop 从 `hop_started_utc` 计时，并按 phase 累计。超时 **≠ Candidate FAIL**。状态：`NORMAL` → `WATCH` → `DIAGNOSE`（归因后再 RESUME / Owner Gate）。

| 风险 | 预警 | 强制诊断 |
|---|---|---|
| L1 FE/UI | 45m | 60m |
| L2 API/Auth/CRUD/媒体 | 75m | 100m |
| L3 Migration/Web3/Money | 按 Gate/Timelock | 不设固定总 SLA |

可自动：复用 inspect/cite TTL、NON_CAUSAL 10×4 从 Candidate 判决分离、性能报告、resume 显示 SLA。  
**禁止**为省时间：关 FE build、关 migration checksum、跳 Staging、Local→Official、自动改针、自动 `TT_PRODUCTION_GO`、改 FTB、杀 Fly 机、把 FAIL 标 PASS。

效率回归（最近 5 次 L1 平均超 SLA 30%）→ `V9_WORKFLOW_OPTIMIZATION_AUDIT` → Sandbox 改闸 → Owner 接受后才动 `ACTIVE_PROTOCOL_FROZEN`。

```bash
python scripts/gates/check-rtvp-release-gate.py --phase resume
python scripts/gates/check-rtvp-release-gate.py --phase timebox
python scripts/dev/report-v9-hop-performance.py
python scripts/dev/audit-v9-workflow-efficiency.py
```

## 闸

```bash
python scripts/gates/check-rtvp-release-gate.py --phase preflight
python scripts/gates/check-rtvp-release-gate.py --phase resume
python scripts/gates/check-rtvp-release-gate.py --phase inspect
cd frontend && npm run build
python scripts/dev/write-v9-fe-build-stamp.py
python scripts/gates/check-rtvp-release-gate.py --phase local
python scripts/dev/write-v9-hop-manifest.py --phase staging-www
python scripts/gates/check-rtvp-release-gate.py --phase staging-www
TT_V9_HOP_CLASS=CAUSAL TT_V9_OWNER_NAMED_ERROR='…user-visible blocker…' \
  TT_RTVP_OWNER_GATE=1 TT_OFFICIAL_PRODUCT_SURFACE_UNLOCK=1 \
  python scripts/dev/write-v9-hop-manifest.py --phase official-www
TT_V9_HOP_CLASS=CAUSAL TT_V9_OWNER_NAMED_ERROR='…user-visible blocker…' \
  TT_RTVP_OWNER_GATE=1 TT_OFFICIAL_PRODUCT_SURFACE_UNLOCK=1 \
  python scripts/gates/check-rtvp-release-gate.py --phase official-www
python scripts/gates/check-rtvp-release-gate.py --phase official-postdeploy-live
python scripts/gates/check-rtvp-release-gate.py --phase fly-heartbeat
python scripts/gates/check-rtvp-release-gate.py --phase pin-retarget-preflight
# Owner retargets Living Pin + product-release-baseline + cite-set, then:
python scripts/gates/check-rtvp-release-gate.py --phase official-living-pin-live
python scripts/dev/run-v9-post-deploy-cleanup.py --report
TT_V9_OWNER_CLEANUP_OK=1 python scripts/dev/run-v9-post-deploy-cleanup.py --apply --remove-ephemeral-worktrees
unset TT_RTVP_OWNER_GATE TT_OFFICIAL_PRODUCT_SURFACE_UNLOCK TT_V9_HOP_CLASS TT_V9_OWNER_NAMED_ERROR TT_V9_OWNER_CLEANUP_OK
```

`--live-hop` 证明刚烘焙的 Official 身份等于 hop `git_head`（未改的面仍等于 **parent Bundle**）。  
`--live` 只在 Owner **改针 Pin/cite** 之后证明 live == **新 Bundle**。二者都不是关键路径手测。身份对上之后仍要 Delta Reality。

烘焙树用 `TRAVELTRUST_DEPLOY_ROOT` / `TT_DEPLOY_ROOT`。Fly 镜像烘焙设 `TT_V9_FLY_STANDALONE_BUILD=1`（不把 occupied 树上的旧 `.next` 当 Candidate）。本流程不改 FTB、不签发 `TT_PRODUCTION_GO`、不并入 Indexer/CMS/合约轨。

## 覆盖边界

闸：www + API。`N_A`：Indexer、CMS catalog、合约 broadcast、Admin 独立面。旁路脚本必须先过 `--phase preflight`。

## 清理

`--apply` 只清 hop 残渣和 **EPHEMERAL_CANDIDATE** 工作树。不清 `D:/TravelTrust-V1.1` occupied 脏文件、`release/*`、`main`、FTB。
