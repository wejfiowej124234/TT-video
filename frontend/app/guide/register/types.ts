/** 从注册页暂存到 sessionStorage 的向导申请草稿 */
export type PendingGuide = {
  realName?: string;
  idType?: string;
  idNumber?: string;
  walletAddress?: string;
  city?: string;
  countryCode?: string;
  languages?: string;
  serviceTypes?: string;
  bio?: string;
  idPhotoName?: string;
  languageCertName?: string;
  idPhotoBase64?: string;
  languageCertBase64?: string;
};
