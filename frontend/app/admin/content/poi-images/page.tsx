"use client";

import { Suspense } from "react";

import { AdminContentPoiImagesPageMain } from "./AdminContentPoiImagesPageMain";

export default function AdminContentPoiImagesPage() {
  return (
    <Suspense fallback={null}>
      <AdminContentPoiImagesPageMain />
    </Suspense>
  );
}
