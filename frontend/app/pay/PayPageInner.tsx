"use client";

import { usePayPage } from "./usePayPage";
import { PayPageMain } from "./PayPageMain";

export function PayPageInner() {
  return <PayPageMain vm={usePayPage()} />;
}
