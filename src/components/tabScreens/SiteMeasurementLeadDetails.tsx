"use client";

import { useAppSelector } from "@/redux/store";
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

export default function SiteMeasurementLeadDetails({
  lead,
  formatDateTime,
}: OpenLeadDetailsProps) {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);

  if (!lead) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <p className="text-gray-500">No lead details found.</p>
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
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-md font-semibold text-gray-900">Lead Details</h2>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            {formatDateTime(lead.created_at)}
          </div>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4"></div>
    </motion.div>
  );
}
