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
  useCreateMiscellaneousTeam,
  useMiscellaneousTeams,
  useUpdateMiscellaneousTeam,
  useUpdateMiscellaneousTeamStatus,
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

export default function MiscellaneousTeamMastersTable() {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const { data, isLoading, isError, error, refetch } = useMiscellaneousTeams();
  const createMiscTeamMutation = useCreateMiscellaneousTeam();
  const updateMiscTeamMutation = useUpdateMiscellaneousTeam();
  const updateMiscTeamStatusMutation = useUpdateMiscellaneousTeamStatus();

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [openCreateModal, setOpenCreateModal] = React.useState(false);
  const [openEditModal, setOpenEditModal] = React.useState(false);
  const [openConfirmStatusModal, setOpenConfirmStatusModal] = React.useState(false);
  const [teamValue, setTeamValue] = React.useState("");
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
        setTeamValue(row.type);
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
    const trimmed = teamValue.trim();
    if (!trimmed || !vendorId || !userId) return;

    createMiscTeamMutation.mutate(
      { vendor_id: vendorId, name: trimmed, created_by: userId },
      {
        onSuccess: () => {
          refetch();
          setTeamValue("");
          setOpenCreateModal(false);
        },
      },
    );
  };

  const handleEdit = () => {
    const trimmed = teamValue.trim();
    if (!trimmed || !editingRow) return;

    updateMiscTeamMutation.mutate(
      { id: editingRow.id, name: trimmed },
      {
        onSuccess: () => {
          refetch();
          setTeamValue("");
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

    updateMiscTeamStatusMutation.mutate(
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
            <CardTitle>Miscellaneous Team Masters</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage all miscellaneous team master entries from one place.
            </p>
          </div>

          <Button onClick={() => setOpenCreateModal(true)} className="sm:self-start">
            <Plus className="mr-2 h-4 w-4" />
            Create Miscellaneous Team
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
              Loading miscellaneous team masters...
            </div>
          ) : isError ? (
            <div className="py-10 text-sm text-red-500">
              {(error as any)?.response?.data?.error ||
                "Failed to load miscellaneous team masters."}
            </div>
          ) : (
            <DataTable table={table} className="px-0 pt-0">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <ClearInput
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    placeholder="Search miscellaneous team..."
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
            <DialogTitle>Create Miscellaneous Team</DialogTitle>
            <DialogDescription>
              Add a new miscellaneous team master entry for this vendor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="misc-team-name">Miscellaneous Team</Label>
            <Input
              id="misc-team-name"
              value={teamValue}
              onChange={(e) => setTeamValue(e.target.value)}
              placeholder="Enter miscellaneous team"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenCreateModal(false);
                setTeamValue("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                !teamValue.trim() ||
                !vendorId ||
                !userId ||
                createMiscTeamMutation.isPending
              }
            >
              {createMiscTeamMutation.isPending ? "Creating..." : "Create"}
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
            setTeamValue("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Miscellaneous Team</DialogTitle>
            <DialogDescription>
              Update the selected miscellaneous team master entry.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="edit-misc-team-name">Miscellaneous Team</Label>
            <Input
              id="edit-misc-team-name"
              value={teamValue}
              onChange={(e) => setTeamValue(e.target.value)}
              placeholder="Enter miscellaneous team"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenEditModal(false);
                setEditingRow(null);
                setTeamValue("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={
                !teamValue.trim() ||
                !editingRow ||
                updateMiscTeamMutation.isPending
              }
            >
              {updateMiscTeamMutation.isPending ? "Saving..." : "Save"}
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
                ? "Mark Miscellaneous Team Inactive"
                : "Mark Miscellaneous Team Active"}
            </DialogTitle>
            <DialogDescription>
              {statusTargetRow?.status?.toLowerCase() === "active"
                ? "This miscellaneous team will be marked inactive."
                : "This miscellaneous team will be marked active again."}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-md border p-3 text-sm">
            <span className="text-muted-foreground">Miscellaneous Team:</span>{" "}
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
                !statusTargetRow || updateMiscTeamStatusMutation.isPending
              }
            >
              {updateMiscTeamStatusMutation.isPending
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
