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
import {
  useArchitectureMasters,
  useCreateArchitectureMaster,
  useUpdateArchitectureMaster,
  useUpdateArchitectureMasterStatus,
  useDeleteArchitectureMaster,
} from "@/hooks/useArchitectureMaster";
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
import { useAppSelector } from "@/redux/store";

type ArchitectureMasterRow = {
  srNo: number;
  id: number;
  vendorId: number;
  name: string;
  email: string;
  mobile: string;
  is_active: boolean;
  status: "active" | "inactive";
};

const getArchitectureColumns = ({
  onEdit,
  onDelete,
  onToggleStatus,
}: {
  onEdit: (row: ArchitectureMasterRow) => void;
  onDelete: (row: ArchitectureMasterRow) => void;
  onToggleStatus: (row: ArchitectureMasterRow) => void;
}): ColumnDef<ArchitectureMasterRow>[] => [
  {
    accessorKey: "srNo",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Sr. No." />,
    cell: ({ row }) => <span className="font-medium">{row.getValue("srNo")}</span>,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "mobile",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Mobile" />,
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
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
            className={cn("h-1.5 w-1.5 rounded-full", isActive ? "bg-emerald-500" : "bg-zinc-400")}
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
      const isActive = original.status === "active";
      return (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(original)}>
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => onToggleStatus(original)}>
            {isActive ? "Mark Inactive" : "Mark Active"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-500 hover:text-red-600 hover:border-red-300"
            onClick={() => onDelete(original)}
          >
            Delete
          </Button>
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
];

interface ArchitectureMastersTableProps {
  vendorIdOverride?: number;
}

const defaultForm = { name: "", email: "", mobile: "" };

export default function ArchitectureMastersTable({ vendorIdOverride }: ArchitectureMastersTableProps) {
  const vendorId = vendorIdOverride ?? useAppSelector((state) => state.auth.user?.vendor_id);

  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const [openCreateModal, setOpenCreateModal] = React.useState(false);
  const [openEditModal, setOpenEditModal] = React.useState(false);
  const [openDeleteModal, setOpenDeleteModal] = React.useState(false);
  const [openConfirmStatusModal, setOpenConfirmStatusModal] = React.useState(false);
  const [editingRow, setEditingRow] = React.useState<ArchitectureMasterRow | null>(null);
  const [deletingRow, setDeletingRow] = React.useState<ArchitectureMasterRow | null>(null);
  const [statusTargetRow, setStatusTargetRow] = React.useState<ArchitectureMasterRow | null>(null);
  const [form, setForm] = React.useState(defaultForm);

  const { data, isLoading, isError, error, refetch } = useArchitectureMasters({ page, limit: 50, search });
  const createMutation = useCreateArchitectureMaster();
  const updateMutation = useUpdateArchitectureMaster();
  const updateStatusMutation = useUpdateArchitectureMasterStatus();
  const deleteMutation = useDeleteArchitectureMaster();

  const tableData = React.useMemo<ArchitectureMasterRow[]>(
    () =>
      (data?.data?.data ?? []).map((item, index) => ({
        srNo: index + 1,
        id: item.id,
        vendorId: item.vendorId,
        name: item.name,
        email: item.email,
        mobile: item.mobile,
        is_active: item.is_active,
        status: item.is_active ? "active" : "inactive",
      })),
    [data],
  );

  const table = useReactTable({
    data: tableData,
    columns: getArchitectureColumns({
      onEdit: (row) => {
        setEditingRow(row);
        setForm({ name: row.name, email: row.email, mobile: row.mobile });
        setOpenEditModal(true);
      },
      onDelete: (row) => {
        setDeletingRow(row);
        setOpenDeleteModal(true);
      },
      onToggleStatus: (row) => {
        setStatusTargetRow(row);
        setOpenConfirmStatusModal(true);
      },
    }),
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, columnId, value) => {
      const s = String(value ?? "").trim().toLowerCase();
      if (!s) return true;
      return String(row.getValue(columnId) ?? "").toLowerCase().includes(s);
    },
    initialState: { pagination: { pageIndex: 0, pageSize: 20 } },
  });

  const resetForm = () => setForm(defaultForm);

  const canSubmit = !!form.name.trim() && !!form.email.trim() && !!form.mobile.trim();

  const handleCreate = () => {
    if (!canSubmit || !vendorId) return;
    createMutation.mutate(
      { vendorId: Number(vendorId), name: form.name.trim(), email: form.email.trim(), mobile: form.mobile.trim() },
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
    if (!editingRow || !canSubmit) return;
    updateMutation.mutate(
      { id: editingRow.id, data: { name: form.name.trim(), email: form.email.trim(), mobile: form.mobile.trim() } },
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

  const handleDelete = () => {
    if (!deletingRow) return;
    deleteMutation.mutate(deletingRow.id, {
      onSuccess: () => {
        refetch();
        setDeletingRow(null);
        setOpenDeleteModal(false);
      },
    });
  };

  const handleToggleStatus = () => {
    if (!statusTargetRow) return;

    updateStatusMutation.mutate(
      {
        id: statusTargetRow.id,
        data: {
          is_active: statusTargetRow.status !== "active",
        },
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

  const formFields = (
    <>
      <div className="space-y-2">
        <Label htmlFor="arch-name">Name</Label>
        <Input
          id="arch-name"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Enter name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="arch-email">Email</Label>
        <Input
          id="arch-email"
          type="email"
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          placeholder="Enter email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="arch-mobile">Mobile</Label>
        <Input
          id="arch-mobile"
          value={form.mobile}
          onChange={(e) => setForm((prev) => ({ ...prev, mobile: e.target.value }))}
          placeholder="Enter mobile number"
        />
      </div>
    </>
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Architecture Masters</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage all architecture master entries from one place.
            </p>
          </div>
          <Button onClick={() => setOpenCreateModal(true)} className="sm:self-start">
            <Plus className="mr-2 h-4 w-4" />
            Create Architecture Master
          </Button>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="py-10 text-sm text-muted-foreground">Loading architecture masters...</div>
          ) : isError ? (
            <div className="py-10 text-sm text-red-500">
              {(error as any)?.response?.data?.message || "Failed to load architecture masters."}
            </div>
          ) : (
            <DataTable table={table} className="px-0 pt-0">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <ClearInput
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  placeholder="Search architecture master..."
                  className="h-9 w-full md:w-72"
                />
              </div>
            </DataTable>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Dialog
        open={openCreateModal}
        onOpenChange={(open) => {
          setOpenCreateModal(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Architecture Master</DialogTitle>
            <DialogDescription>Add a new architecture master entry.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">{formFields}</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!canSubmit || createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
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
            <DialogTitle>Edit Architecture Master</DialogTitle>
            <DialogDescription>Update the selected architecture master entry.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">{formFields}</div>
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
            <Button onClick={handleEdit} disabled={!canSubmit || updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Modal */}
      <Dialog
        open={openDeleteModal}
        onOpenChange={(open) => {
          setOpenDeleteModal(open);
          if (!open) setDeletingRow(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Architecture Master</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border p-3 text-sm">
            <span className="text-muted-foreground">Name: </span>
            <span className="font-medium">{deletingRow?.name}</span>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenDeleteModal(false);
                setDeletingRow(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toggle Status Confirm Modal */}
      <Dialog
        open={openConfirmStatusModal}
        onOpenChange={(open) => {
          setOpenConfirmStatusModal(open);
          if (!open) setStatusTargetRow(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {statusTargetRow?.status === "active"
                ? "Mark Architecture Master Inactive"
                : "Mark Architecture Master Active"}
            </DialogTitle>
            <DialogDescription>
              {statusTargetRow?.status === "active"
                ? "This architecture master will be marked inactive."
                : "This architecture master will be marked active again."}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border p-3 text-sm">
            <span className="text-muted-foreground">Architecture Master:</span>{" "}
            <span className="font-medium">{statusTargetRow?.name}</span>
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
              disabled={!statusTargetRow || updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending
                ? "Updating..."
                : statusTargetRow?.status === "active"
                  ? "Mark Inactive"
                  : "Mark Active"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
