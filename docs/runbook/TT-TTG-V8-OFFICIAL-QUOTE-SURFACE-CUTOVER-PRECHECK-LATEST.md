# TT · TTG V8 · Official Quote Surface Cutover Precheck

**STATUS:** `TTG_V8_OFFICIAL_QUOTE_SURFACE_CUTOVER_PRECHECK` · **`STOP`**  
**Reason:** `COMPILED_INDICATIVE_REQUIRES_RECOMPILE_NO_ZERO_DRIFT_OVERLAY`  
**Quote asset:** **USDC only**  
**Machine:** [TT-TTG-V8-OFFICIAL-QUOTE-SURFACE-CUTOVER-PRECHECK-LATEST.json](./TT-TTG-V8-OFFICIAL-QUOTE-SURFACE-CUTOVER-PRECHECK-LATEST.json)  
**Allowlist:** [registry/ttg-v8-official-quote-surface-allowlist.v1.yaml](../../registry/ttg-v8-official-quote-surface-allowlist.v1.yaml)  
**Evidence:** [evidence/GO_ttg_v8_quote_surface_cutover_precheck/TTG_V8_OFFICIAL_QUOTE_SURFACE_CUTOVER_PRECHECK.json](../../evidence/GO_ttg_v8_quote_surface_cutover_precheck/TTG_V8_OFFICIAL_QUOTE_SURFACE_CUTOVER_PRECHECK.json)  
**Command:** `bash scripts/dev/run-ttg-v8-official-quote-surface-cutover-precheck.sh`  
**`TT_PRODUCTION_GO`:** `NO_GO`

阶段口径：**③ 只读核验** Official `/traveltrust#liquidity` 报价面。**不是** Production GO。**不是** www bake。**不是** 整站 overlay deploy。禁止 checkout 产品 pin。禁止改页面结构 / 组件 / CSS / i18n / 公告 / ticker。

## 本闸结论

报价面 **只认 USDC**。冻结官网 **不能** 在产品字节不变的前提下，把编译期「示意」从 OLD USDC 切成 V8 `1 USDC = 100,000 TTG`。允许名单里 **唯一** 已生效、零 UI 漂移的路径是 API overlay 的「API 报价」行。示意行需要重新编译 JS → 整站 bake → **FORBIDDEN** → **STOP**。不得强行上线。

| 项 | 结果 |
|----|------|
| 生产写入 | **0** |
| Official www pin | **OPS-2026.08.20-v9** `3e356617a498b0faac42e4ae457343d36294a770` · `2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap v8 · `identity_source=docker-bake` |
| Official `/meta` | **NEW V8** Governor / TTG / PM `0x882Ad…` · FeeRouter **KEEP** `0x2aF47…` |
| 「API 报价」 | **已是 V8** `1.0000 USDC → 100000.0000 TTG`（session 水合；无 cookie 的 GET quote = **401** `STRICT_SESSION_GATE` = Expected Difference） |
| 「示意」first-paint | **仍是编译期 OLD USDC** `1 USDC → 约 0.0360 TTG` · `1 TTG ≈ 27.7778 USDC` |
| 零漂移 overlay 能否改示意 | **否** |
| 整站 rebuild / bake / overlay deploy | **未执行 · FORBIDDEN** |
| checkout `daa5ae87` | **未执行 · FORBIDDEN** |

OLD vs V8 只比 USDC：`1 USDC → 0.0360 TTG` ≠ `1 USDC → 100,000 TTG`。不得 bake。

## 双面拆开（禁止合成一行）

| 面 | 活网（USDC） | 能否不 bake 同步 V8 | 本闸 |
|----|-------------|---------------------|------|
| **API 报价** | `1 USDC → 100,000 TTG` | **能** · 已 overlay | `ALREADY_V8_LIVE` |
| **示意** | `1 USDC → 约 0.0360 TTG` | **不能** · 编译常量 | `OLD_COMPILED_USDC_INDICATIVE_REQUIRES_RECOMPILE` |

活 JS 扫描（`/traveltrust` 列出 48 chunk，扫 48）：`示意` / `API 报价` **在 pin 字节里**。`0.0360` / `27.7778` **不内嵌**（运行时算出）。`100000` TTG **不在 www JS**（报价来自 API）。

## 允许名单 vs 禁止路径

**Allow（已 live · 0 写入 · 不改 www 字节）**

- `registry/ttg-v8-api-runtime-contract-overlay.v1.json` → Official `/meta` + session「API 报价」

**Deny（本闸一律 STOP）**

| 路径 | 为什么不是零漂移 |
|------|------------------|
| `deploy-tt-web-production.sh` | 整站 bake · 替换冻结 chrome |
| `deploy-tt-web-production-web3-overlay.sh` | Docker `COPY . ./` = 整镜像替换，不是手术式报价补丁 |
| Fly `NEXT_PUBLIC_*` 改活镜像 | `NEXT_PUBLIC_*` 编译期；pin gateway 读 `ttgReferencePriceV1.ts` 常量 |
| `git checkout daa5ae87` | 剥掉未提交 Official 产品字节（公告 chips / ticker） |
| 改 `frontend/locales/*` / Gateway / CSS | i18n / 组件 / 布局 = 产品字节 |
| hop Official FeeRouter → `0xb6bf…` | KEEP `0x2aF47…` · 与报价面正交 |

## 活网探针（2026-08-18T09:04:46Z）

| 探针 | HTTP | 结果 |
|------|------|------|
| `https://www.web3-ttg.com/api/release-identity` | 200 | pin 匹配 |
| `https://api.web3-ttg.com/meta` | 200 | NEW TTG `0x0EC4…3602` · NEW PM `0x882Ad…B6D2` · NEW Governor `0xD581…787F` · FR KEEP |
| `GET …/ttg-exchange/quote?pay_stable=USDC&pay_amount=1`（无 cookie） | 401 | `STRICT_SESSION_GATE=1` |
| `https://www.web3-ttg.com/traveltrust` | 200 | HTML 192555 B · `liquidity` 存在 |

## 下一会话

`STOP_WAIT_OWNER_ACCEPT_API_QUOTE_AS_OFFICIAL_QUOTE_SURFACE_OR_LATER_EXPLICIT_DATA_ONLY_BAKE_AUTH`

Owner 只能二选一（本闸 **不** 执行任一项）：

1. **接受** Official 报价真源 = session「API 报价」V8 USDC；示意 OLD USDC = Expected Difference（CONFIRM_DESIGN）。产品面继续冻。  
2. **另闸** 书面授权 **data-only bake**（仍须证明零 UI/UX 漂移）。**本 stamp 禁止 bake。**

不得：整站 rebuild 强行把示意改成 100,000、用当前脏树 bake、checkout 旧 tip、改 FIVE-MAIN / 公告 / ticker。

## 禁止（写死）

- 本闸签发 `TT_PRODUCTION_GO=GO` 或宣称报价面已 CLOSED
- bake `tt-web-prod` / overlay deploy / restore-pin 当「切报价」
- checkout `daa5ae87` 当回滚或补丁底
- 改 Gateway 结构 / CSS / i18n / 公告 / ticker
- hop Official FeeRouter · 再发 `setGovernor` · CI-02 · Seat/Vault · 改 FTB
