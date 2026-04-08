"use client";

import * as React from "react";
import {
  GalleryVerticalEnd,
  Users,
  LayoutDashboard,
  Monitor,
  ClipboardList,
  NotebookPen,
  HardHat,
  Forklift,
  Handshake,
  Drill,
  BarChart3,
  MapPinned,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { setFranchiseId } from "@/redux/slices/authSlice";
import { usePendingMiscellaneousCount } from "@/api/installation/useUnderInstallationStageLeads";
import { useFranchisesByVendorId } from "@/api/franchise";
import { useTheme } from "next-themes";

const data = {
  user: {
    name: "Vloq PVT LTD.",
    email: "support@vlog.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "CRM Reports",
      url: "/dashboard/crm-reports",
      icon: BarChart3,
    },
    {
      title: "My Task",
      url: "/dashboard/my-tasks",
      icon: ClipboardList,
      showCount: "total_my_tasks" as const,
    },
    {
      title: "Overall Leads",
      url: "/dashboard/overall-leads",
      icon: Users,
      showCount: "total_overall_leads" as const,
    },
    {
      title: "Delivered Projects",
      url: "/dashboard/delivered-projects",
      icon: Handshake,
      showCount: "total_project_completed_stage_leads" as const,
    },
    {
      title: "Leads",
      url: "#",
      icon: NotebookPen,
      showCount: "total_leads_group" as const,
      items: [
        {
          title: "Open Leads",
          url: "/dashboard/leads/leadstable",
          showCount: "total_open_leads" as const,
        },
        {
          title: "ISM Leads",
          url: "/dashboard/leads/initial-site-measurement",
          showCount: "total_initial_site_measurement_leads" as const,
        },
        {
          title: "Designing Stage",
          url: "/dashboard/leads/designing-stage",
          showCount: "total_designing_stage_leads" as const,
        },
        {
          title: "Booking Done",
          url: "/dashboard/leads/booking-stage",
          showCount: "total_booking_stage_leads" as const,
        },
      ],
    },
    {
      title: "Project",
      url: "#",
      icon: HardHat,
      showCount: "total_project_group" as const,
      items: [
        {
          title: "FM Sites",
          url: "/dashboard/project/final-measurement",
          showCount: "total_final_measurement_leads" as const,
        },
        {
          title: "Client Documents",
          url: "/dashboard/project/client-documentation",
          showCount: "total_client_documentation_leads" as const,
        },
        {
          title: "Client Approval",
          url: "/dashboard/project/client-approval",
          showCount: "total_client_approval_leads" as const,
        },
      ],
    },
    {
      title: "Production",
      url: "#",
      icon: Forklift,
      showCount: "total_production_group" as const,
      items: [
        {
          title: "Tech Check",
          url: "/dashboard/production/tech-check",
          showCount: "total_tech_check_leads" as const,
        },
        {
          title: "Order Login",
          url: "/dashboard/production/order-login",
          showCount: "total_order_login_leads" as const,
        },
        {
          title: "Production",
          url: "/dashboard/production/pre-post-prod",
          showCount: "total_production_stage_leads" as const,
        },
        {
          title: "RTD Sites",
          url: "/dashboard/production/ready-to-dispatch",
          showCount: "total_ready_to_dispatch_leads" as const,
        },
      ],
    },
    {
      title: "Installation",
      url: "#",
      icon: Drill,
      showCount: "total_installation_group" as const,
      items: [
        {
          title: "Site Readiness",
          url: "/dashboard/installation/site-readiness",
          showCount: "total_site_readiness_stage_leads" as const,
        },
        {
          title: "Dispatch Planning",
          url: "/dashboard/installation/dispatch-planning",
          showCount: "total_dispatch_planning_stage_leads" as const,
        },
        {
          title: "Dispatch",
          url: "/dashboard/installation/dispatch-stage",
          showCount: "total_dispatch_stage_leads" as const,
        },
        {
          title: "Under Installation",
          url: "/dashboard/installation/under-installation",
          showCount: "total_under_installation_stage_leads" as const,
        },
        {
          title: "Final Handover",
          url: "/dashboard/installation/final-handover",
          showCount: "total_final_handover_stage_leads" as const,
        },
      ],
    },
    {
      title: "Servicing",
      url: "#",
      icon: Drill,
    },
  ],
  trackTraceNav: [
    {
      title: "Track Trace",
      url: "#",
      icon: Monitor,
      items: [
        { title: "Dashboard", url: "/dashboard/track-trace" },
        {
          title: "Manage Projects",
          url: "/dashboard/track-trace/manage-project",
        },
        
        // { title: "Configure", url: "/dashboard/track-trace/configure" },
      ],
    },
    {
      title: "Master",
      url: "#",
      icon: Monitor,
      items: [{ title: "Workstation", url: "/dashboard/track-trace/master" }],
    },
  ],
  mastersNav: [
    {
      title: "CRM Masters",
      url: "#",
      icon: MapPinned,
      items: [
        {
          title: "Field Masters",
          url: "/dashboard/masters-management/field-masters",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const activeTheme = useAppSelector((state) => state.theme.activeTheme);

  const themeColor = React.useCallback(
    (key: string): string | undefined => {
      if (!activeTheme) return undefined;
      const mapping = activeTheme.mappings.find((m) => m.key === key);
      if (!mapping) return undefined;
      return isDark ? mapping.dark : mapping.light;
    },
    [activeTheme, isDark],
  );

  const sidebarBg = themeColor("sidebar_bg");
  const sidebarText = themeColor("sidebar_text");
  const badgeBg = themeColor("sidebar_badge_bg");
  const badgeText = themeColor("sidebar_badge_text");

  const user = useAppSelector((state) => state.auth.user);
  const selectedFranchiseId = useAppSelector(
    (state) => state.auth.franchise_id,
  );
  const userType = user?.user_type?.user_type?.toLowerCase();
  const canSeeOverallLeads = userType === "admin" || userType === "super-admin";
  const isSuperAdmin = userType === "super-admin";
  const shouldBootstrapFranchise =
    userType === "admin" || userType === "super-admin";
  const canSeeMiscLeads =
    userType === "admin" ||
    userType === "super-admin" ||
    userType === "backend" ||
    userType === "factory" ||
    userType === "site-supervisor";
  const vendorId = user?.vendor_id;
  const franchiseId = selectedFranchiseId ?? user?.franchise_id ?? null;
  const dispatch = useAppDispatch();

  const { data: miscCountData, isLoading: isMiscLeadLoading } =
    usePendingMiscellaneousCount(vendorId ?? 0, franchiseId ?? 0);
  const { data: franchises = [] } = useFranchisesByVendorId(
    vendorId ?? 0,
    !!vendorId,
  );

  React.useEffect(() => {
    if (!shouldBootstrapFranchise) return;
    if (franchiseId) return;
    if (!franchises.length) return;
    dispatch(setFranchiseId(franchises[0].id));
  }, [dispatch, shouldBootstrapFranchise, franchiseId, franchises]);

  const miscLeadsCount = miscCountData?.pending_miscellaneous_leads ?? 0;

  const userData = user
    ? {
        name: user?.user_name || "username",
        avatar: "/avatars/shadcn.jpg",
        email: user?.user_email || "N/A",
      }
    : data.user;

  const { navItems, trackTraceItems, mastersItems } = React.useMemo(() => {
    const environment = (
      process.env.NEXT_PUBLIC_ENVIRONMENT ?? "PRODUCTION"
    ).toUpperCase();
    const showTrackTrace = environment === "STAGING" || "LOCAL";

    const withoutOverall = canSeeOverallLeads
      ? data.navMain
      : data.navMain.filter((item) => item.title !== "Overall Leads");

    const hideSectionsForRole =
      userType === "site-supervisor" ||
      userType === "tech-check" ||
      userType === "backend" ||
      userType === "factory" ||
      userType === "pre-prod";

    const baseItems = hideSectionsForRole
      ? withoutOverall.filter(
          (item) =>
            item.title !== "Leads" &&
            (userType === "site-supervisor" ? true : item.title !== "Project"),
        )
      : withoutOverall;

    const adminOnlyItems =
      userType === "admin" || userType === "super-admin"
        ? baseItems
        : baseItems.filter(
            (item) =>
              item.title !== "Delivered Projects" &&
              item.title !== "CRM Reports",
          );

    const filteredItems =
      userType === "backend" || userType === "factory" || userType === "pre-prod"
        ? adminOnlyItems.map((item) =>
            item.title === "Production"
              ? {
                  ...item,
                  items: item.items?.filter((subItem) =>
                    userType === "backend"
                      ? subItem.title !== "Tech Check"
                      : subItem.title !== "Tech Check" &&
                        subItem.title !== "Order Login",
                  ),
                }
              : item,
          )
        : adminOnlyItems;

    const miscItem = {
      title: "Miscellaneous",
      url: "/dashboard/installation/under-installation/miscellaneous-leads",
      customCount: miscLeadsCount,
      customCountLoading: isMiscLeadLoading,
      badgeClassName: badgeBg || badgeText ? undefined : "bg-red-500 text-white",
      badgeStyle: badgeBg || badgeText
        ? { backgroundColor: badgeBg, color: badgeText }
        : undefined,
    };

    const finalNavItems = filteredItems.map((item) => {
      if (item.title === "Installation" && item.items) {
        const underInstallationIndex = item.items.findIndex(
          (subItem) => subItem.title === "Under Installation",
        );
        if (underInstallationIndex !== -1) {
          const shouldShowMisc = canSeeMiscLeads && miscLeadsCount > 0;
          const updatedItems = shouldShowMisc
            ? [
                ...item.items.slice(0, underInstallationIndex + 1),
                miscItem,
                ...item.items.slice(underInstallationIndex + 1),
              ]
            : item.items;
          return { ...item, items: updatedItems };
        }
      }
      return item;
    });

    // Track & Trace sirf STAGING mein dikhega
    const finalTrackTraceItems = showTrackTrace ? data.trackTraceNav : [];
    const finalMastersItems = isSuperAdmin ? data.mastersNav : [];

    return {
      navItems: finalNavItems,
      trackTraceItems: finalTrackTraceItems,
      mastersItems: finalMastersItems,
    };
  }, [
    mounted,
    canSeeOverallLeads,
    isSuperAdmin,
    miscLeadsCount,
    isMiscLeadLoading,
    userType,
  ]);

  const teams = React.useMemo(() => {
    if (!user) return [];

    const activeFranchise = franchises.find(
      (franchise) => franchise.id === franchiseId,
    );

    const fallbackTeam = {
      id: user.franchise_id ?? user.vendor_id,
      name:
        activeFranchise?.franchise_name ||
        user.vendor?.vendor_name ||
        "Default Vendor",
      logo: GalleryVerticalEnd,
      plan: user?.user_type?.user_type || "",
    };

    if (!isSuperAdmin) {
      return [fallbackTeam];
    }

    if (franchises.length === 0) {
      return [fallbackTeam];
    }

    return franchises.map((franchise) => ({
      id: franchise.id,
      name: franchise.franchise_name,
      logo: GalleryVerticalEnd,
      plan: (franchise.franchise_code ?? user?.user_type?.user_type) || "",
    }));
  }, [user, isSuperAdmin, franchises, franchiseId]);

  const sidebarStyle: React.CSSProperties = {
    ...(sidebarBg && {
      "--sidebar": sidebarBg,
      "--sidebar-accent": "rgba(255,255,255,0.12)",
    } as React.CSSProperties),
    ...(sidebarText && {
      "--sidebar-foreground": sidebarText,
      "--sidebar-accent-foreground": sidebarText,
      "--sidebar-primary-foreground": sidebarText,
    } as React.CSSProperties),
    ...(badgeBg && { "--theme-badge-bg": badgeBg } as React.CSSProperties),
    ...(badgeText && { "--theme-badge-text": badgeText } as React.CSSProperties),
  };

  return (
    <Sidebar collapsible="icon" style={sidebarStyle} {...props}>
      <SidebarHeader>
        {user ? (
          <TeamSwitcher teams={teams} activeTeamId={franchiseId} />
        ) : null}
      </SidebarHeader>

      <SidebarContent>
        <NavMain
          items={navItems}
          trackTraceItems={trackTraceItems}
          mastersItems={mastersItems}
        />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
