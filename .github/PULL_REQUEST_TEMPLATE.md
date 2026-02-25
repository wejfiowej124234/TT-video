## 说明

请填写以下与 08 门禁相关的项（若本 PR 未改 08 文档可填「无」）。

---

### 08 门禁必填（见 [08-2](docs/spec/08-2-附录-闭合工单表.md) W-PDP-SSOT-CONSISTENCY / W-DRIFT-CI）

| 必填项 | 填写 |
|--------|------|
| **受影响的 param_key 列表** | 本次 PR 修改的 08-3 中的 param_key（若无则填「无」） |
| **对应 08-4 章节** | 若上述 key 在 08-3 映射表中，填 08-4 章节号（如「第 6 章」）；否则填「无」 |
| **08-2 workitem_id** | 关联工单，如 W-BOMB-04、W-PDP-SSOT-CONSISTENCY；若无则填「无」 |
| **08-4 版本号是否已更新** | 若触及映射 key，08-4 文末「文档版本（CI 校验用）」是否已在本 PR 中更新？（是/否/不适用） |
| **若申请 CI 豁免（机读格式）** | 填写 `ci_exempt=no` 或 `ci_exempt=yes; workitem_id=W-...; reason=...; approver=...; evidence=evidence/ci_exemptions/PR-<PR号>-W-....md`。若 `ci_exempt=yes` 但缺任一字段或 evidence 文件未随 PR 提交，CI 将阻断合并。 |

---

*CI 规则：若 PR 改动 08-3 映射表中的 key 且 08-4 版本号未在本 PR 中变更，将**阻断合并**。豁免须按 [08-2](docs/spec/08-2-附录-闭合工单表.md)「CI 豁免机制」留痕。*
