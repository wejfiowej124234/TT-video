# Production Entry Review Regression

**Status:** **GRADUATED** · **2026-06-30** · **Configuration Zero Drift: FROZEN**

Production Entry Review 配置一致性审计（PER-20260630 + PER-FINAL-20260630）**已毕业**。后续配置类复发仍登记 `defects-registry.json`，但 **不再** 以独立 PER Sprint 推进 — 并入主线 **Manual UAT → Business Defect → Regression**；仅 **新配置面** 可评估解冻 Configuration。

配置漂移复发、模板分叉、env 不同步等问题 **不是** Configuration Sprint — 走维护轨：

```
发现 → DEFECT-NNN (module: Config / PER) → 修复 → REG-NNN → 验证 → CLOSED
```

## 与 Configuration 的边界

| | Configuration (FROZEN) | PER (GRADUATED) |
|--|------------------------|-----------------|
| 范围 | CFG-001～028 已毕业 | PER-20260630 批已关闭 |
| 登记 | `config-drift-registry.json` | `defects-registry.json`（复发登记） |
| 验证 | `verify-cfg-drift-closure.sh`（维护闸） | 同上 + `verify-staging-per-final.sh`（② 可选） |
| 新增 CFG-029+ | 仅新配置面 + unlock | **禁止** |

## ① 本地常用命令

```bash
powershell -File scripts/dev/apply-per-regression-local-env.ps1
bash scripts/dev/verify-cfg-drift-closure.sh
```

## Project mainline

See [TT-PROJECT-MAINLINE-PRODUCT-VERIFICATION.md](TT-PROJECT-MAINLINE-PRODUCT-VERIFICATION.md).

## ② staging（PER Final 已验）

```bash
TRAVELTRUST_PER_S01_FLY_OK=1 bash scripts/dev/apply-per-s01-staging-registry-fly.sh
fly deploy -c deploy/fly/tt-api-staging/fly.toml -a tt-api-staging  # deployment_profile 须当前 API 镜像
bash scripts/dev/verify-staging-per-final.sh
TRAVELTRUST_STAGING_META_VERIFY=1 bash scripts/dev/verify-cfg-drift-closure.sh --batch B3
```

## SSOT

- Signoff: `evidence/manual-uat/signoff/PER-REGRESSION-FINAL-20260630.md`（**GRADUATED**）
- Prior: `PER-REGRESSION-20260630.md`
- Dashboard: `evidence/manual-uat/dashboard/PHASE3-READINESS.md`

## 审计复发纪律（写死 · 2026-06-30）

任意审计/手测发现「配置类」问题时，**先问：这是不是新的配置面？**

| 答案 | 动作 |
|------|------|
| **否**（漂移、模板分叉、env 未同步、Fly secret 漏推、历史键残留） | **PER Regression**：`DEFECT-NNN` → 修复 → `REG-NNN` → `verify-cfg-drift-closure.sh`；**禁止**重开 Configuration Sprint / CFG-029+ |
| **是**（新业务域需要新的 env 维度、新 Fly app、新链上部署面） | Owner 评估 `TRAVELTRUST_CFG_REGISTRY_UNLOCK=1` 与解冻文档；否则仍走 PER 最小修复 |

**② Testnet Sign-off** 与 **③ Production** 的 PSP / 主网链地址 **不在** Configuration/PER 毕业批范围；staging Fly 对拍见 `verify-staging-per-final.sh`。
