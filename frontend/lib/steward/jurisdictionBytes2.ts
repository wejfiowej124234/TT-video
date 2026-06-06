import { stringToHex } from "viem";

/** 两字母辖区 → `bytes2`（与 API `steward_stake_pool::jurisdiction_bytes2` 同源，例 CN → 0x434e） */
export function jurisdictionIdToBytes2(jurisdictionId: string): `0x${string}` {
  const j = jurisdictionId.trim().toUpperCase();
  if (j.length !== 2 || !/^[A-Z]{2}$/.test(j)) {
    throw new Error("invalid_jurisdiction");
  }
  return stringToHex(j, { size: 2 });
}
