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
import { cn } from "@/lib/utils";
import { TrackTraceProject } from "@/types/track-trace/track-trace.types";
import { Layers, PackageOpen, Pencil } from "lucide-react";

// Ensure TrackTraceProject in your types file has:
// lead?: { id: number; firstname: string; lastname: string | null; lead_code: string | null } | null

interface TrackTraceProjectTableProps {
  table: TrackTraceProject[];
  onRowDoubleClick?: (row: TrackTraceProject) => void;
  onCutListClick?: (row: TrackTraceProject) => void;
  onProjectDetailClick?: (row: TrackTraceProject) => void;
  onEditClick?: (row: TrackTraceProject) => void;
  className?: string;
}

export default function TrackTraceProjectTable({
  table,
  onRowDoubleClick,
  onCutListClick,
  onProjectDetailClick,
  onEditClick,
  className,
}: TrackTraceProjectTableProps) {
  if (table.length === 0) {
    return (
      <div className={cn("px-4 pt-6 text-sm text-muted-foreground", className)}>
        No projects found.
      </div>
    );
  }

  return (
    <div className={cn("rounded-md border overflow-x-auto", className)}>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">

            <TableHead className="text-xs font-black uppercase w-8">#</TableHead>
            <TableHead className="text-xs font-black uppercase">Order No.</TableHead>
            <TableHead className="text-xs font-black uppercase">Project Name</TableHead>
            <TableHead className="text-xs font-black uppercase">T&T Status</TableHead>

            <TableHead className="text-xs font-black uppercase">Client</TableHead>
            <TableHead className="text-xs font-black uppercase">Contact</TableHead>
            <TableHead className="text-xs font-black uppercase text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {table.map((row, idx) => (
            <TableRow
              key={row.unique_project_id ?? idx}
              className="hover:bg-primary/5 cursor-pointer"
              onDoubleClick={() => onRowDoubleClick?.(row)}
            >
              <TableCell className="text-xs text-muted-foreground font-mono">
                {idx + 1}
              </TableCell>

              <TableCell>
                <span className="font-medium">
                  {row.order_no || row.lead?.lead_code || "-"}
                </span>
              </TableCell>

              <TableCell className="font-semibold text-sm">
                {row.project_name}
              </TableCell>

              {/* <TableCell>
                <Badge variant="outline" className="text-xs capitalize">
                  {row.project_status ?? "—"}
                </Badge>
              </TableCell> */}

              <TableCell>
                <Badge
                  className={cn(
                    "text-xs",
                    row.track_trace_status === "Completed"
                      ? "bg-emerald-500 hover:bg-emerald-600"
                      : row.track_trace_status === "Started"
                        ? "bg-indigo-500 hover:bg-indigo-600"
                        : "bg-muted text-muted-foreground hover:bg-muted"
                  )}
                >
                  {row.track_trace_status ?? "Not Started"}
              </Badge>
              </TableCell>


              <TableCell>
                <div className="min-w-[160px]">
                  <p className="font-medium">
                    {row.client_name ||
                      [row.lead?.firstname, row.lead?.lastname]
                        .filter(Boolean)
                        .join(" ") ||
                      "-"}
                  </p>
                   {row.lead ? (
                  <div className="flex flex-col gap-0.5">                   
                    {row.lead.lead_code && (
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {row.lead.lead_code}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}

                  {/* {row.lead.id && (
      <p className="text-xs text-muted-foreground">
        CRM Lead
      </p>
    )} */}
                </div>
              </TableCell>
              <TableCell>
                <span className="whitespace-nowrap">
                  {row.client_contact_no ||
                    row.lead?.contact_no ||
                    "-"}
                </span>
              </TableCell>




              {/* ── Two action buttons ── */}
              <TableCell>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1"
                    onClick={(event) => {
                      event.stopPropagation();

                      onEditClick?.(row);
                    }}
                  >
                    <Pencil size={13} />

                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs h-7"
                    onClick={(e) => { e.stopPropagation(); onCutListClick?.(row); }}
                    title="View cut list & machine info"
                  >
                    <Layers size={13} />
                    Cut List
                  </Button>

                  <Button
                    size="sm"
                    variant="default"
                    className="gap-1.5 text-xs h-7 bg-indigo-600 hover:bg-indigo-700"
                    onClick={(e) => { e.stopPropagation(); onProjectDetailClick?.(row); }}
                    title="View project detail with boxes"
                  >
                    <PackageOpen size={13} />
                    Details & Boxes
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}