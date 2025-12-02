"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { GenerateLeadFormModal } from "@/components/sales-executive/Lead/leads-generation-form-modal";
import { useState } from "react";
import { useAppSelector } from "@/redux/store";
import { canCreateLead } from "@/components/utils/privileges";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { useActivityStatusCounts } from "@/hooks/useActivityStatus";
import ViewOpenLeadTable from "@/app/_components/view-leads-table";
import PendingLeadsTable from "@/app/dashboard/leads/pending-leads/pending-leads-table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";
type LeadTab = "open" | "onHold" | "lostApproval" | "lost";

interface TabItem {
  value: LeadTab;
  label: string;
  count?: number;
  dotColor?: string;
}

export default function LeadsGenerationPage() {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type as string | undefined
  );

  const [openCreateLead, setOpenCreateLead] = useState(false);
  const [tab, setTab] = useState<LeadTab>("open");
  const [openPopover, setOpenPopover] = useState(false);

  // utils/privileges.ts

  const isPrivilegedUser = (userType?: string) => {
    return userType === "admin" || userType === "super-admin";
  };

  const { data: counts } = useActivityStatusCounts(vendorId);

  const privileged = isPrivilegedUser(userType);

  let tabItems: TabItem[] = [
    {
      value: "open",
      label: "Open",
      count: counts?.open ?? 0,
      dotColor: "#3b82f6",
    },
    {
      value: "onHold",
      label: "On Hold",
      count: counts?.onHold ?? 0,
      dotColor: "#facc15",
    },
  ];

  // Append privileged tabs ONLY for admin / super-admin
  if (privileged) {
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
      }
    );
  }
  // Forcefully prevent non-admin users from seeing restricted tabs
  if (!privileged && (tab === "lostApproval" || tab === "lost")) {
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
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="w-full h-full overflow-x-hidden flex flex-col">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          {/* Left side - SidebarTrigger + Breadcrumb */}
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">Leads</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Open Leads</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-2 items-center">
              <Popover open={openPopover} onOpenChange={setOpenPopover}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: activeItem?.dotColor }}
                    ></span>

                    <span>{tabInfo[tab].title}</span>

                    {/* Icon */}
                    <ChevronDown size={16} className="opacity-70 ml-1" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent align="end" sideOffset={6} className="w-40 p-1">
                  <div className="flex flex-col gap-1">
                    {tabItems.map((item) => (
                      <button
                        key={item.value}
                        onClick={() => {
                          setTab(item.value);
                          setOpenPopover(false);
                        }}
                        className={clsx(
                          "flex justify-between items-center px-3 py-2 rounded-md text-sm hover:bg-muted transition",
                          item.value === tab && "bg-muted font-semibold"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: item.dotColor }}
                          ></span>
                          {item.label}
                        </span>

                        <span className="opacity-70">{item.count}</span>
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              {/* ✅ Show only for admin, super-admin, sales-executive */}
              {canCreateLead(userType) && (
                <>
                  <Button onClick={() => setOpenCreateLead(true)}>
                    Add New Lead
                  </Button>

                  <GenerateLeadFormModal
                    open={openCreateLead}
                    onOpenChange={setOpenCreateLead}
                  />
                </>
              )}

              <AnimatedThemeToggler />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden">
          <div className="py-2">
            <div>
              {tab === "open" && <ViewOpenLeadTable />}
              {tab === "onHold" && (
                <PendingLeadsTable
                  tab="onHold"
                  stageTitle={tabInfo.onHold.title}
                  stageDescription={tabInfo.onHold.description}
                />
              )}

              {privileged && tab === "lostApproval" && (
                <PendingLeadsTable
                  tab="lostApproval"
                  stageTitle={tabInfo.lostApproval.title}
                  stageDescription={tabInfo.lostApproval.description}
                />
              )}

              {privileged && tab === "lost" && (
                <PendingLeadsTable
                  tab="lost"
                  stageTitle={tabInfo.lost.title}
                  stageDescription={tabInfo.lost.description}
                />
              )}
            </div>
          </div>
        </main>

      </SidebarInset>
    </SidebarProvider>
  );
}
