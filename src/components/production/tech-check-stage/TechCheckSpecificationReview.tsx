"use client";

import React, { useMemo, useState } from "react";
import { Check, ClipboardList, Eye, Pencil, RefreshCw, X } from "lucide-react";
import type { LeadSpecificationEntry } from "@/api/designingStageQueries";
import { useReviewLeadSpecifications } from "@/api/tech-check";
import {
  useCreateLeadSpecification,
  useLeadSpecifications,
} from "@/hooks/designing-stage/designing-leads-hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toastManager } from "@/components/ui/toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ViewSpecsModal from "@/components/sales-executive/designing-stage/pill-tabs-component/modals/view-specs-modal";

type OpenSpecification = {
  specification: LeadSpecificationEntry;
  readOnly: boolean;
};

const getItemGroupTitle = (instance: any) =>
  instance.productType?.type ||
  instance.productItemCode?.productStructure?.productType?.type ||
  "Item Group";

/** Latest specification of each item code, the ones that go through Tech Check. */
export const getLatestItemCodeSpecifications = (
  specifications: LeadSpecificationEntry[],
) =>
  specifications.filter(
    (spec) => spec.item_code_id && spec.is_latest_for_item_code,
  );

interface TechCheckSpecificationReviewProps {
  leadId: number;
  vendorId: number;
  structureInstances: any[];
  /** Only show specifications of this item group. */
  itemGroupProductTypeId?: number | null;
  userId: number;
  canReview: boolean;
  canRevise: boolean;
  disabled?: boolean;
}

export default function TechCheckSpecificationReview({
  leadId,
  vendorId,
  structureInstances,
  itemGroupProductTypeId,
  userId,
  canReview,
  canRevise,
  disabled = false,
}: TechCheckSpecificationReviewProps) {
  const { data: specifications = [] } = useLeadSpecifications(vendorId, leadId);
  const reviewSpecifications = useReviewLeadSpecifications();
  const createSpecification = useCreateLeadSpecification();

  const [openSpecification, setOpenSpecification] =
    useState<OpenSpecification | null>(null);
  const [rejectingSpec, setRejectingSpec] =
    useState<LeadSpecificationEntry | null>(null);
  const [rejectRemark, setRejectRemark] = useState("");

  const groups = useMemo(() => {
    const itemCodeGroups = new Map<number, string>();
    structureInstances.forEach((instance: any) => {
      const productTypeId =
        instance.product_type_id ||
        instance.product_type?.id ||
        instance.productType?.id ||
        instance.productItemCode?.productStructure?.productType?.id;
      if (
        itemGroupProductTypeId &&
        Number(productTypeId) !== Number(itemGroupProductTypeId)
      ) {
        return;
      }
      if (instance.productItemCode?.id) {
        itemCodeGroups.set(
          instance.productItemCode.id,
          getItemGroupTitle(instance),
        );
      }
    });

    const grouped = new Map<string, LeadSpecificationEntry[]>();
    getLatestItemCodeSpecifications(specifications).forEach((spec) => {
      if (itemGroupProductTypeId && !itemCodeGroups.has(spec.item_code_id!)) return;
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

  const handleApprove = (spec: LeadSpecificationEntry) => {
    reviewSpecifications.mutate(
      { vendorId, leadId, specificationIds: [spec.id], status: "APPROVED" },
      {
        onSuccess: () =>
          toastManager.add({
            title: `${spec.name} approved`,
            type: "success",
          }),
      },
    );
  };

  const handleReject = () => {
    if (!rejectingSpec || !rejectRemark.trim()) return;
    reviewSpecifications.mutate(
      {
        vendorId,
        leadId,
        specificationIds: [rejectingSpec.id],
        status: "REJECTED",
        remark: rejectRemark.trim(),
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: `${rejectingSpec.name} rejected`,
            type: "success",
          });
          setRejectingSpec(null);
          setRejectRemark("");
        },
      },
    );
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

  const isBusy =
    disabled || reviewSpecifications.isPending || createSpecification.isPending;
  const openRemark = openSpecification
    ? getRejectionRemark(openSpecification.specification)
    : null;

  return (
    <div className="space-y-3 px-6">
      <div className="flex flex-col justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-white">
          Specifications
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Latest specification of each item group
        </p>
      </div>

      {groups.map(([title, specs]) => (
        <div key={title} className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">{title}</p>

          {specs.map((spec) => {
            const status = spec.tech_check_status;
            const isReviewed = status === "APPROVED" || status === "REJECTED";
            const remark = getRejectionRemark(spec);

            return (
              <div key={spec.id} className="space-y-2 rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <ClipboardList size={18} className="shrink-0 text-primary" />
                    <span className="truncate text-sm font-medium" title={spec.name}>
                      {spec.name}
                    </span>
                    {status === "APPROVED" ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300">
                        Approved
                      </Badge>
                    ) : status === "REJECTED" ? (
                      <Badge variant="destructive">Rejected</Badge>
                    ) : !spec.is_completed ? (
                      <Badge variant="outline">Not completed</Badge>
                    ) : (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setOpenSpecification({ specification: spec, readOnly: true })
                      }
                    >
                      <Eye size={14} />
                      View
                    </Button>

                    {canReview && !isReviewed && spec.is_completed && (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          disabled={isBusy}
                          onClick={() => handleApprove(spec)}
                        >
                          <Check size={14} />
                          Approve
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={isBusy}
                          onClick={() => setRejectingSpec(spec)}
                        >
                          <X size={14} />
                          Reject
                        </Button>
                      </>
                    )}

                    {canRevise && !isReviewed && !spec.is_completed && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={disabled}
                        onClick={() =>
                          setOpenSpecification({ specification: spec, readOnly: false })
                        }
                      >
                        <Pencil size={14} />
                        Edit &amp; Complete
                      </Button>
                    )}

                    {canRevise && status === "REJECTED" && (
                      <Button
                        type="button"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => handleCreateRevised(spec)}
                      >
                        <RefreshCw size={14} />
                        {createSpecification.isPending
                          ? "Creating..."
                          : "Create Revised Specs"}
                      </Button>
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

      <AlertDialog
        open={!!rejectingSpec}
        onOpenChange={(open) => {
          if (!open) {
            setRejectingSpec(null);
            setRejectRemark("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Specification?</AlertDialogTitle>
            <AlertDialogDescription>
              Add what needs to change. A revised copy of {rejectingSpec?.name}{" "}
              will have to be created and approved again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={rejectRemark}
            onChange={(event) => setRejectRemark(event.target.value)}
            maxLength={2000}
            placeholder="Enter rejection remark"
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reviewSpecifications.isPending}>
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={!rejectRemark.trim() || reviewSpecifications.isPending}
              onClick={handleReject}
            >
              {reviewSpecifications.isPending ? "Rejecting..." : "Reject"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
