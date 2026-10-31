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
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import ProductMasterPage from "@/app/dashboard/inventory/master/products/list/page";
import CompanyVendorMasterPage from "@/app/dashboard/inventory/master/company-vendor/page";
import CategoryMasterPage from "@/app/dashboard/track-trace/master/category/page";
import BrandMasterPage from "@/app/dashboard/track-trace/master/brand/page";
import GradeMasterPage from "@/app/dashboard/track-trace/master/grade/page";
import FinishMasterPage from "@/app/dashboard/track-trace/master/finish/page";
import TypeMasterPage from "@/app/dashboard/track-trace/master/type/page";
import CoreProductMasterPage from "@/app/dashboard/track-trace/master/core-product/page";

// Each master is also a standalone route, so hide its own page header inside the tab.
const MasterTab = ({ children }: { children: ReactNode }) => (
  <div className="[&>header]:hidden [&>*]:min-h-0">{children}</div>
);

const tabs = [
  { id: "products", title: "Products", Page: ProductMasterPage },
  { id: "category", title: "Category", Page: CategoryMasterPage },
  { id: "brand", title: "Brand", Page: BrandMasterPage },
  { id: "grade", title: "Grade", Page: GradeMasterPage },
  { id: "finish", title: "Finish", Page: FinishMasterPage },
  { id: "type", title: "Type", Page: TypeMasterPage },
  { id: "core-product", title: "Core Product", Page: CoreProductMasterPage },
  { id: "company-vendor", title: "Company Vendor", Page: CompanyVendorMasterPage },
];

const tabItems = tabs.map(({ id, title, Page }) => ({
  id,
  title,
  color: "bg-black hover:bg-black",
  cardContent: (
    <MasterTab>
      <Page />
    </MasterTab>
  ),
}));

export default function InventoryMastersPage() {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const activeTab = tabItems.some((tab) => tab.id === requestedTab)
    ? (requestedTab as string)
    : tabItems[0].id;

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
                <BreadcrumbPage>Inventory Masters</BreadcrumbPage>
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
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Inventory Masters
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage inventory master data from one place.
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
