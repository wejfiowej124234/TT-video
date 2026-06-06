# `/me/password` · ① 修改密码（L5 子页）

**阶段：① 本地** — F-006 `PUT /api/v1/me/password`；入口自 **`/me/settings`**。

**冻结 / 绿集：** [`ME-SETTINGS-L5-FREEZE.md`](../../evidence/GO_local_auth_l5/ME-SETTINGS-L5-FREEZE.md)

```bash
bash scripts/dev/smoke-me-settings-local.sh
```

成功保存后会话吊销，须用新密码重新登录（见页内文案）。
