"use client";

import { motion } from "framer-motion";
import ProjectFinanceSummary from "../payment-screen/ProjectFinanceSummary";
import PaymentLogs from "../payment-screen/PaymentLogs";
import { useParams } from "next/navigation";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

interface PaymentInformationProps {
  accountId: number;
  leadIdProps?: number;
}

// Wrapper
export default function PaymentInformation({
  accountId,
  leadIdProps,
}: PaymentInformationProps) {
  const { lead } = useParams();
  const leadIdNum = lead ? Number(lead) : null;

  // 🔥 Priority-based leadId resolution
  const finalLeadId = leadIdNum || leadIdProps;

  // ⛔ If no leadId, do not render UI that depends on it
  if (!finalLeadId) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        Lead ID not available.
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 lg:grid-cols-2 gap-2 pb-4 max-h-[100vh]"
    >
      <PaymentLogs leadIdProps={finalLeadId} />

      <ProjectFinanceSummary leadId={finalLeadId} accountId={accountId} />
    </motion.div>
  );
}
