"use client";

import AdminCrossCheckPageMain from "./AdminCrossCheckPageMain";
import { useAdminCrossCheckPage } from "./useAdminCrossCheckPage";

export default function AdminCrossCheckPage() {
  const vm = useAdminCrossCheckPage();
  return <AdminCrossCheckPageMain {...vm} />;
}
