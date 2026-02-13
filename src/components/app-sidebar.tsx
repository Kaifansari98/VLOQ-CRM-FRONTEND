// AppSidebar.tsx
"use client";

import * as React from "react";
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  GalleryVerticalEnd,
  Settings2,
  CalendarCheck2,
  BookOpenCheck,
  Users,
  LayoutDashboard,
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
import { useAppSelector } from "@/redux/store";
import { useUnderInstallationLeadsWithMiscellaneous } from "@/hooks/booking-stage/use-booking";

const data = {
  user: {
    name: "Vloq PVT LTD.",
    email: "support@vlog.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Vloq PVT LTD.",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "My Task",
      url: "/dashboard/my-tasks",
      icon: CalendarCheck2,
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
      icon: Users,
      showCount: "total_project_completed_stage_leads" as const,
    },
    {
      title: "Leads",
      url: "#",
      icon: BookOpenCheck,
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
      icon: Bot,
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
      icon: BookOpen,
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
          title: "Ready To Dispatch",
          url: "/dashboard/production/ready-to-dispatch",
          showCount: "total_ready_to_dispatch_leads" as const,
        },
      ],
    },
    {
      title: "Installation",
      url: "#",
      icon: Settings2,
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
        {
          title: "Servicing",
          url: "#",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const user = useAppSelector((state) => state.auth.user);
  const userType = user?.user_type?.user_type?.toLowerCase();
  const canSeeOverallLeads =
    userType === "admin" || userType === "super-admin";
  const canSeeMiscLeads =
    userType === "admin" ||
    userType === "super-admin" ||
    userType === "factory" ||
    userType === "site-supervisor";
  const vendorId = user?.vendor_id;
  const userId = user?.id;

  const miscPayload = React.useMemo(
    () => ({
      userId: canSeeMiscLeads ? userId ?? 0 : 0,
      page: 1,
      limit: 1,
    }),
    [canSeeMiscLeads, userId]
  );

  const { data: miscLeadData, isLoading: isMiscLeadLoading } =
    useUnderInstallationLeadsWithMiscellaneous(
      vendorId ?? 0,
      miscPayload
    );
  const miscLeadsCount = miscLeadData?.count ?? 0;

  const userData = user
    ? {
        name: user?.user_name || "username",
        avatar: "/avatars/shadcn.jpg",
        email: user?.user_email || "N/A",
      }
    : data.user;

  const navItems = React.useMemo(() => {
    const withoutOverall = canSeeOverallLeads
      ? data.navMain
      : data.navMain.filter((item) => item.title !== "Overall Leads");
    const hideSectionsForRole =
      userType === "site-supervisor" ||
      userType === "tech-check" ||
      userType === "backend" ||
      userType === "factory";
    const baseItems = hideSectionsForRole
      ? withoutOverall.filter(
          (item) =>
            item.title !== "Leads" &&
            (userType === "site-supervisor" ? true : item.title !== "Project")
        )
      : withoutOverall;

    const adminOnlyItems =
      userType === "admin" || userType === "super-admin"
        ? baseItems
        : baseItems.filter((item) => item.title !== "Delivered Projects");

    const filteredItems =
      userType === "backend" || userType === "factory"
        ? adminOnlyItems.map((item) =>
            item.title === "Production"
              ? {
                  ...item,
                  items: item.items?.filter((subItem) =>
                    userType === "backend"
                      ? subItem.title !== "Tech Check"
                      : subItem.title !== "Tech Check" &&
                        subItem.title !== "Order Login"
                  ),
                }
              : item
          )
        : adminOnlyItems;

    if (!mounted || !canSeeMiscLeads || miscLeadsCount <= 0) {
      return filteredItems;
    }

    const miscItem = {
      title: "Miscellaneous",
      url: "/dashboard/installation/under-installation/miscellaneous-leads",
      customCount: miscLeadsCount,
      customCountLoading: isMiscLeadLoading,
      badgeClassName: "bg-red-500 text-white",
    };

    return filteredItems.map((item) => {
      if (item.title === "Installation" && item.items) {
        const underInstallationIndex = item.items.findIndex(
          (subItem) => subItem.title === "Under Installation"
        );
        if (underInstallationIndex !== -1) {
          const updatedItems = [
            ...item.items.slice(0, underInstallationIndex + 1),
            miscItem,
            ...item.items.slice(underInstallationIndex + 1),
          ];
          return { ...item, items: updatedItems };
        }
      }
      return item;
    });
  }, [
    canSeeMiscLeads,
    mounted,
    canSeeOverallLeads,
    miscLeadsCount,
    isMiscLeadLoading,
    userType,
  ]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {user ? (
          <TeamSwitcher
            teams={[
              {
                name: user.vendor?.vendor_name || "Default Vendor",
                logo: GalleryVerticalEnd,
                plan: user?.user_type?.user_type || "",
              },
            ]}
          />
        ) : null}
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
