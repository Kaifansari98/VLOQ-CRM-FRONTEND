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
import type { SiteSupervisorUpcomingSite } from "@/api/dashboard/dashboard.api";

interface SiteSupervisorUpcomingSitesTableProps {
  data?: SiteSupervisorUpcomingSite[];
  isLoading?: boolean;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function SiteSupervisorUpcomingSitesTable({
  data,
  isLoading,
}: SiteSupervisorUpcomingSitesTableProps) {
  const router = useRouter();

  const handleDoubleClick = (item: SiteSupervisorUpcomingSite) => {
    router.push(
      `/dashboard/installation/under-installation/details/${item.id}?accountId=${item.account_id}`
    );
  };

  return (
    <Card className="w-full border flex flex-col bg-background">
      <p className="flex flex-col pl-4">
        <span className="text-sm font-medium">Upcoming Sites</span>
        <span className="text-xs text-muted-foreground">
          Dispatched leads not yet under installation
        </span>
      </p>

      <CardContent className="p-0 flex-1 px-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="h-8 w-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
            No upcoming sites
          </div>
        ) : (
          <div className="overflow-y-auto" style={{ maxHeight: "450px" }}>
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="text-xs">Lead Code</TableHead>
                  <TableHead className="text-xs">Client</TableHead>
                  <TableHead className="text-xs">Dispatch Date</TableHead>
                  <TableHead className="text-xs">Furniture Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow
                    key={item.id}
                    className="text-xs cursor-pointer select-none"
                    onDoubleClick={() => handleDoubleClick(item)}
                  >
                    <TableCell className="font-medium">
                      {item.lead_code || "—"}
                    </TableCell>
                    <TableCell className="max-w-[130px] truncate">
                      {item.client || "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(item.dispatch_date)}
                    </TableCell>
                    <TableCell className="max-w-[120px] truncate">
                      {item.furniture_type}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
