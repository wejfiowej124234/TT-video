import type { LocaleInterpolationVars } from "@/lib/i18n";

export type OrderParticipantHint = {
  hint?: string;
  assigned_guide_email?: string;
  tourist_email?: string;
  debug_chain?: string;
};

export type OrderParticipantHintError = Error & {
  orderParticipantHint?: OrderParticipantHint;
};

export function parseOrderParticipantHint(
  j: Record<string, unknown>,
): OrderParticipantHint | undefined {
  const assigned =
    typeof j.assigned_guide_email === "string" ? j.assigned_guide_email.trim() : "";
  const tourist = typeof j.tourist_email === "string" ? j.tourist_email.trim() : "";
  const debug_chain = typeof j.debug_chain === "string" ? j.debug_chain.trim() : "";
  if (!assigned && !tourist && !debug_chain) return undefined;
  return {
    hint: typeof j.hint === "string" ? j.hint : undefined,
    assigned_guide_email: assigned || undefined,
    tourist_email: tourist || undefined,
    debug_chain: debug_chain || undefined,
  };
}

export function attachOrderParticipantHint(
  err: Error,
  hint: OrderParticipantHint | undefined,
): OrderParticipantHintError {
  if (!hint) return err;
  const out = err as OrderParticipantHintError;
  out.orderParticipantHint = hint;
  return out;
}

export function getOrderParticipantHint(err: unknown): OrderParticipantHint | undefined {
  if (!err || typeof err !== "object" || !("orderParticipantHint" in err)) return undefined;
  const hint = (err as OrderParticipantHintError).orderParticipantHint;
  if (!hint?.assigned_guide_email && !hint?.tourist_email && !hint?.debug_chain) return undefined;
  return hint;
}

const CHAIN_LABEL_KEYS: Record<string, string> = {
  public_catalog_main: "seed_main_chain_label_public_catalog",
  tourist_guide_seed: "seed_main_chain_label_tourist_guide",
  unknown: "seed_main_chain_label_unknown",
};

export function formatOrderParticipantMismatchMessage(
  err: unknown,
  t: (key: string, vars?: LocaleInterpolationVars) => string,
  scene: "view" | "accept",
): string | null {
  const hint = getOrderParticipantHint(err);
  if (!hint?.assigned_guide_email) return null;
  const chainKey = CHAIN_LABEL_KEYS[hint.debug_chain ?? "unknown"] ?? CHAIN_LABEL_KEYS.unknown;
  const chainLabel = t(chainKey);
  const vars: LocaleInterpolationVars = {
    email: hint.assigned_guide_email,
    chain: chainLabel,
    tourist: hint.tourist_email ?? "",
  };
  if (scene === "accept") {
    return t("escrow_wrong_guide_accept_hint", vars);
  }
  return t("escrow_403_guide_hint", vars);
}

export function mapEscrowForbiddenError(
  err: unknown,
  t: (key: string, vars?: LocaleInterpolationVars) => string,
): string {
  const hinted = formatOrderParticipantMismatchMessage(err, t, "view");
  if (hinted) return hinted;
  const msg = err instanceof Error ? err.message : "";
  if (/403|forbidden|权限|暂无权限/i.test(msg)) return t("escrow_403_message");
  return t("escrow_403_message");
}
