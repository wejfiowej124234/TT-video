"use client";

import { Suspense } from "react";

import { AdminContentPoisPageMain } from "./AdminContentPoisPageMain";

export default function AdminContentPoisPage() {
  return (
    <Suspense fallback={null}>
      <AdminContentPoisPageMain />
    </Suspense>
  );
}
