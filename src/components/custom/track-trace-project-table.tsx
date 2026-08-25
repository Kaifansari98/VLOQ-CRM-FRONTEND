"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { cn } from "@/lib/utils";

import {
  ProjectSortBy,
  ProjectSortOrder,
  TrackTraceProjectListRow,
} from "@/api/track-trace/track-trace.api";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Layers,
  MoreHorizontal,
  PackageOpen,
  Pencil,
  Trash2,
} from "lucide-react";

import { useAppSelector } from "@/redux/store";

interface TrackTraceProjectTableProps {
  table: TrackTraceProjectListRow[];

  page: number;
  limit: number;

  sortBy?: ProjectSortBy;
  sortOrder?: ProjectSortOrder;

  onSort?: (field: ProjectSortBy) => void;

  onRowDoubleClick?: (
    row: TrackTraceProjectListRow
  ) => void;

  onCutListClick?: (
    row: TrackTraceProjectListRow
  ) => void;

  onProjectDetailClick?: (
    row: TrackTraceProjectListRow
  ) => void;

  onEditClick?: (
    row: TrackTraceProjectListRow
  ) => void;

  onDeleteClick?: (
    row: TrackTraceProjectListRow
  ) => void;

  isDeleting?: boolean;

  className?: string;
}

export default function TrackTraceProjectTable({
  table,

  page,
  limit,

  sortBy,
  sortOrder,

  onSort,

  onRowDoubleClick,
  onCutListClick,
  onProjectDetailClick,
  onEditClick,
  onDeleteClick,

  isDeleting = false,

  className,
}: TrackTraceProjectTableProps) {
  const userTypeId = useAppSelector(
    (state) => state.auth.user?.user_type_id
  );

  /*
   * 1 = Super Admin
   * 2 = Admin
   */
  const canDelete =
    userTypeId === 1 || userTypeId === 2;

  const renderSortIcon = (
    field: ProjectSortBy
  ) => {
    if (sortBy !== field) {
      return (
        <ArrowUpDown
          size={13}
          className="opacity-50"
        />
      );
    }

    if (sortOrder === "asc") {
      return <ArrowUp size={13} />;
    }

    return <ArrowDown size={13} />;
  };

  const sortableHeader = (
    label: string,
    field: ProjectSortBy
  ) => {
    return (
      <button
        type="button"
        onClick={() => onSort?.(field)}
        className="
          inline-flex
          items-center
          gap-1.5
          hover:text-foreground
          transition-colors
        "
      >
        {label}

        {renderSortIcon(field)}
      </button>
    );
  };

  if (table.length === 0) {
    return (
      <div
        className={cn(
          "rounded-md border py-12 text-center text-sm text-muted-foreground",
          className
        )}
      >
        No projects found.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-md border overflow-x-auto",
        className
      )}
    >
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="text-xs font-black uppercase w-14">
              #
            </TableHead>

            <TableHead className="text-xs font-black uppercase">
              {sortableHeader(
                "Order No.",
                "order_no"
              )}
            </TableHead>

            <TableHead className="text-xs font-black uppercase">
              {sortableHeader(
                "Project Name",
                "project_name"
              )}
            </TableHead>

            <TableHead className="text-xs font-black uppercase">
              {sortableHeader(
                "T&T Status",
                "track_trace_status"
              )}
            </TableHead>

            <TableHead className="text-xs font-black uppercase">
              Client
            </TableHead>

            <TableHead className="text-xs font-black uppercase">
              Contact
            </TableHead>

            <TableHead className="text-xs font-black uppercase">
              {sortableHeader(
                "Created",
                "created_at"
              )}
            </TableHead>

            <TableHead className="w-[70px] text-xs font-black uppercase text-center">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {table.map((row, idx) => {
            const serialNumber =
              (page - 1) * limit +
              idx +
              1;

            return (
              <TableRow
                key={
                  row.unique_project_id ??
                  row.id
                }
                className={cn(
                  row.isDeleted
                    ? "bg-muted/30 opacity-75"
                    : "hover:bg-primary/5 cursor-pointer"
                )}
                onDoubleClick={() => {
                  if (!row.isDeleted) {
                    onRowDoubleClick?.(
                      row
                    );
                  }
                }}
              >
                {/* Serial No */}

                <TableCell className="text-xs text-muted-foreground font-mono">
                  {serialNumber}
                </TableCell>

                {/* Order No */}

                <TableCell>
                  <span className="font-medium">
                    {row.order_no ||
                      row.lead
                        ?.lead_code ||
                      "-"}
                  </span>
                </TableCell>

                {/* Project */}

                <TableCell>
                  <div className="min-w-[180px]">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">
                        {row.project_name}
                      </span>

                      {row.isDeleted && (
                        <Badge
                          variant="destructive"
                          className="text-[10px]"
                        >
                          Deleted
                        </Badge>
                      )}
                    </div>

                    {row.isDeleted &&
                      row.deleted_at && (
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          Deleted{" "}
                          {new Date(
                            row.deleted_at
                          ).toLocaleString()}
                        </p>
                      )}
                  </div>
                </TableCell>

                {/* Track Trace Status */}

                <TableCell>
                  <Badge
                    className={cn(
                      "text-xs",

                      row.track_trace_status ===
                        "Completed"
                        ? "bg-emerald-500 hover:bg-emerald-600"
                        : row.track_trace_status ===
                            "Started"
                          ? "bg-indigo-500 hover:bg-indigo-600"
                          : "bg-muted text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {row.track_trace_status ??
                      "Not Started"}
                  </Badge>
                </TableCell>

                {/* Client */}

                <TableCell>
                  <div className="min-w-[160px]">
                    <p className="font-medium">
                      {row.client_name ||
                        [
                          row.lead
                            ?.firstname,
                          row.lead
                            ?.lastname,
                        ]
                          .filter(Boolean)
                          .join(" ") ||
                        "-"}
                    </p>

                    {row.lead
                      ?.lead_code && (
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {
                          row.lead
                            .lead_code
                        }
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Contact */}

                <TableCell>
                  <span className="whitespace-nowrap">
                    {row.client_contact_no ||
                      row.lead
                        ?.contact_no ||
                      "-"}
                  </span>
                </TableCell>

                {/* Created At */}

                <TableCell>
                  <span className="whitespace-nowrap text-xs text-muted-foreground">
                    {row.created_at
                      ? new Date(
                          row.created_at
                        ).toLocaleDateString()
                      : "-"}
                  </span>
                </TableCell>

                {/* Actions */}

                <TableCell>
                  <div className="flex items-center justify-center">
                    {row.isDeleted ? (
                      <Badge
                        variant="outline"
                        className="text-xs text-muted-foreground"
                      >
                        Deleted
                      </Badge>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(
                              event
                            ) => {
                              event.stopPropagation();
                            }}
                          >
                            <MoreHorizontal
                              size={18}
                            />

                            <span className="sr-only">
                              Open actions
                            </span>
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                          align="end"
                          className="w-48"
                          onClick={(
                            event
                          ) => {
                            event.stopPropagation();
                          }}
                        >
                          {/* Edit */}

                          <DropdownMenuItem
                            className="cursor-pointer gap-2"
                            onClick={(
                              event
                            ) => {
                              event.stopPropagation();

                              onEditClick?.(
                                row
                              );
                            }}
                          >
                            <Pencil
                              size={14}
                            />

                            Edit Project
                          </DropdownMenuItem>

                          {/* Cut List */}

                          <DropdownMenuItem
                            className="cursor-pointer gap-2"
                            onClick={(
                              event
                            ) => {
                              event.stopPropagation();

                              onCutListClick?.(
                                row
                              );
                            }}
                          >
                            <Layers
                              size={14}
                            />

                            Cut List
                          </DropdownMenuItem>

                          {/* Details */}

                          <DropdownMenuItem
                            className="cursor-pointer gap-2"
                            onClick={(
                              event
                            ) => {
                              event.stopPropagation();

                              onProjectDetailClick?.(
                                row
                              );
                            }}
                          >
                            <PackageOpen
                              size={14}
                            />

                            Details & Boxes
                          </DropdownMenuItem>

                          {/* Delete only for Super Admin / Admin */}

                          {canDelete && (
                            <>
                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                disabled={
                                  isDeleting
                                }
                                className="
                                  cursor-pointer
                                  gap-2
                                  text-destructive
                                  focus:text-destructive
                                  focus:bg-destructive/10
                                "
                                onClick={(
                                  event
                                ) => {
                                  event.stopPropagation();

                                  onDeleteClick?.(
                                    row
                                  );
                                }}
                              >
                                <Trash2
                                  size={14}
                                />

                                {isDeleting
                                  ? "Deleting..."
                                  : "Delete Project"}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}