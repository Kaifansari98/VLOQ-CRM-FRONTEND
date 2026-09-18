"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  PaginationState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import ClearInput from "@/components/origin-input";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CheckCheck,
  Cog,
  PackageCheck,
  CalendarClock,
  Truck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  FileIcon,
  Download,
  RefreshCw,
  Trash2,
  Loader2,
} from "lucide-react";
import { useAppSelector } from "@/redux/store";
import {
  useMiscellaneousByStatus,
  MiscellaneousItem,
} from "@/api/miscellaneousModuleApi";
import { useDeleteMiscellaneousEntry } from "@/api/installation/useUnderInstallationStageLeads";
import InstallationMiscellaneous from "@/components/installation/under-installation/InstallationMiscellaneous";
import {
  getMiscellaneousStatusColumns,
  formatDate,
} from "./miscellaneous-status-columns";
import { cn } from "@/lib/utils";

// -------------------------------------------------------
// 🟣 STAGE CONFIG
// -------------------------------------------------------

export const STAGE_CONFIG: Record<
  string,
  {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }
> = {
  "awaiting-approval": {
    title: "Awaiting Approval",
    description: "Newly reported miscellaneous issues awaiting admin or supervisor review.",
    icon: Clock,
    color: "text-amber-500",
  },
  "misc-approved": {
    title: "Misc Approved",
    description: "Approved issues pending production scheduling and Expected Ready Date (ERD) assignment.",
    icon: CheckCheck,
    color: "text-purple-500",
  },
  "under-process": {
    title: "Under Process",
    description: "Approved issues with ERD scheduled, currently under fulfillment or production.",
    icon: Cog,
    color: "text-orange-500",
  },
  "ready-to-dispatch": {
    title: "RTD (Ready To Dispatch)",
    description: "Material is prepared and ready for dispatch from the factory/vendor.",
    icon: PackageCheck,
    color: "text-cyan-500",
  },
  "rtd": {
    title: "RTD (Ready To Dispatch)",
    description: "Material is prepared and ready for dispatch from the factory/vendor.",
    icon: PackageCheck,
    color: "text-cyan-500",
  },
  "dispatch-scheduled": {
    title: "Dispatch Scheduled",
    description: "Dispatch and delivery date has been scheduled for on-site transport.",
    icon: CalendarClock,
    color: "text-indigo-500",
  },
  "dispatched": {
    title: "Dispatched",
    description: "Materials are dispatched and in transit to the installation site.",
    icon: Truck,
    color: "text-blue-500",
  },
  "resolved": {
    title: "Resolved",
    description: "Miscellaneous issues successfully fulfilled, verified, and resolved.",
    icon: CheckCircle2,
    color: "text-emerald-500",
  },
  "rejected": {
    title: "Rejected",
    description: "Miscellaneous requests that were declined or rejected during review.",
    icon: XCircle,
    color: "text-rose-500",
  },
};

// -------------------------------------------------------
// 🟣 PROPS
// -------------------------------------------------------

export interface MiscellaneousStatusTableProps {
  status: string;
  title?: string;
  description?: string;
}

// -------------------------------------------------------
// 🟩 COMPONENT
// -------------------------------------------------------

export function MiscellaneousStatusTable({
  status,
  title,
  description,
}: MiscellaneousStatusTableProps) {
  const router = useRouter();

  // -------------------- GLOBAL STATE --------------------
  const user = useAppSelector((state) => state.auth.user);
  const selectedFranchiseId = useAppSelector((state) => state.auth.franchise_id);
  const userType = user?.user_type?.user_type
    ?.toLowerCase()
    .trim()
    .replace(/_/g, "-")
    .replace(/\s+/g, "-");
  const vendorId = user?.vendor_id ?? 0;
  const franchiseId = selectedFranchiseId ?? user?.franchise_id ?? undefined;
  const userId = user?.id;

  const isSuperAdmin = useMemo(() => {
    const role = (user?.user_role || "").toLowerCase().trim();
    const rawType =
      typeof user?.user_type === "object"
        ? (user.user_type as any)?.user_type ||
          (user.user_type as any)?.user_type_name ||
          (user.user_type as any)?.name ||
          ""
        : String(user?.user_type || "");
    const type = rawType.toLowerCase().trim();

    return (
      role.includes("super-admin") ||
      role.includes("superadmin") ||
      role.includes("super_admin") ||
      type.includes("super-admin") ||
      type.includes("superadmin") ||
      type.includes("super_admin")
    );
  }, [user]);

  const skipFranchiseFilter =
    userType === "factory" ||
    userType === "miscellaneous" ||
    userType === "super-admin" ||
    userType === "site-supervisor" ||
    userType === "head-site-supervisor" ||
    userType === "auditor";

  // -------------------- LOCAL STATE --------------------
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    quantity: false,
    cost: false,
  });

  const [selectedItemForDocs, setSelectedItemForDocs] =
    useState<MiscellaneousItem | null>(null);
  const [selectedItemForDetail, setSelectedItemForDetail] =
    useState<MiscellaneousItem | null>(null);
  const [selectedItemForEdit, setSelectedItemForEdit] =
    useState<MiscellaneousItem | null>(null);
  const [itemToDelete, setItemToDelete] =
    useState<MiscellaneousItem | null>(null);

  const deleteMutation = useDeleteMiscellaneousEntry();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // -------------------- QUERY PAYLOAD --------------------
  const payload = useMemo(
    () => ({
      status,
      franchise_id: skipFranchiseFilter ? undefined : franchiseId,
      user_type: userType,
      user_id: userId,
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      global_search: debouncedSearch || undefined,
    }),
    [
      status,
      skipFranchiseFilter,
      franchiseId,
      userType,
      userId,
      pagination.pageIndex,
      pagination.pageSize,
      debouncedSearch,
    ],
  );

  const { data, isFetching, refetch } = useMiscellaneousByStatus(
    vendorId,
    payload,
  );

  const entries: MiscellaneousItem[] = data?.miscellaneous || data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;

  // -------------------- CONFIG --------------------
  const config = STAGE_CONFIG[status] || {
    title:
      title ||
      status
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
    description:
      description || "Manage and track miscellaneous issues in this stage.",
    icon: AlertCircle,
    color: "text-primary",
  };

  const headerTitle = title || config.title;
  const headerDescription = description || config.description;

  // -------------------- NAVIGATION HANDLERS --------------------
  const handleOpenLead = (leadId: number, accountId: number) => {
    router.push(
      `/dashboard/installation/under-installation/details/${leadId}?accountId=${accountId}&tab=misc`,
    );
  };

  const handleOpenDetail = (item: MiscellaneousItem) => {
    setSelectedItemForDetail(item);
  };

  const handleOpenDocs = (item: MiscellaneousItem) => {
    setSelectedItemForDocs(item);
  };

  const handleOpenEdit = (item: MiscellaneousItem) => {
    setSelectedItemForEdit(item);
  };

  const handleDeleteItem = (item: MiscellaneousItem) => {
    setItemToDelete(item);
  };

  // -------------------- COLUMNS & TABLE --------------------
  const columns = useMemo(
    () =>
      getMiscellaneousStatusColumns({
        onOpenLead: handleOpenLead,
        onOpenDetail: handleOpenDetail,
        onOpenEdit: handleOpenEdit,
        onOpenDocs: handleOpenDocs,
        onDelete: handleDeleteItem,
        isSuperAdmin,
        statusSlug: status,
      }),
    [status, isSuperAdmin],
  );

  const table = useReactTable({
    data: entries,
    columns,
    pageCount: totalPages,
    state: {
      pagination,
      sorting,
      columnVisibility,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    getRowId: (row) => String(row.id),
  });

  // -------------------- RENDER --------------------
  return (
    <div className="py-2">
      {/* 📱 MOBILE & DESKTOP HEADER (Consistent with Overall Leads) */}
      <div className="px-4 space-y-3">
        {/* Title & Description */}
        <div className="flex flex-col gap-2 md:flex-row items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold">{headerTitle}</h1>
            <p className="text-sm text-muted-foreground hidden md:block">
              {headerDescription}
            </p>
          </div>
        </div>

        {/* 📱 MOBILE CONTROLS */}
        <div className="flex md:hidden gap-2 flex-wrap items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8 px-2.5 gap-1.5 text-xs"
          >
            <RefreshCw
              className={cn(
                "w-3.5 h-3.5",
                isFetching && "animate-spin text-primary",
              )}
            />
            Refresh
          </Button>

          <DataTableViewOptions table={table} />
        </div>

        {/* 📱 MOBILE SEARCH BAR (Full Width) */}
        <div className="md:hidden w-full">
          <ClearInput
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            placeholder="Search by lead, customer, problem..."
            className="h-8 w-full"
          />
        </div>
      </div>

      {/* 🖥️ CORE DATA TABLE (Standard Furnix DataTable) */}
      <DataTable
        table={table}
        onRowClick={(row) => setSelectedItemForDetail(row)}
        className="pt-3 px-4"
        showPagination={true}
      >
        {/* 🖥️ DESKTOP FILTERS (Horizontal Layout matching Overall Leads) */}
        <div className="hidden md:flex justify-between items-end">
          <div className="flex gap-3 items-center">
            <ClearInput
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              placeholder="Search by lead, customer, problem..."
              className="h-8 w-64"
            />

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-8 px-2.5 gap-1.5 text-xs"
            >
              <RefreshCw
                className={cn(
                  "w-3.5 h-3.5",
                  isFetching && "animate-spin text-primary",
                )}
              />
              Refresh
            </Button>
          </div>

          <div className="flex gap-2">
            <DataTableViewOptions table={table} />
          </div>
        </div>
      </DataTable>

      {/* ── Documents Modal ── */}
      <Dialog
        open={!!selectedItemForDocs}
        onOpenChange={(open) => {
          if (!open) setSelectedItemForDocs(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-primary" />
              Attached Documents ({selectedItemForDocs?.documents?.length ?? 0})
            </DialogTitle>
            <DialogDescription>
              Lead:{" "}
              <span className="font-medium text-foreground">
                {selectedItemForDocs?.lead?.lead_code}
              </span>{" "}
              • Issue:{" "}
              <span className="font-medium text-foreground">
                {selectedItemForDocs?.type?.name}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
            {!selectedItemForDocs?.documents?.length ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No documents uploaded for this issue.
              </p>
            ) : (
              selectedItemForDocs.documents.map((doc) => {
                const isImage =
                  doc.original_name.match(/\.(jpeg|jpg|gif|png|webp)$/i) ||
                  doc.file_key.match(/\.(jpeg|jpg|gif|png|webp)$/i);

                return (
                  <div
                    key={doc.document_id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/40 transition-colors gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {isImage && doc.signed_url ? (
                        <div className="w-12 h-12 rounded-md overflow-hidden bg-muted border shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={doc.signed_url}
                            alt={doc.original_name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-muted/70 flex items-center justify-center shrink-0">
                          <FileIcon className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {doc.original_name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {doc.doc_type_name && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0"
                            >
                              {doc.doc_type_name}
                            </Badge>
                          )}
                          <span className="text-[11px] text-muted-foreground">
                            {formatDate(doc.uploaded_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {doc.signed_url ? (
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                          className="h-8 gap-1.5"
                        >
                          <a
                            href={doc.signed_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Open
                          </a>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Link unavailable
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <AlertDialog
        open={Boolean(itemToDelete)}
        onOpenChange={(open) => {
          if (!open) setItemToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              Delete Miscellaneous Entry?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Are you sure you want to delete this miscellaneous entry (
              <span className="font-semibold text-foreground">
                {itemToDelete?.type?.name || "Miscellaneous"}
              </span>
              )? This will permanently remove the entry, its associated documents, team assignments, followups, and close linked tasks. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white font-medium"
              disabled={deleteMutation.isPending || !itemToDelete}
              onClick={(e) => {
                e.preventDefault();
                if (!itemToDelete) return;
                deleteMutation.mutate(
                  {
                    vendorId: itemToDelete.vendor_id,
                    leadId: itemToDelete.lead_id,
                    miscId: itemToDelete.id,
                    deleted_by: userId!,
                  },
                  {
                    onSuccess: () => {
                      setItemToDelete(null);
                      refetch();
                    },
                  },
                );
              }}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Exact Full-Featured Miscellaneous Action & Detail Modal ── */}
      {selectedItemForDetail && (
        <InstallationMiscellaneous
          vendorId={selectedItemForDetail.vendor_id}
          leadId={selectedItemForDetail.lead_id}
          accountId={selectedItemForDetail.account_id}
          initialMiscId={selectedItemForDetail.id}
          initialItemData={selectedItemForDetail as any}
          onlyModal={true}
          onModalClose={() => {
            setSelectedItemForDetail(null);
            refetch();
          }}
        />
      )}

      {/* ── Direct Edit Modal ── */}
      {selectedItemForEdit && (
        <InstallationMiscellaneous
          vendorId={selectedItemForEdit.vendor_id}
          leadId={selectedItemForEdit.lead_id}
          accountId={selectedItemForEdit.account_id}
          initialMiscId={selectedItemForEdit.id}
          initialItemData={selectedItemForEdit as any}
          initialOpenEdit={true}
          onlyModal={true}
          onModalClose={() => {
            setSelectedItemForEdit(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}

export default MiscellaneousStatusTable;
