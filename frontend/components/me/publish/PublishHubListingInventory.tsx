"use client";



import Link from "next/link";

import { useMemo } from "react";

import PublishHubItemList from "@/components/me/publish/PublishHubItemList";

import { FOCUS_RING } from "@/components/me/constants";

import { mapPublishHubListingItems } from "@/lib/me/publishHubItemMappers";

import type { MerchantWorkbenchShowcaseRow } from "@/lib/provider/providerWorkbenchListingsModel";

import { shouldShowMerchantWorkbenchShowcaseInventory } from "@/lib/provider/providerWorkbenchListingsModel";

import { TT_WORKSPACE_L5 } from "@/lib/workspace/workspaceWorkbenchL5";



export type PublishHubListingInventoryVariant = "merchant" | "acquisition";



const INVENTORY_I18N: Record<

  PublishHubListingInventoryVariant,

  {

    aria: string;

    title: string;

    new: string;

    loading: string;

    rowPublished: string;

    rowDraft: string;

    archive: string;

    archiving: string;

    deleteDraft: string;

    deleting: string;

  }

> = {

  merchant: {

    aria: "provider_workbench_showcase_inventory_aria",

    title: "provider_workbench_showcase_inventory_title",

    new: "provider_workbench_showcase_inventory_new",

    loading: "provider_workbench_showcase_inventory_loading",

    rowPublished: "provider_workbench_showcase_row_published",

    rowDraft: "provider_workbench_showcase_row_draft",

    archive: "provider_workbench_showcase_archive",

    archiving: "provider_workbench_showcase_archiving",

    deleteDraft: "provider_workbench_showcase_delete_draft",

    deleting: "provider_workbench_showcase_deleting",

  },

  acquisition: {

    aria: "publish_hub_acquisition_inventory_aria",

    title: "publish_hub_acquisition_inventory_title",

    new: "publish_hub_acquisition_inventory_new",

    loading: "publish_hub_acquisition_inventory_loading",

    rowPublished: "publish_hub_acquisition_row_published",

    rowDraft: "publish_hub_acquisition_row_draft",

    archive: "publish_hub_acquisition_archive",

    archiving: "publish_hub_acquisition_archiving",

    deleteDraft: "publish_hub_acquisition_delete_draft",

    deleting: "publish_hub_acquisition_deleting",

  },

};



export type PublishHubListingInventoryProps = {

  variant: PublishHubListingInventoryVariant;

  t: (key: string) => string;

  rows: MerchantWorkbenchShowcaseRow[];

  loading: boolean;

  error: string | null;

  mutatingId: string | null;

  studioHref: string;

  coverAlt: string;

  onRetry: () => void;

  onArchivePublished: (listingId: string) => void;

  onDeleteDraft: (draftId: string) => void;

};



/** 发布中心 · listing inventory（merchant / acquisition · 统一 PublishHubItem 卡片） */

export default function PublishHubListingInventory({

  variant,

  t,

  rows,

  loading,

  error,

  mutatingId,

  studioHref,

  coverAlt,

  onRetry,

  onArchivePublished,

  onDeleteDraft,

}: PublishHubListingInventoryProps) {

  const keys = INVENTORY_I18N[variant];



  const items = useMemo(

    () =>

      mapPublishHubListingItems({

        rail: variant,

        rows,

        publishedLabel: t(keys.rowPublished),

        draftLabel: t(keys.rowDraft),

        archiveLabel: t(keys.archive),

        archivingLabel: t(keys.archiving),

        deleteDraftLabel: t(keys.deleteDraft),

        deletingLabel: t(keys.deleting),

        mutatingId,

        onArchivePublished,

        onDeleteDraft,

        variantDataAttr: variant,

      }),

    [variant, rows, t, keys, mutatingId, onArchivePublished, onDeleteDraft],

  );



  if (!loading && !error && !shouldShowMerchantWorkbenchShowcaseInventory(rows)) {

    return null;

  }



  return (

    <div

      className="mb-4"

      data-tt-publish-hub-listing-inventory={variant}

      aria-label={t(keys.aria)}

    >

      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">

        <h3 className="text-meta font-semibold text-slate-300">{t(keys.title)}</h3>

        <Link

          href={studioHref}

          className={`text-meta font-medium text-ref-sun/85 underline decoration-ref-sun/35 underline-offset-4 hover:text-[#fde9a8] ${FOCUS_RING}`}

          data-tt-publish-hub-listing-inventory-new={variant}

        >

          {t(keys.new)}

        </Link>

      </div>



      {loading ? (

        <p className="text-meta text-slate-500" role="status">

          {t(keys.loading)}

        </p>

      ) : null}



      {error ? (

        <div className="mb-2 flex flex-wrap items-center gap-2">

          <p className="text-meta text-danger" role="alert">

            {error}

          </p>

          <button type="button" className={`${TT_WORKSPACE_L5.secondaryBtn} ${FOCUS_RING}`} onClick={() => void onRetry()}>

            {t("common_retry")}

          </button>

        </div>

      ) : null}



      {!loading && !error ? (

        <PublishHubItemList items={items} listDataAttr={variant} coverAlt={coverAlt} />

      ) : null}

    </div>

  );

}


