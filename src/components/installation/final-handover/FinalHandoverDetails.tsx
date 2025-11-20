"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  Download,
  Trash2,
  FolderOpen,
  Loader2,
  FileCheck,
  Award,
  BookOpen,
  ClipboardCheck,
  Plus,
  X,
  Image,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FileUploadField } from "@/components/custom/file-upload";
import {
  useGetFinalHandoverDocuments,
  useUploadFinalHandoverDocuments,
} from "@/api/installation/useFinalHandoverStageLeads";
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
import { useLeadStatus } from "@/hooks/designing-stage/designing-leads-hooks";
import { canViewAndWorkFinalHandoverStage } from "@/components/utils/privileges";

interface FinalHandoverProps {
  leadId: number;
  accountId: number;
}

interface DocumentSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  fieldName: string;
  accept: string;
  color: string;
  bgColor: string;
  iconBg: string;
}

export default function FinalHandover({
  leadId,
  accountId,
}: FinalHandoverProps) {
  const userId = useAppSelector((s) => s.auth.user?.id) || 0;
  const userType = useAppSelector((s) => s.auth.user?.user_type?.user_type);
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id) || 0;
  const queryClient = useQueryClient();

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [activeSection, setActiveSection] = useState<DocumentSection | null>(
    null
  );
  const [openCarousel, setOpenCarousel] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);
  const [carouselImages, setCarouselImages] = useState<any[]>([]);
  const { data: leadData } = useLeadStatus(leadId, vendorId);
  const leadStatus = leadData?.status;

  const { data: documents, isLoading } = useGetFinalHandoverDocuments(
    vendorId,
    leadId
  );
  const uploadMutation = useUploadFinalHandoverDocuments();
  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);

  const canDelete = userType === "admin" || userType === "super-admin";
  const canWork = canViewAndWorkFinalHandoverStage(userType, leadStatus);

  const sections: DocumentSection[] = [
    {
      id: "final_site_photos",
      title: "Final Site Photos",
      icon: <Image className="w-6 h-6" />,
      description: "Upload final installation site photos",
      fieldName: "final_site_photos",
      accept: ".jpg,.jpeg,.png,.webp",
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
      iconBg: "bg-blue-100 dark:bg-blue-900",
    },
    {
      id: "warranty_card",
      title: "Warranty Card Photos",
      icon: <Award className="w-6 h-6" />,
      description: "Upload warranty card photos",
      fieldName: "warranty_card_photo",
      accept: ".jpg,.jpeg,.png,.pdf",
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950",
      iconBg: "bg-amber-100 dark:bg-amber-900",
    },
    {
      id: "handover_booklet",
      title: "Handover Booklet",
      icon: <BookOpen className="w-6 h-6" />,
      description: "Upload handover booklet photos",
      fieldName: "handover_booklet_photo",
      accept: ".jpg,.jpeg,.png,.pdf",
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
      iconBg: "bg-purple-100 dark:bg-purple-900",
    },
    {
      id: "final_handover_form",
      title: "Final Handover Form",
      icon: <ClipboardCheck className="w-6 h-6" />,
      description: "Upload final handover form photos",
      fieldName: "final_handover_form_photo",
      accept: ".jpg,.jpeg,.png,.pdf",
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
      iconBg: "bg-green-100 dark:bg-green-900",
    },
    {
      id: "qc_documents",
      title: "QC Documents",
      icon: <FileCheck className="w-6 h-6" />,
      description: "Upload quality check documents",
      fieldName: "qc_document",
      accept: ".pdf,.doc,.docx,.zip",
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950",
      iconBg: "bg-orange-100 dark:bg-orange-900",
    },
  ];

  const docsByType = React.useMemo(() => {
    if (!documents) return {};
    return {
      final_site_photos: documents.filter(
        (d: any) => d.doc_type_tag === "Type 27"
      ),
      warranty_card: documents.filter((d: any) => d.doc_type_tag === "Type 28"),
      handover_booklet: documents.filter(
        (d: any) => d.doc_type_tag === "Type 29"
      ),
      final_handover_form: documents.filter(
        (d: any) => d.doc_type_tag === "Type 30"
      ),
      qc_documents: documents.filter((d: any) => d.doc_type_tag === "Type 31"),
    };
  }, [documents]);

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !activeSection) {
      toast.error("Please select at least one file to upload.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("vendorId", vendorId.toString());
      formData.append("leadId", leadId.toString());
      formData.append("accountId", accountId.toString());
      formData.append("userId", userId.toString());

      selectedFiles.forEach((file) => {
        formData.append(activeSection.fieldName, file);
      });

      await uploadMutation.mutateAsync(formData);
      toast.success("Files uploaded successfully!");
      setSelectedFiles([]);

      queryClient.invalidateQueries({
        queryKey: ["finalHandoverDocuments", vendorId, leadId],
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to upload files.");
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
    setCarouselImages(docs);
    setStartIndex(index);
    setOpenCarousel(true);
  };

  const getDocumentsForSection = (sectionId: string) => {
    return (docsByType[sectionId as keyof typeof docsByType] || []) as any[];
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin mr-2 size-5" />
        <div className="text-sm text-muted-foreground">
          Loading final handover documents...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Final Handover</h2>
        <p className="text-sm text-muted-foreground">
          Upload and manage all final handover documents and photos
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
                className="h-full
            rounded-2xl border bg-white dark:bg-neutral-900 
            hover:shadow-[0_8px_25px_-4px_rgba(0,0,0,0.12)]
            transition-all duration-200 cursor-pointer
            group
          "
                onClick={() => {
                  setActiveSection(section);
                  setSelectedFiles([]);
                }}
              >
                <CardContent className="px-6">
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

                    {/* Button swap: Add if no docs, View if docs exist */}
                    {docs.length === 0 ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSection(section);
                          setSelectedFiles([]); // allow adding new files
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
                          setActiveSection(section); // only view existing files
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
                      {docs.slice(0, 4).map((doc: any, idx) => (
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

      {/* Document Modal */}
      <AnimatePresence>
        {activeSection && (
          <Dialog
            open={!!activeSection}
            onOpenChange={(open) => {
              if (!open) {
                setActiveSection(null);
                setSelectedFiles([]);
              }
            }}
          >
            <DialogContent className="min-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-lg ${activeSection.iconBg} ${activeSection.color}`}
                  >
                    {activeSection.icon}
                  </div>
                  <div>
                    <DialogTitle>{activeSection.title}</DialogTitle>
                    <DialogDescription>
                      {activeSection.description}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <Separator />

              <div className="flex-1 overflow-y-auto space-y-6 py-4">
                {/* Upload Section */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {canWork && (
                    <>
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold">
                          Upload New Files
                        </h4>
                        {selectedFiles.length > 0 && (
                          <Badge variant="secondary">
                            {selectedFiles.length} selected
                          </Badge>
                        )}
                      </div>
                      <FileUploadField
                        value={selectedFiles}
                        onChange={setSelectedFiles}
                        accept={activeSection.accept}
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
                        disabled={uploadMutation.isPending}
                        className="gap-2"
                      >
                        {uploadMutation.isPending ? (
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
                      {getDocumentsForSection(activeSection.id).length} total
                    </Badge>
                  </div>

                  {(() => {
                    const docs = getDocumentsForSection(activeSection.id);
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
                      <ScrollArea className="max-h-[400px]">
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
                                  signedUrl: doc.signed_url,
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
                                  signedUrl: doc.signed_url,
                                  created_at: doc.created_at,
                                }}
                                canDelete={canDelete}
                                onDelete={(id) => setConfirmDelete(id)}
                              />
                            </motion.div>
                          ))}
                        </div>
                      </ScrollArea>
                    );
                  })()}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!confirmDelete}
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

      {/* Image Carousel */}
      <ImageCarouselModal
        images={carouselImages}
        open={openCarousel}
        initialIndex={startIndex}
        onClose={() => setOpenCarousel(false)}
      />
    </div>
  );
}
