"use client";

import { Suspense } from "react";

import { AdminContentPoiImageBatchPageMain } from "./AdminContentPoiImageBatchPageMain";

export default function AdminContentPoiImageBatchPage() {
  return (
    <Suspense fallback={null}>
      <AdminContentPoiImageBatchPageMain />
    </Suspense>
  );
}
