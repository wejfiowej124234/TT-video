# GO-95 · §10.5 前端 `npm run build` — `UserMenu` / `useSearchParams` 与 Windows 构建旁证

**日期**：2026-04-22  
**范围**：**§10.5**「**`npm ci` + `npm run build` 绿**」之**部分**工程修复 + **本机构建真值**（**不**勾 **§10.5** 全文 **`[x]`**）。

## 1 代码变更（可审）

- **`frontend/components/Header.tsx`**
  - **`UserMenu`** 重命名为 **`UserMenuLoggedIn`**，**仅**在 **`hasUser === true`** 时挂载。
  - 原实现：即使 **`!hasUser`** 仍执行 **`useSearchParams()`**（在 **`return null`** 之前），违反 Next 15 对 **`useSearchParams`** 之 **Suspense** 要求，导致 **`Generating static pages`** 阶段多路由报 **`missing-suspense-with-csr-bailout`**（堆栈常见经 **`UserMenu`**）。
  - 现实现：**`<Suspense fallback={…}><UserMenuLoggedIn … /></Suspense>`** 包裹 **`useSearchParams`** 使用者；未登录时不挂载该子树。

## 2 命令真值（本仓库 / 本机）

| 命令 | 结果 | 说明 |
|------|------|------|
| **`npm ci`**（`frontend/`） | **exit 0** | 依赖安装完成。 |
| **`npm run build`**（`frontend/`；**Windows**） | **exit 1**（多轮） | 失败形态含：**`Cannot find module './<n>.js'`**（**`webpack-runtime.js`** 相对 **`.next/server/`** 与 **`chunks/`** 布局）、**`pages-manifest.json` ENOENT**、早期 **`/_document` PageNotFoundError** 等；与 **`frontend/scripts/sync-server-chunks.mjs`** 注释所述 **Windows + Webpack 生产构建** chunk 路径问题**同源叙事**。本证据**不**宣称 **Linux CI** 已绿；**§10.5** 仍以 **`npm run build` exit 0** 为闭证。 |

## 3 与 95 / ISS 关系

- **§10.5** 清单行保持 **`[ ]]`**；本包为 **进展旁证**，非 **「前端 build 已闭」**。
- **`useSearchParams` Suspense** 类问题与 **ISS-007** 叙述可对读；**webpack chunk / manifest** 类失败**不**自动归入 **ISS-007**，除非维护者在 **§9** 单独立项并给闭证条件。

## 4 诚实边界

- **未**在本机得到稳定的 **`npm run build` exit 0**。
- **未**替代 **E2E** / **93 子集** / **`NEXT_PUBLIC_*` 各环境** 矩阵终验。
