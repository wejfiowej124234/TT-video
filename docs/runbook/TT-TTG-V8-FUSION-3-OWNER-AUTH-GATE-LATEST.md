# TT · TTG V8 fusion · 独立闸 `TTG_V8_FUSION_3_DEPLOY_AND_SETGOVERNOR_OWNER_AUTH_REQUIRED`

当前工作 SSOT：**第一步 MUST 1–7 已收敛** · [TT-TTG-V8-FUSION-3-GENESIS-ADDRESS-FILLS-LATEST.md](./TT-TTG-V8-FUSION-3-GENESIS-ADDRESS-FILLS-LATEST.md)  
**STATUS:** 第一步 **CONVERGED** · **2A RUNTIME_PASS** · **Verification-1 PASS_STOP** · **2B `setGovernor` RUNTIME_PASS**  
**Machine:** [TT-TTG-V8-FUSION-3-OWNER-AUTH-GATE-LATEST.json](./TT-TTG-V8-FUSION-3-OWNER-AUTH-GATE-LATEST.json)  
**Pin：** `8b09d297`（唯一 fusion 候选 · 不改）  
**Preflight：** `1a2f1e18`（已入库 · **不重跑、不修改**）  
**`TT_PRODUCTION_GO`:** `NO_GO`

阶段口径：**① 本地 → ② 测试网 → ③ 公网/生产**。本闸与 Preflight 是两件独立审计事件。

---

## Owner 书面 2A（本会话）

Owner 写出（不含「是否」）：

> Owner 正式授权 ③ Mainnet Deploy NEW TTG / NEW PM / NEW Governor，并允许 Safe 做 NEW_TTG allowlist。本授权不含 Verification-1 与 setGovernor。

该句打开 **2A** `MAINNET_DEPLOY_AND_ALLOWLIST`。**不**打开 2B。

---

## 入口纪律（写死）

- **禁止**重跑或修改 `TTG_V8_FUSION_3_PREFLIGHT_PASS_STOP` / git `1a2f1e18`。
- Pin Solidity SHA 仍是 `8b09d297`。
- MUST 1–7 **不是** 2B 授权。
- **禁止**把 Deploy 与 `setGovernor` 捆成同一份书面授权。
- 2A 广播脚本 **禁止**调用 `setGovernor`。

---

## 第一步（pack CONVERGED）

见 [Genesis 地址确认与职责映射](./TT-TTG-V8-FUSION-3-GENESIS-ADDRESS-FILLS-LATEST.md)。三槽已点名。MUST 1–7 已点头。

---

## 后续授权拆成两份独立事件

| 闸 | 范围 | 状态 |
|----|------|------|
| **2A** `MAINNET_DEPLOY_AND_ALLOWLIST` | ③ Deploy NEW TTG · NEW PM · NEW Governor（MUST 执行 1–5、7）+ Safe `setAllowedExecutionTarget(NEW_TTG, true)`（MUST 执行 6 · admin 配置 · 非 48h） | **RUNTIME_PASS** · 本会话 Owner 句已执行 |
| **2B** `VERIFICATION_1_AND_SETGOVERNOR` | Verification-1（开源 / 0.8.26 无 0.8.19 横幅 / 无貔貅·增发·升级·黑名单）+ Safe `setGovernor(NEW)` | **拆开：** Verification-1 **PASS_STOP** · `setGovernor` **RUNTIME_PASS** |

**2A PASS ≠ Verification-1 ≠ `setGovernor`。** Owner 写死 Verification-1 **必须先于任何切针**；随后书面授权 **Safe → 活 Timelock → `setGovernor(0xD5819acACdA86F2C73de4a18cb5e4464ECAF787F)`**。该刀已执行。**不含** FTB · `/meta` · Official www bake · Production GO。

**2A 不含：** Verification-1 · `setGovernor` · FTB 改写 · `/meta` cutover · Official www bake · Money Path 再部署 · 迁移活网 10M `0x3cB1…` · `TT_PRODUCTION_GO`。

**2B 不含：** 再部署一套 TTG/PM/Governor（除非 2A 被 Owner 明确作废）。

同会话 Etherscan + Sourcify = **deploy hygiene**，**不是** 2B 的 Verification-1。

---

## 本闸当前态

| 项 | 状态 |
|----|------|
| Preflight `1a2f1e18` | **CLOSED** · 不重跑 · 不修改 |
| Pin `8b09d297` | **唯一候选** |
| 第一步 MUST 1–7 | **CONVERGED** |
| 2A Deploy + Safe allowlist | **RUNTIME_PASS** · 见 evidence `GO_ttg_v8_mainnet_2a` |
| Verification-1 | **PASS_STOP** · 三份 Etherscan + Sourcify `exact_match` · 余额/参数已对 |
| 2B `setGovernor(NEW)` | **RUNTIME_PASS** · tx `0x94f61c61…2216` · 独立于 FTB/`/meta`/www |
| Mainnet broadcast | **2A + setGovernor 已广播** · Timelock `governor()` = NEW `0xD581…787F` |

NEW TTG `0x0EC40c8a4ff31Fcc9e65121C1A38310df0413602` · NEW PM `0x882Ad1926cCea965C189a83aB12a02dBcCB8B6D2` · NEW Governor `0xD5819acACdA86F2C73de4a18cb5e4464ECAF787F`（已 `setGovernor`）。

`TT_PRODUCTION_GO` 仍 **NO_GO**。**不是** Official www product surface live（www 仍冻 OLD bake）。**不是**覆盖 FTB `20260812`。Living FTB = V8 Cycle `20260818` Active Truth。Official **API Runtime** 已 NEW。不得再部署 TTG/PM。不得 bake www。不得用 Bitget HOLD unwind V8 针。

**Official Product Runtime Cutover Precheck** 已 `PASS_STOP`（只读 · 生产写入 0）。[API Runtime Decoupling](./TT-TTG-V8-API-RUNTIME-DECOUPLING-NO-WEB-TOUCH-LATEST.md) 已 `PASS_STOP` 且 **API-only Official deploy 已执行**。[Registry/Runtime/L7 Consistency Cert](./TT-TTG-V8-REGISTRY-RUNTIME-MAINNET-REALITY-CONSISTENCY-CERT-LATEST.md) **`PASS_STOP`**（引用，不重证）。FTB 吸收已闭：**另立 NEW Cycle，不覆盖 `20260812`**。[Final Reality / Release Certification](./TT-FINAL-REALITY-RELEASE-CERTIFICATION-LATEST.md) **`PASS`**（`blocking_p0_p1=0`）。[Production GO 重评](./TT-PRODUCTION-GO-REASSESSMENT-LATEST.md) **`STOP`**（`required_before_go=8` · `hard_gate=REFUSED` · Owner 裁决 **NOT_THIS_TURN**）。Token Risk · Bitget HOLD 继续独立。禁止迁币 / 拆仓 / 再发 `setGovernor` / 改写父本 `20260812`。HOLD_RESCAN 仍绑定、**不得 unwind V8 针**。
