"use client";

import * as React from "react";
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
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useParams } from "next/navigation";
import FranchisesTable from "@/components/custom/FranchisesTable";
import FranchiseFormDialog from "@/components/custom/FranchiseFormDialog";
import { Button } from "@/components/ui/button";
import { useVendorById } from "@/api/vendors";

export default function VendorDetailPage() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const vendorIdNum = Number(vendorId);
  const { data: vendorResponse } = useVendorById(vendorIdNum);
  const vendorName = vendorResponse?.data?.vendor_name?.trim() || `vendor #${vendorId}`;

  const [openCreate, setOpenCreate] = React.useState(false);

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
                <BreadcrumbLink href="/dashboard/vendors">
                  Vendors
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{vendorName}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setOpenCreate(true)}>Create Franchise</Button>
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Vendor Details
          </h1>
          <p className="text-sm text-muted-foreground">
            View and manage details for {vendorName}.
          </p>
        </div>

        <FranchisesTable vendorId={vendorIdNum} />
      </div>

      <FranchiseFormDialog open={openCreate} onOpenChange={setOpenCreate} vendorId={vendorIdNum} />
    </>
  );
}
