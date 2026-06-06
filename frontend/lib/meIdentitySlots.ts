import { userFromGetMePayload } from "@/lib/meTrust";

export type MeIdentitySlotId = "traveler" | "guide" | "acquisition" | "merchant" | "region_steward";

/** 顶栏脊签披露四槽（不含 region_steward · 96-17 §0.3.5）。 */
export const ME_IDENTITY_SPINE_SLOT_IDS = ["traveler", "guide", "merchant", "acquisition"] as const;

export type MeIdentitySpineSlotId = (typeof ME_IDENTITY_SPINE_SLOT_IDS)[number];

const SLOT_ORDER: MeIdentitySlotId[] = ["traveler", "guide", "acquisition", "merchant", "region_steward"];

function isSpineSlotId(id: MeIdentitySlotId): id is MeIdentitySpineSlotId {
  return (ME_IDENTITY_SPINE_SLOT_IDS as readonly string[]).includes(id);
}

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

function parseIdentitySlotRow(row: unknown): MeIdentitySlot | null {
  if (row == null || typeof row !== "object") return null;
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
    return null;
  }
  if (state !== "active" && state !== "inactive" && state !== "pending" && state !== "restricted") {
    return null;
  }
  const sd = o.stake_display;
  const stake_display =
    sd === null || sd === undefined
      ? null
      : typeof sd === "string" && sd.trim() !== ""
        ? sd.trim()
        : null;
  const slot: MeIdentitySlot = { id, state, stake_display };
  return id === "traveler" ? { ...slot, stake_display: null } : slot;
}

export function parseIdentitySlotsFromMe(data: unknown): MeIdentitySlot[] {
  const raw = (data as { identity_slots?: unknown } | null | undefined)?.identity_slots;
  if (!Array.isArray(raw) || raw.length === 0) return identitySlotsFromUserOnly(data);

  const byId = new Map<MeIdentitySlotId, MeIdentitySlot>();
  for (const slot of identitySlotsFromUserOnly(data)) byId.set(slot.id, slot);
  for (const row of raw) {
    const parsed = parseIdentitySlotRow(row);
    if (parsed) byId.set(parsed.id, parsed);
  }
  return SLOT_ORDER.map((id) => byId.get(id)!);
}

export function meIdentityActiveCount(slots: MeIdentitySlot[]): number {
  return slots.filter((s) => s.state === "active").length;
}

export function meIdentitySpineActiveCount(slots: MeIdentitySlot[]): number {
  return slots.filter((s) => isSpineSlotId(s.id) && s.state === "active").length;
}

export function meIdentitySpineActiveCountFromMePayload(data: unknown): number {
  const raw = (data as { identity_slots_spine_active_count?: unknown } | null | undefined)
    ?.identity_slots_spine_active_count;
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 0 && raw <= 4) return raw;
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = Number(raw);
    if (Number.isInteger(n) && n >= 0 && n <= 4) return n;
  }
  return meIdentitySpineActiveCount(parseIdentitySlotsFromMe(data));
}

/** 顶栏用户菜单按钮：已开通脊签名称，按固定槽序拼接。 */
export function joinActiveSpineSlotLabels(
  data: unknown,
  label: (id: MeIdentitySpineSlotId) => string,
  sep: string
): string {
  const slots = parseIdentitySlotsFromMe(data);
  return ME_IDENTITY_SPINE_SLOT_IDS.filter((id) => slots.find((s) => s.id === id)?.state === "active")
    .map(label)
    .join(sep);
}
