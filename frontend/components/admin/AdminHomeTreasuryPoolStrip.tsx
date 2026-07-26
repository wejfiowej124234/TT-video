"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import {
  ADMIN_INLINE_LINK_CLASS,
  ADMIN_TEXT_BODY_CLASS,
  ADMIN_TEXT_FOOTNOTE_CLASS,
  ADMIN_TEXT_MUTED_CLASS,
  ADMIN_WARM_L5_FRAME_CLASS,
  ADMIN_WARM_L5_INNER_CLASS,
  ADMIN_WARM_L5_PAD_CLASS,
} from "@/lib/adminUi";
import { adminHomeEmptyStateDisplay } from "@/lib/admin/adminHomeEmptyStateDict";
import {
  adminHomeTreasuryDonutFractions,
  resolveAdminHomeTreasuryPoolsSnapshot,
  type AdminHomeTreasuryPoolCard,
} from "@/lib/admin/adminHomeTreasuryPools";
import { travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

const DONUT_COLORS = ["#e8a05c", "#7eb8a8", "#8b9bb8", "#c4a574"] as const;

function DonutRing(props: { fractions: number[]; empty: boolean }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg
      viewBox="0 0 96 96"
      className="h-24 w-24 shrink-0"
      aria-hidden
      data-tt-admin-home-treasury-donut={props.empty ? "empty" : "data"}
    >
      <circle
        cx="48"
        cy="48"
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="10"
      />
      {props.fractions.map((f, i) => {
        const len = f * c;
        const el = (
          <circle
            key={i}
            cx="48"
            cy="48"
            r={r}
            fill="none"
            stroke={props.empty ? "rgba(255,255,255,0.14)" : DONUT_COLORS[i % DONUT_COLORS.length]}
            strokeWidth="10"
            strokeDasharray={`${len} ${c - len}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
            transform="rotate(-90 48 48)"
            opacity={props.empty ? 0.55 : 1}
          />
        );
        offset += len;
        return el;
      })}
      <circle cx="48" cy="48" r="26" fill="rgba(12,10,9,0.85)" />
      {!props.empty ? (
        <text
          x="48"
          y="52"
          textAnchor="middle"
          className="fill-slate-200"
          style={{ fontSize: 11, fontWeight: 600 }}
        >
          ·
        </text>
      ) : (
        <text
          x="48"
          y="52"
          textAnchor="middle"
          className="fill-slate-400"
          style={{ fontSize: 9, fontWeight: 600 }}
          data-tt-admin-home-treasury-donut-mark="undeployed"
        >
          —
        </text>
      )}
    </svg>
  );
}

function PoolCard(props: { pool: AdminHomeTreasuryPoolCard; t: (k: string) => string }) {
  const { pool, t } = props;
  const empty = pool.status !== "ok";
  const fractions = useMemo(
    () => adminHomeTreasuryDonutFractions(pool.slices),
    [pool.slices],
  );

  return (
    <li
      className={`${ADMIN_WARM_L5_FRAME_CLASS}`}
      data-tt-admin-home-treasury-pool={pool.id}
      data-tt-admin-home-treasury-status={pool.status}
    >
      <div className={`${ADMIN_WARM_L5_INNER_CLASS} ${ADMIN_WARM_L5_PAD_CLASS}`}>
        <div className="flex gap-3">
          <DonutRing fractions={fractions} empty={empty} />
          <div className="min-w-0 flex-1">
            <h3 className={`text-body font-semibold ${ADMIN_TEXT_BODY_CLASS}`}>{t(pool.titleKey)}</h3>
            <p className={`mt-1 text-meta ${ADMIN_TEXT_MUTED_CLASS}`}>{t(pool.statusNoteKey)}</p>
            <ul className={`mt-2 space-y-0.5 text-small ${ADMIN_TEXT_FOOTNOTE_CLASS}`}>
              {pool.slices.map((s) => (
                <li key={s.id}>
                  {t(s.labelKey)}:{" "}
                  <span className={`font-medium ${ADMIN_TEXT_BODY_CLASS}`}>
                    {s.amount == null
                      ? adminHomeEmptyStateDisplay(t, "not_deployed")
                      : s.amount}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </li>
  );
}

/** HU-436 · not_deployed 单一空态（禁三环全 — 假故障感） */
function TreasuryNotDeployedEmpty(props: {
  poolTitleKeys: string[];
  t: (k: string) => string;
}) {
  const { poolTitleKeys, t } = props;
  return (
    <div
      className={`${ADMIN_WARM_L5_FRAME_CLASS} mt-3`}
      data-tt-admin-home-treasury-empty="1"
      data-tt-admin-home-treasury-empty-not-deployed="1"
    >
      <div className={`${ADMIN_WARM_L5_INNER_CLASS} ${ADMIN_WARM_L5_PAD_CLASS}`}>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="inline-flex min-h-[44px] items-center rounded-[var(--radius-md)] border border-white/15 bg-slate-950/55 px-3 py-2 text-small font-semibold text-slate-200"
            data-tt-admin-home-treasury-undeployed-badge="1"
          >
            {t("admin_home_treasury_empty_badge")}
          </span>
          <div className="min-w-0 flex-1">
            <p className={`text-body font-semibold ${ADMIN_TEXT_BODY_CLASS}`}>
              {t("admin_home_treasury_empty_title")}
            </p>
            <p className={`mt-1 text-meta ${ADMIN_TEXT_MUTED_CLASS}`} data-tt-admin-home-treasury-empty-lead="1">
              {t("admin_home_treasury_empty_lead")}
            </p>
          </div>
        </div>
        <ul
          className={`mt-3 flex flex-wrap gap-2 text-small ${ADMIN_TEXT_FOOTNOTE_CLASS}`}
          data-tt-admin-home-treasury-empty-pool-names="1"
        >
          {poolTitleKeys.map((key) => (
            <li
              key={key}
              className="rounded-[var(--radius-sm)] border border-white/10 px-2.5 py-1 text-slate-300"
            >
              {t(key)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Batch-9 · 资金池环图条（诚实 not_deployed；禁止假主网余额）
 * Batch-11 W08 HU-393 · finance-suite 日结头寸壳
 * Batch-11 W14 HU-327/336 · 短诚实句 + 单条财务 CTA
 * Batch-12 W04 HU-436 · not_deployed 空态升级（单一徽章 · 禁三环假故障）
 * Batch-12 W04 HU-450 · 固定禁写脚注（只读观测 · 禁 Escrow/资金写）
 */
export function AdminHomeTreasuryPoolStrip(props?: {
  /** When set, marks finance-suite daily position panel */
  positionVariant?: "home" | "finance-suite";
}) {
  const { t } = useTranslation();
  const snap = useMemo(() => resolveAdminHomeTreasuryPoolsSnapshot(), []);
  const variant = props?.positionVariant ?? "home";
  const notDeployed = snap.source === "not_deployed";

  return (
    <section
      className="mt-4"
      data-tt-admin-home-treasury-pools="1"
      data-tt-admin-home-treasury-source={snap.source}
      data-tt-admin-home-treasury-cta-policy="single_strip"
      data-tt-admin-fin-treasury-position={
        variant === "finance-suite" ? snap.source : undefined
      }
      aria-label={
        variant === "finance-suite"
          ? t("admin_fin_treasury_position_title")
          : t("admin_home_treasury_aria")
      }
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-body font-semibold text-ink-900">
          {variant === "finance-suite"
            ? t("admin_fin_treasury_position_title")
            : t("admin_home_treasury_title")}
        </h3>
        <p
          className={`text-meta ${ADMIN_TEXT_FOOTNOTE_CLASS}`}
          role="note"
          data-tt-admin-home-treasury-honesty="1"
        >
          {t("admin_home_treasury_honesty")}
        </p>
      </div>
      <p
        className={`mt-1 text-meta font-medium ${ADMIN_TEXT_FOOTNOTE_CLASS}`}
        role="note"
        data-tt-admin-home-treasury-no-write="1"
      >
        {t("admin_home_treasury_no_write_footnote")}
      </p>
      {variant === "finance-suite" ? (
        <p className={`mt-1 text-meta ${ADMIN_TEXT_FOOTNOTE_CLASS}`} data-tt-admin-fin-treasury-position-lead="1">
          {t("admin_fin_treasury_position_lead")}
        </p>
      ) : null}
      {notDeployed ? (
        <TreasuryNotDeployedEmpty poolTitleKeys={snap.pools.map((p) => p.titleKey)} t={t} />
      ) : (
        <ul className="mt-3 grid gap-3 lg:grid-cols-3">
          {snap.pools.map((pool) => (
            <PoolCard key={pool.id} pool={pool} t={t} />
          ))}
        </ul>
      )}
      <p className="mt-3">
        <Link
          href="/admin/finance-suite"
          className={`inline-flex min-h-[44px] items-center text-small font-semibold ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}
          data-tt-admin-home-treasury-deep-link="strip"
        >
          {t("admin_home_treasury_open_finance")}
        </Link>
      </p>
    </section>
  );
}
