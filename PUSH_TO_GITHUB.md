# 推送到 GitHub 仓库（开发前用 SSH 上传）

仓库地址：<https://github.com/wejfiowej124234/Wbe3-TravelTrust>

## 开发前：使用 SSH 上传

**推荐使用 SSH**，避免每次输入账号密码，且与 GitHub 的 SSH 部署密钥、CI 等一致。

### 1. 确认远程为 SSH

在项目根目录执行：

```bash
cd C:\Users\plant\Desktop\Wbe3-TravelTrust

# 查看当前远程
git remote -v
# 应为：origin  git@github.com:wejfiowej124234/Wbe3-TravelTrust.git
```

若当前是 HTTPS（`https://github.com/wejfiowej124234/...`），改为 SSH：

```bash
git remote set-url origin git@github.com:wejfiowej124234/Wbe3-TravelTrust.git
```

### 2. 确保本机已配 SSH 密钥并加入 GitHub

- 若无密钥：`ssh-keygen -t ed25519 -C "你的邮箱"`，一路回车（或设密码）。
- 公钥在：`~/.ssh/id_ed25519.pub`（或 `id_rsa.pub`）。
- 在 GitHub：**Settings → SSH and GPG keys → New SSH key**，粘贴公钥保存。

测试连接：

```bash
ssh -T git@github.com
# 成功会看到：Hi wejfiowej124234! You've successfully authenticated...
```

### 3. 推送代码

```bash
cd C:\Users\plant\Desktop\Wbe3-TravelTrust

# 暂存所有变更（含 README 与 docs）
git add .

# 提交（若有未提交变更）
git commit -m "docs and code: your message"

# 推送到 main（首次可加 -u）
git push -u origin main
```

### 4. 若推送被拒（例如远端已有历史）

- 先拉再推：`git pull origin main --rebase`，然后 `git push -u origin main`
- 或强制覆盖（慎用，会覆盖远端）：`git push -u origin main --force`

---

## 若坚持用 HTTPS

```bash
git remote set-url origin https://github.com/wejfiowej124234/Wbe3-TravelTrust.git
git push -u origin main
```

---

## 确认未提交敏感内容

- `.env` 已在 `.gitignore`，不会被提交
- 勿提交密钥、密码、真实姓名/邮箱等；README 已加 Disclaimer，合规表述已收紧
