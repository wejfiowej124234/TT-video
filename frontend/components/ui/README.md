# 共享 UI 基元（45 §8.2、34）

本目录用于**跨域复用的 UI 基元**，与 34 前端组件清单对齐。

- **焦点 trap**：Modal/Drawer 焦点与 Esc 关闭由 `@/hooks/useFocusTrap` 提供，见 [hooks/useFocusTrap.ts](../../hooks/useFocusTrap.ts)。使用方式：`const ref = useFocusTrap(open, onClose)`，将 `ref` 挂到弹窗内容容器上，并设置 `role="dialog"`、`aria-modal="true"`、`aria-labelledby` 指向标题 id。**已接入**：EscrowTxModal、CommunityLoginModal、PublishDrawer、PostDetailDrawer、CommentDrawer、CommunityVideoOverlay、UnlockModal、DidRankGuideModal、DidRankRecordModal、OrderDetailDrawer、GuideDetailDrawer、BookGuideModal、InviteGuideModal、CustomItineraryModal。（51-O-F8/51-31-13 弹窗/抽屉 a11y 闭环；新增弹窗/抽屉须接入 useFocusTrap 并在此补充）
- **Drawer/Modal**：若多域交互与布局一致，可在此目录新增共享组件（如 `Drawer.tsx`、`Modal.tsx`）；当前各域仍使用自有实现，待统一时再迁入。
