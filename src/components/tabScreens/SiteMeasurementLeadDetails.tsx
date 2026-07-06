"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Edit2, FileText, Plus, RefreshCcw, Receipt, Ban, Image } from "lucide-react";
import {
  useBookingDoneIsmDetails,
  useReplaceInitialSiteMeasurementPdf,
  useSiteMeasurementLeadById,
} from "@/hooks/Site-measruement/useSiteMeasruementLeadsQueries";
import { useLeadProductStructureInstances } from "@/hooks/useLeadsQueries";
import { LeadProductStructureInstance } from "@/api/leads";
import { SiteMeasurementFile } from "@/types/site-measrument-types";
import { useUploadAdditionalSitePhotosMutation } from "@/hooks/Site-measruement/useUploadAdditionalSitePhotos";
import { useUploadMeasurementDocumentsMutation } from "@/hooks/Site-measruement/useUploadMeasurementDocuments";
import SiteMesurementEditModal from "../sales-executive/siteMeasurement/site-mesurement-edit-modal";
import AddCurrentSitePhotos from "../sales-executive/siteMeasurement/current-site-image-add-modal";
import AddMeasurementDocuments from "../sales-executive/siteMeasurement/measurement-documents-add-modal";
import AddPaymentDetailsPhotos from "../sales-executive/siteMeasurement/payment-details-image-add-modal";
import { useAppSelector } from "@/redux/store";
import { useLeadStatus } from "@/hooks/designing-stage/designing-leads-hooks";
import { ImageComponent } from "../utils/ImageCard";
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
import BaseModal from "@/components/utils/baseModal";
import { FileUploadField } from "@/components/custom/file-upload";
import { useQueryClient } from "@tanstack/react-query";
import { toastManager } from "@/components/ui/toast";
import { useLeadAccessControl } from "@/hooks/useLeadAccessControl";
import CustomeTooltip from "../custom-tooltip";

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
const documentAccept = ".png,.jpg,.jpeg";
const imageExtensions = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "bmp",
  "svg",
  "heic",
  "heif",
  "avif",
]);

export default function SiteMeasurementLeadDetails({ leadId }: Props) {
  // 🧩 --- Redux & Auth Context ---
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type?.user_type
  );
  const customPrivilegeCodes = useAppSelector(
    (state) => state.customPrivileges.codes,
  );
  const isCustomVendor = useAppSelector(
    (state) => state.auth.user?.vendor?.is_this_vendor_is_custom_usertype_only === true
  );

  // 🧩 --- Hooks ---
  const { data } = useSiteMeasurementLeadById(leadId);
  const { data: structureInstancesData } = useLeadProductStructureInstances(
    leadId,
    vendorId,
    isCustomVendor
  );

  const structureInstances: LeadProductStructureInstance[] = React.useMemo(
    () =>
      Array.isArray(structureInstancesData?.data)
        ? structureInstancesData.data
        : [],
    [structureInstancesData?.data],
  );
  const { data: leadData, isLoading, error } = useLeadStatus(leadId, vendorId);
  const { data: bookingDoneIsm } = useBookingDoneIsmDetails(leadId, vendorId);
  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);
  const { mutateAsync: replacePdf, isPending: replacingPdf } =
    useReplaceInitialSiteMeasurementPdf();
  const queryClient = useQueryClient();
  const {
    shouldDisableBlockedActions,
    blockedTooltip,
  } = useLeadAccessControl({
    leadId,
    userType,
  });

  // 🧩 --- Local State ---
  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);
  const [replaceDocId, setReplaceDocId] = useState<number | null>(null);
  const [replaceFiles, setReplaceFiles] = useState<File[]>([]);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openImageModal, setOpenImageModal] = useState(false);
  const [openImageModal2, setOpenImageModal2] = useState(false);
  const [openMeasurementModal, setOpenMeasurementModal] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadModalDocs, setUploadModalDocs] = useState<File[]>([]);
  const [uploadModalPhotos, setUploadModalPhotos] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [uploadDocsProgress, setUploadDocsProgress] = useState(false);
  const [uploadPhotosProgress, setUploadPhotosProgress] = useState(false);
  const [viewModalInstance, setViewModalInstance] = useState<LeadProductStructureInstance | null>(null);
  const [viewModalType, setViewModalType] = useState<'photos' | 'documents' | null>(null);

  const uploadSitePhotosMutation = useUploadAdditionalSitePhotosMutation();
  const uploadDocumentsMutation = useUploadMeasurementDocumentsMutation();

  // 🧩 --- Data Extraction ---
  const accountId = leadId;
  const leadStatus = leadData?.status;
  const pdfDocs: SiteMeasurementFile[] =
    data?.initial_site_measurement_documents || [];
  const currentSitePhotos: SiteMeasurementFile[] =
    data?.current_site_photos || [];
  const paymentImages: SiteMeasurementFile[] =
    data?.initial_site_measurement_payment_details || [];
  const payment = data?.payment_info;
  const bookingDoneIsmCurrentSitePhotos =
    bookingDoneIsm?.current_site_photos || [];
  const bookingDoneIsmPdfDocs = bookingDoneIsm?.pdf_documents || [];
  const bookingDoneIsmPaymentImages = bookingDoneIsm?.payment_images || [];
  const bookingDoneIsmPaymentInfo = bookingDoneIsm?.payment_info;
  const bookingDoneIsmLedgerEntry = bookingDoneIsm?.ledger_entry;
  const bookingDoneIsmUploadedAt = bookingDoneIsm?.uploaded_at;
  const hasBookingDoneIsmContent =
    bookingDoneIsmCurrentSitePhotos.length > 0 ||
    bookingDoneIsmPdfDocs.length > 0 ||
    bookingDoneIsmPaymentImages.length > 0 ||
    Boolean(bookingDoneIsmPaymentInfo) ||
    Boolean(bookingDoneIsmLedgerEntry) ||
    Boolean(bookingDoneIsmUploadedAt);

  // 🧩 --- Permissions ---
  const canEditOrUpload =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes("leads.ism_leads.ism_details.edit")
      : userType === "admin" ||
      userType === "super-admin" ||
      (userType === "sales-executive" &&
        leadStatus === "initial-site-measurement");

  const canDelete =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes("leads.ism_leads.ism_details.delete")
      : userType === "admin" ||
      userType === "super-admin" ||
      (userType === "sales-executive" &&
        leadStatus === "initial-site-measurement");

  // 🧩 --- Handlers ---
  const handleConfirmDelete = () => {
    if (shouldDisableBlockedActions) return;
    if (!confirmDelete) return;
    setReplaceDocId(confirmDelete);
    setConfirmDelete(null);
  };

  const handleReplaceFilesChange = (files: File[]) => {
    if (files.length > 1) {
      setReplaceFiles([files[0]]);
      toastManager.add({ title: "Only one file can be uploaded.", type: "error" });
      return;
    }
    setReplaceFiles(files);
  };

  const handleInstanceUpload = async (instance: any, type: 'photos' | 'documents', instanceUploads: any, setInstanceUploads: any, partialInstanceMutation: any, setUploadingInstanceId: any, setMultiInstanceErrors: any) => {
    const uploads = instanceUploads[instance.id] ?? {
      current_site_photos: [],
      upload_pdf: [],
    };

    if (type === 'photos' && uploads.current_site_photos.length === 0) {
      toastManager.add({
        title: `Please select Site Photos to upload for ${instance.title}.`,
        type: "error",
      });
      return;
    }

    if (type === 'documents' && uploads.upload_pdf.length === 0) {
      toastManager.add({
        title: `Please select Initial Site Measurement Document for ${instance.title}.`,
        type: "error",
      });
      setMultiInstanceErrors((prev: any) => [...prev, instance.id]);
      return;
    }

    const formData = new FormData();
    formData.append("lead_id", leadId?.toString() || "");
    formData.append("account_id", data?.account?.id?.toString() || leadId?.toString() || "");
    formData.append("vendor_id", vendorId?.toString() || "");
    formData.append("created_by", userId?.toString() || "");
    formData.append("client_id", "1");
    formData.append("user_id", userId?.toString() || "");

    if (type === 'photos') {
      uploads.current_site_photos.forEach((file: File) => {
        formData.append("current_site_photos", file);
      });
      formData.append(
        "current_site_photo_instance_ids",
        JSON.stringify(uploads.current_site_photos.map(() => instance.id)),
      );
    }

    if (type === 'documents') {
      uploads.upload_pdf.forEach((file: File) => {
        formData.append("upload_pdf", file);
      });
      formData.append(
        "upload_pdf_instance_ids",
        JSON.stringify(uploads.upload_pdf.map(() => instance.id)),
      );
    }

    formData.append("skip_status_update", "true");

    try {
      setUploadingInstanceId(instance.id);
      await partialInstanceMutation.mutateAsync(formData);
      setInstanceUploads((prev: any) => ({
        ...prev,
        [instance.id]: {
          ...prev[instance.id],
          ...(type === 'photos' ? { current_site_photos: [] } : { upload_pdf: [] }),
        },
      }));
    } finally {
      setUploadingInstanceId(null);
    }
  };

  const handleReplacePdf = async () => {
    if (!replaceDocId || !vendorId || !userId) return;
    if (replaceFiles.length === 0) {
      toastManager.add({ title: "Please select a file to upload.", type: "error" });
      return;
    }

    const pdfFile = replaceFiles[0];
    if (!documentMimeTypes.includes(pdfFile.type)) {
      toastManager.add({ title: "Only PDF or image files are allowed.", type: "error" });
      return;
    }

    try {
      await replacePdf({
        documentId: replaceDocId,
        vendorId,
        userId,
        pdfFile,
      });
      toastManager.add({ title: "Document updated successfully.", type: "success" });
      setReplaceFiles([]);
      setReplaceDocId(null);
      queryClient.invalidateQueries({
        queryKey: ["siteMeasurementLeadDetails", leadId],
      });
    } catch (error: any) {
      toastManager.add({ title: error?.response?.data?.message || "Failed to replace document.", type: "error" });
    }
  };

  const isImageFile = (fileName?: string | null) => {
    const extension = String(fileName ?? "")
      .split(".")
      .pop()
      ?.trim()
      .toLowerCase();

    return extension ? imageExtensions.has(extension) : false;
  };

  const renderFileCard = (
    file: {
      id: number;
      originalName: string;
      signedUrl: string;
      uploadedAt?: string;
      createdAt?: string;
    },
    index?: number,
    disableActions?: boolean,
  ) => {
    const uploadedAt = file.uploadedAt ?? file.createdAt;

    if (isImageFile(file.originalName)) {
      return (
        <ImageComponent
          key={file.id}
          doc={{
            id: file.id,
            doc_og_name: file.originalName,
            signedUrl: file.signedUrl,
            created_at: uploadedAt,
          }}
          index={index}
          canDelete={canDelete}
          disableActions={disableActions}
          onDelete={(id) => setConfirmDelete(Number(id))}
        />
      );
    }

    return (
      <DocumentCard
        key={file.id}
        doc={{
          id: file.id,
          originalName: file.originalName,
          created_at: uploadedAt,
          signedUrl: file.signedUrl,
        }}
        canDelete={canDelete}
        disableActions={disableActions}
        onDelete={(id) => setConfirmDelete(Number(id))}
        alwaysShowText={true}
      />
    );
  };

  // 🧩 --- Loading & Error States ---
  if (isLoading)
    return (
      <Loader
        fullScreen
        size={250}
        message="Loading Site Measurement Details..."
      />
    );
  if (error)
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <Ban size={32} className="text-destructive" />
        </div>
        <p className="text-sm text-muted-foreground">
          Error loading site measurement details.
        </p>
      </div>
    );

  if (!data) {
    return (
      <div className="border rounded-lg p-6">
        <p>No site measurement details found.</p>
      </div>
    );
  }

  // 🧩 --- Render ---
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="rounded-lg w-full h-full py-4 space-y-6 overflow-y-scroll bg-[#fff] dark:bg-[#0a0a0a]"
    >
      {isCustomVendor ? (
        <>
          <motion.section
            variants={itemVariants}
            className="w-full bg-[#fff] dark:bg-[#0a0a0a] rounded-2xl border border-border shadow-soft overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between items-start gap-1 sm:gap-2 px-5 py-3 border-b border-border bg-[#fff] dark:bg-[#0a0a0a]">
              <div className="flex items-center gap-2">
                <FileText size={20} className="shrink-0" />
                <h1 className="text-lg font-semibold tracking-tight">
                  Measurement Documents & Photos
                </h1>
              </div>
            </div>

            <div className="p-6">
              {structureInstances.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {structureInstances.map((instance) => {
                    const instanceDocs = pdfDocs.filter((doc) => doc.product_structure_instance_id === instance.id);
                    const instancePhotos = currentSitePhotos.filter((doc) => doc.product_structure_instance_id === instance.id);
                    return (
                      <div key={instance.id} className="border border-border rounded-xl p-4 flex flex-col justify-between bg-card hover:bg-muted/40 transition-colors">
                        <div>
                          <h4 className="font-medium text-card-foreground">{instance.title}</h4>
                          {instance.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                              {instance.description}
                            </p>
                          )}
                        </div>
                        <div className="mt-4 space-y-2">
                          <div className="flex flex-col gap-1 text-[11px] border border-border rounded-lg p-2.5 bg-muted/10">
                            <div className="flex justify-between items-center text-muted-foreground">
                              <span>Measurement:</span>
                              <span className={instanceDocs.length > 0 ? "font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded" : "font-medium"}>
                                {instanceDocs.length} uploaded
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-muted-foreground">
                              <span>Site Photos:</span>
                              <span className={instancePhotos.length > 0 ? "font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded" : "font-medium"}>
                                {instancePhotos.length} uploaded
                              </span>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full h-8 flex items-center justify-center text-xs font-medium rounded-md gap-1"
                            onClick={() => {
                              setViewModalInstance(instance);
                            }}
                          >
                            <FileText size={14} />
                            Manage Files
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                !canEditOrUpload && (
                  <div className="flex flex-col items-center justify-center py-10">
                    <FileText size={42} className="text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No instances available.
                    </p>
                  </div>
                )
              )}
            </div>
          </motion.section>

          {payment && (
            <motion.section
              variants={itemVariants}
              className="w-full bg-[#fff] dark:bg-[#0a0a0a] rounded-2xl border border-border shadow-soft overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-[#fff] dark:bg-[#0a0a0a]">
                <div className="flex items-center gap-2">
                  <Receipt size={20} />
                  <h1 className="text-lg font-semibold tracking-tight">
                    Payment Information
                  </h1>
                </div>

                {canEditOrUpload &&
                  (shouldDisableBlockedActions ? (
                    <div className="flex justify-end">
                      <CustomeTooltip
                        value={blockedTooltip}
                        truncateValue={
                          <Button
                            size="sm"
                            disabled
                            className="gap-2"
                          >
                            <Edit2 size={16} />
                            <span className="text-sm">Edit</span>
                          </Button>
                        }
                      />
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => setOpenEditModal(true)}
                      className="gap-2"
                    >
                      <Edit2 size={16} />
                      <span className="text-sm">Edit</span>
                    </Button>
                  ))}
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Payment Amount
                  </p>
                  <div className="bg-muted border border-border rounded-lg px-3 py-2 text-sm">
                    {payment.amount ?? "N/A"}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Payment Date
                  </p>
                  <div className="bg-muted border border-border rounded-lg px-3 py-2 text-sm">
                    {payment.payment_date
                      ? new Date(payment.payment_date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })
                      : "N/A"}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Payment Description
                  </p>
                  <div
                    className="bg-muted border border-border rounded-lg px-3 py-2 text-sm max-h-24 overflow-y-auto"
                  >
                    {payment.payment_text || "N/A"}
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </>
      ) : (
        <>
          <div className={payment ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "w-full"}>
            {/* Measurement Document Section */}
            <motion.section
              variants={itemVariants}
              className="w-full bg-[#fff] dark:bg-[#0a0a0a] rounded-2xl border border-border shadow-soft overflow-hidden flex flex-col"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between items-start gap-1 sm:gap-2 px-5 py-3 border-b border-border bg-[#fff] dark:bg-[#0a0a0a]">
                <div className="flex items-center gap-2">
                  <FileText size={20} className="shrink-0" />
                  <h1 className="text-lg font-semibold tracking-tight">
                    Measurement Document
                  </h1>
                </div>
                <span className="text-xs font-medium text-muted-foreground shrink-0 text-right">
                  {pdfDocs.length} {pdfDocs.length === 1 ? "File" : "Files"}
                </span>
              </div>

              <div className="p-6 flex-grow flex flex-col justify-between">
                {pdfDocs.length > 0 ? (
                  <div className="space-y-4">
                    {pdfDocs.map((doc, index) => {
                      return renderFileCard(
                        {
                          id: doc.id,
                          originalName: doc.originalName,
                          uploadedAt: doc.uploadedAt,
                          signedUrl: doc.signedUrl,
                        },
                        index,
                        shouldDisableBlockedActions,
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 my-auto">
                    <FileText size={42} className="text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No measurement document found.
                    </p>
                  </div>
                )}
              </div>
            </motion.section>

            {/* Payment Information Section */}
            {payment && (
              <motion.section
                variants={itemVariants}
                className="w-full bg-[#fff] dark:bg-[#0a0a0a] rounded-2xl border border-border shadow-soft overflow-hidden flex flex-col"
              >
                <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-[#fff] dark:bg-[#0a0a0a]">
                  <div className="flex items-center gap-2">
                    <Receipt size={20} />
                    <h1 className="text-lg font-semibold tracking-tight">
                      Payment Information
                    </h1>
                  </div>

                  {canEditOrUpload &&
                    (shouldDisableBlockedActions ? (
                      <div className="flex justify-end">
                        <CustomeTooltip
                          value={blockedTooltip}
                          truncateValue={
                            <Button
                              size="sm"
                              disabled
                              className="gap-2"
                            >
                              <Edit2 size={16} />
                              <span className="text-sm">Edit</span>
                            </Button>
                          }
                        />
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => setOpenEditModal(true)}
                        className="gap-2"
                      >
                        <Edit2 size={16} />
                        <span className="text-sm">Edit</span>
                      </Button>
                    ))}
                </div>

                <div className="p-6 space-y-6 flex-grow">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Payment Amount
                    </p>
                    <div className="bg-muted border border-border rounded-lg px-3 py-2 text-sm">
                      {payment.amount ?? "N/A"}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Payment Date
                    </p>
                    <div className="bg-muted border border-border rounded-lg px-3 py-2 text-sm">
                      {payment.payment_date
                        ? new Date(payment.payment_date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })
                        : "N/A"}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Payment Description
                    </p>
                    <div
                      className="bg-muted border border-border rounded-lg px-3 py-2 text-sm max-h-24 overflow-y-auto"
                    >
                      {payment.payment_text || "N/A"}
                    </div>
                  </div>
                </div>
              </motion.section>
            )}
          </div>

          {/* Site Photos Section */}
          <motion.section
            variants={itemVariants}
            className="bg-white dark:bg-neutral-900 rounded-2xl border border-border shadow-soft overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-[#fff] dark:bg-[#0a0a0a]">
              <div className="flex flex-col items-start">
                <h1 className="text-lg font-semibold tracking-tight">
                  Site Photos
                </h1>
                <p className="text-xs text-gray-500">
                  Uploaded photos of the site before design/production begins.
                </p>
              </div>
            </div>

            <motion.div
              variants={itemVariants}
              className="p-6 bg-[#fff] dark:bg-[#0a0a0a]"
            >
              <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(380px,1fr))] gap-5">
                {currentSitePhotos.map((doc, index) => {
                  return renderFileCard(
                    {
                      id: doc.id,
                      originalName: doc.originalName,
                      uploadedAt: doc.uploadedAt,
                      signedUrl: doc.signedUrl,
                    },
                    index,
                    shouldDisableBlockedActions,
                  );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(380px,1fr))] gap-5 mt-5">
                {canEditOrUpload &&
                  (shouldDisableBlockedActions ? (
                    <CustomeTooltip
                      value={blockedTooltip}
                      truncateValue={
                        <div
                          className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-border rounded-xl opacity-60 cursor-not-allowed"
                        >
                          <Plus size={26} className="text-muted-foreground mb-1" />
                          <span className="text-xs font-medium text-muted-foreground">
                            Add Photos
                          </span>
                        </div>
                      }
                    />
                  ) : (
                    <div
                      onClick={() => setOpenImageModal(true)}
                      className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-border rounded-xl cursor-pointer"
                    >
                      <Plus size={26} className="text-muted-foreground mb-1" />
                      <span className="text-xs font-medium text-muted-foreground">
                        Add Photos
                      </span>
                    </div>
                  ))}
              </div>
            </motion.div>
          </motion.section>
        </>
      )}

      {paymentImages.length > 0 && (
        <motion.section
          variants={itemVariants}
          className="bg-[#fff] dark:bg-[#0a0a0a] rounded-2xl border border-border shadow-soft overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-[#fff] dark:bg-[#0a0a0a]">
            <div className="flex flex-col items-start">
              <h1 className="text-lg font-semibold tracking-tight">
                Payment Proofs
              </h1>
              <p className="text-xs text-gray-500">
                Uploaded payment transaction receipts & confirmation photos.
              </p>
            </div>
          </div>

          <motion.div
            variants={itemVariants}
            className="p-6 bg-[#fff] dark:bg-[#0a0a0a]"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {paymentImages.map((doc, index) => {
                return renderFileCard(
                  {
                    id: doc.id,
                    originalName: doc.originalName,
                    uploadedAt: doc.uploadedAt,
                    signedUrl: doc.signedUrl,
                  },
                  index,
                  shouldDisableBlockedActions,
                );
              })}
            </div>
          </motion.div>
        </motion.section>
      )}

      {hasBookingDoneIsmContent && (
        <motion.section
          variants={itemVariants}
          className="bg-[#fff] dark:bg-[#0a0a0a] rounded-2xl border border-border shadow-soft overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-[#fff] dark:bg-[#0a0a0a]">
            <div className="flex flex-col items-start">
              <h1 className="text-lg font-semibold tracking-tight">
                Booking Done ISM Uploads
              </h1>
              <p className="text-xs text-gray-500">
                Documents and photos submitted for Booking Done ISM.
              </p>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {bookingDoneIsmPaymentInfo && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-border rounded-xl p-4 bg-muted/40 dark:bg-neutral-900 space-y-3">
                  <div className="flex items-center gap-2">
                    <Receipt size={18} />
                    <h3 className="text-sm font-semibold">Payment Info</h3>
                  </div>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount</span>
                      <span>{bookingDoneIsmPaymentInfo.amount ?? "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Payment Date
                      </span>
                      <span>
                        {bookingDoneIsmPaymentInfo.payment_date ?? "N/A"}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">
                        Description
                      </span>
                      <div className="bg-background border border-border rounded-lg px-3 py-2 text-sm">
                        {bookingDoneIsmPaymentInfo.payment_text || "N/A"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {bookingDoneIsmPdfDocs.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText size={18} />
                  <h2 className="text-base font-semibold">
                    ISM Documents ({bookingDoneIsmPdfDocs.length})
                  </h2>
                </div>
                <div className="space-y-3">
                  {bookingDoneIsmPdfDocs.map((doc: any, index: number) => {
                    return renderFileCard(
                      {
                        id: doc.id,
                        originalName: doc.originalName,
                        createdAt: doc.createdAt,
                        signedUrl: doc.signedUrl,
                      },
                      index,
                      shouldDisableBlockedActions,
                    );
                  })}
                </div>
              </div>
            )}

            {bookingDoneIsmCurrentSitePhotos.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText size={18} />
                  <h2 className="text-base font-semibold">
                    Current Site Photos (
                    {bookingDoneIsmCurrentSitePhotos.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(380px,1fr))] gap-5">
                  {bookingDoneIsmCurrentSitePhotos.map((doc: any, index: any) => {
                    return renderFileCard(
                      {
                        id: doc.id,
                        originalName: doc.originalName,
                        createdAt: doc.createdAt,
                        signedUrl: doc.signedUrl,
                      },
                      index,
                    );
                  })}
                </div>
              </div>
            )}

            {bookingDoneIsmPaymentImages.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText size={18} />
                  <h2 className="text-base font-semibold">
                    Payment Images ({bookingDoneIsmPaymentImages.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(380px,1fr))] gap-5">
                  {bookingDoneIsmPaymentImages.map((doc: any, index: any) => {
                    return renderFileCard(
                      {
                        id: doc.id,
                        originalName: doc.originalName,
                        createdAt: doc.createdAt,
                        signedUrl: doc.signedUrl,
                      },
                      index,
                      shouldDisableBlockedActions,
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.section>
      )}

      <SiteMesurementEditModal
        open={openEditModal}
        onOpenChange={setOpenEditModal}
        data={{
          accountId: accountId,
          id: leadId,
          paymentInfo: payment,
        }}
      />
      <AddCurrentSitePhotos
        open={openImageModal}
        onOpenChange={setOpenImageModal}
        data={{
          accountId,
          id: leadId,
          paymentId: payment?.id ?? null,
        }}
      />
      <AddMeasurementDocuments
        open={openMeasurementModal}
        onOpenChange={setOpenMeasurementModal}
        data={{
          accountId,
          id: leadId,
          paymentId: payment?.id ?? null,
        }}
      />
      <AddPaymentDetailsPhotos
        open={openImageModal2}
        onOpenChange={setOpenImageModal2}
        data={{
          accountId,
          id: leadId,
          paymentId: payment?.id ?? null,
        }}
      />

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
              disabled={deleting || shouldDisableBlockedActions}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BaseModal
        open={!!replaceDocId}
        onOpenChange={(open) => {
          if (!open) {
            setReplaceDocId(null);
            setReplaceFiles([]);
          }
        }}
        title="Replace Measurement Document"
        description="Upload a new PDF or image to replace the existing document."
        size="md"
      >
        <div className="p-5 space-y-4">
          <FileUploadField
            value={replaceFiles}
            onChange={handleReplaceFilesChange}
            accept={documentAccept}
            multiple={false}
            maxFiles={1}
          />

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setReplaceDocId(null);
                setReplaceFiles([]);
              }}
              disabled={replacingPdf}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleReplacePdf} disabled={replacingPdf}>
              {replacingPdf ? "Updating..." : "Update"}
            </Button>
          </div>
        </div>
      </BaseModal>

      {/* View & Upload Instance Files Modal */}
      <BaseModal
        open={!!viewModalInstance}
        onOpenChange={(open) => {
          if (!open) {
            setViewModalInstance(null);
            setUploadModalDocs([]);
            setUploadModalPhotos([]);
          }
        }}
        title={`Manage Files - ${viewModalInstance?.title || ''}`}
        description={`Upload documents & photos or view/delete saved files for this instance.`}
        size="xl"
      >
        <div className="px-5 py-4 max-h-[85vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column: Photos */}
            <div className="space-y-2">
              
                <h4 className="font-semibold text-base flex items-center gap-2">
                  <Image size={18} />
                  Site Photos
                </h4>
           

              {/* Photos Upload Area */}
              {canEditOrUpload && (
                <div className="space-y-3">
                  <FileUploadField
                    value={uploadModalPhotos}
                    onChange={(files) => setUploadModalPhotos(files)}
                    accept=".png, .jpg, .jpeg, .gif"
                    multiple={true}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setUploadModalPhotos([])}
                      disabled={uploadPhotosProgress}
                    >
                      Clear
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={async () => {
                        if (uploadModalPhotos.length === 0 || !viewModalInstance) return;
                        setUploadPhotosProgress(true);
                        const formData = new FormData();
                        formData.append("lead_id", leadId.toString());
                        formData.append("account_id", accountId.toString());
                        formData.append("vendor_id", vendorId!.toString());
                        formData.append("updated_by", userId!.toString());

                        uploadModalPhotos.forEach((file) => formData.append("current_site_photos", file));
                        formData.append("site_photo_instance_ids", JSON.stringify(uploadModalPhotos.map(() => viewModalInstance.id)));

                        try {
                          await uploadSitePhotosMutation.mutateAsync(formData);
                          toastManager.add({ title: "Photos uploaded successfully!", type: "success" });
                          setUploadModalPhotos([]);
                          queryClient.invalidateQueries({ queryKey: ["siteMeasurementLeadDetails", leadId] });
                        } catch (e: any) {
                          toastManager.add({ title: e?.message || "Upload failed", type: "error" });
                        } finally {
                          setUploadPhotosProgress(false);
                        }
                      }}
                      disabled={uploadPhotosProgress || uploadModalPhotos.length === 0}
                    >
                      {uploadPhotosProgress ? "Uploading..." : "Upload"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Saved Photos List */}
              <div className="space-y-3">
                <h5 className="text-xs font-semibold text-muted-foreground">Saved Photos</h5>
                {(() => {
                  if (!viewModalInstance) return null;
                  const instancePhotos = currentSitePhotos.filter((doc) => doc.product_structure_instance_id === viewModalInstance.id);
                  return instancePhotos.length > 0 ? (
                    <div className="space-y-2">
                      {instancePhotos.map((doc, index) => (
                        <div key={doc.id}>
                          {renderFileCard(
                            {
                              id: doc.id,
                              originalName: doc.originalName,
                              uploadedAt: doc.uploadedAt,
                              signedUrl: doc.signedUrl,
                            },
                            index,
                            shouldDisableBlockedActions
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No photos uploaded for this instance.</p>
                  );
                })()}
              </div>
            </div>

            {/* Right Column: Documents */}
            <div className="space-y-2">
              
                <h4 className="font-semibold text-base flex items-center gap-2">
                  <FileText size={18} />
                  Measurement Documents
                </h4>
           

              {/* Docs Upload Area */}
              {canEditOrUpload && (
                <div className="space-y-3">
                  <FileUploadField
                    value={uploadModalDocs}
                    onChange={(files) => setUploadModalDocs(files)}
                    accept="application/pdf,image/*"
                    multiple={true}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setUploadModalDocs([])}
                      disabled={uploadDocsProgress}
                    >
                      Clear
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={async () => {
                        if (uploadModalDocs.length === 0 || !viewModalInstance) return;
                        setUploadDocsProgress(true);
                        const formData = new FormData();
                        formData.append("lead_id", leadId.toString());
                        formData.append("account_id", accountId.toString());
                        formData.append("vendor_id", vendorId!.toString());
                        formData.append("updated_by", userId!.toString());

                        uploadModalDocs.forEach((file) => formData.append("upload_pdf", file));
                        formData.append("upload_pdf_instance_ids", JSON.stringify(uploadModalDocs.map(() => viewModalInstance.id)));

                        try {
                          await uploadDocumentsMutation.mutateAsync(formData);
                          toastManager.add({ title: "Documents uploaded successfully!", type: "success" });
                          setUploadModalDocs([]);
                          queryClient.invalidateQueries({ queryKey: ["siteMeasurementLeadDetails", leadId] });
                        } catch (e: any) {
                          toastManager.add({ title: e?.message || "Upload failed", type: "error" });
                        } finally {
                          setUploadDocsProgress(false);
                        }
                      }}
                      disabled={uploadDocsProgress || uploadModalDocs.length === 0}
                    >
                      {uploadDocsProgress ? "Uploading..." : "Upload"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Saved Docs List */}
              <div className="space-y-3">
                <h5 className="text-xs font-semibold text-muted-foreground">Saved Documents</h5>
                {(() => {
                  if (!viewModalInstance) return null;
                  const instanceDocs = pdfDocs.filter((doc) => doc.product_structure_instance_id === viewModalInstance.id);
                  return instanceDocs.length > 0 ? (
                    <div className="space-y-2">
                      {instanceDocs.map((doc, index) => (
                        <div key={doc.id}>
                          {renderFileCard(
                            {
                              id: doc.id,
                              originalName: doc.originalName,
                              uploadedAt: doc.uploadedAt,
                              signedUrl: doc.signedUrl,
                            },
                            index,
                            shouldDisableBlockedActions
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No documents uploaded for this instance.</p>
                  );
                })()}
              </div>
            </div>

          </div>
        </div>
      </BaseModal>
    </motion.div>
  );
}
