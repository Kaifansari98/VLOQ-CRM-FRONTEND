"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import BaseModal from "@/components/utils/baseModal";
import { useAppSelector } from "@/redux/store";
import { useUploadMoreClientDocumentation } from "@/hooks/client-documentation/use-clientdocumentation";
import { useLeadProductStructureInstances } from "@/hooks/useLeadsQueries";
import { useClientDocumentationDetails } from "@/hooks/client-documentation/use-clientdocumentation";
import { LeadProductStructureInstance, useDeleteDocument } from "@/api/leads";
import { FileUploadField } from "@/components/custom/file-upload";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FolderOpen, FileText, Loader2, Upload } from "lucide-react";
import DocumentCard from "@/components/utils/documentCard";
import { ImageComponent } from "@/components/utils/ImageCard";
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
import { toast } from "react-toastify";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: {
    leadId: number;
    accountId: number;
    selectedInstanceId?: number | null;
  };
}

type SectionId = "project" | "pytha";

interface Section {
  id: SectionId;
  title: string;
  description: string;
  accept: string;
  icon: React.ReactNode;
  iconBg: string;
  color: string;
}

const imageExtensions = ["jpg", "jpeg", "png", "webp"];

const sections: Section[] = [
  {
    id: "project",
    title: "Client Documentation - Project Files",
    description: "Upload project files",
    accept:
      ".ppt,.pptx,.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.csv,.PPT,.PPTX,.PDF,.JPG,.JPEG,.PNG,.DOC,.DOCX,.XLS,.XLSX,.CSV",
    icon: <FileText className="w-6 h-6" />,
    iconBg: "bg-blue-100 dark:bg-blue-900",
    color: "text-blue-600",
  },
  {
    id: "pytha",
    title: "Client Documentation - Pytha Design Files",
    description: "Upload pytha and design files",
    accept:
      ".pyo,.pytha,.PYO,.PYTHA,.pdf,.zip,.PDF,.ZIP,.xls,.xlsx,.csv,.doc,.docx,.ppt,.pptx,.XLS,.XLSX,.CSV,.DOC,.DOCX,.PPT,.PPTX",
    icon: <FolderOpen className="w-6 h-6" />,
    iconBg: "bg-purple-100 dark:bg-purple-900",
    color: "text-purple-600",
  },
];

const UploadMoreClientDocumentationModal: React.FC<Props> = ({
  open,
  onOpenChange,
  data,
}) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id) || 0;
  const createdBy = useAppSelector((state) => state.auth.user?.id) || 0;
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type?.user_type
  )?.toLowerCase();

  const leadId = data?.leadId ?? 0;
  const accountId = data?.accountId ?? 0;
  const selectedInstanceId = data?.selectedInstanceId ?? undefined;
  const searchParams = useSearchParams();
  const urlInstanceIdRaw = searchParams.get("instance_id");
  const urlInstanceId = urlInstanceIdRaw ? Number(urlInstanceIdRaw) : null;
  const validUrlInstanceId =
    urlInstanceId && !Number.isNaN(urlInstanceId) ? urlInstanceId : null;

  const { data: structureInstancesData } = useLeadProductStructureInstances(
    leadId,
    vendorId
  );
  const { data: docsDetails, isLoading: docsLoading } = useClientDocumentationDetails(
    vendorId,
    leadId
  );
  const { mutateAsync: uploadDocs, isPending: uploading } =
    useUploadMoreClientDocumentation();
  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);

  const structureInstances: LeadProductStructureInstance[] = Array.isArray(
    structureInstancesData?.data
  )
    ? structureInstancesData.data
    : [];
  const displayInstances = useMemo(
    () =>
      validUrlInstanceId
        ? structureInstances.filter((item) => item.id === validUrlInstanceId)
        : structureInstances,
    [structureInstances, validUrlInstanceId]
  );
  const hasMultipleInstances = displayInstances.length > 1;
  const canDelete =
    userType === "admin" ||
    userType === "super-admin" ||
    userType === "super admin";

  const [activeInstanceId, setActiveInstanceId] = useState<number | undefined>(
    validUrlInstanceId ?? selectedInstanceId ?? undefined
  );
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);

  useEffect(() => {
    if (!open) {
      setActiveSection(null);
      setSelectedFiles([]);
      return;
    }

    const hasActive = !!activeInstanceId;
    const activeExists =
      hasActive && displayInstances.some((item) => item.id === activeInstanceId);
    const urlExists =
      validUrlInstanceId &&
      displayInstances.some((item) => item.id === validUrlInstanceId);

    if (activeExists) return;

    let nextId: number | undefined;
    if (urlExists) {
      nextId = validUrlInstanceId ?? undefined;
    } else if (hasMultipleInstances) {
      nextId = displayInstances[0]?.id;
    } else {
      nextId = validUrlInstanceId ?? selectedInstanceId ?? undefined;
    }

    if (nextId !== activeInstanceId) {
      setActiveInstanceId(nextId);
    }
  }, [
    open,
    hasMultipleInstances,
    displayInstances,
    activeInstanceId,
    selectedInstanceId,
    validUrlInstanceId,
  ]);

  const docsForSection = useMemo(() => {
    const resolvedInstanceId =
      activeInstanceId ??
      validUrlInstanceId ??
      selectedInstanceId ??
      (hasMultipleInstances ? displayInstances[0]?.id : undefined);

    const flatProject = docsDetails?.documents?.ppt || [];
    const flatPytha = docsDetails?.documents?.pytha || [];

    const getBySection = (sectionId: SectionId) => {
      const grouped = docsDetails?.documents_by_instance || [];
      const targetGroup = hasMultipleInstances
        ? grouped.find((g) => Number(g.instance_id) === Number(resolvedInstanceId))
        : null;

      // Fallback to filtering flat docs when grouped payload is missing/stale
      const filteredFromFlat = (docs: any[]) =>
        docs.filter(
          (doc: any) =>
            Number(doc.product_structure_instance_id) === Number(resolvedInstanceId)
        );

      if (sectionId === "project") {
        if (resolvedInstanceId) {
          return targetGroup?.documents?.ppt || filteredFromFlat(flatProject);
        }
        return flatProject;
      }
      if (resolvedInstanceId) {
        return targetGroup?.documents?.pytha || filteredFromFlat(flatPytha);
      }
      return flatPytha;
    };

    return {
      project: getBySection("project"),
      pytha: getBySection("pytha"),
    };
  }, [docsDetails, hasMultipleInstances, activeInstanceId, displayInstances, validUrlInstanceId, selectedInstanceId]);

  const handleUpload = async () => {
    if (!activeSection) return;
    if (!vendorId || !createdBy) return;
    const resolvedInstanceId =
      activeInstanceId ??
      validUrlInstanceId ??
      selectedInstanceId ??
      (hasMultipleInstances ? displayInstances[0]?.id : undefined);
    if (hasMultipleInstances && !resolvedInstanceId) {
      toast.error("Please select an instance before upload");
      return;
    }
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one file to upload");
      return;
    }

    await uploadDocs({
      leadId,
      accountId,
      vendorId,
      createdBy,
      productStructureInstanceId: resolvedInstanceId || undefined,
      pptDocuments: activeSection.id === "project" ? selectedFiles : [],
      pythaDocuments: activeSection.id === "pytha" ? selectedFiles : [],
    });

    setSelectedFiles([]);
  };

  const handleConfirmDelete = () => {
    if (!confirmDelete) return;
    deleteDocument({
      vendorId,
      documentId: confirmDelete,
      deleted_by: createdBy,
    });
    setConfirmDelete(null);
  };

  const separateImageAndDocs = (docs: any[]) => {
    const images = docs.filter((d: any) => {
      const ext = d.doc_og_name?.split(".").pop()?.toLowerCase();
      return imageExtensions.includes(ext || "");
    });
    const nonImages = docs.filter((d: any) => {
      const ext = d.doc_og_name?.split(".").pop()?.toLowerCase();
      return !imageExtensions.includes(ext || "");
    });
    return { images, nonImages };
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Upload More Client Documentation"
      size="xl"
      description="Manage additional client docs by section."
    >
      <div className="space-y-6 py-4 px-5">
        {(hasMultipleInstances || validUrlInstanceId) && (
          <div>
            <p className="text-sm font-medium mb-3">Product Instance</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {displayInstances.map((instance) => {
                const isActive = activeInstanceId === instance.id;
                return (
                  <Card
                    key={instance.id}
                    className={`cursor-pointer transition ${
                      isActive ? "border-primary bg-primary/5" : ""
                    }`}
                    onClick={() => setActiveInstanceId(instance.id)}
                  >
                    <CardContent className="px-4 py-3 flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold">{instance.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {instance.productStructure?.type || "Product Structure"}
                        </p>
                      </div>
                      <FolderOpen className="size-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sections.map((section, index) => {
            const docs = docsForSection[section.id];
            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <Card
                  className="rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-[0_8px_25px_-4px_rgba(0,0,0,0.12)] transition-all duration-200 cursor-pointer"
                  onClick={() => {
                    setActiveSection(section);
                    setSelectedFiles([]);
                  }}
                >
                  <CardContent className="px-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center border bg-neutral-50 dark:bg-neutral-800 ${section.color}`}
                        >
                          {section.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{section.title}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {section.description}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSection(section);
                          setSelectedFiles([]);
                        }}
                      >
                        {docs.length > 0 ? "View" : "Upload"}
                      </Button>
                    </div>

                    <div className="my-4 border-t" />

                    <div className="flex items-center gap-2 text-sm mb-3">
                      <FolderOpen className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">
                        {docs.length} file{docs.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {docs.length > 0 ? (
                      <div className="flex -space-x-2">
                        {docs.slice(0, 4).map((doc: any, idx: number) => (
                          <div
                            key={doc.id}
                            className="w-10 h-10 rounded-lg border bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center"
                            style={{ zIndex: 4 - idx }}
                          >
                            <FileText className="w-4 h-4 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-2">
                        No files uploaded yet
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <AnimatePresence>
          {activeSection && (
            <BaseModal
              open={!!activeSection}
              onOpenChange={(isOpen) => {
                if (!isOpen) {
                  setActiveSection(null);
                  setSelectedFiles([]);
                }
              }}
              title={activeSection.title}
              description={activeSection.description}
              icon={
                <div
                  className={`p-2.5 rounded-lg ${activeSection.iconBg} ${activeSection.color}`}
                >
                  {activeSection.icon}
                </div>
              }
              size="lg"
            >
              <div className="space-y-6 py-4 px-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Upload New Files</h4>
                    {selectedFiles.length > 0 && (
                      <Badge variant="secondary">{selectedFiles.length} selected</Badge>
                    )}
                  </div>

                  <FileUploadField
                    value={selectedFiles}
                    onChange={setSelectedFiles}
                    accept={activeSection.accept}
                    multiple
                  />

                  {selectedFiles.length > 0 && (
                    <div className="flex justify-end">
                      <Button onClick={handleUpload} disabled={uploading} className="gap-2">
                        {uploading ? (
                          <>
                            <Loader2 className="animate-spin w-4 h-4" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            Upload {selectedFiles.length} file
                            {selectedFiles.length > 1 ? "s" : ""}
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Uploaded Files</h4>
                    <Badge variant="outline">
                      {docsForSection[activeSection.id].length} total
                    </Badge>
                  </div>

                  {docsLoading ? (
                    <div className="p-8 border border-dashed rounded-lg flex items-center justify-center text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading files...
                    </div>
                  ) : docsForSection[activeSection.id].length === 0 ? (
                    <div className="p-12 border border-dashed rounded-lg flex flex-col items-center justify-center text-center bg-muted/30">
                      <FolderOpen className="w-12 h-12 text-muted-foreground mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">
                        No files uploaded yet
                      </p>
                    </div>
                  ) : (
                    (() => {
                      const docs = docsForSection[activeSection.id];
                      const { images, nonImages } = separateImageAndDocs(docs);
                      return (
                        <ScrollArea className="max-h-[400px]">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            {images.map((doc: any, index: number) => (
                              <ImageComponent
                                key={doc.id}
                                doc={{
                                  id: doc.id,
                                  doc_og_name: doc.doc_og_name,
                                  signedUrl: doc.signed_url,
                                  created_at: doc.created_at,
                                }}
                                index={index}
                                canDelete={canDelete}
                                status={doc.tech_check_status ?? "Pending"}
                                onDelete={(id) => setConfirmDelete(Number(id))}
                              />
                            ))}
                            {nonImages.map((doc: any) => (
                              <DocumentCard
                                key={doc.id}
                                doc={{
                                  id: doc.id,
                                  originalName: doc.doc_og_name,
                                  signedUrl: doc.signed_url,
                                  created_at: doc.created_at,
                                }}
                                canDelete={canDelete}
                                status={doc.tech_check_status ?? "Pending"}
                                onDelete={(id) => setConfirmDelete(Number(id))}
                              />
                            ))}
                          </div>
                        </ScrollArea>
                      );
                    })()
                  )}
                </div>
              </div>
            </BaseModal>
          )}
        </AnimatePresence>

        <AlertDialog
          open={!!confirmDelete}
          onOpenChange={() => setConfirmDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Document?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The selected document will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </BaseModal>
  );
};

export default UploadMoreClientDocumentationModal;
