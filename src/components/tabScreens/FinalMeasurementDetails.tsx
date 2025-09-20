"use client";

import { useBookingLeadById } from "@/hooks/booking-stage/use-booking";
import { useFinalMeasurementLeadById } from "@/hooks/final-measurement/use-final-measurement";
import { useAppSelector } from "@/redux/store";
import { motion } from "framer-motion";

type Props = {
  lead: any;
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

export default function FinalMeasurementDeatils({ lead }: Props) {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const leadId = lead.leadId;

  const { data: LeadDetails } = useFinalMeasurementLeadById(vendorId!, leadId!);

  console.log("Lead Details: ", LeadDetails);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="rounded-lg border h-full overflow-hidden"
    >
      <div className="p-6 space-y-6">
        <h1>Lead Id: {`${leadId}`}</h1>
      </div>
    </motion.div>
  );
}
