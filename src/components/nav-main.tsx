"use client";

import { LucideIcon } from "lucide-react";
import { useLeadStats } from "@/hooks/useLeadStats";
import { useAppSelector } from "@/redux/store";
import { Badge } from "./ui/badge";
import { usePathname } from "next/navigation";

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
    | "total_tech_check_leads"
    | "total_order_login_leads"
    | "total_production_stage_leads"
    | "total_ready_to_dispatch_leads"
    | "total_site_readiness_stage_leads"
    | "total_dispatch_planning_stage_leads"
    | "total_dispatch_stage_leads"
    | "total_under_installation_stage_leads"
    | "total_final_handover_stage_leads"
    | "total_leads_group"
    | "total_project_group"
    | "total_production_group"
    | "total_installation_group"
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
      | "total_tech_check_leads"
      | "total_order_login_leads"
      | "total_production_stage_leads"
      | "total_ready_to_dispatch_leads"
      | "total_site_readiness_stage_leads"
      | "total_dispatch_planning_stage_leads"
      | "total_dispatch_stage_leads"
      | "total_under_installation_stage_leads"
      | "total_final_handover_stage_leads"
      | "total_leads_group"
      | "total_project_group"
      | "total_production_group"
      | "total_installation_group"
      | "total_my_tasks";
  }[];
}

export function NavMain({ items }: { items: NavItem[] }) {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const { data: leadStats, isLoading } = useLeadStats(vendorId, userId);

  const pathname = usePathname();

  const getCountForItem = (showCount?: string) => {
    if (!leadStats?.data || !showCount) return undefined;
    const data = leadStats.data;
    return data[showCount as keyof typeof data];
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = pathname.startsWith(item.url);

          return (
            <SidebarMenuItem key={item.title}>
              {item.items ? (
                <Collapsible
                  asChild
                  defaultOpen={isActive || item.isActive}
                  className="group/collapsible"
                >
                  <div>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton asChild tooltip={item.title}>
                        <a
                          href={item.url}
                          className={cn(
                            "flex items-center gap-2 w-full justify-between transition-all duration-200",
                            isActive && "font-semibold text-primary rounded-md"
                          )}
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
                        {item.items.map((subItem) => {
                          const isSubActive = pathname.startsWith(subItem.url);

                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild>
                                <a
                                  href={subItem.url}
                                  className={cn(
                                    "flex items-center justify-between w-full transition-all duration-200",
                                    isSubActive &&
                                      "font-bold text-primary rounded-md"
                                  )}
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
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ) : (
                <SidebarMenuButton asChild tooltip={item.title}>
                  <a
                    href={item.url}
                    className={cn(
                      "flex items-center justify-between w-full gap-2 transition-all duration-200",
                      isActive &&
                        "font-bold text-primary bg-muted/50 rounded-md"
                    )}
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
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
