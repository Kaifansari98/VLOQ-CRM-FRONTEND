"use client";

import React, { useMemo, useState } from "react";
import { useDetails } from "./details-context";
import { useAppSelector } from "@/redux/store";
import {
  ArrowLeft,
  Ban,
  Images,
  Package,
  ScrollText,
} from "lucide-react";
import {
  useLeadStatus,
  useQuotationDoc,
} from "@/hooks/designing-stage/designing-leads-hooks";
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
import { Button } from "@/components/ui/button";
import ComingSoon from "@/components/generics/ComingSoon";
import Loader from "@/components/utils/loader";
import { Badge } from "@/components/ui/badge";
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

const QuotationTab = () => {
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

  // ✅ Hooks for status, details & document retrieval
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

  const { data, error, isLoading } = useQuotationDoc(vendorId, leadId);
  const { data: structureInstancesData, isLoading: isInstancesLoading } =
    useLeadProductStructureInstances(
      leadId,
      vendorId,
      handlesLargeScaleProjects,
    );

  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);
  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

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
  const designQuotationDocs = data?.data?.documents || [];
  const sortedQuotationDocs: any[] = getSortedLatestFirst(designQuotationDocs);
  const structureInstances: any[] = Array.isArray(structureInstancesData?.data)
    ? structureInstancesData.data
    : [];

  const groupedQuotationDocs = useMemo(() => {
    if (!handlesLargeScaleProjects) {
      return [];
    }

    const instanceMap = new Map(
      structureInstances.map((item: any) => [String(item.id), item]),
    );
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

    for (const doc of sortedQuotationDocs) {
      const rawInstanceId = doc.product_structure_instance_id;
      const instance =
        rawInstanceId != null
          ? instanceMap.get(String(rawInstanceId))
          : null;
      const productTypeTitle =
        instance?.productType?.type?.trim() ||
        (doc.product_type_id != null
          ? productTypeMap.get(String(doc.product_type_id)) || ""
          : "");
      const groupKey = normalizeGroupKey(productTypeTitle);

      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, {
          id: groupKey,
          title:
            productTypeTitle ||
            (groupKey === UNASSIGNED_GROUP_ID
              ? "Other Quotations"
              : "Item Group"),
          subtitle:
            groupKey === UNASSIGNED_GROUP_ID
              ? "Unassigned files"
              : "Product type",
          docs: [],
        });
      }

      grouped.get(groupKey)!.docs.push(doc);
    }

    const uniqueProductTypes = [
      ...new Set(
        structureInstances
          .map((instance: any) => normalizeGroupKey(instance.productType?.type))
          .filter(Boolean),
      ),
    ];

    for (const productTypeKey of uniqueProductTypes) {
      const matchingInstance = structureInstances.find(
        (instance: any) =>
          normalizeGroupKey(instance.productType?.type) === productTypeKey,
      );
      const title =
        matchingInstance?.productType?.type?.trim() ||
        (productTypeKey === UNASSIGNED_GROUP_ID
          ? "Other Quotations"
          : "Item Group");

      const key = String(productTypeKey);
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
  }, [handlesLargeScaleProjects, sortedQuotationDocs, structureInstances]);

  const selectedGroup = useMemo(
    () =>
      groupedQuotationDocs.find((group) => group.id === selectedGroupId) || null,
    [groupedQuotationDocs, selectedGroupId],
  );

  // Group B2B documents by Requirement Type
  const b2bGroupedDocs = useMemo(() => {
    if (!isB2b) return [];

    const mappedB2bIds = Array.from(
      new Set([
        ...((lead as any)?.leadB2BReqMappings?.map((m: any) => m.b2b_requirement_type_id) || []),
        ...((lead as any)?.leadProcessBriefs?.map((m: any) => m.b2b_requirement_type_id) || []),
        ...designQuotationDocs.map((d: any) => d.b2b_requirement_type_id).filter(Boolean),
      ])
    );

    return mappedB2bIds
      .map((typeId: any) => {
        const typeObj = b2bReqTypes.find((t: any) => t.id === typeId);
        const name = typeObj?.type || `Requirement #${typeId}`;
        const docs = designQuotationDocs.filter((d: any) => d.b2b_requirement_type_id === typeId);
        return {
          id: typeId,
          name,
          docs: getSortedLatestFirst(docs),
        };
      })
      .sort((a, b) => b.docs.length - a.docs.length);
  }, [isB2b, lead, designQuotationDocs, b2bReqTypes]);

  if (isLoading || (handlesLargeScaleProjects && isInstancesLoading)) {
    return <Loader size={250} message="Loading Quotation Documents..." />;
  }

  // ✅ Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] bg-[#fff] dark:bg-[#0a0a0a]">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <Ban size={32} className="text-destructive" />
        </div>
        <p className="text-sm text-muted-foreground">
          Error loading quotations. Please try again later.
        </p>
      </div>
    );
  }

  // ✅ Empty state (if not B2B)
  if (!isB2b && (!designQuotationDocs || designQuotationDocs.length === 0) && !handlesLargeScaleProjects) {
    return (
      <ComingSoon
        heading="No Quotations Found"
        description="Quotation documents will appear here once they are added."
      />
    );
  }

  // ✅ Permission logic for delete
  const canDelete =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes("leads.designing_stage.quotation.delete")
      : userType === "admin" ||
        userType === "super-admin" ||
        (userType === "sales-executive" && leadStatus === "designing-stage");

  return (
    <div>
      {/* -------- Quotation Section (Matched UI) -------- */}
      <div
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
            <ScrollText size={20} className="shrink-0" />
            <h1 className="text-lg font-semibold tracking-tight">
              {handlesLargeScaleProjects && selectedGroup
                ? selectedGroup.title
                : "Quotation"}
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
                ? `${designQuotationDocs.length} ${designQuotationDocs.length === 1 ? "Document" : "Documents"}`
                : handlesLargeScaleProjects && !selectedGroup
                  ? `${groupedQuotationDocs.length} ${
                      groupedQuotationDocs.length === 1 ? "Item Group" : "Item Groups"
                    }`
                  : `${(selectedGroup?.docs || designQuotationDocs).length} ${
                      (selectedGroup?.docs || designQuotationDocs).length === 1
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
                        <p className="text-xs text-muted-foreground">No quotation documents uploaded yet.</p>
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
                            tagLabel="Quotation"
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
              {groupedQuotationDocs.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setSelectedGroupId(group.id)}
                  className="group rounded-xl border bg-white/60 p-5 text-left transition-all hover:border-border/80 dark:bg-[#0a0a0a]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Package className="h-4 w-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">
                          Item Group
                        </span>
                      </div>
                      <p className="line-clamp-2 text-base font-semibold leading-tight text-heading transition-colors group-hover:text-foreground dark:text-neutral-200">
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
          ) : (selectedGroup ? selectedGroup.docs : sortedQuotationDocs).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {(selectedGroup ? selectedGroup.docs : sortedQuotationDocs).map(
                (doc: any, index: number) => (
                  <DocumentCard
                    key={doc.id}
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
                ),
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Images size={42} className="text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                {handlesLargeScaleProjects && selectedGroup
                  ? "No quotations found for this product type."
                  : "No quotations found."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ✅ Delete confirmation dialog */}
      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quotation?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected quotation will be
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
    </div>
  );
};

export default QuotationTab;
