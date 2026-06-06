import type { GuideRegisterStep1Input } from "./guideRegisterValidation";

export type Step1CheckItem = {
  key: string;
  done: boolean;
};

export function guideRegisterStep1Checklist(
  input: GuideRegisterStep1Input & { walletVerified: boolean },
): Step1CheckItem[] {
  return [
    { key: "guideRegister_step1Check_wallet", done: !!input.walletAddress.trim() },
    { key: "guideRegister_step1Check_verify", done: input.walletVerified },
    { key: "guideRegister_step1Check_name", done: !!input.realName.trim() },
    { key: "guideRegister_step1Check_passport", done: !!input.idNumber.trim() },
    {
      key: "guideRegister_step1Check_photo",
      done: !!(input.idPhotoFile || input.pendingIdPhoto),
    },
  ];
}
