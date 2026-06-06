import Link from "next/link";
import MeProfileSection from "@/components/me/MeProfileSection";
import { communitySlatePillFocus } from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_ME_PANEL_L5, TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";
import type { MeProfileSectionProps } from "@/components/me/meProfileSectionTypes";
import type { CommunitySocialStatsPayload, DataState } from "@/lib/dataState";
import CommunityMeSocialStatsStrip from "@/components/me/CommunityMeSocialStatsStrip";
import CommunityMeAccountProfileHeader from "@/components/me/communityMePage/CommunityMeAccountProfileHeader";
import type { CommunityMeAccountPanelTFunc } from "./communityMeAccountPanelUtils";
import type { UserShape } from "@/components/me/constants";

export type CommunityMeAccountPanelProfileCardProps = {
  t: CommunityMeAccountPanelTFunc;
  compactVertical: boolean;
  user: UserShape;
  displayName: string;
  headerInitial: string;
  headerAvatarResolved: string;
  walletPreview: string;
  bioCardText: string;
  bioFeatureOn: boolean;
  avatarFileRef: React.RefObject<HTMLInputElement | null>;
  profileDetailsRef: React.RefObject<HTMLDetailsElement | null>;
  onAvatarPickClick: (e: React.FormEvent) => void;
  onAvatarFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  avatarUploadBusy: boolean;
  avatarLocalUploadEnabled: boolean;
  avatarUploadErr: string | null;
  socialStatsState: DataState<CommunitySocialStatsPayload>;
  onSocialStatsRetry?: () => void;
  showLikesReceivedMetric: boolean;
  meProfileCompact: MeProfileSectionProps;
  meProfileFull: MeProfileSectionProps;
};

/** 社区资料卡：身份展示 · 社交统计 · 资料编辑（内容/订单/设置走顶栏下拉与设置 Hub）。 */
export default function CommunityMeAccountPanelProfileCard(props: CommunityMeAccountPanelProfileCardProps) {
  const {
    t,
    compactVertical,
    user,
    displayName,
    headerInitial,
    headerAvatarResolved,
    walletPreview,
    bioCardText,
    bioFeatureOn,
    avatarFileRef,
    profileDetailsRef,
    onAvatarPickClick,
    onAvatarFileChange,
    avatarUploadBusy,
    avatarLocalUploadEnabled,
    avatarUploadErr,
    socialStatsState,
    onSocialStatsRetry,
    showLikesReceivedMetric,
    meProfileCompact,
    meProfileFull,
  } = props;

  return (
    <section
      data-tt-community-me-surface="community_me_profile"
      data-tt-data-state="success"
      className={`${TT_COMMUNITY_ME_PANEL_L5.profileCardShell} ${
        compactVertical ? "px-3 py-3 sm:px-4" : "px-4 py-6"
      }`}
      aria-label={t("community_me_profile_card_aria")}
    >
      <CommunityMeAccountProfileHeader
        t={t}
        compactVertical={compactVertical}
        user={user}
        displayName={displayName}
        headerInitial={headerInitial}
        headerAvatarResolved={headerAvatarResolved}
        walletPreview={walletPreview}
        bioCardText={bioCardText}
        bioFeatureOn={bioFeatureOn}
        avatarFileRef={avatarFileRef}
        onAvatarPickClick={onAvatarPickClick}
        onAvatarFileChange={onAvatarFileChange}
        avatarUploadBusy={avatarUploadBusy}
        avatarLocalUploadEnabled={avatarLocalUploadEnabled}
        avatarUploadErr={avatarUploadErr}
      />

      <div
        className={`flex border-t border-slate-600/45 flex-wrap ${compactVertical ? "mt-3 pt-3 justify-between gap-2 max-w-md mx-auto w-full sm:max-w-none sm:justify-center sm:gap-6" : "gap-4 sm:gap-6 mt-4 pt-4"}`}
      >
        <CommunityMeSocialStatsStrip
          state={socialStatsState}
          t={t}
          onRetry={onSocialStatsRetry}
          showLikesReceivedMetric={showLikesReceivedMetric}
        />
      </div>

      <div className={`flex items-center gap-2 flex-wrap ${compactVertical ? "mt-3" : "mt-4"}`}>
        <Link
          href="#me-platform-profile"
          onClick={() => {
            if (compactVertical && profileDetailsRef.current) {
              profileDetailsRef.current.open = true;
            }
          }}
          className={`${TT_COMMUNITY_PAGE_L5.pill} motion-sub min-h-[44px] inline-flex items-center justify-center ${communitySlatePillFocus}`}
          aria-label={t("community_me_edit_profile")}
        >
          {t("community_me_edit_profile")}
        </Link>
      </div>

      {compactVertical ? (
        <details
          ref={profileDetailsRef}
          id="me-platform-profile"
          className="group border-t border-slate-600/40 pt-2 mt-2.5 rounded-[var(--radius-sm)]"
        >
          <summary
            className={TT_COMMUNITY_ME_PANEL_L5.detailsSummary}
            aria-label={t("community_me_account_details_summary")}
          >
            <span>{t("community_me_account_details_summary")}</span>
            <svg
              className={TT_COMMUNITY_ME_PANEL_L5.detailsChevron}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <MeProfileSection {...meProfileCompact} />
        </details>
      ) : (
        <details
          ref={profileDetailsRef}
          id="me-platform-profile"
          className="group mt-4 rounded-[var(--radius-sm)] border border-slate-600/40 bg-ink-950/35"
        >
          <summary
            className={TT_COMMUNITY_ME_PANEL_L5.detailsSummaryLoose}
            aria-label={t("community_me_account_details_summary")}
          >
            <span>{t("community_me_account_details_summary")}</span>
            <svg
              className={TT_COMMUNITY_ME_PANEL_L5.detailsChevron}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="border-t border-slate-600/40 px-2 pb-3 pt-1">
            <MeProfileSection {...meProfileFull} />
          </div>
        </details>
      )}
    </section>
  );
}
