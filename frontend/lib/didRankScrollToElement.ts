/** 分页 / 折叠展开后等元素挂载再滚动（替代固定 setTimeout） */

export function scrollToDidRankElement(
  elementId: string,
  options?: { block?: ScrollLogicalPosition; maxAttempts?: number },
): void {
  if (typeof document === "undefined") return;
  const block = options?.block ?? "center";
  const maxAttempts = options?.maxAttempts ?? 24;
  let attempts = 0;

  const tryScroll = () => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block });
      return;
    }
    attempts += 1;
    if (attempts < maxAttempts) {
      requestAnimationFrame(tryScroll);
    }
  };

  requestAnimationFrame(tryScroll);
}
