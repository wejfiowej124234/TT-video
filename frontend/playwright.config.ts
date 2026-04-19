/**
 * E2E：关键路径见 e2e/smoke.spec.ts、e2e/smoke-governance.spec.ts、e2e/smoke-community.spec.ts、e2e/smoke-admin.spec.ts、e2e/core-path.spec.ts、e2e/release-flow.spec.ts
 * 运行：npx playwright install 后 npm run e2e（能连上 baseURL 则复用已有 dev/start，否则自动启动）
 *
 * 全栈（API + Next）：`npm run e2e:auth-chain` 或 `PLAYWRIGHT_FULL_STACK=1 npx playwright test …`
 * 会并行拉起 `traveltrust-api`（默认 8080，`scripts/dev/start-api-for-playwright.*`）与 Next。
 *
 * **稳定性（P0）**：默认 **`workers: 1`**、**`fullyParallel: false`**，避免多 worker 抢 DB/API/端口。
 * 显式并发：`PLAYWRIGHT_PARALLEL=1`（可选 `PLAYWRIGHT_WORKERS=4`）→ **`fullyParallel: true`**，同一 spec 内用例也可分到多 worker。
 *
 * **L4 并行度（阶段二 · 观测）**：**无 `globalSetup`** 全局阻塞；`chromium-sepolia` 仅依赖 **`setup-meta-chain`**（短）。在 **`fullyParallel: false`** 时，**`workers: 1`** 会使 **smoke / smoke-governance / smoke-community / smoke-admin 与其它 spec 全部串行**；将 **`PLAYWRIGHT_WORKERS`≥2** 后，**不同测试文件**可并行（例如多份烟雾各占一 worker），**同一文件内**用例仍按定义顺序占用该文件所在 worker。若需 **单文件内**并行，须 **`PLAYWRIGHT_PARALLEL=1`**。`npm run e2e:sepolia` 可选用 **`PLAYWRIGHT_L4_FILE_PARALLEL=1`**（脚本内默认 **`PLAYWRIGHT_WORKERS=4`**，不改 `grepInvert`；争用高时可显式 **`PLAYWRIGHT_WORKERS=2`**）或 **`PLAYWRIGHT_L4_FULL_PARALLEL=1`**（等价打开 **`PLAYWRIGHT_PARALLEL=1`** + workers），**须自行复跑 193/0** 再考虑进 CI。
 *
 * **链元数据（P0）**：`chromium` 依赖 **`setup-meta-chain`**（`e2e/setup/meta-chain-contracts.spec.ts`）。
 * 测试网 / chain-on：勿设 `PLAYWRIGHT_RELAX_META_CHAIN_GUARD`，并保证根 `.env` 已 `bash scripts/dev/sync-frontend-env-local-from-root.sh`。
 * CI 链关烟测：workflow 设 **`PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1`**（仅校验 `/meta` 200）。
 * 可选 Sepolia 对拍：**`PLAYWRIGHT_EXPECT_CHAIN_ID=11155111`**。
 *
 * **L4 Sepolia 主链基线**：`npm run e2e:sepolia` → **`chromium-sepolia`** project（同依赖 `setup-meta-chain`）；
 * 固化口径与证据登记见 **`docs/runbook/TT-L4-CHROMIUM-SEPOLIA-E2E-BASELINE-001.md`**。
 * 通过 `grepInvert` 排除 **`@e2e-chain-off-mock-pay`**（mock-pay / 链下 A 类）与 **`@e2e-sepolia-deferred`**（暂缓：P05、UI logout）。
 * 单独跑暂缓项：`npx playwright test --project=chromium --grep @e2e-sepolia-deferred`。
 *
 * 可选：`PLAYWRIGHT_SKIP_ESCROW_API_TESTS=1` 跳过 `e2e/53-main-path.spec.ts`（仅本地；CI 勿设）。
 * Epic F-08：`e2e/epic-f-normal-release-real.spec.ts`（`@e2e-three-pack-real`）用 **`PLAYWRIGHT_API_BASE_URL`**（默认 `http://127.0.0.1:8080`）；CI 默认跳过，设 **`RUN_EPIC_F_E2E_REAL_PATH=1`** 才执行；见 `docs/runbook/Epic-F-e2e-three-pack-ladder.md` **F-08**。
 */
import { defineConfig, devices } from "@playwright/test";

const fullStack = process.env.PLAYWRIGHT_FULL_STACK === "1";
const isWin = process.platform === "win32";
const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3012";

/** 与 `npm run dev`（run-dev.mjs）的 FRONTEND_PORT 对齐，避免 Playwright 与手工 dev 抢 3012 且复用陈旧进程。 */
function fePortFromBase(url: string): string {
  try {
    const u = new URL(url);
    if (u.port) return u.port;
    if (u.protocol === "http:") return "80";
    if (u.protocol === "https:") return "443";
  } catch {
    /* fall through */
  }
  const m = url.match(/:(\d+)(?:\/|$)/);
  return m ? m[1] : "3012";
}

const fePort = fePortFromBase(baseURL);

const startApiCmd = isWin
  ? "powershell -NoProfile -ExecutionPolicy Bypass -File ../scripts/dev/start-api-for-playwright.ps1"
  : "bash ../scripts/dev/start-api-for-playwright.sh";

const nextCmd = process.env.CI ? "npm run start" : "npm run dev";

const feReuse = process.env.PLAYWRIGHT_REUSE_FE_SERVER !== "0";
/** 设为 `0` 时强制拉起 `cargo run -p traveltrust-api`，避免 8080 上陈旧进程导致契约与 E2E 不一致 */
const apiReuse = process.env.PLAYWRIGHT_REUSE_API_SERVER !== "0";

const parallel = process.env.PLAYWRIGHT_PARALLEL === "1";
const workersEnv = process.env.PLAYWRIGHT_WORKERS?.trim();
const parsedWorkers =
  workersEnv !== undefined && workersEnv !== "" ? Number.parseInt(workersEnv, 10) : NaN;
const workers = parallel
  ? Number.isFinite(parsedWorkers)
    ? parsedWorkers
    : undefined
  : Number.isFinite(parsedWorkers)
    ? parsedWorkers
    : 1;

const feServer = {
  command: nextCmd,
  url: baseURL,
  reuseExistingServer: feReuse,
  timeout: 120_000,
  env: {
    ...process.env,
    ...(nextCmd === "npm run dev"
      ? {
          FRONTEND_PORT: fePort,
          TRAVELTRUST_FRONTEND_PORT: fePort,
          // next.config rewrites() 在 dev 启动时读该变量；全栈 E2E 须与 traveltrust-api 端口一致，否则 /auth/* 落到 Next 返回 HTML
          ...(fullStack ? { NEXT_PUBLIC_API_BASE_URL: `http://127.0.0.1:${apiPort}` } : {}),
        }
      : {}),
  },
};

const apiServer = {
  command: startApiCmd,
  url: `http://127.0.0.1:${apiPort}/health`,
  reuseExistingServer: apiReuse,
  timeout: 420_000,
};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: parallel,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers,
  reporter: "html",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "setup-meta-chain",
      testMatch: "**/setup/meta-chain-contracts.spec.ts",
      /** 全栈冷启动 + 多 worker 观测时 API 偶发晚于 30s；与 chromium-sepolia 对齐，避免 setup 假红 */
      timeout: 120_000,
    },
    {
      name: "chromium",
      dependencies: ["setup-meta-chain"],
      testIgnore: "**/setup/**",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium-sepolia",
      dependencies: ["setup-meta-chain"],
      testIgnore: "**/setup/**",
      /** 主链 L4：不含 chain-off mock-pay 与暂缓项，用于 Sepolia 全绿基线 */
      grepInvert: /@e2e-chain-off-mock-pay|@e2e-sepolia-deferred/,
      /** 多 worker / 全栈负载下避免 30s 默认用例超时误杀（仍须保持 193/0 语义） */
      timeout: 120_000,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: fullStack ? [apiServer, feServer] : feServer,
});
