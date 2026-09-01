"use client";

import * as React from "react";
import {
  GalleryVerticalEnd,
  Users,
  LayoutDashboard,
  FolderKanban,
  Monitor,
  ScanBarcode,
  Warehouse,
  FolderCog,
  ClipboardList,
  NotebookPen,
  HardHat,
  Forklift,
  Handshake,
  Drill,
  BarChart3,
  MapPinned,
  Building2,
  Megaphone,
  Magnet,
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
import { useUnreadBroadcastCount } from "@/api/broadcast";
import { useTheme } from "next-themes";
import { sanitize } from "@/components/utils/sanitizeCapitalize";

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
      title: "Broadcast",
      url: "/dashboard/broadcast",
      icon: Megaphone,
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
      title: "Lead Pool",
      url: "/dashboard/lead-pool",
      icon: Magnet,
      showCount: "total_lead_pool" as const,
    },
    {
      title: "Leads",
      url: "#",
      icon: NotebookPen,
      showCount: "total_leads_group" as const,
      items: [
        {
          title: "Draft Lead",
          url: "/dashboard/leads/draft-lead",
          showCount: "total_draft_leads" as const,
        },
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
      title: "Execution",
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
          title: "Installation",
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
      url: "/dashboard/installation/servicing",
      icon: FolderCog,
      showCount: "total_servicing_stage_leads" as const,
    },
  ],
  b2bNavMain: [
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
      title: "Lead Pool",
      url: "/dashboard/online-leads",
      icon: NotebookPen,
      showCount: "total_lead_pool" as const,
    },
    {
      title: "Open Leads",
      url: "/dashboard/leads/leadstable",
      icon: NotebookPen,
      showCount: "total_open_leads" as const,
    },
    {
      title: "Designing Stage",
      url: "/dashboard/leads/designing-stage",
      icon: NotebookPen,
      showCount: "total_designing_stage_leads" as const,
    },
    {
      title: "Booking Stage",
      url: "/dashboard/leads/booking-stage",
      icon: NotebookPen,
      showCount: "total_booking_stage_leads" as const,
    },
    {
      title: "Order Login",
      url: "/dashboard/production/order-login",
      icon: Forklift,
      showCount: "total_order_login_leads" as const,
    },
    {
      title: "Production",
      url: "/dashboard/production/pre-post-prod",
      icon: Forklift,
      showCount: "total_production_stage_leads" as const,
    },
    {
      title: "Dispatch",
      url: "/dashboard/installation/dispatch-stage",
      icon: Drill,
      showCount: "total_dispatch_stage_leads" as const,
    },
  ],
  trackTraceNav: [
    {
      title: "Track Trace",
      url: "#",
      icon: ScanBarcode,
      items: [
        { title: "Dashboard", url: "/dashboard/track-trace" },
        { title: "Real Time", url: "/dashboard/track-trace/dashboard" },
        {
          title: "Projects",
          url: "/dashboard/track-trace/manage-project",
        },
        {
          title: "Defects",
          url: "/dashboard/track-trace/defect",
        },


        // { title: "Configure", url: "/dashboard/track-trace/configure" },
      ],
    },
    {
      title: "Track Trace Master",
      url: "#",
      icon: FolderKanban,
      items: [
        { title: "Workstation", url: "/dashboard/track-trace/master/workstation" },
        { title: "Category", url: "/dashboard/track-trace/master/category" },       
      ],
    },

  ],

  inventoryTraceNav: [
    {
      title: "Procurement",
      url: "#",
      icon: Warehouse,
      items: [
        { title: "Purchase Enquiry", url: "/dashboard/inventory/purchase-intents" },
        { title: "Purchase Order", url: "/dashboard/inventory/purchase-orders" },
        { title: "GRN", url: "/dashboard/inventory/grn" },
        { title: "Payment Requisition", url: "/dashboard/inventory/payment-requisitions" },
      ],
    },
    {
      title: "Material Issue",
      url: "#",
      icon: Forklift,
      items: [
        { title: "Projects", url: "/dashboard/inventory/material-issue/projects" },
        { title: "Freeze Items", url: "/dashboard/inventory/material-issue/freeze-items" },
        { title: "Issued Items", url: "/dashboard/inventory/material-issue/issued-items" },
        { title: "Dispatch", url: "/dashboard/inventory/material-issue/dispatch" },
      ],
    },
  ],
  inventoryMasterNav: [
    {
      title: "Master",
      url: "#",
      icon: FolderKanban,
      items: [
        {
          title: "Products",
          url: "/dashboard/inventory/master/products/list",
        },
        {
          title: "Category",
          url: "/dashboard/track-trace/master/category",
        },
        {
          title: "Brand",
          url: "/dashboard/track-trace/master/brand",
        },
        {
          title: "Grade",
          url: "/dashboard/track-trace/master/grade",
        },
        {
          title: "Finish",
          url: "/dashboard/track-trace/master/finish",
        },
        {
          title: "Type",
          url: "/dashboard/track-trace/master/type",
        },
        {
          title: "Core Product",
          url: "/dashboard/track-trace/master/core-product",
        },
      ],
    },
  ],
  mastersNav: [
    {
      title: "CRM Masters",
      url: "#",
      icon: FolderKanban,
      items: [
        {
          title: "Field Masters",
          url: "/dashboard/masters-management/field-masters",
        },
        {
          title: "User Master",
          url: "/dashboard/masters-management/user-master",
        },
      ],
    },
  ],
  masterAdminNav: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Vendors",
      url: "/dashboard/vendors",
      icon: Building2,
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
  const customPrivilegeCodes = useAppSelector(
    (state) => state.customPrivileges.codes,
  );
  console.log("customPrivilegeCodes in AppSidebar:", customPrivilegeCodes);

  const selectedFranchiseId = useAppSelector(
    (state) => state.auth.franchise_id,
  );
  const userType = user?.user_type?.user_type?.toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-");
  const isCustomUserTypeOnlyVendor =
    user?.vendor?.is_this_vendor_is_custom_usertype_only === true;
  const isCrmEnabled = user?.vendor?.is_crm_enabled !== false;
  const isBroadcastEnabled = user?.vendor?.is_broadcast_enabled === true;
  const isInventoryEnabled = user?.vendor?.is_inventory_enabled === true;
  const isTrackTraceEnabled = user?.vendor?.is_tracktrace_enabled === true;
  const isOnlineLeadFeatureEnabled =
    user?.vendor?.is_online_lead_feature_enabled === true;
  const isScanPackEnabled = user?.vendor?.is_scanpack_enabled === true;
  const handlesLargeScaleProjects =
    user?.vendor?.handlesLargeScaleProjects === true;
  const canSeeOverallLeads =
    userType === "admin" ||
    userType === "super-admin" ||
    userType === "auditor";
  const isSuperAdmin = userType === "super-admin" || userType === "auditor";
  const isMasterAdmin =
    userType === "master-admin" ||
    userType === "master" ||
    userType === "vloq master" ||
    userType === "masteradmin" ||
    userType === "master_admin";
  const shouldBootstrapFranchise =
    userType === "admin" ||
    userType === "super-admin" ||
    userType === "auditor";
  const canSeeMiscLeads =
    userType === "admin" ||
    userType === "super-admin" ||
    userType === "auditor" ||
    userType === "backend" ||
    userType === "factory" ||
    userType === "site-supervisor" ||
    userType === "head-site-supervisor";
  const skipFranchiseFilter =
    userType === "factory" ||
    userType === "site-supervisor" ||
    userType === "head-site-supervisor" ||
    userType === "backend";
  const vendorId = user?.vendor_id;
  const franchiseId = selectedFranchiseId ?? user?.franchise_id ?? null;
  const userId = user?.id;
  const dispatch = useAppDispatch();

  const { data: miscCountData, isLoading: isMiscLeadLoading } =
    usePendingMiscellaneousCount(
      vendorId ?? 0,
      skipFranchiseFilter ? undefined : (franchiseId ?? undefined),
      userType,
      userId,
    );
  const { data: franchises = [] } = useFranchisesByVendorId(
    vendorId ?? 0,
    !!vendorId,
  );

  const isActiveFranchiseB2b = React.useMemo(() => {
    const activeFranchise = franchises.find(
      (franchise) => franchise.id === franchiseId,
    );
    return activeFranchise?.moduled_for_b2b ?? false;
  }, [franchises, franchiseId]);

  React.useEffect(() => {
    if (!shouldBootstrapFranchise) return;
    if (franchiseId) return;
    if (!franchises.length) return;
    dispatch(setFranchiseId(franchises[0].id));
  }, [dispatch, shouldBootstrapFranchise, franchiseId, franchises]);

  const miscLeadsCount = miscCountData?.pending_miscellaneous_leads ?? 0;

  const { unreadCount: unreadBroadcastCount, isLoading: isBroadcastLoading } =
    useUnreadBroadcastCount(userId, vendorId ?? undefined, isSuperAdmin);

  const userData = user
    ? {
      name: user?.user_name || "username",
      avatar: "/avatars/shadcn.jpg",
      email: user?.user_email || "N/A",
    }
    : data.user;

  const { navItems, trackTraceItems, inventoryItems, mastersItems, inventoryMasterItems } = React.useMemo(() => {
    // master-admin only sees Dashboard + Vendors — no CRM pipeline nav
    if (isMasterAdmin) {
      return {
  navItems: data.masterAdminNav,
  trackTraceItems: [],
  inventoryItems: [],
  inventoryMasterItems: [],
  mastersItems: [],
};
    }

      const environment = (
        process.env.NEXT_PUBLIC_ENVIRONMENT ?? "PRODUCTION"
      ).toUpperCase();

      const navMainWithBroadcast = data.navMain.map((item) => {
        if (item.title === "Broadcast") {
          if (isSuperAdmin) {
            return item;
          }
          return {
            ...item,
            customCount: unreadBroadcastCount ?? 0,
            customCountLoading: isBroadcastLoading,
            badgeClassName:
              badgeBg || badgeText
                ? undefined
                : "bg-red-500 text-white font-bold",
            badgeStyle:
              badgeBg || badgeText
                ? { backgroundColor: badgeBg, color: badgeText }
                : undefined,
          };
        }
        return item;
      });

      const withoutOverall = canSeeOverallLeads
        ? navMainWithBroadcast
        : navMainWithBroadcast.filter((item) => item.title !== "Overall Leads");

      const isSalesExecutive =
        userType === "sales-executive" ||
        userType === "sales executive";

      const hideSectionsForRole =
        userType === "site-supervisor" ||
        userType === "tech-check" ||
        userType === "backend" ||
        userType === "factory" ||
        userType === "pre-prod";

    const baseItems = withoutOverall.filter((item) => {
      if (item.title === "Lead Pool") {
        if (hideSectionsForRole || isSalesExecutive) return false;
      }

      if (item.title === "Leads") {
        const hidesLeads =
          hideSectionsForRole || userType === "store-manager";
        if (hidesLeads) return false;
      }

      if (item.title === "Project") {
        const hidesProject =
          userType === "site-supervisor" ||
          userType === "tech-check" ||
          userType === "backend" ||
          userType === "factory" ||
          userType === "pre-prod" ||
          userType === "telecaller" ||
          userType === "telecaller-team-lead" ||
          userType === "store-manager";
        if (hidesProject && userType !== "site-supervisor") return false;
      }

      if (item.title === "Production" || item.title === "Execution" || item.title === "Servicing") {
        const hidesProdExecServ =
          userType === "telecaller" ||
          userType === "telecaller-team-lead";
        if (hidesProdExecServ) return false;
      }

      return true;
    });

    const adminOnlyItems =
      userType === "admin" || userType === "super-admin" || userType === "auditor"
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

    const customFilteredItems =
      userType === "custom"
        ? filteredItems
          .filter(
            (item) =>
              item.title !== "Servicing" ||
              customPrivilegeCodes.some((code) =>
                code.startsWith("installation.servicing."),
              ),
          )
          .map((item) =>
            item.title === "Leads"
              ? {
                ...item,
                items: item.items?.filter((subItem) =>
                  subItem.title === "Open Leads"
                    ? customPrivilegeCodes.includes(
                      "leads.open_leads.details_of_lead.view",
                    )
                    : subItem.title === "ISM Leads"
                      ? customPrivilegeCodes.includes(
                        "leads.ism_leads.ism_details.view",
                      )
                      : subItem.title === "Designing Stage"
                        ? customPrivilegeCodes.includes(
                          "leads.designing_stage.quotation.view",
                        ) ||
                        customPrivilegeCodes.includes(
                          "leads.designing_stage.meetings.view",
                        ) ||
                        customPrivilegeCodes.includes(
                          "leads.designing_stage.designs.view",
                        )
                        : subItem.title === "Booking Done"
                          ? customPrivilegeCodes.some((code) =>
                            code.startsWith("leads.booking_done."),
                          )
                          : true,
                ),
              }
              : item.title === "Project"
                ? {
                  ...item,
                  items: item.items?.filter((subItem) =>
                    subItem.title === "FM Sites"
                      ? customPrivilegeCodes.some((code) =>
                        code.startsWith("project.final_measurement."),
                      )
                      : subItem.title === "Client Documents"
                        ? customPrivilegeCodes.some((code) =>
                          code.startsWith("project.client_documentation."),
                        )
                        : subItem.title === "Client Approval"
                          ? customPrivilegeCodes.some((code) =>
                            code.startsWith("project.client_approval."),
                          )
                          : true,
                  ),
                }
                : item.title === "Production"
                  ? {
                    ...item,
                    items: item.items?.filter((subItem) =>
                      subItem.title === "Tech Check"
                        ? customPrivilegeCodes.includes(
                          "production.tech_check.tech_check_details.view",
                        )
                        : subItem.title === "Order Login"
                          ? customPrivilegeCodes.some((code) =>
                            code.startsWith("production.order_login."),
                          )
                          : subItem.title === "Production"
                            ? customPrivilegeCodes.some((code) =>
                              code.startsWith("production.production."),
                            )
                            : subItem.title === "RTD Sites"
                              ? customPrivilegeCodes.includes(
                                "production.production.ready_to_dispatch.enable_disable",
                              )
                              : true,
                    ),
                  }
                  : item.title === "Execution"
                    ? {
                      ...item,
                      items: item.items?.filter((subItem) =>
                        subItem.title === "Site Readiness"
                          ? customPrivilegeCodes.some((code) =>
                            code.startsWith("installation.site_readiness."),
                          )
                          : subItem.title === "Dispatch Planning"
                            ? customPrivilegeCodes.some((code) =>
                              code.startsWith(
                                "installation.dispatch_planning.",
                              ),
                            )
                            : subItem.title === "Dispatch"
                              ? customPrivilegeCodes.some((code) =>
                                code.startsWith("installation.dispatch."),
                              )
                              : subItem.title === "Installation"
                                ? customPrivilegeCodes.some((code) =>
                                  code.startsWith(
                                    "installation.under_installation.",
                                  ),
                                )
                                : subItem.title === "Final Handover"
                                  ? customPrivilegeCodes.some((code) =>
                                    code.startsWith(
                                      "installation.final_handover.",
                                    ),
                                  )
                                  : true,
                      ),
                    }
                    : item,
          )
        : filteredItems;

      const miscItem = {
        title: "Miscellaneous",
        url: "/dashboard/installation/under-installation/miscellaneous-leads",
        customCount: miscLeadsCount,
        customCountLoading: isMiscLeadLoading,
        badgeClassName:
          badgeBg || badgeText ? undefined : "bg-red-500 text-white",
        badgeStyle:
          badgeBg || badgeText
            ? { backgroundColor: badgeBg, color: badgeText }
            : undefined,
      };

    const finalNavItemsSource = customFilteredItems.map((item) => {
      if (item.title === "Leads" && item.items) {
        const updatedItems = item.items.map((subItem) => {
          if (subItem.title === "Draft Lead" || subItem.title === "Online Lead") {
            return {
              ...subItem,
              title: isOnlineLeadFeatureEnabled ? "Online Lead" : "Draft Lead",
              url: isOnlineLeadFeatureEnabled ? "/dashboard/online-leads" : "/dashboard/leads/draft-lead",
            };
          }
          return subItem;
        });
        return { ...item, items: updatedItems };
      }
      if (item.title === "Execution" && item.items) {
        const underInstallationIndex = item.items.findIndex(
          (subItem) => subItem.title === "Installation",
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

      const initialNavItems = !isCrmEnabled
        ? []
        : isActiveFranchiseB2b
          ? data.b2bNavMain
          : finalNavItemsSource;

      const finalNavItems =
        isBroadcastEnabled && !isMasterAdmin
          ? initialNavItems
          : initialNavItems.filter((item) => item.title !== "Broadcast");

    const finalTrackTraceItems =
      isSuperAdmin && (isTrackTraceEnabled || isScanPackEnabled)
        ? data.trackTraceNav
        : [];

    const finalInventoryItems = isSuperAdmin && isInventoryEnabled
      ? data.inventoryTraceNav
      : [];

    const finalInventoryMasterItems = isSuperAdmin && isInventoryEnabled
      ? data.inventoryMasterNav
      : [];

    const finalMastersItems = isSuperAdmin && isCrmEnabled
      ? data.mastersNav.map((section) => ({
        ...section,
        items:
          environment === "PRODUCTION"
            ? section.items.filter((item) =>
              item.title === "User Master"
                ? isCustomUserTypeOnlyVendor
                : true,
            )
            : section.items,
      }))
      : [];
    const resolvedNavItems = (
      isOnlineLeadFeatureEnabled
        ? finalNavItems
        : finalNavItems.filter((item) => item.title !== "Lead Pool")
    ).filter((item) => !(item.title === "Lead Pool" && isSalesExecutive));

    return {
      navItems: resolvedNavItems,
      trackTraceItems: finalTrackTraceItems,
      inventoryItems: finalInventoryItems,
      mastersItems: finalMastersItems,
      inventoryMasterItems: finalInventoryMasterItems
    };
  }, [
    mounted,
    canSeeOverallLeads,
    isSuperAdmin,
    isMasterAdmin,
    miscLeadsCount,
    isMiscLeadLoading,
    userType,
    isCustomUserTypeOnlyVendor,
    isCrmEnabled,
    isBroadcastEnabled,
    isInventoryEnabled,
    isTrackTraceEnabled,
    isOnlineLeadFeatureEnabled,
    isScanPackEnabled,
    customPrivilegeCodes,
    isActiveFranchiseB2b,
    handlesLargeScaleProjects,
  ]);

  const teams = React.useMemo(() => {
    if (!user) return [];

    // master-admin always sees "Furnix CRM" as the org entry
    if (isMasterAdmin) {
      return [
        {
          id: 0,
          name: "Furnix CRM",
          logo: GalleryVerticalEnd,
          plan: "vloq.info@gmail.com",
        },
      ];
    }

    const activeFranchise = franchises.find(
      (franchise) => franchise.id === franchiseId,
    );
    const userTypeLabel = sanitize(user?.user_type?.user_type || "");

    const fallbackTeam = {
      id: user.franchise_id ?? user.vendor_id,
      name:
        activeFranchise?.franchise_name ||
        user.vendor?.vendor_name ||
        "Default Vendor",
      logo: GalleryVerticalEnd,
      plan: userTypeLabel,
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
      moduledForB2b: franchise.moduled_for_b2b ?? false,
    }));
  }, [user, isMasterAdmin, isSuperAdmin, franchises, franchiseId]);

  const sidebarStyle: React.CSSProperties = {
    ...(sidebarBg &&
      ({
        "--sidebar": sidebarBg,
        "--sidebar-accent": "rgba(255,255,255,0.12)",
      } as React.CSSProperties)),
    ...(sidebarText &&
      ({
        "--sidebar-foreground": sidebarText,
        "--sidebar-accent-foreground": sidebarText,
        "--sidebar-primary-foreground": sidebarText,
      } as React.CSSProperties)),
    ...(badgeBg && ({ "--theme-badge-bg": badgeBg } as React.CSSProperties)),
    ...(badgeText &&
      ({ "--theme-badge-text": badgeText } as React.CSSProperties)),
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
          inventoryItems={inventoryItems}
          mastersItems={mastersItems}
          inventoryMasterItems={inventoryMasterItems}

        />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
