"use client";

import React, { useEffect, useState } from "react";
import { LucideIcon } from "lucide-react";
import { useFranchisesByVendorId } from "@/api/franchise";
import { useLeadStats } from "@/hooks/useLeadStats";
import { useActivityStatusCounts } from "@/hooks/useActivityStatus";
import { useAppSelector } from "@/redux/store";
import { Badge } from "./ui/badge";
import { usePathname, useSearchParams } from "next/navigation";
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
  | "total_lead_pool"
  | "total_open_leads"
  | "total_draft_leads"
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
  | "total_servicing_stage_leads"
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
  | "total_lead_pool"
  | "total_open_leads"
  | "total_draft_leads"
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
  | "total_servicing_stage_leads"
  | "total_leads_group"
  | "total_project_group"
  | "total_production_group"
  | "total_installation_group"
  | "total_my_tasks";
  items?: NavSubItem[];
}

// --------------- HELPERS ------------------

function isUrlActive(
  pathname: string,
  searchParams: URLSearchParams,
  url: string,
): boolean {
  const [urlPath, urlQuery] = url.split("?");
  if (!pathname.startsWith(urlPath)) return false;
  if (!urlQuery) {
    const tabParam = searchParams.get("tab");
    return !tabParam || tabParam === "open";
  }
  const urlParams = new URLSearchParams(urlQuery);
  for (const [key, value] of urlParams.entries()) {
    if (searchParams.get(key) !== value) return false;
  }
  return true;
}

function findGroupForPath(
  items: NavItem[],
  pathname: string,
  searchParams: URLSearchParams,
): string | null {
  for (const item of items) {
    if (item.items && item.items.length > 0) {
      const hasActiveChild = item.items.some((sub) =>
        isUrlActive(pathname, searchParams, sub.url),
      );
      if (hasActiveChild) return item.title;
    }
  }
  return null;
}

export function NavMain({
  items,
  trackTraceItems,
  inventoryItems,
  mastersItems,
  inventoryMasterItems
}: {
  items: NavItem[];
  trackTraceItems?: NavItem[];
  inventoryItems?: NavItem[];
  mastersItems?: NavItem[];
  inventoryMasterItems?: NavItem[];
}) {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const handlesLargeScaleProjects = useAppSelector(
    (state) => state.auth.user?.vendor?.handlesLargeScaleProjects === true,
  );
  const isCrmEnabled = useAppSelector(
    (state) => state.auth.user?.vendor?.is_crm_enabled !== false,
  );
  const isOnlineLeadFeatureEnabled = useAppSelector(
    (state) => state.auth.user?.vendor?.is_online_lead_feature_enabled === true,
  );
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type?.user_type as string | undefined,
  );
  const normalizedUserType = userType?.toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-");
  const franchiseId =
    useAppSelector((state) => state.auth.franchise_id) ??
    useAppSelector((state) => state.auth.user?.franchise_id) ??
    undefined;
  const isAdminUser =
    normalizedUserType === "admin" || normalizedUserType === "super-admin";
  const isSuperAdmin = normalizedUserType === "super-admin";
  const shouldResolveMyTaskFranchiseFromVendor = [
    "admin",
    "super-admin",
    "head-site-supervisor",
    "site-supervisor",
    "backend",
    "preprod",
    "pre-prod",
    "factory",
  ].includes(normalizedUserType ?? "");
  const { data: leadStats, isLoading } = useLeadStats(
    vendorId,
    userId,
    franchiseId
  );
  const isFilterByUser =
    normalizedUserType === "sales-executive" ||
    normalizedUserType === "telecaller" ||
    normalizedUserType === "telecaller-team-lead" ||
    normalizedUserType === "telecaller team lead";

  const { data: activityStatusCounts, isLoading: isActivityStatusCountsLoading } =
    useActivityStatusCounts(
      vendorId,
      franchiseId,
      isFilterByUser ? userId : undefined,
    );
  const { data: vendorFranchises = [], isLoading: isFranchisesLoading } =
    useFranchisesByVendorId(
      vendorId ?? 0,
      !!vendorId &&
      (shouldResolveMyTaskFranchiseFromVendor ||
        (!franchiseId && isAdminUser)),
    );
  const myTaskFranchiseId = React.useMemo(() => {
    if (!shouldResolveMyTaskFranchiseFromVendor && franchiseId) {
      return franchiseId;
    }

    if (franchiseId) {
      return franchiseId;
    }

    if (isSuperAdmin) {
      return (
        vendorFranchises.find((franchise) => franchise.is_head_office === true)
          ?.id ??
        vendorFranchises[0]?.id
      );
    }

    return vendorFranchises[0]?.id;
  }, [
    franchiseId,
    isSuperAdmin,
    shouldResolveMyTaskFranchiseFromVendor,
    vendorFranchises,
  ]);
  const { isMobile, setOpenMobile } = useSidebar();
  const { data: franchisesForB2b = [] } = useFranchisesByVendorId(
    vendorId ?? 0,
    !!vendorId,
  );
  const isActiveFranchiseB2b = React.useMemo(() => {
    const activeFranchise = franchisesForB2b.find(
      (franchise) => franchise.id === franchiseId,
    );
    return activeFranchise?.moduled_for_b2b ?? false;
  }, [franchisesForB2b, franchiseId]);
  const enhancedMastersItems = React.useMemo(() => {
    if (!mastersItems?.length) return mastersItems ?? [];
    if (!handlesLargeScaleProjects && !isActiveFranchiseB2b) return mastersItems;

    return mastersItems.map((section) => {
      if (!section.items?.length) return section;

      const userMasterIndex = section.items.findIndex(
        (item) => item.title === "User Master",
      );

      if (userMasterIndex === -1) return section;

      let nextItems = section.items;
      let changed = false;

      if (handlesLargeScaleProjects) {
        if (!nextItems.some((item) => item.title === "BOQ Master")) {
          nextItems = [...nextItems];
          nextItems.splice(userMasterIndex + 1, 0, {
            title: "BOQ Master",
            url: "/dashboard/masters-management/boq-items-master",
          });
          changed = true;
        }

        if (!nextItems.some((item) => item.title === "Specs Master")) {
          const boqMasterIndex = nextItems.findIndex(
            (item) => item.title === "BOQ Master",
          );
          nextItems = [...nextItems];
          nextItems.splice(boqMasterIndex + 1, 0, {
            title: "Specs Master",
            url: "/dashboard/masters-management/specs-master",
          });
          changed = true;
        }
      }

      if (
        isActiveFranchiseB2b &&
        !nextItems.some((item) => item.title === "Client Master")
      ) {
        const specsMasterIndex = nextItems.findIndex(
          (item) => item.title === "Specs Master",
        );
        const insertAt =
          specsMasterIndex !== -1 ? specsMasterIndex + 1 : userMasterIndex + 1;
        nextItems = [...nextItems];
        nextItems.splice(insertAt, 0, {
          title: "Client Master",
          url: "/dashboard/masters-management/client-master",
        });
        changed = true;
      }

      if (!isActiveFranchiseB2b && nextItems.some((item) => item.title === "Client Master")) {
        nextItems = nextItems.filter((item) => item.title !== "Client Master");
        changed = true;
      }

      if (!changed) return section;

      return {
        ...section,
        items: nextItems,
      };
    });
  }, [handlesLargeScaleProjects, mastersItems, isActiveFranchiseB2b]);

  const enhancedNavItems = React.useMemo(() => {
    if (!handlesLargeScaleProjects) return items;

    return items.map((item) => {
      if (item.title !== "Leads" || !item.items?.length) return item;
      if (item.items.some((sub) => sub.title === "OnHold Leads")) return item;

      const openLeadsIndex = item.items.findIndex(
        (sub) => sub.title === "Open Leads",
      );
      if (openLeadsIndex === -1) return item;

      const nextItems = [...item.items];
      nextItems.splice(
        openLeadsIndex + 1,
        0,
        {
          title: "OnHold Leads",
          url: "/dashboard/leads/leadstable?tab=onHold",
          customCount: activityStatusCounts?.onHold ?? 0,
          customCountLoading: isActivityStatusCountsLoading,
        },
        {
          title: "Lost Approvals",
          url: "/dashboard/leads/leadstable?tab=lostApproval",
          customCount: activityStatusCounts?.lostApproval ?? 0,
          customCountLoading: isActivityStatusCountsLoading,
        },
        {
          title: "Lost Leads",
          url: "/dashboard/leads/leadstable?tab=lost",
          customCount: activityStatusCounts?.lost ?? 0,
          customCountLoading: isActivityStatusCountsLoading,
        },
      );

      return { ...item, items: nextItems };
    });
  }, [
    items,
    handlesLargeScaleProjects,
    activityStatusCounts,
    isActivityStatusCountsLoading,
  ]);

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const allItems = [
    ...enhancedNavItems,
    ...(trackTraceItems ?? []),
    ...(inventoryItems ?? []),
    ...(enhancedMastersItems ?? []),
    ...(inventoryMasterItems ?? [])
  ];

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    const activeGroup = findGroupForPath(allItems, pathname, searchParams);
    if (activeGroup) {
      initial.add(activeGroup);
    } else {
      initial.add("Leads");
    }
    return initial;
  });

  useEffect(() => {
    const activeGroup = findGroupForPath(allItems, pathname, searchParams);
    if (!activeGroup) return;
    setOpenGroups((prev) => {
      if (prev.has(activeGroup)) return prev;
      const next = new Set(prev);
      next.add(activeGroup);
      return next;
    });
  }, [allItems, pathname, searchParams]);

  const getCountForItem = (showCount?: string) => {
    if (!leadStats?.data || !showCount) return undefined;
    const data = leadStats.data;
    return data[showCount as keyof typeof data];
  };

  const getSingleItemCount = (item: NavItem) => {
    if (item.title === "My Task") {
      return getCountForItem(item.showCount);
    }
    return item.customCount ?? getCountForItem(item.showCount);
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
    const isSingleActive =
      isSingle && isUrlActive(pathname, searchParams, item.url ?? "");

    if (!isSingle) {
      const isOpen = openGroups.has(item.title);
      const isGroupActive = item.items!.some((sub) =>
        isUrlActive(pathname, searchParams, sub.url)
      );

      return (
        <SidebarMenuItem key={item.title} id={`nav-item-${item.title.replace(/\s+/g, '-')}`}>
          <Collapsible
            asChild
            open={isOpen}
            onOpenChange={(isNowOpen) => {
              setOpenGroups((prev) => {
                const next = new Set(prev);
                isNowOpen ? next.add(item.title) : next.delete(item.title);
                return next;
              });

              if (isNowOpen) {
                setTimeout(() => {
                  const element = document.getElementById(`nav-item-${item.title.replace(/\s+/g, '-')}`);
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "nearest" });
                  }
                }, 250); // Delay to allow the expand animation to start/finish
              }
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
                    <span className="whitespace-nowrap">{item.title}</span>
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
                    const isSubActive = isUrlActive(
                      pathname,
                      searchParams,
                      subItem.url,
                    );
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
                            <span className="whitespace-nowrap">{subItem.title}</span>
                            {(() => {
                              const hasShowCount = !!subItem.showCount;
                              const hasCustomCount =
                                subItem.customCount !== undefined;
                              if (!hasShowCount && !hasCustomCount) return null;
                              const count = hasCustomCount
                                ? subItem.customCount
                                : getCountForItem(subItem.showCount!);
                              if (!count) return null;
                              if (isOnlineLeadFeatureEnabled && (count === 0 || Number(count) === 0)) return null;
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
            <span className="whitespace-nowrap">{item.title}</span>
            {(() => {
              if (!item.showCount && item.customCount === undefined) return null;
              const count = getSingleItemCount(item);
              if (count === undefined || count === null) return null;
              if (isOnlineLeadFeatureEnabled && (count === 0 || Number(count) === 0)) return null;
              return (
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
                    : count}
                </Badge>
              );
            })()}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <>
      {/* ── CRM Platform Group ── */}
      {isCrmEnabled && enhancedNavItems.length > 0 && (
        <SidebarGroup>
          <SidebarGroupLabel>CRM Platform</SidebarGroupLabel>
          <SidebarMenu>{enhancedNavItems.map((item) => renderItem(item))}</SidebarMenu>
        </SidebarGroup>
      )}

      {/* ── Track & Trace Group — sirf jab trackTraceItems ho ── */}
      {trackTraceItems && trackTraceItems.length > 0 && (
        <SidebarGroup>
          <SidebarGroupLabel>Track &amp; Trace</SidebarGroupLabel>
          <SidebarMenu>
            {trackTraceItems.map((item) => renderItem(item))}
          </SidebarMenu>
        </SidebarGroup>
      )}

      {((inventoryItems?.length ?? 0) > 0 ||
        (inventoryMasterItems?.length ?? 0) > 0) && (
          <SidebarGroup>
            <SidebarGroupLabel>Inventory Management</SidebarGroupLabel>

            <SidebarMenu>
              {inventoryItems?.map((item) => renderItem(item))}

              {/* Displays Master below Inventory */}
              {inventoryMasterItems?.map((item) => renderItem(item))}
            </SidebarMenu>
          </SidebarGroup>
        )}

      {enhancedMastersItems && enhancedMastersItems.length > 0 && (
        <SidebarGroup>
          <SidebarGroupLabel>Masters Management</SidebarGroupLabel>
          <SidebarMenu>
            {enhancedMastersItems.map((item) => renderItem(item))}
          </SidebarMenu>
        </SidebarGroup>
      )}




    </>
  );
}
