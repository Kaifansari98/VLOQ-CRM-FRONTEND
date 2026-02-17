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
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { DataTableDateFilter } from "@/components/data-table/data-table-date-filter";
import ClearInput from "@/components/origin-input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type VisibilityState,
  type ColumnFiltersState,
} from "@tanstack/react-table";

import { useMemo, useState } from "react";
import {
  useApplyConfiguration,
  useVendorLeads,
} from "@/hooks/track-trace-hooks/useTrackTraceMasterHooks";
import {
  ConfigureLeadColumn,
  getConfigureTableColumns,
} from "@/app/_components/configure-columns";
import { useAppSelector } from "@/redux/store";

import { toast } from "react-toastify";
import { VendorLeadsPostPayload } from "@/types/track-trace";

const VENDOR_TOKEN = "7e7a9dda-cc59-4ec4-b153-cfdc0ddd6b01";
const PROJECT_ID = "3f5ea6ec-9ece-4481-90c1-6cb163bd346c";

export function mapConfigureFiltersToPayload(filters: ColumnFiltersState) {
  const payload: Record<string, any> = {};

  filters.forEach((filter) => {
    const { id, value } = filter;

    // Skip empty values
    if (
      value === undefined ||
      value === null ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return;
    }

    // ==========================================
    // 🔥 DATE RANGE HANDLING
    // ==========================================
    if (id === "createdAt") {
      if (typeof value === "object" && !Array.isArray(value)) {
        const dateValue = value as { from?: Date; to?: Date };

        const formatLocalDate = (date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        };

        if (dateValue.from || dateValue.to) {
          payload.date_range = {
            from: dateValue.from ? formatLocalDate(dateValue.from) : undefined,
            to: dateValue.to ? formatLocalDate(dateValue.to) : undefined,
          };
        }
      }
      return;
    }

    // ==========================================
    // FIELD MAPPINGS - MATCHING UNIVERSAL COLUMN KEYS
    // ==========================================
    switch (id) {
      // Furniture Type → product_mapping
      case "furnitureType":
        payload.product_mapping = value;
        break;

      // Furniture Structures → product_structure
      case "furnitueStructures":
        payload.product_structure = value;
        break;

      // Site Type → site_type
      case "siteType":
        payload.site_type = value;
        break;

      // Source → source
      case "source":
        payload.source = value;
        break;

      // Site Map Link → site_map_link
      case "site_map_link":
        payload.site_map_link = value;
        break;

      // Site Address → site_address
      case "siteAddress":
        payload.site_address = value;
        break;
    }
  });

  return payload;
}

export default function MachineMasterPage() {
  // const token = useAppSelector((s) => s.auth.token);
  const applyConfigMutation = useApplyConfiguration();

  // ── STATE ──────────────────────────────────────────────────────────────────

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    email: false,
    source: false,
    createdAt: false,
    furnitueStructures: false,
  });
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });

  // ── CONFIRMATION DIALOG STATE ──────────────────────────────────────────────

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    row: ConfigureLeadColumn | null;
  }>({
    open: false,
    row: null,
  });

  // ── API PAYLOAD ────────────────────────────────────────────────────────────

  const apiPayload: VendorLeadsPostPayload = useMemo(() => {
    const mappedFilters = mapConfigureFiltersToPayload(columnFilters);

    const payload = {
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      global_search: globalFilter || "",

      product_mapping: mappedFilters.product_mapping,
      product_structure: mappedFilters.product_structure,
      site_type: mappedFilters.site_type,
      source: mappedFilters.source,
      site_map_link: mappedFilters.site_map_link,
      site_address: mappedFilters.site_address,
      date_range: mappedFilters.date_range,
    };

    console.log("📤 API Payload:", payload);
    return payload;
  }, [pagination, globalFilter, columnFilters]);

  // ── API CALL ───────────────────────────────────────────────────────────────

  const finalToken = VENDOR_TOKEN;

  const { data, isLoading, error } = useVendorLeads(
    finalToken,
    PROJECT_ID,
    apiPayload,
  );

  console.log("📥 API Response:", { data, isLoading, error });

  // ── ROW MAPPER ─────────────────────────────────────────────────────────────

  const tableData = useMemo<ConfigureLeadColumn[]>(() => {
    const leads = data?.data ?? [];
    console.log("🔄 Mapping leads:", leads.length);

    return leads.map((lead) => ({
      id: lead.id,
      lead_code: lead.lead_code ?? "",
      name: `${lead.firstname ?? ""} ${lead.lastname ?? ""}`.trim(),
      contact: lead.contact_no ?? "",
      email: lead.email ?? "", // ✅ UNCOMMENTED
      siteAddress: lead.site_address ?? "",
      site_map_link: lead.site_map_link ?? "", // ✅ UNCOMMENTED
      account_name: lead.account?.name ?? "",
      account_email: lead.account?.email ?? null,
      furnitureType:
        lead.productMappings?.map((p: any) => p.productType?.type).join(", ") ??
        "",
      furnitueStructures:
        lead.productStructureInstances
          ?.map((p: any) => p.productStructure?.type)
          .join(", ") ?? "",
      instance_count: lead.productStructureInstances?.length ?? 0,
      account_id: lead.account?.id ?? 0,
      source: lead.source?.type ?? "",
      siteType: lead.siteType?.type ?? "",
      createdAt: lead.created_at ? new Date(lead.created_at).getTime() : "",
    }));
  }, [data]);

  console.log("📊 Table Data:", tableData.length, "rows");

  // ── CONFIGURE HANDLER ──────────────────────────────────────────────────────

  const handleConfigure = (row: ConfigureLeadColumn) => {
    setConfirmDialog({ open: true, row });
  };

  const handleConfirmConfigure = async () => {
    if (!confirmDialog.row) return;

    try {
      await applyConfigMutation.mutateAsync({
        projectId: PROJECT_ID,
        leadId: confirmDialog.row.id,
      });

      toast.success("Configuration applied successfully!");
      setConfirmDialog({ open: false, row: null });
    } catch (error) {
      toast.error("Failed to apply configuration");
      console.error("❌ Configuration error:", error);
    }
  };

  // ── COLUMNS ────────────────────────────────────────────────────────────────

  const columns = useMemo(
    () => getConfigureTableColumns({ onConfigure: handleConfigure }),
    [],
  );

  // ── TABLE INSTANCE ─────────────────────────────────────────────────────────

  const table = useReactTable<ConfigureLeadColumn>({
    data: tableData,
    columns,
    manualPagination: true,
    manualFiltering: false,
    pageCount: data?.pagination?.totalPages ?? 1,
    state: {
      sorting,
      globalFilter,
      columnVisibility,
      columnFilters,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.id.toString(),
  });

  const total = data?.count ?? 0;

  // ── UI ─────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── HEADER ── */}
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
                  Track Trace
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Configure</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="flex-1 overflow-x-hidden py-2">
        {/* Page header */}
        <div className="px-4 space-y-3">
          <div className="flex flex-col gap-2 md:flex-row items-start justify-between">
            <div>
              <h1 className="text-lg font-semibold">Lead Configuration</h1>
              <p className="text-sm text-muted-foreground hidden md:block">
                {isLoading
                  ? "Loading leads…"
                  : `${total} lead${total !== 1 ? "s" : ""} found for this project`}
              </p>
            </div>
          </div>

          {/* 📱 MOBILE FILTERS */}
          <div className="flex md:hidden gap-2 flex-wrap">
            <DataTableDateFilter
              column={table.getColumn("createdAt")!}
              title="Created At"
              multiple
            />
            <DataTableViewOptions table={table} />
          </div>

          {/* 📱 MOBILE SEARCH BAR */}
          <div className="md:hidden w-full">
            <ClearInput
              value={globalFilter}
              onChange={(e) => {
                setGlobalFilter(e.target.value);
                setPagination({ ...pagination, pageIndex: 0 });
              }}
              placeholder="Search leads…"
              className="h-8 w-full"
            />
          </div>
        </div>

        {/* DataTable */}
        <DataTable table={table} className="pt-3 px-4">
          {/* 🖥️ DESKTOP FILTERS */}
          <div className="hidden md:flex justify-between items-end">
            <div className="flex gap-3">
              <ClearInput
                value={globalFilter}
                onChange={(e) => {
                  setGlobalFilter(e.target.value);
                  setPagination({ ...pagination, pageIndex: 0 });
                }}
                placeholder="Search leads…"
                className="h-8 w-64"
              />

              <DataTableDateFilter
                column={table.getColumn("createdAt")!}
                title="Created At"
                multiple
              />
            </div>

            <div className="flex gap-2">
              <DataTableViewOptions table={table} />
            </div>
          </div>
        </DataTable>
      </main>

      {/* ── CONFIRMATION DIALOG ── */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          setConfirmDialog({ open, row: open ? confirmDialog.row : null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to apply configuration for{" "}
              <span className="font-semibold">{confirmDialog.row?.name}</span> (
              {confirmDialog.row?.lead_code})?
              <br />
              <br />
              This action will configure the lead with the selected settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={applyConfigMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmConfigure}
              disabled={applyConfigMutation.isPending}
            >
              {applyConfigMutation.isPending ? "Applying..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
