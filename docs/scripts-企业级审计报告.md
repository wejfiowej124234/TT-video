# Scripts 企业级审计报告

**审计范围**：终止能力、启动顺序与依赖、数据库/后端/前端、前端 URL 可访问性、错误处理与可观测性。

---

## 一、审计结论概览

| 能力项 | 结论 | 说明 |
|--------|------|------|
| **能否终止** | ✅ 通过 | 可终止 traveltrust-api.exe 与占用 8080/3012 的进程；新增 stop-all.bat 仅终止前后端不关 Docker |
| **能否启动数据库** | ✅ 通过 | docker compose up -d，启动前已用 docker info 检查 Docker 可用 |
| **能否启动后端** | ✅ 通过 | 新窗口 PORT=8080、SEED_TEST_ACCOUNTS=1，cargo run -p traveltrust-api |
| **能否启动前端** | ✅ 通过 | run-frontend.bat 在 frontend 目录执行 npm run dev，Next 端口 3012 |
| **前端 URL 能否打开页面** | ✅ 通过 | 端口 3012、根路径 / 与 /auth/login 正确；脚本已提示等 Ready 后再访问 |
| **错误处理** | ✅ 已加强 | Docker 不可用/ compose 失败时退出并提示；run-frontend 无 node_modules 时先 npm install |

---

## 二、终止能力

### 2.1 start-api-with-seed.bat（步骤 1）

- **行为**：先 `taskkill /F /IM traveltrust-api.exe`，再按端口杀 8080、3012、3000 上的 LISTENING 进程。
- **实现**：`netstat -ano ^| findstr ":8080.*LISTENING"`，`for /f "tokens=5"` 取 PID（Windows 下第 5 列为 PID），`taskkill /F /PID %%a`。
- **结论**：能终止后端与前端进程；无匹配时 taskkill 报错已用 `2>nul` 抑制。
- **补充**：已提供 **stop-all.bat**，仅做上述终止、不执行 `docker compose down`，便于只重启前后端。

### 2.2 start_dev.sh / stop_dev.sh（Linux/Mac）

- **行为**：kill_port(8080)、kill_port(3012)；stop_dev 还按 .dev_backend.pid、.dev_frontend.pid 杀进程。
- **结论**：能终止后端与前端；与 Windows 脚本行为对齐（端口 8080/3012）。

---

## 三、启动顺序与依赖

### 3.1 start-api-with-seed.bat

| 步骤 | 动作 | 依赖 | 等待 |
|------|------|------|------|
| 1 | 终止旧进程 | 无 | ping 约 2 秒 |
| 2 | docker compose down -v；up -d | Docker Desktop 已启动 | ping 约 5 秒 |
| 3 | 新窗口启动后端（PORT=8080） | 无 | — |
| 4 | — | 后端 | ping 约 30 秒 |
| 5 | 新窗口启动前端（run-frontend.bat） | 无 | — |

- **顺序**：先清端口 → 再起数据库 → 再起后端 → 等约 30 秒 → 再起前端。依赖关系正确。
- **风险**：首次 `cargo run` 编译可能超过 30 秒，脚本已提示「约 1 分钟后运行 e2e-verify.bat」。
- **改进**：已在前端启动说明中增加「请等待前端窗口出现 Ready on http://localhost:3012 后再用浏览器打开」（B-445 / CFG-017）。

### 3.2 run-frontend.bat

- **工作目录**：`cd /d "%ROOT%\frontend"`，保证在 frontend 下执行。
- **依赖**：无 node_modules 时自动 `npm install`；依赖 Node 18+。
- **结论**：能正确启动前端；首次安装失败会 pause 并退出。

### 3.3 start_dev.sh

- **顺序**：kill 端口 → 启动后端并写 PID → 轮询 /health 最多 10 秒 → 启动前端并写 PID。
- **改进**：已为前端设置 `export PORT="$FRONTEND_PORT"`，Next.js 使用该端口，与文档 3012 一致。

---

## 四、数据库 / 后端 / 前端

### 4.1 数据库

- **方式**：`docker compose up -d`，容器名 traveltrust-postgres，端口 5432。
- **前置**：已用 `docker info >nul 2>&1` 检查 Docker 可用，失败则提示启动 Docker Desktop 并退出。
- **结论**：能启动数据库；Docker 未运行时不会继续执行 compose。

### 4.2 后端

- **端口**：脚本内强制 `set PORT=8080`，与前端默认 NEXT_PUBLIC_API_BASE_URL 一致。
- **种子**：`SEED_TEST_ACCOUNTS=1`，测试账号可登录。
- **结论**：能启动后端且端口与前端配置一致。

### 4.3 前端

- **端口**：`frontend/package.json` 固定 `npm run dev` → **3012**（CFG-017 · 与 `docs/spec/38` 一致）。
- **URL**：http://localhost:3012、http://localhost:3012/auth/login 正确。
- **结论**：能启动前端；在「等 Ready 后再访问」的前提下，前端页面可正常打开。

---

## 五、前端 URL 与页面可访问性

| 检查项 | 结果 |
|--------|------|
| 端口 | 3012（脚本与 package.json dev 一致） |
| 根路径 | http://localhost:3012/ 由 e2e-verify 用 curl 检测 |
| 登录页 | http://localhost:3012/auth/login，脚本与文档一致 |
| 使用前提 | 需等 Next 编译完成、窗口出现 "Ready on http://localhost:3012" 后再访问，已在脚本中提示 |

e2e-verify.bat 会检查 3012 是否 LISTENING 且根路径 HTTP 可访问，能发现「端口在听但未 Ready」的中间状态（curl 会失败）。

---

## 六、已做改进汇总

1. **stop-all.bat**：新增「仅终止」脚本，不关 Docker，便于只重启前后端。
2. **start-api-with-seed.bat**：增加 `docker info` 前置检查；compose 失败时提示检查 docker-compose.yml 与 5432；强调「等 Ready 后再打开浏览器」。
3. **start_dev.sh**：前端启动前 `export PORT="$FRONTEND_PORT"`，保证 Next 使用配置端口（默认 **3012**）。

---

## 七、建议使用方式

1. **一键启动（Windows）**：项目根执行 `scripts\start-api-with-seed.bat`，等待两个新窗口出现，前端窗口出现 "Ready on http://localhost:3012" 后访问 http://localhost:3012/auth/login。
2. **仅终止（Windows）**：执行 `scripts\stop-all.bat`，再按需重新运行 start-api-with-seed.bat。
3. **验证**：启动约 1 分钟后执行 `scripts\e2e-verify.bat`，确认数据库、8080、3012、登录四项通过。
4. **Linux/Mac**：`./scripts/start_dev.sh` 启动，`./scripts/stop_dev.sh` 停止。

---

*本报告与 scripts/README.md、docs/测试账号与本地联调.md 配套。*
