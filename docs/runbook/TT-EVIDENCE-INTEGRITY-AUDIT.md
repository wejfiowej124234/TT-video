# Evidence Integrity Audit · Pre-Formal

**性质：** 发布流程一致性检查 — **不是**新 Platform Capability。  
**Machine key：** `TT_EVIDENCE_INTEGRITY_AUDIT`  
**位置：** Reality Verification **之后** · Formal Acceptance **之前**

---

## 检查项

| # | 检查 |
|---|------|
| 1 | Matrix 中 **CLOSED** 项是否有 **closed_evidence**（G2 BLOCKER 必须 repo 路径） |
| 2 | **Evidence 目录在磁盘存在**，且含可复现 marker 文件 |
| 3 | **Verification signoff** 中 VERIFIED 项与 Matrix CLOSED **一致** |
| 4 | 无 **CLOSED 无证据** · 无 **VERIFIED 但 Matrix OPEN** 漂移 |

---

## 执行

```bash
bash scripts/dev/run-evidence-integrity-audit.sh G2
```

**通过标准：** `TT_EVIDENCE_INTEGRITY_AUDIT: PASS` · exit 0 · `blocks_formal: false`

**失败：** 不得进入 G2 Formal Acceptance。

---

## Release Train 位置

```text
… → Reality Verification → Evidence Integrity Audit → Formal Acceptance → Gate PASS
```

---

## 诚实边界

- 本 Audit **不重跑** prod 探针 — 验证 **引用完整性**；复现须 `run-reality-verification.sh --gate G2`
- PASS **≠** G2 Gate PASS **≠** Production GO
