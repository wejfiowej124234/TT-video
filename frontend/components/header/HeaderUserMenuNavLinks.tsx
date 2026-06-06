"use client";

import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { HeaderUserMenuItemIcon } from "@/components/header/HeaderUserMenuItemIcon";
import { headerUserMenuNavItemIsActive } from "@/components/header/headerUserMenuNavActive";
import {
  type HeaderUserMenuNavItem,
  type HeaderUserMenuVariant,
  HEADER_USER_MENU_PROFILE_HREF,
  headerUserMenuNavItems,
  headerUserMenuNavSections,
} from "@/components/header/headerUserMenuNavModel";
import { isCommunityMeLikesListEnabled } from "@/lib/communityMeFeatureFlags";
import { TT_HEADER_USER_MENU_L5 } from "@/lib/header/headerUserMenuL5";
import { communityMediaNextImageUnoptimized } from "@/lib/communityMediaClientUrl";
import { isAdminActorRole } from "@/lib/admin/adminActorFromMe";
import { joinActiveSpineSlotLabels, type MeIdentitySlotId } from "@/lib/meIdentitySlots";
import { meRoleFromGetMe } from "@/lib/meRole";

function prefetchSafe(prefetch: (href: string) => void, href: string) {
  try {
    prefetch(href);
  } catch {
    /* noop */
  }
}

function isActivePath(
  pathname: string,
  href: string,
  searchParams: Pick<URLSearchParams, "get"> | null,
): boolean {
  return headerUserMenuNavItemIsActive(pathname, href, searchParams);
}

function renderNavItem(
  item: HeaderUserMenuNavItem,
  pathname: string,
  searchParams: Pick<URLSearchParams, "get"> | null,
  prefetchHref: (href: string) => void,
  t: (k: string, vars?: Record<string, string>) => string,
  onNavigate: () => void,
) {
  const active = isActivePath(pathname, item.href, searchParams);
  const className = [
    TT_HEADER_USER_MENU_L5.item,
    active ? TT_HEADER_USER_MENU_L5.itemActive : "",
    item.featured && !active ? TT_HEADER_USER_MENU_L5.itemFeatured : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Fragment key={item.href}>
      {item.dividerBefore ? <div className={TT_HEADER_USER_MENU_L5.divider} role="separator" /> : null}
      <Link
        href={item.href}
        prefetch
        onPointerEnter={() => prefetchSafe(prefetchHref, item.href)}
        onClick={onNavigate}
        className={className}
        role="menuitem"
        aria-current={active ? "page" : undefined}
      >
        <span
          className={`${TT_HEADER_USER_MENU_L5.itemIcon} ${active ? TT_HEADER_USER_MENU_L5.itemIconActive : ""}`}
          aria-hidden
        >
          <HeaderUserMenuItemIcon id={item.iconId} />
        </span>
        <span className={TT_HEADER_USER_MENU_L5.itemLabel}>{t(item.labelKey)}</span>
      </Link>
    </Fragment>
  );
}

function renderProfileStripLink(props: {
  pathname: string;
  searchParams: Pick<URLSearchParams, "get"> | null;
  prefetchHref: (href: string) => void;
  t: (k: string, vars?: Record<string, string>) => string;
  onNavigate: () => void;
  displayName: string;
  avatarInitial?: string | null;
  showAvatar?: boolean;
  avatarUrl?: string;
  onAvatarError?: () => void;
  spineSlots?: string;
  variant: HeaderUserMenuVariant;
}) {
  const {
    pathname,
    searchParams,
    prefetchHref,
    t,
    onNavigate,
    displayName,
    avatarInitial,
    showAvatar,
    avatarUrl,
    onAvatarError,
    spineSlots,
    variant,
  } = props;
  const active = isActivePath(pathname, HEADER_USER_MENU_PROFILE_HREF, searchParams);
  const stripClass = [
    TT_HEADER_USER_MENU_L5.profileStrip,
    active ? TT_HEADER_USER_MENU_L5.profileStripActive : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Link
      href={HEADER_USER_MENU_PROFILE_HREF}
      prefetch
      onPointerEnter={() => prefetchSafe(prefetchHref, HEADER_USER_MENU_PROFILE_HREF)}
      onClick={onNavigate}
      className={stripClass}
      role="menuitem"
      aria-label={t("nav_community_profile")}
      aria-current={active ? "page" : undefined}
      data-tt-header-user-menu-profile-strip="1"
    >
      {variant === "authL5" ? (
        <>
          <span className={TT_HEADER_USER_MENU_L5.profileAvatar}>
            {showAvatar && avatarUrl ? (
              <Image
                src={avatarUrl}
                alt=""
                fill
                className="object-cover"
                sizes="36px"
                unoptimized={communityMediaNextImageUnoptimized(avatarUrl)}
                onError={onAvatarError}
              />
            ) : avatarInitial ? (
              <span className={TT_HEADER_USER_MENU_L5.avatarInitial}>{avatarInitial}</span>
            ) : (
              <HeaderUserMenuItemIcon id="profile" />
            )}
          </span>
          <span className={TT_HEADER_USER_MENU_L5.profileText}>
            <span className={TT_HEADER_USER_MENU_L5.profileName}>{displayName}</span>
            {spineSlots ? <span className={TT_HEADER_USER_MENU_L5.profileSpine}>{spineSlots}</span> : null}
          </span>
        </>
      ) : (
        <span>{t("nav_community_profile")}</span>
      )}
    </Link>
  );
}

export function HeaderUserMenuNavLinks(props: {
  prefetchHref: (href: string) => void;
  t: (k: string, vars?: Record<string, string>) => string;
  locale: string;
  onNavigate: () => void;
  variant: HeaderUserMenuVariant;
  mePayload?: unknown | null;
  displayName: string;
  avatarInitial?: string | null;
  showAvatar?: boolean;
  avatarUrl?: string;
  onAvatarError?: () => void;
}) {
  const {
    prefetchHref,
    t,
    locale,
    onNavigate,
    variant,
    mePayload,
    displayName,
    avatarInitial,
    showAvatar,
    avatarUrl,
    onAvatarError,
  } = props;
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const isAuthL5 = variant === "authL5";

  const spineSep = locale === "zh" ? "、" : ", ";
  const spineSlots = mePayload
    ? joinActiveSpineSlotLabels(mePayload, (id: MeIdentitySlotId) => t(`header_identitySpine_${id}`), spineSep)
    : "";

  const showAdminWorkspace = isAdminActorRole(meRoleFromGetMe(mePayload));
  const navOpts = { showLikesList: isCommunityMeLikesListEnabled(), showAdminWorkspace };

  if (!isAuthL5) {
    return (
      <>
        {renderProfileStripLink({
          pathname,
          searchParams,
          prefetchHref,
          t,
          onNavigate,
          displayName,
          avatarInitial,
          showAvatar,
          avatarUrl,
          onAvatarError,
          variant,
        })}
        {headerUserMenuNavItems(variant, navOpts).map((item) => {
          const active = isActivePath(pathname, item.href, searchParams);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              onPointerEnter={() => prefetchSafe(prefetchHref, item.href)}
              onClick={onNavigate}
              className={item.className}
              role="menuitem"
              aria-current={active ? "page" : undefined}
            >
              {t(item.labelKey)}
            </Link>
          );
        })}
      </>
    );
  }

  const sections = headerUserMenuNavSections(variant, navOpts);

  return (
    <>
      {renderProfileStripLink({
        pathname,
        searchParams,
        prefetchHref,
        t,
        onNavigate,
        displayName,
        avatarInitial,
        showAvatar,
        avatarUrl,
        onAvatarError,
        spineSlots,
        variant,
      })}
      <nav className={TT_HEADER_USER_MENU_L5.navRoot} aria-label={t("header_userMenu")}>
        {sections.map((section) => (
          <div key={section.id} className={TT_HEADER_USER_MENU_L5.navSection}>
            <p className={TT_HEADER_USER_MENU_L5.sectionLabel}>{t(section.labelKey)}</p>
            {section.items.map((item) => renderNavItem(item, pathname, searchParams, prefetchHref, t, onNavigate))}
          </div>
        ))}
      </nav>
    </>
  );
}
