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
  /** 注册页已上传后的 URL（优先于 base64） */
  idPhotoUrl?: string;
  languageCertUrl?: string;
  /** @deprecated 仅兼容旧 session；新流使用 idPhotoUrl */
  idPhotoBase64?: string;
  languageCertBase64?: string;
};
