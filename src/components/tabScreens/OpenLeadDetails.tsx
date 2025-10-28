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
} from "lucide-react";
import { formatDateTime } from "../utils/privileges";
import { useLeadById } from "@/hooks/useLeadsQueries";
import { useAppSelector } from "@/redux/store";
import { Trash2 } from "lucide-react";
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

  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);
  const { mutate: deleteDocument, isPending: deleting } = useDeleteDocument();

  const { data: leadStatusData } = useLeadStatus(leadId, vendorId);

  const currentStageTag = leadStatusData?.status_tag;

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

  const InfoField = ({ label, value, icon: Icon }: any) => (
    <motion.div variants={itemVariants} className="space-y-1">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
        <label className="text-sm font-medium ">{label}</label>
      </div>
      <p className="pl-6">{value || "—"}</p>
    </motion.div>
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="border rounded-lg w-full h-full overflow-y-scroll"
    >
      {/* Header */}
      <div className="border-b px-6 py-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-md font-semibold ">Lead Details</h2>
          <div className="flex items-center gap-2 text-sm ">
            <Calendar className="w-4 h-4" />
            {formatDateTime(lead.created_at)}
          </div>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        {/* Contact Information */}
        <motion.section variants={itemVariants}>
          <h3 className="text-base font-semibold mb-4 pb-2 border-b ">
            Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoField
              label="Full Name"
              value={`${lead.firstname || ""} ${lead.lastname || ""}`.trim()}
              icon={User}
            />
            <InfoField label="Email Address" value={lead.email} icon={Mail} />
            <InfoField
              label="Phone Number"
              value={
                lead.country_code && lead.contact_no
                  ? `${lead.country_code} ${lead.contact_no}`
                  : lead.contact_no
              }
              icon={Phone}
            />
            {/* ✅ Special handling for map link */}
            <motion.div variants={itemVariants} className="space-y-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <label className="text-sm font-medium">
                  Site Google Maps Link
                </label>
              </div>
              {lead?.site_map_link ? (
                <a
                  href={lead.site_map_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pl-6 font-medium underline"
                >
                  View on Google Maps
                </a>
              ) : (
                <p className="pl-6">No map link provided</p>
              )}
            </motion.div>
            <InfoField
              label="Site Address"
              value={`${lead.site_address || "No address provided"}`.trim()}
              icon={MapPin}
            />
          </div>
        </motion.section>
        {/* Project Details */}
        <motion.section variants={itemVariants}>
          <h3 className="text-base font-semibold  mb-4 pb-2 border-b ">
            Project Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoField
              label="Architect Name"
              value={lead.archetech_name}
              icon={User}
            />
            <InfoField
              label="Site Type"
              value={lead.siteType?.type}
              icon={Building}
            />
            <InfoField label="Source" value={lead.source?.type} icon={MapPin} />
          </div>
        </motion.section>
        {/* Product Information */}
        <motion.section variants={itemVariants}>
          <h3 className="text-base font-semibold mb-4 pb-2 border-b ">
            Product Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoField
              label="Product Structures"
              value={lead.leadProductStructureMapping
                ?.map((ps: any) => ps.productStructure?.type)
                .filter(Boolean)
                .join(", ")}
              icon={Package}
            />
            <InfoField
              label="Product Types"
              value={lead.productMappings
                ?.map((pm: any) => pm.productType?.type)
                .filter(Boolean)
                .join(", ")}
              icon={Package}
            />
          </div>
        </motion.section>
        {/* Additional Information */}
        <motion.section variants={itemVariants}>
          <h3 className="text-base font-semibold  mb-4 pb-2 border-b ">
            Additional Information
          </h3>
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 " />
                <label className="text-sm font-medium ">Design Remarks</label>
              </div>
              <div className=" border rounded-md p-2 ml-6">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {lead.designer_remark || "No remarks provided"}
                </p>
              </div>
            </div>
          </div>
        </motion.section>
        {/* Site Photos */}
        <motion.section variants={itemVariants}>
          <h3 className="text-base font-semibold mb-4 pb-2 border-b">
            Site Photos
          </h3>

          {lead.documents && lead.documents.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {lead.documents.map((doc: any) =>
                doc.signedUrl ? (
                  <motion.div
                    key={doc.id}
                    variants={itemVariants}
                    className="relative border rounded-lg overflow-hidden group bg-gray-50 hover:shadow-lg transition-all duration-300"
                  >
                    {/* Image Container with Aspect Ratio */}
                    <div className="relative w-full aspect-square overflow-hidden bg-gray-100">
                      <img
                        src={doc.signedUrl}
                        alt={doc.doc_og_name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />

                      {/* Gradient Overlay on Hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Delete Button - Shows on hover */}
                      {(currentStageTag === "Type 1" ||
                        userType === "admin" ||
                        userType === "super-admin") && (
                        <button
                          onClick={() => setConfirmDelete(doc.id)}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-lg p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform hover:scale-110"
                          title="Delete Document"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}

                      {/* View Full Size Button - Shows on hover */}
                      <a
                        href={doc.signedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute bottom-2 right-2 bg-white/90 hover:bg-white text-gray-800 rounded-lg px-3 py-1.5 text-xs font-medium shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-1"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                        View
                      </a>
                    </div>

                    {/* File Name */}
                    <div className="p-3 bg-white">
                      <p
                        className="text-xs text-gray-700 font-medium truncate"
                        title={doc.doc_og_name}
                      >
                        {doc.doc_og_name}
                      </p>
                    </div>
                  </motion.div>
                ) : null
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
              <svg
                className="w-12 h-12 text-gray-400 mb-3"
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
              <p className="text-sm text-gray-600 font-medium">
                No site photos uploaded
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Photos will appear here once uploaded
              </p>
            </div>
          )}
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
    </motion.div>
  );
}
