"use client";

import React, { useState } from "react";
import clsx from "clsx";

import ViewOpenLeadTable from "@/app/_components/view-leads-table";
import PendingLeadsTable from "@/app/dashboard/leads/pending-leads/pending-leads-table";
import { useAppSelector } from "@/redux/store";
import { useActivityStatusCounts } from "@/hooks/useActivityStatus";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

type LeadTab = "open" | "onHold" | "lostApproval" | "lost";

interface TabItem {
  value: LeadTab;
  label: string;
  count?: number;
  dotColor?: string;
}

export default function ViewLeadsSkeleton() {
  const [tab, setTab] = useState<LeadTab>("open");

  // ⭐ popover open-control state
  const [openPopover, setOpenPopover] = useState(false);

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const { data: counts } = useActivityStatusCounts(vendorId);

  const tabItems: TabItem[] = [
    {
      value: "open",
      label: "Open",
      count: counts?.open ?? 0,
      dotColor: "#3b82f6",
    },
    {
      value: "onHold",
      label: "On Hold",
      count: counts?.onHold ?? 0,
      dotColor: "#facc15",
    },
    {
      value: "lostApproval",
      label: "Lost Approval",
      count: counts?.lostApproval ?? 0,
      dotColor: "#22c55e",
    },
    {
      value: "lost",
      label: "Lost",
      count: counts?.lost ?? 0,
      dotColor: "#ef4444",
    },
  ];

  const tabInfo: Record<LeadTab, { title: string; description: string }> = {
    open: {
      title: "Open Leads",
      description: "Fresh leads that have not yet been processed or contacted.",
    },
    onHold: {
      title: "On Hold Leads",
      description: "Leads requiring follow-up or waiting for client response.",
    },
    lostApproval: {
      title: "Lost Approval Leads",
      description: "Leads rejected during approval workflow.",
    },
    lost: {
      title: "Lost Leads",
      description: "Leads permanently marked as lost or non-convertible.",
    },
  };

  return (
    <main className="flex-1 overflow-x-hidden">
      <div className="py-2">
        <div className="flex justify-between items-center px-4">
          <div className="hidden md:block">
            <h1 className="text-lg font-semibold">{tabInfo[tab].title}</h1>
            <p className="text-sm text-muted-foreground">
              {tabInfo[tab].description}
            </p>
          </div>

          {/* ⭐ Controlled Popover */}
          <Popover open={openPopover} onOpenChange={setOpenPopover}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                {tabInfo[tab].title}
                <ChevronDown size={16} className="opacity-70" />
              </Button>
            </PopoverTrigger>

            <PopoverContent align="end" sideOffset={6} className="w-40 p-1">
              <div className="flex flex-col gap-1">
                {tabItems.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => {
                      setTab(item.value);
                      setOpenPopover(false); // ⭐ closes popover
                    }}
                    className={clsx(
                      "flex justify-between items-center px-3 py-2 rounded-md text-sm hover:bg-muted transition",
                      item.value === tab && "bg-muted font-semibold"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: item.dotColor }}
                      ></span>
                      {item.label}
                    </span>

                    <span className="opacity-70">{item.count}</span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div>
          {tab === "open" && <ViewOpenLeadTable />}
          {tab === "onHold" && <PendingLeadsTable tab="onHold" />}
          {tab === "lostApproval" && <PendingLeadsTable tab="lostApproval" />}
          {tab === "lost" && <PendingLeadsTable tab="lost" />}
        </div>
      </div>
    </main>
  );
}
