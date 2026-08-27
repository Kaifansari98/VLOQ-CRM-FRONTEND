"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import SmoothTab from "@/components/kokonutui/smooth-tab";
import SiteMastersTable from "@/components/custom/SiteMastersTable";
import SourceMastersTable from "@/components/custom/SourceMastersTable";
import MiscellaneousTypeMastersTable from "@/components/custom/MiscellaneousTypeMastersTable";
import IssueLogTypeMastersTable from "@/components/custom/IssueLogTypeMastersTable";
import MiscellaneousTeamMastersTable from "@/components/custom/MiscellaneousTeamMastersTable";
import InstallerUserMastersTable from "@/components/custom/InstallerUserMastersTable";
import CompanyVendorMastersTable from "@/components/custom/CompanyVendorMastersTable";
import ArchitectureMastersTable from "@/components/custom/ArchitectureMastersTable";
import BroadcastCategoryMastersTable from "@/components/custom/BroadcastCategoryMastersTable";
import SpecsMasterTable from "@/components/custom/SpecsMasterTable";
import * as React from "react";
import { useMemo } from "react";
import ProcessBriefsTable from "@/components/custom/ProcessBriefsTable";
import { useSearchParams } from "next/navigation";
import { useVendorById } from "@/api/vendors";
import { useFranchisesByVendorId } from "@/api/franchise";
import { useAppSelector } from "@/redux/store";

export default function FieldMastersPage() {
  const searchParams = useSearchParams();
  const vendorIdOverride = Number(searchParams.get("vendor_id") || "") || undefined;
  const sessionVendorAllowsLargeScale = useAppSelector(
    (state) => state.auth.user?.vendor?.handlesLargeScaleProjects === true,
  );
  const sessionVendorAllowsBroadcast = useAppSelector(
    (state) => state.auth.user?.vendor?.is_broadcast_enabled === true,
  );
  const isVendorUser = useAppSelector((state) => Boolean(state.auth.user?.vendor_id));
  const sessionVendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const vendorId = vendorIdOverride ?? sessionVendorId;

  const franchiseId = useAppSelector(
    (s) => s.auth.franchise_id ?? s.auth.user?.franchise_id,
  );
  const reduxModuledForB2b = useAppSelector(
    (state) => (state.auth as any)?.moduled_for_b2b ?? (state.auth.user as any)?.moduled_for_b2b ?? false,
  );
  const { data: vendorResponse } = useVendorById(vendorIdOverride);
  const { data: franchisesForB2b = [] } = useFranchisesByVendorId(
    vendorId ?? 0,
    !!vendorId,
  );

  const showArchitectureMaster = vendorIdOverride
    ? vendorResponse?.data?.handlesLargeScaleProjects === true
    : sessionVendorAllowsLargeScale;
  const showBroadcastMaster = vendorIdOverride
    ? (vendorResponse?.data as any)?.is_broadcast_enabled === true
    : sessionVendorAllowsBroadcast;
  const showSpecsMaster = isVendorUser && !vendorIdOverride && !sessionVendorAllowsLargeScale;

  const showProcessBriefMaster = useMemo(() => {
    if (vendorIdOverride && vendorResponse?.data) {
      return (vendorResponse.data as any)?.moduled_for_b2b === true;
    }
    if (franchiseId && franchisesForB2b.length > 0) {
      const activeFranchise = franchisesForB2b.find((f: any) => f.id === franchiseId);
      if (activeFranchise) {
        return activeFranchise.moduled_for_b2b ?? false;
      }
    }
    return reduxModuledForB2b;
  }, [vendorIdOverride, vendorResponse, franchiseId, franchisesForB2b, reduxModuledForB2b]);

  const rawTabItems = [
    {
      id: "site-master",
      title: "Site Master",
      color: "bg-black hover:bg-black",
      cardContent: <SiteMastersTable vendorIdOverride={vendorIdOverride} />,
    },
    {
      id: "source-master",
      title: "Source Master",
      color: "bg-black hover:bg-black",
      cardContent: <SourceMastersTable vendorIdOverride={vendorIdOverride} />,
    },
    {
      id: "miscellaneous-type-master",
      title: "Miscellaneous Type Master",
      color: "bg-black hover:bg-black",
      cardContent: <MiscellaneousTypeMastersTable vendorIdOverride={vendorIdOverride} />,
    },
    {
      id: "issue-log-type-master",
      title: "Issue Log Type Master",
      color: "bg-black hover:bg-black",
      cardContent: <IssueLogTypeMastersTable vendorIdOverride={vendorIdOverride} />,
    },
    {
      id: "miscellaneous-team-master",
      title: "Miscellaneous Team Master",
      color: "bg-black hover:bg-black",
      cardContent: <MiscellaneousTeamMastersTable vendorIdOverride={vendorIdOverride} />,
    },
    {
      id: "installer-master",
      title: "Installer Master",
      color: "bg-black hover:bg-black",
      cardContent: <InstallerUserMastersTable vendorIdOverride={vendorIdOverride} />,
    },
    {
      id: "company-vendor-master",
      title: "Company Vendor Master",
      color: "bg-black hover:bg-black",
      cardContent: <CompanyVendorMastersTable vendorIdOverride={vendorIdOverride} />,
    },
    ...(showProcessBriefMaster
      ? [
          {
            id: "process-brief-master",
            title: "Process Briefs",
            color: "bg-black hover:bg-black",
            cardContent: <ProcessBriefsTable vendorIdOverride={vendorIdOverride} />,
          },
        ]
      : []),
    ...(showSpecsMaster
      ? [
          {
            id: "specs-master",
            title: "Specs Master",
            color: "bg-black hover:bg-black",
            cardContent: <SpecsMasterTable />,
          },
        ]
      : []),
    ...(showBroadcastMaster
      ? [
          {
            id: "broadcast-category-master",
            title: "Broadcast Category Master",
            color: "bg-black hover:bg-black",
            cardContent: <BroadcastCategoryMastersTable vendorIdOverride={vendorIdOverride} />,
          },
        ]
      : []),
    ...(showArchitectureMaster
      ? [
        {
          id: "architecture-master",
          title: "Architect",
          color: "bg-black hover:bg-black",
          cardContent: <ArchitectureMastersTable vendorIdOverride={vendorIdOverride} />,
        },
      ]
      : []),
  ];

  const tabItems = rawTabItems.sort((a, b) => a.title.localeCompare(b.title));
  const requestedTab = searchParams.get("tab");
  const activeTab = tabItems.some((tab) => tab.id === requestedTab)
    ? (requestedTab as string)
    : (tabItems[0]?.id || "site-master");

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbPage>Masters Management</BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Field Masters</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="">
          <h1 className="text-xl font-semibold tracking-tight">
            Field Masters
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage CRM master data from one place. Start with site master
            entries and expand this section with more field masters over time.
          </p>
        </div>

        <SmoothTab
          defaultTabId={activeTab}
          items={tabItems}
          contentHeightClass="min-h-[240px]"
          pinTabsToBottom={false}
          onChange={(tabId) => {
            const params = new URLSearchParams(window.location.search);
            params.set("tab", tabId);
            window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
          }}
        />
      </div>
    </>
  );
}
