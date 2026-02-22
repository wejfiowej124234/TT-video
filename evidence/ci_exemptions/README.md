# CI 豁免记录（可机读 + 可取证）

当 PR 需要对 08 系列门禁/CI 检查做**豁免**时（仅允许在 08-2 允许的场景），必须：

1) 在 PR 模板中填写：
   - `ci_exempt=yes; workitem_id=...; reason=...; approver=...; evidence=...`
2) 在本目录新增证据文件并随 PR 一起提交（不可口头放行）：
   - 路径必须绑定 PR 号：`evidence/ci_exemptions/PR-<number>-<workitem_id>.md`
   - 内容建议包含：背景、为何必须豁免、批准人、回补计划、影响范围。

CI 会自动校验：字段是否齐全、证据文件是否在本 PR 中提交。
