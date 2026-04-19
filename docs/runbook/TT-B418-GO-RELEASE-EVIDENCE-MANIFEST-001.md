# TT-B418 · B-418 — GO 闭环：发版证据 manifest / hash

**母表**：[B-418](../任务母表.md)  
**卡号**：`TT-B418-GO-RELEASE-EVIDENCE-MANIFEST-001`  
**状态**：已封口（2026-04-16）

---

## 1. 验收封口

**机读**：`bash scripts/validate-evidence-manifest.sh validate <evidence/GO_*>`（可选 `--verify-artifact-files` 全量哈希）。

**基线包**：`evidence/GO_20260409`。CI 与 **IMP-EV-001** 同序（见 **[evidence/README.md](../../evidence/README.md)**、**[.github/workflows/evidence-manifest-validate.yml](../../.github/workflows/evidence-manifest-validate.yml)**）。

---

## 2. 互证

- **[spec/07](../spec/07-开发流程与顺序.md)**  
- **GO 总册**：[TT-GO-CLOSELOOP-10-B418-B427-001.md](./TT-GO-CLOSELOOP-10-B418-B427-001.md#b-418--tt-b418-go-release-evidence-manifest-001)
