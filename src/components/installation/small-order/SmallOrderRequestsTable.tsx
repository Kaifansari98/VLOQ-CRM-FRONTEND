"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { ExternalLink } from "lucide-react";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/redux/store";
import {
  useLeadById,
  useMarkSmallOrderRequestResolved,
  useSmallOrderRequestsByLead,
} from "@/hooks/useLeadsQueries";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageComponent } from "@/components/utils/ImageCard";
import DocumentCard from "@/components/utils/documentCard";
import CustomeTooltip from "@/components/custom-tooltip";
import { toastManager } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

type SmallOrderRequestDocument = {
  id: number;
  document_id: number;
  original_name: string;
  signed_url: string | null;
  created_at: string;
};

type SmallOrderRequestRow = {
  srNo: number;
  id: number;
  so_code: string | null;
  request_type: string;
  request_source: "post_dispatch" | "final_handover";
  status: "pending_approval" | "pending_approvals" | "approved" | "rejected";
  is_request_resolved: boolean;
  required_date: string;
  requested_by: string;
  created_at: string;
  supervisor_approved: boolean;
  admin_approved: boolean;
  document_count: number;
  remarks: string | null;
  documents: SmallOrderRequestDocument[];
  linked_lead_id: number | null;
  linked_lead_account_id: number | null;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatLabel(value?: string | null) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "—";

  return normalized
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatRequestSource(value?: SmallOrderRequestRow["request_source"] | null) {
  if (value === "post_dispatch") return "Under Installation";
  if (value === "final_handover") return "Final Handover";
  return "—";
}

function isImageFile(fileName?: string | null) {
  const extension = String(fileName ?? "")
    .split(".")
    .pop()
    ?.toLowerCase();

  return ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(
    extension ?? "",
  );
}

function StatusBadge({
  value,
}: {
  value: SmallOrderRequestRow["status"];
}) {
  const normalized = String(value ?? "").toLowerCase();
  const classes =
    normalized === "approved"
      ? "border-emerald-200 bg-emerald-500/10 text-emerald-600"
      : normalized === "rejected"
        ? "border-rose-200 bg-rose-500/10 text-rose-600"
        : "border-amber-200 bg-amber-500/10 text-amber-600";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        classes,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {formatLabel(value)}
    </span>
  );
}

function ApprovalBadge({ approved }: { approved: boolean }) {
  return approved ? (
    <Badge
      variant="outline"
      className="border-emerald-200 bg-emerald-500/10 text-emerald-600"
    >
      Approved
    </Badge>
  ) : (
    <Badge variant="outline" className="text-muted-foreground">
      Pending
    </Badge>
  );
}

function ResolutionBadge({ resolved }: { resolved: boolean }) {
  return resolved ? (
    <Badge
      variant="outline"
      className="border-emerald-200 bg-emerald-500/10 text-emerald-600"
    >
      Resolved
    </Badge>
  ) : (
    <Badge variant="outline" className="text-muted-foreground">
      Pending
    </Badge>
  );
}

const columns: ColumnDef<SmallOrderRequestRow>[] = [
  {
    accessorKey: "srNo",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Sr. No." />
    ),
    cell: ({ row }) => <span className="font-medium">{row.original.srNo}</span>,
    enableSorting: false,
  },
  {
    accessorKey: "so_code",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Partial Order Lead" />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {row.original.so_code || "Not generated yet"}
      </span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "request_type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type of Order" />
    ),
    enableSorting: false,
  },
  {
    accessorKey: "request_source",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Source" />
    ),
    cell: ({ row }) => formatLabel(row.original.request_source),
    enableSorting: false,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => <StatusBadge value={row.original.status} />,
    enableSorting: false,
  },
  {
    accessorKey: "is_request_resolved",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Resolved" />
    ),
    cell: ({ row }) => (
      <ResolutionBadge resolved={row.original.is_request_resolved} />
    ),
    enableSorting: false,
  },
  {
    accessorKey: "required_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Required Date" />
    ),
    cell: ({ row }) => formatDate(row.original.required_date),
    enableSorting: false,
  },
  {
    accessorKey: "requested_by",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Requested By" />
    ),
    enableSorting: false,
  },
  {
    accessorKey: "supervisor_approved",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Supervisor" />
    ),
    cell: ({ row }) => (
      <ApprovalBadge approved={row.original.supervisor_approved} />
    ),
    enableSorting: false,
  },
  {
    accessorKey: "admin_approved",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Admin" />
    ),
    cell: ({ row }) => <ApprovalBadge approved={row.original.admin_approved} />,
    enableSorting: false,
  },
  {
    accessorKey: "document_count",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Documents" />
    ),
    enableSorting: false,
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created At" />
    ),
    cell: ({ row }) => formatDate(row.original.created_at),
    enableSorting: false,
  },
  {
    accessorKey: "remarks",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Remarks" />
    ),
    cell: ({ row }) => (
      <span className="line-clamp-2 max-w-[280px] text-sm">
        {row.original.remarks?.trim() || "—"}
      </span>
    ),
    enableSorting: false,
  },
];

function SmallOrderRequestPreviewModal({
  open,
  onOpenChange,
  request,
  onOpenDetailsPage,
  vendorId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: SmallOrderRequestRow | null;
  onOpenDetailsPage: (request: SmallOrderRequestRow) => void;
  vendorId: number;
}) {
  const userId = useAppSelector((state) => state.auth.user?.id);
  const queryClient = useQueryClient();
  const markResolvedMutation = useMarkSmallOrderRequestResolved();
  const { data: linkedLeadResponse } = useLeadById(
    request?.linked_lead_id ?? undefined,
    vendorId,
    userId,
  );

  if (!request) return null;

  const linkedLead = linkedLeadResponse?.data?.lead;

  const canOpenDetailsPage =
    request.status === "approved" &&
    Boolean(request.linked_lead_id) &&
    Boolean(request.linked_lead_account_id);

  const linkedLeadStatusTag = linkedLead?.statusType?.tag ?? null;
  const isType15 = linkedLeadStatusTag === "Type 15";
  const isPostDispatchRequest = request.request_source === "post_dispatch";
  const isFinalHandoverRequest = request.request_source === "final_handover";
  const hasCompletedInstallations =
    linkedLead?.is_shutter_installation_completed === true &&
    linkedLead?.is_carcass_installation_completed === true;

  const canMarkResolved = request.is_request_resolved
    ? false
    : isFinalHandoverRequest
      ? isType15 && hasCompletedInstallations
      : isPostDispatchRequest
        ? isType15
        : false;

  const markResolvedTooltip = request.is_request_resolved
    ? "This partial order request is already resolved."
    : !request.linked_lead_id
      ? "Linked partial order lead is not available yet."
      : !linkedLead
        ? "Loading linked lead status..."
        : isFinalHandoverRequest && !isType15
          ? "Mark as Resolved is enabled only when the request is fullfilled."
          : isFinalHandoverRequest && !hasCompletedInstallations
              ? "Mark as Resolved is enabled only after both carcass and shutter installation are completed."
            : isPostDispatchRequest && !isType15
              ? "Mark as Resolved is enabled only when the request is fullfilled."
              : null;

  const handleMarkResolved = () => {
    if (!userId || !vendorId || !request?.id || !canMarkResolved) {
      return;
    }

    markResolvedMutation.mutate(
      {
        vendorId,
        requestId: request.id,
        updatedBy: userId,
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Partial order request marked as resolved successfully.",
            type: "success",
          });
          queryClient.invalidateQueries({
            queryKey: ["smallOrderRequestsByLead"],
            exact: false,
          });
          if (request.linked_lead_id) {
            queryClient.invalidateQueries({
              queryKey: ["lead", request.linked_lead_id, vendorId, userId],
            });
          }
          onOpenChange(false);
        },
        onError: (error: unknown) => {
          toastManager.add({
            title: getErrorMessage(error),
            type: "error",
          });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[95vw] max-w-4xl flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b bg-muted/30 px-6 py-4">
          <DialogTitle className="text-left text-2xl font-semibold">
            Partial Order Request
          </DialogTitle>
          <DialogDescription className="text-left text-sm text-muted-foreground">
            Review the details submitted when this partial order request was created.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border bg-background p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Raised From
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {formatRequestSource(request.request_source)}
              </p>
            </div>

            <div className="rounded-2xl border bg-background p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Type Of Order
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {request.request_type}
              </p>
            </div>

            <div className="rounded-2xl border bg-background p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Required Date
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {formatDate(request.required_date)}
              </p>
            </div>

            <div className="rounded-2xl border bg-background p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Created At
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {formatDate(request.created_at)}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border bg-background p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Remarks
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
              {request.remarks?.trim() || "—"}
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Uploaded Files
              </p>
              <p className="text-xs text-muted-foreground">
                Documents and images attached during request creation.
              </p>
            </div>

            {request.documents.length === 0 ? (
              <div className="rounded-2xl border bg-background p-4 text-sm text-muted-foreground">
                No files were uploaded with this request.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {request.documents
                  .filter((doc) => doc.signed_url)
                  .map((doc) =>
                    isImageFile(doc.original_name) ? (
                      <ImageComponent
                        key={doc.id}
                        doc={{
                          id: doc.document_id,
                          doc_og_name: doc.original_name,
                          signedUrl: doc.signed_url!,
                          created_at: doc.created_at,
                        }}
                        disableActions
                      />
                    ) : (
                      <DocumentCard
                        key={doc.id}
                        doc={{
                          id: doc.document_id,
                          originalName: doc.original_name,
                          signedUrl: doc.signed_url!,
                          created_at: doc.created_at,
                        }}
                        disableActions
                      />
                    ),
                  )}
              </div>
            )}
          </div>

          {!canOpenDetailsPage ? (
            <div className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
              Details page becomes available after the partial order request is approved and its linked lead is created.
            </div>
          ) : null}
        </div>

        <DialogFooter className="shrink-0 border-t px-6 py-4">
          {canMarkResolved ? (
            <Button
              variant="outline"
              onClick={handleMarkResolved}
              disabled={markResolvedMutation.isPending}
            >
              {markResolvedMutation.isPending ? "Saving..." : "Mark as Resolved"}
            </Button>
          ) : (
            <CustomeTooltip
              value={markResolvedTooltip ?? "Mark as Resolved is not available."}
              truncateValue={
                <Button variant="outline" disabled>
                  {request.is_request_resolved ? "Resolved" : "Mark as Resolved"}
                </Button>
              }
            />
          )}
          <Button
            onClick={() => onOpenDetailsPage(request)}
            disabled={!canOpenDetailsPage}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Details Page
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function SmallOrderRequestsTable({
  vendorId,
  leadId,
  requestSource,
}: {
  vendorId: number;
  leadId: number;
  requestSource?: "post_dispatch" | "final_handover";
}) {
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [selectedRequest, setSelectedRequest] =
    React.useState<SmallOrderRequestRow | null>(null);
  const { data, isLoading, isError, error } = useSmallOrderRequestsByLead(
    vendorId,
    leadId,
  );

  const tableData = React.useMemo<SmallOrderRequestRow[]>(
    () =>
      (data?.data ?? [])
        .filter((request) =>
          requestSource ? request.request_source === requestSource : true,
        )
        .map((request, index) => ({
        srNo: index + 1,
        id: request.id,
        so_code: request.so_code,
        request_type: request.requestType?.type ?? "—",
        request_source: request.request_source,
        status: request.status,
        is_request_resolved: request.is_request_resolved,
        required_date: request.required_date,
        requested_by: request.createdBy?.user_name?.trim() || "—",
        created_at: request.created_at,
        supervisor_approved: request.supervisor_approved,
        admin_approved: request.admin_approved,
        document_count: request.document_count ?? 0,
        remarks: request.remarks,
        documents: request.documents ?? [],
        linked_lead_id: request.linked_lead?.id ?? null,
        linked_lead_account_id: request.linked_lead?.account_id ?? null,
      })),
    [data, requestSource],
  );

  const handleOpenDetailsPage = React.useCallback(
    (row: SmallOrderRequestRow) => {
      if (
        row.status !== "approved" ||
        !row.linked_lead_id ||
        !row.linked_lead_account_id
      ) {
        return;
      }

      setSelectedRequest(null);
      router.push(
        `/dashboard/leads/details/${row.linked_lead_id}?accountId=${row.linked_lead_account_id}`,
      );
    },
    [router],
  );

  const table = useReactTable({
    data: tableData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
  });

  return (
    <Card className="rounded-2xl border-0 p-0 shadow-none">
      <CardContent className="p-0">
        {isLoading ? (
          <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">
            Loading partial order requests...
          </div>
        ) : isError ? (
          <div className="rounded-lg border bg-background p-6 text-sm text-destructive">
            {(error as any)?.response?.data?.message ??
              error?.message ??
              "Failed to load partial order requests."}
          </div>
        ) : tableData.length === 0 ? (
          <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">
            No partial order requests found for this lead.
          </div>
        ) : (
          <>
            <DataTable
              table={table}
              onRowClick={(row) => setSelectedRequest(row)}
              rowClassName={() => "cursor-pointer"}
            />
            <SmallOrderRequestPreviewModal
              open={Boolean(selectedRequest)}
              onOpenChange={(open) => {
                if (!open) {
                  setSelectedRequest(null);
                }
              }}
              request={selectedRequest}
              onOpenDetailsPage={handleOpenDetailsPage}
              vendorId={vendorId}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
