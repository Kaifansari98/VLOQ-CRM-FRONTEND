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
import { isAction } from "@reduxjs/toolkit";

// Updated navigation data with showCount properties
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
      title: "My Task",
      url: "/dashboard/my-tasks",
      icon: CalendarCheck2,
      isActive: false,
      showCount: "total_my_tasks" as const,
    },
    {
      title: "Leads",
      url: "/",
      icon: BookOpenCheck,
      isActive: true,
      items: [
        // {
        //   title: "Dashboard",
        //   url: "/dashboard/sales-executive",
        // },
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
      isActive: true,
      items: [
        {
          title: "Final Measurement",
          url: "/dashboard/project/final-measurement",
          showCount: "total_final_measurement_leads" as const, // ✅ added
        },
        {
          title: "Client Documents",
          url: "/dashboard/project/client-documentation",
          showCount: "total_client_documentation_leads" as const, // ✅ added
        },
        {
          title: "Client Approval",
          url: "/dashboard/project/client-approval",
          showCount: "total_client_approval_leads" as const, // ✅ added
        },
      ],
    },
    {
      title: "Production",
      url: "#",
      icon: BookOpen,
      isActive: true,
      items: [
        {
          title: "Tech Check",
          url: "/dashboard/production/tech-check",
          showCount: "total_tech_check_leads" as const,
        },
        {
          title: "Order Login",
          url: "/dashboard/production/order-login",
          showCount: "total_order_login_leads" as const, // ✅ added
        },
        {
          title: "Production",
          url: "/dashboard/production/pre-post-prod",
          showCount: "total_production_stage_leads" as const, // ✅ Added
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
      isActive: true,
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
  // projects: [
  //   // {
  //   //   name: "Design Engineering",
  //   //   url: "#",
  //   //   icon: Frame,
  //   // },
  //   // {
  //   //   name: "Sales & Marketing",
  //   //   url: "#",
  //   //   icon: PieChart,
  //   // },
  //   // {
  //   //   name: "Travel",
  //   //   url: "#",
  //   //   icon: Map,
  //   // },
  // ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useAppSelector((state) => state.auth.user);

  const userData = user
    ? {
        name: user?.user_name || "username",
        avatar: "/avatars/shadcn.jpg",
        email: user?.user_email || "N/A",
      }
    : data.user;

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
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
