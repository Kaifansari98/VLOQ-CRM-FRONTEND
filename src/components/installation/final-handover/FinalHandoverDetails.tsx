"use client";

import React, { useState } from "react";
import {
  Upload,
  FileText,
  Image,
  Download,
  Trash2,
  FolderOpen,
  Loader2,
  FileCheck,
  Award,
  BookOpen,
  ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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

interface FinalHandoverProps {
  name?: string;
  leadId: number;
  accountId: number;
}

export default function FinalHandover({
  name,
  leadId,
  accountId,
}: FinalHandoverProps) {
  const userId = useAppSelector((s) => s.auth.user?.id) || 0;
  const userType = useAppSelector((s) => s.auth.user?.user_type?.user_type);
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id) || 0;
  const queryClient = useQueryClient();

  // File states for each section
  const [finalSitePhotos, setFinalSitePhotos] = useState<File[]>([]);
  const [warrantyCardPhotos, setWarrantyCardPhotos] = useState<File[]>([]);
  const [handoverBookletPhotos, setHandoverBookletPhotos] = useState<File[]>(
    []
  );
  const [finalHandoverFormPhotos, setFinalHandoverFormPhotos] = useState<
    File[]
  >([]);
  const [qcDocuments, setQcDocuments] = useState<File[]>([]);

  // Carousel states
  const [openCarousel, setOpenCarousel] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);
  const [carouselImages, setCarouselImages] = useState<any[]>([]);

  // Fetch documents
  const { data: documents, isLoading } = useGetFinalHandoverDocuments(
    vendorId,
    leadId
  );
  const uploadMutation = useUploadFinalHandoverDocuments();
  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);

  const canDelete = userType === "admin" || userType === "super-admin";

  // Group documents by type
  const docsByType = React.useMemo(() => {
    if (!documents) return {};

    return {
      finalSitePhotos: documents.filter(
        (d: any) => d.doc_type_tag === "Type 27"
      ),
      warrantyCard: documents.filter((d: any) => d.doc_type_tag === "Type 28"),
      handoverBooklet: documents.filter(
        (d: any) => d.doc_type_tag === "Type 29"
      ),
      finalHandoverForm: documents.filter(
        (d: any) => d.doc_type_tag === "Type 30"
      ),
      qcDocument: documents.filter((d: any) => d.doc_type_tag === "Type 31"),
    };
  }, [documents]);

  const handleUpload = async (
    files: File[],
    fieldName: string,
    setFiles: (files: File[]) => void
  ) => {
    if (files.length === 0) {
      toast.error("Please select at least one file to upload.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("vendorId", vendorId.toString());
      formData.append("leadId", leadId.toString());
      formData.append("accountId", accountId.toString());
      formData.append("userId", userId.toString());

      files.forEach((file) => {
        formData.append(fieldName, file);
      });

      await uploadMutation.mutateAsync(formData);
      toast.success("Files uploaded successfully!");
      setFiles([]);

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

  const renderDocumentSection = (
    title: string,
    icon: React.ReactNode,
    description: string,
    files: File[],
    setFiles: (files: File[]) => void,
    fieldName: string,
    accept: string,
    docs: any[]
  ) => {
    const imageExtensions = ["jpg", "jpeg", "png", "webp"];
    const images = docs.filter((d: any) => {
      const ext = d.doc_og_name?.split(".").pop()?.toLowerCase();
      return imageExtensions.includes(ext || "");
    });
    const nonImages = docs.filter((d: any) => {
      const ext = d.doc_og_name?.split(".").pop()?.toLowerCase();
      return !imageExtensions.includes(ext || "");
    });

    return (
      <div className="border rounded-lg overflow-hidden bg-background">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>

        {/* Upload Section */}
        <div className="p-6 border-b space-y-4">
          <FileUploadField
            value={files}
            onChange={setFiles}
            accept={accept}
            multiple
          />

          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => handleUpload(files, fieldName, setFiles)}
              disabled={uploadMutation.isPending || files.length === 0}
              className="flex items-center gap-2"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin size-4" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Upload Files
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Files List */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-semibold text-foreground">
              Uploaded Files
            </h4>
            {docs.length > 0 && (
              <Badge variant="secondary">
                {docs.length} file{docs.length > 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          {docs.length === 0 ? (
            <div className="p-8 border border-dashed rounded-lg flex flex-col items-center justify-center text-center bg-muted/30">
              <FolderOpen className="w-10 h-10 text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-muted-foreground">
                No files uploaded yet.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px] mt-2 pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                    onView={(i) => openImageCarousel(images, i)}
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
                    onDelete={(id) => setConfirmDelete(id)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    );
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Final Handover
        </h2>
        <p className="text-sm text-muted-foreground">
          Upload and manage all final handover documents and photos
        </p>
      </div>

      {/* Final Site Photos */}
      {renderDocumentSection(
        "Final Site Photos",
        <Image className="w-5 h-5" />,
        "Upload final installation site photos",
        finalSitePhotos,
        setFinalSitePhotos,
        "final_site_photos",
        ".jpg,.jpeg,.png,.webp",
        docsByType.finalSitePhotos || []
      )}

      {/* Warranty Card Photos */}
      {renderDocumentSection(
        "Warranty Card Photos",
        <Award className="w-5 h-5" />,
        "Upload warranty card photos",
        warrantyCardPhotos,
        setWarrantyCardPhotos,
        "warranty_card_photo",
        ".jpg,.jpeg,.png,.pdf",
        docsByType.warrantyCard || []
      )}

      {/* Handover Booklet Photos */}
      {renderDocumentSection(
        "Handover Booklet Photos",
        <BookOpen className="w-5 h-5" />,
        "Upload handover booklet photos",
        handoverBookletPhotos,
        setHandoverBookletPhotos,
        "handover_booklet_photo",
        ".jpg,.jpeg,.png,.pdf",
        docsByType.handoverBooklet || []
      )}

      {/* Final Handover Form Photos */}
      {renderDocumentSection(
        "Final Handover Form Photos",
        <ClipboardCheck className="w-5 h-5" />,
        "Upload final handover form photos",
        finalHandoverFormPhotos,
        setFinalHandoverFormPhotos,
        "final_handover_form_photo",
        ".jpg,.jpeg,.png,.pdf",
        docsByType.finalHandoverForm || []
      )}

      {/* QC Documents */}
      {renderDocumentSection(
        "QC Documents",
        <FileCheck className="w-5 h-5" />,
        "Upload quality check documents",
        qcDocuments,
        setQcDocuments,
        "qc_document",
        ".pdf,.doc,.docx,.zip",
        docsByType.qcDocument || []
      )}

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
