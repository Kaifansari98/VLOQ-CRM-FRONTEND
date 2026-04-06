"use client";

import React, { useEffect, useState } from "react";
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
  badgeStyle?: React.CSSProperties;
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
  badgeStyle?: React.CSSProperties;
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

function findGroupForPath(items: NavItem[], pathname: string): string | null {
  for (const item of items) {
    if (item.items && item.items.length > 0) {
      const hasActiveChild = item.items.some((sub) =>
        pathname.startsWith(sub.url),
      );
      if (hasActiveChild) return item.title;
    }
  }
  return null;
}

export function NavMain({
  items,
  trackTraceItems,
  mastersItems,
}: {
  items: NavItem[];
  trackTraceItems?: NavItem[];
  mastersItems?: NavItem[];
}) {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const franchiseId =
    useAppSelector((state) => state.auth.franchise_id) ??
    useAppSelector((state) => state.auth.user?.franchise_id) ??
    undefined;
  const { data: leadStats, isLoading } = useLeadStats(
    vendorId,
    userId,
    franchiseId
  );
  const { isMobile, setOpenMobile } = useSidebar();

  const pathname = usePathname();
  const allItems = [...items, ...(trackTraceItems ?? []), ...(mastersItems ?? [])];

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    const activeGroup = findGroupForPath(allItems, pathname);
    if (activeGroup) {
      initial.add(activeGroup);
    } else {
      initial.add("Leads");
    }
    return initial;
  });

  useEffect(() => {
    const activeGroup = findGroupForPath(allItems, pathname);
    if (!activeGroup) return;
    setOpenGroups((prev) => {
      if (prev.has(activeGroup)) return prev;
      const next = new Set(prev);
      next.add(activeGroup);
      return next;
    });
  }, [items, trackTraceItems, pathname]);

  const getCountForItem = (showCount?: string) => {
    if (!leadStats?.data || !showCount) return undefined;
    const data = leadStats.data;
    return data[showCount as keyof typeof data];
  };

  const getGroupCount = (item: NavItem) => {
    if (!item.items || item.items.length === 0) return undefined;
    const hasAnyCount = item.items.some(
      (sub) => sub.showCount || sub.customCount !== undefined
    );
    if (!hasAnyCount) return undefined;
    const total = item.items.reduce((sum, sub) => {
      const count =
        sub.customCount !== undefined
          ? sub.customCount
          : getCountForItem(sub.showCount);
      return sum + (Number(count) || 0);
    }, 0);
    return total > 0 ? total : undefined;
  };

  const handleMobileNavigate = () => {
    if (isMobile) setOpenMobile(false);
  };

  const renderItem = (item: NavItem) => {
    const isSingle = !item.items || item.items.length === 0;
    const isSingleActive = isSingle && pathname.startsWith(item.url ?? "");

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
                isNowOpen ? next.add(item.title) : next.delete(item.title);
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
                      "flex items-center gap-2 w-full transition-all duration-200 text-sidebar-foreground",
                      isGroupActive && "font-semibold rounded-md"
                    )}
                  >
                    {/* ✅ No wrapper div — icon direct child of Link */}
                    {item.icon && <item.icon className="!size-5 shrink-0" />}
                    <span>{item.title}</span>
                    {(() => {
                      if (!item.showCount || isOpen) return null;
                      const count = getGroupCount(item);
                      if (!count) return null;
                      return (
                        <Badge
                          className="ml-auto rounded-full group-data-[collapsible=icon]:hidden"
                          style={{
                            backgroundColor: "var(--theme-badge-bg)",
                            color: "var(--theme-badge-text)",
                          }}
                        >
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
                              "flex items-center justify-between w-full transition-all duration-200 text-sidebar-foreground",
                              isSubActive && "font-bold rounded-md"
                            )}
                          >
                            <span>{subItem.title}</span>
                            {(() => {
                              const hasShowCount = !!subItem.showCount;
                              const hasCustomCount =
                                subItem.customCount !== undefined;
                              if (!hasShowCount && !hasCustomCount) return null;
                              const count = hasCustomCount
                                ? subItem.customCount
                                : getCountForItem(subItem.showCount!);
                              if (!count) return null;
                              return (
                                <Badge
                                  className={cn(
                                    "ml-2 rounded-full",
                                    subItem.badgeClassName
                                  )}
                                  style={
                                    subItem.badgeStyle ?? {
                                      backgroundColor: "var(--theme-badge-bg)",
                                      color: "var(--theme-badge-text)",
                                    }
                                  }
                                >
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

    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild tooltip={item.title}>
          <Link
            href={item.url}
            className={cn(
              "flex items-center gap-2 w-full transition-all duration-200 text-sidebar-foreground",
              isSingleActive && "font-bold bg-sidebar-accent rounded-md",
              item.className
            )}
          >
            {/* ✅ No wrapper div — icon direct child of Link */}
            {item.icon && <item.icon className={cn("!size-5 shrink-0", item.iconClassName)} />}
            <span>{item.title}</span>
            {(item.showCount || item.customCount !== undefined) && (
              <Badge
                className={cn(
                  "ml-auto rounded-full group-data-[collapsible=icon]:hidden",
                  item.badgeClassName
                )}
                style={
                  item.badgeStyle ?? {
                    backgroundColor: "var(--theme-badge-bg)",
                    color: "var(--theme-badge-text)",
                  }
                }
              >
                {isLoading || item.customCountLoading
                  ? "…"
                  : item.customCount ?? getCountForItem(item.showCount!)}
              </Badge>
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <>
      {/* ── CRM Platform Group ── */}
      <SidebarGroup>
        <SidebarGroupLabel>CRM Platform</SidebarGroupLabel>
        <SidebarMenu>{items.map((item) => renderItem(item))}</SidebarMenu>
      </SidebarGroup>

      {/* ── Track & Trace Group — sirf jab trackTraceItems ho ── */}
      {trackTraceItems && trackTraceItems.length > 0 && (
        <SidebarGroup>
          <SidebarGroupLabel>Track &amp; Trace</SidebarGroupLabel>
          <SidebarMenu>
            {trackTraceItems.map((item) => renderItem(item))}
          </SidebarMenu>
        </SidebarGroup>
      )}

      {mastersItems && mastersItems.length > 0 && (
        <SidebarGroup>
          <SidebarGroupLabel>Masters Management</SidebarGroupLabel>
          <SidebarMenu>
            {mastersItems.map((item) => renderItem(item))}
          </SidebarMenu>
        </SidebarGroup>
      )}
    </>
  );
}
