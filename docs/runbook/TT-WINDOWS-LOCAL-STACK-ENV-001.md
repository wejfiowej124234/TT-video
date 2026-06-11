# TT-WINDOWS · Windows 本地全栈：编码、终端与 Docker 预检

**Version:** 0.1.0  
**Status:** Runbook — **减少「一行被 cmd 当命令执行」与「Docker 未起」类故障**；**不**替代 **`scripts/dev/start-api-with-seed.bat`** 内注释与 **`preflight-local-stack.ps1`** 正文。

**仓库路径：** `docs/runbook/TT-WINDOWS-LOCAL-STACK-ENV-001.md`

---

## 1. 推荐用法（优先级从高到低）

1. **Git Bash**（随 Git for Windows）或 **PowerShell 7+**：在**仓库根**执行 **`bash scripts/dev/start_dev.sh`**（若本机已装 Bash）或按 **`scripts/start-api-with-seed.bat`** 头注释从根目录运行。  
2. **`cmd.exe`**：必须从 **`D:\TravelTrust`**（你的盘符）**根**执行 **`scripts\start-api-with-seed.bat`**；入口脚本**已含** **`chcp 65001 >nul`**（UTF-8），**勿**把带中文的 **Markdown 表格或说明**整段粘贴进 **`cmd`** — **`cmd` 会把行首非命令文本当程序名**。  
3. **双击 `.bat`**：仍受当前目录影响；**优先**「右键 → 在终端中打开」再 `cd` 到根后运行。

---

## 2. 常见错误与对策

| 现象 | 对策 |
|------|------|
| **`'xxx' is not recognized…`** 且 `xxx` 像中文碎片 | **勿**在 **`cmd`** 里执行从文档复制的多行说明；用 **PowerShell / Bash** 跑脚本，或只运行**单行** **`scripts\start-api-with-seed.bat`**。 |
| **`preflight: ERROR Docker not available`** | 先启动 **Docker Desktop**（或等价引擎），待 **`docker info`** 正常后再跑预检。Step 0 会**尝试自动启动** Docker Desktop 并等待最多 **120s**；禁用：`set TRAVELTRUST_SKIP_DOCKER_AUTOSTART=1`。 |
| **`The system cannot find the path specified`** | 确认当前目录为**仓库根**；路径中**勿**混用全角括号 **`）`** 与半角 **`)`**。 |
| **Rust / Node 版本** | 以 **`preflight-local-stack.ps1`** 输出为准；与 **CONTRIBUTING** 推荐版本冲突时**以仓库脚本与 CI 矩阵为真**。 |

---

## 3. 与交付顺序、治理测试网的挂接

- **阶次与证据**：仍遵守 **[TT-9627](TT-9627-delivery-order-spine-then-full-site.md)** **§0.a**（**①→②→…**）；**①** 本地栈只解决「能起服务」，**不**顶替 **§0.b** 的 **② 治理** 证据。  
- **一键入口**：根目录代理 **`scripts/start-api-with-seed.bat`** → **`scripts/dev/start-api-with-seed.bat`**（**Step 0** 预检同源）。

---

## 4. 修订记录

| 版本 | 日期 | 摘要 |
|------|------|------|
| 0.1.0 | 2026-04-30 | 首版：UTF-8 / cmd 误解析 / Docker / 路径；互指 **TT-9627**。 |

---

**文档结束**
