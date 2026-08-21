import type { TravelTrustRoleConfig } from "@/app/traveltrust/traveltrustIdentityModel";

export function RoleIcon({ icon, className = "h-5 w-5" }: { icon: TravelTrustRoleConfig["icon"]; className?: string }) {
  const cn = className;
  switch (icon) {
    case "traveler":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
          <path d="M4 20V10l8-6 8 6v10" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 20v-6h6v6" strokeLinecap="round" />
        </svg>
      );
    case "guide":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3" strokeLinecap="round" />
          <path d="m12 8 3 4-3 4-3-4 3-4z" />
        </svg>
      );
    case "merchant":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
          <path d="M4 10h16v10H4z" strokeLinejoin="round" />
          <path d="M8 10V6h8v4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 14v4" strokeLinecap="round" />
        </svg>
      );
    case "acquisition":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
          <path d="M3 7h11v13H3z" strokeLinejoin="round" />
          <path d="M14 10h7v10h-7z" strokeLinejoin="round" />
          <path d="M16 10V6h3v4" strokeLinecap="round" />
          <path d="m6 13 3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "steward":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
        </svg>
      );
    default:
      return null;
  }
}
