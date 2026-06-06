import { Suspense } from "react";

import MeOnboardingPageMain from "./MeOnboardingPageMain";
import MeOnboardingLoading from "./loading";

/** 96-18 准入页入口 · SSOT `MeOnboardingPageMain` */
export default function MeOnboardingPage() {
  return (
    <Suspense fallback={<MeOnboardingLoading />}>
      <MeOnboardingPageMain />
    </Suspense>
  );
}
