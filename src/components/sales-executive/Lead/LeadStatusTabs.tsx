"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCallback } from "react";

export function LeadStatusTabs({
  tab,
  setTab,
  counts,
}: {
  tab: "open" | "onHold" | "lostApproval" | "lost";
  setTab: (t: "open" | "onHold" | "lostApproval" | "lost") => void;
  counts: { total: number; open: number; onHold: number; lostApproval: number; lost: number };
}) {
  const handleTabChange = useCallback(
    (value: string) => {
      setTab(value as "open" | "onHold" | "lostApproval" | "lost");
    },
    [setTab]
  );

  return (
    <div className="flex items-center justify-start h-full my-2">
      <Tabs value={tab} onValueChange={handleTabChange} className="w-fit h-full">
        <TabsList className="grid grid-cols-4 p-1 rounded-lg w-fit h-full min-h-[40px] bg-muted">
          {/* Open */}
          <TabsTrigger
            value="open"
            className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all
                       data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm h-full"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-xs">Open</span>
              <span className="px-1 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full min-w-[20px] text-center">
                {counts.open}
              </span>
            </div>
          </TabsTrigger>

          {/* On Hold */}
          <TabsTrigger
            value="onHold"
            className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all 
                       data-[state=active]:bg-white data-[state=active]:text-yellow-600 data-[state=active]:shadow-sm h-full"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-xs">On Hold</span>
              <span className="px-1 py-0.5 text-xs bg-yellow-100 text-yellow-600 rounded-full min-w-[20px] text-center">
                {counts.onHold}
              </span>
            </div>
          </TabsTrigger>

          {/* Lost Approval */}
          <TabsTrigger
            value="lostApproval"
            className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all 
                       data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm h-full"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-xs">Lost Approval</span>
              <span className="px-1 py-0.5 text-xs bg-orange-100 text-orange-600 rounded-full min-w-[20px] text-center">
                {counts.lostApproval}
              </span>
            </div>
          </TabsTrigger>

          {/* Lost */}
          <TabsTrigger
            value="lost"
            className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all 
                       data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm h-full"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-xs">Lost</span>
              <span className="px-1 py-0.5 text-xs bg-red-100 text-red-600 rounded-full min-w-[20px] text-center">
                {counts.lost}
              </span>
            </div>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
