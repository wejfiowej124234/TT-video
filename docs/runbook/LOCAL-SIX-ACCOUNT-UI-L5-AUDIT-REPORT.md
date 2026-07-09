# LOCAL-SIX-ACCOUNT-UI-L5-AUDIT-REPORT

**Generated:** 2026-06-30 11:33 UTC · **Stamp:** `20260630T112524Z`

**阶段口径：** ① 本地 → ② 测试网 → ③ 公网/生产

> **诚实边界：** 本报告 **仅** 覆盖 **① 本地** 固定六账号浏览器 + L3 机读旁证。**不得** 冒充 **② Graduation GO** / staging 全矩阵 GO / **③ Production GO**。

- **API:** `http://127.0.0.1:8080`
- **Frontend:** `http://127.0.0.1:3012`
- **Evidence:** `evidence/local-six-account-ui-l5-audit/20260630T112524Z/`

## 总表

| 项 | 结论 |
|----|------|
| **浏览器六账号矩阵** | PASS 0 · WARN 0 · FAIL 0 |
| **Playwright matrix exit** | ❌ 1 |
| **② Graduation GO** | **否**（① 本地旁证） |

## 1 · 浏览器 · 账号 × 路径

| 账号 | 邮箱 | 路径 | 标签 |  verdict | 备注 | 截图 |
|------|------|------|------|---------|------|------|

## 2 · 机读旁证（P0 + 域）

| 探针 |  verdict |
|------|---------|
| `playwright-b469-guides-drawer-booking-convergence` | ❌ FAIL |
| `playwright-steward-workbench-full-l5` | ❌ FAIL |
| `playwright-guide-workbench-full-l5` | ❌ FAIL |
| `playwright-provider-workbench-full-l5` | ❌ FAIL |
| `playwright-governance-proposals-full-l5` | ❌ FAIL |
| `playwright-orders-list-to-escrow` | ❌ FAIL |
| `playwright-93-matrix-path-did-rank-boards` | ❌ FAIL |
| `escrow-ui-bilateral` | ❌ FAIL |

## 3 · 修复清单（FAIL/WARN）

- **FAIL** machine `playwright-b469-guides-drawer-booking-convergence` · D:\TravelTrust-V1.1\evidence\local-six-account-ui-l5-audit\20260630T112524Z\machine\playwright-b469-guides-drawer-booking-convergence.rc
- **FAIL** machine `playwright-steward-workbench-full-l5` · D:\TravelTrust-V1.1\evidence\local-six-account-ui-l5-audit\20260630T112524Z\machine\playwright-steward-workbench-full-l5.rc
- **FAIL** machine `playwright-guide-workbench-full-l5` · D:\TravelTrust-V1.1\evidence\local-six-account-ui-l5-audit\20260630T112524Z\machine\playwright-guide-workbench-full-l5.rc
- **FAIL** machine `playwright-provider-workbench-full-l5` · D:\TravelTrust-V1.1\evidence\local-six-account-ui-l5-audit\20260630T112524Z\machine\playwright-provider-workbench-full-l5.rc
- **FAIL** machine `playwright-governance-proposals-full-l5` · D:\TravelTrust-V1.1\evidence\local-six-account-ui-l5-audit\20260630T112524Z\machine\playwright-governance-proposals-full-l5.rc
- **FAIL** machine `playwright-orders-list-to-escrow` · D:\TravelTrust-V1.1\evidence\local-six-account-ui-l5-audit\20260630T112524Z\machine\playwright-orders-list-to-escrow.rc
- **FAIL** machine `playwright-93-matrix-path-did-rank-boards` · D:\TravelTrust-V1.1\evidence\local-six-account-ui-l5-audit\20260630T112524Z\machine\playwright-93-matrix-path-did-rank-boards.rc
- **FAIL** machine `escrow-ui-bilateral` · D:\TravelTrust-V1.1\evidence\local-six-account-ui-l5-audit\20260630T112524Z\machine\escrow-ui-bilateral.rc

## 4 · 复跑命令

```bash
bash scripts/dev/run-local-six-account-ui-l5-audit.sh
```

**① ≠ ②：** TN-P1 / Graduation / staging RBAC 全矩阵须 **G-1/G-2** 后另闸。
