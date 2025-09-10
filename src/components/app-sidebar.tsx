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
  SquareTerminal,
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
import { useSelector } from "react-redux";
import { RootState, useAppSelector } from "@/redux/store";
import { useEffect, useState } from "react";

// This is sample data.
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
      title: "Leads",
      url: "/",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Dashboard",
          url: "/dashboard/sales-executive",
        },
        {
          title: "View Leads",
          url: "/dashboard/sales-executive/leadstable",
        },
        {
          title: "Initial Site Measurement",
          url: "/dashboard/sales-executive/initial-site-measurement",
        },
        {
          title: "Designing Stage",
          url: "/dashboard/sales-executive/designing-stage",
        },
        {
          title: "Booking Stage",
          url: "/dashboard/sales-executive",
        },
      ],
    },
    {
      title: "Project",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Final Measurement",
          url: "#",
        },
        {
          title: "Client Documentation",
          url: "#",
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
        name: user?.user_name || "username", // show vendor_name first

        avatar: "/avatars/shadcn.jpg", // fallback, can later replace with vendor.logo if needed
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
                plan: user?.user_type?.user_type || ""
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
