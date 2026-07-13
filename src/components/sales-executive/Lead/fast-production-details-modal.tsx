"use client";

import React, { useState, useEffect } from "react";
import BaseModal from "@/components/utils/baseModal";
import { useGetFastProductionDetailsForLead } from "@/hooks/useLeadsQueries";
import { useAppSelector } from "@/redux/store";
import { Calendar, FileText, Zap, Info, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import DocumentCard from "@/components/utils/documentCard";

interface FastProductionDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: number;
}

const formatDateStr = (dateStr?: string) => {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const renderListWithBlackDots = (text: string | null | undefined, isCategory: boolean = false) => {
  if (!text || text === "-") return "-";
  
  if (isCategory) {
    const joinedText = text.split(/[,\n]+/).map(l => l.trim()).filter(l => l.length > 0).join(', ');
    if (!joinedText) return "-";
    return (
      <ul className="space-y-1.5 mt-1">
        <li className="flex items-start gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-foreground/80 shrink-0 mt-1.5" />
          <span className="text-sm font-semibold text-foreground leading-relaxed">{joinedText}</span>
        </li>
      </ul>
    );
  }

  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  if (lines.length === 0) return "-";
  return (
    <ul className="space-y-1.5">
      {lines.map((line, idx) => (
        <li key={idx} className="flex items-start gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-foreground/80 shrink-0 mt-1.5" />
          <span className="text-sm text-muted-foreground leading-relaxed">{line}</span>
        </li>
      ))}
    </ul>
  );
};

const getFinish = (finishes: any[], component: "CARCASS" | "SHUTTER" | "HANDLE") => {
  const item = finishes?.find((f) => f.component === component);
  return {
    category: item?.finish_category || "-",
    description: item?.finish_description || "-",
  };
};

export default function FastProductionDetailsModal({
  open,
  onOpenChange,
  leadId,
}: FastProductionDetailsModalProps) {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const { data: detailsResponse, isLoading } = useGetFastProductionDetailsForLead(
    vendorId,
    leadId,
    undefined,
    open
  );

  const batch: any = detailsResponse?.data;
  const requests = batch?.requests || [];
  const [activeRequestIdx, setActiveRequestIdx] = useState(0);

  useEffect(() => {
    if (open) {
      setActiveRequestIdx(0);
    }
  }, [open]);

  const activeRequest = requests[activeRequestIdx];

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Fast Production Details"
      icon={
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 shrink-0">
          <Zap className="h-4 w-4 fill-current" />
        </span>
      }
      description="View the fast production request specifications and timelines."
      size="xl"
    >
      <div className="flex flex-col px-6 py-4 space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
            <p className="mt-4 text-sm font-medium">Fetching details...</p>
          </div>
        ) : !batch || requests.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-muted/10 rounded-2xl border border-dashed">
            <Info className="h-8 w-8 mx-auto text-muted-foreground/60 mb-3" />
            <p className="text-sm font-medium">No fast production request details found.</p>
          </div>
        ) : (
          <>
            {/* Instance Selector */}
            {requests.length > 1 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Select Product Instance
                </p>
                <div className="flex flex-wrap gap-2">
                  {requests.map((req: any, idx: number) => {
                    const isActive = idx === activeRequestIdx;
                    return (
                      <button
                        key={req.id}
                        type="button"
                        onClick={() => setActiveRequestIdx(idx)}
                        className={cn(
                          "rounded-xl border px-3 py-2 text-left text-xs font-medium transition-all",
                          isActive
                            ? "border-orange-500 bg-orange-50 text-orange-900 shadow-sm dark:border-orange-400 dark:bg-orange-950/30 dark:text-orange-200"
                            : "border-border bg-background hover:border-orange-300 hover:bg-orange-50/60 dark:hover:border-orange-500/50 dark:hover:bg-orange-950/20"
                        )}
                      >
                        {req.instance?.title || `Instance ${idx + 1}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {activeRequest ? (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Carcass Finish */}
                  <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Carcass Finish
                    </p>
                    <div className="flex-1">
                      {renderListWithBlackDots(getFinish(activeRequest.finishes, "CARCASS").category, true)}
                    </div>
                    <div className="border-t border-border pt-2 mt-1">
                      {renderListWithBlackDots(getFinish(activeRequest.finishes, "CARCASS").description)}
                    </div>
                  </div>

                  {/* Shutter Finish */}
                  <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Shutter Finish
                    </p>
                    <div className="flex-1">
                      {renderListWithBlackDots(getFinish(activeRequest.finishes, "SHUTTER").category, true)}
                    </div>
                    <div className="border-t border-border pt-2 mt-1">
                      {renderListWithBlackDots(getFinish(activeRequest.finishes, "SHUTTER").description)}
                    </div>
                  </div>

                  {/* Handles Finish */}
                  <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 md:col-span-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Handles Finish
                    </p>
                    <div className="flex-1">
                      {renderListWithBlackDots(getFinish(activeRequest.finishes, "HANDLE").category, true)}
                    </div>
                    <div className="border-t border-border pt-2 mt-1">
                      {renderListWithBlackDots(getFinish(activeRequest.finishes, "HANDLE").description)}
                    </div>
                  </div>

                  {/* Hardware & Accessories */}
                  <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Hardware Selection
                    </p>
                    {renderListWithBlackDots(activeRequest.hardware_selection)}
                  </div>

                  <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Accessory Selection
                    </p>
                    {renderListWithBlackDots(activeRequest.accessory_selection)}
                  </div>

                  {/* Special / non-standard requirements */}
                  <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 md:col-span-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Special / Non-Standard Requirements
                    </p>
                    {renderListWithBlackDots(activeRequest.special_requirements)}
                  </div>

                  {/* Target Delivery Date & Status */}
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                    <Calendar className="h-5 w-5 text-orange-500 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Required Delivery Date
                      </p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">
                        {formatDateStr(activeRequest.client_required_delivery_date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                    <Zap className="h-5 w-5 text-orange-500 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Fast Production Status
                      </p>
                      <span className="inline-flex items-center text-xs font-semibold bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 px-2.5 py-0.5 rounded-full mt-0.5">
                        {batch.status ? batch.status.replace("_", " ").toUpperCase() : "-"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Attachments */}
                <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Attachments
                  </p>
                  <div>
                    {activeRequest.documents && activeRequest.documents.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                        {activeRequest.documents.map((docMapping: any) => {
                          const doc = docMapping.document;
                          if (!doc) return null;
                          const docData = {
                            id: doc.id || docMapping.id,
                            originalName: doc.doc_og_name || "Unnamed Document",
                            signedUrl: doc.signedUrl,
                            created_at: doc.created_at,
                          };
                          return (
                            <DocumentCard
                              key={docMapping.id || doc.id}
                              doc={docData}
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No documents uploaded.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </BaseModal>
  );
}
