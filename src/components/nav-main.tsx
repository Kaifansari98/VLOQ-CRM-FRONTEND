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
import { useEffect } from "react";

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

export function NavMain({
  items,
  openGroups,
  onToggleGroup,
}: {
  items: NavItem[];
  openGroups: string[];
  onToggleGroup: (groupTitle: string) => void;
}) {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const { data: leadStats, isLoading } = useLeadStats(vendorId, userId);

  const pathname = usePathname();

  const getCountForItem = (showCount?: string) => {
    if (!leadStats?.data || !showCount) return undefined;
    return leadStats.data[showCount as keyof typeof leadStats.data];
  };

  useEffect(() => {
    // find which parent group matches the current pathname
    const activeParent = items.find((item) =>
      item.items?.some((sub) => pathname.startsWith(sub.url))
    );

    if (activeParent) {
      // 👉 Only active parent will open
      onToggleGroup(activeParent.title);
    } else {
      // 👉 No active parent? Only then open Leads
      onToggleGroup("Leads");
    }
  }, [pathname]);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>

      <SidebarMenu>
        {items.map((item) => {
          const isParent = item.items && item.items.length > 0;
          const isOpen = openGroups.includes(item.title);
          const isActive = pathname.startsWith(item.url);

          return (
            <SidebarMenuItem key={item.title}>
              {isParent ? (
                <Collapsible
                  asChild
                  open={isOpen}
                  onOpenChange={() => onToggleGroup(item.title)}
                  className="group/collapsible"
                >
                  <div>
                    {/* PARENT BUTTON */}
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton asChild tooltip={item.title}>
                        <div className="flex items-center justify-between w-full cursor-pointer">
                          <div className="flex items-center gap-2">
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                          </div>

                          {/* PARENT COUNT → HIDE WHEN OPEN */}
                          {item.showCount && !isOpen && (
                            <Badge className="rounded-full ml-2">
                              {isLoading
                                ? "…"
                                : getCountForItem(item.showCount) ?? 0}
                            </Badge>
                          )}
                        </div>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>

                    {/* CHILD ITEMS */}
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => {
                          const isSubActive = pathname.startsWith(subItem.url);

                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild>
                                <a
                                  href={subItem.url}
                                  className={cn(
                                    "flex items-center justify-between w-full",
                                    isSubActive && "text-primary font-semibold"
                                  )}
                                >
                                  <span>{subItem.title}</span>

                                  {/* CHILD COUNT ALWAYS VISIBLE IF > 0 */}
                                  {subItem.showCount &&
                                    (getCountForItem(subItem.showCount) ?? 0) >
                                      0 && (
                                      <Badge className="rounded-full ml-2">
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
                // NORMAL MENU ITEM
                <SidebarMenuButton asChild tooltip={item.title}>
                  <a
                    href={item.url}
                    className={cn(
                      "flex items-center justify-between w-full gap-2",
                      isActive &&
                        "font-bold text-primary bg-muted/50 rounded-md"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </div>

                    {item.showCount && (
                      <Badge className="rounded-full ml-2">
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
