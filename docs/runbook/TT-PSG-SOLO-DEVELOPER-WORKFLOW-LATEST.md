# TT · PSG Solo Developer Workflow（LATEST）

**Status:** `ACTIVE`（默认 · Hotfix / Patch / Feature / 新 Release）  
**Machine:** [`registry/psg-solo-developer-workflow.v1.yaml`](../../registry/psg-solo-developer-workflow.v1.yaml) · `TT_PSG_SOLO_DEVELOPER_WORKFLOW`  
**Baseline:** Tag `v1.1.0-psg-go.20260717` · SHA `0bbc7adb…` · `TT_PRODUCTION_GO: GO`  
**Parent:** [PGC](./TT-PRODUCTION-GOVERNANCE-CLOSURE.md) · [RC Sequence](./TT-PSG-RELEASE-CANDIDATE-SEQUENCE.md) · [Dev Strategy FROZEN](./TT-PSG-PRODUCTION-BASELINE-DEV-STRATEGY-LATEST.md)

---

## 0 · 一句话

**个人独立开发 = Owner Self Review + Owner Sign-off + Release Archive。**  
**保留** Gate · Evidence · Freeze · Certification · Release Baseline · Release Archive。  
**移除 / 诚实降级** PR · Code Review · Reviewer · Approver · Merge Request · 双人审批 — 不再作为 PSG / Production GO 硬闸。

---

## 1 · 保留（写死 · 不因 Solo 放宽）

| 机制 | 作用 |
|------|------|
| Gate | Foundation / Alignment / Cap Cert / Production Cert 等机读闸 |
| Evidence | 可审计落盘；Archive 内字节不可改 |
| Freeze | 同一 RC 的 `freeze_manifest_id` |
| Certification | `TT_PSG_PRODUCTION_CERT` 等 |
| Release Baseline | Hotfix/Patch/下一版起点 |
| Release Archive | 正式发布不可变包 |

---

## 2 · 替换表（团队 → Solo）

| 团队流程 | Solo 替代 |
|----------|-----------|
| Pull Request / Merge Request / 发版 PR | Owner commit（+ 按需 push）· 引用 Tag / SHA / Archive |
| Code Review / Reviewer | **Owner Self Review**（对照 Gate exit + Evidence） |
| Approver / 双人复核 / 双签 | **Owner Sign-off**（单人 attestation：姓名 + `signed_utc` + decision） |
| 合线主持人 / 双人拆线 | **非 GO 硬闸**；仅可选任务卡分工（见 TT-9628 §0.0.2b **LEGACY optional**） |
| CI `on: pull_request` 叙事 | 本地 `ci-local` / gate 脚本自证（Actions 不可用时尤然） |

**词义澄清（避免误读）：**

- **PSG Review / Production Entry Review / Coverage Review** = 流程阶名 · **≠** peer Code Review  
- **CMS Draft→Review→Approved** = 内容生命周期 · **≠** Git PR  

---

## 3 · 默认流程（Hotfix / Patch / Feature）

```text
1. Branch from v1.1.0-psg-go.20260717 (or SHA)
2. Implement
3. Owner Self Review（diff + Gate exit + Evidence paths）
4. Run required Gates only · write Evidence
5. Owner commit
6. If formal release class → Owner Sign-off → new Freeze (if needed) → Release Archive
7. Next Production GO → NEW Release cycle（禁止扩展本基线 PSG 包）
```

```bash
git fetch --tags
git switch -c hotfix/<name> v1.1.0-psg-go.20260717
# … Owner Self Review …
# bash scripts/gates/…   # only gates required by the change
git commit   # Owner
```

---

## 4 · Owner Self Review 清单（模板）

复制到 commit / 工单 / Decision 包即可：

```markdown
## Owner Self Review
- [ ] Scope: Hotfix | Patch | Feature | New Release cycle
- [ ] Branched from: v1.1.0-psg-go.20260717 (or new Freeze id ________)
- [ ] Gate(s) run: ________ · exit 0
- [ ] Evidence path(s): ________
- [ ] No mutation of release_archive/v1.1.0-psg-go.20260717/
- [ ] No Gate re-run solely to refresh frozen baseline
- [ ] Owner Sign-off required? Yes/No · if Yes → attestation attached
```

---

## 5 · 禁止

- 以「缺第二 Reviewer」阻塞 Solo 合法推进  
- 因 Solo 而跳过 Gate / Evidence / Freeze / Cert  
- 改写已归档 Release Archive  
- 仅用文档宣称新的 `TT_PRODUCTION_GO`  

---

## 6 · 诚实边界

Solo Workflow ACTIVE ≠ 已自动新 GO ≠ 可跳过 Staging Cert。  
① 本地绿 ≠ ② Staging ≠ ③ Production。
