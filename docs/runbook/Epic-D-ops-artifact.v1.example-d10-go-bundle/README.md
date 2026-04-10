# Epic D-10 · GO bundle 示例目录（非运行时产物）

**目的**：展示 **`evidence/GO_YYYYMMDD/`** 在 **`INDEXER_EVIDENCE_WRITE_MANIFEST=1`** 或 **`INDEXER_EVIDENCE_BUNDLE_ZIP=1`** 后的**最小收口形状**（与 **`write-indexer-evidence.sh` / `internal-indexer-ops.sh evidence-bundle`** 一致）。

## 目录结构（示例）

```text
GO_20260409/
  indexer_public_snapshot_20260409T123456Z.json   # D-02 · artifact_type snapshot_public
  artifacts/
    epic_d_d03_indexer_status.json                # D-03 · indexer_status（须 INTERNAL_API_SECRET）
    epic_d_d04_indexer_status_live.json           # D-04 · indexer_status
    epic_d_d05_reconcile.json                     # D-05 · reconcile
  indexer_public_snapshot_manifest.json           # 与历史脚本同名；与 manifest.json 同内容
  manifest.json                                   # evidence/README 约定名
  manifest.sha256                                   # sha256sum -c 可校验清单内文件
  epic_d_go_bundle_closure.json                   # traveltrust.ops_artifact.v1 · bundle + 根级 bundle_closure（epic / closure_status / included_tasks）
  indexer_evidence_bundle_GO_20260409_<ts>.zip    # 仅当 INDEXER_EVIDENCE_BUNDLE_ZIP=1
```

## 收口说明

- **只读**：快照与 Epic D 附档均为 **GET** / **`reconcile` 无 persist**；**不**触发修复、**不**写 **`reconciliation_reports`**（与 **`SNAPSHOT_INTERNAL_SKIP_RECONCILE`** 等语义仍由 **`indexer-public-snapshot.sh`** 决定）。
- **两类以上 D-02～D-05**：默认在设 **`INTERNAL_API_SECRET`** 时拉取 **artifacts/epic_d_d03～d05**；无密钥时仅 **`snapshot_public`**，须在 **`payload.artifact_types_detected`** 中可见缺口。
- **校验**：`cd GO_* && sha256sum -c manifest.sha256`；closure 内 **`payload.manifest`** 与 **`manifest.json`** 对齐；**`bundle_closure.included_tasks`** 与目录内实际附档一致（可脚本比对）。

同目录 **`manifest.json`**、**`manifest.sha256`**、**`epic_d_go_bundle_closure.json`** 为**静态示例**（hash 与路径为演示值）。
