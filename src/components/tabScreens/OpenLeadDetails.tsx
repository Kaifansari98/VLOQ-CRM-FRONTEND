"use client";

import { motion } from "framer-motion";
import {
  Calendar,
  Mail,
  Phone,
  User,
  Building,
  Package,
  MapPin,
  MessageSquare,
  ImagePlus,
} from "lucide-react";
import { formatDateTime } from "../utils/privileges";
import { useLeadById, useUploadMoreSitePhotos } from "@/hooks/useLeadsQueries";
import { useAppSelector } from "@/redux/store";
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
import { useState } from "react";
import { useLeadStatus } from "@/hooks/designing-stage/designing-leads-hooks";
import { ImageComponent } from "../utils/ImageCard";
import { Button } from "@/components/ui/button";
import BaseModal from "@/components/utils/baseModal";
import { FileUploadField } from "@/components/custom/file-upload";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

type OpenLeadDetailsProps = {
  leadId: number;
};

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

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2 },
  },
};

export default function OpenLeadDetails({ leadId }: OpenLeadDetailsProps) {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type
  );

  const { data, isLoading } = useLeadById(leadId, vendorId, userId);
  const lead = data?.data?.lead;
  console.log("Data", lead);

  const leadStage = lead?.statusType?.type;
  console.log("Lead Stage In Lead Details: ", leadStage);

  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);
  const { mutate: deleteDocument, isPending: deleting } = useDeleteDocument();
  const { mutateAsync: uploadMoreSitePhotos, isPending: uploading } =
    useUploadMoreSitePhotos();
  const queryClient = useQueryClient();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);

  const { data: leadStatusData } = useLeadStatus(leadId, vendorId);

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

  if (!lead) {
    return (
      <div className="border rounded-lg p-6">
        <p>No lead details found.</p>
      </div>
    );
  }

  const canUploadSitePhotos =
    userType === "admin" ||
    userType === "super-admin" ||
    (userType === "sales-executive" && leadStage === "open");

  const handleUploadFilesChange = (files: File[]) => {
    if (files.length > 10) {
      toast.error("You can upload up to 10 site photos.");
      setUploadFiles(files.slice(0, 10));
      return;
    }
    setUploadFiles(files);
  };

  const handleUploadMoreSitePhotos = async () => {
    if (!vendorId || !userId) {
      toast.error("Vendor or user information is missing.");
      return;
    }

    if (uploadFiles.length === 0) {
      toast.error("Please select at least one photo to upload.");
      return;
    }

    try {
      await uploadMoreSitePhotos({
        vendorId,
        leadId,
        createdBy: userId,
        files: uploadFiles,
      });

      toast.success("Site photos uploaded successfully!");
      setUploadFiles([]);
      setUploadOpen(false);
      queryClient.invalidateQueries({
        queryKey: ["lead", leadId, vendorId, userId],
      });
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to upload site photos."
      );
    }
  };

  const SectionCard = ({ title, children }: any) => (
    <motion.section
      variants={itemVariants}
      className="
  bg-[#fff] dark:bg-[#0a0a0a]
  rounded-2xl 
  border border-border 
  shadow-soft 
  p-6 space-y-6
"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      </div>

      {children}
    </motion.section>
  );

  const InfoRow = ({ icon: Icon, label, value }: any) => (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-sm text-subtle dark:text-neutral-400">
        {Icon && <Icon className="w-4 h-4 stroke-[1.5]" />}
        {label}
      </div>
      <div className="text-[15px] font-medium text-heading dark:text-neutral-200 pl-6">
        {value || "—"}
      </div>
    </div>
  );

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="
  rounded-lg 
  w-full h-full   
  bg-[#fff] dark:bg-[#0a0a0a]
"
      >
        {/* Header */}
        <div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between  ">
            <div>
              <h2 className="text-lg font-semibold ">Lead Details</h2>
              <p className="text-sm text-gray-500 dark:text-neutral-400">
                All the Lead Related Details Which has been filled during
                onboard.
              </p>
            </div>
            <div className="flex flex-col">
              <div className="text-xs text-gray-500">Created At</div>
              <div className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                <Calendar className="w-4 h-4" />
                {formatDateTime(lead.created_at)}
              </div>
            </div>
          </div>
        </div>

        <div className="py-4 space-y-4">
          {/* CONTACT INFORMATION */}
          <SectionCard title="Contact Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoRow
                icon={User}
                label="Full Name"
                value={`${lead.firstname || ""} ${lead.lastname || ""}`.trim()}
              />
              <InfoRow icon={Mail} label="Email Address" value={lead.email} />
              {/* Phone */}
              <InfoRow
                icon={Phone}
                label="Phone Number"
                value={
                  lead.country_code && lead.contact_no
                    ? `${lead.country_code} ${lead.contact_no}`
                    : lead.contact_no
                }
              />

              {/* Maps link (same row as phone) */}
              <div>
                <div className="flex items-center gap-2 text-sm text-subtle mb-1">
                  <MapPin className="w-4 h-4 stroke-[1.5]" />
                  Site Google Maps Link
                </div>

                {lead?.site_map_link ? (
                  <a
                    href={lead.site_map_link}
                    target="_blank"
                    className="
        pl-6 underline 
        font-medium text-heading dark:text-neutral-200 
        hover:opacity-80
      "
                  >
                    View on Google Maps →
                  </a>
                ) : (
                  <p className="pl-6 text-subtle">No map link provided</p>
                )}
              </div>
            </div>

            {/* Site Address below full width */}
            <div className="md:col-span-2">
              <InfoRow
                icon={MapPin}
                label="Site Address"
                value={lead.site_address || "No address provided"}
              />
            </div>
          </SectionCard>

          {/* PROJECT DETAILS */}
          <SectionCard title="Project Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoRow
                icon={User}
                label="Architect Name"
                value={lead.archetech_name}
              />
              <InfoRow
                icon={Building}
                label="Site Type"
                value={lead.siteType?.type}
              />
              <InfoRow icon={MapPin} label="Source" value={lead.source?.type} />
            </div>
          </SectionCard>

          {/* PRODUCT INFORMATION */}
          <SectionCard title="Product Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoRow
                icon={Package}
                label="Product Structures"
                value={lead.leadProductStructureMapping
                  ?.map((ps: any) => ps.productStructure?.type)
                  ?.filter(Boolean)
                  ?.join(", ")}
              />

              <InfoRow
                icon={Package}
                label="Product Types"
                value={lead.productMappings
                  ?.map((pm: any) => pm.productType?.type)
                  ?.filter(Boolean)
                  ?.join(", ")}
              />
            </div>
          </SectionCard>

          {/* ADDITIONAL INFORMATION */}
          <SectionCard title="Additional Information">
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-subtle mb-2">
                  <MessageSquare className="w-4 h-4" />
                  Design Remarks
                </div>

                <div
                  className="
  bg-[#fff] dark:bg-[#0a0a0a] 
  border border-border 
  rounded-xl p-4 ml-6
"
                >
                  <p className="text-[15px] leading-relaxed text-heading dark:text-neutral-200">
                    {lead.designer_remark || "No remarks provided"}
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Site Photos */}

          <motion.section
            variants={itemVariants}
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
  flex items-center justify-between 
  px-5 py-3 
  border-b border-border
  bg-[#fff] dark:bg-[#0a0a0a]
"
            >
              <div className="flex flex-col items-start">
                <h1 className="text-lg font-semibold tracking-tight">
                  Current Site Photos
                </h1>
                <p className="text-xs text-gray-500 ">
                  All the Lead Related Documents Which has been submitted during
                  onboard.
                </p>
              </div>
{/* 
              <Button
                variant="outline"
                size="sm"
                className="
  rounded-lg 
  border-border 
  hover:bg-mutedBg dark:hover:bg-neutral-800 
  dark:border-neutral-700
  transition
"
              >
                <RefreshCcw size={15} />
                Refresh
              </Button> */}
            </div>

            {/* Body */}
            <motion.div variants={itemVariants} className="p-6">
              {lead.documents && lead.documents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {lead.documents.map((doc: any, index: number) =>
                    doc.signedUrl ? (
                      <motion.div key={doc.id} variants={itemVariants}>
                        <ImageComponent
                          key={doc.id}
                          doc={doc}
                          index={index}
                          canDelete={
                            userType === "admin" ||
                            userType === "super-admin" ||
                            (userType === "sales-executive" &&
                              leadStage === "open")
                          }
                          onDelete={(id) => setConfirmDelete(Number(id))}
                        />
                      </motion.div>
                    ) : null
                  )}
                  {canUploadSitePhotos && (
                    <button
                      type="button"
                      onClick={() => setUploadOpen(true)}
                      className="
                        flex flex-col items-center justify-center
                        border border-dashed border-border/70
                        rounded-xl p-6 text-center
                        bg-mutedBg/40 dark:bg-neutral-800/40
                        hover:bg-muted/40 dark:hover:bg-neutral-800/60
                        transition
                        w-full h-full
                      "
                    >
                      <ImagePlus className="w-6 h-6 text-muted-foreground mb-1" />
                      <p className="text-xs font-medium text-muted-foreground">
                        Add more images
                      </p>
                      <p className="text-xs text-subtle">
                        Upload up to 10 photos
                      </p>
                    </button>
                  )}
                </div>
              ) : (
                <div
                  className="
                flex flex-col items-center justify-center 
                py-14 px-6 
                border border-dashed border-border/60 
                rounded-xl 
                bg-mutedBg/40 dark:bg-neutral-800/40
                dark:border-neutral-700/40
              "
                >
                  <svg
                    className="w-12 h-12 text-muted-foreground dark:text-neutral-500 mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>

                  <p className="text-sm font-medium text-muted-foreground dark:text-neutral-400">
                    No site photos uploaded
                  </p>

                  <p className="text-xs text-subtle dark:text-neutral-500 mt-1 tracking-tight">
                    Photos will appear here once uploaded
                  </p>
                  {canUploadSitePhotos && (
                    <button
                      type="button"
                      onClick={() => setUploadOpen(true)}
                      className="
                        mt-4 inline-flex items-center gap-2
                        rounded-lg border border-border px-3 py-2
                        text-xs font-medium text-muted-foreground
                        hover:bg-mutedBg/60 dark:hover:bg-neutral-800/60
                        transition
                      "
                    >
                      <ImagePlus className="w-4 h-4" />
                      Add more images
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </motion.section>

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
                <AlertDialogCancel disabled={deleting}>
                  Cancel
                </AlertDialogCancel>
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
            open={uploadOpen}
            onOpenChange={setUploadOpen}
            title="Add More Site Photos"
            description="Upload up to 10 current site photos."
            size="md"
          >
            <div className="p-5 space-y-4">
              <FileUploadField
                value={uploadFiles}
                onChange={handleUploadFilesChange}
                accept=".jpg,.jpeg,.png"
                multiple
                maxFiles={10}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setUploadOpen(false)}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleUploadMoreSitePhotos}
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </div>
            </div>
          </BaseModal>
        </div>
      </motion.div>
    </>
  );
}
