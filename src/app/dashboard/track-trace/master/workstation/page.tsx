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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MachineFabrication } from "@/types/track-trace";
import { Button } from "@/components/ui/button";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Plus, Loader2, Sparkles } from "lucide-react";
import { useAppSelector } from "@/redux/store";
import { useVendorById } from "@/api/vendors";
import { useMachinesByVendor, useDeleteMachine } from "@/hooks/track-trace-hooks/useTrackTraceMasterHooks";
import { toastManager } from "@/components/ui/toast";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import type { MachineData } from "@/types/track-trace";
import TrackTraceWorkstationTable from "@/components/custom/track-trace-workstation-table";
import { UserMachineAssignModal } from "@/components/track-trace/UserMachineAssignModal";
import { GenerateDefaultRulesModal } from "@/components/track-trace/GenerateDefaultRulesModal";

export default function MachineMasterPage() {
  const router = useRouter();
  const authUser = useAppSelector((state) => state.auth.user);
  const vendorId = authUser?.vendor_id;
  const userId = Number(
    (authUser as { id?: number; user_id?: number } | undefined)?.id ??
      (authUser as { id?: number; user_id?: number } | undefined)?.user_id
  );

  const [fabrication, setFabrication] = useState<MachineFabrication>("WOODWORK");
  const { data: vendorResponse, error: vendorError, refetch: refetchVendor } = useVendorById(
    vendorId ? Number(vendorId) : undefined,
    { refetchOnWindowFocus: "always", refetchOnMount: "always" },
  );
  const cutlistConfiguration = vendorResponse?.data?.cutlist_configuration || "default";

  const { data: machines, isLoading, error, isFetching } = useMachinesByVendor(vendorId!);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignMachineId, setAssignMachineId] = useState<number | null>(null);
  const [isDefaultRulesModalOpen, setIsDefaultRulesModalOpen] = useState(false);
  const [machineToDelete, setMachineToDelete] = useState<MachineData | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteMachineMutation = useDeleteMachine(vendorId ? Number(vendorId) : 0);

  const handleDelete = (machine: MachineData) => {
    setMachineToDelete(machine);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!machineToDelete || !vendorId) return;
    try {
      setIsDeleting(true);
      await deleteMachineMutation.mutateAsync({
        id: machineToDelete.id,
        vendor_id: Number(vendorId),
        deleted_by: userId || undefined,
      });
      toastManager.add({
        title: "Workstation deleted successfully",
        type: "success",
      });
      setIsDeleteDialogOpen(false);
      setMachineToDelete(null);
    } catch (err: any) {
      toastManager.add({
        title: err?.response?.data?.message || err?.message || "Failed to delete workstation",
        type: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

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

          <div className="flex items-center gap-2 shrink-0">
            {(cutlistConfiguration === "rule manage" || cutlistConfiguration === "rule_manage") && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10 shadow-2xs"
                onClick={() => setIsDefaultRulesModalOpen(true)}
              >
                <Sparkles size={14} />
                Generate Default Rules
              </Button>
            )}

            <Button
              size="sm"
              className="gap-2 shrink-0"
              onClick={() =>
                router.push(`/dashboard/track-trace/master/workstation/create?fabrication=${fabrication}`)
              }
            >
              <Plus size={15} />
              Create Workstation
            </Button>
          </div>
        </div>

        <Tabs value={fabrication} onValueChange={(value) => setFabrication(value as MachineFabrication)} className="px-4 mb-4">
          <TabsList aria-label="Machine type">
            <TabsTrigger value="WOODWORK">Woodwork Machines</TabsTrigger>
            <TabsTrigger value="METALWORK">Metalwork Machines</TabsTrigger>
          </TabsList>
        </Tabs>
        {vendorError && (
          <div role="alert" className="px-4 mb-4 text-sm text-destructive">
            Could not load vendor configuration. CutList Rules availability cannot be determined.
            <Button variant="link" onClick={() => refetchVendor()}>Retry</Button>
          </div>
        )}

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
              key={fabrication}
              data={(machines ?? []).filter(machine => (machine.fabrication ?? "WOODWORK") === fabrication)}
              onEditClick={handleEdit}
              onAssignUsersClick={handleAssignUsers}
              onDeleteClick={handleDelete}
              cutlistConfiguration={cutlistConfiguration}
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

      {/* Delete Confirmation Modal */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(val) => {
          if (!isDeleting) {
            setIsDeleteDialogOpen(val);
            if (!val) setMachineToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workstation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete workstation{" "}
              <span className="font-semibold text-foreground">
                {machineToDelete?.machine_name}
              </span>{" "}
              ({machineToDelete?.machine_code})?
              <br />
              <br />
              This will soft-delete the workstation. Historical cutlists and scanning records will remain intact, but this workstation will be excluded from future cutlists.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={confirmDelete}
              className="gap-2"
            >
              {isDeleting && <Loader2 className="size-4 animate-spin" />}
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Generate Default Rules Modal */}
      <GenerateDefaultRulesModal
        open={isDefaultRulesModalOpen}
        onOpenChange={setIsDefaultRulesModalOpen}
        vendorId={vendorId!}
        userId={userId!}
      />
    </>
  );
}
