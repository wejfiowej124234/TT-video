"use client";

import Image from "next/image";
import { useTranslation } from "@/components/LocaleProvider";
import { communityMediaAbsoluteUrlForRender, communityMediaNextImageUnoptimized } from "@/lib/communityMediaClientUrl";

export function ChatBlockSenderAvatar({
  senderId,
  avatarUrl,
  senderName,
  isDid,
  avatarPriority,
}: {
  senderId: string;
  avatarUrl?: string | null;
  senderName?: string | null;
  isDid: boolean;
  avatarPriority?: boolean;
}) {
  const { t } = useTranslation();
  const initial = senderId.slice(0, 2).toLowerCase();
  const bgClass = isDid ? "bg-ink-500/80 text-slate-200" : "bg-ink-200/80 text-ink-700";
  const hint = senderName?.trim() || senderId.slice(0, 8);
  const trimmedAvatar = (avatarUrl ?? "").trim();
  const resolvedAvatar = trimmedAvatar ? communityMediaAbsoluteUrlForRender(trimmedAvatar) : "";
  const alt =
    trimmedAvatar && senderName?.trim()
      ? t("guide_card_avatarAlt", { name: senderName.trim() })
      : t("escrow_chat_sender_avatar_alt", { hint });
  if (resolvedAvatar) {
    return (
      <span className="relative h-11 w-11 shrink-0 rounded-full overflow-hidden ring-1 ring-white/20">
        <Image
          src={resolvedAvatar}
          alt={alt}
          fill
          className="object-cover"
          sizes="44px"
          unoptimized={communityMediaNextImageUnoptimized(resolvedAvatar)}
          priority={Boolean(avatarPriority)}
          fetchPriority={avatarPriority ? "high" : "low"}
        />
      </span>
    );
  }
  return (
    <span className={`h-11 w-11 shrink-0 rounded-full flex items-center justify-center text-meta font-semibold ${bgClass}`} aria-hidden>
      {initial}
    </span>
  );
}
