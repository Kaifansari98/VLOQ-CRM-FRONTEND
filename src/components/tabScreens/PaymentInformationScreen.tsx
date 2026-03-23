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

export default function PaymentInformation({
  accountId,
  leadIdProps,
}: PaymentInformationProps) {
  const { lead } = useParams();
  const leadIdNum = lead ? Number(lead) : null;
  const finalLeadId = leadIdNum || leadIdProps;

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
      className="
        flex w-full gap-4
        flex-col-reverse
        md:flex-row
        items-start
      "
    >
      {/* LEFT : Payment Logs */}
      <div className="w-full md:flex-1">
        <PaymentLogs leadIdProps={finalLeadId} />
      </div>

      {/* RIGHT : Finance Summary */}
      <div className="w-full shrink-0 md:flex-1">
        <ProjectFinanceSummary leadId={finalLeadId} accountId={accountId} />
      </div>
    </motion.div>
  );
}
