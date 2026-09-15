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
import { Plus, Pencil, Workflow, Loader2 } from "lucide-react";

import { useAppSelector } from "@/redux/store";
import {
  useProcessBriefs,
  useCreateProcessBrief,
  useUpdateProcessBrief,
  useToggleProcessBriefStatus,
  useSaveProcessBriefMachineMappings,
} from "@/hooks/useTypesMaster";
import { useMachinesByVendor } from "@/hooks/track-trace-hooks/useTrackTraceMasterHooks";
import { useMachineTypes } from "@/hooks/track-trace/useTrackTraceProjects";
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
import { Badge } from "@/components/ui/badge";
import { MultiSelect } from "@/components/custom/multi-select";

interface ProcessBriefsTableProps {
  vendorIdOverride?: number;
}

export default function ProcessBriefsTable({ vendorIdOverride }: ProcessBriefsTableProps) {
  const vendorId = vendorIdOverride ?? useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);

  // Queries
  const { data: briefsResponse, isLoading: isBriefsLoading, refetch } = useProcessBriefs();
  const { data: rawMachines } = useMachinesByVendor(vendorId!);
  const { data: machineTypesResponse } = useMachineTypes(vendorId);

  // Safely extract machines array
  const machines = React.useMemo(() => {
    if (!rawMachines) return [];
    if (Array.isArray(rawMachines)) return rawMachines;
    if (Array.isArray((rawMachines as any)?.data)) return (rawMachines as any).data;
    return [];
  }, [rawMachines]);

  // Safely extract machine types array
  const machineTypes = React.useMemo(() => {
    if (!machineTypesResponse) return [];
    if (Array.isArray(machineTypesResponse)) return machineTypesResponse;
    if (Array.isArray((machineTypesResponse as any)?.data)) return (machineTypesResponse as any).data;
    if (Array.isArray((machineTypesResponse as any)?.data?.data)) return (machineTypesResponse as any).data.data;
    return [];
  }, [machineTypesResponse]);

  // Mutations
  const createBriefMutation = useCreateProcessBrief(vendorId);
  const updateBriefMutation = useUpdateProcessBrief(vendorId);
  const toggleBriefStatusMutation = useToggleProcessBriefStatus(vendorId);
  const saveMappingsMutation = useSaveProcessBriefMachineMappings(vendorId);

  // Table State
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");

  // Modals State
  const [openCreateModal, setOpenCreateModal] = React.useState(false);
  const [openEditModal, setOpenEditModal] = React.useState(false);
  const [openStatusModal, setOpenStatusModal] = React.useState(false);
  const [openMappingModal, setOpenMappingModal] = React.useState(false);

  // Active Row State
  const [briefNameValue, setBriefNameValue] = React.useState("");
  const [activeRow, setActiveRow] = React.useState<any | null>(null);

  // Mapping Selections State
  const [selectedMachineIds, setSelectedMachineIds] = React.useState<string[]>([]);
  const [selectedMachineTypeIds, setSelectedMachineTypeIds] = React.useState<string[]>([]);

  // Format data for React Table
  const tableData = React.useMemo(() => {
    const list = briefsResponse?.data || [];
    return list.map((item: any, index: number) => ({
      srNo: index + 1,
      id: item.id,
      name: item.name,
      is_active: item.is_active,
      machineMappings: item.machineMappings || [],
    }));
  }, [briefsResponse]);

  // Command item options for multi-selects
  const machineOptions = React.useMemo(() => {
    return machines.map((m: any) => ({
      label: `${m.machine_name || m.name} (${m.machine_code || m.code || m.id})`,
      value: String(m.id),
    }));
  }, [machines]);

  const machineTypeOptions = React.useMemo(() => {
    return machineTypes.map((t: any) => ({
      label: t.machine_type || t.type || t.name || `Type #${t.id}`,
      value: String(t.id),
    }));
  }, [machineTypes]);

  // Column definitions
  const columns = React.useMemo(
    () => [
      {
        accessorKey: "srNo",
        header: "Sr. No.",
        cell: ({ row }: any) => <div>{row.getValue("srNo")}</div>,
      },
      {
        accessorKey: "name",
        header: "Process Brief Name",
        cell: ({ row }: any) => <div className="font-medium">{row.getValue("name")}</div>,
      },
      {
        accessorKey: "is_active",
        header: "Status",
        cell: ({ row }: any) => {
          const isActive = row.getValue("is_active");
          return (
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? "Active" : "Inactive"}
            </Badge>
          );
        },
      },
      {
        id: "mappings",
        header: "Mapped Workstations",
        cell: ({ row }: any) => {
          const mappings = row.original.machineMappings || [];
          if (mappings.length === 0) {
            return <span className="text-xs text-muted-foreground italic">None configured</span>;
          }

          const tags: string[] = [];
          mappings.forEach((m: any) => {
            if (m.machine) {
              tags.push(m.machine.machine_name);
            }
            if (m.machineType) {
              tags.push(`Type: ${m.machineType.machine_type}`);
            }
          });

          return (
            <div className="flex flex-wrap gap-1 max-w-[300px]">
              {tags.map((tag, idx) => (
                <Badge key={idx} variant="outline" className="text-[10px] px-1.5 py-0">
                  {tag}
                </Badge>
              ))}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }: any) => {
          const brief = row.original;
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => {
                  setActiveRow(brief);
                  setBriefNameValue(brief.name);
                  setOpenEditModal(true);
                }}
              >
                <Pencil className="mr-1 h-3.5 w-3.5" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => {
                  setActiveRow(brief);
                  setOpenStatusModal(true);
                }}
              >
                {brief.is_active ? "Mark Inactive" : "Mark Active"}
              </Button>
              <Button
                variant="default"
                size="sm"
                className="h-8"
                onClick={() => {
                  setActiveRow(brief);
                  
                  // Initialize selected IDs
                  const machineIds = brief.machineMappings
                    .map((m: any) => m.machine_id)
                    .filter((id: any) => id !== null)
                    .map(String);

                  const typeIds = brief.machineMappings
                    .map((m: any) => m.machine_type_id)
                    .filter((id: any) => id !== null)
                    .map(String);

                  setSelectedMachineIds(machineIds);
                  setSelectedMachineTypeIds(typeIds);
                  setOpenMappingModal(true);
                }}
              >
                <Workflow className="mr-1 h-3.5 w-3.5" />
                Map Workstations
              </Button>
            </div>
          );
        },
      },
    ],
    [machines, machineTypes],
  );

  const table = useReactTable({
    data: tableData,
    columns,
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
        pageSize: 10,
      },
    },
  });

  const handleCreate = () => {
    const trimmed = briefNameValue.trim();
    if (!trimmed || !vendorId || !userId) return;

    createBriefMutation.mutate(
      { vendor_id: vendorId, name: trimmed, created_by: userId },
      {
        onSuccess: () => {
          refetch();
          setBriefNameValue("");
          setOpenCreateModal(false);
        },
      },
    );
  };

  const handleEdit = () => {
    const trimmed = briefNameValue.trim();
    if (!trimmed || !activeRow) return;

    updateBriefMutation.mutate(
      { id: activeRow.id, name: trimmed },
      {
        onSuccess: () => {
          refetch();
          setBriefNameValue("");
          setActiveRow(null);
          setOpenEditModal(false);
        },
      },
    );
  };

  const handleToggleStatus = () => {
    if (!activeRow) return;

    const nextStatus = !activeRow.is_active;

    toggleBriefStatusMutation.mutate(
      { id: activeRow.id, is_active: nextStatus },
      {
        onSuccess: () => {
          refetch();
          setOpenStatusModal(false);
          setActiveRow(null);
        },
      },
    );
  };

  const handleSaveMappings = () => {
    if (!activeRow || !vendorId || !userId) return;

    saveMappingsMutation.mutate(
      {
        process_brief_id: activeRow.id,
        vendor_id: vendorId,
        machine_ids: selectedMachineIds.map(Number),
        machine_type_ids: selectedMachineTypeIds.map(Number),
        created_by: userId,
      },
      {
        onSuccess: () => {
          refetch();
          setOpenMappingModal(false);
          setActiveRow(null);
        },
      },
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Process Brief Masters</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage logical manufacturing process briefs and map them to physical workstations/saws.
            </p>
          </div>

          <Button onClick={() => setOpenCreateModal(true)} className="sm:self-start">
            <Plus className="mr-2 h-4 w-4" />
            Create Process Brief
          </Button>
        </CardHeader>

        <CardContent>
          {!vendorId ? (
            <div className="py-10 text-sm text-red-500">Vendor not found for the current user.</div>
          ) : isBriefsLoading ? (
            <div className="py-10 text-sm text-muted-foreground">Loading process briefs...</div>
          ) : (
            <DataTable table={table} className="px-0 pt-0">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <ClearInput
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    placeholder="Search process brief..."
                    className="h-9 w-full md:w-72"
                  />
                </div>
              </div>
            </DataTable>
          )}
        </CardContent>
      </Card>

      {/* CREATE MODAL */}
      <Dialog open={openCreateModal} onOpenChange={setOpenCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Process Brief</DialogTitle>
            <DialogDescription>Add a new process brief step template.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="process-brief-name">Process Brief Name</Label>
            <Input
              id="process-brief-name"
              value={briefNameValue}
              onChange={(e) => setBriefNameValue(e.target.value)}
              placeholder="e.g. Wardrobe Router CNC, 2mm Edging"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenCreateModal(false);
                setBriefNameValue("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!briefNameValue.trim() || !vendorId || createBriefMutation.isPending}
            >
              {createBriefMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT MODAL */}
      <Dialog open={openEditModal} onOpenChange={setOpenEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Process Brief</DialogTitle>
            <DialogDescription>Update the name of the process brief.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="edit-process-brief-name">Process Brief Name</Label>
            <Input
              id="edit-process-brief-name"
              value={briefNameValue}
              onChange={(e) => setBriefNameValue(e.target.value)}
              placeholder="Enter process brief name"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenEditModal(false);
                setBriefNameValue("");
                setActiveRow(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!briefNameValue.trim() || !activeRow || updateBriefMutation.isPending}
            >
              {updateBriefMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* STATUS TOGGLE MODAL */}
      <Dialog open={openStatusModal} onOpenChange={setOpenStatusModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{activeRow?.is_active ? "Mark Inactive" : "Mark Active"}</DialogTitle>
            <DialogDescription>
              Are you sure you want to change the status of this process brief?
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-md border p-3 text-sm">
            <span className="text-muted-foreground">Process Brief:</span>{" "}
            <span className="font-medium">{activeRow?.name}</span>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenStatusModal(false);
                setActiveRow(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleToggleStatus} disabled={!activeRow || toggleBriefStatusMutation.isPending}>
              {toggleBriefStatusMutation.isPending ? "Updating..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WORKSTATION MAPPING MODAL */}
      <Dialog open={openMappingModal} onOpenChange={setOpenMappingModal}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Map Workstations</DialogTitle>
            <DialogDescription className="font-medium text-foreground">
              Brief: {activeRow?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Specific Workstations</Label>
              <MultiSelect
                options={machineOptions}
                selected={selectedMachineIds}
                onChange={setSelectedMachineIds}
                placeholder="Select machines..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenMappingModal(false);
                setActiveRow(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveMappings}
              disabled={!activeRow || saveMappingsMutation.isPending}
            >
              {saveMappingsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Mappings"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
