"use client";



import Link from "next/link";

import { useMemo } from "react";

import type { PublishHubTripOrderRow } from "@/app/me/publish/usePublishHubTripOrders";

import PublishHubItemList from "@/components/me/publish/PublishHubItemList";

import { FOCUS_RING } from "@/components/me/constants";

import { mapPublishHubTripItems } from "@/lib/me/publishHubItemMappers";

import { TT_PUBLISH_HUB_L5 } from "@/lib/me/publishHubL5";



export default function PublishHubTripRailSection({

  t,

  rows,

  loading,

  error,

  onRetry,

}: {

  t: (key: string) => string;

  rows: readonly PublishHubTripOrderRow[];

  loading: boolean;

  error: string | null;

  onRetry: () => void;

}) {

  const items = useMemo(

    () => mapPublishHubTripItems(rows, t("publish_hub_trip_open_escrow")),

    [rows, t],

  );



  return (

    <section

      className={TT_PUBLISH_HUB_L5.railSection}

      aria-labelledby="publish-hub-rail-trip"

      data-tt-publish-hub-rail="trip"

      data-tt-publish-hub-rail-phase="active"

    >

      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">

        <div>

          <h2 id="publish-hub-rail-trip" className={TT_PUBLISH_HUB_L5.railTitle}>

            {t("publish_hub_rail_trip_title")}

          </h2>

          <p className={TT_PUBLISH_HUB_L5.railSubtitle}>{t("publish_hub_rail_trip_subtitle")}</p>

        </div>

        <Link

          href="/orders"

          className={`${TT_PUBLISH_HUB_L5.crossNavLink} ${FOCUS_RING}`}

          data-tt-publish-hub-trip-orders-link="1"

        >

          {t("publish_hub_trip_open_orders")}

        </Link>

      </div>



      {loading ? (

        <p className="text-meta text-slate-400/95">{t("publish_hub_trip_loading")}</p>

      ) : null}

      {error ? (

        <p className="text-meta text-danger" role="alert">

          {error}{" "}

          <button type="button" className={`text-ref-sun/90 underline ${FOCUS_RING}`} onClick={onRetry}>

            {t("common_retry")}

          </button>

        </p>

      ) : null}



      {!loading && !error ? (

        <PublishHubItemList items={items} listDataAttr="trip" coverAlt={t("publish_hub_item_cover_alt")} />

      ) : null}



      {!loading && !error && rows.length === 0 ? (

        <div className={TT_PUBLISH_HUB_L5.railPlaceholder}>

          <p className="text-meta text-slate-400/95">{t("publish_hub_trip_empty")}</p>

          <Link

            href="/"

            className={`mt-4 inline-flex min-h-[44px] items-center text-small font-semibold text-ref-sun/90 ${FOCUS_RING}`}

            data-tt-publish-hub-trip-create="1"

          >

            {t("publish_hub_trip_create_cta")}

          </Link>

        </div>

      ) : null}

    </section>

  );

}


