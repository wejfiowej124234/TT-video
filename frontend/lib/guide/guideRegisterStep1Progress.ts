import type { GuideRegisterStep1Input } from "./guideRegisterValidation";

export function guideRegisterStep1Progress(input: GuideRegisterStep1Input & { walletVerified: boolean }): {
  done: number;
  total: number;
} {
  let done = 0;
  const total = 5;
  if (input.walletAddress.trim()) done += 1;
  if (input.walletVerified) done += 1;
  if (input.realName.trim()) done += 1;
  if (input.idNumber.trim()) done += 1;
  if (input.idPhotoFile || input.pendingIdPhoto) done += 1;
  return { done, total };
}
