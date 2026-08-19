"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import VendorsTable from "@/components/custom/VendorsTable";
import { Button } from "@/components/ui/button";
import { useCreateVendorLoginLaunch } from "@/api/auth";
import { toastManager } from "@/components/ui/toast";
import { Plus } from "lucide-react";

export default function VendorsPage() {
  const router = useRouter();
  const createVendorLoginLaunchMutation = useCreateVendorLoginLaunch();

  const handleLoginToVendor = React.useCallback(
    async (row: { id: number; vendor_name: string }) => {
      try {
        const response = await createVendorLoginLaunchMutation.mutateAsync(row.id);
        const launchUrl = response?.data?.launch_url;

        if (!launchUrl) {
          throw new Error("Vendor launch URL not found");
        }

        window.open(launchUrl, "_blank", "noopener,noreferrer");
      } catch (error: any) {
        toastManager.add({
          title:
            error?.response?.data?.message ||
            error?.message ||
            `Failed to login to ${row.vendor_name}`,
          type: "error",
        });
      }
    },
    [createVendorLoginLaunchMutation],
  );

  const handleOpenCreateVendor = () => {
    router.push("/dashboard/vendors/create");
  };

  const handleOpenConfigureVendor = React.useCallback(
    (row: { id: number }) => {
      router.push(`/dashboard/vendors/create?id=${row.id}`);
    },
    [router],
  );

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
              <BreadcrumbItem>
                <BreadcrumbPage>Vendors</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleOpenCreateVendor} className="gap-1.5">
            <Plus className="h-4 w-4" /> Create Vendor
          </Button>
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Vendors</h1>
          <p className="text-sm text-muted-foreground">
            Manage and oversee all vendors on the Furnix CRM platform.
          </p>
        </div>

        <VendorsTable
          onLoginToVendor={handleLoginToVendor}
          onConfigureVendor={handleOpenConfigureVendor}
        />
      </div>
    </>
  );
}
