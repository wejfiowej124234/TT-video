import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  ADMIN_INIT_SYSTEM_HREF,
  TT_ADMIN_CHROME_OPS_INIT_SYSTEM_MARK,
  adminShellInitSystemCtaAllowed,
} from "@/lib/admin/adminChromeOpsInitSystem";
import { adminCommandPaletteEntries } from "@/lib/admin/adminCommandPaletteEntries";
import {
  ADMIN_HOME_EMPTY_STATE_DASH_KEY,
  ADMIN_HOME_EMPTY_STATE_EMPTY_KEY,
  ADMIN_HOME_EMPTY_STATE_LOADING_KEY,
  TT_ADMIN_EMPTY_STATE_DICT_HU577_MARK,
  TT_ADMIN_HOME_EMPTY_STATE_DICT_MARK,
  adminHomeEmptyStateLabelKey,
} from "@/lib/admin/adminHomeEmptyStateDict";
import { TT_ADMIN_HOME_FOCUS_COMPANION_TODO_ONLY_MARK } from "@/lib/admin/adminHomeFocusCompanionTodoOnly";
import {
  ADMIN_HOME_I18N_DEAD_KEYS_REMOVED,
  ADMIN_HOME_I18N_SYMMETRY_REQUIRED_KEYS,
  TT_ADMIN_HOME_I18N_KEY_SYMMETRY_MARK,
} from "@/lib/admin/adminHomeI18nKeySymmetryHu462";
import { adminHomeKpiMetricDisplay } from "@/lib/admin/adminHomeKpiMetric";
import {
  ADMIN_HOME_SOFT_REVALIDATE_TTL_MS,
  TT_ADMIN_HOME_SOFT_REVALIDATE_MARK,
  adminHomeSoftRevalidateShouldReload,
} from "@/lib/admin/adminHomeSoftRevalidate";
import {
  ADMIN_HOME_OVERVIEW_TOP_ROLES_MAX,
  TT_ADMIN_HOME_OVERVIEW_DENSITY_MARK,
  adminHomeSystemOverviewRolesBeyondTop,
  adminHomeSystemOverviewTopRoles,
} from "@/lib/admin/adminHomeSystemOverviewMetrics";
import {
  ADMIN_INBOX_WORKFLOW_CHIPS_ROW_CLASS,
  TT_ADMIN_INBOX_WORKFLOW_CHIPS_MARK,
} from "@/lib/admin/adminInboxWorkflowChipsHu442";
import {
  ADMIN_SHELL_BRAND_WORDMARK_KEY,
  TT_ADMIN_SHELL_BRAND_WORDMARK_MARK,
} from "@/lib/admin/adminShellBrandWordmark";
import {
  ADMIN_SUPERADMIN_PRIVILEGE_SOP_HREF,
  TT_ADMIN_HOME_SUPERADMIN_SOP_MARK,
  adminHomeSuperAdminAlertExpandedByDefault,
} from "@/lib/admin/adminSuperAdminPrivilegeAlert";
import {
  adminShellCommandPaletteTriggerVisible,
  adminShellDeployEnvBadgeQuiet,
  adminShellWorkspaceOpsChromeDemoted,
  TT_ADMIN_SHELL_WORKSPACE_OPS_DEMOTED_MARK,
} from "@/lib/admin/adminShellUxPolicy";
import zh from "@/locales/zh";
import en from "@/locales/en";

const fe = resolve(__dirname, "../..");

describe("Batch-12 W05 · HU-437 workspace ops chrome demotion (①)", () => {
  it("HU-437 · policy demotes search chip + quiet deploy badge on workspace", () => {
    expect(
      adminShellCommandPaletteTriggerVisible({
        maintainerUi: true,
        onWorkspace: true,
        pendingTotal: 13,
      }),
    ).toBe(false);
    expect(adminShellDeployEnvBadgeQuiet({ onWorkspace: true })).toBe(true);
    expect(adminShellWorkspaceOpsChromeDemoted(true)).toBe(true);
    expect(TT_ADMIN_SHELL_WORKSPACE_OPS_DEMOTED_MARK).toContain("hu437");
  });

  it("HU-437 · AdminShellBar wires demotion markers + quiet env + no init CTA", () => {
    const bar = readFileSync(resolve(fe, "components/admin/AdminShellBar.tsx"), "utf8");
    expect(bar).toContain("HU-437");
    expect(bar).toContain("adminShellWorkspaceOpsChromeDemoted");
    expect(bar).toContain("adminShellDeployEnvBadgeQuiet");
    expect(bar).toContain('data-tt-admin-shell-workspace-ops-demoted={workspaceOpsDemoted ? "hu437"');
    expect(bar).toContain("TT_ADMIN_SHELL_WORKSPACE_OPS_DEMOTED_MARK");
    expect(bar).toContain('data-tt-admin-shell-ops-chrome={workspaceOpsDemoted ? "quiet"');
    expect(bar).toContain('data-tt-admin-deploy-env-quiet={deployEnvQuiet ? "1"');
    expect(bar).not.toMatch(/初始化系统/);
    expect(bar).not.toMatch(/admin_shell_init_system|admin_cmd_init_system|InitSystem/);
  });

  it("HU-437 · ux policy exports staging needle literal", () => {
    const policy = readFileSync(resolve(fe, "lib/admin/adminShellUxPolicy.ts"), "utf8");
    expect(policy).toContain("HU-437");
    expect(policy).toContain('tt_admin_shell_workspace_ops_demoted_hu437');
  });
});

describe("Batch-12 W05 · HU-448 init-system mis-touch governance (①)", () => {
  it("HU-448 · surface allowlist forbids workspace/shell bar", () => {
    expect(adminShellInitSystemCtaAllowed("workspace")).toBe(false);
    expect(adminShellInitSystemCtaAllowed("shell_bar")).toBe(false);
    expect(adminShellInitSystemCtaAllowed("config_maintainer")).toBe(true);
    expect(adminShellInitSystemCtaAllowed("command_palette")).toBe(true);
    expect(ADMIN_INIT_SYSTEM_HREF).toBe("/admin/schema");
    expect(TT_ADMIN_CHROME_OPS_INIT_SYSTEM_MARK).toBe("tt_admin_chrome_ops_init_system_hu448");
  });

  it("HU-448 · config hub + entry wire confirm markers; shell/home forbid CTA", () => {
    const hub = readFileSync(resolve(fe, "app/admin/config/AdminConfigHubPageMain.tsx"), "utf8");
    expect(hub).toContain("HU-448");
    expect(hub).toContain("AdminChromeOpsInitSystemEntry");
    expect(hub).toContain('data-tt-admin-chrome-ops-init-slot="hu448"');
    const entry = readFileSync(
      resolve(fe, "components/admin/AdminChromeOpsInitSystemEntry.tsx"),
      "utf8",
    );
    expect(entry).toContain("HU-448");
    expect(entry).toContain("adminChromeOpsInitSystemConfirmRequest");
    expect(entry).toContain('data-tt-admin-chrome-ops-init-system="hu448"');
    expect(entry).toContain("TT_ADMIN_CHROME_OPS_INIT_SYSTEM_MARK");
    const bar = readFileSync(resolve(fe, "components/admin/AdminShellBar.tsx"), "utf8");
    expect(bar).not.toContain("AdminChromeOpsInitSystemEntry");
    expect(bar).not.toContain("admin_chrome_ops_init_system_label");
    const home = readFileSync(resolve(fe, "components/admin/AdminHomeClient.tsx"), "utf8");
    expect(home).not.toContain("AdminChromeOpsInitSystemEntry");
    expect(home).not.toContain("admin_chrome_ops_init_system_label");
  });

  it("HU-448 · ⌘K maintainer entry requires confirm; ops role has no init CTA", () => {
    const palette = readFileSync(resolve(fe, "components/admin/AdminCommandPalette.tsx"), "utf8");
    expect(palette).toContain("HU-448");
    expect(palette).toContain("requiresConfirm");
    expect(palette).toContain("adminChromeOpsInitSystemConfirmRequest");
    const maintainer = adminCommandPaletteEntries("super_admin", () => true, true);
    const init = maintainer.find((e) => e.titleKey === "admin_chrome_ops_init_system_label");
    expect(init?.requiresConfirm).toBe(true);
    expect(init?.href).toBe("/admin/schema");
    const ops = adminCommandPaletteEntries("admin", () => true, true);
    expect(ops.some((e) => e.titleKey === "admin_chrome_ops_init_system_label")).toBe(false);
  });

  it("HU-448 · zh/en product copy for init CTA + confirm", () => {
    expect(zh.admin_chrome_ops_init_system_label).toBe("初始化系统");
    expect(zh.admin_chrome_ops_init_system_confirm_desc).toMatch(/二次确认|确认后|只读/);
    expect(en.admin_chrome_ops_init_system_label).toMatch(/Initialize/i);
    expect(en.admin_chrome_ops_init_system_confirm_desc.toLowerCase()).toMatch(/confirm|read-only/);
  });
});

describe("Batch-12 W05 · HU-438 Inbox focus bar secondary (①)", () => {
  it("HU-438 · banner token is outline secondary (not filled INSET)", () => {
    const ui = readFileSync(resolve(fe, "lib/adminUi.ts"), "utf8");
    expect(ui).toContain("HU-438");
    expect(ui).toContain("tt_admin_inbox_focus_banner_secondary_hu438");
    expect(ui).toContain("ADMIN_INBOX_OPEN_UNIFIED_SECONDARY_CLASS");
    expect(ui).toMatch(
      /ADMIN_INBOX_FOCUS_BANNER_CLASS =\s*"inline-flex[\s\S]*?border-ref-sun\/40[\s\S]*?bg-transparent/,
    );
    expect(ui).not.toMatch(
      /export const ADMIN_INBOX_FOCUS_BANNER_CLASS = ADMIN_INBOX_FOCUS_INSET_CLASS/,
    );
  });

  it("HU-438 · focus strip wires secondary markers + open-unified secondary CTA", () => {
    const strip = readFileSync(resolve(fe, "components/admin/AdminHomeInboxStrip.tsx"), "utf8");
    expect(strip).toContain("HU-438");
    expect(strip).toContain('data-tt-admin-inbox-focus-banner="hu438"');
    expect(strip).toContain('data-tt-admin-inbox-focus-banner-tone="secondary"');
    expect(strip).toContain('data-tt-admin-inbox-focus-banner-secondary="hu438"');
    expect(strip).toContain("TT_ADMIN_INBOX_FOCUS_BANNER_SECONDARY_MARK");
    expect(strip).toContain("ADMIN_INBOX_OPEN_UNIFIED_SECONDARY_CLASS");
    expect(strip).toContain('data-tt-admin-inbox-open-unified-secondary="hu438"');
    expect(strip).not.toContain("ADMIN_INBOX_FOCUS_CTA_CLASS");
  });
});

describe("Batch-12 W05 · HU-439 overview density (①)", () => {
  it("HU-439 · Top-4 + beyond helpers; alert expands only critical", () => {
    expect(ADMIN_HOME_OVERVIEW_TOP_ROLES_MAX).toBe(4);
    expect(TT_ADMIN_HOME_OVERVIEW_DENSITY_MARK).toBe("tt_admin_home_overview_density_hu439");
    expect(adminHomeSystemOverviewTopRoles({ a: 5, b: 4, c: 3, d: 2, e: 1 })).toHaveLength(4);
    expect(adminHomeSystemOverviewRolesBeyondTop({ a: 5, b: 4, c: 3, d: 2, e: 1 })).toHaveLength(1);
    expect(adminHomeSuperAdminAlertExpandedByDefault("critical")).toBe(true);
    expect(adminHomeSuperAdminAlertExpandedByDefault("warn")).toBe(false);
    expect(adminHomeSuperAdminAlertExpandedByDefault("ok")).toBe(false);
  });

  it("HU-439 · overview wires density markers + roles fold + warn fold", () => {
    const overview = readFileSync(
      resolve(fe, "components/admin/AdminHomeSystemOverview.tsx"),
      "utf8",
    );
    expect(overview).toContain("HU-439");
    expect(overview).toContain("TT_ADMIN_HOME_OVERVIEW_DENSITY_MARK");
    expect(overview).toContain('data-tt-admin-home-overview-density="hu439"');
    expect(overview).toContain('data-tt-admin-home-roles-more-fold="hu439"');
    expect(overview).toContain("adminHomeSystemOverviewRolesBeyondTop");
    expect(overview).toContain('data-tt-admin-home-superadmin-alert-fold="hu439"');
    expect(overview).toContain('data-tt-admin-home-superadmin-alert-expanded="hu439"');
    expect(overview).toContain("adminHomeSuperAdminAlertExpandedByDefault");
    expect(overview).toContain('data-tt-admin-home-roles-more="1"');
  });

  it("HU-439 · zh/en more-roles + warn summary copy", () => {
    expect(zh.admin_home_system_overview_roles_more).toMatch(/更多角色/);
    expect(en.admin_home_system_overview_roles_more.toLowerCase()).toMatch(/more roles/);
    expect(zh.admin_home_superadmin_alert_warn_summary).toMatch(/展开|特权/);
    expect(en.admin_home_superadmin_alert_warn_summary.toLowerCase()).toMatch(/expand|privilege/);
  });
});

describe("Batch-12 W05 · HU-440 empty-state three-state dict (①)", () => {
  it("HU-440 · dict keys are loading / empty / dash", () => {
    expect(TT_ADMIN_HOME_EMPTY_STATE_DICT_MARK).toBe("tt_admin_home_empty_state_dict_hu440");
    expect(TT_ADMIN_EMPTY_STATE_DICT_HU577_MARK).toBe("tt_admin_empty_state_dict_hu577");
    expect(adminHomeEmptyStateLabelKey("loading")).toBe(ADMIN_HOME_EMPTY_STATE_LOADING_KEY);
    expect(adminHomeEmptyStateLabelKey("empty")).toBe(ADMIN_HOME_EMPTY_STATE_EMPTY_KEY);
    expect(adminHomeEmptyStateLabelKey("not_deployed")).toBe(ADMIN_HOME_EMPTY_STATE_DASH_KEY);
  });

  it("HU-440 · KPI + overview wire dict; zh/en copy aligned", () => {
    const t = (k: string) => k;
    expect(
      adminHomeKpiMetricDisplay(
        { loading: true, count: null, permissionDenied: false },
        t,
        "admin_home_kpi_guides",
      ),
    ).toBe(ADMIN_HOME_EMPTY_STATE_LOADING_KEY);
    expect(
      adminHomeKpiMetricDisplay(
        { loading: false, count: null, permissionDenied: false },
        t,
        "admin_home_kpi_guides",
      ),
    ).toBe(ADMIN_HOME_EMPTY_STATE_EMPTY_KEY);
    const overview = readFileSync(
      resolve(fe, "components/admin/AdminHomeSystemOverview.tsx"),
      "utf8",
    );
    expect(overview).toContain("HU-440");
    expect(overview).toContain("TT_ADMIN_HOME_EMPTY_STATE_DICT_MARK");
    expect(overview).toContain('data-tt-admin-home-empty-state-dict="hu440"');
    expect(zh.admin_home_empty_state_loading).toBe("加载中");
    expect(zh.admin_home_empty_state_empty).toBe("暂无统计");
    expect(zh.admin_home_empty_state_dash).toBe("—");
    expect(en.admin_home_empty_state_loading).toMatch(/Loading/);
    expect(en.admin_home_empty_state_empty.toLowerCase()).toMatch(/no data/);
    expect(en.admin_home_empty_state_dash).toBe("—");
    expect(zh.admin_home_kpi_loading).toBe(zh.admin_home_empty_state_loading);
    expect(zh.admin_home_kpi_unavailable).toBe(zh.admin_home_empty_state_empty);
  });
});

describe("Batch-12 W05 · HU-442 workflow chips scroll (①)", () => {
  it("HU-442 · chips row is horizontal scroll; recent visits 44px", () => {
    expect(TT_ADMIN_INBOX_WORKFLOW_CHIPS_MARK).toBe("tt_admin_inbox_workflow_chips_hu442");
    expect(ADMIN_INBOX_WORKFLOW_CHIPS_ROW_CLASS).toContain("overflow-x-auto");
    expect(ADMIN_INBOX_WORKFLOW_CHIPS_ROW_CLASS).toContain("flex-nowrap");
    const nav = readFileSync(resolve(fe, "components/admin/AdminInboxWorkflowQuickNav.tsx"), "utf8");
    expect(nav).toContain("HU-442");
    expect(nav).toContain('data-tt-admin-inbox-workflow-chips="hu442"');
    const companion = readFileSync(
      resolve(fe, "components/admin/AdminHomeFocusCompanion.tsx"),
      "utf8",
    );
    expect(companion).toContain('data-tt-admin-recent-visit-touch="hu442"');
    expect(companion).not.toContain("!min-h-[36px]");
  });
});

describe("Batch-12 W05 · HU-443 shell brand wordmark (①)", () => {
  it("HU-443 · shell bar wires TravelTrust wordmark", () => {
    expect(TT_ADMIN_SHELL_BRAND_WORDMARK_MARK).toBe("tt_admin_shell_brand_wordmark_hu443");
    const bar = readFileSync(resolve(fe, "components/admin/AdminShellBar.tsx"), "utf8");
    expect(bar).toContain("HU-443");
    expect(bar).toContain('data-tt-admin-shell-brand="hu443"');
    expect(bar).toContain("TT_ADMIN_SHELL_BRAND_WORDMARK_MARK");
    expect(zh[ADMIN_SHELL_BRAND_WORDMARK_KEY as keyof typeof zh]).toBe("TravelTrust");
    expect(en[ADMIN_SHELL_BRAND_WORDMARK_KEY as keyof typeof en]).toBe("TravelTrust");
  });
});

describe("Batch-12 W05 · HU-444 focus companion todo-only (①)", () => {
  it("HU-444 · companion drops domain health; overview keeps strip", () => {
    expect(TT_ADMIN_HOME_FOCUS_COMPANION_TODO_ONLY_MARK).toBe(
      "tt_admin_home_focus_companion_todo_only_hu444",
    );
    const companion = readFileSync(
      resolve(fe, "components/admin/AdminHomeFocusCompanion.tsx"),
      "utf8",
    );
    expect(companion).toContain("HU-444");
    expect(companion).toContain('data-tt-admin-home-focus-companion-todo-only="hu444"');
    expect(companion).not.toContain("buildAdminHomeDomainHealth");
    expect(companion).not.toContain("data-tt-admin-home-focus-companion-health");
    const overview = readFileSync(
      resolve(fe, "components/admin/AdminHomeSystemOverview.tsx"),
      "utf8",
    );
    expect(overview).toContain("AdminHomeDomainHealthStrip");
  });
});

describe("Batch-12 W05 · HU-447 SuperAdmin SOP (①)", () => {
  it("HU-447 · SOP href + overview + permissions wire", () => {
    expect(TT_ADMIN_HOME_SUPERADMIN_SOP_MARK).toBe("tt_admin_home_superadmin_sop_hu447");
    expect(ADMIN_SUPERADMIN_PRIVILEGE_SOP_HREF).toBe(
      "/admin/permissions#admin-superadmin-weekly-review",
    );
    expect(ADMIN_SUPERADMIN_PRIVILEGE_SOP_HREF).not.toMatch(/role=SuperAdmin/);
    const overview = readFileSync(
      resolve(fe, "components/admin/AdminHomeSystemOverview.tsx"),
      "utf8",
    );
    expect(overview).toContain('data-tt-admin-home-superadmin-sop="hu447"');
    const perms = readFileSync(
      resolve(fe, "app/admin/permissions/AdminPermissionsPageMain.tsx"),
      "utf8",
    );
    expect(perms).toContain('id="admin-superadmin-weekly-review"');
    expect(zh.admin_home_superadmin_sop_link).toMatch(/周检|复核/);
    expect(en.admin_home_superadmin_sop_link.toLowerCase()).toMatch(/weekly|checklist/);
  });
});

describe("Batch-12 W05 · HU-462 admin_home i18n symmetry (①)", () => {
  it("HU-462 · required keys both sides; dead chain keys removed", () => {
    expect(TT_ADMIN_HOME_I18N_KEY_SYMMETRY_MARK).toBe("tt_admin_home_i18n_key_symmetry_hu462");
    for (const key of ADMIN_HOME_I18N_SYMMETRY_REQUIRED_KEYS) {
      expect(zh[key as keyof typeof zh]).toBeTruthy();
      expect(en[key as keyof typeof en]).toBeTruthy();
    }
    for (const key of ADMIN_HOME_I18N_DEAD_KEYS_REMOVED) {
      expect(zh).not.toHaveProperty(key);
      expect(en).not.toHaveProperty(key);
    }
  });
});

describe("Batch-12 W05 · HU-463 soft revalidate (①)", () => {
  it("HU-463 · helper + hooks + home needle", () => {
    expect(TT_ADMIN_HOME_SOFT_REVALIDATE_MARK).toBe("tt_admin_home_soft_revalidate_hu463");
    expect(ADMIN_HOME_SOFT_REVALIDATE_TTL_MS).toBe(75_000);
    expect(adminHomeSoftRevalidateShouldReload(null, 1)).toBe(true);
    expect(adminHomeSoftRevalidateShouldReload(0, 74_999)).toBe(false);
    for (const rel of [
      "lib/admin/useAdminHomeKpi.ts",
      "lib/admin/useAdminHomeInbox.ts",
      "lib/admin/useAdminHomeSystemOverview.ts",
    ]) {
      const src = readFileSync(resolve(fe, rel), "utf8");
      expect(src).toContain("useAdminHomeSoftRevalidate");
      expect(src).toContain("HU-463");
    }
    const home = readFileSync(resolve(fe, "components/admin/AdminHomeClient.tsx"), "utf8");
    expect(home).toContain('data-tt-admin-home-soft-revalidate="hu463"');
  });
});
