"use client";

type TFn = (key: string) => string;

/** 会话内置顶说明：`page` 用 ref-sun 独立页壳；`drawer` 用 Hub cyan 弹层壳。 */
export function CommunityMeSessionPinNote({
  t,
  visible,
  surface = "page",
}: {
  t: TFn;
  visible: boolean;
  surface?: "page" | "drawer";
}) {
  if (!visible) return null;
  const isDrawer = surface === "drawer";
  return (
    <p
      className={
        isDrawer
          ? "mb-2 rounded-[var(--radius-md)] border border-cyan-500/28 bg-ink-800/55 px-3 py-1.5 text-[0.7rem] leading-snug text-white/75 sm:text-meta"
          : "mb-4 rounded-[var(--radius-md)] border border-ref-sun/18 bg-ink-900/45 px-3 py-2 text-meta text-slate-400"
      }
      role="note"
      data-tt-community-me-session-pin-note={surface}
    >
      {isDrawer ? t("community_me_notes_menu_pin_hint") : t("community_me_page_session_pin_note")}
    </p>
  );
}

/** @deprecated 使用 `CommunityMeSessionPinNote` · `surface="page"` */
export function CommunityMePageSessionPinNote({ t, visible }: { t: TFn; visible: boolean }) {
  return <CommunityMeSessionPinNote t={t} visible={visible} surface="page" />;
}
