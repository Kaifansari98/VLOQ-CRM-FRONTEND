"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAppSelector } from "@/redux/store";
import {
  useAddMoreFinalMeasurementFiles,
  useAddMoreFinalMeasurementSitePhotos,
  useFinalMeasurementLeadById,
} from "@/hooks/final-measurement/use-final-measurement";
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
import { Ban, Images, FileText, Plus, Upload } from "lucide-react";
import { useDeleteDocument } from "@/api/leads";
import { ImageComponent } from "@/components/utils/ImageCard";
import DocumentCard from "@/components/utils/documentCard";
import Loader from "@/components/utils/loader";
import SectionHeader from "@/utils/sectionHeader";
import BaseModal from "@/components/utils/baseModal";
import { FileUploadField } from "@/components/custom/file-upload";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import {
  useLeadById,
  useLeadProductStructureInstances,
} from "@/hooks/useLeadsQueries";

type Props = {
  leadId: number;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

const documentMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
];
const documentAccept = ".pdf";
const imageMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
const imageAccept = ".jpg,.jpeg,.png,.gif";

export default function FinalMeasurementLeadDetails({ leadId }: Props) {
  // 🧩 --- Redux User Context ---
  const vendorId = useAppSelector((state) => state.auth?.user?.vendor_id) || 0;
  const userId = useAppSelector((state) => state.auth?.user?.id);
  const userType = useAppSelector(
    (state) => state.auth?.user?.user_type?.user_type,
  );
  const customPrivilegeCodes = useAppSelector(
    (state) => state.customPrivileges.codes,
  );
  const effectiveUserType = userType === "admin" ? "sales-executive" : userType;

  const isCustomVendorFlowFromAuth = useAppSelector(
    (state) =>
      state.auth?.user?.vendor?.is_this_vendor_is_custom_usertype_only === true,
  );
  const handlesLargeScaleProjectsFromAuth = useAppSelector(
    (state) => state.auth?.user?.vendor?.handlesLargeScaleProjects === true,
  );

  const { data: leadByIdResponse } = useLeadById(leadId, vendorId, userId);
  const leadById = leadByIdResponse?.data?.lead;

  const isCustomVendorFlow =
    isCustomVendorFlowFromAuth ||
    leadById?.createdBy?.vendor?.is_this_vendor_is_custom_usertype_only ===
      true ||
    leadById?.assignedTo?.vendor?.is_this_vendor_is_custom_usertype_only ===
      true;
  const handlesLargeScaleProjects =
    handlesLargeScaleProjectsFromAuth ||
    leadById?.createdBy?.vendor?.handlesLargeScaleProjects === true ||
    leadById?.assignedTo?.vendor?.handlesLargeScaleProjects === true;

  const { data: structureInstancesData } = useLeadProductStructureInstances(
    leadId,
    vendorId,
  );
  const structureInstances = React.useMemo(
    () =>
      Array.isArray(structureInstancesData?.data)
        ? structureInstancesData.data
        : [],
    [structureInstancesData?.data],
  );

  // 🧩 --- Data Hook ---
  const { data, isLoading, error } = useFinalMeasurementLeadById(
    vendorId,
    leadId,
  );
  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);
  const { mutateAsync: addMoreFiles, isPending: addingFiles } =
    useAddMoreFinalMeasurementFiles();
  const { mutateAsync: addMoreSitePhotos, isPending: addingSitePhotos } =
    useAddMoreFinalMeasurementSitePhotos();
  const queryClient = useQueryClient();

  // 🧩 --- Local States ---
  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);
  const [addFilesOpen, setAddFilesOpen] = useState(false);
  const [addSitePhotosOpen, setAddSitePhotosOpen] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [sitePhotosToUpload, setSitePhotosToUpload] = useState<File[]>([]);
  const [activeInstanceId, setActiveInstanceId] = useState<number | null>(null);

  // 🧩 --- Permissions ---
  const canDelete =
    effectiveUserType === "admin" || effectiveUserType === "super-admin";
  const canUpload =
    effectiveUserType === "admin" || effectiveUserType === "super-admin";
  const canViewCurrentSitePhotos =
    effectiveUserType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
          "project.final_measurement.current_site_photos.view",
        )
      : true;
  const canDeleteCurrentSitePhotos =
    effectiveUserType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
          "project.final_measurement.current_site_photos.delete",
        )
      : canDelete;
  const canUploadCurrentSitePhotos =
    effectiveUserType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
          "project.final_measurement.current_site_photos.upload",
        )
      : canUpload;
  const canViewMeasurementDocuments =
    effectiveUserType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
          "project.final_measurement.measurement_documents.view",
        )
      : true;
  const canDeleteMeasurementDocuments =
    effectiveUserType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
          "project.final_measurement.measurement_documents.delete",
        )
      : canDelete;
  const canUploadMeasurementDocuments =
    effectiveUserType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
          "project.final_measurement.measurement_documents.upload",
        )
      : canUpload;

  // 🧩 --- Delete Handler ---
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

  const accountId = (data as any)?.account_id;

  const handleFilesChange = (files: File[]) => {
    const validFiles = files.filter((file) =>
      documentMimeTypes.includes(file.type),
    );
    const rejectedCount = files.length - validFiles.length;
    if (rejectedCount > 0) {
      toastManager.add({
        title: "Only PDF or image files are allowed.",
        type: "error",
      });
    }
    if (files.length > 10) {
      toastManager.add({
        title: "You can upload up to 10 files.",
        type: "error",
      });
      setFilesToUpload(validFiles.slice(0, 10));
      return;
    }
    setFilesToUpload(validFiles);
  };

  const handleSitePhotosChange = (files: File[]) => {
    const validFiles = files.filter((file) =>
      imageMimeTypes.includes(file.type),
    );
    const rejectedCount = files.length - validFiles.length;
    if (rejectedCount > 0) {
      toastManager.add({
        title: "Only image files are allowed.",
        type: "error",
      });
    }
    if (files.length > 10) {
      toastManager.add({
        title: "You can upload up to 10 files.",
        type: "error",
      });
      setSitePhotosToUpload(validFiles.slice(0, 10));
      return;
    }
    setSitePhotosToUpload(validFiles);
  };

  const handleAddMoreFiles = async () => {
    if (!vendorId || !userId) {
      toastManager.add({
        title: "Missing vendor, user information.",
        type: "error",
      });
      return;
    }
    if (filesToUpload.length === 0) {
      toastManager.add({
        title: "Please select at least one file to upload.",
        type: "error",
      });
      return;
    }

    try {
      await addMoreFiles({
        leadId,
        vendorId,
        createdBy: userId,
        sitePhotos: filesToUpload,
      });
      toastManager.add({
        title: "Additional files uploaded successfully.",
        type: "success",
      });
      setFilesToUpload([]);

      queryClient.invalidateQueries({
        queryKey: ["finalMeasurementLead", vendorId, leadId],
      });
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to upload files.";

      toastManager.add({
        title: errorMessage,
        type: "error",
      });
    }
  };

  const handleAddMoreSitePhotos = async () => {
    if (!vendorId || !userId) {
      toastManager.add({
        title: "Missing vendor, user information.",
        type: "error",
      });
      return;
    }
    if (sitePhotosToUpload.length === 0) {
      toastManager.add({
        title: "Please select at least one site photo to upload.",
        type: "error",
      });
      return;
    }

    try {
      await addMoreSitePhotos({
        leadId,
        vendorId,
        createdBy: userId,
        sitePhotos: sitePhotosToUpload,
      });
      toastManager.add({
        title: "Additional site photos uploaded successfully.",
        type: "success",
      });
      setSitePhotosToUpload([]);

      queryClient.invalidateQueries({
        queryKey: ["finalMeasurementLead", vendorId, leadId],
      });
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to upload site photos.";

      toastManager.add({
        title: errorMessage,
        type: "error",
      });
    }
  };

  const handleAddMoreInstanceFiles = async (instanceId: number) => {
    if (!vendorId || !userId) {
      toastManager.add({
        title: "Missing vendor, user information.",
        type: "error",
      });
      return;
    }
    if (filesToUpload.length === 0) {
      toastManager.add({
        title: "Please select at least one file to upload.",
        type: "error",
      });
      return;
    }

    try {
      await addMoreFiles({
        leadId,
        vendorId,
        createdBy: userId,
        sitePhotos: filesToUpload,
        productStructureInstanceId: instanceId,
      });
      toastManager.add({
        title: "Additional files uploaded successfully.",
        type: "success",
      });
      setFilesToUpload([]);
      queryClient.invalidateQueries({
        queryKey: ["finalMeasurementLead", vendorId, leadId],
      });
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to upload files.";

      toastManager.add({
        title: errorMessage,
        type: "error",
      });
    }
  };

  const handleAddMoreInstanceSitePhotos = async (instanceId: number) => {
    if (!vendorId || !userId) {
      toastManager.add({
        title: "Missing vendor, user information.",
        type: "error",
      });
      return;
    }
    if (sitePhotosToUpload.length === 0) {
      toastManager.add({
        title: "Please select at least one site photo to upload.",
        type: "error",
      });
      return;
    }

    try {
      await addMoreSitePhotos({
        leadId,
        vendorId,
        createdBy: userId,
        sitePhotos: sitePhotosToUpload,
        productStructureInstanceId: instanceId,
      });
      toastManager.add({
        title: "Additional site photos uploaded successfully.",
        type: "success",
      });
      setSitePhotosToUpload([]);
      queryClient.invalidateQueries({
        queryKey: ["finalMeasurementLead", vendorId, leadId],
      });
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to upload site photos.";

      toastManager.add({
        title: errorMessage,
        type: "error",
      });
    }
  };

  // 🧩 --- Loading & Error States ---
  if (isLoading)
    return (
      <Loader
        fullScreen
        size={250}
        message="Loading Final Measurement Details..."
      />
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <Ban size={32} className="text-destructive" />
        </div>
        <p className="text-sm text-muted-foreground">
          Error loading final measurement details.
        </p>
      </div>
    );

  if (!data) {
    return (
      <div className="border rounded-lg p-6">
        <p>No final measurement details found.</p>
      </div>
    );
  }

  // 🧩 --- Data Extraction ---
  const { sitePhotos = [], measurementDocs = [], final_desc_note } = data;

  if (isCustomVendorFlow && handlesLargeScaleProjects) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full h-full py-4 space-y-6 overflow-y-auto bg-[#fff] dark:bg-[#0a0a0a]"
      >
        {/* Instance Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {structureInstances.map((instance: any) => {
            const instDocs = measurementDocs.filter(
              (doc) => doc.product_structure_instance_id === instance.id,
            );
            const instPhotos = sitePhotos.filter(
              (photo) => photo.product_structure_instance_id === instance.id,
            );

            return (
              <div
                key={instance.id}
                className="bg-white dark:bg-neutral-900 border border-border rounded-2xl p-5 space-y-4 hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <h3 className="font-semibold text-base text-card-foreground">
                    {instance.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {instance.description ||
                      "Create a new item code and link it to a sub-item category."}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="border border-border/60 rounded-xl p-3 bg-muted/10 space-y-2 text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-medium">
                        Measurement:
                      </span>
                      <span className="font-semibold text-foreground">
                        {instDocs.length} uploaded
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-medium">
                        Site Photos:
                      </span>
                      <span className="font-semibold text-foreground">
                        {instPhotos.length} uploaded
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full flex items-center justify-center gap-2 text-xs font-semibold py-2"
                    onClick={() => setActiveInstanceId(instance.id)}
                  >
                    <FileText size={14} />
                    Manage Files
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* -------- Discussion Note -------- */}
        <div
          className="
        bg-[#fff] dark:bg-[#0a0a0a]
        rounded-2xl 
        border border-border
        overflow-hidden
      "
        >
          <div
            className="
          px-5 py-3 
          border-b border-border
          bg-mutedBg/50 dark:bg-neutral-900/50
        "
          >
            <h2 className="text-base font-semibold tracking-tight">
              Discussion Note
            </h2>
          </div>

          <div className="p-5">
            <div
              className="
            bg-[#fff] dark:bg-[#0a0a0a]
            border border-border
            rounded-xl
            p-4 
            text-sm leading-relaxed 
            min-h-[70px] 
          "
            >
              {final_desc_note || "No description provided."}
            </div>
          </div>
        </div>

        {/* -------- Manage Files Modal -------- */}
        <BaseModal
          open={!!activeInstanceId}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setActiveInstanceId(null);
            }
          }}
          title={
            structureInstances.find((i: any) => i.id === activeInstanceId)
              ?.title || "Manage Files"
          }
          description="View and upload Final Measurement documents and site photos for this instance."
          size="xl"
        >
          {(() => {
            const instance = structureInstances.find(
              (i: any) => i.id === activeInstanceId,
            );
            if (!instance) return null;

            const instDocs = measurementDocs.filter(
              (doc) => doc.product_structure_instance_id === instance.id,
            );
            const instPhotos = sitePhotos.filter(
              (photo) => photo.product_structure_instance_id === instance.id,
            );

            return (
              <div className="px-5 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column: Site Photos */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm flex items-center gap-2 text-card-foreground">
                      <Images size={16} /> Site Photos
                    </h4>
                    {canUploadCurrentSitePhotos && (
                      <>
                        <FileUploadField
                          value={sitePhotosToUpload}
                          onChange={(files) => {
                            const validFiles = files.filter((f) =>
                              imageMimeTypes.includes(f.type),
                            );
                            if (files.length > 10) {
                              setSitePhotosToUpload(validFiles.slice(0, 10));
                            } else {
                              setSitePhotosToUpload(validFiles);
                            }
                          }}
                          accept={imageAccept}
                          multiple
                          maxFiles={10}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSitePhotosToUpload([])}
                            disabled={
                              sitePhotosToUpload.length === 0 ||
                              addingSitePhotos
                            }
                          >
                            Clear
                          </Button>
                          <Button
                            size="sm"
                            onClick={() =>
                              handleAddMoreInstanceSitePhotos(instance.id)
                            }
                            disabled={
                              sitePhotosToUpload.length === 0 ||
                              addingSitePhotos
                            }
                          >
                            {addingSitePhotos ? "Uploading..." : "Upload"}
                          </Button>
                        </div>
                      </>
                    )}

                    <div className="pt-2 space-y-2">
                      <h5 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Saved Photos
                      </h5>
                      {instPhotos.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3 w-full">
                          {instPhotos.map((photo, index) => {
                            const fileName = photo.doc_og_name || "";
                            const isImage =
                              /\.(jpg|jpeg|png|gif|webp|bmp|tif|tiff|heic|heif|avif|svg|jfif)$/i.test(
                                fileName,
                              );

                            return isImage ? (
                              <ImageComponent
                                key={photo.id}
                                doc={{
                                  id: photo.id,
                                  doc_og_name: photo.doc_og_name,
                                  signedUrl: photo.signedUrl,
                                  created_at: photo.created_at,
                                }}
                                index={index}
                                canDelete={canDeleteCurrentSitePhotos}
                                onDelete={(id) => setConfirmDelete(Number(id))}
                              />
                            ) : (
                              <DocumentCard
                                key={photo.id}
                                doc={{
                                  id: photo.id,
                                  originalName: photo.doc_og_name,
                                  signedUrl: photo.signedUrl,
                                  created_at: photo.created_at,
                                }}
                                canDelete={canDeleteCurrentSitePhotos}
                                onDelete={(id) => setConfirmDelete(Number(id))}
                                alwaysShowText={true}
                              />
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          No photos uploaded for this instance.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Measurement Documents */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm flex items-center gap-2 text-card-foreground">
                      <FileText size={16} /> Measurement Documents
                    </h4>
                    {canUploadMeasurementDocuments && (
                      <>
                        <FileUploadField
                          value={filesToUpload}
                          onChange={(files) => {
                            const validFiles = files.filter((f) =>
                              documentMimeTypes.includes(f.type),
                            );
                            if (files.length > 10) {
                              setFilesToUpload(validFiles.slice(0, 10));
                            } else {
                              setFilesToUpload(validFiles);
                            }
                          }}
                          accept={documentAccept}
                          multiple
                          maxFiles={10}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFilesToUpload([])}
                            disabled={filesToUpload.length === 0 || addingFiles}
                          >
                            Clear
                          </Button>
                          <Button
                            size="sm"
                            onClick={() =>
                              handleAddMoreInstanceFiles(instance.id)
                            }
                            disabled={filesToUpload.length === 0 || addingFiles}
                          >
                            {addingFiles ? "Uploading..." : "Upload"}
                          </Button>
                        </div>
                      </>
                    )}

                    <div className="pt-2 space-y-2">
                      <h5 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Saved Documents
                      </h5>
                      {instDocs.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3 w-full">
                          {instDocs.map((doc) => (
                            <DocumentCard
                              key={doc.id}
                              doc={{
                                id: doc.id,
                                originalName: doc.doc_og_name,
                                created_at: doc.created_at,
                                signedUrl: doc.signedUrl,
                              }}
                              canDelete={canDeleteMeasurementDocuments}
                              onDelete={(id) => setConfirmDelete(id)}
                              alwaysShowText={true}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          No documents uploaded for this instance.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-border/60 mt-6">
                  <Button
                    type="button"
                    onClick={() => setActiveInstanceId(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            );
          })()}
        </BaseModal>

        {/* -------- Delete Confirmation Dialog -------- */}
        <AlertDialog
          open={!!confirmDelete}
          onOpenChange={() => setConfirmDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Document?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The selected file will be
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

  // 🧩 --- Render ---
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="
    w-full h-full 
    py-4 space-y-4
    overflow-y-auto
    bg-[#fff] dark:bg-[#0a0a0a]
  "
    >
      {/* -------- Current Site Photos -------- */}
      {canViewCurrentSitePhotos && (
        <div
          className="
      bg-white dark:bg-neutral-900
      rounded-2xl 
      border border-border 
      overflow-hidden
    "
        >
          <SectionHeader
            title="Current Site Photos"
            icon={<Images size={20} />}
          />

          <motion.div
            variants={itemVariants}
            className="p-6 bg-[#fff] dark:bg-[#0a0a0a]"
          >
            <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(380px,1fr))] gap-5">
              {sitePhotos.length > 0 ? (
                <>
                  {sitePhotos.map((photo, index) => {
                    const fileName = photo.doc_og_name || "";
                    const isImage =
                      /\.(jpg|jpeg|png|gif|webp|bmp|tif|tiff|heic|heif|avif|svg|jfif)$/i.test(
                        fileName,
                      );

                    return isImage ? (
                      <ImageComponent
                        key={photo.id}
                        doc={{
                          id: photo.id,
                          doc_og_name: photo.doc_og_name,
                          signedUrl: photo.signedUrl,
                          created_at: photo.created_at,
                        }}
                        index={index}
                        canDelete={canDeleteCurrentSitePhotos}
                        onDelete={(id) => setConfirmDelete(Number(id))}
                      />
                    ) : (
                      <DocumentCard
                        key={photo.id}
                        doc={{
                          id: photo.id,
                          originalName: photo.doc_og_name,
                          signedUrl: photo.signedUrl,
                          created_at: photo.created_at,
                        }}
                        canDelete={canDeleteCurrentSitePhotos}
                        onDelete={(id) => setConfirmDelete(Number(id))}
                        alwaysShowText={true}
                      />
                    );
                  })}
                  {canUploadCurrentSitePhotos && (
                    <button
                      type="button"
                      onClick={() => setAddSitePhotosOpen(true)}
                      className="
                      flex flex-col items-center justify-center
                      border border-dashed border-border/70
                      rounded-xl p-6 text-center
                      bg-mutedBg/40 dark:bg-neutral-800/40
                      hover:bg-muted/40 dark:hover:bg-neutral-800/60
                      transition
                    "
                    >
                      <Plus className="w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-sm font-medium text-muted-foreground">
                        Add more site photos
                      </p>
                      <p className="text-xs text-subtle mt-1">
                        Upload up to 10 files
                      </p>
                    </button>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-14">
                  <FileText size={42} className="text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No site photos uploaded yet.
                  </p>
                  {canUploadCurrentSitePhotos && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => setAddSitePhotosOpen(true)}
                    >
                      Add more site photos
                    </Button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* -------- Measurement Documents -------- */}
      {canViewMeasurementDocuments &&
        (measurementDocs.length > 0 || canUploadMeasurementDocuments) && (
          <div
            className="
        bg-white dark:bg-neutral-900
        rounded-2xl 
        border border-border 
        overflow-hidden
      "
          >
            <SectionHeader
              title="Measurement Documents"
              icon={<FileText size={20} />}
            />

            <motion.div
              variants={itemVariants}
              className="p-6 bg-[#fff] dark:bg-[#0a0a0a]"
            >
              <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(380px,1fr))] gap-5">
                {measurementDocs.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    doc={{
                      id: doc.id,
                      originalName: doc.doc_og_name,
                      created_at: doc.created_at,
                      signedUrl: doc.signedUrl,
                    }}
                    canDelete={canDeleteMeasurementDocuments}
                    onDelete={(id) => setConfirmDelete(id)}
                    alwaysShowText={true}
                  />
                ))}
                {canUploadMeasurementDocuments && (
                  <button
                    type="button"
                    onClick={() => setAddFilesOpen(true)}
                    className="
                    flex flex-col items-center justify-center
                    border border-dashed border-border/70
                    rounded-xl p-6 text-center
                    bg-mutedBg/40 dark:bg-neutral-800/40
                    hover:bg-muted/40 dark:hover:bg-neutral-800/60
                    transition
                  "
                  >
                    <Plus className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Add more files
                    </p>
                    <p className="text-xs text-subtle mt-1">
                      Upload up to 10 files
                    </p>
                  </button>
                )}
                {measurementDocs.length === 0 &&
                  !canUploadMeasurementDocuments && (
                    <div className="col-span-full flex flex-col items-center justify-center py-14">
                      <FileText
                        size={42}
                        className="text-muted-foreground mb-3"
                      />
                      <p className="text-sm text-muted-foreground">
                        No measurement documents uploaded yet.
                      </p>
                    </div>
                  )}
              </div>
            </motion.div>
          </div>
        )}

      {/* -------- Discussion Note -------- */}
      <div
        className="
      bg-[#fff] dark:bg-[#0a0a0a]
      rounded-2xl 
      border border-border
      overflow-hidden
    "
      >
        <div
          className="
        px-5 py-3 
        border-b border-border
        bg-mutedBg/50 dark:bg-neutral-900/50
      "
        >
          <h2 className="text-base font-semibold tracking-tight">
            Discussion Note
          </h2>
        </div>

        <div className="p-5">
          <div
            className="
          bg-[#fff] dark:bg-[#0a0a0a]
          border border-border
          rounded-xl
          p-4 
          text-sm leading-relaxed 
          min-h-[70px] 
        "
          >
            {final_desc_note || "No description provided."}
          </div>
        </div>
      </div>

      {/* -------- Delete Confirmation Dialog -------- */}
      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected file will be
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

      <BaseModal
        open={addFilesOpen}
        onOpenChange={(open) => {
          if (!open) {
            setAddFilesOpen(false);
            setFilesToUpload([]);
          }
        }}
        title="Add More Final Measurement Files"
        description="Upload additional final measurement files (PDF or images, max 10)."
        size="smd"
      >
        <div className="p-5 space-y-4">
          <FileUploadField
            value={filesToUpload}
            onChange={handleFilesChange}
            accept={documentAccept}
            multiple
            maxFiles={10}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAddFilesOpen(false);
                setFilesToUpload([]);
              }}
              disabled={addingFiles}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddMoreFiles}
              disabled={addingFiles}
            >
              {addingFiles ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      </BaseModal>

      <BaseModal
        open={addSitePhotosOpen}
        onOpenChange={(open) => {
          if (!open) {
            setAddSitePhotosOpen(false);
            setSitePhotosToUpload([]);
          }
        }}
        title="Add More Site Photos"
        description="Upload additional site photos (max 10)."
        size="smd"
      >
        <div className="p-5 space-y-4">
          <FileUploadField
            value={sitePhotosToUpload}
            onChange={handleSitePhotosChange}
            accept={imageAccept}
            multiple
            maxFiles={10}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAddSitePhotosOpen(false);
                setSitePhotosToUpload([]);
              }}
              disabled={addingSitePhotos}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddMoreSitePhotos}
              disabled={addingSitePhotos}
            >
              {addingSitePhotos ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      </BaseModal>
    </motion.div>
  );
}
