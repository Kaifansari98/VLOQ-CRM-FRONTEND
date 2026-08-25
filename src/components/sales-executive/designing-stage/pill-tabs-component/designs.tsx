"use client";

import React, { useMemo, useState } from "react";
import { useDetails } from "./details-context";
import { useAppSelector } from "@/redux/store";
import { Palette, Images, PenTool, ArrowLeft, Package } from "lucide-react";
import {
  useLeadStatus,
  useDesignsDoc,
} from "@/hooks/designing-stage/designing-leads-hooks";
import type { LeadSpecificationEntry } from "@/api/designingStageQueries";
import { useLeadProductStructureInstances, useLeadById } from "@/hooks/useLeadsQueries";
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
import { useDeleteDocument } from "@/api/leads";
import DocumentCard from "@/components/utils/documentCard";
import Loader from "@/components/utils/loader";
import { Button } from "@/components/ui/button";
import ComingSoon from "@/components/generics/ComingSoon";
import { Badge } from "@/components/ui/badge";
import ViewSpecsModal from "./modals/view-specs-modal";
import { useB2BRequirementTypes } from "@/hooks/useTypesMaster";
import { useFranchisesByVendorId } from "@/api/franchise";

const getSortedLatestFirst = <T extends { created_at?: string; id: number }>(
  docs: T[],
) =>
  [...docs].sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    if (timeB !== timeA) return timeB - timeA;
    return b.id - a.id;
  });

const UNASSIGNED_GROUP_ID = "__unassigned__";
const normalizeGroupKey = (value?: string | null) =>
  value?.trim().toLowerCase() || UNASSIGNED_GROUP_ID;

const DesigningTab = () => {
  const { leadId } = useDetails();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const handlesLargeScaleProjects = useAppSelector(
    (state) => state.auth.user?.vendor?.handlesLargeScaleProjects === true,
  );
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type,
  );
  const customPrivilegeCodes = useAppSelector(
    (state) => state.customPrivileges.codes,
  );
  const userId = useAppSelector((state) => state.auth.user?.id);

  // ✅ Fetch lead status & details
  const { data: leadData } = useLeadStatus(leadId, vendorId);
  const leadStatus = leadData?.status;

  const { data: leadDetailsData } = useLeadById(leadId, vendorId, userId);
  const lead = leadDetailsData?.data?.lead;

  const { data: franchisesForB2b = [] } = useFranchisesByVendorId(vendorId, !!vendorId);
  const isB2b = useMemo(() => {
    const leadFranchise = franchisesForB2b.find(
      (franchise: any) => franchise.id === lead?.franchise_id,
    );
    return leadFranchise?.moduled_for_b2b ?? false;
  }, [franchisesForB2b, lead?.franchise_id]);

  const { data: b2bReqTypesData } = useB2BRequirementTypes(vendorId);
  const b2bReqTypes = useMemo(() => b2bReqTypesData?.data || [], [b2bReqTypesData]);

  // ✅ Fetch design documents
  const { data, error, isLoading } = useDesignsDoc(vendorId!, leadId);
  const { data: structureInstancesData, isLoading: isInstancesLoading } =
    useLeadProductStructureInstances(
      leadId,
      vendorId,
      handlesLargeScaleProjects,
    );
  const designDocs = data?.data?.documents || [];
  const sortedDesignDocs = getSortedLatestFirst(designDocs);
  const structureInstances: any[] = Array.isArray(structureInstancesData?.data)
    ? structureInstancesData.data
    : [];

  // ✅ Delete document mutation
  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);

  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedSpec, setSelectedSpec] =
    useState<LeadSpecificationEntry | null>(null);

  const groupedDesignDocs = useMemo(() => {
    if (!handlesLargeScaleProjects) {
      return [];
    }

    const productTypeMap = new Map(
      structureInstances
        .map((item: any) => {
          const productTypeId =
            item.productType?.id ??
            item.productItemCode?.productStructure?.productType?.id;
          const productTypeTitle =
            item.productType?.type?.trim() ||
            item.productItemCode?.productStructure?.productType?.type?.trim() ||
            "";

          return productTypeId
            ? [String(productTypeId), productTypeTitle] as const
            : null;
        })
        .filter(Boolean) as readonly (readonly [string, string])[],
    );

    const grouped = new Map<
      string,
      {
        id: string;
        title: string;
        subtitle: string;
        docs: any[];
      }
    >();

    for (const doc of sortedDesignDocs) {
      const productTypeId = doc.product_type_id;
      if (!productTypeId) {
        const key = UNASSIGNED_GROUP_ID;
        if (!grouped.has(key)) {
          grouped.set(key, {
            id: key,
            title: "Unassigned Documents",
            subtitle: "No linked item group",
            docs: [],
          });
        }
        grouped.get(key)!.docs.push(doc);
        continue;
      }

      const title = productTypeMap.get(String(productTypeId)) || `Group #${productTypeId}`;
      const key = normalizeGroupKey(title);
      if (!grouped.has(key)) {
        grouped.set(key, {
          id: key,
          title,
          subtitle: "Product type",
          docs: [],
        });
      }
      if (!grouped.get(key)!.docs.includes(doc)) {
        grouped.get(key)!.docs.push(doc);
      }
    }

    for (const inst of structureInstances) {
      const title =
        inst?.productType?.type ||
        inst?.productItemCode?.productStructure?.productType?.type ||
        `Group #${inst.id}`;
      const key = normalizeGroupKey(title);
      if (!grouped.has(key)) {
        grouped.set(key, {
          id: key,
          title,
          subtitle: "Product type",
          docs: [],
        });
      }
    }

    return Array.from(grouped.values()).sort((a, b) =>
      a.title.localeCompare(b.title),
    );
  }, [handlesLargeScaleProjects, structureInstances, sortedDesignDocs]);

  const selectedGroup = useMemo(
    () =>
      groupedDesignDocs.find((group) => group.id === selectedGroupId) || null,
    [groupedDesignDocs, selectedGroupId],
  );

  // Group B2B documents by Requirement Type
  const b2bGroupedDocs = useMemo(() => {
    if (!isB2b) return [];

    const mappedB2bIds = Array.from(
      new Set([
        ...((lead as any)?.leadB2BReqMappings?.map((m: any) => m.b2b_requirement_type_id) || []),
        ...((lead as any)?.leadProcessBriefs?.map((m: any) => m.b2b_requirement_type_id) || []),
        ...designDocs.map((d: any) => d.b2b_requirement_type_id).filter(Boolean),
      ])
    );

    return mappedB2bIds
      .map((typeId: any) => {
        const typeObj = b2bReqTypes.find((t: any) => t.id === typeId);
        const name = typeObj?.type || `Requirement #${typeId}`;
        const docs = designDocs.filter((d: any) => d.b2b_requirement_type_id === typeId);
        return {
          id: typeId,
          name,
          docs: getSortedLatestFirst(docs),
        };
      })
      .sort((a, b) => b.docs.length - a.docs.length);
  }, [isB2b, lead, designDocs, b2bReqTypes]);

  // ✅ Handle confirm delete
  const handleConfirmDelete = () => {
    if (confirmDelete) {
      deleteDocument({
        vendorId: vendorId!,
        documentId: confirmDelete,
        deleted_by: userId!,
      });
      setConfirmDelete(null);
    }
  };

  // ✅ Loader (full screen)
  if (isLoading || (handlesLargeScaleProjects && isInstancesLoading)) {
    return <Loader size={250} message="Loading Design Documents..." />;
  }

  // ✅ Error State
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] px-4">
        <div className="w-16 h-16 bg-[#fff] dark:bg-[#0a0a0a] rounded-full flex items-center justify-center mb-4">
          <Palette size={32} className="text-destructive" />
        </div>
        <p className="text-sm text-muted-foreground">
          Error loading design documents. Please try again later.
        </p>
      </div>
    );
  }

  // ✅ Empty State (if not B2B)
  if (!isB2b && (!designDocs || designDocs.length === 0) && !handlesLargeScaleProjects) {
    return (
      <ComingSoon
        heading="No Design Documents"
        description="Design files will appear here once they are uploaded."
      />
    );
  }

  // ✅ Permission Logic (same as QuotationTab)
  const canDelete =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes("leads.designing_stage.designs.delete")
      : userType === "admin" ||
        userType === "super-admin" ||
        (userType === "sales-executive" && leadStatus === "designing-stage");

  // ✅ Render Design Documents using DocumentCard
  return (
    <div className="">
      <section
        className="
    bg-[#fff] dark:bg-[#0a0a0a]
    rounded-2xl
    border border-border
    shadow-soft
    overflow-hidden
  "
      >
        {/* Header */}
        <div
          className="
      flex flex-col sm:flex-row sm:items-center justify-between items-start gap-1 sm:gap-2
      px-5 py-3
      border-b border-border
      bg-[#fff] dark:bg-[#0a0a0a]
    "
        >
          <div className="flex items-center gap-2">
            <PenTool size={20} className="shrink-0" />
            <h1 className="text-lg font-semibold tracking-tight">
              {handlesLargeScaleProjects && selectedGroup
                ? selectedGroup.title
                : "Designs"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {handlesLargeScaleProjects && selectedGroup && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedGroupId(null)}
              >
                <ArrowLeft size={14} className="mr-1" />
                Back
              </Button>
            )}
            <span className="text-xs font-medium text-muted-foreground shrink-0 text-right">
              {isB2b
                ? `${designDocs.length} ${designDocs.length === 1 ? "Document" : "Documents"}`
                : handlesLargeScaleProjects && !selectedGroup
                  ? `${groupedDesignDocs.length} ${
                      groupedDesignDocs.length === 1 ? "Item Group" : "Item Groups"
                    }`
                  : `${(selectedGroup?.docs || designDocs).length} ${
                      (selectedGroup?.docs || designDocs).length === 1
                        ? "Document"
                        : "Documents"
                    }`}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {isB2b ? (
            <div className="space-y-6">
              {b2bGroupedDocs.map((type) => (
                <div
                  key={type.id}
                  className="rounded-xl border border-border bg-[#fff] dark:bg-[#09090b] overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary shrink-0" />
                      <h3 className="text-sm font-semibold text-foreground">
                        {type.name}
                      </h3>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {type.docs.length} {type.docs.length === 1 ? "File" : "Files"}
                    </span>
                  </div>

                  <div className="p-4">
                    {type.docs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                        <Package className="h-8 w-8 opacity-40 mb-2" />
                        <p className="text-xs text-muted-foreground">No design documents uploaded yet.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {type.docs.map((doc: any, index: number) => (
                          <DocumentCard
                            key={doc.id}
                            doc={{
                              id: doc.id,
                              originalName: doc.doc_og_name,
                              signedUrl: doc.signedUrl || "",
                              created_at: doc.created_at,
                            }}
                            isLatest={index === 0}
                            tagLabel="Design"
                            canDelete={canDelete}
                            onDelete={(id) => setConfirmDelete(id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : handlesLargeScaleProjects && !selectedGroup ? (
            <div className="grid gap-4 md:grid-cols-2">
              {groupedDesignDocs.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setSelectedGroupId(group.id)}
                  className="group rounded-xl border bg-white/60 p-5 text-left transition-all hover:border-border/80 dark:bg-[#0a0a0a] min-w-0"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Package className="h-4 w-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">
                          Item Group
                        </span>
                      </div>
                      <p className="line-clamp-2 text-base font-semibold leading-tight text-heading transition-colors group-hover:text-foreground dark:text-neutral-200 break-words">
                        {group.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {group.subtitle}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {group.docs.length} {group.docs.length === 1 ? "file" : "files"}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          ) : (selectedGroup ? selectedGroup.docs : sortedDesignDocs).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {(selectedGroup ? selectedGroup.docs : sortedDesignDocs).map(
                (doc: any, index: number) => {
                  const hasSpec = !!doc.specification?.name;

                  return (
                    <div key={doc.id} className="relative mt-8">
                      {hasSpec && (
                        <>
                          <div className="absolute top-[20px] left-[-7px] h-[14px] w-[14px] rounded-full border-2 border-background bg-muted-foreground shadow-sm z-20" />

                          <svg
                            className="absolute pointer-events-none z-10"
                            style={{
                              left: "-20px",
                              top: "-30px",
                              width: "100px",
                              height: "100px",
                              overflow: "visible",
                            }}
                          >
                            <path
                              d="M 20,57 L 12,57 Q 6,57 6,51 L 6,17 Q 6,9 14,9 L 44,9"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              className="text-muted-foreground/60"
                            />
                            <path
                              d="M 39,6 L 44,9 L 39,12"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-muted-foreground/60"
                            />
                          </svg>

                          <button
                            type="button"
                            onClick={() =>
                              setSelectedSpec({
                                id: doc.specification.id,
                                name: doc.specification.name,
                                lead_id: Number(leadId),
                                vendor_id: Number(vendorId),
                                created_by: Number(userId),
                                created_at: doc.created_at,
                                lights_remark: null,
                                appliances_remark: null,
                                stone_remark: null,
                                sinks_remark: null,
                                faucets_remark: null,
                                item_code_id: null,
                              })
                            }
                            className="absolute -top-7 left-6 z-10 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                          >
                            {doc.specification.name}
                          </button>
                        </>
                      )}

                      <DocumentCard
                        doc={{
                          id: doc.id,
                          originalName: doc.doc_og_name,
                          created_at: doc.created_at,
                          signedUrl: doc.signedUrl,
                        }}
                        isLatest={index === 0}
                        canDelete={canDelete}
                        onDelete={(id) => setConfirmDelete(id)}
                      />
                    </div>
                  );
                },
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Images size={42} className="text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                {handlesLargeScaleProjects && selectedGroup
                  ? "No design documents found for this product type."
                  : "No design documents found."}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ✅ Confirmation Dialog */}
      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected design document will be
              permanently removed from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ViewSpecsModal
        open={!!selectedSpec}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSpec(null);
          }
        }}
        specification={selectedSpec}
      />
    </div>
  );
};

export default DesigningTab;
