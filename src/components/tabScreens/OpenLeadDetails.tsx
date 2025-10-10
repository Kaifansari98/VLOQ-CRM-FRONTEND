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
  const { data, isLoading } = useLeadById(leadId, vendorId, userId);
  const lead = data?.data?.lead;
  console.log("Lead Details: ", lead);

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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {lead.documents.map((doc: any) =>
                doc.signedUrl ? (
                  <div
                    key={doc.id}
                    className="border rounded-md overflow-hidden"
                  >
                    <img
                      src={doc.signedUrl}
                      alt={doc.doc_og_name}
                      className="w-full h-40 object-cover"
                    />
                    <p className="text-xs px-2 py-1 truncate">
                      {doc.doc_og_name}
                    </p>
                  </div>
                ) : null
              )}
            </div>
          ) : (
            <p>No site photos uploaded.</p>
          )}
        </motion.section>
      </div>
    </motion.div>
  );
}
