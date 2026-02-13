"use client";

import { useEffect, useState } from "react";
import { LucideIcon } from "lucide-react";
import { useLeadStats } from "@/hooks/useLeadStats";
import { useAppSelector } from "@/redux/store";
import { Badge } from "./ui/badge";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/components/ui/sidebar";

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
import Link from "next/link";

// ----------------- TYPES -----------------

interface NavSubItem {
  title: string;
  url: string;
  customCount?: number;
  customCountLoading?: boolean;
  badgeClassName?: string;
  showCount?:
    | "total_leads"
    | "total_overall_leads"
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
    | "total_project_completed_stage_leads"
    | "total_leads_group"
    | "total_project_group"
    | "total_production_group"
    | "total_installation_group"
    | "total_my_tasks";
}

interface NavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  customCount?: number;
  customCountLoading?: boolean;
  className?: string;
  iconClassName?: string;
  badgeClassName?: string;
  showCount?:
    | "total_leads"
    | "total_overall_leads"
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
    | "total_project_completed_stage_leads"
    | "total_leads_group"
    | "total_project_group"
    | "total_production_group"
    | "total_installation_group"
    | "total_my_tasks";
  items?: NavSubItem[];
}

// --------------- HELPERS ------------------

// find which group contains the current path (for auto-open on refresh)
function findGroupForPath(items: NavItem[], pathname: string): string | null {
  for (const item of items) {
    if (item.items && item.items.length > 0) {
      const hasActiveChild = item.items.some((sub) =>
        pathname.startsWith(sub.url)
      );
      if (hasActiveChild) return item.title;
    }
  }
  return null;
}

export function NavMain({ items }: { items: NavItem[] }) {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const { data: leadStats, isLoading } = useLeadStats(vendorId, userId);
  const { isMobile, setOpenMobile } = useSidebar();

  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>();

    const activeGroup = findGroupForPath(items, pathname);

    if (activeGroup) {
      // If route belongs to a group → only that group open
      initial.add(activeGroup);
    } else {
      // If no group matches → Leads open as default
      initial.add("Leads");
    }

    return initial;
  });

  // When pathname changes (navigation / refresh),
  // automatically open the group for the new route,
  // but DO NOT close any previously opened groups.
  useEffect(() => {
    const activeGroup = findGroupForPath(items, pathname);
    if (!activeGroup) return;

    setOpenGroups((prev) => {
      if (prev.has(activeGroup)) return prev;
      const next = new Set(prev);
      next.add(activeGroup);
      return next;
    });
  }, [items, pathname]);

  const getCountForItem = (showCount?: string) => {
    if (!leadStats?.data || !showCount) return undefined;
    const data = leadStats.data;
    return data[showCount as keyof typeof data];
  };

  const handleMobileNavigate = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isSingle = !item.items || item.items.length === 0;
          const isSingleActive =
            isSingle && pathname.startsWith(item.url ?? "");

          // For grouped items (Leads / Project / Production / Installation)
          if (!isSingle) {
            const isOpen = openGroups.has(item.title);
            const isGroupActive = item.items!.some((sub) =>
              pathname.startsWith(sub.url)
            );

            return (
              <SidebarMenuItem key={item.title}>
                <Collapsible
                  asChild
                  open={isOpen}
                  onOpenChange={(isNowOpen) => {
                    setOpenGroups((prev) => {
                      const next = new Set(prev);
                      if (isNowOpen) {
                        next.add(item.title); // open this group
                      } else {
                        next.delete(item.title); // close this group
                      }
                      return next;
                    });
                  }}
                  className="group/collapsible"
                >
                  <div>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton asChild tooltip={item.title}>
                        <Link
                          href={item.url}
                          className={cn(
                            "flex items-center gap-2 w-full justify-between transition-all duration-200",
                            isGroupActive &&
                              "font-semibold text-primary rounded-md"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                          </div>

                          {(() => {
                            if (!item.showCount || isOpen) return null;

                            const count = getCountForItem(item.showCount);

                            // hide when 0 or undefined
                            if (!count) return null;

                            return (
                              <Badge className="ml-2 rounded-full">
                                {isLoading ? "…" : count}
                              </Badge>
                            );
                          })()}
                        </Link>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items!.map((subItem) => {
                          const isSubActive = pathname.startsWith(subItem.url);

                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild>
                                <Link
                                  href={subItem.url}
                                  onClick={handleMobileNavigate}
                                  className={cn(
                                    "flex items-center justify-between w-full transition-all duration-200",
                                    isSubActive &&
                                      "font-bold text-primary rounded-md"
                                  )}
                                >
                                  <span>{subItem.title}</span>

                                  {(() => {
                                    const hasShowCount = !!subItem.showCount;
                                    const hasCustomCount = subItem.customCount !== undefined;

                                    if (!hasShowCount && !hasCustomCount) return null;

                                    const count = hasCustomCount
                                      ? subItem.customCount
                                      : getCountForItem(subItem.showCount!);

                                    // Hide when 0, undefined, null
                                    if (!count) return null;

                                    return (
                                      <Badge className={cn("ml-2 rounded-full", subItem.badgeClassName)}>
                                        {isLoading || subItem.customCountLoading
                                          ? "…"
                                          : count}
                                      </Badge>
                                    );
                                  })()}
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              </SidebarMenuItem>
            );
          }

          // ---------- SINGLE ITEMS (Dashboard, My Task, etc.) ----------
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title}>
                <Link
                  href={item.url}
                  className={cn(
                    "flex items-center justify-between w-full gap-2 transition-all duration-200",
                    isSingleActive &&
                      "font-bold text-primary bg-muted/50 rounded-md",
                    item.className
                  )}
                >
                  <div className="flex items-center gap-2">
                    {item.icon && <item.icon className={item.iconClassName} />}
                    <span>{item.title}</span>
                  </div>

                  {(item.showCount || item.customCount !== undefined) && (
                    <Badge className={cn("ml-2 rounded-full", item.badgeClassName)}>
                      {isLoading || item.customCountLoading
                        ? "…"
                        : item.customCount ?? getCountForItem(item.showCount!)}
                    </Badge>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
