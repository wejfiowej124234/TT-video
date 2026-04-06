"use client";

import { useId, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";

export default function TravelTrustDemoPreview() {
  const { t } = useTranslation();
  const titleId = useId();
  const [city, setCity] = useState("tokyo");
  const [guide, setGuide] = useState("g1");
  const [tier, setTier] = useState("standard");
  const [note, setNote] = useState<string | null>(null);

  const field =
    "rounded-[var(--radius-lg)] border border-white/14 bg-slate-950/70 backdrop-blur-sm px-3 py-2 text-small text-slate-100 shadow-inner ring-1 ring-ref-cyan/15 focus:border-ref-cyan/55 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";

  return (
    <section id="demo" className="mt-10 scroll-mt-24" aria-labelledby={titleId}>
      <h2 id={titleId} className="text-body-l font-bold text-white">
        {t("traveltrust_demo_title")}
      </h2>
      <p className="mt-2 text-small leading-relaxed text-slate-300">{t("traveltrust_demo_intro")}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <label className="block text-meta font-medium text-slate-300">
          {t("traveltrust_demo_label_city")}
          <select className={`${field} mt-1 inline-flex w-full min-h-[44px] items-center justify-start`} value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="tokyo">{t("traveltrust_demo_city_tokyo")}</option>
            <option value="paris">{t("traveltrust_demo_city_paris")}</option>
            <option value="cairo">{t("traveltrust_demo_city_cairo")}</option>
          </select>
        </label>
        <label className="block text-meta font-medium text-slate-300">
          {t("traveltrust_demo_label_guide")}
          <select className={`${field} mt-1 inline-flex w-full min-h-[44px] items-center justify-start`} value={guide} onChange={(e) => setGuide(e.target.value)}>
            <option value="g1">{t("traveltrust_demo_guide_a")}</option>
            <option value="g2">{t("traveltrust_demo_guide_b")}</option>
          </select>
        </label>
        <label className="block text-meta font-medium text-slate-300">
          {t("traveltrust_demo_label_tier")}
          <select className={`${field} mt-1 inline-flex w-full min-h-[44px] items-center justify-start`} value={tier} onChange={(e) => setTier(e.target.value)}>
            <option value="standard">{t("traveltrust_demo_tier_standard")}</option>
            <option value="premium">{t("traveltrust_demo_tier_premium")}</option>
          </select>
        </label>
      </div>
      <form
        className="inline"
        onSubmit={(e) => {
          e.preventDefault();
          setNote(t("traveltrust_demo_toast"));
        }}
      >
        <button
          type="submit"
          className="mt-4 inline-flex min-h-[48px] items-center justify-center rounded-[var(--radius-lg)] bg-cta-gradient px-6 py-2.5 text-small font-semibold text-white shadow-medium transition-transform hover:brightness-110 active:scale-[0.98] motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          {t("traveltrust_demo_start")}
        </button>
      </form>
      {note ? (
        <p className="mt-3 text-small leading-relaxed text-slate-200" role="status">
          {note}
        </p>
      ) : null}
      <p className="mt-3 text-meta text-slate-400" role="note">
        {t("traveltrust_demo_disclosure")}
      </p>
    </section>
  );
}
