"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { GenerateLeadFormModal } from "@/components/sales-executive/Lead/leads-generation-form-modal";
import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@/redux/store";
import { canCreateLead } from "@/components/utils/privileges";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useActivityStatusCounts } from "@/hooks/useActivityStatus";
import ViewOpenLeadTable from "@/app/_components/view-leads-table";
import PendingLeadsTable from "../../../_components/pending-leads-table";
import { useUniversalStageLeadsPost } from "@/api/universalstage";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
type LeadTab = "open" | "onHold" | "lostApproval" | "lost";

interface TabItem {
  value: LeadTab;
  label: string;
  count?: number;
  dotColor?: string;
}

export default function LeadsGenerationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const franchiseId = useAppSelector(
    (state) => state.auth.franchise_id ?? state.auth.user?.franchise_id,
  );
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type as string | undefined,
  );
  const userId = useAppSelector((state) => state.auth.user?.id);
  const customPrivilegeCodes = useAppSelector(
    (state) => state.customPrivileges.codes,
  );

  const [openCreateLead, setOpenCreateLead] = useState(false);

  // Utility
  const isPrivilegedUser = (userType?: string) =>
    userType === "admin" || userType === "super-admin";

  const privileged = isPrivilegedUser(userType);
  const normalizedUserType = userType?.trim().toLowerCase();
  const canShowOnHoldTab =
    normalizedUserType === "custom"
      ? customPrivilegeCodes.includes(
          "leads.open_leads.details_of_lead.mark_on_hold",
        )
      : true;
  const canShowLostTabs =
    normalizedUserType === "custom"
      ? customPrivilegeCodes.includes(
          "leads.open_leads.details_of_lead.mark_as_lost",
        )
      : privileged;
  const canShowAddNewLeadButton =
    normalizedUserType === "custom"
      ? customPrivilegeCodes.includes(
          "leads.open_leads.details_of_lead.add_lead",
        )
      : canCreateLead(userType);

  // --- Read tab from URL initially ---
  const initialTab = useMemo<LeadTab>(() => {
    const urlParam = searchParams.get("tab") as LeadTab | null;
    if (!canShowLostTabs && (urlParam === "lost" || urlParam === "lostApproval")) {
      return "open"; // restrict access
    }
    if (!canShowOnHoldTab && urlParam === "onHold") {
      return "open"; // restrict access
    }
    return urlParam || "open";
  }, [searchParams, canShowLostTabs, canShowOnHoldTab]);

  const [tab, setTab] = useState<LeadTab>(initialTab);

  // Sync tab state with URL when privilege changes or URL changes
  useEffect(() => {
    if (
      ((!canShowLostTabs &&
        (initialTab === "lostApproval" || initialTab === "lost")) ||
        (!canShowOnHoldTab && initialTab === "onHold"))
    ) {
      handleTabChange("open");
      return;
    }
    setTab(initialTab);
  }, [initialTab, canShowLostTabs, canShowOnHoldTab]);

  // Handle tab changes + update URL
  const handleTabChange = (newTab: LeadTab) => {
    setTab(newTab);
    router.push(`?tab=${newTab}`, { scroll: false });
  };
  const [openPopover, setOpenPopover] = useState(false);

  const { data: counts } = useActivityStatusCounts(vendorId, franchiseId);
  const customOpenTabPayload = useMemo(
    () => ({
      userId: userId ?? 0,
      franchise_id: franchiseId ?? undefined,
      tag: "Type 1",
      page: 1,
      limit: 1,
      filter_name: "",
      filter_lead_code: "",
      contact: "",
      alt_contact_no: "",
      email: "",
      site_address: "",
      archetech_name: "",
      designer_remark: "",
      furniture_type: [],
      furniture_structure: [],
      site_type: [],
      source: [],
      assign_to: [],
      priority: [],
      site_map_link: null,
      created_at: "desc" as const,
      global_search: "",
    }),
    [franchiseId, userId],
  );
  const { data: customOpenTableData } = useUniversalStageLeadsPost(
    vendorId!,
    customOpenTabPayload,
  );
  const openLeadsCountForTab =
    normalizedUserType === "custom"
      ? (customOpenTableData?.count ?? 0)
      : (counts?.open ?? 0);

  const tabItems: TabItem[] = [
    {
      value: "open",
      label: "Open",
      count: openLeadsCountForTab,
      dotColor: "#3b82f6",
    },
    ...(canShowOnHoldTab
      ? [
          {
            value: "onHold" as LeadTab,
            label: "On Hold",
            count: counts?.onHold ?? 0,
            dotColor: "#facc15",
          },
        ]
      : []),
  ];

  if (canShowLostTabs) {
    tabItems.push(
      {
        value: "lostApproval",
        label: "Lost Approval",
        count: counts?.lostApproval ?? 0,
        dotColor: "#22c55e",
      },
      {
        value: "lost",
        label: "Lost",
        count: counts?.lost ?? 0,
        dotColor: "#ef4444",
      },
    );
  }
  if (
    (!canShowLostTabs && (tab === "lostApproval" || tab === "lost")) ||
    (!canShowOnHoldTab && tab === "onHold")
  ) {
    setTab("open");
  }

  const tabInfo: Record<LeadTab, { title: string; description: string }> = {
    open: {
      title: "Open Leads",
      description: "Fresh leads that have not yet been processed or contacted.",
    },
    onHold: {
      title: "On Hold Leads",
      description: "Leads requiring follow-up or waiting for client response.",
    },
    lostApproval: {
      title: "Lost Approval Leads",
      description: "Leads rejected during approval workflow.",
    },
    lost: {
      title: "Lost Leads",
      description: "Leads permanently marked as lost or non-convertible.",
    },
  };

  const activeItem = tabItems.find((t) => t.value === tab);
  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        {/* Left side - SidebarTrigger + Breadcrumb */}
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb className="hidden md:block">
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Leads</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{tabInfo[tab].title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-2 items-center">
            <div className="hidden md:flex items-center gap-2">
              {tabItems.map((item) => (
                <button
                  key={item.value}
                  onClick={() => handleTabChange(item.value)}
                  className={clsx(
                    "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition",
                    "hover:bg-muted",
                    item.value === tab
                      ? "bg-muted font-semibold"
                      : "text-muted-foreground",
                  )}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.dotColor }}
                  />
                  <span>{item.label}</span>
                  <span className="text-xs opacity-70">{item.count}</span>
                </button>
              ))}
            </div>

            <Popover open={openPopover} onOpenChange={setOpenPopover}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="
        flex items-center gap-2
        max-w-[180px] sm:max-w-none
        truncate md:hidden
      "
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: activeItem?.dotColor }}
                  />

                  {/* Title truncates on mobile */}
                  <span className="truncate">{tabInfo[tab].title}</span>

                  <ChevronDown size={16} className="opacity-70 shrink-0" />
                </Button>
              </PopoverTrigger>

              <PopoverContent
                align="end"
                sideOffset={6}
                className="w-44 sm:w-40 p-1"
              >
                <div className="flex flex-col gap-1">
                  {tabItems.map((item) => (
                    <button
                      key={item.value}
                      onClick={() => {
                        handleTabChange(item.value);
                        setOpenPopover(false);
                      }}
                      className={clsx(
                        "flex justify-between items-center px-3 py-2 rounded-md text-sm hover:bg-muted transition",
                        item.value === tab && "bg-muted font-semibold",
                      )}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: item.dotColor }}
                        />
                        <span className="truncate">{item.label}</span>
                      </span>

                      <span className="opacity-70 shrink-0">{item.count}</span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* ✅ Show only for admin, super-admin, sales-executive */}
            {canShowAddNewLeadButton && (
              <>
                <Button size="sm" onClick={() => setOpenCreateLead(true)}>
                  Add New Lead
                </Button>

                <GenerateLeadFormModal
                  open={openCreateLead}
                  onOpenChange={setOpenCreateLead}
                />
              </>
            )}

            <NotificationBell />
            <AnimatedThemeToggler />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-x-hidden">
        <div className="">
          <div>
            {tab === "open" && <ViewOpenLeadTable />}
            {tab === "onHold" && (
              <PendingLeadsTable
                tab="onHold"
                stageTitle={tabInfo.onHold.title}
                stageDescription={tabInfo.onHold.description}
              />
            )}

            {canShowLostTabs && tab === "lostApproval" && (
              <PendingLeadsTable
                tab="lostApproval"
                stageTitle={tabInfo.lostApproval.title}
                stageDescription={tabInfo.lostApproval.description}
              />
            )}

            {canShowLostTabs && tab === "lost" && (
              <PendingLeadsTable
                tab="lost"
                stageTitle={tabInfo.lost.title}
                stageDescription={tabInfo.lost.description}
              />
            )}
          </div>
        </div>
      </main>
    </>
  );
}
