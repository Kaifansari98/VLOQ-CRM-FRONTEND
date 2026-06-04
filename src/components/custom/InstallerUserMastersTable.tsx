"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ColumnFiltersState,
  SortingState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAppSelector } from "@/redux/store";
import {
  useCreateInstallerUser,
  useInstallerUsersForMaster,
  useUpdateInstallerUser,
  useUpdateInstallerUserStatus,
} from "@/hooks/useTypesMaster";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import ClearInput from "@/components/origin-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type InstallerMasterRow = {
  srNo: number;
  id: number;
  installer_name: string;
  contact_number?: string | null;
  status: string;
};

const getInstallerMasterColumns = ({
  onEdit,
  onToggleStatus,
}: {
  onEdit: (row: InstallerMasterRow) => void;
  onToggleStatus: (row: InstallerMasterRow) => void;
}): ColumnDef<InstallerMasterRow>[] => [
  {
    accessorKey: "srNo",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Sr. No." />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("srNo")}</span>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "installer_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Installer Name" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("installer_name") || "—"}</span>
    ),
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "contact_number",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Contact Number" />
    ),
    cell: ({ row }) => (
      <span>{(row.getValue("contact_number") as string) || "—"}</span>
    ),
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = ((row.getValue("status") as string) || "").toLowerCase();
      const isActive = status === "active";

      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
            isActive
              ? "border-emerald-200 bg-emerald-500/10 text-emerald-600"
              : "border-zinc-200 bg-zinc-100 text-zinc-600",
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              isActive ? "bg-emerald-500" : "bg-zinc-400",
            )}
          />
          {status || "—"}
        </span>
      );
    },
    enableSorting: true,
    enableHiding: false,
  },
  {
    id: "actions",
    header: () => <div>Action</div>,
    cell: ({ row }) => {
      const original = row.original;
      const isActive = original.status?.toLowerCase() === "active";

      return (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(original)}>
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => onToggleStatus(original)}>
            {isActive ? "Mark Inactive" : "Mark Active"}
          </Button>
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
];

interface InstallerUserMastersTableProps {
  vendorIdOverride?: number;
}

export default function InstallerUserMastersTable({
  vendorIdOverride,
}: InstallerUserMastersTableProps) {
  const vendorId = vendorIdOverride ?? useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const { data, isLoading, isError, error, refetch } = useInstallerUsersForMaster(vendorId);
  const createInstallerMutation = useCreateInstallerUser(vendorId);
  const updateInstallerMutation = useUpdateInstallerUser(vendorId);
  const updateInstallerStatusMutation = useUpdateInstallerUserStatus(vendorId);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [openCreateModal, setOpenCreateModal] = React.useState(false);
  const [openEditModal, setOpenEditModal] = React.useState(false);
  const [openConfirmStatusModal, setOpenConfirmStatusModal] = React.useState(false);
  const [installerName, setInstallerName] = React.useState("");
  const [contactNumber, setContactNumber] = React.useState("");
  const [editingRow, setEditingRow] = React.useState<InstallerMasterRow | null>(null);
  const [statusTargetRow, setStatusTargetRow] = React.useState<InstallerMasterRow | null>(null);

  const tableData = React.useMemo<InstallerMasterRow[]>(
    () =>
      (data?.data ?? []).map((item, index) => ({
        srNo: index + 1,
        id: item.id,
        installer_name: item.installer_name,
        contact_number: item.contact_number,
        status: item.status,
      })),
    [data],
  );

  const table = useReactTable({
    data: tableData,
    columns: getInstallerMasterColumns({
      onEdit: (row) => {
        setEditingRow(row);
        setInstallerName(row.installer_name);
        setContactNumber(row.contact_number ?? "");
        setOpenEditModal(true);
      },
      onToggleStatus: (row) => {
        setStatusTargetRow(row);
        setOpenConfirmStatusModal(true);
      },
    }),
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, columnId, value) => {
      const search = String(value ?? "").trim().toLowerCase();
      if (!search) return true;
      return String(row.getValue(columnId) ?? "").toLowerCase().includes(search);
    },
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 20,
      },
    },
  });

  const resetForm = () => {
    setInstallerName("");
    setContactNumber("");
  };

  const handleCreate = () => {
    const trimmedName = installerName.trim();
    const trimmedContact = contactNumber.trim();
    if (!trimmedName || !vendorId || !userId) return;

    createInstallerMutation.mutate(
      {
        vendor_id: vendorId,
        installer_name: trimmedName,
        contact_number: trimmedContact || undefined,
        created_by: userId,
      },
      {
        onSuccess: () => {
          refetch();
          resetForm();
          setOpenCreateModal(false);
        },
      },
    );
  };

  const handleEdit = () => {
    const trimmedName = installerName.trim();
    const trimmedContact = contactNumber.trim();
    if (!trimmedName || !editingRow) return;

    updateInstallerMutation.mutate(
      {
        id: editingRow.id,
        installer_name: trimmedName,
        contact_number: trimmedContact || undefined,
      },
      {
        onSuccess: () => {
          refetch();
          resetForm();
          setEditingRow(null);
          setOpenEditModal(false);
        },
      },
    );
  };

  const handleToggleStatus = () => {
    if (!statusTargetRow) return;

    const nextStatus =
      statusTargetRow.status?.toLowerCase() === "active" ? "inactive" : "active";

    updateInstallerStatusMutation.mutate(
      {
        id: statusTargetRow.id,
        status: nextStatus,
      },
      {
        onSuccess: () => {
          refetch();
          setOpenConfirmStatusModal(false);
          setStatusTargetRow(null);
        },
      },
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Installer Masters</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage all installer master entries from one place.
            </p>
          </div>

          <Button onClick={() => setOpenCreateModal(true)} className="sm:self-start">
            <Plus className="mr-2 h-4 w-4" />
            Create Installer
          </Button>
        </CardHeader>

        <CardContent>
          {!vendorId ? (
            <div className="py-10 text-sm text-red-500">
              Vendor not found for the current user.
            </div>
          ) : !userId ? (
            <div className="py-10 text-sm text-red-500">
              User not found for the current session.
            </div>
          ) : isLoading ? (
            <div className="py-10 text-sm text-muted-foreground">
              Loading installers...
            </div>
          ) : isError ? (
            <div className="py-10 text-sm text-red-500">
              {(error as any)?.response?.data?.error || "Failed to load installers."}
            </div>
          ) : (
            <DataTable table={table} className="px-0 pt-0">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <ClearInput
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  placeholder="Search installer..."
                  className="h-9 w-full md:w-72"
                />
              </div>
            </DataTable>
          )}
        </CardContent>
      </Card>

      <Dialog open={openCreateModal} onOpenChange={setOpenCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Installer</DialogTitle>
            <DialogDescription>
              Add a new installer master entry for this vendor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="installer-name">Installer Name</Label>
            <Input
              id="installer-name"
              value={installerName}
              onChange={(e) => setInstallerName(e.target.value)}
              placeholder="Enter installer name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="installer-contact">Contact Number</Label>
            <Input
              id="installer-contact"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="Enter contact number"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenCreateModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!installerName.trim() || !vendorId || !userId || createInstallerMutation.isPending}
            >
              {createInstallerMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={openEditModal}
        onOpenChange={(open) => {
          setOpenEditModal(open);
          if (!open) {
            setEditingRow(null);
            resetForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Installer</DialogTitle>
            <DialogDescription>
              Update the selected installer master entry.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="edit-installer-name">Installer Name</Label>
            <Input
              id="edit-installer-name"
              value={installerName}
              onChange={(e) => setInstallerName(e.target.value)}
              placeholder="Enter installer name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-installer-contact">Contact Number</Label>
            <Input
              id="edit-installer-contact"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="Enter contact number"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenEditModal(false);
                setEditingRow(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!installerName.trim() || !editingRow || updateInstallerMutation.isPending}
            >
              {updateInstallerMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={openConfirmStatusModal}
        onOpenChange={(open) => {
          setOpenConfirmStatusModal(open);
          if (!open) {
            setStatusTargetRow(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {statusTargetRow?.status?.toLowerCase() === "active"
                ? "Mark Installer Inactive"
                : "Mark Installer Active"}
            </DialogTitle>
            <DialogDescription>
              {statusTargetRow?.status?.toLowerCase() === "active"
                ? "This installer will be marked inactive."
                : "This installer will be marked active again."}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-md border p-3 text-sm">
            <span className="text-muted-foreground">Installer:</span>{" "}
            <span className="font-medium">{statusTargetRow?.installer_name}</span>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenConfirmStatusModal(false);
                setStatusTargetRow(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleToggleStatus}
              disabled={!statusTargetRow || updateInstallerStatusMutation.isPending}
            >
              {updateInstallerStatusMutation.isPending
                ? "Updating..."
                : statusTargetRow?.status?.toLowerCase() === "active"
                  ? "Mark Inactive"
                  : "Mark Active"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
