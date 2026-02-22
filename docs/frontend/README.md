# Frontend 文档入口（前端 / Web / 可验证发布）

本目录用于**前端相关文档的导航**。为避免破坏既有引用，现阶段不移动既有文档文件（仍以 `docs/05-前端总览.md` 为权威正文），这里只提供稳定入口与跳转。

## 主要文档

- 前端总览（权威正文）：[../05-前端总览.md](../05-前端总览.md)
- DApp 架构总览（钱包/签名/链交互）：[../06-DApp架构总览.md](../06-DApp架构总览.md)

## 架构目录（本目录补充）

- 前端架构目录（中文命名）：[架构目录.md](架构目录.md)

## 可验证发布

- 前端构建产物 manifest：脚本位于 `scripts/build-frontend-manifest.sh`
- deterministic 验证（本地自检）：脚本位于 `scripts/verify-frontend-deterministic-build.sh`

## 代码落点（仓库结构）

- 前端（Yew/WASM）：`crates/web`
- 页面：`crates/web/src/pages/`
- API DTO：`crates/web/src/api/`
