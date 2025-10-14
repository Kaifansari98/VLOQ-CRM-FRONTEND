"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import { useLeadStats } from "@/hooks/useLeadStats";
import { CountBadge } from "./count-badge";
import { useAppSelector } from "@/redux/store";
import { Badge } from "./ui/badge";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  showCount?:
    | "total_leads"
    | "total_open_leads"
    | "total_initial_site_measurement_leads"
    | "total_designing_stage_leads"
    | "total_booking_stage_leads"
    | "total_final_measurement_leads"
    | "total_client_documentation_leads"
    | "total_client_approval_leads"
    | "total_my_tasks";
  items?: {
    title: string;
    url: string;
    showCount?:
      | "total_leads"
      | "total_open_leads"
      | "total_initial_site_measurement_leads"
      | "total_designing_stage_leads"
      | "total_booking_stage_leads"
      | "total_final_measurement_leads"
      | "total_client_documentation_leads"
      | "total_client_approval_leads"
      | "total_my_tasks";
  }[];
}

export function NavMain({ items }: { items: NavItem[] }) {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);

  const { data: leadStats, isLoading } = useLeadStats(vendorId, userId);

  const getCountForItem = (showCount?: string) => {
    if (!leadStats?.data || !showCount) return undefined;

    switch (showCount) {
      case "total_leads":
        return leadStats.data.total_leads;
      case "total_open_leads":
        return leadStats.data.total_open_leads;
      case "total_initial_site_measurement_leads":
        return leadStats.data.total_initial_site_measurement_leads;
      case "total_designing_stage_leads":
        return leadStats.data.total_designing_stage_leads;
      case "total_booking_stage_leads":
        return leadStats.data.total_booking_stage_leads;
      case "total_final_measurement_leads":
        return leadStats.data.total_final_measurement_leads;
      case "total_client_documentation_leads":
        return leadStats.data.total_client_documentation_leads;
      case "total_client_approval_leads":
        return leadStats.data.total_client_approval_leads;
      case "total_my_tasks":
        return leadStats.data.total_my_tasks;
      default:
        return undefined;
    }
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            {item.items ? (
              // Agar items hain to Collapsible banao
              <Collapsible
                asChild
                defaultOpen={item.isActive}
                className="group/collapsible"
              >
                <div>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <a
                        href={item.url}
                        className="flex items-center gap-2 w-full justify-between"
                      >
                        <div className="flex items-center gap-2">
                          {item.icon && <item.icon />}
                          <span>{item.title}</span>
                        </div>
                        {item.showCount && (
                          <Badge
                            className={cn(
                              "ml-2 rounded-full",
                              item.showCount === "total_my_tasks" &&
                                "bg-blue-100 text-blue-600"
                            )}
                          >
                            {isLoading
                              ? "…"
                              : getCountForItem(item.showCount) ?? 0}
                          </Badge>
                        )}
                      </a>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <a
                              href={subItem.url}
                              className="flex items-center justify-between w-full"
                            >
                              <span>{subItem.title}</span>
                              {subItem.showCount &&
                                (getCountForItem(subItem.showCount) ?? 0) >
                                  0 && (
                                  <Badge className="ml-2 rounded-full">
                                    {isLoading
                                      ? "…"
                                      : getCountForItem(subItem.showCount)}
                                  </Badge>
                                )}
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ) : (
              // Agar items nahi hain to simple clickable button (with badge support)
              <SidebarMenuButton asChild tooltip={item.title}>
                <a
                  href={item.url}
                  className="flex items-center justify-between w-full gap-2"
                >
                  <div className="flex items-center gap-2">
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </div>

                  {item.showCount && (
                    <Badge
                      className={cn(
                        "ml-2 rounded-full",
                        item.showCount === "total_my_tasks" &&
                          "bg-blue-100 text-blue-600"
                      )}
                    >
                      {isLoading ? "…" : getCountForItem(item.showCount) ?? 0}
                    </Badge>
                  )}
                </a>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
