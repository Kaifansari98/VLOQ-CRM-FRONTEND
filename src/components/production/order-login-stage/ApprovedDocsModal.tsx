"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAppSelector } from "@/redux/store";
import { useApprovedTechCheckDocuments } from "@/api/production/order-login";
import { useDeleteDocument } from "@/api/leads";

import SectionHeader from "@/utils/sectionHeader";
import { ImageComponent } from "@/components/utils/ImageCard";
import DocumentCard from "@/components/utils/documentCard";
import { Ban, File, FileText, FolderOpen, ImageIcon } from "lucide-react";
import { getFileExtension, isImageExt } from "@/components/utils/filehelper";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface ApprovedDocsSectionProps {
  leadId: number;
  instanceId?: number | null;
  itemGroups?: Array<{
    productTypeId: number;
    title: string;
    subtitle?: string;
  }>;
  instanceToProductTypeEntries?: Array<{
    instanceId: number;
    productTypeId: number;
  }>;
  isSmallOrderRequestLead?: boolean;
  smallOrderRequestDocuments?: Array<{
    id: number;
    document_id: number;
    original_name: string;
    signed_url: string | null;
    created_at: string;
  }>;
}

export default function ApprovedDocsSection({
  leadId,
  instanceId,
  itemGroups = [],
  instanceToProductTypeEntries = [],
  isSmallOrderRequestLead = false,
  smallOrderRequestDocuments = [],
}: ApprovedDocsSectionProps) {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const userType = useAppSelector((s) => s.auth.user?.user_type?.user_type);
  const handlesLargeScaleProjects = useAppSelector(
    (s) => s.auth.user?.vendor?.handlesLargeScaleProjects === true,
  );

  // ✅ Fetch approved docs
  const { data, isLoading, isError } = useApprovedTechCheckDocuments(
    vendorId,
    leadId,
    !isSmallOrderRequestLead,
  );
  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);

  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);
  const [selectedProductTypeId, setSelectedProductTypeId] = useState<
    number | null
  >(null);

  const getDocName = (file: any) =>
    file?.doc_og_name ||
    file?.original_name ||
    file?.doc_sys_name ||
    file?.doc_name ||
    "";

  const scopedDocs = isSmallOrderRequestLead
    ? smallOrderRequestDocuments
    : !handlesLargeScaleProjects && instanceId != null
      ? (data || []).filter(
          (file: any) => file?.product_structure_instance_id === instanceId
        )
      : data || [];

  const groupedLargeScaleDocs = useMemo(() => {
    if (!handlesLargeScaleProjects || isSmallOrderRequestLead) return [];

    const instanceToProductTypeMap = new Map<number, number>();
    instanceToProductTypeEntries.forEach((entry) => {
      if (entry?.instanceId && entry?.productTypeId) {
        instanceToProductTypeMap.set(
          Number(entry.instanceId),
          Number(entry.productTypeId),
        );
      }
    });

    const grouped = new Map<
      number,
      {
        productTypeId: number;
        title: string;
        subtitle?: string;
        docs: any[];
      }
    >();

    scopedDocs.forEach((file: any) => {
      const productTypeId = Number(
        file?.product_type_id ||
          (file?.product_structure_instance_id
            ? instanceToProductTypeMap.get(
                Number(file.product_structure_instance_id),
              )
            : 0) ||
          0,
      );
      if (!productTypeId) return;

      const existingGroup = grouped.get(productTypeId);
      const itemGroup = itemGroups.find(
        (group) => Number(group.productTypeId) === productTypeId,
      );

      if (existingGroup) {
        existingGroup.docs.push(file);
        return;
      }

      grouped.set(productTypeId, {
        productTypeId,
        title: itemGroup?.title || `Item Group ${productTypeId}`,
        subtitle: itemGroup?.subtitle,
        docs: [file],
      });
    });

    return Array.from(grouped.values()).sort((a, b) =>
      a.title.localeCompare(b.title),
    );
  }, [
    handlesLargeScaleProjects,
    instanceToProductTypeEntries,
    isSmallOrderRequestLead,
    itemGroups,
    scopedDocs,
  ]);

  const selectedLargeScaleGroup = useMemo(
    () =>
      groupedLargeScaleDocs.find(
        (group) => group.productTypeId === selectedProductTypeId,
      ) ?? null,
    [groupedLargeScaleDocs, selectedProductTypeId],
  );

  const selectedLargeScaleDocs = selectedLargeScaleGroup?.docs ?? [];

  const { approvedImages, approvedDocuments } = useMemo(() => {
    const images: any[] = [];
    const documents: any[] = [];

    const docsToSplit = handlesLargeScaleProjects && !isSmallOrderRequestLead
      ? selectedLargeScaleDocs
      : scopedDocs;

    docsToSplit.forEach((file: any) => {
      const name = getDocName(file);
      const ext = getFileExtension(name);
      if (isImageExt(ext)) {
        images.push(file);
      } else {
        documents.push(file);
      }
    });

    return { approvedImages: images, approvedDocuments: documents };
  }, [
    handlesLargeScaleProjects,
    isSmallOrderRequestLead,
    scopedDocs,
    selectedLargeScaleDocs,
  ]);

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

  const canDelete = userType === "admin" || userType === "super-admin";

  // ✅ UI States
  if (isLoading) {
    return (
      <div className="border rounded-lg bg-background p-6 flex justify-center">
        <p className="text-muted-foreground text-sm animate-pulse">
          Loading approved documents...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="border rounded-lg bg-background p-6 flex justify-center">
        <p className="text-red-500 text-sm">
          Failed to load approved documents.
        </p>
      </div>
    );
  }

  const totalDocs = approvedImages.length + approvedDocuments.length;
  const shouldShowLargeScaleGrouping =
    handlesLargeScaleProjects && !isSmallOrderRequestLead;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl bg-background overflow-hidden"
    >
      {/* 🌟 Empty State */}
      {shouldShowLargeScaleGrouping ? (
        groupedLargeScaleDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[40vh] px-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Ban size={32} className="text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg text-foreground mb-1">
              No Approved Documents Found
            </h3>
            <p className="text-xs text-muted-foreground text-center max-w-sm leading-relaxed">
              Once documents are approved, you can view them item-group wise
              here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-hidden bg-[#fff] dark:bg-[#0a0a0a]">
              {/* <SectionHeader
                title="Approved Item Groups Documents"
                docCount={groupedLargeScaleDocs.length}
              /> */}
              <div className="flex items-center gap-2">
              <File size={18}/>
              <p className="text-lg font-medium">Approved Item Groups Documents</p>
              </div>
              <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2 xl:grid-cols-3">
                {groupedLargeScaleDocs.map((group) => (
                  <Card
                    key={group.productTypeId}
                    className="cursor-pointer border border-border/60 shadow-none transition hover:border-foreground/20 hover:shadow-sm"
                    onClick={() => setSelectedProductTypeId(group.productTypeId)}
                  >
                    <CardContent className="px-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl border bg-neutral-50 text-blue-600 dark:bg-neutral-800">
                            <ImageIcon className="h-6 w-6" />
                          </div>

                          <div>
                            <h3 className="font-semibold text-sm">
                              {group.title}
                            </h3>
                            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                              {group.subtitle || "View approved documents for this item group"}
                            </p>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-muted-foreground hover:text-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProductTypeId(group.productTypeId);
                          }}
                        >
                          View
                        </Button>
                      </div>

                      <div className="my-4 border-t" />

                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <FolderOpen className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {group.docs.length} file
                            {group.docs.length === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>

                      {group.docs.length > 0 ? (
                        <div className="flex -space-x-2">
                          {group.docs.slice(0, 4).map((doc: any, idx: number) => (
                            <div
                              key={doc.id}
                              className="flex h-10 w-10 items-center justify-center rounded-lg border bg-neutral-100 dark:bg-neutral-800"
                              style={{ zIndex: 4 - idx }}
                            >
                              <FileText className="h-4 w-4 text-muted-foreground" />
                            </div>
                          ))}

                          {group.docs.length > 4 ? (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-200 text-xs font-medium text-muted-foreground dark:bg-neutral-700">
                              +{group.docs.length - 4}
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-muted-foreground">
                          No files uploaded yet
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )
      ) : totalDocs === 0 ? (
        <div className="flex flex-col items-center justify-center h-[40vh] px-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Ban size={32} className="text-muted-foreground" />
          </div>

          <h3 className="font-semibold text-lg text-foreground mb-1">
            No Approved Documents Found
          </h3>

          <p className="text-xs text-muted-foreground text-center max-w-sm leading-relaxed">
            {isSmallOrderRequestLead
              ? "No documents were found for this partial order request."
              : "Once documents are approved, you can preview or download them here."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 🌟 Approved Images */}
          {approvedImages.length > 0 && (
            <div className="border rounded-xl overflow-hidden bg-[#fff] dark:bg-[#0a0a0a]">
              <SectionHeader
                title="Approved Images"
                docCount={approvedImages.length}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {approvedImages.map((doc: any, index: number) => (
                  <ImageComponent
                    key={doc.id}
                    doc={{
                      id: doc.document_id ?? doc.id,
                      doc_og_name: getDocName(doc),
                      signedUrl: doc.signed_url,
                      created_at: doc.created_at,
                    }}
                    index={index}
                    canDelete={canDelete && !isSmallOrderRequestLead}
                    onDelete={(id) => setConfirmDelete(Number(id))}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 🌟 Approved File Documents */}
          {approvedDocuments.length > 0 && (
            <div className="border rounded-xl overflow-hidden bg-[#fff] dark:bg-[#0a0a0a]">
              <SectionHeader
                title="Approved Files"
                docCount={approvedDocuments.length}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {approvedDocuments.map((doc: any) => (
                  <DocumentCard
                    key={doc.id}
                    doc={{
                      id: doc.document_id ?? doc.id,
                      originalName: getDocName(doc),
                      signedUrl: doc.signed_url,
                      created_at: doc.created_at,
                    }}
                    canDelete={canDelete && !isSmallOrderRequestLead}
                    onDelete={(id) => setConfirmDelete(id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog
        open={shouldShowLargeScaleGrouping && !!selectedLargeScaleGroup}
        onOpenChange={(open) => {
          if (!open) setSelectedProductTypeId(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>
              {selectedLargeScaleGroup?.title || "Item Group"}
            </DialogTitle>
            <DialogDescription>
              View all approved documents for this item group.
            </DialogDescription>
          </DialogHeader>

          {selectedLargeScaleDocs.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              No approved documents found for this item group.
            </div>
          ) : (
            <div className="space-y-4">
              {approvedImages.length > 0 && (
                <div className="border rounded-xl overflow-hidden bg-[#fff] dark:bg-[#0a0a0a]">
                  <SectionHeader
                    title="Approved Images"
                    docCount={approvedImages.length}
                  />

                  <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
                    {approvedImages.map((doc: any, index: number) => (
                      <ImageComponent
                        key={doc.id}
                        doc={{
                          id: doc.document_id ?? doc.id,
                          doc_og_name: getDocName(doc),
                          signedUrl: doc.signed_url,
                          created_at: doc.created_at,
                        }}
                        index={index}
                        canDelete={canDelete}
                        onDelete={(id) => setConfirmDelete(Number(id))}
                      />
                    ))}
                  </div>
                </div>
              )}

              {approvedDocuments.length > 0 && (
                <div className="border rounded-xl overflow-hidden bg-[#fff] dark:bg-[#0a0a0a]">
                  <SectionHeader
                    title="Approved Files"
                    docCount={approvedDocuments.length}
                  />

                  <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
                    {approvedDocuments.map((doc: any) => (
                      <DocumentCard
                        key={doc.id}
                        doc={{
                          id: doc.document_id ?? doc.id,
                          originalName: getDocName(doc),
                          signedUrl: doc.signed_url,
                          created_at: doc.created_at,
                        }}
                        canDelete={canDelete}
                        onDelete={(id) => setConfirmDelete(id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 🌟 Delete Confirmation Modal */}
      <AlertDialog
        open={!isSmallOrderRequestLead && !!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected document will be
              permanently removed.
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
    </motion.div>
  );
}
