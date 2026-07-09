# 十日首发 · 发布证据包（模板）

**用法：** 在仓库根创建 `evidence/GO_YYYYMMDD/`（发版日 8 位），复制本模板内容到该目录 `README.md`；**SCOPE** 见同目录 **`GO_10DAY_PUBLISH-SCOPE.md`**。

## D0 必填

| 项 | 值 |
|----|-----|
| **D0 起始日** | YYYY-MM-DD |
| **D10 目标日** | YYYY-MM-DD |
| **模式** | 单人 · 无 PR · **阶段一无 CI** · 阶段二③ CI `e2e` |
| **Fly staging** | API: `https://____.fly.dev` / FE: `https://____.fly.dev` |
| **Fly preprod** | API: / FE: |
| **Fly prod** | API: / FE: |
| **Git tip** | `git rev-parse HEAD` → |

## 范围锁定

- [ ] S-01～S-09（见 `SCOPE.md`）

## 三阶段：技术项 → 问题清单 → 签字 → 再下一阶段

1. 复制 **[phase-signoff.md](GO_10DAY_PUBLISH-phase-signoff.md)** 到本目录。  
2. 复制三份问题清单模板（或从本包已有文件维护）：  
   - **`issues-phase1-local.md`** ← [模板](GO_10DAY_PUBLISH-issues-phase1-local.md)  
   - **`issues-phase2-staging.md`** ← [模板](GO_10DAY_PUBLISH-issues-phase2-staging.md)  
   - **`issues-phase3-production.md`** ← [模板](GO_10DAY_PUBLISH-issues-phase3-production.md)  
3. 每阶段按 TT-MASTER **[§0.6.1 / §0.6.2](../TT-MASTER-PUBLISH-GO-CHECKLIST-001.md#tt-master-publish-phase-issue-lists)** **🛑** 操作。

| 阶段 | 何时停 | 问题清单（PI-x） | 签哪里 | 回表勾 | 未闭/未签禁止 |
|------|--------|------------------|--------|--------|----------------|
| 一 D3 | A 区全勾 | `issues-phase1-local.md` P0 闭卷 | PH-1 段 | **PI-1** → **PH-1** | 阶段二 |
| 二 D6 | B+C-01/02+L 全勾 | `issues-phase2-staging.md` P0 闭卷 | PH-2 段 | **PI-2** → **PH-2** | 阶段三 |
| 三 D10 | 全表全勾 | `issues-phase3-production.md` P0 闭卷 | 本 README 末段 | **PI-3** → **M-00** | 对外上线 |

**[fly-secrets.md](GO_10DAY_PUBLISH-fly-secrets.md)**（**B-12**）

## 逐日日志

| 日 | 阶段 | 完成 ID | exit / URL |
|----|------|---------|------------|
| D0 | 一 | | |
| … | | |
| D10 | M-00 | |

## M-00 总闸

本人确认：**TT-MASTER §0.5 + §1 全 `[x]`**（含 **PI-1/PI-2/PI-3** 与 **PH-1/PH-2**）；**`issues-phase3-production.md` P0 已闭**；本窗口**无剩余缺口**，可 **Production GO**。

- 签字：________ 日期：________
