"use client";

import { guideRegisterStep1Checklist } from "@/lib/guide/guideRegisterStep1Checklist";
import type { GuideRegisterStep1Input } from "@/lib/guide/guideRegisterValidation";

export default function GuideRegisterStep1ProgressBar({
  t,
  input,
}: {
  t: (key: string) => string;
  input: GuideRegisterStep1Input & { walletVerified: boolean };
}) {
  const items = guideRegisterStep1Checklist(input);
  const done = items.filter((i) => i.done).length;
  const total = items.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-2" aria-live="polite">
      <p className="text-meta text-slate-400/95">
        {t("guideRegister_step1Progress").replace("{{done}}", String(done)).replace("{{total}}", String(total))}
      </p>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-ref-sun/10">
        <div className="h-full rounded-full bg-ref-sun/70 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <ul className="grid gap-1 sm:grid-cols-2">
        {items.map((item) => (
          <li
            key={item.key}
            className={`text-meta ${item.done ? "text-ref-sun/90" : "text-slate-500"}`}
          >
            <span aria-hidden>{item.done ? "✓ " : "○ "}</span>
            {t(item.key)}
          </li>
        ))}
      </ul>
    </div>
  );
}
