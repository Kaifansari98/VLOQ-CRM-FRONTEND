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
  useBroadcastCategoriesForMaster,
  useCreateBroadcastCategory,
  useUpdateBroadcastCategory,
  useToggleBroadcastCategoryStatus,
} from "@/api/broadcast";
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
  getBroadcastCategoryMastersColumns,
  type BroadcastCategoryMasterRow,
} from "@/components/utils/column/broadcast-category-masters-column";

interface BroadcastCategoryMastersTableProps {
  vendorIdOverride?: number;
}

export default function BroadcastCategoryMastersTable({
  vendorIdOverride,
}: BroadcastCategoryMastersTableProps) {
  const vendorId = vendorIdOverride ?? useAppSelector((state) => state.auth.user?.vendor_id);
  const { data, isLoading, isError, error, refetch } = useBroadcastCategoriesForMaster(vendorId);

  const createMutation = useCreateBroadcastCategory(vendorId ?? undefined);
  const updateMutation = useUpdateBroadcastCategory(vendorId ?? undefined);
  const toggleStatusMutation = useToggleBroadcastCategoryStatus(vendorId ?? undefined);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [openCreateModal, setOpenCreateModal] = React.useState(false);
  const [openEditModal, setOpenEditModal] = React.useState(false);
  const [openConfirmStatusModal, setOpenConfirmStatusModal] = React.useState(false);
  const [categoryValue, setCategoryValue] = React.useState("");
  const [editingRow, setEditingRow] = React.useState<BroadcastCategoryMasterRow | null>(null);
  const [statusTargetRow, setStatusTargetRow] = React.useState<BroadcastCategoryMasterRow | null>(null);

  const tableData = React.useMemo<BroadcastCategoryMasterRow[]>(
    () =>
      (data ?? []).map((item, index) => ({
        srNo: index + 1,
        id: item.id,
        category: item.category,
        type: item.type,
        status: item.is_active ? "Active" : "Inactive",
      })),
    [data],
  );

  const table = useReactTable({
    data: tableData,
    columns: getBroadcastCategoryMastersColumns({
      onEdit: (row) => {
        setEditingRow(row);
        setCategoryValue(row.category);
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
    const trimmed = categoryValue.trim();
    if (!trimmed || !vendorId) return;

    createMutation.mutate(
      { vendor_id: vendorId, category: trimmed, type: "DOCUMENT" },
      {
        onSuccess: () => {
          refetch();
          setCategoryValue("");
          setOpenCreateModal(false);
        },
      },
    );
  };

  const handleEdit = () => {
    const trimmed = categoryValue.trim();
    if (!trimmed || !editingRow) return;

    updateMutation.mutate(
      { id: editingRow.id, payload: { category: trimmed } },
      {
        onSuccess: () => {
          refetch();
          setCategoryValue("");
          setEditingRow(null);
          setOpenEditModal(false);
        },
      },
    );
  };

  const handleToggleStatus = () => {
    if (!statusTargetRow) return;

    toggleStatusMutation.mutate(statusTargetRow.id, {
      onSuccess: () => {
        refetch();
        setOpenConfirmStatusModal(false);
        setStatusTargetRow(null);
      },
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Broadcast Category Masters</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage all broadcast category master entries from one place.
            </p>
          </div>

          <Button onClick={() => setOpenCreateModal(true)} className="sm:self-start">
            <Plus className="mr-2 h-4 w-4" />
            Create Category
          </Button>
        </CardHeader>

        <CardContent>
          {!vendorId ? (
            <div className="py-10 text-sm text-red-500">
              Vendor not found for the current user.
            </div>
          ) : isLoading ? (
            <div className="py-10 text-sm text-muted-foreground">
              Loading broadcast categories...
            </div>
          ) : isError ? (
            <div className="py-10 text-sm text-red-500">
              {(error as any)?.response?.data?.message || "Failed to load broadcast categories."}
            </div>
          ) : (
            <DataTable table={table} className="px-0 pt-0">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <ClearInput
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    placeholder="Search category..."
                    className="h-9 w-full md:w-72"
                  />
                </div>
              </div>
            </DataTable>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={openCreateModal} onOpenChange={setOpenCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Broadcast Category</DialogTitle>
            <DialogDescription>
              Add a new broadcast category master entry for this vendor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="category-name">Category Name</Label>
            <Input
              id="category-name"
              value={categoryValue}
              onChange={(e) => setCategoryValue(e.target.value)}
              placeholder="Enter category name"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenCreateModal(false);
                setCategoryValue("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                !categoryValue.trim() ||
                !vendorId ||
                createMutation.isPending
              }
            >
              {createMutation.isPending ? "Creating..." : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={openEditModal} onOpenChange={setOpenEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Broadcast Category</DialogTitle>
            <DialogDescription>
              Update the details of this category master entry.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="edit-category-name">Category Name</Label>
            <Input
              id="edit-category-name"
              value={categoryValue}
              onChange={(e) => setCategoryValue(e.target.value)}
              placeholder="Enter category name"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenEditModal(false);
                setEditingRow(null);
                setCategoryValue("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={
                !categoryValue.trim() || updateMutation.isPending
              }
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Confirm Dialog */}
      <Dialog open={openConfirmStatusModal} onOpenChange={setOpenConfirmStatusModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Status Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark{" "}
              <span className="font-semibold text-foreground">
                {statusTargetRow?.category}
              </span>{" "}
              as{" "}
              {statusTargetRow?.status?.toLowerCase() === "active"
                ? "Inactive"
                : "Active"}
              ?
            </DialogDescription>
          </DialogHeader>

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
              disabled={toggleStatusMutation.isPending}
            >
              {toggleStatusMutation.isPending ? "Updating..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
