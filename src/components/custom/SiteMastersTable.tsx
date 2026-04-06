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
  useCreateSiteType,
  useSiteTypesForMaster,
  useUpdateSiteType,
  useUpdateSiteTypeStatus,
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

export default function SiteMastersTable() {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const { data, isLoading, isError, error, refetch } = useSiteTypesForMaster();
  const createSiteTypeMutation = useCreateSiteType();
  const updateSiteTypeMutation = useUpdateSiteType();
  const updateSiteTypeStatusMutation = useUpdateSiteTypeStatus();

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [openCreateModal, setOpenCreateModal] = React.useState(false);
  const [openEditModal, setOpenEditModal] = React.useState(false);
  const [openConfirmStatusModal, setOpenConfirmStatusModal] = React.useState(false);
  const [siteTypeValue, setSiteTypeValue] = React.useState("");
  const [editingRow, setEditingRow] = React.useState<SiteMasterRow | null>(null);
  const [statusTargetRow, setStatusTargetRow] = React.useState<SiteMasterRow | null>(null);

  const tableData = React.useMemo<SiteMasterRow[]>(
    () =>
      (data?.data ?? [])
        .map((item, index) => ({
          srNo: index + 1,
          id: item.id,
          type: item.type,
          status: item.status,
        })),
    [data],
  );

  const table = useReactTable({
    data: tableData,
    columns: getSiteMastersColumns({
      onEdit: (row) => {
        setEditingRow(row);
        setSiteTypeValue(row.type);
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
    const trimmed = siteTypeValue.trim();
    if (!trimmed || !vendorId) return;

    createSiteTypeMutation.mutate(
      { vendor_id: vendorId, type: trimmed },
      {
        onSuccess: () => {
          refetch();
          setSiteTypeValue("");
          setOpenCreateModal(false);
        },
      },
    );
  };

  const handleEdit = () => {
    const trimmed = siteTypeValue.trim();
    if (!trimmed || !editingRow) return;

    updateSiteTypeMutation.mutate(
      { id: editingRow.id, type: trimmed },
      {
        onSuccess: () => {
          refetch();
          setSiteTypeValue("");
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

    updateSiteTypeStatusMutation.mutate(
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
            <CardTitle>Site Masters</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage all site type master entries from one place.
            </p>
          </div>

          <Button onClick={() => setOpenCreateModal(true)} className="sm:self-start">
            <Plus className="mr-2 h-4 w-4" />
            Create Site Type
          </Button>
        </CardHeader>

        <CardContent>
          {!vendorId ? (
            <div className="py-10 text-sm text-red-500">
              Vendor not found for the current user.
            </div>
          ) : isLoading ? (
            <div className="py-10 text-sm text-muted-foreground">
              Loading site masters...
            </div>
          ) : isError ? (
            <div className="py-10 text-sm text-red-500">
              {(error as any)?.response?.status === 404
                ? "Master API is not live on the backend yet. Restart or deploy the backend route."
                : (error as any)?.response?.data?.error || "Failed to load site masters."}
            </div>
          ) : (
          <DataTable table={table} className="px-0 pt-0">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <ClearInput
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  placeholder="Search site type..."
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
            <DialogTitle>Create Site Type</DialogTitle>
            <DialogDescription>
              Add a new site type master entry for this vendor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="site-type-name">Site Type</Label>
            <Input
              id="site-type-name"
              value={siteTypeValue}
              onChange={(e) => setSiteTypeValue(e.target.value)}
              placeholder="Enter site type"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenCreateModal(false);
                setSiteTypeValue("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                !siteTypeValue.trim() ||
                !vendorId ||
                createSiteTypeMutation.isPending
              }
            >
              {createSiteTypeMutation.isPending ? "Creating..." : "Create"}
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
            setSiteTypeValue("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Site Type</DialogTitle>
            <DialogDescription>
              Update the selected site type master entry.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="edit-site-type-name">Site Type</Label>
            <Input
              id="edit-site-type-name"
              value={siteTypeValue}
              onChange={(e) => setSiteTypeValue(e.target.value)}
              placeholder="Enter site type"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenEditModal(false);
                setEditingRow(null);
                setSiteTypeValue("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={
                !siteTypeValue.trim() ||
                !editingRow ||
                updateSiteTypeMutation.isPending
              }
            >
              {updateSiteTypeMutation.isPending ? "Saving..." : "Save"}
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
                ? "Mark Site Type Inactive"
                : "Mark Site Type Active"}
            </DialogTitle>
            <DialogDescription>
              {statusTargetRow?.status?.toLowerCase() === "active"
                ? "This site type will move to the inactive list."
                : "This site type will move back to the active list."}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-md border p-3 text-sm">
            <span className="text-muted-foreground">Site Type:</span>{" "}
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
                !statusTargetRow || updateSiteTypeStatusMutation.isPending
              }
            >
              {updateSiteTypeStatusMutation.isPending
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
