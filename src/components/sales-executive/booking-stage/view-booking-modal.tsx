
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useBookingLeadById,
  useReassignSiteSupervisor,
  useSiteSupervisors,
  useUpdateMrpValue,
  useUpdateTotalProjectAmount,
  useUpdateBookingAmount,
} from "@/hooks/booking-stage/use-booking";
import { useAppSelector } from "@/redux/store";
import {
  User,
  IndianRupee,
  CreditCard,
  Plus,
  Images,
  RefreshCcw,
  Ban,
  UserPlus,
  UserPen,
} from "lucide-react";
import { DocumentBooking } from "@/types/booking-types";
import UploadFinalDoc from "./add-final-doc";
import { useLeadById } from "@/hooks/useLeadsQueries";
import { useLeadStatus } from "@/hooks/designing-stage/designing-leads-hooks";
import DocumentCard from "@/components/utils/documentCard";
import { Button } from "@/components/ui/button";
import { useDeleteDocument } from "@/api/leads";
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
import { ImageComponent } from "@/components/utils/ImageCard";
import { canUploadOrDeleteBookingDone } from "@/components/utils/privileges";
import { useCSPBookingPhotos } from "@/hooks/useCSPBookingPhotos";
import SectionHeader from "@/utils/sectionHeader";
import {
  useBookingDoneIsmDetails,
  useSiteMeasurementLeadById,
} from "@/hooks/Site-measruement/useSiteMeasruementLeadsQueries";
import { useDesignsDoc } from "@/hooks/designing-stage/designing-leads-hooks";
import { FileText, Folder } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import CurrencyInput from "@/components/custom/CurrencyInput";
import AddCurrentSitePhotos from "@/components/sales-executive/siteMeasurement/current-site-image-add-modal";
import BaseModal from "@/components/utils/baseModal";
import { FileUploadField } from "@/components/custom/file-upload";
import { useReplaceInitialSiteMeasurementPdf } from "@/hooks/Site-measruement/useSiteMeasruementLeadsQueries";
import { useSubmitDesigns } from "@/api/designingStageQueries";
import { DocumentsUploader } from "@/components/document-upload";
import { useUploadCSPBooking } from "@/hooks/useUploadCSPBooking";

interface Props {
  leadId: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      staggerChildren: 0.05,
    },
  },
};

const documentMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
];
const documentAccept = ".pdf,.png,.jpg,.jpeg,.gif";

const mrpSchema = z.object({
  mrpValue: z
    .string()
    .min(1, "MRP value is required")
    .refine((value) => Number(value) >= 0, "MRP value must be 0 or greater"),
});

type MrpFormValues = z.infer<typeof mrpSchema>;

const totalProjectSchema = z.object({
  totalProjectAmount: z
    .string()
    .min(1, "Total project amount is required")
    .refine(
      (value) => Number(value) >= 0,
      "Total project amount must be 0 or greater",
    ),
});

type TotalProjectFormValues = z.infer<typeof totalProjectSchema>;

const bookingAmountSchema = z.object({
  bookingAmount: z
    .string()
    .min(1, "Booking amount is required")
    .refine(
      (value) => Number(value) >= 0,
      "Booking amount must be 0 or greater",
    ),
});

type BookingAmountFormValues = z.infer<typeof bookingAmountSchema>;

const designsSchema = z.object({
  upload_pdf: z
    .any()
    .refine((files) => files && files.length > 0, {
      message: "Please upload at least one design file.",
    })
    .refine((files) => files.length <= 10, {
      message: "You can upload up to 10 files only.",
    })
    .refine(
      (files: File[]) =>
        files.every((f) =>
          /\.(pdf|zip|pyo|pytha|dwg|dxf|stl|step|stp|iges|igs|3ds|obj|skp|sldprt|sldasm|prt|catpart|catproduct)$/i.test(
            f.name,
          ),
        ),
      {
        message: "Only PDF, ZIP or supported design formats are allowed.",
      },
    ),
});

type DesignsFormValues = z.infer<typeof designsSchema>;

const BookingLeadsDetails: React.FC<Props> = ({ leadId }) => {
  // 🧩 Redux state
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type?.user_type,
  );

  // 🧩 States
  const [openFinalDocModal, setOpenFinalDocModal] = useState<boolean>(false);
  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [reassignConfirmOpen, setReassignConfirmOpen] = useState(false);
  const [mrpModalOpen, setMrpModalOpen] = useState(false);
  const [totalProjectModalOpen, setTotalProjectModalOpen] = useState(false);
  const [bookingAmountModalOpen, setBookingAmountModalOpen] = useState(false);
  const [initialSitePhotosOpen, setInitialSitePhotosOpen] = useState(false);
  const [replaceInitialDocId, setReplaceInitialDocId] = useState<number | null>(
    null,
  );
  const [replaceInitialFiles, setReplaceInitialFiles] = useState<File[]>([]);
  const [designsModalOpen, setDesignsModalOpen] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState<{
    id: number;
    user_name: string;
  } | null>(null);
  const [cspUploadOpen, setCspUploadOpen] = useState(false);
  const [cspFiles, setCspFiles] = useState<File[]>([]);

  // 🧩 API Hooks
  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);
  const {
    data: leadData,
    isLoading,
    isError,
  } = useBookingLeadById(vendorId, leadId);
  const { data, isLoading: loading } = useLeadById(leadId, vendorId, userId);
  const { data: leadStatus, error } = useLeadStatus(leadId, vendorId);
  const { data: siteSupervisorsData, isLoading: loadingSupervisors } =
    useSiteSupervisors(vendorId!);
  const { mutate: reassignSupervisor, isPending: reassigning } =
    useReassignSiteSupervisor();
  const { mutate: updateMrp, isPending: updatingMrp } = useUpdateMrpValue();
  const { mutate: updateTotalProject, isPending: updatingTotalProject } =
    useUpdateTotalProjectAmount();
  const { mutate: updateBookingAmount, isPending: updatingBookingAmount } =
    useUpdateBookingAmount();
  const { mutateAsync: replaceInitialPdf, isPending: replacingInitialPdf } =
    useReplaceInitialSiteMeasurementPdf();
  const submitDesignsMutation = useSubmitDesigns();
  const uploadCspBookingMutation = useUploadCSPBooking();
  const queryClient = useQueryClient();

  const mrpForm = useForm<MrpFormValues>({
    resolver: zodResolver(mrpSchema),
    defaultValues: {
      mrpValue: "0",
    },
  });

  const totalProjectForm = useForm<TotalProjectFormValues>({
    resolver: zodResolver(totalProjectSchema),
    defaultValues: {
      totalProjectAmount: "0",
    },
  });

  const bookingAmountForm = useForm<BookingAmountFormValues>({
    resolver: zodResolver(bookingAmountSchema),
    defaultValues: {
      bookingAmount: "0",
    },
  });

  const designsForm = useForm<DesignsFormValues>({
    resolver: zodResolver(designsSchema),
    defaultValues: { upload_pdf: [] },
  });

  const { data: cspBookingData, isLoading: cspLoading } = useCSPBookingPhotos(
    vendorId!,
    leadId,
  );
  const { data: siteMeasurementDetails } = useSiteMeasurementLeadById(leadId);
  const { data: bookingDoneIsmDetails } = useBookingDoneIsmDetails(
    leadId,
    vendorId,
  );
  const { data: designDocsData } = useDesignsDoc(vendorId!, leadId);

  const bookingStagePhotos = cspBookingData?.documents ?? [];
  const initialMeasurementDocs =
    siteMeasurementDetails?.initial_site_measurement_documents || [];
  const initialCurrentSitePhotos =
    siteMeasurementDetails?.current_site_photos || [];
  const initialPaymentInfo = siteMeasurementDetails?.payment_info;
  const bookingDoneIsmDocs = bookingDoneIsmDetails?.pdf_documents || [];
  const bookingDoneIsmCurrentSite =
    bookingDoneIsmDetails?.current_site_photos || [];
  const bookingDoneIsmPaymentImages =
    bookingDoneIsmDetails?.payment_images || [];
  const designDocs = designDocsData?.data?.documents || [];
  const siteSupervisors = siteSupervisorsData?.data?.site_supervisors || [];

  const lead = data?.data?.lead;
  const accountId = Number(lead?.account_id);

  const finalDocs =
    leadData?.documents?.filter((doc) =>
      doc.s3Key.includes("final-documents-booking"),
    ) || [];

  const bookingPaymentDocs =
    leadData?.documents?.filter((doc) =>
      doc.s3Key.includes("booking-amount-payment-details"),
    ) || [];

  const status = leadStatus?.status;

  console.log("status -> ", lead?.status);

  const canDelete = canUploadOrDeleteBookingDone(userType, status);
  const canEditBookingValues =
    userType === "admin" ||
    userType === "super-admin" ||
    (userType === "sales-executive" && status === "booking-stage");

  console.log("Lead Status: ", status);

  React.useEffect(() => {
    if (leadData?.mrpValue !== undefined) {
      mrpForm.reset({ mrpValue: String(leadData.mrpValue ?? 0) });
    }
  }, [leadData?.mrpValue, mrpForm]);

  React.useEffect(() => {
    const totalProjectAmount =
      (lead as any)?.total_project_amount ?? leadData?.finalBookingAmount ?? 0;
    totalProjectForm.reset({
      totalProjectAmount: String(totalProjectAmount),
    });
  }, [lead, leadData?.finalBookingAmount, totalProjectForm]);

  React.useEffect(() => {
    const bookingAmount = leadData?.bookingAmount ?? 0;
    bookingAmountForm.reset({
      bookingAmount: String(bookingAmount),
    });
  }, [leadData?.bookingAmount, bookingAmountForm]);

  React.useEffect(() => {
    if (!designsModalOpen) {
      designsForm.reset({ upload_pdf: [] });
    }
  }, [designsModalOpen, designsForm]);

  const handleCspUpload = async () => {
    if (!vendorId || !userId || !leadId || !accountId) {
      toast.error("Missing required identifiers");
      return;
    }
    if (cspFiles.length === 0) {
      toast.error("Please select at least one photo");
      return;
    }

    try {
      await uploadCspBookingMutation.mutateAsync({
        lead_id: leadId,
        account_id: accountId,
        vendor_id: vendorId,
        assigned_to: userId,
        created_by: userId,
        site_photos: cspFiles,
      });

      toast.success("Current site photos uploaded successfully");
      setCspFiles([]);
      setCspUploadOpen(false);
      queryClient.invalidateQueries({
        queryKey: ["csp-booking-photos", vendorId, leadId],
      });
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to upload site photos"
      );
    }
  };

  if (isLoading || loading) return <p>booking details loading...</p>;

  // 🧩 Delete handler
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

  const handleMrpSubmit = (values: MrpFormValues) => {
    if (!vendorId || !userId) return;

    updateMrp(
      {
        vendorId,
        leadId,
        mrpValue: Number(values.mrpValue),
        updatedBy: userId,
      },
      {
        onSuccess: () => {
          toast.success("MRP value updated successfully.");
          setMrpModalOpen(false);
        },
        onError: (error: any) => {
          toast.error(
            error?.response?.data?.message || "Failed to update MRP value.",
          );
        },
      },
    );
  };

  const handleTotalProjectSubmit = (values: TotalProjectFormValues) => {
    if (!vendorId || !userId) return;

    updateTotalProject(
      {
        vendorId,
        leadId,
        totalProjectAmount: Number(values.totalProjectAmount),
        updatedBy: userId,
      },
      {
        onSuccess: () => {
          toast.success("Total project amount updated successfully.");
          setTotalProjectModalOpen(false);
        },
        onError: (error: any) => {
          toast.error(
            error?.response?.data?.message ||
              "Failed to update total project amount.",
          );
        },
      },
    );
  };

  const handleBookingAmountSubmit = (values: BookingAmountFormValues) => {
    if (!vendorId || !userId) return;

    updateBookingAmount(
      {
        vendorId,
        leadId,
        bookingAmount: Number(values.bookingAmount),
        updatedBy: userId,
      },
      {
        onSuccess: () => {
          toast.success("Booking amount updated successfully.");
          setBookingAmountModalOpen(false);
        },
        onError: (error: any) => {
          toast.error(
            error?.response?.data?.message ||
              "Failed to update booking amount.",
          );
        },
      },
    );
  };

  const handleReplaceInitialFilesChange = (files: File[]) => {
    if (files.length > 1) {
      setReplaceInitialFiles([files[0]]);
      toast.error("Only one file can be uploaded.");
      return;
    }
    setReplaceInitialFiles(files);
  };

  const handleReplaceInitialPdf = async () => {
    if (!replaceInitialDocId || !vendorId || !userId) return;
    if (replaceInitialFiles.length === 0) {
      toast.error("Please select a file to upload.");
      return;
    }

    const pdfFile = replaceInitialFiles[0];
    if (!documentMimeTypes.includes(pdfFile.type)) {
      toast.error("Only PDF or image files are allowed.");
      return;
    }

    try {
      await replaceInitialPdf({
        documentId: replaceInitialDocId,
        vendorId,
        userId,
        pdfFile,
      });
      toast.success("Document updated successfully.");
      setReplaceInitialFiles([]);
      setReplaceInitialDocId(null);
      queryClient.invalidateQueries({
        queryKey: ["siteMeasurementLeadDetails", leadId],
      });
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to replace document.",
      );
    }
  };

  const handleUploadDesigns = async (values: DesignsFormValues) => {
    if (!vendorId || !userId) return;

    try {
      await submitDesignsMutation.mutateAsync({
        files: Array.from(values.upload_pdf),
        vendorId,
        leadId,
        userId,
      });

      toast.success("Design files uploaded successfully!");
      queryClient.invalidateQueries({
        queryKey: ["getDesignsDoc", vendorId, leadId],
      });
      queryClient.invalidateQueries({
        queryKey: ["designingStageCounts", vendorId, leadId],
      });

      designsForm.reset();
      setDesignsModalOpen(false);
    } catch (error: any) {
      toast.error(error?.message || "Failed to upload design files.");
    }
  };

  const handleReassignConfirm = () => {
    if (!selectedSupervisor || !vendorId || !userId) return;

    reassignSupervisor(
      {
        vendorId,
        leadId,
        siteSupervisorId: selectedSupervisor.id,
        createdBy: userId,
      },
      {
        onSuccess: () => {
          toast.success("Site supervisor reassigned successfully.");
          queryClient.invalidateQueries({
            queryKey: ["bookingLead", leadId],
          });
          setReassignConfirmOpen(false);
          setReassignOpen(false);
          setSelectedSupervisor(null);
        },
        onError: (error: any) => {
          toast.error(
            error?.response?.data?.message || "Failed to reassign supervisor.",
          );
        },
      },
    );
  };



  // 🧩 Error Handling
  if (isError || error) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <Ban size={32} className="text-destructive" />
        </div>
        <p className="text-sm text-muted-foreground">
          Error loading booking details. Please try again.
        </p>
      </div>
    );
  }

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full bg-[#fff] dark:bg-[#0a0a0a]"
      >
        <div className="space-y-6">
          {/* -------- Top Summary Cards -------- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 pt-2">
            {/* Site Supervisor */}
            <div
              className="
    bg-white dark:bg-neutral-900
    border border-border rounded-2xl 
    p-5 flex items-center gap-4

  "
            >
              {/* Icon Container */}
              <div
                className="
      w-7 h-7 rounded-xl flex items-center justify-center
      bg-[#fff] dark:bg-[#0a0a0a] 
      text-gray-600 dark:text-gray-400
    "
              >
                <User className="w-6 h-6" />
              </div>

              {/* Text */}
              <div className="flex-1">
                <p className="text-sm text-muted-foreground font-medium">
                  Site Supervisor
                </p>

                <p className="text-xs font-semibold tracking-tight text-heading dark:text-neutral-100">
                  {leadData?.supervisors?.[0]?.userName || "Not Assigned"}
                </p>
              </div>

              {canEditBookingValues && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReassignOpen(true)}
                >
                  <UserPen />
                </Button>
              )}
            </div>

            {/* MRP Value */}
            <div
              className="
    bg-white dark:bg-neutral-900
    border border-border rounded-2xl 
    p-5 flex items-center justify-between gap-4
    transition-all duration-200 
    hover:ring-1 hover:ring-primary/30
  "
            >
              <div className="flex items-center gap-4">
                <div
                  className="
      w-7 h-7 rounded-xl flex items-center justify-center
      bg-[#fff] dark:bg-[#0a0a0a]
      text-gray-600 dark:text-gray-400
    "
                >
                  <IndianRupee className="w-6 h-6" />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    MRP Value
                  </p>

                  <p className="text-xl font-semibold tracking-tight text-heading dark:text-neutral-100">
                    ₹{leadData?.mrpValue?.toLocaleString("en-IN") || "0"}
                  </p>
                </div>
              </div>

              {canEditBookingValues && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMrpModalOpen(true)}
                >
                  <UserPen className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Total Booking Value */}
            <div
              className="
    bg-white dark:bg-neutral-900
    border border-border rounded-2xl 
    p-5 flex items-center justify-between gap-4
    transition-all duration-200 
    hover:ring-1 hover:ring-primary/30
  "
            >
              <div className="flex items-center gap-4">
                <div
                  className="
      w-7 h-7 rounded-xl flex items-center justify-center
      bg-[#fff] dark:bg-[#0a0a0a]
      text-gray-600 dark:text-gray-400
    "
                >
                  <CreditCard className="w-6 h-6" />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Total Booking Value
                  </p>

                  <p className="text-xl font-semibold tracking-tight text-heading dark:text-neutral-100">
                    ₹
                    {leadData?.finalBookingAmount?.toLocaleString("en-IN") ||
                      "0"}
                  </p>
                </div>
              </div>

              {canEditBookingValues && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTotalProjectModalOpen(true)}
                >
                  <UserPen className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Amount Received */}
            <div
              className="
    bg-white dark:bg-neutral-900
    border border-border rounded-2xl 
    p-5 flex items-center justify-between gap-4
    transition-all duration-200 
    hover:ring-1 hover:ring-primary/30
  "
            >
              <div className="flex items-center gap-4">
                <div
                  className="
      w-7 h-7 rounded-xl flex items-center justify-center
      bg-[#fff] dark:bg-[#0a0a0a]
      text-gray-600 dark:text-gray-400
    "
                >
                  <IndianRupee className="w-6 h-6" />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Booking Amount
                  </p>

                  <p className="text-xl font-semibold tracking-tight text-heading dark:text-neutral-100">
                    ₹{leadData?.bookingAmount?.toLocaleString("en-IN") || "0"}
                  </p>
                </div>
              </div>

              {canEditBookingValues && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setBookingAmountModalOpen(true)}
                >
                  <UserPen className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* -------- Booking Stage – Current Site Photos -------- */}
            {!cspLoading &&
              (bookingStagePhotos.length > 0 || canEditBookingValues) && (
              <div
                className="
      bg-white dark:bg-neutral-900
      rounded-2xl 
      border border-border 
      overflow-hidden
    "
              >
                <SectionHeader
                  title="Booking Stage – Current Site Photos"
                  icon={<Images size={20} />}
                />

                <motion.div className="p-6 bg-[#fff] dark:bg-[#0a0a0a]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {bookingStagePhotos.map((photo, index) => (
                      <ImageComponent
                        key={photo.id}
                        doc={{
                          id: photo.id,
                          doc_og_name: photo.originalName,
                          signedUrl: photo.signedUrl,
                          created_at: photo.createdAt,
                        }}
                        index={index}
                         onDelete={(id) => setConfirmDelete(Number(id))}
                        canDelete={canDelete}
                      />
                    ))}
                    {canEditBookingValues && (
                      <div
                        onClick={() => setCspUploadOpen(true)}
                        className="
            flex flex-col items-center justify-center 
            h-28 
            border-2 border-dashed border-border 
            rounded-xl cursor-pointer 
            hover:bg-mutedBg dark:hover:bg-neutral-800 
            transition-all duration-200
          "
                      >
                        <Plus size={26} className="text-muted-foreground mb-1" />
                        <span className="text-xs font-medium text-muted-foreground">
                          Add Photos
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            )}

          {/* -------- Design Remarks -------- */}
          <div className="space-y-3 mb-6">
            <h2 className="text-sm font-semibold tracking-tight">
              Design Remarks
            </h2>

            <div
              className="
      bg-[#fff] dark:bg-[#0a0a0a] 
      border border-border 
      rounded-xl 
      p-4 
      text-sm leading-relaxed 
      max-h-[250px] overflow-y-auto
    "
            >
              {leadData?.payments?.[0].text || "N/A"}
            </div>
          </div>

          {/* -------- Booking Documents Section -------- */}
          <div className="space-y-6 mb-6">
            {/* ----- Booking Documents Card ----- */}
            <div
              className="
      bg-[#fff] dark:bg-[#0a0a0a]
      rounded-2xl 
      border border-border 
      overflow-hidden
    "
            >
              {/* Header */}
              <div
                className="
        flex items-center justify-between 
        px-5 py-3 
        border-b border-border
        bg-[#fff] dark:bg-[#0a0a0a]
      "
              >
                <div className="flex items-center gap-2">
                  <Images size={20} className="text-muted-foreground" />
                  <h1 className="text-base font-semibold tracking-tight">
                    Booking Documents (Quotations + Design)
                  </h1>
                </div>
              </div>

              {/* Body */}
              <div className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {finalDocs.map((doc: DocumentBooking) => (
                    <DocumentCard
                      key={doc.id}
                      doc={doc}
                      canDelete={canDelete}
                      onDelete={(id) => setConfirmDelete(Number(id))}
                    />
                  ))}

                  {/* Add File Button */}
                  {canDelete && (
                    <div
                      onClick={() => setOpenFinalDocModal(true)}
                      className="
              flex flex-col items-center justify-center 
              min-h-[120px]
              border-2 border-dashed border-border/70 
              rounded-xl 
              cursor-pointer 
              hover:bg-mutedBg/40 dark:hover:bg-neutral-800/40 
              transition-all
            "
                    >
                      <Plus size={28} className="text-muted-foreground mb-1" />
                      <span className="text-xs font-medium text-muted-foreground">
                        Add File
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ----- Payment Proofs Card ----- */}
            <div
              className="
      bg-[#fff] dark:bg-[#0a0a0a]
      rounded-2xl 
      border border-border 
      overflow-hidden
    "
            >
              {/* Header */}
              <div
                className="
        flex items-center justify-between 
        px-5 py-3 
        border-b border-border 
        bg-[#fff] dark:bg-[#0a0a0a]
      "
              >
                <div className="flex items-center gap-2">
                  <Images size={20} className="text-muted-foreground" />
                  <h1 className="text-base font-semibold tracking-tight">
                    Booking Payment Proofs
                  </h1>
                </div>
              </div>

              {/* Body */}
              <div className="p-5">
                {bookingPaymentDocs.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bookingPaymentDocs.map((doc, index) => (
                      <ImageComponent
                        key={doc.id}
                        doc={{
                          id: doc.id,
                          doc_og_name: doc.originalName,
                          signedUrl: doc.signedUrl,
                        }}
                        index={index}
                        canDelete={canDelete}
                        onDelete={(id) => setConfirmDelete(Number(id))}
                      />
                    ))}
                  </div>
                ) : (
                  <div
                    className="
            flex flex-col items-center justify-center 
            py-12 
            text-center
          "
                  >
                    <Images size={40} className="text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No payment proofs uploaded yet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* -------- Consolidated Documents -------- */}
        {(initialMeasurementDocs.length > 0 ||
          initialCurrentSitePhotos.length > 0 ||
          bookingDoneIsmDocs.length > 0 ||
          bookingDoneIsmCurrentSite.length > 0 ||
          bookingDoneIsmPaymentImages.length > 0 ||
          designDocs.length > 0 ||
          bookingStagePhotos.length > 0) && (
          <div className="">
            <div
              className="
          bg-white dark:bg-neutral-900
          rounded-2xl
          border border-border
          overflow-hidden
        "
            >
              <SectionHeader
                title="Consolidated Documents"
                icon={<Folder size={20} />}
              />

              <div className="p-6 space-y-8">
                {(initialMeasurementDocs.length > 0 ||
                  initialCurrentSitePhotos.length > 0) && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText size={18} />
                      <h2 className="text-base font-semibold">
                        Initial Site Measurement
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
                      {initialCurrentSitePhotos.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">
                            Current Site Photos (
                            {initialCurrentSitePhotos.length})
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {initialCurrentSitePhotos.map(
                              (photo: any, index: any) => (
                                <ImageComponent
                                  key={photo.id}
                                  doc={{
                                    id: photo.id,
                                    doc_og_name: photo.originalName,
                                    signedUrl: photo.signedUrl,
                                    created_at: photo.uploadedAt,
                                  }}
                                  index={index}
                                  canDelete={canDelete}
                                   onDelete={(id) => setConfirmDelete(Number(id))}
                                />
                              ),
                            )}
                            {canEditBookingValues && (
                              <div
                                onClick={() => setInitialSitePhotosOpen(true)}
                                className="
                                    flex flex-col items-center justify-center
                                    h-28
                                    border-2 border-dashed border-border
                                    rounded-xl cursor-pointer
                                    hover:bg-mutedBg dark:hover:bg-neutral-800
                                    transition-all duration-200
                                  "
                              >
                                <Plus
                                  size={26}
                                  className="text-muted-foreground mb-1"
                                />
                                <span className="text-xs font-medium text-muted-foreground">
                                  Add Photos
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {initialMeasurementDocs.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">
                            Measurement Documents (
                            {initialMeasurementDocs.length})
                          </p>
                          <div className="space-y-3 w-fit">
                            {initialMeasurementDocs.map((doc: any) => (
                              <DocumentCard
                                key={doc.id}
                                doc={{
                                  id: doc.id,
                                  originalName: doc.originalName,
                                  signedUrl: doc.signedUrl,
                                  created_at: doc.uploadedAt,
                                }}
                               canDelete={canDelete}
                                onDelete={(id) => setConfirmDelete(Number(id))}
                              />
                            ))}
                            {canEditBookingValues && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (!initialMeasurementDocs.length) {
                                    toast.error(
                                      "No document available to replace.",
                                    );
                                    return;
                                  }
                                  setReplaceInitialDocId(
                                    initialMeasurementDocs[0].id,
                                  );
                                }}
                                className="
                                    flex items-center gap-2
                                    rounded-md border border-dashed border-border
                                    px-3 py-2 text-xs text-muted-foreground
                                    hover:bg-mutedBg dark:hover:bg-neutral-800
                                    transition
                                  "
                              >
                                <Plus size={14} />
                                Replace Document
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(bookingDoneIsmDocs.length > 0 ||
                  bookingDoneIsmCurrentSite.length > 0 ||
                  bookingDoneIsmPaymentImages.length > 0) && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText size={18} />
                      <h2 className="text-base font-semibold">
                        Booking Done – ISM
                      </h2>
                    </div>
                    <div className="space-y-4">
                      {bookingDoneIsmDocs.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">
                            Documents ({bookingDoneIsmDocs.length})
                          </p>
                          <div className="space-y-3 w-fit">
                            {bookingDoneIsmDocs.map((doc: any) => (
                              <DocumentCard
                                key={doc.id}
                                doc={{
                                  id: doc.id,
                                  originalName: doc.originalName,
                                  signedUrl: doc.signedUrl,
                                  created_at: doc.createdAt,
                                }}
                                canDelete={canDelete}
                                 onDelete={(id) => setConfirmDelete(Number(id))}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {bookingDoneIsmCurrentSite.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">
                            Current Site Photos (
                            {bookingDoneIsmCurrentSite.length})
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {bookingDoneIsmCurrentSite.map(
                              (photo: any, index: any) => (
                                <ImageComponent
                                  key={photo.id}
                                  doc={{
                                    id: photo.id,
                                    doc_og_name: photo.originalName,
                                    signedUrl: photo.signedUrl,
                                    created_at: photo.createdAt,
                                  }}
                                  index={index}
                                  canDelete={canDelete}
                                   onDelete={(id) => setConfirmDelete(Number(id))}
                                />
                              ),
                            )}
                          </div>
                        </div>
                      )}

                      {bookingDoneIsmPaymentImages.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">
                            Payment Images ({bookingDoneIsmPaymentImages.length}
                            )
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {bookingDoneIsmPaymentImages.map(
                              (photo: any, index: any) => (
                                <ImageComponent
                                  key={photo.id}
                                  doc={{
                                    id: photo.id,
                                    doc_og_name: photo.originalName,
                                    signedUrl: photo.signedUrl,
                                    created_at: photo.createdAt,
                                  }}
                                  index={index}
                                  canDelete={canDelete}
                                   onDelete={(id) => setConfirmDelete(Number(id))}
                                />
                              ),
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {designDocs.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText size={18} />
                      <h2 className="text-base font-semibold">
                        Design Documents ({designDocs.length})
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {designDocs.map((doc: any) => (
                        <DocumentCard
                          key={doc.id}
                          doc={{
                            id: doc.id,
                            originalName: doc.doc_og_name ?? doc.originalName,
                            signedUrl:
                              doc.signedUrl ??
                              doc.signed_url ??
                              doc.doc_sys_name,
                            created_at: doc.created_at,
                          }}
                          canDelete={canDelete}
                           onDelete={(id) => setConfirmDelete(Number(id))}
                        />
                      ))}
                      {canEditBookingValues && (
                        <button
                          type="button"
                          onClick={() => setDesignsModalOpen(true)}
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
                            Upload Designs
                          </p>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                  {bookingStagePhotos.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Images size={18} />
                        <h2 className="text-base font-semibold">
                          Final Measurement Assignment Docs (
                          {bookingStagePhotos.length})
                        </h2>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {bookingStagePhotos.map((photo, index) => (
                          <ImageComponent
                            key={photo.id}
                            doc={{
                              id: photo.id,
                              doc_og_name: photo.originalName,
                              signedUrl: photo.signedUrl,
                              created_at: photo.createdAt,
                            }}
                            index={index}
                            canDelete={canDelete}
                             onDelete={(id) => setConfirmDelete(Number(id))}
                          />
                        ))}
                        {canEditBookingValues && (
                          <div
                            onClick={() => setCspUploadOpen(true)}
                            className="
                              flex flex-col items-center justify-center
                              h-28
                              border-2 border-dashed border-border
                              rounded-xl cursor-pointer
                              hover:bg-mutedBg dark:hover:bg-neutral-800
                              transition-all duration-200
                            "
                          >
                            <Plus size={26} className="text-muted-foreground mb-1" />
                            <span className="text-xs font-medium text-muted-foreground">
                              Add Photos
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}

        {/* -------- Upload Modal -------- */}
        <UploadFinalDoc
          open={openFinalDocModal}
          onOpenChange={setOpenFinalDocModal}
          leadId={leadId}
          accountId={accountId}
        />

        <AddCurrentSitePhotos
          open={initialSitePhotosOpen}
          onOpenChange={setInitialSitePhotosOpen}
          data={{
            accountId,
            id: leadId,
            paymentId: initialPaymentInfo?.id ?? null,
          }}
        />

        <BaseModal
          open={cspUploadOpen}
          onOpenChange={(open) => {
            if (!open) {
              setCspUploadOpen(false);
              setCspFiles([]);
            }
          }}
          title="Add Booking Stage Site Photos"
          description="Upload current site photos for the booking stage."
          size="md"
        >
          <div className="p-5 space-y-4">
            <FileUploadField
              value={cspFiles}
              onChange={setCspFiles}
              accept="image/*,.heic,.heif,.avif,.webp,.bmp,.tif,.tiff,.svg,.jfif"
              multiple
              maxFiles={10}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCspUploadOpen(false);
                  setCspFiles([]);
                }}
                disabled={uploadCspBookingMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleCspUpload}
                disabled={uploadCspBookingMutation.isPending}
              >
                {uploadCspBookingMutation.isPending ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </div>
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

        <BaseModal
          open={!!replaceInitialDocId}
          onOpenChange={(open) => {
            if (!open) {
              setReplaceInitialDocId(null);
              setReplaceInitialFiles([]);
            }
          }}
          title="Replace Measurement Document"
          description="Upload a new PDF or image to replace the existing document."
          size="md"
        >
          <div className="p-5 space-y-4">
            <FileUploadField
              value={replaceInitialFiles}
              onChange={handleReplaceInitialFilesChange}
              accept={documentAccept}
              multiple={false}
              maxFiles={1}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setReplaceInitialDocId(null);
                  setReplaceInitialFiles([]);
                }}
                disabled={replacingInitialPdf}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleReplaceInitialPdf}
                disabled={replacingInitialPdf}
              >
                {replacingInitialPdf ? "Updating..." : "Update"}
              </Button>
            </div>
          </div>
        </BaseModal>

        <BaseModal
          open={designsModalOpen}
          onOpenChange={setDesignsModalOpen}
          title="Add Designs"
          description="Upload design files in supported CAD or document formats."
          size="smd"
        >
          <Form {...designsForm}>
            <form
              onSubmit={designsForm.handleSubmit(handleUploadDesigns)}
              className="space-y-6 p-5"
            >
              <FormField
                control={designsForm.control}
                name="upload_pdf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Upload Design Files</FormLabel>
                    <FormControl>
                      <DocumentsUploader
                        value={field.value}
                        onChange={field.onChange}
                        accept=".pdf,.pyo,.pytha,.dwg,.dxf,.stl,.step,.stp,.iges,.igs,.3ds,.obj,.skp,.sldprt,.sldasm,.prt,.catpart,.catproduct,.zip"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDesignsModalOpen(false)}
                  disabled={submitDesignsMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitDesignsMutation.isPending}
                >
                  {submitDesignsMutation.isPending
                    ? "Uploading..."
                    : "Submit Designs"}
                </Button>
              </div>
            </form>
          </Form>
        </BaseModal>
      </motion.div>

      <Dialog open={reassignOpen} onOpenChange={setReassignOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="space-y-0">
            <h3 className="text-lg font-semibold">Reassign Site Supervisor</h3>
            <p className="text-sm text-muted-foreground">
              Select a site supervisor to reassign this lead.
            </p>
          </div>

          <Command>
            <CommandInput placeholder="Search supervisors..." />
            <CommandList>
              <CommandEmpty>
                {loadingSupervisors
                  ? "Loading supervisors..."
                  : "No supervisors found."}
              </CommandEmpty>
              <CommandGroup>
                {siteSupervisors.map((supervisor: any) => (
                  <CommandItem
                    key={supervisor.id}
                    onSelect={() => {
                      setSelectedSupervisor({
                        id: supervisor.id,
                        user_name: supervisor.user_name,
                      });
                      setReassignConfirmOpen(true);
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {supervisor.user_name}
                      </span>
                      {supervisor.user_email && (
                        <span className="text-xs text-muted-foreground">
                          {supervisor.user_email}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={reassignConfirmOpen}
        onOpenChange={setReassignConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Reassign</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedSupervisor
                ? `Reassign to ${selectedSupervisor.user_name}?`
                : "Reassign this lead to the selected supervisor?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reassigning}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReassignConfirm}
              disabled={reassigning}
            >
              {reassigning ? "Reassigning..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={mrpModalOpen} onOpenChange={setMrpModalOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Update MRP Value</h3>
            <p className="text-sm text-muted-foreground">
              Enter the new MRP amount for this lead.
            </p>
          </div>

          <Form {...mrpForm}>
            <form
              onSubmit={mrpForm.handleSubmit(handleMrpSubmit)}
              className="space-y-4"
            >
              <FormField
                control={mrpForm.control}
                name="mrpValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MRP Value</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={
                          field.value === "" ? undefined : Number(field.value)
                        }
                        onChange={(value) =>
                          field.onChange(
                            value !== undefined ? String(value) : "",
                          )
                        }
                        placeholder="Enter MRP value"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMrpModalOpen(false)}
                  disabled={updatingMrp}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updatingMrp}>
                  {updatingMrp ? "Updating..." : "Update"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={totalProjectModalOpen}
        onOpenChange={setTotalProjectModalOpen}
      >
        <DialogContent className="sm:max-w-md">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              Update Total Booking Value
            </h3>
            <p className="text-sm text-muted-foreground">
              Enter the new total booking value for this lead.
            </p>
          </div>

          <Form {...totalProjectForm}>
            <form
              onSubmit={totalProjectForm.handleSubmit(handleTotalProjectSubmit)}
              className="space-y-4"
            >
              <FormField
                control={totalProjectForm.control}
                name="totalProjectAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Booking Value</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={
                          field.value === "" ? undefined : Number(field.value)
                        }
                        onChange={(value) =>
                          field.onChange(
                            value !== undefined ? String(value) : "",
                          )
                        }
                        placeholder="Enter total booking value"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTotalProjectModalOpen(false)}
                  disabled={updatingTotalProject}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updatingTotalProject}>
                  {updatingTotalProject ? "Updating..." : "Update"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={bookingAmountModalOpen}
        onOpenChange={setBookingAmountModalOpen}
      >
        <DialogContent className="sm:max-w-md">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Update Booking Amount</h3>
            <p className="text-sm text-muted-foreground">
              Enter the new booking amount for this lead.
            </p>
          </div>

          <Form {...bookingAmountForm}>
            <form
              onSubmit={bookingAmountForm.handleSubmit(
                handleBookingAmountSubmit,
              )}
              className="space-y-4"
            >
              <FormField
                control={bookingAmountForm.control}
                name="bookingAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Booking Amount</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={
                          field.value === "" ? undefined : Number(field.value)
                        }
                        onChange={(value) =>
                          field.onChange(
                            value !== undefined ? String(value) : "",
                          )
                        }
                        placeholder="Enter booking amount"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBookingAmountModalOpen(false)}
                  disabled={updatingBookingAmount}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updatingBookingAmount}>
                  {updatingBookingAmount ? "Updating..." : "Update"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BookingLeadsDetails;
