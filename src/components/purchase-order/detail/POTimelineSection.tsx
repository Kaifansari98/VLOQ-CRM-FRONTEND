"use client";

import { PODetail } from "@/api/purchaseOrder/purchaseOrder";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";
import { fmtDateTime, STATUS_CFG } from "../shared/poUtils";

export function POTimelineSection({ po }: { po: PODetail }) {
  const logs = po.statusLogs ?? [];

  if (!logs.length) return null;

  return (
    <div className="rounded-[28px] border bg-background p-5 shadow-sm">
      <p className="mb-4 text-base font-black">Status Timeline</p>

      <div className="space-y-4">
        {logs.map((log) => {
          const cfg = STATUS_CFG[log.to_status];
          const Icon = cfg?.icon ?? Clock;

          return (
            <div key={log.id} className="flex gap-3">
              <div
                className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                  cfg?.color ?? "bg-muted text-muted-foreground"
                )}
              >
                <Icon size={13} />
              </div>

              <div className="min-w-0 flex-1 border-b pb-4 last:border-b-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold">
                    {cfg?.label ?? log.to_status}
                  </span>

                  {log.from_status && (
                    <span className="text-xs text-muted-foreground">
                      from {STATUS_CFG[log.from_status]?.label ?? log.from_status}
                    </span>
                  )}

                  <span className="ml-auto text-xs text-muted-foreground">
                    {fmtDateTime(log.created_at)}
                  </span>
                </div>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  by {log.changedBy?.user_name ?? "—"}
                </p>

                {log.remarks && (
                  <p className="mt-2 rounded-2xl bg-muted/40 p-3 text-xs italic text-muted-foreground">
                    “{log.remarks}”
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}