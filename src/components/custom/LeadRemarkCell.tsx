"use client";

import React, { useState, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";

export function cleanRemarkText(txt?: string | null) {
  if (!txt) return "";
  return txt
    .replace(/[\u0393\u00e7\u00f4\uFFFD\u00C7\u00F3\u00C2\u00A0]/g, "")
    .replace(/ГÇô|â€“|Ã¢â‚¬â€|Â|â€/g, "-")
    .replace(/\^\^/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeRemarkForComparison(txt: string) {
  return txt
    .toLowerCase()
    .replace(/^(bulk imported|lead created):\s*/i, "")
    .replace(/[\s\r\n\t]+/g, " ")
    .trim();
}

export function LeadRemarkCell({ lead }: { lead: any }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const remarksList = useMemo(() => {
    if (!lead) return [];
    const rawList: { text: string; date?: string; author?: string; status?: string }[] = [];

    const pushRemark = (
      text: string | null | undefined,
      date?: string,
      author?: string,
      status?: string
    ) => {
      if (!text) return;
      const cleaned = cleanRemarkText(text);
      if (
        !cleaned ||
        cleaned === "N/A" ||
        cleaned === "-" ||
        cleaned.toLowerCase().includes("lead conversion to draft") ||
        cleaned.toLowerCase().includes("lead created from") ||
        cleaned.toLowerCase().includes("registered as walk-in") ||
        cleaned.toLowerCase().includes("call completed with outcome") ||
        cleaned.toLowerCase().includes("transferred to") ||
        cleaned.toLowerCase().includes("store assigned to store id")
      ) {
        return;
      }
      rawList.push({ text: cleaned, date, author, status });
    };

    // Primary remark (initial bulk upload / creation / designer remark)
    const baseRemark = lead.remark || lead.designerRemark || lead.designer_remark;
    pushRemark(
      baseRemark,
      lead.created_at || lead.createdAt,
      lead.assignedTo?.user_name || lead.createdBy?.user_name || lead.sales_executive,
      lead.followupStatus?.status_name || (typeof lead.status === "string" ? lead.status : undefined)
    );

    // Call logs / follow up logs ONLY (actual follow up call remarks)
    const callLogs = lead.call_log || lead.online_lead_call_log || lead.callLog || [];
    if (Array.isArray(callLogs) && callLogs.length > 0) {
      callLogs.forEach((c: any) => {
        const author =
          c.telecaller?.user_name ||
          c.UserMaster?.user_name ||
          c.createdBy?.user_name ||
          c.telecaller_name;
        const status =
          c.status?.status_name ||
          c.online_lead_followup_status?.status_name ||
          c.status_name;
        pushRemark(
          c.remark,
          c.created_at || c.createdAt || c.started_at,
          author,
          status
        );
      });
    }

    // Sort newest first
    rawList.sort((a, b) => {
      const timeA = a.date ? new Date(a.date).getTime() : 0;
      const timeB = b.date ? new Date(b.date).getTime() : 0;
      return timeB - timeA;
    });

    // Deduplicate using normalized text + timestamp key (to prevent duplicate table records while keeping separate follow-ups)
    const list: { text: string; date?: string; author?: string; status?: string }[] = [];
    const seenNormalized = new Set<string>();

    for (const item of rawList) {
      const normText = normalizeRemarkForComparison(item.text);
      if (!normText) continue;
      const dateKey = item.date ? new Date(item.date).toISOString().slice(0, 16) : "";
      const normKey = `${normText}__${dateKey}`;
      if (seenNormalized.has(normKey)) continue;
      seenNormalized.add(normKey);
      list.push(item);
    }

    return list;
  }, [lead]);

  if (remarksList.length === 0) {
    return <span className="text-xs text-muted-foreground italic">—</span>;
  }

  const safeIndex = Math.min(Math.max(0, currentIndex), remarksList.length - 1);
  const current = remarksList[safeIndex] || remarksList[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : remarksList.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndex((prev) => (prev < remarksList.length - 1 ? prev + 1 : 0));
  };

  const mainRemarkText = current?.text || "";

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div
          onMouseEnter={() => setIsOpen(true)}
          className="cursor-pointer group flex items-center justify-between gap-1 max-w-[190px] rounded px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <p className="text-xs font-normal text-foreground truncate flex-1">
            {mainRemarkText}
          </p>
          {remarksList.length > 1 && (
            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/40 px-1.5 py-0.5 rounded-full shrink-0">
              {remarksList.length}
            </span>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="w-64 p-2.5 bg-slate-950 text-white border border-slate-800 shadow-lg rounded-lg z-50"
      >
        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800">
          <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
            <MessageSquare className="w-3 h-3 text-blue-400" />
            Remark ({safeIndex + 1} of {remarksList.length})
          </span>
          {remarksList.length > 1 && (
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrev}
                className="h-5 w-5 text-slate-300 hover:text-white hover:bg-slate-800 rounded p-0 flex items-center justify-center cursor-pointer"
                title="Previous Remark"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                className="h-5 w-5 text-slate-300 hover:text-white hover:bg-slate-800 rounded p-0 flex items-center justify-center cursor-pointer"
                title="Next Remark"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
        <div className="space-y-1">
          {current.status && (
            <span className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-900/50 text-blue-300 border border-blue-800">
              {current.status}
            </span>
          )}
          <p className="text-xs text-slate-200 leading-normal whitespace-pre-wrap break-words">
            {current.text}
          </p>
          <div className="flex items-center justify-between pt-1.5 text-[10px] text-slate-400 border-t border-slate-800/80 mt-2">
            <span>By: {current.author || "System"}</span>
            {current.date && (
              <span>
                {new Date(current.date).toLocaleDateString()}{" "}
                {new Date(current.date).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
