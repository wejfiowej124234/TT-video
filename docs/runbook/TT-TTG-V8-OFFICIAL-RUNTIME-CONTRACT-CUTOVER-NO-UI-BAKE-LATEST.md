# TT · TTG V8 · Official Runtime Contract Cutover · NO_UI_BAKE

**STATUS:** `TTG_V8_OFFICIAL_RUNTIME_CONTRACT_CUTOVER_NO_UI_BAKE` · **historical** `STOP_BLOCKED_RUNTIME_DECOUPLING_REQUIRED` · **SUPERSEDED for `/meta`/quote**  
**Closed by:** [TT-TTG-V8-API-RUNTIME-DECOUPLING-NO-WEB-TOUCH-LATEST.md](./TT-TTG-V8-API-RUNTIME-DECOUPLING-NO-WEB-TOUCH-LATEST.md) · successor cert [TT-TTG-V8-REGISTRY-RUNTIME-MAINNET-REALITY-CONSISTENCY-CERT-LATEST.md](./TT-TTG-V8-REGISTRY-RUNTIME-MAINNET-REALITY-CONSISTENCY-CERT-LATEST.md)  
下文「Official `/meta` 仍 OLD / BLOCKED」是 **2026-08-18 01:16Z** 解耦缺口快照。当前 Official API Runtime **已** NEW。**禁止**把本 STOP 当成 V8 切针失败或回滚令。  
**Machine:** [TT-TTG-V8-OFFICIAL-RUNTIME-CONTRACT-CUTOVER-NO-UI-BAKE-LATEST.json](./TT-TTG-V8-OFFICIAL-RUNTIME-CONTRACT-CUTOVER-NO-UI-BAKE-LATEST.json)  
**Evidence:** [evidence/GO_ttg_v8_runtime_cutover_no_ui_bake/TTG_V8_OFFICIAL_RUNTIME_CONTRACT_CUTOVER_NO_UI_BAKE.json](../../evidence/GO_ttg_v8_runtime_cutover_no_ui_bake/TTG_V8_OFFICIAL_RUNTIME_CONTRACT_CUTOVER_NO_UI_BAKE.json)  
**`TT_PRODUCTION_GO`:** `NO_GO`

阶段口径：**③ Official 运行时切针被本闸 STOP**。不是 Production GO。不是官网已与 Mainnet Reality 对齐。

## 本闸动作（已执行）

| 项 | 结果 |
|----|------|
| 进行中 checkout | **CANCEL** · 无 `index.lock` · 无 `git checkout` / `switch` / `stash` / `reset` / `rebase` 进程 |
| 切到 `release/inbox-focus-product-truth-1ff71858` 或任何旧 release/tip | **未执行** |
| Stash / Commit / Discard 后继续 checkout | **未执行** |
| Official www checkout / rebuild / bake / 重发 | **未执行** |
| Fly secrets / API image / `tt-web-prod` | **未执行** · 生产写入 **0** |
| `setGovernor` / CI-02 / Money Path / 25T / FTB | **未执行** |

生产 www Product Truth = OPS-2026.08.20-v9：`git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820`（本窗口暂不可改）。

## 为什么 STOP（解耦缺口）

Owner 授权只允许 **Living Registry + Official API `/meta` + 可独立更新的 runtime Web3 配置**；禁止 checkout 旧 tip、禁止改冻结 FE、禁止 bake www。

| Official 引用 | 能否在不 checkout / 不改 FE / 不 bake www 下生效 | 结论 |
|---------------|--------------------------------------------------|------|
| `/meta` `governor_address` / `governance_token_address` | 当时活镜像 `8df2ab21` 已读 Fly env · **仅 secrets 可改** | 本轮 **不单独改 secrets**（当时缺 PM 键 + 报价仍 OLD = 假对齐） |
| `/meta` `primary_market_address` | 当时活镜像 **无此键** · 须新 API 代码/镜像 | **当时 BLOCKED** · **之后已闭** overlay |
| Runtime 报价 1 USDC = 100,000 TTG | 当时活镜像报价仍是编译期 CNY mock · **非 env SSOT** | **当时 BLOCKED** · **之后已闭** |
| 官网合约地址展示 | FE `.ts/.tsx` **无** `NEXT_PUBLIC_GOVERNOR_*` / `TOKEN` / `PRIMARY_MARKET` · 读 `/meta` | 不需要 bake · **当时** `/meta` 仍 OLD · **2026-08-18 活 overlay：** `/meta` **NOW** NEW |
| 官网 first-paint 报价行 | 编译在 `frontend/lib/governance/primaryMarketRuntimePriceSsot.ts` | bake 禁止 · **www chrome 仍 compiled OLD**（Expected Difference） |

先前为给活 pin `8df2ab21` 打 API overlay 而建的 detached worktree **已停用**（那就是 checkout 旧 tip）。**禁止**从该树或任何 worktree 重发 www；**禁止**用当前脏树 `1a2f1e18` 当 Official API 整镜像（身份会漂离 `8df2ab21`）。

## Official 仍为 OLD（本轮实测 · **2026-08-18 01:16Z 快照**）

`GET https://api.web3-ttg.com/meta`（当时）：

- `git_sha=8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51`
- `governor_address=0x46Ce671b04d21760e496646bb370ADEbC374ea4d` **OLD**
- `governance_token_address=0x3cB1b328E7a4ea01006b0697813aFEEdafe8512A` **OLD**
- `primary_market_address` **缺键**
- 759 列表 **14 键**（无 PM）
- Timelock / Wired / Official FeeRouter **KEEP**（未改）

**2026-08-18 活 overlay：** Official `/meta` **NOW** 发布 NEW Governor / NEW TTG / NEW PM `0x882Ad` + SR-FT。本段是解耦缺口快照，**禁止**当当前 Runtime。www chrome bake 仍 **FORBIDDEN**。

禁止宣称：「官网合约面已经与当前 Mainnet Web3 Reality 对齐。」（本快照当时。）**之后：** Consistency Cert 允许 Registry Official + Official API Runtime + L7 已 NEW 对齐；www / FTB / Production GO 仍禁止。

## 下一会话才能继续的解耦（Owner 另闸 · 当时）

**之后已发生：** API overlay 解耦 + Official `/meta`/quote NEW + Registry/Runtime/L7 一致性认证 `PASS_STOP`。本 STOP **不再**阻塞 V8 主网切针。www bake 与 FTB 吸收仍另闸。

在 **不** checkout 旧 tip、**不** bake www 的前提下，当时须先让活 API 镜像把下列变成 **runtime 配置**（env / 远程 SSOT），再一次同步 `/meta` + 报价：

1. `PRIMARY_MARKET_ADDRESS` 进入活 `/meta` 759 列表  
2. 官方报价 `usdc_per_ttg=0.00001` / `ttg_per_usdc_unit=1e23` **非编译死**  
3. 可选：first-paint 报价与 `/meta`/quote **同源**（否则继续诚实标注 compiled OLD）

在此之前：**STOP**。不得 secrets-only。不得假对齐。`TT_PRODUCTION_GO=NO_GO`。
