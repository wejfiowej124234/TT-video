"use client";

import Link from "next/link";
import { FOCUS_RING } from "@/components/me/constants";
import PublishHubItemThumb from "@/components/me/publish/PublishHubItemThumb";
import type { PublishHubItem } from "@/lib/me/publishHubItemModel";
import { TT_PUBLISH_HUB_L5, publishHubL5ItemStatusBadgeClass } from "@/lib/me/publishHubL5";
import { TT_WORKSPACE_L5 } from "@/lib/workspace/workspaceWorkbenchL5";

export default function PublishHubItemCard({
  item,
  coverAlt,
}: {
  item: PublishHubItem;
  coverAlt: string;
}) {
  const titleId = `publish-hub-item-title-${item.key}`;
  const tone = item.statusTone ?? "neutral";
  return (
    <article
      className={TT_PUBLISH_HUB_L5.itemCard}
      aria-labelledby={titleId}
      data-tt-publish-hub-item-card={item.rail}
      data-tt-publish-hub-item-id={item.id}
    >
      <PublishHubItemThumb item={item} alt={coverAlt} />
      <div className={TT_PUBLISH_HUB_L5.itemBody}>
        <div className={TT_PUBLISH_HUB_L5.itemTitleRow}>
          <p id={titleId} className={TT_PUBLISH_HUB_L5.itemTitle}>
            {item.title}
          </p>
          {item.statusText ? (
            <span className={publishHubL5ItemStatusBadgeClass(tone)} data-tt-publish-hub-item-status={tone}>
              {item.statusText}
            </span>
          ) : null}
        </div>
        {item.subtitle ? <p className={TT_PUBLISH_HUB_L5.itemSubtitle}>{item.subtitle}</p> : null}
      </div>
      <div className={TT_PUBLISH_HUB_L5.itemActions}>
        {item.primaryAction ? (
          <Link
            href={item.primaryAction.href}
            className={`${TT_WORKSPACE_L5.navLink} ${TT_PUBLISH_HUB_L5.itemPrimaryAction} ${FOCUS_RING}`}
            data-tt-publish-hub-item-primary={item.primaryAction.dataAttr ?? item.id}
          >
            {item.primaryAction.label}
          </Link>
        ) : null}
        {item.secondaryActions?.map((action) =>
          action.kind === "link" && action.href ? (
            <Link
              key={action.id}
              href={action.href}
              className={`${TT_WORKSPACE_L5.navLink} ${TT_PUBLISH_HUB_L5.itemSecondaryAction} ${FOCUS_RING}`}
              data-tt-publish-hub-item-secondary={action.dataAttr ?? action.id}
            >
              {action.label}
            </Link>
          ) : (
            <button
              key={action.id}
              type="button"
              disabled={action.disabled}
              className={`${TT_WORKSPACE_L5.navLink} ${TT_PUBLISH_HUB_L5.itemSecondaryAction} disabled:opacity-50 ${FOCUS_RING}`}
              onClick={action.onClick}
              data-tt-publish-hub-item-secondary={action.dataAttr ?? action.id}
            >
              {action.label}
            </button>
          ),
        )}
      </div>
    </article>
  );
}
