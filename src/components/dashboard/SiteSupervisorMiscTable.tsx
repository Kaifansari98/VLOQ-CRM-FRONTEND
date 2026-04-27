"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { SiteSupervisorMiscItem } from "@/api/dashboard/dashboard.api";

interface SiteSupervisorMiscTableProps {
  data?: SiteSupervisorMiscItem[];
  isLoading?: boolean;
}

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  approved: {
    label: "Approved",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  rejected: {
    label: "Rejected",
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
} as const;

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function SiteSupervisorMiscTable({
  data,
  isLoading,
}: SiteSupervisorMiscTableProps) {
  const router = useRouter();

  const handleDoubleClick = (item: SiteSupervisorMiscItem) => {
    router.push(
      `/dashboard/installation/under-installation/details/${item.lead_id}?accountId=${item.account_id}&tab=misc`
    );
  };

  return (
    <Card className="w-full border flex flex-col bg-background">
      <p className="flex flex-col pl-4">
        <span className="text-sm font-medium">Unresolved Misc</span>
        <span className="text-xs text-muted-foreground">
          Open miscellaneous items on your assigned leads
        </span>
      </p>

      <CardContent className="p-0 flex-1 px-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="h-8 w-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
            No unresolved misc items
          </div>
        ) : (
          <div className="overflow-y-auto" style={{ maxHeight: "450px" }}>
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="text-xs">Lead Code</TableHead>
                  <TableHead className="text-xs">Client</TableHead>
                  <TableHead className="text-xs">Misc Type</TableHead>
                  <TableHead className="text-xs">ERD Date</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => {
                  const status = STATUS_CONFIG[item.status];
                  return (
                    <TableRow
                      key={item.id}
                      className="text-xs cursor-pointer select-none"
                      onDoubleClick={() => handleDoubleClick(item)}
                    >
                      <TableCell className="font-medium">
                        {item.lead_code || "—"}
                      </TableCell>
                      <TableCell className="max-w-[120px] truncate">
                        {item.client || "—"}
                      </TableCell>
                      <TableCell>{item.misc_type}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(item.expected_ready_date)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0.5 border-0 font-medium ${status.className}`}
                        >
                          {status.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
