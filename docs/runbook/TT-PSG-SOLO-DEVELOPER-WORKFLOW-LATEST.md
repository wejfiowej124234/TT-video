# TT · PSG Solo Developer Workflow（LATEST）

**Status:** `ACTIVE`（默认 · Hotfix / Patch / Feature / 新 Release）  
**Machine:** [`registry/psg-solo-developer-workflow.v1.yaml`](../../registry/psg-solo-developer-workflow.v1.yaml) · `TT_PSG_SOLO_DEVELOPER_WORKFLOW`  
**Baseline:** Tag `v1.1.0-psg-go.20260717` · SHA `0bbc7adb…` · `TT_PRODUCTION_GO: GO`  
**Parent:** [PGC](./TT-PRODUCTION-GOVERNANCE-CLOSURE.md) · [RC Sequence](./TT-PSG-RELEASE-CANDIDATE-SEQUENCE.md) · [Dev Strategy FROZEN](./TT-PSG-PRODUCTION-BASELINE-DEV-STRATEGY-LATEST.md)

---

## 0 · 一句话

**本项目 = 个人独立开发（Solo）。默认不开任何 Pull Request / Merge Request。**

**个人独立开发 = Owner Self Review +（正式 Release）时间隔离复检 + Owner Sign-off + Release Archive。**  
**保留** Gate · Evidence · Freeze · Certification · Release Baseline · Release Archive。  
**移除 / 诚实降级** PR · Code Review · Reviewer · Approver · Merge Request · 双人审批 — 不再作为 PSG / Production GO 硬闸。  
**GitHub push 后出现的「Create a pull request」提示 = 平台噪音，不是本仓流程。**

**质量真源不是 PR，而是：** 自动 Gate · Evidence · Freeze · Certification · Release Archive · Owner Sign-off。

---

## 1 · 固定全链（正式 Production Release）

```text
feature/* | hotfix/* | patch/*
            │
            ▼
      Owner Self Review
            │
            ▼
      Local Engineering          （①）
            │
            ▼
     Staging Engineering         （②）
            │
            ▼
      Foundation Gate
            │
            ▼
     Alignment Audit
            │
            ▼
      RC Baseline Freeze
            │
            ▼
 Capability Certification
            │
            ▼
 Production Entry Review
            │
            ▼
 Production Certification
            │
            ▼
  Time-separated recheck         （W5 · 正式 Release 必做）
            │
            ▼
      Owner Sign-off
            │
            ▼
     Release Baseline
            │
            ▼
     Release Archive
            │
            ▼
      TT_PRODUCTION_GO
            │
            ▼
        Release Closed
```

Hotfix / Patch / Feature **日常迭代**可只跑变更所需子集；**正式 Release / 新 GO** 须走全链，且遵守下方 **W5**。

---

## 2 · 保留（写死 · 不因 Solo 放宽）

| 机制 | 作用 |
|------|------|
| Gate | Foundation / Alignment / Cap Cert / Production Cert 等机读闸 |
| Evidence | 可审计落盘；Archive 内字节不可改 |
| Freeze | 同一 RC 的 `freeze_manifest_id` |
| Certification | `TT_PSG_PRODUCTION_CERT` 等 |
| Release Baseline | Hotfix/Patch/下一版起点 |
| Release Archive | 正式发布不可变包 |
| Owner Sign-off | 最终责任人 attestation |

---

## 3 · 替换表（团队 → Solo）

| 团队流程 | Solo 替代 |
|----------|-----------|
| Pull Request / Merge Request / 发版 PR | Owner commit（+ 按需 push）· 引用 Tag / SHA / Archive |
| Code Review / Reviewer（第二双眼睛） | **Owner Self Review** + **W5 时间隔离复检**（正式 Release） |
| Approver / 双人复核 / 双签 | **Owner Sign-off**（单人 attestation） |
| 合线主持人 / 双人拆线 | **非 GO 硬闸**（TT-9628 §0.0.2b = LEGACY optional） |
| CI `on: pull_request` 叙事 | 本地 `ci-local` / gate 脚本自证 |

**词义澄清：** PSG Review / Production Entry Review / Coverage Review = 流程阶 · **≠** peer Code Review。CMS Review = 内容生命周期 · **≠** Git PR。

---

## 4 · W5 · 时间隔离复检（正式 Release · 写死）

**规则：** 任何**正式 Release** 的 **Owner Self Review** 与最终 **Owner Sign-off** **不得**在同一连续工作会话内完成。

**须至少一次独立复检**（例如隔一段时间后重新检查关键清单），并再次确认：

1. Gate 结果仍成立  
2. Evidence 路径与内容一致  
3. Release Note / Baseline 叙述一致  
4. Release Archive（或拟归档清单）一致  

然后再签字。

**原因：** PR 的核心价值之一是第二双眼睛；Solo 下**不假装有 Reviewer**，用**时间隔离后的再次审视**替代。

**禁止：** 同一次连续会话内「自审完立刻 Sign-off → GO」。

---

## 5 · Owner Self Review 清单（模板）

见 [TT-PSG-OWNER-SELF-REVIEW-CHECKLIST-TEMPLATE.md](./TT-PSG-OWNER-SELF-REVIEW-CHECKLIST-TEMPLATE.md)。

---

## 6 · 禁止

- 以「缺第二 Reviewer」阻塞 Solo 合法推进  
- 正式 Release **同会话** Self Review + Sign-off  
- 因 Solo 而跳过 Gate / Evidence / Freeze / Cert  
- 改写已归档 Release Archive  
- 仅用文档宣称新的 `TT_PRODUCTION_GO`  

---

## 7 · 诚实边界

Solo Workflow ACTIVE ≠ 已自动新 GO ≠ 可跳过 Staging Cert。  
① 本地绿 ≠ ② Staging ≠ ③ Production。
