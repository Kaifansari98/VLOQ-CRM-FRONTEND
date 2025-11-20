"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  ImageIcon,
  Save,
  FolderOpen,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import TextAreaInput from "@/components/origin-text-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileUploadField } from "@/components/custom/file-upload";
import {
  useGetUsableHandover,
  useUpdateUsableHandover,
  useUpdateRemarks,
} from "@/api/installation/useUnderInstallationStageLeads";
import { useDeleteDocument } from "@/api/leads";
import { useAppSelector } from "@/redux/store";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
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
import ImageCarouselModal from "@/components/utils/image-carousel-modal";
import { ImageComponent } from "@/components/utils/ImageCard";
import DocumentCard from "@/components/utils/documentCard";
import PendingWorkDetails from "../dispatch/PendingWorkDetails";
import { canViewAndWorkUnderInstallationStage } from "@/components/utils/privileges";
import { useLeadStatus } from "@/hooks/designing-stage/designing-leads-hooks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import BaseModal from "@/components/utils/baseModal";

interface UsableHandoverProps {
  vendorId: number;
  leadId: number;
  accountId: number;
}

interface DocumentSection {
  id: "final_site_photos" | "handover_documents";
  title: string;
  icon: React.ReactNode;
  description: string;
  accept: string;
  color: string;
  iconBg: string;
}

export default function UsableHandover({
  vendorId,
  leadId,
  accountId,
}: UsableHandoverProps) {
  const userId = useAppSelector((s) => s.auth.user?.id) || 0;
  const userType = useAppSelector((s) => s.auth.user?.user_type?.user_type);
  const queryClient = useQueryClient();

  const [pendingWorkDetails, setPendingWorkDetails] = useState("");
  const [isEditingRemarks, setIsEditingRemarks] = useState(false);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [activeSection, setActiveSection] = useState<DocumentSection | null>(
    null
  );

  const [openCarousel, setOpenCarousel] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);
  const [carouselImages, setCarouselImages] = useState<any[]>([]);

  const { data: handoverData, isLoading } = useGetUsableHandover(
    vendorId,
    leadId
  );
  const updateMutation = useUpdateUsableHandover();
  const updateRemarksMutation = useUpdateRemarks();
  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);

  const { data: leadData } = useLeadStatus(leadId, vendorId);
  const leadStatus = leadData?.status;

  const canDelete = userType === "admin" || userType === "super-admin";
  const canWork = canViewAndWorkUnderInstallationStage(userType, leadStatus);

  useEffect(() => {
    if (handoverData?.pending_work_details) {
      setPendingWorkDetails(handoverData.pending_work_details);
    }
  }, [handoverData]);

  const sections: DocumentSection[] = [
    {
      id: "final_site_photos",
      title: "Final Site Photos",
      icon: <ImageIcon className="w-6 h-6" />,
      description: "Upload final installation site photos",
      accept: ".jpg,.jpeg,.png,.webp",
      color: "text-blue-600",
      iconBg: "bg-blue-100 dark:bg-blue-900",
    },
    {
      id: "handover_documents",
      title: "Handover Documents",
      icon: <FileText className="w-6 h-6" />,
      description: "Upload handover documents (PDFs, etc.)",
      accept: ".pdf,.doc,.docx,.zip",
      color: "text-emerald-600",
      iconBg: "bg-emerald-100 dark:bg-emerald-900",
    },
  ];

  const getDocumentsForSection = (sectionId: DocumentSection["id"]) => {
    if (!handoverData) return [];
    if (sectionId === "final_site_photos") {
      return Array.isArray(handoverData.final_site_photos)
        ? handoverData.final_site_photos
        : [];
    }
    if (sectionId === "handover_documents") {
      return Array.isArray(handoverData.handover_documents)
        ? handoverData.handover_documents
        : [];
    }
    return [];
  };

  const separateImageAndDocs = (docs: any[]) => {
    const imageExtensions = ["jpg", "jpeg", "png", "webp"];
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

  const handleUpload = async () => {
    if (!activeSection || selectedFiles.length === 0) {
      toast.error("Please select at least one file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("vendor_id", vendorId.toString());
    formData.append("lead_id", leadId.toString());
    formData.append("account_id", accountId.toString());
    formData.append("created_by", userId.toString());
    formData.append("pending_work_details", pendingWorkDetails || "");

    selectedFiles.forEach((file) => {
      formData.append("files", file);
    });

    try {
      await updateMutation.mutateAsync(formData);

      if (activeSection.id === "final_site_photos") {
        toast.success("Final site photos uploaded successfully!");
      } else {
        toast.success("Handover documents uploaded successfully!");
      }

      setSelectedFiles([]);

      queryClient.invalidateQueries({
        queryKey: ["usableHandover", vendorId, leadId],
      });
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Failed to upload files.");
    }
  };

  const handleUpdateRemarks = async () => {
    try {
      await updateRemarksMutation.mutateAsync({
        vendor_id: vendorId,
        lead_id: leadId,
        pending_work_details: pendingWorkDetails,
      });
      setIsEditingRemarks(false);
      toast.success("Remarks updated successfully.");
    } catch (error) {
      console.error("Error updating remarks:", error);
      toast.error("Failed to update remarks.");
    }
  };

  const handleConfirmDelete = () => {
    if (confirmDelete) {
      deleteDocument({
        vendorId: vendorId,
        documentId: confirmDelete,
        deleted_by: userId,
      });
      setConfirmDelete(null);
    }
  };

  const openImageCarousel = (docs: any[], index: number) => {
    const normalized = docs.map((d) => ({
      ...d,
      signed_url: d.signedUrl ?? d.signed_url,
    }));
    setCarouselImages(normalized);
    setStartIndex(index);
    setOpenCarousel(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin mr-2 size-5" />
        <div className="text-sm text-muted-foreground">
          Loading handover details...
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Usable Handover
        </h2>
        <p className="text-sm text-muted-foreground">
          Upload final site photos and handover documents for the installation
        </p>
      </div>

      {/* Pending Work Component */}
      <PendingWorkDetails leadId={leadId} accountId={accountId} />

      {/* Pending Work Details / Remarks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Pending Work Details / Remarks
            </CardTitle>

            {canWork &&
              (!isEditingRemarks ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingRemarks(true)}
                >
                  Edit Remarks
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPendingWorkDetails(
                        handoverData?.pending_work_details || ""
                      );
                      setIsEditingRemarks(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleUpdateRemarks}
                    disabled={updateRemarksMutation.isPending}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {updateRemarksMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              ))}
          </div>
        </CardHeader>
        <CardContent>
          <TextAreaInput
            value={pendingWorkDetails || "N/A"}
            onChange={setPendingWorkDetails}
            placeholder="Enter any pending work details or remarks..."
            maxLength={2000}
            readOnly={!isEditingRemarks}
            disabled={!isEditingRemarks}
            className={isEditingRemarks ? "" : "cursor-default"}
          />
        </CardContent>
      </Card>

      {/* Cards Grid – same pattern as FinalHandover */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {sections.map((section, index) => {
          const docs = getDocumentsForSection(section.id);

          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.05 }}
            >
              <Card
                className=" 
                  h-full rounded-2xl border bg-white dark:bg-neutral-900 
                  hover:shadow-[0_8px_25px_-4px_rgba(0,0,0,0.12)]
                  transition-all duration-200 cursor-pointer group
                "
                onClick={() => {
                  setActiveSection(section);
                  setSelectedFiles([]);
                }}
              >
                <CardContent className="">
                  {/* Top Row */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`
                          w-12 h-12 rounded-xl flex items-center justify-center 
                          border bg-neutral-50 dark:bg-neutral-800 
                          ${section.color}
                        `}
                      >
                        {section.icon}
                      </div>

                      <div>
                        <h3 className="font-semibold text-sm">
                          {section.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {section.description}
                        </p>
                      </div>
                    </div>

                    {docs.length === 0 ? (
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
                        Upload
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSection(section);
                        }}
                      >
                        View
                      </Button>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="my-4 border-t" />

                  {/* Metadata row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <FolderOpen className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">
                        {docs.length} file{docs.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Bottom preview row */}
                  {docs.length > 0 ? (
                    <div className="flex -space-x-2">
                      {docs.slice(0, 4).map((doc: any, idx: number) => (
                        <div
                          key={doc.id}
                          className="
                            w-10 h-10 rounded-lg border bg-neutral-100 dark:bg-neutral-800 
                            flex items-center justify-center
                          "
                          style={{ zIndex: 4 - idx }}
                        >
                          <FileText className="w-4 h-4 text-muted-foreground" />
                        </div>
                      ))}

                      {docs.length > 4 && (
                        <div
                          className="
                            w-10 h-10 rounded-lg bg-neutral-200 dark:bg-neutral-700 
                            flex items-center justify-center text-xs font-medium text-muted-foreground
                          "
                        >
                          +{docs.length - 4}
                        </div>
                      )}
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

      <BaseModal
        open={!!activeSection}
        onOpenChange={(open) => {
          if (!open) {
            setActiveSection(null);
            setSelectedFiles([]);
          }
        }}
        icon={
          activeSection && (
            <div>
              <div
                className={`p-2.5 rounded-lg ${activeSection.iconBg} ${activeSection.color}`}
              >
                {activeSection.icon}
              </div>
            </div>
          )
        }
        title={activeSection?.title}
        description={activeSection?.description}
        size="lg"
      >
        {activeSection && (
          <div className="flex-1  space-y-6 px-4 py-4">
            {/* Upload Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {canWork && (
                <>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Upload New Files</h4>
                    {selectedFiles.length > 0 && (
                      <Badge variant="secondary">
                        {selectedFiles.length} selected
                      </Badge>
                    )}
                  </div>
                  <FileUploadField
                    value={selectedFiles}
                    onChange={setSelectedFiles}
                    accept={activeSection?.accept}
                    multiple
                  />
                </>
              )}
              {selectedFiles.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="flex justify-end"
                >
                  <Button
                    onClick={handleUpload}
                    disabled={updateMutation.isPending}
                    className="gap-2"
                  >
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 className="animate-spin w-4 h-4" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload {selectedFiles.length} File
                        {selectedFiles.length > 1 ? "s" : ""}
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </motion.div>

            {/* Existing Files */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Uploaded Files</h4>
                <Badge variant="outline">
                  {getDocumentsForSection(activeSection?.id).length} total
                </Badge>
              </div>

              {(() => {
                const docs = getDocumentsForSection(activeSection?.id);
                const { images, nonImages } = separateImageAndDocs(docs);

                if (docs.length === 0) {
                  return (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-12 border border-dashed rounded-lg flex flex-col items-center justify-center text-center bg-muted/30"
                    >
                      <FolderOpen className="w-12 h-12 text-muted-foreground mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">
                        No files uploaded yet
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Upload your first file to get started
                      </p>
                    </motion.div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-3">
                    {images.map((doc: any, index: number) => (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <ImageComponent
                          doc={{
                            id: doc.id,
                            doc_og_name: doc.doc_og_name,
                            signedUrl: doc.signedUrl ?? doc.signed_url,
                            created_at: doc.created_at,
                          }}
                          index={index}
                          canDelete={canDelete}
                          onView={(i) => openImageCarousel(images, i)}
                          onDelete={(id) => setConfirmDelete(Number(id))}
                        />
                      </motion.div>
                    ))}

                    {nonImages.map((doc: any, index: number) => (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          delay: (images.length + index) * 0.05,
                        }}
                      >
                        <DocumentCard
                          doc={{
                            id: doc.id,
                            originalName: doc.doc_og_name,
                            signedUrl: doc.signedUrl ?? doc.signed_url,
                            created_at: doc.created_at,
                          }}
                          canDelete={canDelete}
                          onDelete={(id) => setConfirmDelete(id)}
                        />
                      </motion.div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </BaseModal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected document will be
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

      {/* Image Carousel Modal */}
      <ImageCarouselModal
        images={carouselImages}
        open={openCarousel}
        initialIndex={startIndex}
        onClose={() => setOpenCarousel(false)}
      />
    </div>
  );
}
