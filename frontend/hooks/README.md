# 前端 Hooks

**51-O-F7**：多域复用 hook 统一放在本目录；域内专用 hook 保留在 `components/<域>/`（如 `useCommunityFeed`、`useItineraryForm`）。

- `useFocusTrap`：弹窗/抽屉焦点 trap、Esc 关闭，供 Escrow/社区/Market/DID 等共用。
