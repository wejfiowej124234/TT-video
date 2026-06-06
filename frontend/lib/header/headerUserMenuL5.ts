/**
 * `/auth/*` · `/me/identities` · `/guide/register` 顶栏用户下拉（Auth L5 暖金玻璃 · ①）。
 */
import {
  headerUtilityMenuL5ShellClass,
  TT_HEADER_UTILITY_MENU_L5,
} from "@/lib/header/headerUtilityMenuL5";

export const TT_HEADER_USER_MENU_L5 = {
  dropdown: headerUtilityMenuL5ShellClass("wide"),
  panelBody: `${TT_HEADER_UTILITY_MENU_L5.dropdownBody} w-full gap-1 px-2 pb-1.5 pt-0.5`,
  profileStrip:
    "flex min-w-0 w-full items-center gap-2.5 rounded-lg border border-ref-sun/20 bg-ref-sun/[0.05] px-3 py-2.5 text-left transition-colors hover:bg-ref-sun/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 focus-visible:ring-offset-0",
  profileStripActive: "border-ref-sun/45 bg-ref-sun/[0.12]",
  profileAvatar:
    "relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ref-sun/10 text-ref-sun ring-1 ring-ref-sun/28",
  profileText: "min-w-0 flex-1 overflow-hidden leading-tight",
  profileName: "block truncate text-small font-semibold leading-snug text-slate-100",
  profileSpine: "mt-0.5 block truncate text-meta leading-snug text-ref-sun/75",
  sectionLabel: TT_HEADER_UTILITY_MENU_L5.sectionMeta,
  navRoot: "flex min-w-0 w-full flex-col gap-2 overflow-hidden",
  navSection: "flex min-w-0 w-full flex-col gap-0.5 overflow-hidden",
  item: `${TT_HEADER_UTILITY_MENU_L5.itemWithIcon}`,
  itemActive: TT_HEADER_UTILITY_MENU_L5.itemActive,
  itemFeatured: "text-ref-sun/90",
  itemIcon: "flex h-5 w-5 shrink-0 items-center justify-center text-ref-sun/80 [&_svg]:block [&_svg]:h-4 [&_svg]:w-4",
  itemIconActive: "text-ref-sun",
  itemLabel: TT_HEADER_UTILITY_MENU_L5.itemLabel,
  divider: TT_HEADER_UTILITY_MENU_L5.divider,
  logoutWrap: "w-full pt-0.5",
  logoutBtn: `${TT_HEADER_UTILITY_MENU_L5.itemWithIcon} hover:bg-danger/10 hover:text-ref-coral focus-visible:ring-danger/35`,
  buttonOpen: TT_HEADER_UTILITY_MENU_L5.buttonOpen,
  avatarInitial: "text-small font-semibold leading-none text-ref-sun",
} as const;
