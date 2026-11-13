"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { FadeInProvider } from "@/components/framer-motion/FadeInProvider";
import { toastManager } from "@/components/ui/toast";
import { useAppSelector } from "@/redux/store";
import { ClientComplaintsView } from "@/components/client-complaints/ClientComplaintsView";
import { CreateComplaintModal } from "@/components/client-complaints/CreateComplaintModal";
import { useComplaintMeta } from "@/api/client-complaints";

export default function ClientComplaintsPage() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const vendorId = user?.vendor_id ?? undefined;
  const isClientComplaintsEnabled = user?.vendor?.is_client_complaints_enabled === true;

  useEffect(() => {
    if (!isClientComplaintsEnabled) {
      router.replace("/dashboard");
    }
  }, [isClientComplaintsEnabled, router]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data: meta } = useComplaintMeta(isClientComplaintsEnabled ? vendorId : undefined);

  if (!isClientComplaintsEnabled || !vendorId) return null;

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold">Complaints</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      <main className="flex flex-1 flex-col p-6 space-y-6">
        <FadeInProvider>
          <ClientComplaintsView
            vendorId={vendorId}
            canRegister={meta?.can_register === true}
            onCreateOpen={() => setIsCreateOpen(true)}
            onViewItem={(item) => router.push(`/dashboard/client-complaints/details/${item.id}`)}
          />
        </FadeInProvider>
      </main>

      <CreateComplaintModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        vendorId={vendorId}
        meta={meta}
        onCreated={({ complaint_code, possible_duplicate }) =>
          toastManager.add({
            title: possible_duplicate
              ? `Complaint ${complaint_code} registered — flagged as a possible duplicate for HO review`
              : `Complaint ${complaint_code} registered`,
            type: possible_duplicate ? "warning" : "success",
          })
        }
      />
    </>
  );
}
