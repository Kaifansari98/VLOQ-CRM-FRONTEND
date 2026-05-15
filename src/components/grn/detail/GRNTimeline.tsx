"use client";

import { GRNDetail } from "@/api/grn/grn";
import { fmtDate } from "../shared/statusUtils";
import { CheckCircle2, ClipboardList, FileCheck2 } from "lucide-react";

export function GRNTimeline({ grn }: { grn: GRNDetail }) {
  const events = [
    {
      title: "GRN Created",
      value: grn.createdBy?.user_name || "System",
      date: fmtDate((grn as any).created_at),
      icon: <ClipboardList size={14} />,
    },
    {
      title: "Material Received",
      value: grn.companyVendor.company_name,
      date: fmtDate(grn.received_date),
      icon: <FileCheck2 size={14} />,
    },
    {
      title: grn.status === "Draft" ? "Awaiting Confirmation" : "GRN Confirmed",
      value: grn.confirmedBy?.user_name || "Pending",
      date: grn.confirmed_at ? fmtDate((grn as any).confirmed_at) : "—",
      icon: <CheckCircle2 size={14} />,
    },
  ];

  return (
    <div className="space-y-3">
      {events.map((event, idx) => (
        <div key={event.title} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="rounded-full bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/40">
              {event.icon}
            </div>
            {idx !== events.length - 1 && (
              <div className="mt-2 h-8 w-px bg-border" />
            )}
          </div>

          <div className="pb-3">
            <p className="text-sm font-black">{event.title}</p>
            <p className="text-xs text-muted-foreground">{event.value}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {event.date}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}