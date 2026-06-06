/** `/me/settings` 列表行图标（16px · 与顶栏菜单同族线框） */
export function MeSettingsL5Icon({ id }: { id: string }) {
  const common = "h-[18px] w-[18px]";
  switch (id) {
    case "profile":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M20 21a8 8 0 10-16 0" strokeLinecap="round" />
          <circle cx="12" cy="8" r="4" />
        </svg>
      );
    case "identities":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" strokeLinejoin="round" />
          <path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" />
        </svg>
      );
    case "orders":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M6 6h15l-1.5 9h-12L6 6z" strokeLinejoin="round" />
          <path d="M6 6l-2-2H2" strokeLinecap="round" />
          <circle cx="9" cy="19" r="1.5" />
          <circle cx="18" cy="19" r="1.5" />
        </svg>
      );
    case "posts":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case "collects":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" strokeLinejoin="round" />
        </svg>
      );
    case "likes":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" strokeLinejoin="round" />
        </svg>
      );
    case "feedback":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4v8z" strokeLinejoin="round" />
        </svg>
      );
    case "password":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 118 0v3" strokeLinecap="round" />
        </svg>
      );
    case "shield":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M12 3l7 4v6c0 4.5-3 7.5-7 8-4-.5-7-3.5-7-8V7l7-4z" strokeLinejoin="round" />
        </svg>
      );
    case "onboarding":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M4 6h16M4 12h10M4 18h6" strokeLinecap="round" />
          <circle cx="18" cy="12" r="3" />
        </svg>
      );
    case "reports":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M6 4h9l5 5v11H6V4z" strokeLinejoin="round" />
          <path d="M15 4v5h5M9 13h6M9 17h4" strokeLinecap="round" />
        </svg>
      );
    case "wallet":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M3 7h18v12H3V7z" strokeLinejoin="round" />
          <path d="M3 11h18M16 15h2" strokeLinecap="round" />
        </svg>
      );
    case "bell":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M18 8a6 6 0 10-12 0c0 7-3 8-3 8h18s-3-1-3-8M13.7 21a2 2 0 01-3.4 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "language":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 3 4 6.5 4 9s-1.5 6-4 9M12 3c-2.5 3-4 6.5-4 9s1.5 6 4 9" />
        </svg>
      );
    case "help":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9.5a2.5 2.5 0 014.5 1c0 2-2.5 2-2.5 4M12 17h.01" strokeLinecap="round" />
        </svg>
      );
    case "trust":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M12 3l7 4v6c0 4.5-3 7.5-7 8-4-.5-7-3.5-7-8V7l7-4z" strokeLinejoin="round" />
        </svg>
      );
    case "privacy":
    case "legal":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M8 4h8l2 4H6l2-4zM6 8h12v12H6V8z" strokeLinejoin="round" />
        </svg>
      );
    case "guide":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M4 19V5M4 19h16M8 15v-4M12 15V7M16 15v-2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "chevron":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}
