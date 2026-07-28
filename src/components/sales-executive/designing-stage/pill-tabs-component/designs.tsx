"use client";

import React, { useMemo, useState } from "react";
import { useDetails } from "./details-context";
import { useAppSelector } from "@/redux/store";
import { Palette, Images, PenTool, ArrowLeft, Package } from "lucide-react";
import {
  useLeadStatus,
  useDesignsDoc,
} from "@/hooks/designing-stage/designing-leads-hooks";
import { useLeadProductStructureInstances } from "@/hooks/useLeadsQueries";
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

  // ✅ Fetch lead status
  const { data: leadData } = useLeadStatus(leadId, vendorId);
  const leadStatus = leadData?.status;

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

  const groupedDesignDocs = useMemo(() => {
    if (!handlesLargeScaleProjects) {
      return [];
    }

    const instanceMap = new Map(
      structureInstances.map((item: any) => [String(item.id), item]),
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
      const rawInstanceId = doc.product_structure_instance_id;
      const instance =
        rawInstanceId != null
          ? instanceMap.get(String(rawInstanceId))
          : null;
      const productTypeTitle = instance?.productType?.type?.trim() || "";
      const groupKey = normalizeGroupKey(productTypeTitle);

      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, {
          id: groupKey,
          title:
            productTypeTitle ||
            (groupKey === UNASSIGNED_GROUP_ID ? "Other Designs" : "Item Group"),
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
        (productTypeKey === UNASSIGNED_GROUP_ID ? "Other Designs" : "Item Group");

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
  }, [handlesLargeScaleProjects, structureInstances, sortedDesignDocs]);

  const selectedGroup = useMemo(
    () =>
      groupedDesignDocs.find((group) => group.id === selectedGroupId) || null,
    [groupedDesignDocs, selectedGroupId],
  );

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

  // ✅ Empty State
  if (!designDocs || designDocs.length === 0) {
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
              {handlesLargeScaleProjects && !selectedGroup
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
          {handlesLargeScaleProjects && !selectedGroup ? (
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
                  ? "No design documents found for this item group."
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
    </div>
  );
};

export default DesigningTab;
