import { ColumnDef } from "@tanstack/react-table";
import { TrackTraceProject } from "@/types/track-trace/track-trace.types";

export const getTrackTraceProjectColumns =
  (): ColumnDef<TrackTraceProject>[] => [
    {
      accessorKey: "id",
      header: "ID",
    },
    {
      accessorKey: "project_name",
      header: "Project Name",
    },
    {
      accessorKey: "unique_project_id",
      header: "Project Code",
    },
    {
      accessorKey: "track_trace_status",
      header: "Status",
      cell: ({ row }) => (
        <span className="px-2 py-1 rounded-md text-xs bg-muted">
          {row.original.track_trace_status}
        </span>
      ),
    },
    // {
    //   header: "Vendor",
    //   cell: ({ row }) => row.original.vendor?.vendor_name ?? "-",
    // },
    // {
    //   header: "Created By",
    //   cell: ({ row }) =>
    //     row.original.createdByUser?.user_name ?? "-",
    // },
    // {
    //   accessorKey: "created_at",
    //   header: "Created At",
    //   cell: ({ row }) =>
    //     new Date(row.original.created_at).toLocaleDateString(),
    // },
  ];
