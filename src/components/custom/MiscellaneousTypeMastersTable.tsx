"use client";

import * as React from "react";
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

import { useAppSelector } from "@/redux/store";
import {
  useCreateMiscellaneousType,
  useMiscellaneousTypes,
  useUpdateMiscellaneousType,
  useUpdateMiscellaneousTypeStatus,
} from "@/hooks/useTypesMaster";
import { DataTable } from "@/components/data-table/data-table";
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
import {
  getSiteMastersColumns,
  type SiteMasterRow,
} from "@/components/utils/column/site-masters-column";

export default function MiscellaneousTypeMastersTable() {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const { data, isLoading, isError, error, refetch } = useMiscellaneousTypes();
  const createMiscTypeMutation = useCreateMiscellaneousType();
  const updateMiscTypeMutation = useUpdateMiscellaneousType();
  const updateMiscTypeStatusMutation = useUpdateMiscellaneousTypeStatus();

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [openCreateModal, setOpenCreateModal] = React.useState(false);
  const [openEditModal, setOpenEditModal] = React.useState(false);
  const [openConfirmStatusModal, setOpenConfirmStatusModal] = React.useState(false);
  const [miscTypeValue, setMiscTypeValue] = React.useState("");
  const [editingRow, setEditingRow] = React.useState<SiteMasterRow | null>(null);
  const [statusTargetRow, setStatusTargetRow] = React.useState<SiteMasterRow | null>(null);

  const tableData = React.useMemo<SiteMasterRow[]>(
    () =>
      (data?.data ?? []).map((item, index) => ({
        srNo: index + 1,
        id: item.id,
        type: item.name,
        status: item.status,
      })),
    [data],
  );

  const table = useReactTable({
    data: tableData,
    columns: getSiteMastersColumns({
      onEdit: (row) => {
        setEditingRow(row);
        setMiscTypeValue(row.type);
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

  const handleCreate = () => {
    const trimmed = miscTypeValue.trim();
    if (!trimmed || !vendorId || !userId) return;

    createMiscTypeMutation.mutate(
      { vendor_id: vendorId, name: trimmed, created_by: userId },
      {
        onSuccess: () => {
          refetch();
          setMiscTypeValue("");
          setOpenCreateModal(false);
        },
      },
    );
  };

  const handleEdit = () => {
    const trimmed = miscTypeValue.trim();
    if (!trimmed || !editingRow) return;

    updateMiscTypeMutation.mutate(
      { id: editingRow.id, name: trimmed },
      {
        onSuccess: () => {
          refetch();
          setMiscTypeValue("");
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

    updateMiscTypeStatusMutation.mutate(
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
            <CardTitle>Miscellaneous Type Masters</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage all miscellaneous type master entries from one place.
            </p>
          </div>

          <Button onClick={() => setOpenCreateModal(true)} className="sm:self-start">
            <Plus className="mr-2 h-4 w-4" />
            Create Miscellaneous Type
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
              Loading miscellaneous type masters...
            </div>
          ) : isError ? (
            <div className="py-10 text-sm text-red-500">
              {(error as any)?.response?.data?.error ||
                "Failed to load miscellaneous type masters."}
            </div>
          ) : (
            <DataTable table={table} className="px-0 pt-0">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <ClearInput
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    placeholder="Search miscellaneous type..."
                    className="h-9 w-full md:w-72"
                  />
                </div>
              </div>
            </DataTable>
          )}
        </CardContent>
      </Card>

      <Dialog open={openCreateModal} onOpenChange={setOpenCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Miscellaneous Type</DialogTitle>
            <DialogDescription>
              Add a new miscellaneous type master entry for this vendor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="misc-type-name">Miscellaneous Type</Label>
            <Input
              id="misc-type-name"
              value={miscTypeValue}
              onChange={(e) => setMiscTypeValue(e.target.value)}
              placeholder="Enter miscellaneous type"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenCreateModal(false);
                setMiscTypeValue("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                !miscTypeValue.trim() ||
                !vendorId ||
                !userId ||
                createMiscTypeMutation.isPending
              }
            >
              {createMiscTypeMutation.isPending ? "Creating..." : "Create"}
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
            setMiscTypeValue("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Miscellaneous Type</DialogTitle>
            <DialogDescription>
              Update the selected miscellaneous type master entry.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="edit-misc-type-name">Miscellaneous Type</Label>
            <Input
              id="edit-misc-type-name"
              value={miscTypeValue}
              onChange={(e) => setMiscTypeValue(e.target.value)}
              placeholder="Enter miscellaneous type"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenEditModal(false);
                setEditingRow(null);
                setMiscTypeValue("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={
                !miscTypeValue.trim() ||
                !editingRow ||
                updateMiscTypeMutation.isPending
              }
            >
              {updateMiscTypeMutation.isPending ? "Saving..." : "Save"}
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
                ? "Mark Miscellaneous Type Inactive"
                : "Mark Miscellaneous Type Active"}
            </DialogTitle>
            <DialogDescription>
              {statusTargetRow?.status?.toLowerCase() === "active"
                ? "This miscellaneous type will be marked inactive."
                : "This miscellaneous type will be marked active again."}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-md border p-3 text-sm">
            <span className="text-muted-foreground">Miscellaneous Type:</span>{" "}
            <span className="font-medium">{statusTargetRow?.type}</span>
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
              disabled={
                !statusTargetRow || updateMiscTypeStatusMutation.isPending
              }
            >
              {updateMiscTypeStatusMutation.isPending
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
