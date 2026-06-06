"use client";

import { GuideDetailPageLoadingView } from "./GuideDetailPageLoadingView";
import { GuideDetailPageErrorView } from "./GuideDetailPageErrorView";
import { GuideDetailPageNotFoundView } from "./GuideDetailPageNotFoundView";
import { GuideDetailPageLoaded } from "./GuideDetailPageLoaded";
import { useGuideDetailPage } from "./useGuideDetailPage";

export function GuideDetailPageMain() {
  const vm = useGuideDetailPage();

  if (vm.loading) {
    return <GuideDetailPageLoadingView />;
  }
  if (vm.error) {
    return <GuideDetailPageErrorView message={vm.error} onRetry={vm.bumpGuideLoadRetry} />;
  }
  if (!vm.guide) {
    return <GuideDetailPageNotFoundView />;
  }

  return (
    <GuideDetailPageLoaded
      guide={vm.guide}
      stakeAmount={vm.stakeAmount}
      setStakeAmount={vm.setStakeAmount}
      stakeLoading={vm.stakeLoading}
      stakeError={vm.stakeError}
      copiedDid={vm.copiedDid}
      copyDidBusy={vm.copyDidBusy}
      copyDid={vm.copyDid}
      bookGuideOpen={vm.bookGuideOpen}
      setBookGuideOpen={vm.setBookGuideOpen}
      handleStake={vm.handleStake}
    />
  );
}
