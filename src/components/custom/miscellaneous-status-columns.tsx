"use client";

import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CustomeTooltip from "@/components/custom-tooltip";
import { FileText, ExternalLink, Eye, Trash2, Pencil } from "lucide-react";
import { MiscellaneousItem } from "@/api/miscellaneousModuleApi";

export const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "-";
  }
};

export const renderStatusBadge = (entry: MiscellaneousItem) => {
  let label = entry.status_label;
  if (!label) {
    if (entry.is_resolved) {
      label = "RESOLVED";
    } else if (entry.misc_approved === false) {
      label = "REJECTED";
    } else if (entry.misc_approved !== true) {
      label = "AWAITING APPROVAL";
    } else if (entry.delivery_task?.status === "completed") {
      label = "DISPATCHED";
    } else if (entry.required_delivery_date) {
      label = "DISPATCH SCHEDULED";
    } else if (entry.expected_ready_date && entry.task?.status === "completed") {
      label = "RTD";
    } else if (entry.expected_ready_date) {
      label = "UNDER PROCESS";
    } else {
      label = "MISCL APPROVED";
    }
  }

  let className =
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800";

  if (label === "REJECTED") {
    className =
      "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800";
  } else if (label === "RESOLVED") {
    className =
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
  } else if (label === "DISPATCHED") {
    className =
      "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800";
  } else if (label === "DISPATCH SCHEDULED") {
    className =
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800";
  } else if (label === "RTD" || label === "READY TO DISPATCH") {
    className =
      "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800";
  } else if (label === "UNDER PROCESS") {
    className =
      "bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300 border-orange-200 dark:border-orange-800";
  } else if (label === "MISCL APPROVED") {
    className =
      "bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800";
  }

  return (
    <Badge
      variant="outline"
      className={`text-xs px-2.5 py-0.5 font-semibold whitespace-nowrap border ${className}`}
    >
      {label}
    </Badge>
  );
};

export interface MiscellaneousColumnActions {
  onOpenLead: (leadId: number, accountId: number) => void;
  onOpenDetail: (item: MiscellaneousItem) => void;
  onOpenEdit?: (item: MiscellaneousItem) => void;
  onOpenDocs: (item: MiscellaneousItem) => void;
  onDelete?: (item: MiscellaneousItem) => void;
  isSuperAdmin?: boolean;
  statusSlug: string;
}

export function getMiscellaneousStatusColumns(
  actions: MiscellaneousColumnActions
): ColumnDef<MiscellaneousItem>[] {
  const { onOpenLead, onOpenDetail, onOpenEdit, onOpenDocs, onDelete, isSuperAdmin, statusSlug } = actions;
  const isDeliveryView =
    statusSlug === "dispatch-scheduled" || statusSlug === "dispatched";

  return [
    // 1) Lead Code
    {
      id: "lead_code",
      accessorFn: (row) => row.lead?.lead_code || `Lead #${row.lead_id}`,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Lead Code" />
      ),
      cell: ({ row }) => {
        const item = row.original;
        const leadCode = item.lead?.lead_code || `Lead #${item.lead_id}`;
        const franchiseName = item.lead?.franchise?.franchise_name;

        return (
          <div className="flex flex-col gap-0.5 min-w-[110px]">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 text-left"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenLead(item.lead_id, item.account_id);
                }}
                title="Open Lead"
              >
                {leadCode}
                <ExternalLink className="w-3 h-3 opacity-70 shrink-0" />
              </button>
            </div>
            {franchiseName && (
              <span className="text-[11px] text-muted-foreground truncate">
                {franchiseName}
              </span>
            )}
          </div>
        );
      },
      enableSorting: true,
      enableHiding: false,
    },

    // 2) Customer Name & Contact
    {
      id: "customer",
      accessorFn: (row) =>
        `${row.lead?.firstname || ""} ${row.lead?.lastname || ""}`.trim(),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Customer" />
      ),
      cell: ({ row }) => {
        const item = row.original;
        const customerName =
          `${item.lead?.firstname || ""} ${item.lead?.lastname || ""}`.trim() ||
          "-";
        const contact = item.lead?.contact_no;

        return (
          <div className="flex flex-col gap-0.5 min-w-[130px]">
            <span className="text-xs font-medium text-foreground truncate">
              {customerName}
            </span>
            {contact && (
              <span className="text-[11px] text-muted-foreground">
                {contact}
              </span>
            )}
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
    },

    // 3) Type
    {
      id: "type",
      accessorFn: (row) => row.type?.name || "Miscellaneous",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => {
        const item = row.original;
        const typeName = item.type?.name || "Miscellaneous";

        return (
          <div className="flex flex-col gap-0.5 min-w-[120px]">
            <span className="text-xs font-semibold text-foreground truncate">
              {typeName}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {formatDate(item.created_at)}
            </span>
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
    },

    // 4) Date (ERD / Delivery Date)
    {
      id: "date",
      accessorFn: (row) =>
        isDeliveryView
          ? row.required_delivery_date || row.expected_ready_date || ""
          : row.expected_ready_date || "",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={isDeliveryView ? "Delivery Date" : "ERD"}
        />
      ),
      cell: ({ row }) => {
        const item = row.original;
        if (isDeliveryView) {
          return item.required_delivery_date ? (
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-medium text-foreground">
                {formatDate(item.required_delivery_date)}
              </span>
              {item.expected_ready_date && (
                <span className="text-[10px] text-muted-foreground">
                  ERD: {formatDate(item.expected_ready_date)}
                </span>
              )}
            </div>
          ) : item.expected_ready_date ? (
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-medium text-foreground">
                {formatDate(item.expected_ready_date)}
              </span>
              <span className="text-[10px] text-muted-foreground">ERD</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          );
        }

        return item.expected_ready_date ? (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium text-foreground">
              {formatDate(item.expected_ready_date)}
            </span>
            {item.solution && (
              <CustomeTooltip
                value={item.solution}
                truncateValue={
                  <span className="text-[10px] text-muted-foreground truncate max-w-[130px] cursor-help">
                    {item.solution}
                  </span>
                }
              />
            )}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        );
      },
      enableSorting: true,
      enableHiding: true,
    },

    // 5) Responsible Teams
    {
      id: "teams",
      accessorFn: (row) => row.teams?.map((t) => t.team_name).join(", ") || "",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Responsible Teams" />
      ),
      cell: ({ row }) => {
        const item = row.original;
        if (!item.teams || item.teams.length === 0) {
          return <span className="text-xs text-muted-foreground">-</span>;
        }

        return (
          <div className="flex flex-wrap gap-1 items-center max-w-[160px]">
            {item.teams.slice(0, 2).map((team) => (
              <Badge
                key={team.team_id}
                variant="secondary"
                className="text-[11px] px-1.5 py-0 font-normal"
              >
                {team.team_name}
              </Badge>
            ))}
            {item.teams.length > 2 && (
              <CustomeTooltip
                value={item.teams.map((t) => t.team_name).join(", ")}
                truncateValue={
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1 py-0 cursor-pointer font-medium"
                  >
                    +{item.teams.length - 2}
                  </Badge>
                }
              />
            )}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: true,
    },

    // 6) Docs
    {
      id: "documents",
      header: () => (
        <div className="text-center font-extrabold text-foreground">Docs</div>
      ),
      cell: ({ row }) => {
        const item = row.original;
        const count = item.documents?.length || 0;

        return (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 gap-1 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDocs(item);
              }}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">{count}</span>
            </Button>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: true,
    },

    // 7) Status
    {
      id: "status",
      header: () => (
        <div className="text-center font-extrabold text-foreground">Status</div>
      ),
      cell: ({ row }) => (
        <div className="flex justify-center">
          {renderStatusBadge(row.original)}
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },

    // 8) Problem Description / Material Details
    {
      id: "problem_description",
      accessorKey: "problem_description",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Problem / Material" />
      ),
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex flex-col gap-0.5 max-w-[220px]">
            {item.reorder_material_details && (
              <span
                className="text-xs font-medium text-foreground truncate"
                title={item.reorder_material_details}
              >
                {item.reorder_material_details}
              </span>
            )}
            {item.problem_description ? (
              <CustomeTooltip
                value={item.problem_description}
                truncateValue={
                  <span className="text-[11px] text-muted-foreground truncate cursor-help">
                    {item.problem_description}
                  </span>
                }
              />
            ) : (
              <span className="text-xs text-muted-foreground">-</span>
            )}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: true,
    },

    // 9) Qty
    {
      id: "quantity",
      accessorKey: "quantity",
      header: () => (
        <div className="text-right font-extrabold text-foreground">Qty</div>
      ),
      cell: ({ row }) => (
        <div className="text-right text-xs font-medium">
          {row.original.quantity ?? "-"}
        </div>
      ),
      enableSorting: true,
      enableHiding: true,
    },

    // 10) Cost
    {
      id: "cost",
      accessorKey: "cost",
      header: () => (
        <div className="text-right font-extrabold text-foreground">Cost</div>
      ),
      cell: ({ row }) => {
        const cost = row.original.cost;
        return (
          <div className="text-right text-xs font-medium">
            {cost !== null && cost !== undefined
              ? `₹${Number(cost).toLocaleString("en-IN")}`
              : "-"}
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
    },

    // 11) Actions
    {
      id: "actions",
      header: () => null,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <CustomeTooltip
              value="View Details"
              truncateValue={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDetail(item);
                  }}
                >
                  <Eye className="w-3.5 h-3.5" />
                </Button>
              }
            />
            {onOpenEdit && (isSuperAdmin || item.misc_approved !== true) && (
              <CustomeTooltip
                value="Edit miscellaneous"
                truncateValue={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenEdit(item);
                    }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                }
              />
            )}
            <CustomeTooltip
              value="Go to Project Stage"
              truncateValue={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenLead(item.lead_id, item.account_id);
                  }}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              }
            />
            {isSuperAdmin && onDelete && (
              <CustomeTooltip
                value="Delete miscellaneous"
                truncateValue={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(item);
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                }
              />
            )}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
