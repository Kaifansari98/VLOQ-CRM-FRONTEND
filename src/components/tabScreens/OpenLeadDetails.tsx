"use client";

import { motion } from "framer-motion";
import { Calendar, Mail, Phone, User, Building, Package, MapPin, MessageSquare } from "lucide-react";

type OpenLeadDetailsProps = {
  lead: any;
  formatDateTime: (dateString?: string) => string;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2 }
  }
};

export default function OpenLeadDetails({ lead, formatDateTime }: OpenLeadDetailsProps) {
  if (!lead) {
    return (
      <div className="border border-gray-200 rounded-lg p-6">
        <p>No lead details found.</p>
      </div>
    );
  }

  const InfoField = ({ label, value, icon: Icon }: any) => (
    <motion.div variants={itemVariants} className="space-y-1">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
        <label className="text-sm font-medium text-gray-700">{label}</label>
      </div>
      <p className="text-gray-900 pl-6">{value || "—"}</p>
    </motion.div>
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="bg-white border border-gray-200 rounded-lg overflow-hidden"
    >
      {/* Header */}
      <div className="border-b px-6 py-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-md font-semibold text-gray-900">Lead Details</h2>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            {formatDateTime(lead.created_at)}
          </div>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        {/* Contact Information */}
        <motion.section variants={itemVariants}>
          <h3 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
            Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoField 
              label="Full Name" 
              value={`${lead.firstname || ''} ${lead.lastname || ''}`.trim()} 
              icon={User}
            />
            <InfoField 
              label="Email Address" 
              value={lead.email} 
              icon={Mail}
            />
            <InfoField 
              label="Phone Number" 
              value={lead.country_code && lead.contact_no ? `${lead.country_code} ${lead.contact_no}` : lead.contact_no} 
              icon={Phone}
            />
            <InfoField 
              label="Billing Name" 
              value={lead.billing_name} 
              icon={Building}
            />
          </div>
        </motion.section>

        {/* Project Details */}
        <motion.section variants={itemVariants}>
          <h3 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
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
            <InfoField 
              label="Source" 
              value={lead.source?.type} 
              icon={MapPin}
            />
            <InfoField 
              label="Priority Level" 
              value={lead.priority} 
              icon={Package}
            />
          </div>
        </motion.section>

        {/* Product Information */}
        <motion.section variants={itemVariants}>
          <h3 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
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
          <h3 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
            Additional Information
          </h3>
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-gray-400" />
                <label className="text-sm font-medium text-gray-700">Design Remarks</label>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4 ml-6">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {lead.designer_remark || "No remarks provided"}
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-gray-400" />
                <label className="text-sm font-medium text-gray-700">Site Address</label>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4 ml-6">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {lead.site_address || "No address provided"}
                </p>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
}