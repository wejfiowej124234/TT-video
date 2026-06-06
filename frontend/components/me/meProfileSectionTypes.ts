import type { MeProfileEditForm, UserShape } from "./constants";

export interface MeProfileSectionProps {
  t: (k: string) => string;
  user: UserShape;
  editing: boolean;
  setEditing: (v: boolean) => void;
  editForm: MeProfileEditForm;
  setEditForm: React.Dispatch<React.SetStateAction<MeProfileEditForm>>;
  submitError: string | null;
  submitting: boolean;
  avatarError: boolean;
  setAvatarError: (v: boolean) => void;
  copiedField: "id" | "wallet" | null;
  copyClipboardBusy: "id" | "wallet" | null;
  copyToClipboard: (text: string, field: "id" | "wallet") => void;
  connectedAddress: string | undefined;
  syncingWallet: boolean;
  editButtonRef: React.RefObject<HTMLButtonElement | null>;
  handleSubmit: (e: React.FormEvent) => void;
  handleSyncWallet: () => void;
  /**
   * 社区 `/community/me`：顶卡已展示头像/昵称/角色，此处仅保留账户标识与编辑，避免整块重复。
   */
  compactCommunityLayout?: boolean;
  /** 与顶栏社区资料合并为一张青卡时：去掉外层紫框与标题条，仅保留可锚定区块。 */
  unifiedInCommunityCard?: boolean;
  /** 父级 `<details>` 已提供 `#me-platform-profile` 锚点时不再写重复 id */
  omitAnchorId?: boolean;
  /** 置于折叠区内且与上方统计相邻：去掉顶部分隔与多余外边距 */
  insetInCollapsible?: boolean;
  /** `/me/settings/profile`：暖金 L5 表单/按钮 token，无社区青/紫壳 */
  settingsL5Layout?: boolean;
  /** 设置资料页：详情区不重复「编辑资料」CTA（由身份卡统一入口） */
  hideEditCta?: boolean;
  /** 设置资料页：展示 bio 编辑字段 */
  showBioField?: boolean;
  /** 仅渲染编辑表单（嵌入身份卡内联编辑） */
  editFormOnly?: boolean;
  /** 仅渲染只读账户标识（邮箱/ID/钱包） */
  readOnlyAccountFields?: boolean;
}
