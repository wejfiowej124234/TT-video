import { userFromGetMePayload } from "@/lib/meTrust";

export type MeIdentitySlotId = "traveler" | "guide" | "acquisition" | "merchant" | "region_steward";

export type MeIdentitySlotState = "active" | "inactive" | "pending" | "restricted";

export type MeIdentitySlot = {
  id: MeIdentitySlotId;
  state: MeIdentitySlotState;
  stake_display: string | null;
};

function isTravelerSideRole(role: string): boolean {
  const r = role.trim().toLowerCase();
  return r === "tourist" || r === "traveler";
}

/** 旧后端无 `identity_slots` 时的最小推导（仅单角色 + 向导行质押）。 */
function identitySlotsFromUserOnly(data: unknown): MeIdentitySlot[] {
  const user = userFromGetMePayload(data);
  const roleLc = (user?.role ?? "").trim().toLowerCase();
  const traveler_active = isTravelerSideRole(roleLc);
  const guideObj = (data as { guide?: { stake_amount?: string; status?: string } | null })?.guide;
  const gStatus = typeof guideObj?.status === "string" ? guideObj.status.toLowerCase() : "";
  const gStake = typeof guideObj?.stake_amount === "string" ? guideObj.stake_amount.trim() : "";
  let guide_state: MeIdentitySlotState = "inactive";
  if (roleLc === "guide") guide_state = "active";
  else if (guideObj) {
    if (gStatus === "pending") guide_state = "pending";
    else if (gStatus === "rejected" || gStatus === "suspended") guide_state = "restricted";
    else if (gStatus === "active") guide_state = "active";
  }
  const stake =
    gStake !== ""
      ? `${gStake} USDT`
      : null;
  return [
    { id: "traveler", state: traveler_active ? "active" : "inactive", stake_display: null },
    {
      id: "guide",
      state: guide_state,
      stake_display: stake,
    },
    { id: "acquisition", state: "inactive", stake_display: null },
    { id: "merchant", state: roleLc === "provider" ? "active" : "inactive", stake_display: null },
    {
      id: "region_steward",
      state: roleLc === "region_steward" ? "active" : "inactive",
      stake_display: null,
    },
  ];
}

export function parseIdentitySlotsFromMe(data: unknown): MeIdentitySlot[] {
  const raw = (data as { identity_slots?: unknown } | null | undefined)?.identity_slots;
  if (!Array.isArray(raw) || raw.length === 0) return identitySlotsFromUserOnly(data);
  const out: MeIdentitySlot[] = [];
  for (const row of raw) {
    if (row == null || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const id = o.id;
    const state = o.state;
    if (
      id !== "traveler" &&
      id !== "guide" &&
      id !== "acquisition" &&
      id !== "merchant" &&
      id !== "region_steward"
    ) {
      continue;
    }
    if (state !== "active" && state !== "inactive" && state !== "pending" && state !== "restricted") {
      continue;
    }
    const sd = o.stake_display;
    const stake_display =
      sd === null || sd === undefined
        ? null
        : typeof sd === "string" && sd.trim() !== ""
          ? sd.trim()
          : null;
    out.push({ id, state, stake_display });
  }
  if (out.length === 5) {
    /** 旅行者身份不展示质押（产品规则；与后端 traveler 槽位一致） */
    return out.map((s) =>
      s.id === "traveler" ? { ...s, stake_display: null } : s
    ) as MeIdentitySlot[];
  }
  return identitySlotsFromUserOnly(data);
}

export function meIdentityActiveCount(slots: MeIdentitySlot[]): number {
  return slots.filter((s) => s.state === "active").length;
}
