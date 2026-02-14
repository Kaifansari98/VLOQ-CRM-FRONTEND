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
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { CreateMachineModal } from "@/components/track-trace/CreateMachineModal";
import { EditMachineModal } from "@/components/track-trace/EditMachineModal";

import { Plus, Loader2, Pencil } from "lucide-react";
import { useAppSelector } from "@/redux/store";
import { useMachinesByVendor } from "@/hooks/track-trace-hooks/useTrackTraceMasterHooks";
import { useState } from "react";
import Image from "next/image";
import type { MachineData } from "@/types/track-trace";

export default function MachineMasterPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<MachineData | null>(
    null,
  );

  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const { data: machines, isLoading, error } = useMachinesByVendor(vendorId!);

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      ACTIVE: "bg-foreground text-background",
      MAINTENANCE: "bg-border text-foreground",
      INACTIVE: "bg-border text-foreground",
      RETIRED: "bg-border text-foreground",
    };

    return (
      <Badge
        className={statusStyles[status as keyof typeof statusStyles] || ""}
      >
        {status}
      </Badge>
    );
  };

  const getScanTypeBadge = (scanType: string) => {
    const statusStyles = {
      IN: "bg-foreground text-background",
      OUT: "bg-border text-foreground",
      PAAS: "bg-border text-foreground",
      BOTH: "bg-border text-foreground",
    };

    return (
      <Badge
        className={statusStyles[scanType as keyof typeof statusStyles] || ""}
      >
        {scanType}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleEdit = (machine: MachineData) => {
    setSelectedMachine(machine);
    setIsEditModalOpen(true);
  };

  const handleEditModalClose = (open: boolean) => {
    setIsEditModalOpen(open);
    if (!open) {
      setSelectedMachine(null);
    }
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

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard/track-trace">
                  Master
                </BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator className="hidden md:block" />

              <BreadcrumbItem>
                <BreadcrumbPage>Machine Master</BreadcrumbPage>
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
      <main className="flex-1 overflow-x-hidden p-6">
        <div className="space-y-6">
          {/* Header with Create Button */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Machine Master
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage and configure all production machines for vendor-level
                operations.
              </p>
            </div>
            <Button
              className="gap-2"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Create Machine
            </Button>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center p-12">
                <p className="text-muted-foreground">Failed to load machines</p>
              </div>
            ) : !machines || machines.length === 0 ? (
              <div className="flex items-center justify-center p-12">
                <p className="text-muted-foreground">No machines found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">Id</TableHead>
                    <TableHead className="w-15">Sequence</TableHead>
                    <TableHead>Code</TableHead>

                    <TableHead className="w-20">Image</TableHead>
                    <TableHead>Machine Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Scan Type</TableHead>
                    <TableHead className="w-25">
                      Target per Hour (per Sqft)
                    </TableHead>
                    <TableHead className="min-w-50">Description</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="w-20 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {machines.map((machine) => (
                    <TableRow key={machine.id}>
                      {/* Sequence Number */}
                      <TableCell className="font-medium">{machine.id}</TableCell>
                      <TableCell className="font-medium">
                        {machine.sequence_no}
                      </TableCell>

                      {/* Machine Code */}
                      <TableCell className="font-medium">
                        {machine.machine_code}
                      </TableCell>

                      {/* Image */}
                      <TableCell>
                        <div className="relative w-12 h-12 rounded border overflow-hidden bg-muted">
                          {machine.image_path ? (
                            <Image
                              src={`${machine.image_path}`}
                              alt={machine.machine_name}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                              N/A
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Machine Name */}
                      <TableCell className="font-medium">
                        {machine.machine_name}
                      </TableCell>

                      {/* Machine Type */}
                      <TableCell>{machine.machine_type}</TableCell>

                      {/* Status */}
                      <TableCell>{getStatusBadge(machine.status)}</TableCell>

                      {/* Scan Type */}
                      <TableCell>
                        {getScanTypeBadge(machine.scan_type)}
                      </TableCell>

                      {/* Target per Hour */}
                      <TableCell className="text-center">
                        {machine.target_per_hour}
                      </TableCell>

                      {/* Description */}
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={machine.description}>
                          {machine.description}
                        </div>
                      </TableCell>

                      {/* Created At */}
                      <TableCell className="text-sm">
                        {formatDate(machine.created_at)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(machine)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </main>

      {/* Create Machine Modal */}
      <CreateMachineModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />

      {/* Edit Machine Modal */}
      <EditMachineModal
        open={isEditModalOpen}
        onOpenChange={handleEditModalClose}
        machine={selectedMachine}
      />
    </>
  );
}
