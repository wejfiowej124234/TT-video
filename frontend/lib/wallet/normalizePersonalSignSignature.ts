/** Normalize personal_sign v byte: some wallets return 0/1 instead of 27/28. */
export function normalizePersonalSignSignature(signature: string): string {
  const raw = signature.trim();
  const hex = raw.startsWith("0x") ? raw.slice(2) : raw;
  if (hex.length !== 130) return raw.startsWith("0x") ? raw : `0x${hex}`;
  const v = parseInt(hex.slice(128, 130), 16);
  if (v === 0 || v === 1) {
    const nv = (v + 27).toString(16).padStart(2, "0");
    return `0x${hex.slice(0, 128)}${nv}`;
  }
  return raw.startsWith("0x") ? raw : `0x${hex}`;
}
