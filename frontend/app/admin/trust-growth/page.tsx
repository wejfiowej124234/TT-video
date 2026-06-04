"use client";

import AdminTrustGrowthPageMain from "./AdminTrustGrowthPageMain";
import { useAdminTrustGrowthPage } from "./useAdminTrustGrowthPage";

export default function AdminTrustGrowthPage() {
  const vm = useAdminTrustGrowthPage();
  return <AdminTrustGrowthPageMain {...vm} />;
}
