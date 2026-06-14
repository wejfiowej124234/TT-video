/**
 * 四轨身份资料 settings（me/identities 各轨 settings 路由）· 与 meSettingsL5 / workspaceWorkbenchL5 同族。
 */
import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";
import { TT_WORKSPACE_L5 } from "@/lib/workspace/workspaceWorkbenchL5";

export const TT_IDENTITY_SLOT_SETTINGS_L5 = {
  headerCard: TT_WORKSPACE_L5.headerCard,
  headerEyebrow: TT_WORKSPACE_L5.headerEyebrow,
  headerTitle: TT_WORKSPACE_L5.headerTitle,
  headerSubtitle: TT_WORKSPACE_L5.headerSubtitle,
  sectionCard: `${TT_ME_SETTINGS_L5.sectionCard} px-4 py-4 sm:px-5 sm:py-5`,
  sectionTitle: "text-small font-semibold uppercase tracking-wide text-ref-sun/85",
  sectionHint: "text-meta text-slate-400/95 mt-1",
} as const;
