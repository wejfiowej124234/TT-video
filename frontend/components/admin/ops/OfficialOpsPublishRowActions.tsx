"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { useAdminL5ConfirmRequest } from "@/components/admin/AdminL5ConfirmProvider";
import {
  adminConfirmColdStartDeploy,
  adminConfirmColdStartRollback,
  adminConfirmOfficialPublish,
} from "@/lib/admin/adminOpsWriteConfirm";
import {
  ADMIN_TABLE_ROW_ACTIONS_CLASS,
  adminTableRowPrimaryActionClass,
  adminTableRowSecondaryActionClass,
} from "@/lib/adminUi";

export type OfficialOpsPublishAction = "submit" | "request" | "publish" | "deploy" | "rollback";

type Props = {
  busy: boolean;
  onAction: (action: OfficialOpsPublishAction) => void | Promise<void>;
  show?: Partial<Record<OfficialOpsPublishAction, boolean>>;
  publishLabelKey?: string;
  requestLabelKey?: string;
  deployLabelKey?: string;
  rollbackLabelKey?: string;
};

const DEFAULT_SHOW: Record<OfficialOpsPublishAction, boolean> = {
  submit: true,
  request: true,
  publish: true,
  deploy: false,
  rollback: false,
};

/** 官方运营 · 统一 submit → request → publish/deploy 行内操作 + L5 Confirm */
export function OfficialOpsPublishRowActions({
  busy,
  onAction,
  show,
  publishLabelKey = "admin_official_action_publish",
  requestLabelKey = "admin_official_action_request_publish",
  deployLabelKey = "admin_official_cold_start_action_deploy",
  rollbackLabelKey = "admin_official_cold_start_action_rollback",
}: Props) {
  const { t } = useTranslation();
  const requestConfirm = useAdminL5ConfirmRequest();
  const flags = { ...DEFAULT_SHOW, ...show };

  async function run(action: OfficialOpsPublishAction) {
    if (action === "publish") {
      requestConfirm(adminConfirmOfficialPublish(() => onAction(action)));
      return;
    }
    if (action === "deploy") {
      requestConfirm(adminConfirmColdStartDeploy(() => onAction(action)));
      return;
    }
    if (action === "rollback") {
      requestConfirm(adminConfirmColdStartRollback(() => onAction(action)));
      return;
    }
    await onAction(action);
  }

  return (
    <div className={ADMIN_TABLE_ROW_ACTIONS_CLASS} data-tt-admin-official-publish-actions="1">
      {flags.submit ? (
        <button
          type="button"
          className={adminTableRowSecondaryActionClass()}
          disabled={busy}
          onClick={() => void run("submit")}
        >
          {t("admin_official_action_submit_review")}
        </button>
      ) : null}
      {flags.request ? (
        <button
          type="button"
          className={adminTableRowSecondaryActionClass()}
          disabled={busy}
          onClick={() => void run("request")}
        >
          {t(requestLabelKey)}
        </button>
      ) : null}
      {flags.publish ? (
        <button
          type="button"
          className={adminTableRowPrimaryActionClass()}
          disabled={busy}
          onClick={() => void run("publish")}
        >
          {t(publishLabelKey)}
        </button>
      ) : null}
      {flags.deploy ? (
        <button
          type="button"
          className={adminTableRowPrimaryActionClass()}
          disabled={busy}
          onClick={() => void run("deploy")}
        >
          {t(deployLabelKey)}
        </button>
      ) : null}
      {flags.rollback ? (
        <button
          type="button"
          className={adminTableRowSecondaryActionClass()}
          disabled={busy}
          onClick={() => void run("rollback")}
        >
          {t(rollbackLabelKey)}
        </button>
      ) : null}
    </div>
  );
}
