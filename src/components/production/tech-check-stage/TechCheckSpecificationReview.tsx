"use client";

import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Loader2,
  Pencil,
  RefreshCw,
  XCircle,
} from "lucide-react";
import {
  getLeadSpecificationPdfData,
  type LeadSpecificationEntry,
} from "@/api/designingStageQueries";
import {
  useCreateLeadSpecification,
  useLeadSpecifications,
} from "@/hooks/designing-stage/designing-leads-hooks";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import ViewSpecsModal from "@/components/sales-executive/designing-stage/pill-tabs-component/modals/view-specs-modal";
import { getItemGroupSpecifications } from "./specification-documents";

type OpenSpecification = {
  specification: LeadSpecificationEntry;
  readOnly: boolean;
};

const getItemGroupTitle = (instance: any) =>
  instance.productType?.type ||
  instance.productItemCode?.productStructure?.productType?.type ||
  "Item Group";

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

interface TechCheckSpecificationReviewProps {
  leadId: number;
  vendorId: number;
  structureInstances: any[];
  /** Only show specifications of this item group. */
  itemGroupProductTypeId?: number | null;
  userId: number;
  canRevise: boolean;
  disabled?: boolean;
  /** Passed when the row can be selected for Approve / Reject Selected. */
  selectedSpecIds?: number[];
  onToggleSpec?: (specId: number) => void;
}

export default function TechCheckSpecificationReview({
  leadId,
  vendorId,
  structureInstances,
  itemGroupProductTypeId,
  userId,
  canRevise,
  disabled = false,
  selectedSpecIds = [],
  onToggleSpec,
}: TechCheckSpecificationReviewProps) {
  const { data: specifications = [] } = useLeadSpecifications(vendorId, leadId);
  const createSpecification = useCreateLeadSpecification();

  const [openSpecification, setOpenSpecification] =
    useState<OpenSpecification | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const groups = useMemo(() => {
    const itemCodeGroups = new Map<number, string>();
    structureInstances.forEach((instance: any) => {
      if (instance.productItemCode?.id) {
        itemCodeGroups.set(
          instance.productItemCode.id,
          getItemGroupTitle(instance),
        );
      }
    });

    const grouped = new Map<string, LeadSpecificationEntry[]>();
    getItemGroupSpecifications(
      specifications,
      structureInstances,
      itemGroupProductTypeId,
    ).forEach((spec) => {
      const title = itemCodeGroups.get(spec.item_code_id!) || "Other Specifications";
      grouped.set(title, [...(grouped.get(title) ?? []), spec]);
    });

    return Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [itemGroupProductTypeId, specifications, structureInstances]);

  const specificationCount = groups.reduce(
    (total, [, specs]) => total + specs.length,
    0,
  );
  if (specificationCount === 0) return null;

  // Remark to fix: the rejection of the version this revised copy replaced
  const getRejectionRemark = (spec: LeadSpecificationEntry) => {
    if (spec.tech_check_status === "REJECTED") return spec.tech_check_remark;
    if (spec.tech_check_status === "APPROVED") return null;
    const previous = specifications
      .filter(
        (candidate) =>
          candidate.item_code_id === spec.item_code_id &&
          candidate.id !== spec.id &&
          new Date(candidate.created_at) <= new Date(spec.created_at),
      )
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime() ||
          b.id - a.id,
      )[0];
    return previous?.tech_check_status === "REJECTED"
      ? previous.tech_check_remark
      : null;
  };

  const handleCreateRevised = (spec: LeadSpecificationEntry) => {
    createSpecification.mutate(
      {
        vendorId,
        leadId,
        createdBy: userId,
        itemCodeId: spec.item_code_id ?? undefined,
      },
      {
        onSuccess: (created: LeadSpecificationEntry) => {
          setOpenSpecification({ specification: created, readOnly: false });
        },
        onError: (err: any) => {
          toastManager.add({
            title: err?.message || "Failed to create revised specification",
            type: "error",
          });
        },
      },
    );
  };

  const handleDownload = async (spec: LeadSpecificationEntry) => {
    setDownloadingId(spec.id);
    try {
      const [pdfData, pdfModule] = await Promise.all([
        getLeadSpecificationPdfData(vendorId, spec.lead_id, spec.id),
        import("@/utils/pdf/specifications-pdf"),
      ]);
      pdfModule.exportLeadSpecificationPdf(
        pdfData.file_name || spec.name,
        pdfData,
      );
    } catch (error: any) {
      toastManager.add({
        title: error?.message || "Failed to download specification.",
        type: "error",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const openRemark = openSpecification
    ? getRejectionRemark(openSpecification.specification)
    : null;

  return (
    <div className="space-y-3 px-6">
      <div className="flex flex-col justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-white">
          Specifications
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Click to select specifications, then choose to approve or reject
        </p>
      </div>

      {groups.map(([title, specs]) => (
        <div key={title} className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">{title}</p>

          {specs.map((spec) => {
            const isRejected = spec.tech_check_status === "REJECTED";
            const isApproved = spec.tech_check_status === "APPROVED";
            const isCompleted = !!spec.is_completed;
            const isSelectable =
              !!onToggleSpec &&
              !disabled &&
              !isRejected &&
              !isApproved &&
              isCompleted;
            const isSelected = selectedSpecIds.includes(spec.id);
            const remark = getRejectionRemark(spec);

            return (
              <div
                key={spec.id}
                className={cn(
                  "relative rounded-lg border-2 p-4 transition-all duration-200 group space-y-3",
                  isSelectable
                    ? "cursor-pointer"
                    : "cursor-not-allowed opacity-75",
                  isSelected
                    ? "border-zinc-900 dark:border-white dark:bg-zinc-950/30"
                    : !isRejected &&
                        !isApproved &&
                        "border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700",
                )}
                onClick={() => {
                  if (isSelectable) onToggleSpec(spec.id);
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex gap-2 items-center min-w-0">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden",
                        isRejected
                          ? "bg-red-100 dark:bg-red-900/50"
                          : isApproved
                            ? "bg-green-100 dark:bg-green-900/50"
                            : isSelected
                              ? "bg-amber-100 dark:bg-amber-900/50"
                              : "bg-blue-50 dark:bg-blue-900/30 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50",
                      )}
                    >
                      <FileText
                        className={
                          isRejected
                            ? "text-red-500 dark:text-red-400"
                            : isApproved
                              ? "text-green-500 dark:text-green-400"
                              : isSelected
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-blue-500 dark:text-blue-400"
                        }
                        size={24}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "font-semibold text-sm line-clamp-2",
                          isSelectable
                            ? "text-gray-900 dark:text-white"
                            : "text-gray-500 dark:text-gray-400",
                        )}
                      >
                        {spec.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Created: {formatDate(spec.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenSpecification({ specification: spec, readOnly: true });
                      }}
                      className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition bg-muted/40 text-gray-700 hover:bg-muted dark:bg-neutral-800/40 dark:text-gray-200 dark:hover:bg-neutral-700"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </button>

                    <button
                      type="button"
                      disabled={downloadingId === spec.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDownload(spec);
                      }}
                      className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition bg-muted/40 text-gray-700 hover:bg-muted dark:bg-neutral-800/40 dark:text-gray-200 dark:hover:bg-neutral-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {downloadingId === spec.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      {downloadingId === spec.id ? "Downloading..." : "Download"}
                    </button>

                    {canRevise && !isRejected && !isApproved && !isCompleted && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={disabled}
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenSpecification({ specification: spec, readOnly: false });
                        }}
                      >
                        <Pencil size={14} />
                        Edit &amp; Complete
                      </Button>
                    )}

                    {canRevise && isRejected && (
                      <Button
                        type="button"
                        size="sm"
                        disabled={disabled || createSpecification.isPending}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleCreateRevised(spec);
                        }}
                      >
                        <RefreshCw size={14} />
                        {createSpecification.isPending
                          ? "Creating..."
                          : "Create Revised Specs"}
                      </Button>
                    )}

                    {isApproved && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-md bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                        <CheckCircle2 size={14} />
                        Approved
                      </span>
                    )}

                    {isRejected && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-md bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                        <XCircle size={14} />
                        Rejected
                      </span>
                    )}

                    {!isRejected && !isApproved && !isCompleted && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-md border">
                        Not completed
                      </span>
                    )}

                    {isSelectable && isSelected && (
                      <div className="w-6 h-6 rounded-full bg-amber-500 dark:bg-amber-600 flex items-center justify-center shadow-md">
                        <CheckCircle2 className="text-white" size={16} />
                      </div>
                    )}

                    {isSelectable && !isSelected && (
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 group-hover:border-blue-400 dark:group-hover:border-blue-600 transition-colors"></div>
                    )}
                  </div>
                </div>

                {remark && (
                  <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-300">
                    Rejection remark: {remark}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ))}

      <ViewSpecsModal
        open={!!openSpecification}
        onOpenChange={(open) => {
          if (!open) setOpenSpecification(null);
        }}
        specification={openSpecification?.specification ?? null}
        readOnly={openSpecification?.readOnly ?? true}
        notice={openRemark ? `Rejection remark: ${openRemark}` : undefined}
        allowRevisedDocsPrivilege
        showReviewColumns
        stackSections
        contentClassName="w-[95vw] max-w-[95vw] sm:w-[92vw] sm:max-w-[92vw] xl:max-w-[1680px]"
      />
    </div>
  );
}
