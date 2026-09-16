"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Plus, Loader2 } from "lucide-react";
import { useAppSelector } from "@/redux/store";
import { useMachinesByVendor } from "@/hooks/track-trace-hooks/useTrackTraceMasterHooks";
import type { MachineData } from "@/types/track-trace";
import TrackTraceWorkstationTable from "@/components/custom/track-trace-workstation-table";
import { UserMachineAssignModal } from "@/components/track-trace/UserMachineAssignModal";

export default function MachineMasterPage() {
  const router = useRouter();
  const authUser = useAppSelector((state) => state.auth.user);
  const vendorId = authUser?.vendor_id;
  const userId = Number(
    (authUser as { id?: number; user_id?: number } | undefined)?.id ??
      (authUser as { id?: number; user_id?: number } | undefined)?.user_id
  );

  const { data: machines, isLoading, error, isFetching } = useMachinesByVendor(vendorId!);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignMachineId, setAssignMachineId] = useState<number | null>(null);

  const handleEdit = (machine: MachineData) => {
    router.push(`/dashboard/track-trace/master/workstation/create?id=${machine.id}`);
  };

  const handleAssignUsers = (machineId: number) => {
    setAssignMachineId(machineId);
    setIsAssignModalOpen(true);
  };

  return (
    <>
      {/* ---------------- HEADER ---------------- */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />

          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />

          <Breadcrumb className="hidden md:block">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Master</BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator />

              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard/track-trace">
                  Track & Trace
                </BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator />

              <BreadcrumbItem>
                <BreadcrumbPage>Workstations</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      {/* ---------------- MAIN CONTENT ---------------- */}
      <main className="flex-1 overflow-x-hidden py-4">
        {/* Page Title & Action Button */}
        <div className="flex flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between mb-2">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Workstations
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Search, filter, and configure all production workstations for vendor operations.
            </p>
          </div>

          <Button
            size="sm"
            className="gap-2 shrink-0"
            onClick={() =>
              router.push("/dashboard/track-trace/master/workstation/create")
            }
          >
            <Plus size={15} />
            Create Workstation
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center p-12 text-sm text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading workstations...
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="px-4 pt-6 text-sm text-destructive">
            Failed to load workstations. Please try again.
          </div>
        )}

        {/* Universal Style Table & Toolbar */}
        {!isLoading && !error && (
          <div>
            {isFetching && (
              <div className="px-4 mb-2 text-xs text-muted-foreground">
                Updating workstations...
              </div>
            )}

            <TrackTraceWorkstationTable
              data={machines ?? []}
              onEditClick={handleEdit}
              onAssignUsersClick={handleAssignUsers}
            />
          </div>
        )}
      </main>

      {/* Assign Users Modal */}
      <UserMachineAssignModal
        open={isAssignModalOpen}
        onOpenChange={(val) => {
          setIsAssignModalOpen(val);
          if (!val) setAssignMachineId(null);
        }}
        machineId={assignMachineId}
        vendorId={vendorId!}
        userId={userId!}
      />
    </>
  );
}
