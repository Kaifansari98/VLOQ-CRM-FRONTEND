"use client";

import * as React from "react";
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  CalendarCheck2,
  BookOpenCheck,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
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
      icon: CalendarCheck2, // ya koi aur icon chahiye ho
      isActive: false,
      showCount: "total_leads" as const,
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
          url: "/dashboard/sales-executive/leadstable",
          showCount: "total_open_leads" as const,
        },
        {
          title: "Site Measurement",
          url: "/dashboard/sales-executive/initial-site-measurement",
          showCount: "total_initial_site_measurement_leads" as const,
        },
        {
          title: "Designing Stage",
          url: "/dashboard/sales-executive/designing-stage",
          showCount: "total_designing_stage_leads" as const,
        },
        {
          title: "Booking Stage",
          url: "/dashboard/sales-executive/booking-stage",
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
          url: "/dashboard/site-supervisor/final-measurement",
          showCount: "total_final_measurement_leads" as const, // ✅ added
        },
        {
          title: "Client Documentation",
          url: "#",
          showCount: "total_client_documentation_leads" as const, // ✅ added
        },
        {
          title: "Client Approval",
          url: "#",
        },
      ],
    },
    {
      title: "Production",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Tech Check",
          url: "#",
        },
        {
          title: "Order Login",
          url: "#",
        },
        {
          title: "Production",
          url: "#",
        },
        {
          title: "Ready To Dispatch",
          url: "#",
        },
      ],
    },
    {
      title: "Installation",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "Site Readiness",
          url: "#",
        },
        {
          title: "Dispatch",
          url: "#",
        },
        {
          title: "Installation Planning",
          url: "#",
        },
        {
          title: "Under Installation",
          url: "#",
        },
        {
          title: "Final Handover",
          url: "#",
        },
        {
          title: "Servicing",
          url: "#",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
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
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}